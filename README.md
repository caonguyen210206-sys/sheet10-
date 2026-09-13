# Nghịch lý · Bảo tàng không tồn tại

PPT game ôn tập sau thuyết trình cho 15 đội. Màn sân khấu được thiết kế như một bộ slide: hình ảnh lớn, chữ ngắn, MC chỉ bấm nút chính; hệ thống tự khóa đội chọn đúng đầu tiên, cộng điểm và chuyển sang câu kế tiếp.

## Mở game

- Trang chính: #/
- Bảng MC: #/host
- Màn chiếu: #/stage
- Điện thoại đội: #/team?team=1 đến #/team?team=15

Trên bảng MC, quy trình chỉ có ba thao tác lặp lại:

1. **Mở mảnh ghép**
2. Đội chọn một mảnh trên điện thoại; hệ thống tự xác định đội đúng đầu tiên
3. MC nghe câu trả lời trực tiếp và bấm **ĐÚNG · 10** hoặc **SAI · 0**

Sau khi chấm, slide kết quả tự hiện rồi tự chuyển sang câu tiếp theo. Có thể dùng phím Space cho nút chính, phím 1 cho đúng và phím 0 cho sai.

## Thiết kế

- Bố cục 16:9 ưu tiên cho máy chiếu.
- Minh họa căn phòng, cánh cửa, quỹ đạo và mảnh ghép được dựng bằng SVG/CSS, không cần tải ảnh ngoài.
- Sáu câu demo ngắn, có thể đổi trong mảng rounds ở index.html.
- Điểm tối đa 10/câu; bảng điểm tạm thời và podium cuối game tự cập nhật.
- Âm thanh chỉ bật sau nút âm thanh trên màn MC.

## Chạy thử nhiều màn

GitHub Pages là web tĩnh. Bản demo đồng bộ giữa các tab cùng trình duyệt bằng localStorage và BroadcastChannel: mở MC, sân khấu và các URL đội trong cùng trình duyệt để thử workflow. Khi dùng 15 điện thoại ở các thiết bị khác nhau, cần thay lớp đồng bộ mô phỏng bằng backend realtime.
