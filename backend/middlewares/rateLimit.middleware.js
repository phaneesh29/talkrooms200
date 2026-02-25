import rateLimit, { ipKeyGenerator } from 'express-rate-limit';


export const globalLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 100,
    keyGenerator: (req, res) => {
        return req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || ipKeyGenerator(req, res);
    },
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
});

export const loginLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 5,
    keyGenerator: (req, res) => {
        return req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || ipKeyGenerator(req, res);
    },
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts, please try again later.' },
});
