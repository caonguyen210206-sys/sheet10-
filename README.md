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

## Chạy thử

GitHub Pages là web tĩnh. Bản demo đồng bộ giữa các tab cùng trình duyệt bằng `localStorage` và `BroadcastChannel`: mở MC, sân khấu và các URL đội trong cùng trình duyệt để thử workflow. Muốn dùng 15 điện thoại ở các thiết bị khác nhau, thay lớp đồng bộ mô phỏng bằng backend realtime.
