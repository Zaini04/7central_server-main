const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel')

exports.protect = catchAsync(async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
        return next(new AppError("you're not logged in. please login to get access", 401))
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { _id, pass } = decoded;
        let user = await User.findById(_id).populate("role");
        
        if(!user){
            return next(new AppError('Access denied. UnAuthorized user.' , 401));
        }
        
        if (user.status === 'blocked') {
            return next(new AppError('Your account is blocked. If you believe this is an error or have any concerns, please contact our support team..', 401))
        }

        if (user.status === 'deleted') {
            return next(new AppError('Sorry, your account has been deactivated. If you believe this is an error or have any concerns, please contact our support team.', 401))
        }

        req.user = user;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return next(new AppError(err, 401));
        }
        next(new AppError(err, 401));
    }
})

exports.isSuperAdmin = (req, res, next) => {
    if (req.user.isSuperAdmin) {
        return next();
    }
    return next(new AppError('You do not have permission to perform this action.'));
};


exports.checkAccess = (menu) => async (req, res, next) => {
    try {
        const user = req.user;
        
        if(user.isSuperAdmin) {
            return next();
        }

        if(!user.role) {
            return next(new AppError('You do not have permission to perform this action.', 403));
        }

        const hasAccess = user.role.permissions.some((perm) => perm.menu === menu );
    
        if (!hasAccess) {
            return next(new AppError('You do not have permission to perform this action.', 403));
        }
    
        next();
    } catch (err) {
        next(new AppError(err.message || 'Internal server error.', 403))
    }
};