import type { Request, Response } from 'express';
import { z } from 'zod';
import { Type } from '@google/genai';
import { ai } from './gemini-client.ts';
import { aiCache } from './cache.ts';
import { AI_MODELS } from '../../config/ai-models.ts';
import { toFallbackReason, type FallbackReason } from './sanitize.ts';

// ----------------------------------------------------
// 1. Zod Enums & Schemas
// ----------------------------------------------------

export const GarmentCategoryEnum = z.enum([
  'ao_dai',
  'qipao_cheongsam',
  'hanbok',
  'khac'
]);
export type GarmentCategory = z.infer<typeof GarmentCategoryEnum>;

export const SilhouetteEnum = z.enum([
  'tu_than',
  'ngu_than_tay_chen',
  'ngu_than_tay_thung',
  'tan_thoi'
]);
export type Silhouette = z.infer<typeof SilhouetteEnum>;

export const CollarTypeEnum = z.enum(['dung', 'tron', 'thuyen', 'la_sen']);
export const PatternTypeEnum = z.enum(['tron', 'hoa_tiet', 'theu']);

export const RawGarmentAnalysisSchema = z.object({
  garmentCategory: GarmentCategoryEnum.catch('ao_dai'),
  silhouette: SilhouetteEnum.catch('ngu_than_tay_chen'),
  collarType: CollarTypeEnum.catch('dung'),
  patternType: PatternTypeEnum.catch('tron'),
  dominantColorHex: z.string().catch('#C25975'),
  secondaryColorHex: z.string().catch('#FFFFFF')
});

export const DIFFERENTIATION_CARDS = {
  qipao_cheongsam: {
    cardId: 'diff-ao-dai-vs-qipao',
    title: 'Phân biệt Áo dài và Sườn xám (Qipao)',
    explanation: 'Chiếc áo trong ảnh mang nét đặc trưng của sườn xám (qipao) với dáng váy liền thân và đường xẻ tà dọc đùi. Áo dài của người Kinh chúng mình có cấu trúc khác biệt rõ rệt: thân áo xẻ tà từ thắt lưng và bắt buộc mặc cùng quần dài hai ống thướt tha. Bạn xem bảng đối chiếu chi tiết để nhận biết nhé!'
  },
  hanbok: {
    cardId: 'diff-ao-dai-vs-hanbok',
    title: 'Phân biệt Áo dài và Hanbok Hàn Quốc',
    explanation: 'Bộ trang phục trong ảnh là hanbok truyền thống của Hàn Quốc với áo lửng jeogori thắt nơ trước ngực và váy xòe phồng chima. Áo dài người Kinh có tà dài rủ thẳng dọc thân và cổ đứng cài khuy trang nghiêm. Tiệm gửi bạn bảng so sánh hình thái để hiểu thêm về trang phục các nước bạn nhé!'
  },
  khac: {
    cardId: 'diff-ao-dai-generic',
    title: 'Nhận diện Y phục Người Kinh',
    explanation: 'Hình ảnh chưa thể hiện rõ nét các đặc trưng nhận diện của áo dài truyền thống người Kinh. Bạn xem bảng đối chiếu chi tiết để tìm hiểu thêm nhé!'
  }
} as const;

export interface GarmentAnalysisSuccessResponse {
  isVietnameseAoDai: boolean;
  garmentCategory: GarmentCategory;
  // If Vietnamese Ao Dai:
  identifiedSilhouette?: Silhouette;
  garmentId?: string;
  collarType?: string;
  patternType?: string;
  dominantColorHex?: string;
  secondaryColorHex?: string;
  // If not Vietnamese Ao Dai:
  foreignGarmentType?: string;
  differentiationCardId?: string;
  differentiationTitle?: string;
  differentiationExplanation?: string;
}

export interface GarmentAnalysisFallback {
  reason: FallbackReason;
  manualTailoring: boolean;
  message: string;
  defaultGarmentId: string;
}

const DEFAULT_FALLBACK: GarmentAnalysisFallback = {
  reason: 'ai_unavailable',
  manualTailoring: true,
  message: 'Máy may tự động đang bảo trì, mời bạn chọn thông số bằng tay!',
  defaultGarmentId: 'ao-ngu-than-tay-chen'
};

function mapSilhouetteToGarmentId(sil: Silhouette): string {
  switch (sil) {
    case 'tu_than':
      return 'ao-tu-than';
    case 'ngu_than_tay_thung':
      return 'ao-ngu-than-tay-thung';
    case 'tan_thoi':
      return 'ao-dai-tan-thoi-vang-mo-ga';
    case 'ngu_than_tay_chen':
    default:
      return 'ao-ngu-than-tay-chen';
  }
}

// ----------------------------------------------------
// 2. Request Handler: POST /api/ai/analyze-garment
// ----------------------------------------------------
export async function handleAnalyzeGarment(req: Request, res: Response) {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body || {};

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({
        ok: false,
        fallback: {
          ...DEFAULT_FALLBACK,
          message: 'Thiếu dữ liệu hình ảnh áo.'
        }
      });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    // Check in-memory cache
    const cacheKey = `garment_${aiCache.hashKey(cleanBase64)}`;
    const cached = aiCache.get<GarmentAnalysisSuccessResponse>(cacheKey);
    if (cached) {
      return res.json({
        ok: true,
        data: cached,
        cached: true
      });
    }

    // Call Gemini with strict structured output schema
    const prompt = [
      'Bạn là chuyên gia thẩm định và cắt may y phục cổ truyền trong Xưởng may Tiệm May Nếp.',
      'Hãy phân tích hình ảnh trang phục người dùng tải lên:',
      '1. garmentCategory: Xác định loại trang phục: "ao_dai" (Áo dài / Áo ngũ thân / Áo tứ thân người Kinh), "qipao_cheongsam" (Sườn xám / Qipao Trung Quốc), "hanbok" (Hanbok Hàn Quốc), hoặc "khac" (trang phục khác).',
      '2. silhouette: Nếu là áo dài, xác định phom dáng: "tu_than", "ngu_than_tay_chen", "ngu_than_tay_thung", hoặc "tan_thoi".',
      '3. collarType: Cổ áo: "dung" (cổ đứng/lập lĩnh), "tron" (cổ tròn/khuyên lĩnh), "thuyen" (cổ thuyền), "la_sen" (cổ lá sen Lemur).',
      '4. patternType: Hoa văn: "tron" (vải trơn), "hoa_tiet" (hoa lá/hoa cúc), "theu" (thêu hoa/phượng).',
      '5. dominantColorHex: Mã màu chủ đạo dạng Hex (#RRGGBB).',
      '6. secondaryColorHex: Mã màu phụ dạng Hex (#RRGGBB).'
    ].join(' ');

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
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            garmentCategory: {
              type: Type.STRING,
              description: 'ao_dai, qipao_cheongsam, hanbok, khac'
            },
            silhouette: {
              type: Type.STRING,
              description: 'tu_than, ngu_than_tay_chen, ngu_than_tay_thung, tan_thoi'
            },
            collarType: {
              type: Type.STRING,
              description: 'dung, tron, thuyen, la_sen'
            },
            patternType: {
              type: Type.STRING,
              description: 'tron, hoa_tiet, theu'
            },
            dominantColorHex: {
              type: Type.STRING,
              description: 'Hex color code e.g. #C25975'
            },
            secondaryColorHex: {
              type: Type.STRING,
              description: 'Hex color code e.g. #FFFFFF'
            }
          },
          required: ['garmentCategory', 'silhouette', 'collarType', 'patternType']
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

    const validated = RawGarmentAnalysisSchema.parse(parsedJson);

    let result: GarmentAnalysisSuccessResponse;

    if (validated.garmentCategory === 'ao_dai') {
      result = {
        isVietnameseAoDai: true,
        garmentCategory: 'ao_dai',
        identifiedSilhouette: validated.silhouette,
        garmentId: mapSilhouetteToGarmentId(validated.silhouette),
        collarType: validated.collarType,
        patternType: validated.patternType,
        dominantColorHex: validated.dominantColorHex,
        secondaryColorHex: validated.secondaryColorHex
      };
    } else {
      // Foreign garment or other: return differentiation details
      const foreignType = validated.garmentCategory as 'qipao_cheongsam' | 'hanbok' | 'khac';
      const diffInfo = DIFFERENTIATION_CARDS[foreignType] || DIFFERENTIATION_CARDS.khac;

      result = {
        isVietnameseAoDai: false,
        garmentCategory: validated.garmentCategory,
        foreignGarmentType: foreignType,
        differentiationCardId: diffInfo.cardId,
        differentiationTitle: diffInfo.title,
        differentiationExplanation: diffInfo.explanation
      };
    }

    aiCache.set(cacheKey, result);

    return res.json({
      ok: true,
      data: result
    });
  } catch (err) {
    console.error('[AI] analyze-garment failed:', err);
    return res.json({
      ok: false,
      fallback: {
        ...DEFAULT_FALLBACK,
        reason: toFallbackReason(err),
        message: 'Không phân tích được áo lúc này. Tiệm chuyển sang chế độ may đo thủ công.'
      }
    });
  }
}
