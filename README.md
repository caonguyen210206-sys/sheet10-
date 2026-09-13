# Nghịch lý · Bảo tàng không tồn tại

PPT game ôn tập sau thuyết trình cho 15 đội. Màn chiếu là trung tâm: ảnh lớn, chữ ngắn, font gothic và chuyển cảnh tự động. Đội chỉ dùng điện thoại để chọn linh vật và niêm phong một mức cược.

## Các màn

- Trang chính: `#/`
- Bảng MC: `#/host`
- Màn chiếu: `#/stage`
- Điện thoại đội: `#/team?team=1` đến `#/team?team=15`

## Luật “Khế ước”

- Mỗi đội bắt đầu với **10 điểm**.
- Trước câu đầu, đội chọn một linh vật 3D; mỗi kỹ năng chỉ dùng **một lần**.
- Mỗi câu có đúng **một lần niêm phong**: `0 · 1 · 3 · 5` điểm.
- Cược cao nhất giành quyền trả lời. Nếu hòa, hệ thống dùng ưu tiên luân phiên theo số câu — không có đấu phụ.
- Trả lời đúng: nhận `10 + Hũ Nguyền`; hũ về 0.
- Trả lời sai: mất đúng số điểm đã cược; số đó chảy vào **Hũ Nguyền**.
- Không có đội cược: hũ giữ nguyên. Điểm không âm; hệ thống tự tính mọi thay đổi.

## Sáu linh vật

Quạ Tiên Tri (gợi ý), Mèo Chín Mạng (hoàn cược), Cáo Giao Kèo (giảm 4 điểm phạt), Rồng Tro Tàn (+8 khi đúng), Nhện Đồng Hồ (+15 giây), Hươu Hộ Mệnh (hồi sinh 8 điểm khi về 0).

MC chỉ cần bấm: **Bắt đầu → Mở cược → Đúng/Sai → Câu tiếp**. Slide lộ cược, kết quả và BXH top 3 tự chạy; có thể dùng `Space`, `1` (đúng), `0` (sai).

## Thiết kế & tài sản

- Bố cục 16:9, tương phản cao, BXH chỉ là dải nhỏ.
- Ảnh bảo tàng, hiện vật và sáu ảnh linh vật 3D nằm trong `assets/`.
- Tiêu đề dùng `Grenze Gotisch`/`UnifrakturCook`; nội dung dùng `Be Vietnam Pro`.
- Sáu câu demo nằm trong mảng `rounds` ở `index.html`.
- Âm thanh Web Audio chỉ bật sau nút loa trên bảng MC.

## Kết nối Firebase

Web đã dùng Firebase Web SDK dạng `<script>` module với project `sheet10-96b28`.

1. Trong Firebase Console, vào **Authentication → Sign-in method → Anonymous → Enable**.
2. Cloud Firestore cần cho phép người dùng đã đăng nhập ẩn danh đọc/ghi các đường dẫn game. Nếu database đang ở Test mode thì có thể chạy thử ngay; trước khi dùng thật, thay bằng rules tối thiểu:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /games/{gameId} {
      allow read, write: if request.auth != null;
      match /mascots/{teamId} {
        allow read, write: if request.auth != null;
      }
      match /bids/{bidId} {
        allow read, write: if request.auth != null;
      }
    }
  }
}
```

Màn MC ghi trạng thái vào `games/paradox`; điện thoại ghi lựa chọn vào `games/paradox/mascots/*` và cược vào `games/paradox/bids/*`. Mọi màn hình đều nghe `onSnapshot`, nên 15 điện thoại và màn chiếu cập nhật gần như tức thời. Nếu Anonymous Auth chưa bật hoặc Firestore chưa có quyền, giao diện sẽ báo **CẦN BẬT AUTH** và tạm rơi về chế độ local.

## Chạy thử

Mở MC `#/host`, màn chiếu `#/stage`, rồi chia sẻ `#/team?team=1` đến `#/team?team=15`. GitHub Pages vẫn là nơi host; Firebase chỉ làm lớp đồng bộ realtime, không cần bật Firebase Hosting.
