export interface DocumentMetadataField {
  label: string;
  value: string;
}

export interface DocumentContent {
  id: 'doc-c3-bien-nhan' | 'doc-c3-so-goc' | 'doc-c3-thu-thoa-thuan' | 'doc-c3-ban-sua';
  title: string;
  subtitle: string;
  itemId?: string;
  dialogueId: string;
  clueId?: string;
  imagePath: string;
  metadata: DocumentMetadataField[];
  summaryText: string;
  highlightText: string;
  comparativeRole: string;
}

export const C3_DOCUMENTS: Record<string, DocumentContent> = {
  'doc-c3-bien-nhan': {
    id: 'doc-c3-bien-nhan',
    title: 'Biên Nhận Khoản Tiền Sửa Hồ Sơ',
    subtitle: 'Chứng cứ hư cấu tại Đa Kao, Sài Gòn năm 1962',
    itemId: 'bien_nhan_tien_thay_boi',
    dialogueId: 'd-c3-mua-chuoc',
    clueId: 'clue-mua-chuoc-thay-boi',
    imagePath: 'assets/areas/chapter-3/doc-c3-bien-nhan.png',
    metadata: [
      { label: 'Người chi tiền', value: 'Bà Lớn' },
      { label: 'Người nhận tiền', value: 'Thầy Ba Càn' },
      { label: 'Khoản tiền', value: '2.000 đồng' },
      { label: 'Bối cảnh', value: 'Năm 1962, Đa Kao, Sài Gòn' },
    ],
    summaryText:
      'Biên nhận ghi nhận Bà Lớn đưa Thầy Ba Càn 2.000 đồng để viết lại nhận xét trong hồ sơ Mai–Vinh, nhằm buộc Mai phải chấp nhận sự sắp đặt hôn nhân và chuyển giao tiệm may.',
    highlightText: 'Bà Lớn đưa Thầy Ba Càn 2.000 đồng để viết lại nhận xét hồ sơ Mai–Vinh',
    comparativeRole:
      'Xác nhận có giao dịch tiền bạc nhằm mua chuộc. Khoản 2.000 đồng này được dẫn chiếu trực tiếp trong Thư thỏa thuận để đối chiếu mục đích sửa hồ sơ.',
  },
  'doc-c3-so-goc': {
    id: 'doc-c3-so-goc',
    title: 'Sổ Hồ Sơ Gốc Mai–Vinh (1962)',
    subtitle: 'Hồ sơ nguyên bản thu hồi nguyên vẹn từ rương Bát Quái',
    itemId: 'so_tu_vi_nguyen_ban_1962',
    dialogueId: 'd-c3-so-tu-vi',
    clueId: 'clue-so-tu-vi-goc',
    imagePath: 'assets/areas/chapter-3/doc-c3-so-goc.png',
    metadata: [
      { label: 'Hồ sơ', value: 'Mai – Vinh' },
      { label: 'Năm lập', value: '1962' },
      { label: 'Tình trạng', value: 'Nguyên bản, không có điều kiện áp đặt' },
    ],
    summaryText:
      'Sổ hồ sơ Mai–Vinh ghi nhận nội dung ban đầu: hoàn toàn không có dòng yêu cầu Mai phải làm lẽ hoặc phải giao quyền quyết định căn tiệm may.',
    highlightText: 'Không có dòng buộc Mai làm lẽ hay giao quyền quyết định tiệm',
    comparativeRole:
      'Mốc nội dung gốc để so sánh với bản sửa. Sổ gốc chứng minh việc ép hôn và chiếm tiệm không hề có từ đầu; lời phán bói toán không quyết định phẩm giá Mai.',
  },
  'doc-c3-thu-thoa-thuan': {
    id: 'doc-c3-thu-thoa-thuan',
    title: 'Thư Thỏa Thuận Sửa Hồ Sơ',
    subtitle: 'Thư tay xác nhận yêu cầu chèn thêm lời phán áp đặt',
    itemId: 'thu_tay_thoa_thuan_boi_toan',
    dialogueId: 'd-c3-thoa-thuan',
    clueId: 'clue-thoa-thuan-boi-toan',
    imagePath: 'assets/areas/chapter-3/doc-c3-thu-thoa-thuan.png',
    metadata: [
      { label: 'Hồ sơ dẫn chiếu', value: 'Mai – Vinh' },
      { label: 'Khoản tiền nhận', value: '2.000 đồng (khớp Biên nhận)' },
      { label: 'Người yêu cầu sửa', value: 'Bà Lớn' },
      { label: 'Người thực hiện', value: 'Thầy Ba Càn' },
    ],
    summaryText:
      'Thư dẫn chiếu hồ sơ Mai–Vinh, xác nhận khoản 2.000 đồng nhận từ Bà Lớn và nêu rõ yêu cầu thêm lời phán nhằm ép Mai làm lẽ, giao quyền quyết định căn tiệm.',
    highlightText: 'Yêu cầu thêm lời phán ép Mai làm lẽ và giao quyền quyết định tiệm',
    comparativeRole:
      'Nối trực tiếp người trả tiền (Bà Lớn), người nhận sửa (Thầy Ba Càn) và mục đích chiếm tiệm với dòng chèn thêm ở Bản sửa trên bàn đàm phán.',
  },
  'doc-c3-ban-sua': {
    id: 'doc-c3-ban-sua',
    title: 'Bản Sửa Hồ Sơ Mai–Vinh',
    subtitle: 'Văn bản đối chiếu đặt trên bàn đàm phán Dinh thự (S3)',
    itemId: undefined,
    dialogueId: 'd-c3-ban-sua',
    clueId: undefined,
    imagePath: 'assets/areas/chapter-3/doc-c3-ban-sua.png',
    metadata: [
      { label: 'Hồ sơ', value: 'Mai – Vinh' },
      { label: 'Hiện trường', value: 'Bàn đàm phán Dinh thự (S3)' },
      { label: 'Tình trạng', value: 'Bị can thiệp chèn thêm điều kiện' },
    ],
    summaryText:
      'Cùng tên hồ sơ Mai–Vinh như Sổ gốc, nhưng được chèn thêm dòng áp đặt mà Sổ gốc không hề có: Mai phải chấp nhận làm lẽ và giao quyền quyết định căn tiệm may.',
    highlightText: 'Mai phải chấp nhận làm lẽ và giao quyền quyết định căn tiệm',
    comparativeRole:
      'Chứng minh khác biệt nội dung có chủ ý so với Sổ gốc, khớp chính xác yêu cầu đã nêu trong Thư thỏa thuận sau khi nhận 2.000 đồng.',
  },
};

export function isC3DocumentDialogue(dialogueId: string): boolean {
  return (
    dialogueId === 'd-c3-mua-chuoc' ||
    dialogueId === 'd-c3-so-tu-vi' ||
    dialogueId === 'd-c3-thoa-thuan' ||
    dialogueId === 'd-c3-ban-sua'
  );
}

export function c3DocumentForDialogue(dialogueId: string): DocumentContent | undefined {
  return Object.values(C3_DOCUMENTS).find(d => d.dialogueId === dialogueId);
}

export function c3DocumentForItem(itemId: string): DocumentContent | undefined {
  return Object.values(C3_DOCUMENTS).find(d => d.itemId === itemId);
}

export function c3DocumentForClue(clueId: string): DocumentContent | undefined {
  return Object.values(C3_DOCUMENTS).find(d => d.clueId === clueId);
}
