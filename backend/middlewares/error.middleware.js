
export const globalErrorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";


    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(el => el.message);
        return res.status(400).json({
            message: "Validation Error",
            errors
        });
    }


    if (err.code === 11000) {
        let fieldName = "Field";
        let message = "Duplicate field value entered";
        if (err.keyValue) {
            const key = Object.keys(err.keyValue)[0];
            const value = err.keyValue[key];
            fieldName = key.charAt(0).toUpperCase() + key.slice(1);
            message = `${fieldName} '${value}' is already taken. Please choose another one.`;
        }
        return res.status(400).json({
            message
        });
    }

    res.status(statusCode).json({
        message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : null
    });
};
