# Nón lá chóp nhọn (non-la)

- **Loại:** accessory-layer
- **Dùng ở đâu:** Phòng phối đồ Studio, Cửa hàng Sen Ngọc và hiển thị trên nhân vật
- **Mô tả:** Chiếc nón lá truyền thống chóp nhọn đan từ lá nón trắng ngà, vành nứa uốn tròn khâu sợi cước mảnh mai. Sprite lớp đeo trên người được căn đúng vị trí trên canvas chuẩn, biểu tượng icon căn giữa khung vuông.
- **Mô tả chủ thể (EN):** Authentic traditional Vietnamese accessory: Iconic Vietnamese conical palm leaf hat with delicate circular bamboo ribbing and chin strap.
- **Ghi chú văn hóa:** Phụ kiện phục sức thể hiện khiếu thẩm mỹ tinh tế và phép tắc lễ nghi trang phục của người Việt qua từng thời đại.

## Danh sách tệp cần có

| Tên tệp | Mô tả bằng lời | Trạng thái |
| :--- | :--- | :---: |
| `non-la.png` | Lớp nón màu gốc, dải 528×416 gồm trước, nghiêng trái, sau | Đã tích hợp |
| `non-la--icon.png` | Biểu tượng phụ kiện trong cửa hàng | Đã có |

Lớp đội được bổ sung ngày 10/10/2026 bằng ImageGen từ icon hiện có và đầu An. Nguồn, prompt và điểm căn nằm trong [generation.json](../../references/headwear/generation.json); đóng gói lại bằng `python scripts/pack-headwear.py`. Mỗi ô 176×416 có alpha trong suốt, chỉ chứa nón và quai. Góc phải dùng ô nghiêng trái phản chiếu. Không thay icon gốc.

QA: `artifacts/headwear/non-la-{down,left,up,right}.png` và `closet-non-la.png`; kiểm tra chọn nón, thay nón, tháo, hoàn tác trong Studio và thử miễn phí trong Tủ đồ.
