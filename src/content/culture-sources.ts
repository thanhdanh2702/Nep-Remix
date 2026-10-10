// Sources checked on 10 October 2026. Notes on each card delimit what a source supports.
export const cultureSources = {
  'hue-ao-dai-2025': {
    title: 'Áo dài Việt Nam qua các thời kỳ lịch sử: Một triển lãm không thể bỏ qua',
    publisher: 'Sở Văn hóa, Thể thao và Du lịch thành phố Huế',
    url: 'https://svhttdl.hue.gov.vn/tin-trong-nuoc/ao-dai-viet-nam-qua-cac-thoi-ky-lich-su-mot-trien-lam-khong-the-bo-qua.html',
  },
  'vnmh-ngu-than-2021': {
    title: 'Bảo tàng Lịch sử quốc gia tiếp nhận áo dài ngũ thân truyền thống',
    publisher: 'Bảo tàng Lịch sử quốc gia',
    url: 'https://baotanglichsu.vn/vi/Articles/3090/72685/bao-tang-lich-su-quoc-gia-tiep-nhan-ao-dai-ngu-than-truyen-thong.html',
  },
  'swm-ao-dai-2016': {
    title: 'Áo dài xưa và nay',
    publisher: 'Bảo tàng Phụ nữ Nam Bộ',
    url: 'https://baotangphunu.com/ao-dai-xua-va-nay/',
  },
  'swm-ao-dai-2020': {
    title: 'Nét duyên dáng của chiếc áo dài Việt Nam',
    publisher: 'Bảo tàng Phụ nữ Nam Bộ',
    url: 'https://baotangphunu.com/net-duyen-dang-cua-chiec-ao-dai-viet-nam/',
  },
  'vwm-fashion': {
    title: 'Thời trang nữ',
    publisher: 'Bảo tàng Phụ nữ Việt Nam',
    url: 'https://baotangphunu.org.vn/fr/thoi-trang-nu-3/',
  },
  'nhat-binh-2022': {
    title: 'Áo Nhật bình – Di sản văn hóa quý của Cố đô Huế',
    publisher: 'TS. Phan Thanh Hải · Tạp chí Thế giới Di sản',
    url: 'https://thegioidisan.vn/vi/ao-nhat-binh-di-san-van-hoa-quy-cua-co-do-hue.html',
  },
  'vnmh-y-phuc': {
    title: 'Y phục thời Nguyễn tại Bảo tàng Lịch sử quốc gia',
    publisher: 'Bảo tàng Lịch sử quốc gia',
    url: 'https://baotanglichsu.vn/vi/Articles/2001/66867/y-phuc-thoi-nguyen-tai-bao-tang-lich-su-quoc-gia.html',
  },
  'vnp-giao-linh': {
    title: 'Áo Giao Lĩnh: Ngược dòng lịch sử cùng tinh hoa cổ phục Việt',
    publisher: 'VietnamPlus · Thông tấn xã Việt Nam',
    url: 'https://www.vietnamplus.vn/video-ao-giao-linh-nguoc-dong-lich-su-cung-tinh-hoa-co-phuc-viet-post609553.vnp',
  },
  'hoian-ba-ba-2014': {
    title: 'Quần chân con và áo bà ba · Bản tin Bảo tồn Di sản 03(27), 2014',
    publisher: 'Lê Thị Tuấn · Trung tâm Quản lý Bảo tồn Di sản Văn hóa Hội An',
    url: 'https://hoianheritage.net/uploads/download/thi-tuan-quan-chan-con-va-ao-ba-ba.pdf',
  },
  'unesco-mother-goddesses': {
    title: 'Practices related to the Viet beliefs in the Mother Goddesses of Three Realms',
    publisher: 'UNESCO · Hồ sơ di sản số 01064',
    url: 'https://ich.unesco.org/en/RL/practices-related-to-the-viet-beliefs-in-the-mother-goddesses-of-three-realms-01064',
  },
  'trc-poplin': {
    title: 'Poplin · TRC Needles',
    publisher: 'Textile Research Centre, Leiden',
    url: 'https://www.trc-leiden.nl/trc-needles/textile/materials/woven-and-interlocking-materials/poplin',
  },
} as const;

export type CultureSourceId = keyof typeof cultureSources;
export const cultureSourcesCheckedOn = '10/10/2026';
