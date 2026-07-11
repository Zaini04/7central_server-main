const AppError = require('../utils/appError');
const logger = require('../logger')('ERROR_HANDLER');

const castErrorHandlerDB = err => {
    const message = `Invalid ID: ${err.value}`;
    return new AppError(message, 400);
};

const handleDuplicateFieldsErrorDB = err => {
    const message = `Duplicate field value: "${err.keyValue.name}". Please use another value.`;
    return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Validation errors: ${errors.join('. ')}`;
    return new AppError(message, 400);
};

const handleJWTError = () => {
    const message = 'Invalid token. You are not authorized.';
    return new AppError(message, 401);
};

const handleExpiredTokenError = () => {
    const message = 'Session expired. Please log in again.';
    return new AppError(message, 401);
};

const sendErrorDev = (err, req, res) => {
    const response = {
        status: err.status || 'Error',
        success: false,
        message: err.message || 'Internal server error',
        error: err,
        stack: err.stack
    };

    if (!err.isOperational) {
        logger.error(JSON.stringify(response));
    } else {
        logger.info(JSON.stringify(response));
    }

    return res.status(err.statusCode || 500).json(response);
};

const sendErrorProd = (err, req, res) => {
    if (err.isOperational) {
        const response = {
            status: err.status,
            success: false,
            data: {
                message: err.message
            }
        };
        logger.info(JSON.stringify(response));
        return res.status(err.statusCode).json(response);
    }

    const response = {
        status: err.status || 'Error',
        success: false,
        data: {
            message: 'Internal Server Error'
        }
    };
    logger.error(JSON.stringify(response));
    return res.status(err.statusCode || 500).json(response);
};

const errorHandler = (err, req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);
    } else if (process.env.NODE_ENV === 'production') {
        let error = { ...err };

        if (error.name === 'CastError') error = castErrorHandlerDB(error);
        if (error.code === 11000) error = handleDuplicateFieldsErrorDB(error);
        if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
        if (error.name === 'JsonWebTokenError') error = handleJWTError();
        if (error.name === 'TokenExpiredError') error = handleExpiredTokenError();

        sendErrorProd(error, req, res);
    }
};

module.exports = errorHandler;
