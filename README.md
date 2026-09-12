# Cuộc gọi từ phòng 404

Prototype web game ôn tập sau thuyết trình cho 15 đội, triển khai tĩnh trên GitHub Pages.

## Chạy thử

Mở `index.html` trực tiếp hoặc dùng một web server tĩnh:

```bash
python3 -m http.server 4173
```

Sau đó mở `http://localhost:4173`.

## Các màn hình

- `#/host`: bảng điều khiển MC — duyệt đội, chạy workflow, nhập/chấm câu và xuất kết quả.
- `#/stage`: màn hình sân khấu — dùng cho máy chiếu, không lộ đáp án/rubric.
- `#/team?team=1`: điện thoại đội — bắt máy và theo dõi điểm/hạng.

Prototype dùng `localStorage` và `BroadcastChannel` để mô phỏng đồng bộ nhiều tab trong cùng trình duyệt. GitHub Pages là hosting tĩnh, nên phiên bản triển khai thật cần backend WebSocket/Socket.IO và cơ sở dữ liệu theo kiến trúc trong đặc tả.

Bộ 15 câu hiện tại là **BẢN THỬ** dựa trên ngữ liệu hư cấu “khách sạn 404”, chưa phải bộ câu chính thức theo slide thuyết trình.
