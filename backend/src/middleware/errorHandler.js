const errorHandler = (err, req, res, next) => {
    console.error('[errorHandler] Full error detail:', err);

    if (err.code === "23505") {
        return res.status(409).json({
            message: "Email or username already exists",
        });
    }

    return res.status(err.statusCode || 500).json({
        message: err.message || "Internal server error",
    });
};

module.exports = errorHandler;