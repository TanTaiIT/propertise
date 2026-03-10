export const ACCESS_TOKEN_EXPIRES_IN = '15m'
export const REFRESH_TOKEN_EXPIRES_IN = '7d'
export const API_KEY_CLOUNDINARY = '598854437854472'
export const API_SECRET_CLOUNDINARY = 'pS0P5lh9dwMQp-wpKfhs2iLw2PI'

export const STATUS = {
    INACTIVE: 0,
    ACTIVE: 1,
    BLOCKED: 2,
}

export const POST_STATUS = {
    DRAFT: 0,
    PENDING: 1,
    PUBLISHED: 2,
    REJECTED: 3,
    ARCHIVED: 4,
}

export const ROLE = {
    USER: 0,
    STAFF: 1,
    ADMIN: 2,
}

export const PAGINATION = {
    limit: 10
}


/**
 * Boost rotation – như Chợ Tốt, Batdongsan.
 * Tin VIP/premium tự động xoay vòng lên đầu mỗi N giờ.
 */
export const BOOST_ROTATION = {
    /** Chu kỳ xoay vòng (giờ) */
    intervalHours: 4,
    /** Số tin được “đẩy lên” mỗi lần (mỗi tier) */
    batchSizePerTier: 20,
    /** Cron expression: mặc định mỗi 4 giờ (0:00, 4:00, 8:00, ...) */
    cronExpression: "0 */4 * * *"
}