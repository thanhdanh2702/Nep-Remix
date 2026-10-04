# Deploy Tiệm May Nếp lên Google Cloud Run

Runbook cho người chạy `gcloud`. Region `asia-southeast1` (Singapore, gần Việt Nam), service `tiem-may-nep`, build bằng `Dockerfile` ở root qua Cloud Build (không cần Docker Desktop). Key Gemini nằm trong Secret Manager, không bake vào image.

Lệnh viết cho Git Bash; chỗ khác biệt có kèm bản PowerShell. Chạy từ thư mục `Nep-Remix`.

## 0. Điều kiện

- Cài [Google Cloud CLI](https://cloud.google.com/sdk/docs/install), có tài khoản Google.
- Một GCP project **đã bật billing** (Cloud Run, Cloud Build và ảnh Lookbook AI đều cần). Không bật billing thì không deploy được.
- `GEMINI_API_KEY` lấy tại https://aistudio.google.com/apikey. Tạo ảnh (`gemini-3.1-flash-image`) không có ở free tier; thiếu billing thì Lookbook rơi về ảnh pixel.
- Nên chạy local `npm run build` thành công trước.

## 1. Đăng nhập và chọn project

```bash
gcloud auth login
gcloud config set project PROJECT_ID
```

## 2. Bật API

```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
```

## 3. Tạo secret chứa GEMINI_API_KEY

Secret **không được có ký tự xuống dòng ở cuối** (`echo` trong PowerShell tự thêm một dòng mới, nên dùng cách dưới).

Git Bash:

```bash
printf %s "DÁN_GEMINI_KEY_VÀO_ĐÂY" | gcloud secrets create gemini-api-key --data-file=-
```

PowerShell:

```powershell
$tmp = New-TemporaryFile
Set-Content -Path $tmp -Value (Read-Host "Gemini API key") -NoNewline
gcloud secrets create gemini-api-key --data-file=$tmp
Remove-Item $tmp
```

Kiểm tra: `gcloud secrets versions list gemini-api-key` phải có version `1`.

## 4. Cấp quyền đọc secret cho service account chạy Cloud Run

Mặc định Cloud Run chạy bằng service account Compute mặc định. Chỉ cấp `secretAccessor` trên đúng secret này.

Git Bash:

```bash
PNUM=$(gcloud projects describe PROJECT_ID --format="value(projectNumber)")
gcloud secrets add-iam-policy-binding gemini-api-key \
  --member="serviceAccount:${PNUM}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

PowerShell:

```powershell
$PNUM = gcloud projects describe PROJECT_ID --format="value(projectNumber)"
gcloud secrets add-iam-policy-binding gemini-api-key `
  --member="serviceAccount:$PNUM-compute@developer.gserviceaccount.com" `
  --role="roles/secretmanager.secretAccessor"
```

## 5. Budget alert (làm trước khi deploy)

Đặt cảnh báo 5–10 USD để không bị bất ngờ vì chi phí (min-instances, ảnh Lookbook).

Cách nhanh nhất: Console, Billing, Budgets & alerts, **Create budget**, chọn project, Amount = 10 USD, thêm ngưỡng 50% (5 USD), 90%, 100%, bật gửi email.

Hoặc bằng CLI (lấy `BILLING_ACCOUNT_ID` từ `gcloud billing accounts list`):

```bash
gcloud services enable billingbudgets.googleapis.com
gcloud billing budgets create \
  --billing-account=BILLING_ACCOUNT_ID \
  --display-name="tiem-may-nep-10usd" \
  --budget-amount=10USD \
  --threshold-rule=percent=0.5 \
  --threshold-rule=percent=0.9 \
  --threshold-rule=percent=1.0
```

Budget chỉ **cảnh báo**, không tự ngắt dịch vụ. Khi nhận mail, kiểm tra Lookbook/min-instances và tắt nếu cần (mục 8, 12).

## 6. Deploy

```bash
gcloud run deploy tiem-may-nep \
  --source . \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=gemini-api-key:1 \
  --memory 1Gi --cpu 1 --cpu-boost \
  --timeout 120 \
  --max-instances 2 --min-instances 0
```

PowerShell: thay `\` cuối dòng bằng dấu backtick `` ` ``, hoặc viết trên một dòng.

- `--set-secrets ...:1` ghim version 1 (không dùng `latest`).
- `--timeout 120`: Lookbook gọi Gemini tối đa 45 s, 120 s là đủ.
- `--max-instances 2`: rate limit 20 req/phút/IP và cache nằm trong bộ nhớ từng instance, không chia sẻ; giới hạn instance để chi phí và hành vi dễ đoán.
- `--allow-unauthenticated` cần để giám khảo mở được; rate limit là lớp bảo vệ chi phí duy nhất, nên giữ nguyên.
- Nếu hỏi tạo Artifact Registry repo, trả lời `Y`. Lần build đầu mất vài phút.
- Cuối lệnh in `Service URL: https://tiem-may-nep-xxxxx.asia-southeast1.run.app`. Gửi URL này lại để chạy smoke test.

Kiểm tra nhanh:

```bash
curl https://SERVICE_URL/api/health
```

Kỳ vọng `{"ok":true,"version":"1.0.0"}`. Mở URL trên điện thoại, vào Studio, bấm **Gợi ý từ Gemini** và xem badge `Gemini` (không phải dữ liệu dự phòng).

## 7. Xem log khi lỗi

```bash
gcloud run services logs read tiem-may-nep --region asia-southeast1 --limit 50
```

Dòng `[Gemini] GEMINI_API_KEY missing` nghĩa là secret chưa gắn đúng. Lỗi `Permission denied on secret` lúc deploy nghĩa là chưa chạy mục 4.

## 8. Khung chấm giải: bật/tắt min-instances

`--min-instances 1` giữ một instance luôn nóng (không cold start) nhưng **tính tiền cả khi rảnh**. Chỉ bật ngay trước và trong khung chấm.

```bash
# bật trước khi chấm
gcloud run services update tiem-may-nep --region asia-southeast1 --min-instances 1

# tắt sau khi chấm xong
gcloud run services update tiem-may-nep --region asia-southeast1 --min-instances 0
```

## 9. Đổi/xoay key Gemini

```bash
printf %s "KEY_MỚI" | gcloud secrets versions add gemini-api-key --data-file=-
gcloud run services update tiem-may-nep --region asia-southeast1 --set-secrets GEMINI_API_KEY=gemini-api-key:2
```

Sau khi xác nhận chạy tốt, vô hiệu hóa version cũ: `gcloud secrets versions disable 1 --secret=gemini-api-key`.

## 10. Cập nhật code

Sửa code, rồi chạy lại đúng lệnh deploy ở mục 6 (cùng cờ). Mỗi lần deploy tạo một revision mới.

## 11. Rollback

```bash
gcloud run revisions list --service tiem-may-nep --region asia-southeast1
gcloud run services update-traffic tiem-may-nep --region asia-southeast1 --to-revisions REVISION_NAME=100
```

Quay lại bản mới nhất: dùng `--to-latest` thay cho `--to-revisions ...`.

## 12. Xóa service (dừng hẳn chi phí chạy)

```bash
gcloud run services delete tiem-may-nep --region asia-southeast1
gcloud secrets delete gemini-api-key
```

Image trong Artifact Registry (repo `cloud-run-source-deploy`) vẫn còn; xóa trong Console, Artifact Registry nếu muốn dọn hẳn.

## Phương án dự phòng: nút Deploy của AI Studio

Nếu lệnh `gcloud` gặp sự cố hoặc cuộc thi yêu cầu bài nộp chạy từ AI Studio: mở project trong AI Studio Build, bấm **Deploy** (góc trên bên phải), chọn GCP project có billing. AI Studio tạo một service Cloud Run **riêng** (URL khác) và tự chèn `GEMINI_API_KEY` phía server.

Lưu ý: nó deploy bản sao trong AI Studio, nên mã trong repo phải được đồng bộ sang đó; cách xử lý `server.ts` tùy chỉnh chưa được xác minh. Hai URL cùng tồn tại, không xung đột nhau.

## Ghi chú kỹ thuật

- `npm run build` = `vite build` (ra `dist/`) + esbuild bundle `server.ts` thành `server.mjs` **ở root** (không đặt trong thư mục con vì `__dirname` phải trỏ tới thư mục chứa `dist/`). `npm start` = `node server.mjs`, không cần `tsx`.
- `Dockerfile` đặt `NODE_ENV=production` và chạy bằng user `node`; Cloud Run cấp `PORT=8080`.
- `assets/` và `map.png` là input của `vite build`, **không được ignore** trong `.dockerignore`/`.gcloudignore`. Hai file ignore giữ nội dung giống nhau.
- `server.ts` có `trust proxy = 1` nên rate limit theo IP client thật phía sau Cloud Run.
- Chưa kiểm trên service thật: số hop proxy đúng, `.gcloudignore` so với `.dockerignore` cái nào được ưu tiên khi có Dockerfile, và `docker build` (Docker daemon không chạy lúc viết runbook).
