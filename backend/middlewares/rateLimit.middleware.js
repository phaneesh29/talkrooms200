import rateLimit from 'express-rate-limit';


export const globalLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, 
    max: 100, 
    standardHeaders: true, 
    legacyHeaders: false, 
    message: { error: 'Too many requests, please try again later.' },
});

export const loginLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, 
    max: 5, 
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts, please try again later.' },
});
