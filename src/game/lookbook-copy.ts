// Vietnamese UI copy for the Lookbook dialog. Raw reason codes never reach the screen: they are mapped here.
import type { LookbookCheckResult, LookbookReason } from '../server/ai/lookbook-contract.ts';

export const LOOKBOOK_REASON_TEXT: Record<LookbookReason, string> = {
  timeout: 'Chụp hơi lâu, thử lại nhé.',
  rate_limited: 'Bạn chụp hơi nhanh, nghỉ vài phút rồi chụp tiếp nhé.',
  quota_exhausted: 'Tiệm đã hết lượt chụp hôm nay, mai quay lại nhé.',
  safety_blocked: 'Ảnh này chưa chụp được. Thử ảnh khác hoặc dùng Người mẫu của tiệm.',
  invalid_output: 'Gemini chưa trả ảnh, thử lại nhé.',
  ai_unavailable: 'Gemini chưa trả ảnh, thử lại nhé.'
};

export const COPY = {
  title: 'Lookbook AI',
  close: 'Đóng',
  modelHeading: '1 · Người mẫu',
  moodHeading: '2 · Bối cảnh',
  modeShop: 'Người mẫu của tiệm',
  modeMine: 'Ảnh của tôi',
  modeGroupLabel: 'Chọn người mẫu',
  moodGroupLabel: 'Chọn bối cảnh',
  shopNote: (gender: 'female' | 'male') => `Người mẫu hư cấu do Gemini tạo, dáng ${gender === 'male' ? 'nam' : 'nữ'} theo nhân vật của bạn.`,
  noPhoto: 'Chưa có ảnh',
  pickPhoto: 'Chọn ảnh từ thiết bị',
  pickOtherPhoto: 'Chọn ảnh khác',
  removePhoto: 'Xoá ảnh',
  photoHint: 'JPG, PNG, WEBP · tối đa 5 MB · nên là ảnh toàn thân, một người, thấy rõ mặt',
  consent: 'Đây là ảnh của chính tôi. Tôi đồng ý gửi ảnh cho Google Gemini để tạo bộ ảnh. Ảnh không được lưu.',
  openFailed: 'Không mở được ảnh này, chọn ảnh khác nhé.',
  checking: 'Đang kiểm tra ảnh…',
  checkOk: 'Ảnh đạt: một người, thấy rõ mặt, toàn thân.',
  checkWarn: 'Ảnh chưa thấy toàn thân: dáng người sẽ được ước đoán.',
  checkUnavailable: 'Chưa kiểm tra được ảnh lúc này.',
  recheck: 'Kiểm tra lại',
  useShop: 'Dùng Người mẫu của tiệm',
  pickBackground: 'Chọn ảnh nền',
  removeBackground: 'Xoá ảnh nền',
  eventNote: (eventName: string) => `Không khí theo sự kiện: ${eventName}`,
  capture: 'Chụp 4 ảnh',
  save: 'Lưu bộ phối',
  cancel: 'Huỷ',
  exportPng: 'Lưu ảnh PNG',
  share: 'Chia sẻ',
  exportFailed: 'Chưa tạo được ảnh PNG, thử lại nhé.',
  needPhoto: 'Chọn ảnh, tick đồng ý và chờ kiểm tra ảnh.',
  needBackground: 'Chọn ảnh nền cho Nền của tôi.',
  exhausted: 'Tiệm đã hết lượt chụp hôm nay, mai quay lại nhé',
  disclosure: 'Ảnh do AI tạo bằng Google Gemini. Ảnh của bạn không được lưu.',
  aiLabel: 'Ảnh AI',
  aiGenerated: 'Ảnh do AI tạo',
  slotIdle: 'Chờ chụp',
  slotQueued: 'Chờ ảnh đầu tiên…',
  slotGenerating: 'Đang chụp…',
  retry: 'Thử lại',
  storyHeading: 'Câu chuyện tà áo',
  download: 'Tải ảnh này',
  back: 'Quay lại',
  pixelAgain: 'Về ảnh pixel',
  progress: (n: number) => `Đang chụp ${n}/4…`,
  done: (n: number) => `${n}/4 ảnh`,
  firstImage: (ms: number) => `Ảnh đầu tiên sau ${(ms / 1000).toFixed(1).replace('.', ',')}s`,
  retryAngle: (label: string) => `Chụp lại góc ${label}`,
  openAngle: (label: string) => `Phóng to góc ${label}`,
  slotAlt: (label: string, garment: string) => `${label} – ảnh AI ${garment}`
} as const;

/** One sentence per failed check flag (block verdict). */
export function checkProblems(check: LookbookCheckResult): string[] {
  const problems: string[] = [];
  if (!check.onePerson) problems.push('Ảnh cần đúng một người.');
  if (!check.faceVisible) problems.push('Cần thấy rõ khuôn mặt.');
  if (!check.looksAdult) problems.push('Tiệm chỉ nhận ảnh người lớn.');
  return problems.length ? problems : ['Ảnh này chưa dùng được, hãy chọn ảnh khác.'];
}
