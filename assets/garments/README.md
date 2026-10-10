# Đặc tả bộ áo mặc trên An và hiển thị trong tủ đồ

Trạng thái ngày 07/10/2026: đã tạo và tích hợp 10 áo, mỗi áo có dải ba góc mặc, góc phải riêng, bản treo và icon; tứ thân có thêm hai file váy. Bộ mới nằm trong các thư mục áo tương ứng, dùng chung trong Studio và Tủ đồ. Ảnh nguồn và prompt ImageGen được lưu tại [references/wearables/generation.json](../references/wearables/generation.json).

## Một thiết kế, các cách trình bày

Chốt bản thiết kế áo trước: cấu trúc thân/tà, dáng cổ, đường ráp tay, hò khuy, chất liệu và họa tiết. Từ bản này mới làm các góc mặc trên An và hình áo treo. Icon tủ đồ được thu từ bản treo đã duyệt, không tạo một áo khác bằng prompt độc lập.

- Bản mặc, bản treo, icon phải có cùng cổ, số/vị trí khuy, đường may, hình dáng vạt, màu và họa tiết. Khuy bên phải luôn tính theo cơ thể người mặc; không tính theo người nhìn ảnh.
- Bản treo có thể duỗi tay áo theo trọng lực và thay nếp gấp do tư thế, nhưng không được đổi phom, chiều dài hoặc thêm/bớt chi tiết. Họa tiết đặt trên cùng vị trí tương đối của cùng thân/tà ở mọi góc.
- Giao diện dùng cùng bảng màu cho áo trên An và áo trong tủ. Không ép mọi áo có hoa sen; hoa văn chỉ xuất hiện khi README của áo yêu cầu.
- Áo treo không chứa người, mannequin, tay, quần, váy hoặc phụ kiện. Móc treo là một lớp giao diện riêng, không vẽ vào lớp vải sẽ đổi màu.
- Nếu đóng gói atlas về sau, atlas chỉ được ghép từ các file hậu tố `--hanging` của PNG đã duyệt. Không sinh lại cả catalog bằng một prompt khác.

## Tệp đầu ra trong thư mục của từng áo

| Tệp | Mục đích và quy cách |
| --- | --- |
| `<id>.png` | Lớp mặc trong suốt, dải **528×416**, ba ô **176×416** theo thứ tự chính diện, nghiêng trái, sau lưng. Không trim. |
| `<id>--right.png` | Ô nghiêng phải **176×416**, căn đúng khung An. Góc riêng để giữ đúng bên khuy, hò áo và các chi tiết bất đối xứng. |
| `<id>--hanging.png` | Cùng chiếc áo ở tư thế treo chính diện, nền trong suốt, khung **176×416**, giữ trọn tay và gấu. |
| `<id>--icon.png` | Icon **96×96** lấy từ bản treo, giữ tỷ lệ và đủ cả áo, không vẽ lại thiết kế. |

Tứ thân có thêm lớp váy riêng được ghi ở README của nó. Nếu một mẫu cần che một phần bàn tay/thân nền, dùng mặt nạ che phủ phù hợp với từng góc, không vẽ da hoặc bàn tay vào PNG áo để che lỗi ghép.

## Căn áo để An mặc được

- Nhân vật tham chiếu là An hiện có trong `assets/characters/an/`, không phải paperdoll cũ hoặc hình người trưởng thành trong catalog.
- Phong cách nét, độ chi tiết, bóng vải và hướng sáng phải khớp sprite An hiện có. Tỷ lệ chibi được quyết định bởi cơ thể An, không tự kéo dài thân hoặc thu nhỏ đầu để hợp hình áo treo.
- Khung An **176×416**, điểm chân **(88,400)**. Các góc đứng tương ứng ô sprite **0: chính diện, 22: trái, 66: sau, 44: phải** trong sheet 8 cột của An. Tham chiếu chính thức là các layer gốc; ảnh guide chỉ dùng kiểm tra.
- Giữ nguyên vị trí cổ, vai, khuỷu tay, cổ tay, hông và chân của từng tư thế. Dáng áo phải được may theo An; không kéo giãn cả áo treo rồi phủ lên cơ thể. Chính diện theo tư thế hai tay của An đặt phía trước, các góc khác theo pose thật của góc đó.
- Giữ khoảng trong suốt phía trên vai và quanh áo. Chỉ bản preview mới được crop; lớp mặc phải giữ canvas đầy đủ để chồng tại gốc tọa độ.
- PNG áo không chứa đầu, tóc, da, bàn tay, chân, giày, bóng nền hay móc treo. Đồ mặc bên dưới tách riêng nếu README yêu cầu; không trộn quần mặc định của An vào áo.
- Mẫu áo mới thay các lớp áo gốc `outfit_main` và `outfit_back` khi ghép thử. Không chồng hai bộ áo lên nhau hoặc để cổ/tay áo gốc lòi ra ngoài.
- Xem đủ bốn hướng với tóc dài/tóc ngắn: tóc ở trước hoặc sau áo theo tư thế; cổ áo không phủ lên cằm, tay không xuyên qua vải, đường xẻ không lộ vùng da sai.

## Màu và chất liệu

Lớp vải có thể đổi màu được lưu bằng thang xám, dùng hệ gradient-map theo `assets/README.md` và `StudioCharacter.tsx`. Bản mặc và bản treo phải dùng cùng quy ước sắc độ; icon được kết xuất với cùng màu mặc định của món áo.

Renderer hiện tại dùng cùng gradient-map cho áo mặc và áo treo. Phần vải trung tính đổi màu; các chi tiết có màu riêng như cành đào, hoa cúc, yếm và viền men lam được giữ màu. `scripts/build-wearable-assets.py` đăng ký các góc vào khung An và lấy icon từ bản treo với bảng màu mặc định. Những thiết kế tương lai cần đổi nhiều vật liệu độc lập vẫn phải bổ sung lớp/mặt nạ riêng.

Áo cổ thuyền đã chuyển sang nguồn `registration: full-frame`: cả năm canvas được thu nhỏ đồng tỷ lệ rồi cắt ô, không căn lại bằng bounding box và không kéo giãn hai nửa áo. Các mẫu cũ giữ chế độ đóng gói hiện có cho đến khi được vẽ lại đúng pose. Nguồn mới nên dùng full-frame và kiểm tra trực tiếp trên An trước khi xuất icon.

## Tích hợp hiện tại và phạm vi

Các phần đã hoạt động trong Studio và Tủ đồ:

- Renderer đọc dải ba ô và dùng hậu tố `--right` của PNG cho góc phải, giữ bên hò/khuy của các mẫu bất đối xứng.
- Khay chọn và Tủ đồ đọc trực tiếp hậu tố `--hanging` của PNG của từng áo; móc được vẽ bằng lớp SVG dùng chung. Atlas cũ không còn được tham chiếu.
- Tứ thân thay quần bằng hậu tố `--bottom` của PNG/hậu tố `--bottom-right` của PNG, tab đổi màu hiển thị tên Váy. Áo tấc che lớp bàn tay trong tư thế cung thủ để không xuyên qua ống tay thụng.
- Các áo modular dùng mảnh cổ sạch dưới áo để không lộ đường viền áo lót gốc. Lớp bàn tay loại bỏ những pixel vải/thêu sót lại của cổ tay áo gốc, giữ vùng da và đường viền tay.
- Các áo mặc cùng quần dùng chung `assets/characters/an/studio-trousers.png` và góc phải `studio-trousers--right.png`: quần lụa hai ống rõ, thang xám, eo y=222 và gấu đến y=387. Không dùng silhouette quần gốc có mảng gấu bè như váy. Model, gương, Lookbook và khay Quần cùng chọn asset qua `studioBottomAsset()` và đổi màu bằng `recolorLayer()`. Mặc định là màu tối; màu quần đã lưu tiếp tục được giữ nguyên.
- Quần mới thay lớp `bottom`/`legs` gốc trong tư thế thử đồ; lớp giày chỉ lấy vùng bàn chân để không lộ viền gấu quần và nét sàn cũ. Tứ thân tiếp tục dùng lớp váy riêng.
- Bộ bốn góc đứng không phải bộ animation. Nếu muốn giữ trang phục khi An đi trong sảnh/cốt truyện, phải làm các pose tương ứng animation thật của An và cập nhật renderer; không coi dải đứng là đã hỗ trợ đi bộ.
- Tên, mô tả và màu mặc định trong catalog đã được đồng bộ với README: các mẫu lấy cảm hứng hoặc mẫu của câu chuyện được ghi rõ.

## Điều kiện duyệt bộ mới

1. Đúng các dấu hiệu cấu trúc được mô tả riêng cho áo; phân biệt tư liệu lịch sử với thiết kế lấy cảm hứng hoặc dữ liệu truyện.
2. Ghép vừa An ở bốn góc, không hở cổ/tay áo nền và không sai thứ tự che phủ.
3. Bản mặc, bản treo và icon cùng thiết kế, họa tiết và màu; kiểm tra cạnh nhau với màu mặc định và ít nhất một màu khác.
4. File mặc đúng kích thước, không trim, alpha sạch, không lẫn người/móc/nền. Icon chỉ được xuất sau khi bản treo và bản mặc cùng đạt.

Tư liệu chung: [bản đối chiếu văn hóa](../../docs/04-culture/garment-verification.md). Nguồn cụ thể và giới hạn xác thực được ghi tại README từng áo.

QA ghép quần: chạy dev server rồi `npx tsx scripts/inspect-trouser-fit.ts after`. Ảnh 10 áo × 4 hướng × 2 màu nằm ở `artifacts/trousers/after/`; regression test `tests/browser/trouser-fit.spec.ts` kiểm tra chọn đúng asset, đổi màu quần không đổi áo/giày, và hai gấu quần tách riêng. Tạo lại riêng lớp quần từ nguồn đã lưu: `python scripts/build-wearable-assets.py --trousers-only`, sau đó chạy `python scripts/audit-assets.py` để cập nhật registry.
