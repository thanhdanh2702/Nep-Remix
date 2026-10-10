# Asset sảnh tiệm may

Chỉ chứa ảnh đang được dùng trong sảnh và các khung dùng chung của game.

```text
main-shop/
├── backgrounds/
│   └── garden-user--landscape.png
├── ui/
│   ├── action-card-frame--9slice.png
│   ├── area-sign-frame.png
│   ├── currency-hud.png
│   ├── settings-button.png
│   └── ui-hud--3slice.png
├── asset-manifest.json
├── garden-user.md
└── README.md
```

- `backgrounds/`: nền sân nhà được `Scene.tsx` vẽ theo camera trên cả máy tính và điện thoại.
- `ui/`: biển khu vực, thanh Sen Ngọc, nút cài đặt, khung thẻ và thanh HUD. Các khung slice dùng chung được tra thông số qua `asset-manifest.json`.
- Ảnh nguồn của hai khung slice và prompt nằm ở [`../../references/main-shop/`](../../references/main-shop/), được giữ để tham khảo và không đưa vào bản build.

Các nền ngang/dọc cũ, hiệu ứng cổng chưa dùng, bản nháp bỏ và ảnh xem trước cũ đã được dọn. Bản `sanh.png` ở gốc trùng SHA-256 với nền trong `backgrounds/`, nên chỉ giữ một bản tại đây.

Khi đổi vị trí asset, cập nhật đường dẫn trong `src/`, công cụ liên quan và chạy `npm run audit:assets`, `npm run lint`, `npm run build`.
