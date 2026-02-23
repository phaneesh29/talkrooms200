export const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
}

export const socketAsyncHandler = (socketHandler, socket) => {
    return async (...args) => {
        try {
            await socketHandler(...args);
        } catch (error) {
            console.error('Socket Error:', error);
            if (socket) {
                socket.emit("error", { message: error.message || "Internal Socket Error" });
            }
        }
    }
}
