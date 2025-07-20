# Chat App Server

Server cho ứng dụng chat thời gian thực, sử dụng Node.js, Express, Socket.IO, MongoDB và Redis.

## Tính năng nổi bật

- **Nhắn tin thời gian thực** (Socket.IO)
- **Thông báo đã đọc, xóa tin nhắn**
- **Trạng thái online/offline**
- **API RESTful cho quản lý tin nhắn, người dùng**
- **Bảo mật: JWT, Helmet, Rate Limiting**
- **Tối ưu hiệu năng: Redis cache, clustering, connection pool**

## Cài đặt & Khởi động

1. **Cài đặt dependencies:**

   ```bash
   npm install
   ```

2. **Cấu hình biến môi trường:**

   - Tạo file `.env` trong thư mục `server/` với các biến sau:
     ```
     PORT=3000
     MONGODB_URI=mongodb://localhost:27017/chatapp
     JWT_SECRET=your_jwt_secret
     REDIS_URL=redis://localhost:6379
     CLIENT_URL=http://localhost:5173
     ```
   - (Tùy chọn) Tham khảo thêm các biến khác trong code nếu cần.

3. **Chạy server ở chế độ phát triển:**

   ```bash
   npm run dev
   ```

4. **Build và chạy production:**
   ```bash
   npm run build
   npm start
   ```

## Kiến trúc & Thư mục chính

- `src/index.ts` — Điểm khởi động server, cấu hình Express, Socket.IO, Redis, MongoDB.
- `src/lib/mongo.ts` — Hàm kết nối/ngắt kết nối MongoDB.
- `src/lib/redis.ts` — Kết nối Redis, các hàm tiện ích.
- `src/socket/` — Xử lý các sự kiện Socket.IO.
- `src/controllers/` — Xử lý logic API.
- `src/models/` — Định nghĩa schema Mongoose.
- `src/services/` — Các service logic cho chat, user, message.
- `src/routes/` — Định nghĩa các route API.

## API & Socket Events

### API Messages

- `POST /api/messages/:id` — Gửi tin nhắn
- `GET /api/messages/:id` — Lấy lịch sử chat
- `PUT /api/messages/:id/seen` — Đánh dấu đã đọc
- `DELETE /api/messages/:id` — Xóa tin nhắn
- `GET /api/messages/users` — Lấy danh sách user cho sidebar
- `GET /api/messages/unread/count` — Đếm tin chưa đọc

### Socket Events

**Client → Server:**

- `send_message`, `typing_start`, `typing_stop`, `mark_messages_read`, `join_chat`, `leave_chat`

**Server → Client:**

- `message_received`, `message_sent`, `messages_read`, `message_deleted`, `user_typing`, `online_users`

## Monitoring & Health

- `GET /api/health` — Kiểm tra tình trạng server
- `GET /api/metrics` — Thông số hiệu năng

## Phát triển & Đóng góp

- **Lint code:** `npm run lint` hoặc `npm run lint:fix`
- **Test:** `npm test`
- **Cấu hình lại kết nối MongoDB:** Xem `src/lib/mongo.ts`

---

**Liên hệ:**  
Bạn có thể mở issue hoặc PR để đóng góp/thắc mắc.

---
