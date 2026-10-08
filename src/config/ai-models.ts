/**
 * Cấu hình tập trung tên các mô hình AI cho toàn bộ ứng dụng Tiệm May Nếp.
 * Tuân thủ Nguyên tắc Single Source of Truth (docs/01-overview/decisions.md mục 10 & 11).
 * Tên model chỉ được khai báo duy nhất tại tệp này, chọn theo các model AI Studio Build đang hỗ trợ.
 */

export const AI_MODELS = {
  /**
   * Model đọc ảnh / xử lý thị giác (Vision & Structured Output)
   * Sử dụng để phân tích thuộc tính tóc/kính từ selfie, nhận diện áo thật trong xưởng may, và stylist.
   * Lưu ý kỹ thuật: Đã chuyển đổi từ gemini-2.5-flash sang 'gemini-3.8-flash' - đây là bản Flash
   * mới nhất hiện tại theo danh mục @google/genai Models của AI Studio Build.
   * Tuyệt đối KHÔNG sử dụng gemini-2.5-flash-image hay các model cũ đã ngừng hỗ trợ.
   */
  VISION_MODEL: 'gemini-3.8-flash',

  /**
   * Model sinh ảnh (Image Generation)
   * Sử dụng để tạo 4 góc ảnh Lookbook studio chân thực
   * gemini-3.1-flash-lite-image: bản stable rẻ nhất (~$0.0336/ảnh 1K, tối đa 14 ảnh tham chiếu), decisions.md mục 11
   */
  IMAGE_GENERATION_MODEL: 'gemini-3.1-flash-lite-image',

  /**
   * Thời gian chờ tối đa cho tiến trình sinh ảnh Lookbook (mili-giây)
   */
  LOOKBOOK_TIMEOUT_MS: 45000,
} as const;

export type AiModelConfig = typeof AI_MODELS;
