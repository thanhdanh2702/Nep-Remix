# C3 — Bằng chứng xuất asset kỹ thuật

Ngày 07/10/2026. Người dùng cho phép xử lý cơ học như C2. Không thay đổi tạo hình đã chọn, gameplay hoặc asset C2.

## Kết quả

- 51 PNG mới + 8 file tái sử dụng; đường dẫn, kích thước và SHA-256 trong `assets/areas/chapter-3/manifest.json`.
- 23 test PASS sau chỉnh scale; coverage dòng thực thi của **helper C3 mới** đạt 100% (58/58). Không phải coverage của toàn bộ exporter, renderer hoặc gameplay.
- `npm run build`: PASS, Vite và server build thành công; có cảnh báo JS chunk trên 500 kB. Không sửa chia bundle trong phạm vi này.
- PNG nguồn được kiểm tra SHA-256 với source manifest, không thay đổi. Chưa commit, push hoặc sao chép sang worktree leader.

## RED → GREEN

1. Test helper được viết trước triển khai: ban đầu thiếu module, sau stub `NotImplementedError` khiến 10 test helper báo lỗi. Triển khai helper rồi 10 test PASS.
2. Test file production trước exporter báo thiếu asset. Chạy exporter và kiểm tra 14 test PASS.
3. Kiểm tra mắt phát hiện giấy trên bàn dựng đứng. Thêm test foreshortening trước sửa: FAIL vì chiều cao giấy 45 vượt giới hạn 20. Ép ngắn giấy theo mặt bàn, xuất lại rồi PASS.
4. Bổ sung kiểm tra nguồn bất biến, link gallery và nhánh helper; tổng 19 test PASS.
5. Người dùng yêu cầu nhân vật lớn hơn so với cảnh. Thêm test scale/điểm chân/manifest trước triển khai: ba lỗi vì thiếu helper `scene_actor` và trường `sceneActors`. Triển khai scale 1.35 ở cả ba preview và CG, giữ chân và sprite nguồn. Bổ sung nhánh từ chối ảnh rỗng, tổng 23 test PASS, helper coverage 58/58. Xem trực tiếp cả ba preview sau xuất. Không chạy lại build ở đợt chỉnh scale vì không đổi runtime code; kết quả build trên thuộc đợt xuất trước.

Lệnh chạy với Python có Pillow:

```sh
python3 scripts/export-c3-assets.py
python3 scripts/test_c3_asset_tools.py --coverage
npm run build
```

Môi trường này dùng `/Users/thanhdanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3` thay cho Python hệ thống. Pillow báo deprecation `getdata()` cho phiên bản tương lai; chưa ảnh hưởng kết quả hiện tại.

## Những gì đã kiểm tra

- Alpha nhị phân, RGB ẩn được xóa; pose giữ cùng chiều cao và điểm chân trong từng nhóm.
- NPC 176×416, portrait 128×128; portrait lấy từ chính pose.
- Hai áo strip 528×416, giới hạn bốn key xám, phủ trên 95% vùng thân An được đo ở cả ba góc.
- Crop giấy không chia đều cột; overlay giấy rời và nằm ngang theo mặt bàn.
- Overlay rương cùng canvas 1672×941, alpha chỉ trong ROI chỉ định; helper từ chối ROI ngoài ảnh.
- Hash và kích thước mọi file manifest, hash PNG nguồn, link ảnh và tài liệu trong gallery.
- Xem trực tiếp ảnh fitting raglan/cổ thuyền trên An, ba preview cảnh và hai overlay rương. Đây là QA hình ảnh xuất, không phải kiểm thử gameplay.

## Phần leader phải thực hiện

Đăng ký metadata chung và audit khi tích hợp; dùng đúng manifest production, không lấy ảnh `_raw` làm runtime. Nối thoại, puzzle Càn/Tốn, nội dung giấy tiếng Việt, việc ẩn vật sau thu thập, trạng thái rương, phối đồ và phần thưởng theo docs. Kiểm tra scale/hotspot/occlusion ở desktop và mobile, save/load và regression C1/C2.

Chưa chạy E2E C3, chưa thẩm định văn hóa hoặc sửa tay họa sĩ. Animation đi bộ, mặt trái, audio và pose tổ tiên C5 ngoài phạm vi. Không sửa `src/content/chapters/c3.json`, renderer, `data/runtime-assets.json` hoặc `data/asset-gaps.json` trong lần xuất này.
