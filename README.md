# VAULT 25 · PPT game

Game ôn tập dạng trình chiếu cho **15 đội / 25 câu**. Màn chiếu là game board: nền két 3D, lõi năng lượng nổi, thẻ phát sáng, animation và BXH nhỏ cố định ở cạnh phải. Điện thoại chỉ dùng để chọn linh vật, bật kỹ năng và chọn một mã.

## Các màn

- Trang chính: `#/`
- Bảng MC: `#/host`
- Màn chiếu: `#/stage`
- Điện thoại đội: `#/team?team=1` đến `#/team?team=15`

## Luật chính

- Mỗi đội bắt đầu **0 điểm** và có bộ **25 thẻ số 1–25**.
- Trước câu đầu, mỗi đội chọn một linh vật. Kỹ năng chỉ dùng một lần; bật trên điện thoại trước khi chọn mã.
- MC công bố độ khó và điểm trước khi mở lượt chọn mã:

| Độ khó | Hình thức | Điểm đúng |
| --- | --- | ---: |
| ★ | Câu hỏi + A/B/C/D | 10 |
| ★★ | Nghe tiếng Anh + A/B/C/D | 15 |
| ★★★ | Nghe tiếng Anh + tự trả lời | 25 |
| ★★★★ | Lật nửa ảnh + A/B/C/D | 40 |
| ★★★★★ | Video gợi ý rất nhanh + tự trả lời | 60 |

- Mỗi câu có một lượt chọn mã, thời gian mặc định **12 giây**.
- Mỗi đội chỉ chọn **một thẻ chưa dùng**. Thẻ đã chọn bị đốt vĩnh viễn, dù đội có thắng hay không.
- Mã lớn nhất giành quyền trả lời. Nếu bằng mã, hệ thống chọn timestamp gửi lên máy chủ sớm nhất; không có đấu phụ.
- Trả lời đúng nhận điểm của sao tương ứng và thưởng kỹ năng nếu có. **Trả lời sai hoặc hết giờ = 0 điểm**, không hoàn lại thẻ.
- Hết 25 câu, hệ thống tự tính điểm, số câu đúng và BXH; các tiêu chí phụ chỉ dùng khi tổng điểm bằng nhau.

## Linh vật

Quạ Tiên Tri (gợi ý), Mèo Chín Mạng (+5 khi đúng ★/★★), Cáo Giao Kèo (+5 khi đúng ★★★+), Rồng Tro Tàn (+8 khi đúng), Nhện Đồng Hồ (+15 giây), Hươu Hộ Mệnh (+8 khi đúng ★★★★+).

MC chỉ cần bấm: **Mở VAULT → Khoá linh vật → Mở chọn mã → Lộ mã → Đúng/Sai → Câu tiếp**. Có phím tắt `Space`, `1` (đúng), `0` (sai). Kết quả sai luôn hiển thị lớn là `0`.

## Thiết kế & tài sản

- Bố cục 16:9, tương phản cao, BXH chỉ là dải nhỏ.
- Ảnh két, lõi năng lượng trong suốt, hiện vật và sáu ảnh linh vật 3D nằm trong `assets/`.
- Tiêu đề dùng `Grenze Gotisch`/`UnifrakturCook`; nội dung dùng `Be Vietnam Pro`.
- 25 câu demo nằm trong mảng `rounds` ở `game.js`; thay bằng audio/video thật trước buổi học.
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
      match /cards/{cardId} {
        allow read, write: if request.auth != null;
      }
    }
  }
}
```

MC ghi trạng thái vào `games/paradox-v3`; điện thoại ghi linh vật vào `games/paradox-v3/mascots/*` và mã vào `games/paradox-v3/cards/*`. Các thiết bị nghe `onSnapshot` trực tiếp trên các collection hành động để giảm cảm giác trễ. Nếu Firebase chưa sẵn sàng, web tạm dùng BroadcastChannel/localStorage cho các tab cùng trình duyệt.

## Chạy thử

Mở MC `#/host`, màn chiếu `#/stage`, rồi chia sẻ `#/team?team=1` đến `#/team?team=15`. Bật F11 trên sân khấu để chiếu toàn màn hình. GitHub Pages vẫn là nơi host; Firebase chỉ làm lớp đồng bộ realtime, không cần bật Firebase Hosting.
