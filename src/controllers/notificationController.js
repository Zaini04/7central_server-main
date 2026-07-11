const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { sendSuccessResponse } = require('../utils/helpers');
const handlerFactory = require('./factories/handlerFactory');
const logger = require('../logger')('NOTIFICATION_CONTROLLER');
const Notification = require('../models/notificationModel');
const User = require('../models/userModel');
const notificationValidations = require('../validations/notificationValidations');
const sendNotification = require('../utils/notifications/sendNotification')

const popObj = [
    {
        path : 'user' ,
        select: 'username image email -_id'}
    
]

exports.createNotification = catchAsync(async(req , res , next) => {
    const { title , body , type } = req.body;

    const { error } = notificationValidations.validate(req.body);
    if(error) {
        return next(new AppError(error.details[0].message , 400))
    }

    let tokens;
    if(type === 'all') {
        const users = await User.find({}).select('fcm_token');
        const tokensSet = new Set();
        users.forEach((user) => {
            if (user.fcm_token) {
                tokensSet.add(user.fcm_token);
            }
        });
        tokens = [...tokensSet];
    } else if (type === 'specific') {
        const user = await User.findById(req.body.user);
        tokens = [user?.fcm_token]
    }


    // send push notification
    sendNotification(title , body , tokens);
    await Notification.create(req.body);

    sendSuccessResponse(res , 200 , logger , {
        message : 'Notification sent.'
    })
});

exports.getAllNotifications = handlerFactory.getAll(Notification , popObj , logger);
exports.getMyNotifications = catchAsync(async(req , res, next) => {
    let query = {
        $or: [
            { type: 'all' },
            { user: req.user._id }
        ]
    }

    handlerFactory.getAll(Notification , '' , logger , query)(req , res , next)
});

exports.deleteNotification = handlerFactory.removeFromDb(Notification , logger);