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
  eventTitle: z.string().default('Chúc Tết Đầu Xuân')
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
}

export interface LookbookFallbackResponse {
  fallbackType: 'pixel_sketch';
  message: string;
  garmentId: string;
  garmentName: string;
  colorPalette: string[];
  watermark: string;
}

const ANGLES: Array<{
  id: 'front' | 'three_quarter' | 'back' | 'close_up';
  label: string;
  promptSuffix: string;
}> = [
  {
    id: 'front',
    label: 'Góc chính diện',
    promptSuffix: 'Full-length front view shot of a fictional model wearing the full traditional Vietnamese outfit.'
  },
  {
    id: 'three_quarter',
    label: 'Góc nghiêng 45 độ',
    promptSuffix: 'Three-quarter 45-degree angle profile shot, showing the graceful silhouette and flowing fabric drape.'
  },
  {
    id: 'back',
    label: 'Góc sau lưng',
    promptSuffix: 'Rear view shot displaying the back panels, standing posture, and hair accessory details.'
  },
  {
    id: 'close_up',
    label: 'Cận cảnh hoa văn',
    promptSuffix: 'Macro close-up shot focusing on the delicate woven silk texture, collar buttons, and authentic craftsmanship.'
  }
];

// Helper to run a single image generation request, cancelled client-side after LOOKBOOK_TIMEOUT_MS
async function generateSingleAngleImage(
  angleDef: typeof ANGLES[number],
  lookbookReq: LookbookRequest
): Promise<LookbookImage> {
  // Image models may not accept systemInstruction, so the untrusted-data rule and the DATA block are separate text parts
  const instruction = [
    `High-end fashion editorial photography in an authentic 19th/20th-century Vietnamese courtyard studio.`,
    `A fictional Vietnamese model elegantly dressed in the garment described by garmentName and silhouette in the DATA block.`,
    `The garment features authentic natural silk fabric in the colorPalette from the DATA block, paired with the accessoryNames (if any) and suited to the eventTitle occasion.`,
    angleDef.promptSuffix,
    `Soft natural lighting, warm aesthetic, photorealistic studio photography, 8k resolution, cinematic look, watermark-free.`,
    UNTRUSTED_DATA_NOTICE
  ].join(' ');
  const data = `DATA: ${JSON.stringify({
    garmentName: lookbookReq.garmentName,
    silhouette: lookbookReq.silhouette,
    colorPalette: lookbookReq.colorPalette,
    accessoryNames: lookbookReq.accessoryNames,
    eventTitle: lookbookReq.eventTitle
  })}`;

  const response = await ai.models.generateContent({
    model: AI_MODELS.IMAGE_GENERATION_MODEL,
    contents: {
      parts: [{ text: instruction }, { text: data }]
    },
    config: {
      abortSignal: AbortSignal.timeout(AI_MODELS.LOOKBOOK_TIMEOUT_MS),
      imageConfig: {
        aspectRatio: '3:4',
        imageSize: '1K'
      }
    }
  });

  let base64Image = '';
  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData?.data) {
        base64Image = part.inlineData.data;
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
    imageUrl: `data:image/png;base64,${base64Image}`
  };
}

// ----------------------------------------------------
// 2. Request Handler: POST /api/ai/lookbook
// ----------------------------------------------------
export async function handleLookbook(req: Request, res: Response) {
  const parsedBody = LookbookRequestSchema.safeParse(req.body || {});
  const parsedReq = parsedBody.success ? parsedBody.data : LookbookRequestSchema.parse({});
  // Free text from the client is echoed into prompts and fallback: normalize and cap it
  const lookbookReq: LookbookRequest = {
    garmentId: sanitizeUserText(parsedReq.garmentId, 60),
    garmentName: sanitizeUserText(parsedReq.garmentName, 80),
    silhouette: sanitizeUserText(parsedReq.silhouette, 40),
    colorPalette: parsedReq.colorPalette.map((c) => sanitizeUserText(c, 16)),
    accessoryNames: parsedReq.accessoryNames.slice(0, 10).map((n) => sanitizeUserText(n, 60)).filter(Boolean),
    eventTitle: sanitizeUserText(parsedReq.eventTitle, 80)
  };

  const fallback: LookbookFallbackResponse = {
    fallbackType: 'pixel_sketch',
    message: 'Phòng chụp studio đang bận. Tiệm gửi bạn bản phác thảo pixel art để lưu kỷ niệm nhé!',
    garmentId: lookbookReq.garmentId,
    garmentName: lookbookReq.garmentName,
    colorPalette: lookbookReq.colorPalette,
    watermark: 'Bản phác thảo pixel - Tiệm May Nếp 2026'
  };

  try {
    // Check in-memory cache
    const cacheKey = `lookbook_${aiCache.hashKey(lookbookReq)}`;
    const cached = aiCache.get<LookbookSuccessResponse>(cacheKey);
    if (cached) {
      return res.json({
        ok: true,
        data: cached,
        cached: true
      });
    }

    // Generate all 4 angles in parallel; each request carries its own LOOKBOOK_TIMEOUT_MS abort signal
    const images = await Promise.all(
      ANGLES.map((angle) => generateSingleAngleImage(angle, lookbookReq))
    );

    const result: LookbookSuccessResponse = {
      images,
      watermark: 'Ảnh do AI tạo - Tiệm May Nếp 2026',
      disclosure: 'Bộ ảnh được mô phỏng bằng công nghệ Google Gemini dựa trên phong cách phối đồ của bạn.'
    };

    aiCache.set(cacheKey, result);

    return res.json({
      ok: true,
      data: result
    });
  } catch (err) {
    console.error('[AI] lookbook failed:', err);
    return res.json({
      ok: false,
      fallback: {
        ...fallback,
        reason: toFallbackReason(err)
      }
    });
  }
}
