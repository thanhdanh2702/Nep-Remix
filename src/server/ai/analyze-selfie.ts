import type { Request, Response } from 'express';
import { z } from 'zod';
import { Type } from '@google/genai';
import { ai } from './gemini-client.ts';
import { AI_MODELS } from '../../config/ai-models.ts';
import { toFallbackReason, type FallbackReason } from './sanitize.ts';

// ----------------------------------------------------
// 1. Zod Enums & Validation Schemas
// ----------------------------------------------------

export const HairLengthEnum = z.enum(['ngan', 'ngang_vai', 'dai']);
export type HairLength = z.infer<typeof HairLengthEnum>;

export const HairColorEnum = z.enum(['den', 'nau_hat_de', 'vang_khoi']);
export type HairColor = z.infer<typeof HairColorEnum>;

export const GlassesEnum = z.enum(['co_kinh', 'khong_kinh']);
export type Glasses = z.infer<typeof GlassesEnum>;

export const SelfieResultSchema = z.object({
  hairLength: HairLengthEnum.catch('ngang_vai'),
  hairColor: HairColorEnum.catch('den'),
  glasses: GlassesEnum.catch('khong_kinh'),
  avatarPreset: z.string().default('an-default')
});
export type SelfieResult = z.infer<typeof SelfieResultSchema>;

export interface AnalyzeSelfieFallback {
  hairLength: HairLength;
  hairColor: HairColor;
  glasses: Glasses;
  avatarPreset: string;
  reason: FallbackReason;
  message: string;
}

const DEFAULT_FALLBACK: AnalyzeSelfieFallback = {
  hairLength: 'ngang_vai',
  hairColor: 'den',
  glasses: 'khong_kinh',
  avatarPreset: 'an-default',
  reason: 'ai_unavailable',
  message: 'Tín hiệu AI gián đoạn hoặc ảnh chưa rõ, tiệm đã chọn sẵn nhân vật mẫu mặc định.'
};

// ----------------------------------------------------
// 2. Helper to map attributes to Avatar Preset ID
// ----------------------------------------------------
function deriveAvatarPreset(hairLength: HairLength, glasses: Glasses): string {
  if (glasses === 'co_kinh') return 'an-glasses';
  if (hairLength === 'ngan') return 'an-short-hair';
  if (hairLength === 'dai') return 'an-long-hair';
  return 'an-default';
}

// ----------------------------------------------------
// 3. Request Handler: POST /api/ai/analyze-selfie
// ----------------------------------------------------
export async function handleAnalyzeSelfie(req: Request, res: Response) {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body || {};

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({
        ok: false,
        fallback: {
          ...DEFAULT_FALLBACK,
          message: 'Thiếu dữ liệu hình ảnh selfie.'
        }
      });
    }

    // Strip data URL prefix if present
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    // No cache: results derive from a user photo and must not be retained server-side
    // Call Gemini with strict structured output schema
    const response = await ai.models.generateContent({
      model: AI_MODELS.VISION_MODEL,
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType
            }
          },
          {
            text: [
              'Bạn là chuyên gia phân tích đặc điểm đồ họa cho Tiệm May Nếp.',
              'Hãy trích xuất 3 đặc điểm tóc và kính từ ảnh selfie để ánh xạ thành sprite pixel art:',
              '1. hairLength: chọn chính xác một trong các giá trị enum: "ngan", "ngang_vai", "dai".',
              '2. hairColor: chọn chính xác một trong các giá trị enum: "den", "nau_hat_de", "vang_khoi".',
              '3. glasses: chọn chính xác một trong các giá trị enum: "co_kinh", "khong_kinh".',
              'Tuyệt đối không đoán hay gắn nhãn giới tính. Chỉ trả về JSON tuân theo schema.'
            ].join(' ')
          }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hairLength: {
              type: Type.STRING,
              description: 'Chiều dài tóc: ngan (ngắn), ngang_vai (ngang vai), dai (dài)'
            },
            hairColor: {
              type: Type.STRING,
              description: 'Tông màu tóc: den (đen), nau_hat_de (nâu hạt dẻ), vang_khoi (vàng khói)'
            },
            glasses: {
              type: Type.STRING,
              description: 'Kính mắt: co_kinh (có đeo kính), khong_kinh (không đeo kính)'
            }
          },
          required: ['hairLength', 'hairColor', 'glasses']
        }
      }
    });

    const rawText = response.text?.trim() || '{}';
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawText);
    } catch {
      parsedJson = {};
    }

    // Zod parsing: drop unrecognized values and fallback to defaults
    const validated = SelfieResultSchema.parse(parsedJson);

    // Derive avatarPreset ID
    validated.avatarPreset = deriveAvatarPreset(validated.hairLength, validated.glasses);

    return res.json({
      ok: true,
      data: validated
    });
  } catch (err) {
    console.error('[AI] analyze-selfie failed:', err);
    return res.json({
      ok: false,
      fallback: {
        ...DEFAULT_FALLBACK,
        reason: toFallbackReason(err)
      }
    });
  }
}
