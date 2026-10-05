import sys
sys.exit("Đã bãi bỏ ngày 05/10, screens dùng bản gen gốc")
import os, json, shutil

# 1. assets/paperdoll/README.md
os.makedirs('assets/paperdoll', exist_ok=True)
paperdoll_content = """# Hệ Thống Búp Bê Giấy (paperdoll)

- **Loại:** paperdoll-layer
- **Dùng ở đâu:** Phòng phối đồ Studio, luồng khởi tạo nhân vật tại Sảnh chính, và hoạt cảnh mặc đồ
- **Mô tả:** Hệ thống búp bê giấy dạng mô-đun xếp tầng nhiều lớp cho cả hai nhân vật nam và nữ. Khối thân người đứng thẳng tự nhiên, các khớp vai, cổ và eo được căn khớp pixel hoàn hảo với hệ thống trang phục áo dài và phụ kiện. Tông màu da (kem sáng, kem đào, đào nhạt, nâu củ nâu) và màu tóc (đen mun, nâu hạt dẻ, vàng khói) được hoán đổi thời gian thực bằng bảng màu trên Canvas, không vẽ thêm bản vẽ màu riêng biệt.
- **Mô tả chủ thể (EN):** Modular historical Vietnamese pixel art paperdoll sprite base, including male and female body bases, layered front and back hairstyles for short, medium, and long hair, expressive facial features, and default avatar presets.
- **Ghi chú tạo hình:** Toàn bộ các lớp đồ họa phải xuất đủ khổ canvas chuẩn, không cắt bớt vùng trong suốt (no trim) để khi xếp chồng tại tọa độ gốc sẽ khớp tự nhiên.

## Danh sách tệp cần có

| Tên tệp | Mô tả bằng lời | Trạng thái |
| :--- | :--- | :---: |
| `body-female.png` | Khối cơ thể nữ dáng thanh thoát, chuẩn bị ghép trang phục | ⬜ chưa gen |
| `body-male.png` | Khối cơ thể nam dáng đĩnh đạc, vai rộng vừa phải | ⬜ chưa gen |
| `shadow.png` | Bóng đổ chân nhân vật hình elip mờ dưới mặt sàn | ⬜ chưa gen |
| `pants-white.png` | Quần lụa dài màu giấy dó rủ mềm mại chạm mu bàn chân | ⬜ chưa gen |
| `pants-black.png` | Quần lụa đen bóng truyền thống mặc cùng áo ngũ thân | ⬜ chưa gen |
| `hair-short-front.png` | Mái tóc ngắn cá tính lớp phía trước che trán và mang tai | ⬜ chưa gen |
| `hair-short-back.png` | Lớp tóc ngắn phía sau gáy | ⬜ chưa gen |
| `hair-medium-front.png` | Mái tóc ngang vai dịu dàng lớp phía trước buông lơi | ⬜ chưa gen |
| `hair-medium-back.png` | Lớp tóc ngang vai phía sau lưng | ⬜ chưa gen |
| `hair-long-front.png` | Mái tóc dài truyền thống rẽ ngôi lớp phía trước | ⬜ chưa gen |
| `hair-long-back.png` | Suối tóc dài đen nhánh buông dài sau lưng | ⬜ chưa gen |
| `face-neutral.png` | Khuôn mặt nét vẽ thanh tú, ánh mắt nhìn thẳng tự nhiên | ⬜ chưa gen |
| `face-smile.png` | Nụ cười mỉm duyên dáng, khóe mắt ánh lên niềm vui | ⬜ chưa gen |
| `face-blink.png` | Mắt khép nhẹ thư thái phục vụ hoạt cảnh chớp mắt | ⬜ chưa gen |
| `glasses-round.png` | Kính mắt gọng tròn trí thức phụ kiện khuôn mặt | ⬜ chưa gen |
| `avatar-preset-female.png` | Chân dung đại diện nữ mặc định cài đặt sẵn | ⬜ chưa gen |
| `avatar-preset-male.png` | Chân dung đại diện nam mặc định cài đặt sẵn | ⬜ chưa gen |
"""
with open('assets/paperdoll/README.md', 'w', encoding='utf-8') as f:
    f.write(paperdoll_content)

# 2. Garments: 10 items
garments_info = {
    "ao-tu-than": ("Áo tứ thân mớ ba mớ bảy", "Áo tứ thân truyền thống vùng đồng bằng Bắc Bộ gồm bốn vạt vải, hai vạt trước buộc chéo duyên dáng trước bụng, kết hợp áo yếm lót trong màu đỏ son hoặc màu hoa đào. Thân áo mang sắc màu củ nâu mộc mạc.", "Traditional Vietnamese Ao Tu Than four-panel folk garment with split front flaps tied at waist, layered over inner halter bib yem"),
    "ao-ngu-than-tay-chen": ("Áo ngũ thân tay chẽn", "Áo ngũ thân phom đứng năm vạt kín đáo, cổ đứng lập lĩnh cài khuy bên hữu, tay chẽn gọn gàng tôn vinh khí chất trang nghiêm, thanh lịch của cả nam và nữ. Màu vải nền chàm thẫm hoặc xanh ngọc.", "Historical Vietnamese five-panel tight-sleeved Ao Ngu Than gown with standing mandarin collar, five traditional right-side buttons"),
    "ao-ngu-than-tay-thung": ("Áo tấc tay thụng đại lễ", "Áo tấc ngũ thân thụng rộng trang trọng dùng trong các dịp đại lễ, tế tự và hôn lễ cổ truyền. Cánh tay áo thụng dài chấm gối, tà áo buông rộng rủ nếp gấm vàng hoàng yến hoặc men lam quý phái.", "Ceremonial wide-sleeved Ao Tac formal robe with flowing expansive sleeves, luxurious silk drape for solemn rituals"),
    "ao-dai-lemur": ("Áo dài Lemur 1934", "Áo dài tân thời thời kỳ đầu lấy cảm hứng canh tân năm 1934 với cổ áo cánh sen mềm mại, vai bồng duyên dáng, thân áo chiết eo nhẹ tôn nét yêu kiều của phụ nữ Hà thành.", "1930s pioneering modern Vietnamese Ao Dai Lemur style featuring stylized soft lotus leaf collar and gentle feminine puffed shoulder sleeves"),
    "ao-dai-tan-thoi-vang-mo-ga": ("Áo dài tân thời cổ đứng", "Áo dài tân thời cuối thập niên 1930 hoàn thiện phom dáng cổ đứng truyền thống thanh tao, không còn vai bồng, tà áo lụa màu vàng mỡ gà rủ thướt tha mềm mại theo từng bước chân.", "Late 1930s elegant tailored Vietnamese modern Ao Dai in primrose yellow silk, crisp standing collar without puffed sleeves"),
    "ao-dai-raglan": ("Áo dài tay raglan 1960", "Áo dài cải tiến tay raglan ra đời tại Sài Gòn đầu thập niên 1960, nối tay chéo từ cổ nách giúp thân áo ôm sát không bị nhăn nách, tà áo buông thẳng duyên dáng màu xanh ngọc bích.", "1960s iconic Saigon Raglan Ao Dai with seamless diagonal sleeve tailoring, wrinkle-free fitted bodice in emerald turquoise silk"),
    "ao-dai-co-thuyen": ("Áo dài cổ thuyền bà Nhu", "Áo dài cổ thuyền khoét rộng giải phóng phần cổ kiêu sa, đường nét may phóng khoáng kết hợp tà lụa màu lam khói hoặc hồng sen, mang đậm dấu ấn phong cách thời trang Sài Gòn thập niên 1960.", "1960s open boat-neck neckline Ao Dai gown showcasing graceful collarbones, tailored bodice in smoky blue silk"),
    "ao-dai-cuoi-phin": ("Áo dài cưới vải phin 1982", "Chiếc áo dài cưới giản dị thời bao cấp may bằng vải phin trắng ngà, trên ngực thêu cành hoa đào nhỏ sắc đỏ son e ấp, biểu tượng của sự thủy chung và tình yêu vượt qua gian khó.", "1980s austere plain white cotton wedding Ao Dai adorned with modest hand-embroidered red peach blossom sprig on chest"),
    "ao-dai-popolin": ("Áo dài popolin hoa cúc", "Áo dài vải popolin in họa tiết hoa cúc li ti màu hoàng yến trên nền chàm sáng, phong cách trang nhã của các nữ công nhân và cô giáo thời kỳ đổi mới thập niên 1980.", "1980s retro everyday poplin textile Ao Dai sprinkled with dainty golden chrysanthemum floral sprigs on indigo blue background"),
    "ao-ngu-than-remix-2026": ("Áo ngũ thân Remix 2026", "Thiết kế đương đại kết hợp tinh hoa cấu trúc năm tà ngũ thân cổ truyền với kỹ thuật may đo thời trang thể thao thế hệ mới, sắc đỏ son kết hợp xanh men lam phá cách kiêu hãnh.", "Contemporary 2026 futuristic heritage hybrid Ao Dai fusing traditional five-panel modular structure with modern streetwear tailoring")
}

for gid, (gname, gdesc, gen) in garments_info.items():
    gdir = os.path.join('assets/garments', gid)
    os.makedirs(gdir, exist_ok=True)
    content = f"""# {gname} ({gid})

- **Loại:** garment-layer
- **Dùng ở đâu:** Phòng phối đồ Studio, Tủ đồ nhân vật và các phân cảnh chuyển đổi trang phục
- **Mô tả:** {gdesc} Sprite được vẽ ở thang độ xám chuẩn để Canvas thực hiện hoán đổi màu sắc thời gian thực theo 4 cấp độ sáng tối. Kích thước xuất đủ canvas chuẩn, khớp hoàn toàn với khối thân paperdoll.
- **Mô tả chủ thể (EN):** Grayscale garment layer of {gen}, rendered with crisp blocky pixels ready for palette swapping.
- **Ghi chú văn hóa:** Y phục phản ánh tinh hoa cắt may và luân lý ngũ thường của y phục truyền thống Việt Nam qua các thời kỳ lịch sử.

## Danh sách tệp cần có

| Tên tệp | Mô tả bằng lời | Trạng thái |
| :--- | :--- | :---: |
| `{gid}.png` | Lớp trang phục mặc trên người dạng thang xám (loại garment-layer) | ⬜ chưa gen |
| `{gid}--thumb.png` | Ảnh thu nhỏ tà áo hiển thị trong ngăn tủ đồ (loại garment-thumb) | ⬜ chưa gen |
"""
    with open(os.path.join(gdir, 'README.md'), 'w', encoding='utf-8') as f:
        f.write(content)

# 3. Accessories: 10 items
accessories_info = {
    "khan-van-den": ("Khăn vấn nhung đen", "Khăn vấn tóc bằng nhung đen quấn tròn ôm khít đầu, tạo nét đoan trang thùy mị chuẩn mực phụ nữ Bắc Bộ xưa.", "Traditional northern Vietnamese black velvet rolled headband turban wrapping neatly around hair"),
    "khan-van-hoang-yen": ("Khăn vấn hoàng yến", "Khăn vấn gấm dệt chỉ vàng hoàng yến sang trọng, dùng phối cùng áo tấc và áo ngũ thân trong dịp lễ tiết.", "Ornate imperial yellow brocade rolled hair turban embroidered with subtle auspicious geometric textures"),
    "khan-mo-qua": ("Khăn mỏ quạ", "Khăn vuông vải thô nhuộm củ nâu gập chéo hình tam giác buộc thắt mỏ quạ trước trán duyên dáng cùng áo tứ thân.", "Traditional triangular folded rustic brown cotton crow-beak headscarf knotted snugly at the chin"),
    "non-quai-thao": ("Nón ba tầm quai thao", "Chiếc nón lá phẳng rộng vành đan sợi giang tinh xảo, gắn dải quai thao bằng tơ tằm dệt se đôi rủ hai bên vai.", "Grand historic Ba Tam flat palm hat with luxurious dangling woven silk quai thao tassels"),
    "non-la": ("Nón lá chóp nhọn", "Chiếc nón lá truyền thống chóp nhọn đan từ lá nón trắng ngà, vành nứa uốn tròn khâu sợi cước mảnh mai.", "Iconic Vietnamese conical palm leaf hat with delicate circular bamboo ribbing and chin strap"),
    "guoc-moc": ("Guốc mộc quai nhung", "Đôi guốc gỗ tiện từ gỗ mỡ bóng mộc mạc, quai ngang bản rộng bằng nhung đen êm ái.", "Pair of traditional carved rustic wooden clogs with soft wide black velvet foot straps"),
    "hai-theu": ("Hài thêu hoa sen", "Đôi hài vải mũi cong thêu chỉ tơ hình búp sen màu đỏ son tao nhã của phụ nữ quý tộc thời Nguyễn.", "Exquisite curved-toe palace velvet slippers hand-embroidered with vermilion silk lotus buds"),
    "kieng-bac": ("Kiềng bạc chạm hoa", "Chiếc kiềng bạc sáng tròn đeo cổ chạm khắc chìm hoa văn hoa cúc và mây cuộn truyền thống.", "Solid sterling silver torque choker necklace delicately engraved with stylized chrysanthemums and cloud swirls"),
    "kinh-mat-meo": ("Kính mắt mèo thời thượng", "Chiếc kính râm mắt mèo gọng nhựa đồi mồi sành điệu của quý cô Sài Gòn thập niên 1960.", "Trendy 1960s cat-eye sunglasses with tortoiseshell acetate frames and dark vintage tinted lenses"),
    "quat-lua": ("Quạt lụa thêu hoa", "Chiếc quạt tròn lụa tơ tằm căng trên nan tre thanh mảnh, thêu cành mai vàng và chim én mùa xuân.", "Round silk hand fan stretched on polished bamboo ribs, hand-embroidered with delicate spring blossoms")
}

for aid, (aname, adesc, aen) in accessories_info.items():
    adir = os.path.join('assets/accessories', aid)
    os.makedirs(adir, exist_ok=True)
    content = f"""# {aname} ({aid})

- **Loại:** accessory-layer
- **Dùng ở đâu:** Phòng phối đồ Studio, Cửa hàng Sen Ngọc và hiển thị trên nhân vật
- **Mô tả:** {adesc} Sprite lớp đeo trên người được căn đúng vị trí trên canvas chuẩn, biểu tượng icon căn giữa khung vuông.
- **Mô tả chủ thể (EN):** Authentic traditional Vietnamese accessory: {aen}.
- **Ghi chú văn hóa:** Phụ kiện phục sức thể hiện khiếu thẩm mỹ tinh tế và phép tắc lễ nghi trang phục của người Việt qua từng thời đại.

## Danh sách tệp cần có

| Tên tệp | Mô tả bằng lời | Trạng thái |
| :--- | :--- | :---: |
| `{aid}.png` | Lớp phụ kiện đeo/cầm trên người căn chuẩn canvas (loại accessory-layer) | ⬜ chưa gen |
| `{aid}--icon.png` | Biểu tượng phụ kiện trong cửa hàng và tủ đồ (loại accessory-icon) | ⬜ chưa gen |
"""
    with open(os.path.join(adir, 'README.md'), 'w', encoding='utf-8') as f:
        f.write(content)

# 4. Motifs: 3 separate folders
motifs_info = {
    "hoa-sen-theu-tay": ("Hoa sen thêu tay", "Mẫu hoa văn hoa sen nở cách điệu với những đường nét tơ tằm uốn lượn mềm mại, bố trí trang trọng ở ngực áo hoặc góc vạt trước của áo dài.", "Stylized hand-embroidered blooming lotus blossom motif with graceful swirling silk petals, positioned on chest or flap"),
    "van-may-song-nuoc": ("Văn mây sóng nước thủy ba", "Hoa văn sóng nước thủy ba cuộn trào kết hợp các dải mây tản lãng đãng, chạy viền gấu áo và cổ tay áo tấc trang trọng.", "Traditional royal undulating water waves and floating auspicious cloud ribbon borders along garment hems"),
    "hoa-van-bat-giac": ("Hoa văn hình học bát giác", "Mẫu mạng lưới hoa văn bát giác kỷ hà liên hoàn dệt gấm cổ truyền, tuyệt đối không chứa chữ viết ký tự, dùng phủ chìm trên toàn bộ mặt vải áo ngũ thân.", "Seamless repeating geometric octagonal lattice brocade pattern tile without text characters, used as fabric overlay")
}

# Clean old motifs root readme or keep it as index
for mid, (mname, mdesc, men) in motifs_info.items():
    mdir = os.path.join('assets/motifs', mid)
    os.makedirs(mdir, exist_ok=True)
    content = f"""# {mname} ({mid})

- **Loại:** motif
- **Dùng ở đâu:** Phòng phối đồ Studio, phủ bề mặt vải hoặc thêu điểm xuyết trên vạt áo
- **Mô tả:** {mdesc} Họa tiết được thiết kế theo nguyên tắc ô lặp vô tận (seamless repeat), màu sắc sử dụng sắc vàng hoàng yến hoặc bạc kim tuyến chìm nhã nhặn.
- **Mô tả chủ thể (EN):** Seamless traditional Vietnamese textile motif tile: {men}.
- **Ghi chú văn hóa:** Hoa văn mang ý nghĩa cầu chúc bình an, thanh cao và thuận hòa với thiên nhiên đất trời.

## Danh sách tệp cần có

| Tên tệp | Mô tả bằng lời | Trạng thái |
| :--- | :--- | :---: |
| `{mid}.png` | Ô hoa văn dệt lặp liền viền hoặc họa tiết định vị (loại motif) | ⬜ chưa gen |
"""
    with open(os.path.join(mdir, 'README.md'), 'w', encoding='utf-8') as f:
        f.write(content)

print("Paperdoll, garments, accessories, motifs successfully built!")
