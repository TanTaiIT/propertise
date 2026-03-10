# CronJob

## Đã triển khai

### Boost rotation (xoay vòng tin VIP)

- **Mục đích**: Tin VIP/premium tự động "nhảy lên đầu" theo chu kỳ (như Chợ Tốt, Batdongsan).
- **Schedule**: Mỗi 4 giờ (0:00, 4:00, 8:00, 12:00, 16:00, 20:00).
- **Logic**: Lấy batch tin có `lastBoostedAt` cũ nhất trong mỗi tier, set `lastBoostedAt = now` để chúng hiển thị đầu trang.
- **Config**: `config/system.js` → `BOOST_ROTATION.intervalHours`, `batchSizePerTier`, `cronExpression`.

## Chưa triển khai

- Xóa User chưa xác thực email trong vòng 1h
- Xóa bài đăng hết hạn được phép public