# Nghịch lý · Bảo tàng không tồn tại

Web game ôn tập sau thuyết trình dành cho 15 đội. Giao diện lấy cảm hứng từ một bảo tàng hình học siêu thực: mỗi vòng, các đội quan sát một căn phòng bị thiếu mảnh ghép, chọn một mảnh trên điện thoại và đội chọn đúng đầu tiên giành quyền trả lời câu hỏi. Mỗi câu chỉ có một lần giành quyền; không có đấu phụ hoặc chuyển lượt.

## Chạy thử

Mở `index.html` trực tiếp hoặc chạy web server tĩnh:

```bash
python3 -m http.server 4173
```

Sau đó mở `http://localhost:4173`.

## Các màn hình

- `#/host`: bảng điều khiển MC — duyệt 15 đội demo, chạy luật/lượt thử, mở mảnh ghép, ghi nhận và chấm câu trả lời, mở BXH.
- `#/stage`: màn hình sân khấu để chiếu — ưu tiên hình ảnh, câu hỏi và bảng điểm; không lộ đáp án/rubric.
- `#/team?team=1` đến `#/team?team=15`: màn hình điện thoại đội — chọn một trong bốn mảnh khi cửa sổ giải mã mở.

## Luồng chơi

1. MC mở `#/host`, bấm **Duyệt 15 đội demo** và bật âm thanh nếu cần.
2. Mở luật → chạy lượt thử → vào câu 01.
3. Ở mỗi câu, MC bấm **Mở căn phòng**. Các đội có 15 giây chọn mảnh.
4. Mỗi đội chỉ gửi một lựa chọn. Hệ thống kiểm tra đúng/sai và khóa đội đúng đầu tiên.
5. MC mở câu hỏi, bắt đầu đồng hồ, nghe đội trả lời trực tiếp, nhập lựa chọn hoặc tick rubric.
6. MC bấm **Chấm và công bố**. Web tự cộng điểm, cập nhật dải điểm và BXH.
7. Sai/hết giờ không chuyển quyền. Bằng điểm cuối phiên thì đồng hạng.

## Kiểm thử nhiều đội trong một máy

GitHub Pages chỉ phục vụ file tĩnh. Prototype mô phỏng đồng bộ bằng `localStorage` + `BroadcastChannel`, nên có thể mở nhiều tab cùng một trình duyệt để thử MC, sân khấu và các đội. Mở host ở một tab, stage ở một tab khác, sau đó mở các URL đội.

Khi triển khai cho 15 điện thoại ở các thiết bị khác nhau, cần thay lớp đồng bộ mô phỏng bằng backend thời gian thực và cơ sở dữ liệu. Máy chủ phải là nguồn sự thật cho `phase`, `winner`, thời hạn và điểm; lượt bấm hợp lệ cần thao tác kiểm tra–ghi nguyên tử và có `requestId` chống gửi lặp.

## Câu hỏi demo

Bộ 10 câu hiện tại là **BẢN DEMO** về quan sát, bằng chứng và suy luận để kiểm tra workflow, chưa phải bộ câu chính thức bám theo bài thuyết trình. Thay nội dung trong mảng `rounds` của `index.html` trước khi sử dụng thật.

## Thiết kế

- Hoạt họa và hình minh họa được dựng bằng CSS/SVG để không phụ thuộc kho ảnh ngoài.
- Màu sắc: xanh ngọc cho tín hiệu đúng, hồng cho cảnh báo, vàng cho điểm, tím cho không gian nghịch lý.
- Có thể nhấn phím **H** để mở luật; **Esc** để đóng modal.
- Âm thanh được tạo bằng Web Audio sau khi người dùng bật; nếu bị trình duyệt chặn, mọi tín hiệu quan trọng vẫn có chữ trên màn hình.
