# Nón ba tầm quai thao (non-quai-thao)

- **Loại:** accessory-layer
- **Dùng ở đâu:** Phòng phối đồ Studio, Cửa hàng Sen Ngọc và hiển thị trên nhân vật
- **Mô tả:** Chiếc nón lá phẳng rộng vành đan sợi giang tinh xảo, gắn dải quai thao bằng tơ tằm dệt se đôi rủ hai bên vai. Sprite lớp đeo trên người được căn đúng vị trí trên canvas chuẩn, biểu tượng icon căn giữa khung vuông.
- **Mô tả chủ thể (EN):** Authentic traditional Vietnamese accessory: Grand historic Ba Tam flat palm hat with luxurious dangling woven silk quai thao tassels.
- **Ghi chú văn hóa:** Phụ kiện phục sức thể hiện khiếu thẩm mỹ tinh tế và phép tắc lễ nghi trang phục của người Việt qua từng thời đại.

## Danh sách tệp cần có

| Tên tệp | Mô tả bằng lời | Trạng thái |
| :--- | :--- | :---: |
| `non-quai-thao.png` | Lớp nón màu gốc, dải 528×416 gồm trước, nghiêng trái, sau | Đã tích hợp |
| `non-quai-thao--icon.png` | Biểu tượng phụ kiện trong cửa hàng | Đã có |

Lớp đội được bổ sung ngày 10/10/2026 bằng ImageGen từ icon hiện có và đầu An, giữ màu nan và quai đỏ của icon. Nguồn, prompt và điểm căn nằm trong [generation.json](../../references/headwear/generation.json); đóng gói lại bằng `python scripts/pack-headwear.py`. Mỗi ô 176×416 có alpha trong suốt, chỉ chứa nón và quai. Góc phải dùng ô nghiêng trái phản chiếu. Không thay icon gốc.

QA: `artifacts/headwear/non-quai-thao-{down,left,up,right}.png` và `closet-non-quai-thao.png`; kiểm tra chọn nón, thay nón, tháo, hoàn tác trong Studio và thử miễn phí trong Tủ đồ.
