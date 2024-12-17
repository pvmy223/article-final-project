// Middleware xử lý lỗi
const errorHandler = (err, req, res, next) => {
    console.error(err.stack); // Log lỗi ra console để debug
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
    });
};

// Middleware xử lý route không tồn tại
const notFoundHandler = (req, res, next) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
};

module.exports = {
    errorHandler,
    notFoundHandler,
};
