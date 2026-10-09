# Lookbook API

Hợp đồng giữa trình duyệt và máy chủ cho tính năng Lookbook AI (F09). Nguồn sự thật là code: `src/server/ai/lookbook-contract.ts` (schema, sự kiện, mã lỗi), `src/server/ai/lookbook-route.ts` (HTTP, limiter), `src/server/ai/lookbook-generate.ts` (sinh ảnh), `src/server/ai/lookbook-prompt.ts` (lời nhắc). Giao diện: [studio.md](../03-features/studio.md).

## 1. Ba endpoint

Cả ba nhận JSON, giới hạn body 6 MB (`SERVER_LIMITS.maxBodySize`) và đi qua bộ giới hạn chung của `/api/ai/*` (20 request/phút/IP).

| Endpoint | Việc | Trả về |
| :--- | :--- | :--- |
| `POST /api/ai/lookbook/check` | Kiểm tra ảnh người dùng (một người, thấy mặt, toàn thân, người lớn) | JSON `{ ok: true, data: { onePerson, faceVisible, fullBody, looksAdult, verdict } }` |
| `POST /api/ai/lookbook` | Chụp trọn bộ 4 góc | Luồng SSE (mục 3) |
| `POST /api/ai/lookbook/angle` | Chụp lại đúng một góc | JSON `{ ok: true, data: { id, image, heroToken? } }` |

`verdict` là `ok`, `warn` (thiếu toàn thân, vẫn chụp được) hoặc `block` (không chụp).

### Body của `/lookbook` và `/lookbook/angle`

Máy chủ **chỉ nhận id và mã màu**, không nhận chữ tự do. Schema `LookbookRequestSchema` là `strict`: thêm bất kỳ trường lạ nào (ví dụ `garmentName`, `story`) đều bị từ chối.

| Trường | Kiểu | Ghi chú |
| :--- | :--- | :--- |
| `mode` | `fictional` hoặc `personal` | |
| `modelGender` | `female` (mặc định) hoặc `male` | Lấy từ nhân vật của người chơi. Chỉ dùng ở chế độ `fictional` |
| `personImage` | data URL jpeg/png/webp | Bắt buộc khi `personal`, cấm khi `fictional`. Tối đa 1,2 triệu ký tự |
| `backgroundImage` | data URL | Bắt buộc khi `moodId` là `custom`, cấm ở các bối cảnh khác |
| `garmentId` | id áo trong catalog | Phải có trong catalog áo và trong `lookbook-style.json`, nếu không trả 400 |
| `colorPalette` | 4 mã `#rrggbb` | Chuyển về chữ thường |
| `accessoryIds` | tối đa 4 id, không trùng | Phải có trong catalog phụ kiện |
| `eventId` | `dao_pho` (mặc định), `tet`, `dam_cuoi`, `be_giang`, `le_chua`, `vieng_tang` | Cùng id với sự kiện của Studio |
| `moodId` | `pho-co`, `vuon-hoa`, `tuong-voi`, `san-nha`, `custom` | |
| `noCache` | boolean, tùy chọn | `true` bỏ qua cache (nút chụp lại cả bộ) |

`/lookbook/angle` thêm `angle` (`front`, `turn`, `back`, `detail`), `heroImage` và `heroToken`. Ảnh mốc chỉ được dùng khi `heroToken` đúng là chữ ký của máy chủ (HMAC) cho đúng ảnh đó; sai thì góc được chụp không có ảnh mốc.

Lời nhắc ghép từ `src/content/lookbook-style.json` theo id, không có chữ nào của client lọt vào. Ảnh áo tham chiếu nằm ở `public/lookbook-ref/<id>.jpg`; thiếu ảnh thì mô tả áo bằng chữ.

## 2. Mã trạng thái

| Status | Khi nào | Body |
| :--- | :--- | :--- |
| 200 (`text/event-stream`) | `/lookbook` được nhận | Luồng sự kiện |
| 200 (JSON) | `/check` hoặc `/angle` chạy xong; hoặc gọi Gemini lỗi | `{ ok: true, data }` hoặc `{ ok: false, fallback: { reason } }` |
| 400 | Body sai schema hoặc id lạ | `{ ok: false }` |
| 422 | Kiểm tra lại ảnh ở máy chủ cho `block` | `{ ok: false, fallback: { reason: 'safety_blocked' }, check }` |
| 429 | Hết lượt của IP hoặc hết trần ngày | `{ ok: false, fallback: { reason } }`; bộ giới hạn chung `/api/ai/*` trả `{ ok: false, error }` không có `reason`, client coi là `rate_limited` |
| 500 | Lỗi không lường trước trước khi mở luồng | `{ ok: false }` |

Máy chủ gọi lại bước kiểm tra ảnh trước khi chụp ở chế độ `personal`, nên client không thể bỏ qua `block`.

## 3. Luồng SSE của `/lookbook`

Mỗi khung có dạng `event: <loại>` rồi `data: <json>` và một dòng trống. Dòng bắt đầu bằng `:` là nhịp tim 15 giây (`heartbeatMs`).

| Sự kiện | Dữ liệu |
| :--- | :--- |
| `start` | `{ total: 4, cached }` |
| `angle` | `{ id, status: 'done', image, heroToken? }` hoặc `{ id, status: 'error', reason }`; `heroToken` chỉ có ở góc `front` |
| `done` | `{ completed }` (số ảnh thành công) |

Thứ tự: `front` (ảnh mốc, hero) chụp trước. Có hero rồi mới chụp song song `turn`, `back`, `detail`, cả ba bám ảnh hero để giữ cùng một người và cùng một áo. Hero lỗi nhanh (dưới 20 giây) và không phải `timeout` hoặc `safety_blocked` thì thử lại một lần. Hero bị `safety_blocked` thì cả 3 góc còn lại báo cùng lý do và không gọi thêm.

Client (`callAiStream` trong `src/game/ai-client.ts`) coi luồng đóng mà thiếu `done` là `ended_without_done`: các ô chưa xong chuyển sang lỗi có thể chụp lại, không ô nào quay mãi.

## 4. Mã lý do (`reason`)

| Mã | Nghĩa | Câu hiển thị (`src/game/lookbook-copy.ts`) |
| :--- | :--- | :--- |
| `timeout` | Quá thời gian chờ một ảnh (45 giây) hoặc cả luồng | "Chụp hơi lâu, thử lại nhé." |
| `rate_limited` | Chụp quá nhanh (IP hết đơn vị, hoặc Gemini trả 429) | "Bạn chụp hơi nhanh, nghỉ vài phút rồi chụp tiếp nhé." |
| `quota_exhausted` | Hết trần ngày của cả tiệm | "Tiệm đã hết lượt chụp hôm nay, mai quay lại nhé." |
| `safety_blocked` | Gemini hoặc bước kiểm tra từ chối ảnh | "Ảnh này chưa chụp được. Thử ảnh khác hoặc dùng Người mẫu của tiệm." |
| `invalid_output` | Gemini không trả ảnh | "Gemini chưa trả ảnh, thử lại nhé." |
| `ai_unavailable` | Mọi lỗi còn lại (kể cả hết credit) | "Gemini chưa trả ảnh, thử lại nhé." |

Mã thô không bao giờ hiện trên màn hình; giá trị lạ từ máy chủ được gom về `ai_unavailable`. Khi Gemini trả 403 (nghi hết credit hoặc thiếu quyền) máy chủ chỉ ghi log, client nhận `ai_unavailable`.

## 5. Giới hạn và chi phí

Hằng số nằm ở `LOOKBOOK_LIMITS` (`src/config/lookbook-limits.ts`):

| Giới hạn | Giá trị |
| :--- | :--- |
| Đơn vị mỗi IP | 12 đơn vị trong 10 phút; một bộ 4 góc = 4 đơn vị, chụp lại một góc = 1 đơn vị |
| Trần ngày toàn tiệm | 10 bộ mỗi ngày UTC (đếm theo đơn vị, nên 40 lần chụp lại một góc cũng là 10 bộ). Đổi bằng biến `LOOKBOOK_DAILY_LIMIT` |
| Cache | Chỉ bộ hư cấu có bối cảnh dựng sẵn; tối đa 6 bộ, giữ 30 phút. Trúng cache **không tốn lượt** của IP lẫn trần ngày. `noCache: true` bỏ qua cache |
| Ngân sách luồng | 100 giây ở máy chủ, 110 giây ở client (timeout Cloud Run là 120 giây) |

Bộ đếm nằm trong bộ nhớ từng instance, nhiều instance thì mỗi instance đếm riêng (xem [deploy-cloud-run.md](deploy-cloud-run.md)).

Biến môi trường (mẫu ở `.env.example`):
- `LOOKBOOK_DAILY_LIMIT`: trần ngày, mặc định 10.
- `LOOKBOOK_HERO_SECRET`: khóa ký `heroToken`. Để trống thì sinh ngẫu nhiên mỗi lần khởi động; token cũ mất hiệu lực khi instance khởi động lại (client chụp lại góc sẽ không có ảnh mốc). Đặt cố định khi chạy nhiều instance.

Chi phí tham khảo với mô hình ảnh trong `src/config/ai-models.ts`: khoảng 0,034 USD một ảnh, khoảng 0,135 USD một bộ 4 góc, bước kiểm tra ảnh khoảng 0,001 USD. Với trần 10 bộ mỗi ngày thì tối đa khoảng 1,4 USD mỗi ngày mỗi instance. Nên đặt thêm spend cap ở AI Studio (xem mục 5 của [deploy-cloud-run.md](deploy-cloud-run.md)).

## 6. Quyền riêng tư

- Ảnh người dùng và ảnh nền chỉ nằm trong RAM của trình duyệt và trong request; client không ghi vào localStorage hay nơi nào khác.
- Máy chủ không lưu, không cache, không ghi log ảnh người dùng. Cache chỉ dành cho bộ hư cấu.
- Chế độ "Ảnh của tôi" chỉ mở khi người dùng tick xác nhận đây là ảnh của chính mình và đồng ý gửi cho Google Gemini; ảnh được thu nhỏ về JPEG trên máy trước khi gửi.
- Ảnh bị chặn khi có nhiều người, không thấy mặt hoặc trông chưa thành niên.
- Ảnh kết quả luôn có nhãn "Ảnh AI" và dòng công bố ảnh do AI tạo.

## 7. Lệnh kiểm tra

Không cần khóa, chạy dưới 5 giây mỗi lệnh:

```bash
npx tsx scripts/check-lookbook-content.ts   # catalog lời nhắc
npx tsx scripts/check-lookbook-client.ts    # parser SSE, state, session
npx tsx scripts/check-lookbook-prompt.ts    # schema chặt, ghép lời nhắc, khóa trang phục
npx playwright test tests/browser/lookbook.spec.ts   # giao diện, mock toàn bộ /api/ai/lookbook*
```

Smoke thật (tốn tiền, cần `GEMINI_API_KEY`), chạy `generateLookbook` thật rồi lưu ảnh để xem bằng mắt:

```bash
SMOKE_LOOKBOOK_COUNT=3 npx tsx scripts/smoke-lookbook.ts
```

Ba cấu hình hư cấu cố định: `ao-ngu-than-tay-chen` / `pho-co` / `dao_pho`, `ao-dai-raglan` / `vuon-hoa` / `tet`, `ao-tu-than` / `san-nha` / `vieng_tang`. Biến tùy chọn: `SMOKE_LOOKBOOK_PICK=3,1` (chọn đúng cấu hình), `SMOKE_MODEL_GENDER=male`, `SMOKE_OUT_DIR=<thư mục>`, `SMOKE_PERSON_PHOTO=<ảnh>` (kiểm tra ảnh rồi chạy thêm một bộ cá nhân; xem xong phải xoá ảnh). Ảnh mặc định ghi vào `artifacts/lookbook-smoke/<lần chạy>/`. Kết quả in mã lý do từng góc, `firstImageMs` và số lần gọi ảnh.
