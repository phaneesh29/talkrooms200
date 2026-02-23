import { z } from 'zod'


export const validate = (schema, target = 'body') => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[target] ?? {});
      req[target] = parsed;
      return next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors = err.errors.map((e) => ({ path: e.path.join('.'), message: e.message }));
        return res.status(400).json({ errors });
      }
      return res.status(400).json({ message: 'Invalid request' });
    }
  }
}

export default validate
