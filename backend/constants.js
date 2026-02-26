export const PORT = process.env.PORT || 8000;
export const ORIGIN = process.env.ORIGIN || "http://localhost:5173";
export const MONGO_URI = process.env.MONGO_URI
export const DB_NAME = process.env.DB_NAME
export const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET
export const HEALTH_URL = process.env.HEALTH_URL || "https://talkrooms200.onrender.com/api/health"

export const ACCESS_TOKEN_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    partitioned: true,
    maxAge: 60 * 60 * 1000,
};

export const REFRESH_TOKEN_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    partitioned: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
};