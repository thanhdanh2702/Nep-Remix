import type { Request, Response } from 'express';
import { z } from 'zod';
import { ai } from './gemini-client.ts';
import { aiCache } from './cache.ts';
import { AI_MODELS } from '../../config/ai-models.ts';
import { sanitizeUserText, toFallbackReason, UNTRUSTED_DATA_NOTICE } from './sanitize.ts';

// ----------------------------------------------------
// 1. Zod Request & Response Schemas
// ----------------------------------------------------

export const LookbookRequestSchema = z.object({
  garmentId: z.string().default('ao-ngu-than-tay-chen'),
  garmentName: z.string().default('Áo ngũ thân tay chẽn'),
  silhouette: z.string().default('ngu_than_tay_chen'),
  colorPalette: z
    .array(z.string())
    .length(4)
    .catch(['#E6A1B0', '#C25975', '#802D45', '#3A0D1B']),
  accessoryNames: z.array(z.string()).default([]),
  eventTitle: z.string().default('Chúc Tết Đầu Xuân'),
  stream: z.boolean().optional(),
  singleAngle: z.enum(['front', 'three_quarter', 'back', 'close_up']).optional()
});
export type LookbookRequest = z.infer<typeof LookbookRequestSchema>;

export interface LookbookImage {
  angle: 'front' | 'three_quarter' | 'back' | 'close_up';
  angleLabel: string;
  imageUrl: string;
}

export interface LookbookSuccessResponse {
  images: LookbookImage[];
  watermark: string;
  disclosure: string;
  story?: string;
}

export interface LookbookFallbackResponse {
  fallbackType: 'pixel_sketch';
  message: string;
  garmentId: string;
  garmentName: string;
  colorPalette: string[];
  watermark: string;
}

export const ANGLES: Array<{
  id: 'front' | 'three_quarter' | 'back' | 'close_up';
  label: string;
  promptSuffix: string;
}> = [
  {
    id: 'front',
    label: 'Góc chính diện',
    promptSuffix: 'Full-length front view portrait of the model standing naturally, directly facing camera, showcasing the front collar, overlap panels, and flowing trousers.'
  },
  {
    id: 'three_quarter',
    label: 'Góc nghiêng',
    promptSuffix: 'Three-quarter 45-degree angle profile shot, turning slightly to the side, highlighting the graceful silhouette, waistline, and drape of the fabric.'
  },
  {
    id: 'back',
    label: 'Sau lưng',
    promptSuffix: 'Rear view shot displaying the back panel of the garment, neat hairstyle, hair accessories, and the elegant standing posture from behind.'
  },
  {
    id: 'close_up',
    label: 'Cận cảnh hoa văn',
    promptSuffix: 'Macro close-up shot focused on the exquisite collar buttons, embroidery details, fine silk weave texture, and handcrafted seams.'
  }
];

// The only place client text enters a prompt: a separate DATA part the instructions mark as untrusted.
function outfitDataPart(lookbookReq: LookbookRequest): string {
  return `DATA: ${JSON.stringify({
    garmentName: lookbookReq.garmentName,
    silhouette: lookbookReq.silhouette,
    colorPalette: lookbookReq.colorPalette,
    accessoryNames: lookbookReq.accessoryNames,
    eventTitle: lookbookReq.eventTitle
  })}`;
}

// Helper to run a single image generation request
async function generateSingleAngleImage(
  angleDef: typeof ANGLES[number],
  lookbookReq: LookbookRequest,
  signal?: AbortSignal
): Promise<LookbookImage> {
  // User-supplied text stays inside the DATA part only; the instruction refers to its fields by name.
  const instruction = [
    `A candid lifestyle photograph of a fictional young Vietnamese woman (not a real person) with long natural black hair, on a quiet old Hanoi street beside a lime-washed wall covered in flowering vines and green leaves.`,
    `She wears the traditional Vietnamese garment named by garmentName (silhouette field) in the DATA block, in natural silk using the colorPalette hex colors from the DATA block, with the accessoryNames (if any), suited to the eventTitle occasion.`,
    angleDef.promptSuffix,
    `Part of a 4-photo set: the exact same woman, the exact same outfit, the same place, light and color grade in every photo.`,
    `Authentic Vietnamese attire construction (áo dài / áo ngũ thân / áo tứ thân), clearly distinct from Chinese qipao, Korean hanbok or Japanese kimono.`,
    `Shot on 35mm film, Kodak Portra 400 look. Bright, airy exposure with lifted shadows and soft warm late-afternoon sunlight; gentle golden backlight on the hair. Natural skin texture, subtle film grain, fresh slightly warm colors, shallow depth of field.`,
    `One single photograph, clean image without any text, letters, logos or borders.`,
    UNTRUSTED_DATA_NOTICE
  ].join(' ');

  const data = outfitDataPart(lookbookReq);

  const timeoutSignal = AbortSignal.timeout(AI_MODELS.LOOKBOOK_TIMEOUT_MS);
  const combinedSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

  const response = await ai.models.generateContent({
    model: AI_MODELS.IMAGE_GENERATION_MODEL,
    contents: {
      parts: [{ text: instruction }, { text: data }]
    },
    config: {
      abortSignal: combinedSignal,
      imageConfig: {
        aspectRatio: '3:4'
      }
    }
  });

  let base64Image = '';
  let mimeType = 'image/png';
  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData?.data) {
        base64Image = part.inlineData.data;
        if (part.inlineData.mimeType) mimeType = part.inlineData.mimeType;
        break;
      }
    }
  }

  if (!base64Image) {
    throw new Error(`Failed to extract image for angle ${angleDef.id}`);
  }

  return {
    angle: angleDef.id,
    angleLabel: angleDef.label,
    imageUrl: `data:${mimeType};base64,${base64Image}`
  };
}

// Player-facing text for a failed angle; raw SDK errors stay in the server log.
function angleErrorText(err: unknown): string {
  const reason = toFallbackReason(err);
  if (reason === 'rate_limited') return 'Gemini đang bận, thử lại sau ít phút';
  if (reason === 'timeout') return 'Quá thời gian chụp';
  return 'Không chụp được góc này';
}

async function generateOutfitStory(lookbookReq: LookbookRequest, signal?: AbortSignal): Promise<string> {
  try {
    const instruction = `Viết đoạn văn ngắn gọn đúng 2-3 câu bằng tiếng Việt đầy đủ dấu về ý nghĩa bộ trang phục truyền thống Việt Nam mô tả trong khối DATA (garmentName, silhouette, colorPalette, accessoryNames, eventTitle): dáng áo này mặc đi đâu, độ hài hoà với dịp sự kiện thế nào, và màu sắc tượng trưng cho điều gì. Không markdown, không tiêu đề, chỉ trả đúng 2-3 câu văn duyên dáng. ${UNTRUSTED_DATA_NOTICE}`;
    const data = outfitDataPart(lookbookReq);

    const response = await ai.models.generateContent({
      model: AI_MODELS.VISION_MODEL,
      contents: { parts: [{ text: instruction }, { text: data }] },
      config: {
        abortSignal: signal ? AbortSignal.any([signal, AbortSignal.timeout(10000)]) : AbortSignal.timeout(10000),
        temperature: 0.7
      }
    });

    const text = response.text?.trim();
    if (text && text.length > 20) {
      return text;
    }
  } catch (err) {
    console.warn('[AI] Lookbook story generation fallback:', err);
  }

  return `Tà ${lookbookReq.garmentName} với sắc lụa truyền thống tôn lên vẻ trang nhã, đoan trang, rất mực hòa hợp với dịp ${lookbookReq.eventTitle}. Từng đường kim mũi chỉ và vạt áo bay bổng gửi gắm ước vọng về sự an khang, lưu giữ nét đẹp thanh cao của văn hóa Việt.`;
}

// ----------------------------------------------------
// 2. Request Handler: POST /api/ai/lookbook
// ----------------------------------------------------
export async function handleLookbook(req: Request, res: Response) {
  const parsedBody = LookbookRequestSchema.safeParse(req.body || {});
  const parsedReq = parsedBody.success ? parsedBody.data : LookbookRequestSchema.parse({});
  const isStream = Boolean(
    parsedReq.stream ||
    req.headers.accept?.includes('text/event-stream') ||
    req.query.stream === 'true'
  );

  const lookbookReq: LookbookRequest = {
    garmentId: sanitizeUserText(parsedReq.garmentId, 60),
    garmentName: sanitizeUserText(parsedReq.garmentName, 80),
    silhouette: sanitizeUserText(parsedReq.silhouette, 40),
    colorPalette: parsedReq.colorPalette.map((c) => sanitizeUserText(c, 16)),
    accessoryNames: parsedReq.accessoryNames.slice(0, 10).map((n) => sanitizeUserText(n, 60)).filter(Boolean),
    eventTitle: sanitizeUserText(parsedReq.eventTitle, 80),
    singleAngle: parsedReq.singleAngle
  };

  // If a single angle was specifically requested (retry single slot)
  if (lookbookReq.singleAngle) {
    const angleDef = ANGLES.find(a => a.id === lookbookReq.singleAngle);
    if (angleDef) {
      try {
        const image = await generateSingleAngleImage(angleDef, lookbookReq);
        return res.json({ ok: true, data: { image, angle: angleDef.id } });
      } catch (err) {
        console.error(`[AI] Lookbook retry ${angleDef.id} failed:`, err);
        return res.json({ ok: false, error: angleErrorText(err) });
      }
    }
  }

  const cacheKey = `lookbook_${aiCache.hashKey(lookbookReq)}`;
  const cached = aiCache.get<LookbookSuccessResponse>(cacheKey);

  // If request is cached, return immediately
  if (cached) {
    if (isStream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      res.write(`event: start\ndata: ${JSON.stringify({ total: 4, cached: true })}\n\n`);
      for (let i = 0; i < cached.images.length; i++) {
        res.write(`event: angle\ndata: ${JSON.stringify({
          angle: cached.images[i].angle,
          angleLabel: cached.images[i].angleLabel,
          status: 'completed',
          image: cached.images[i],
          completedCount: i + 1,
          total: 4,
          cached: true
        })}\n\n`);
      }
      res.write(`event: done\ndata: ${JSON.stringify({
        completedCount: cached.images.length,
        total: 4,
        images: cached.images,
        watermark: cached.watermark,
        disclosure: cached.disclosure,
        cached: true
      })}\n\n`);
      res.end();
      return;
    } else {
      return res.json({
        ok: true,
        data: cached,
        cached: true
      });
    }
  }

  // Setup abort controller for in-flight client cancellations
  const abortController = new AbortController();
  // req 'close' fires as soon as the body is read; only a response closed before it ended means the client left.
  res.on('close', () => {
    if (!res.writableEnded) abortController.abort();
  });

  const fallback: LookbookFallbackResponse = {
    fallbackType: 'pixel_sketch',
    message: 'Phòng chụp studio đang bận. Tiệm gửi bạn bản phác thảo pixel art để lưu kỷ niệm nhé!',
    garmentId: lookbookReq.garmentId,
    garmentName: lookbookReq.garmentName,
    colorPalette: lookbookReq.colorPalette,
    watermark: 'Bản phác thảo pixel - Tiệm May Nếp 2026'
  };

  if (isStream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    res.write(`event: start\ndata: ${JSON.stringify({ total: 4 })}\n\n`);

    const completedImages: LookbookImage[] = [];
    let completedCount = 0;

    const storyPromise = generateOutfitStory(lookbookReq, abortController.signal);

    const anglePromises = ANGLES.map(async (angleDef) => {
      try {
        const image = await generateSingleAngleImage(angleDef, lookbookReq, abortController.signal);
        completedImages.push(image);
        completedCount++;
        res.write(`event: angle\ndata: ${JSON.stringify({
          angle: angleDef.id,
          angleLabel: angleDef.label,
          status: 'completed',
          image,
          completedCount,
          total: 4
        })}\n\n`);
      } catch (err) {
        console.error(`[AI] Lookbook angle ${angleDef.id} failed:`, err);
        completedCount++;
        res.write(`event: angle\ndata: ${JSON.stringify({
          angle: angleDef.id,
          angleLabel: angleDef.label,
          status: 'error',
          error: angleErrorText(err),
          completedCount,
          total: 4
        })}\n\n`);
      }
    });

    const [story] = await Promise.all([
      storyPromise,
      Promise.allSettled(anglePromises)
    ]);

    const sortedImages: LookbookImage[] = [];
    for (const def of ANGLES) {
      const found = completedImages.find(img => img.angle === def.id);
      if (found) sortedImages.push(found);
    }

    const result: LookbookSuccessResponse = {
      images: sortedImages,
      watermark: 'Ảnh do AI tạo - Tiệm May Nếp 2026',
      disclosure: 'Bộ ảnh được mô phỏng bằng công nghệ Google Gemini dựa trên phong cách phối đồ của bạn.',
      story
    };

    if (sortedImages.length === 4) {
      aiCache.set(cacheKey, result);
    }

    res.write(`event: done\ndata: ${JSON.stringify({
      completedCount: sortedImages.length,
      total: 4,
      images: sortedImages,
      watermark: result.watermark,
      disclosure: result.disclosure,
      story: result.story
    })}\n\n`);
    res.end();
  } else {
    // Non-streaming JSON mode (used by existing tests)
    try {
      const [story, results] = await Promise.all([
        generateOutfitStory(lookbookReq, abortController.signal),
        Promise.allSettled(
          ANGLES.map((angle) => generateSingleAngleImage(angle, lookbookReq, abortController.signal))
        )
      ]);

      const successfulImages: LookbookImage[] = [];
      for (const resItem of results) {
        if (resItem.status === 'fulfilled') {
          successfulImages.push(resItem.value);
        }
      }

      if (successfulImages.length === 0) {
        throw new Error('All 4 angles failed to generate');
      }

      const sortedImages: LookbookImage[] = [];
      for (const def of ANGLES) {
        const found = successfulImages.find(img => img.angle === def.id);
        if (found) sortedImages.push(found);
      }

      const result: LookbookSuccessResponse = {
        images: sortedImages,
        watermark: 'Ảnh do AI tạo - Tiệm May Nếp 2026',
        disclosure: 'Bộ ảnh được mô phỏng bằng công nghệ Google Gemini dựa trên phong cách phối đồ của bạn.',
        story
      };

      if (sortedImages.length === 4) {
        aiCache.set(cacheKey, result);
      }

      return res.json({
        ok: true,
        data: result
      });
    } catch (err) {
      console.error('[AI] lookbook non-streaming failed:', err);
      return res.json({
        ok: false,
        fallback: {
          ...fallback,
          reason: toFallbackReason(err)
        }
      });
    }
  }
}
