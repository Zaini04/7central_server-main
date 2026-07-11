const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/appError");
const User = require("../../models/userModel");
const logger = require("../../logger")("USER_CONTROLLER");
const { sendSuccessResponse } = require("../../utils/helpers");
const sendVerificationEmail = require("../../utils/mails/sendVerificationEmail");
const moment = require("moment");
const signToken = require("../../utils/signToken");
const sendForgotPasswordEmail = require("../../utils/mails/sendForgotPasswordEmail");
const generateOtp = require("../../utils/generateOtp");
const sendWelcomeEmail = require("../../utils/mails/sendWelcomeEmail");
const userValidations = require('../../validations/userValidations');
const Role = require("../../models/roleModel");

const generateUniqueUsername = async (baseUsername, maxRetries = 10) => {
    let username = baseUsername.toLowerCase(); // Ensure username is always in lowercase
    let retryCount = 0;

    while (retryCount < maxRetries) {
        const usernameExist = await User.findOne({ username });
        if (!usernameExist) break;
        username = `${baseUsername.toLowerCase()}${Math.floor(Math.random() * 1000)}`;
        retryCount++;
    }

    if (retryCount === maxRetries) {
        throw new AppError('Failed to generate a unique username. Please try again.', 500);
    }

    return username;
};

exports.googleLogin = () => catchAsync(async(req , res , next) => {
    const { email, username, image } = req.body;

    if (!email || !username) {
        return  next(new AppError("Missing required fields" , 400))
    }

    let user = await User.findOne({ email });

    if (!user) {
        const uniqueUsername = await generateUniqueUsername(username);
        // Create new user
        user = new User({
            email,
            username: uniqueUsername,
            image: image || '',
            accountType: "google",
            role:null
        });

        await user.save();
    }

     // Check if user is blocked
     if (user.status === "blocked") {
        return next(
            new AppError(
                user.blockReason
                    ? `Your account has been blocked. because ${user?.blockReason}`
                    : "Your account has been blocked. Please contact support.",
                403
            )
        );
    }

    // Check if user is deleted
    if (user.status === "deleted") {
        return next(
            new AppError(
                "Sorry, your account has been deactivated. If you believe this is an error or have any concerns, please contact our support team.",
                403
            )
        );
    }

    const token = signToken({ _id: user._id, pass: user.password });

    delete user._doc.password;
    return sendSuccessResponse(res, 200, logger, {
        message: "Login successful",
        doc: { ...user._doc, token },
    });
   
})

exports.appleLogin = () => catchAsync(async(req , res , next) => {
    const { email, username , appleIdentifier } = req.body;


    if (!appleIdentifier) {
        return  next(new AppError("Apple identifier is required." , 400))
    }

    let user = await User.findOne({ appleIdentifier });

    if (!user) {
        if(!username || !email) {
            return next(new AppError('User not exists. For registration email and username is required.' , 400))
        }

        const uniqueUsername = await generateUniqueUsername(username);
        // Create new user
        user = new User({
            email,
            username: uniqueUsername,
            accountType: "apple",
            appleIdentifier,
            role:null

        });

        await user.save();
    }

     // Check if user is blocked
     if (user.status === "blocked") {
        return next(
            new AppError(
                user.blockReason
                    ? `Your account has been blocked. because ${user?.blockReason}`
                    : "Your account has been blocked. Please contact support.",
                403
            )
        );
    }

    // Check if user is deleted
    if (user.status === "deleted") {
        return next(
            new AppError(
                "Sorry, your account has been deactivated. If you believe this is an error or have any concerns, please contact our support team.",
                403
            )
        );
    }

    const token = signToken({ _id: user._id, pass: user.password });

    delete user._doc.password;
    return sendSuccessResponse(res, 200, logger, {
        message: "Login successful",
        doc: { ...user._doc, token },
    });
   
})

exports.registerUser = () => catchAsync( async (req, res, next) => {
    let { username , email } = req.body;

    username = username.trim().toLowerCase();

    const { error } = userValidations.validate(req.body);
    if (error) {
        return next(new AppError(error.details[0].message, 400));
    }
    // Check if phone or email already exists
    // const usernameEixst = await User.findOne({ username });
    // if (usernameEixst) {
    //     return next(
    //         new AppError("Username already taken. Please try another.", 400)
    //     );
    // }

    const emailExist = await User.findOne({ email });
    if (emailExist) {
        return next(
            new AppError(
                    emailExist?.status === 'blocked'
                    ? 
                        `Account with this email has been blocked. Please contact support.`
                    :
                    emailExist?.status === 'deleted'
                    ?
                        'Sorry, account with this email has been deactivated. Forgot your password to register again.'
                    :
                    "Email already taken. Please try another.", 
                400
            )
        );
    }

    // Generate OTP
    let otp;
    try {
        otp = await generateOtp("email");
    } catch (error) {
        return next(
            new AppError("Failed to generate OTP. Please try again later.", 500)
        );
    }

    try {
        const currentDate = moment();
        const user = await User.create({
            ...req.body,
            accountType : 'password' ,
            verification: {
                emailToken: otp,
                emailTokenExpire: moment(currentDate).add(10, "minutes"),
            },
            role:null

        });

        // Send OTP via email
        try {
            let emailRes = await sendVerificationEmail(otp, user);
        } catch (error) {
            return next(
                new AppError(
                    "Failed to send verification email. Please try again later.",
                    500
                )
            );
        }

        return sendSuccessResponse(res, 200, logger, {
            message: "OTP sent to your Email. Please verify your Email address.",
        });
    } catch (error) {
        console.log({ error });
        return next(
            new AppError("Failed to register user. Please try again later.", 500)
        );
    }
});

exports.login = () => catchAsync(async (req, res, next) => {
    let { identifier, password } = req.body;

    if (!identifier) {
        return next(new AppError("Please provide an email or username", 400));
    }

    if (!password) {
        return next(new AppError("Please provide a password", 400));
    }

    identifier = identifier.trim().toLowerCase();

    const user = await User.findOne({
        $or: [{ email: identifier }, ]
            // { username: identifier }],
    }).select("+password");

    if(user.accountType !== 'password') {
        return next(new AppError(`It looks like you signed up using your ${user?.accountType} account. Please continue logging in with ${user?.accountType}.`, 400));
    }
    
    
    if (!user || !(await user.comparePassword(password))) {
        return next(new AppError("Invalid email/username or password", 401));
    }

    // Check if user is blocked
    if (user.status === "blocked") {
        return next(
            new AppError(
                user.blockReason
                    ? `Your account has been blocked. because ${user?.blockReason}`
                    : "Your account has been blocked. Please contact support.",
                403
            )
        );
    }

    // Check if user is deleted
    if (user.status === "deleted") {
        return next(
            new AppError(
                "Sorry, account with this email has been deactivated. Forgot your password to register again.",
                403
            )
        );
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
        let otp;
        try {
            otp = await generateOtp("email");
        } catch (error) {
            return next(
                new AppError("Failed to generate OTP. Please try again later.", 500)
            );
        }

        try {
            let emailRes = await sendVerificationEmail(otp, user);
        } catch (error) {
            return next(
                new AppError(
                    "Failed to send verification email. Please try again later.",
                    500
                )
            );
        }

        user.verification.emailToken = otp;
        user.verification.emailTokenExpire = moment().add(10, "minutes");
        await user.save();

        return sendSuccessResponse(res, 200, logger, {
            isEmailVerified: false,
            message:
                "Your email is not verified. We have resent the verification OTP to your email.",
        });
    }

    const token = signToken({ _id: user._id, pass: user.password });

    delete user._doc.password;
    return sendSuccessResponse(res, 200, logger, {
        message: "Login successful",
        isEmailVerified: true,
        doc: { ...user._doc, token },
    });
});

exports.adminLogin = () => catchAsync(async (req, res, next) => {
    let { identifier , password } = req.body;

    if (!identifier) {
        return next(new AppError("Email or username  is required.", 400));
    }

    if (!password) {
        return next(new AppError("Please provide a password", 400));
    }

     identifier = identifier.trim().toLowerCase();

    const user = await User.findOne({
        $or: [{ email: identifier }, 
            { username: identifier }],
    }).select("+password");

//     const user = await User.findOne({
//         email ,  $or: [
//     { isSuperAdmin: true },
//     { role: { $ne: null } }
//   ]
//     }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
        return next(new AppError("Invalid email or password", 401));
    }

    // Check if user is blocked
    if (user.status === "blocked") {
        return next(
            new AppError(
                user.blockReason
                    ? `Your account has been blocked. because ${user?.blockReason}`
                    : "Your account has been blocked. Please contact support.",
                403
            )
        );
    }

    // Check if user is deleted
    if (user.status === "deleted") {
        return next(
            new AppError(
                "Sorry, your account has been deactivated by the administrator. If you believe this is an error or have any concerns, please contact our support team.",
                403
            )
        );
    }

    const token = signToken({ _id: user._id, pass: user.password });

    delete user._doc.password;
    delete user._doc.accountType;
    delete user._doc.fcm_token;
    return sendSuccessResponse(res, 200, logger, {
        message: "Logged in successfully.",
        status: user.status,
        doc: { ...user._doc, token },
    });
});

exports.adminRegisterUser = () => catchAsync( async (req, res, next) => {
    let { username , email } = req.body;


    const { error } = userValidations.validate(req.body);
    if (error) {
        return next(new AppError(error.details[0].message, 400));
    }
    username = username.trim().toLowerCase();

    const emailExist = await User.findOne({ email });
    if (emailExist) {
        return next(
            new AppError(
                    emailExist?.status === 'blocked'
                    ? 
                        `Account with this email has been blocked. Please contact support.`
                    :
                    emailExist?.status === 'deleted'
                    ?
                        'Sorry, account with this email has been deactivated. Forgot your password to register again.'
                    :
                    "Email already taken. Please try another.", 
                400
            )
        );
    }


    const role = await Role.findOne();
    try {
        const user = await User.create({
            ...req.body,
            accountType : 'password' ,
            role : role?._id,
            isEmailVerified : true ,
            verification: {
                emailToken: null,
                emailTokenExpire: null,
            },
        });


        return sendSuccessResponse(res, 200, logger, {
            message: "Admin registered user successfully.",
        });
    } catch (error) {
        console.log({ error });
        return next(
            new AppError("Failed to register user. Please try again later.", 500)
        );
    }
});

exports.forgotPassword = () => catchAsync(async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        return next(new AppError("Please provide an email address.", 400));
    }

    const user = await User.findOne({ email });
    if (!user) {
        return next(
            new AppError("There is no user with that email address.", 404)
        );
    }

    const otp = await generateOtp();

    user.verification.resetPasswordToken = otp;
    user.verification.resetPasswordTokenExpire = moment().add(10, "minutes");
    await user.save({ validateBeforeSave: false });

    // Send OTP to user's email
    try {
        await sendForgotPasswordEmail(otp, user);

        return sendSuccessResponse(res, 200, logger, {
            message: "OTP sent to your email. Please check your inbox.",
        });
    } catch (err) {
        // In case email sending fails, reset the OTP fields
        user.verification.resetPasswordToken = undefined;
        user.verification.resetPasswordTokenExpire = undefined;
        await user.save({ validateBeforeSave: false });
        console.log({ error: err });
        return next(
            new AppError(
                "There was an error sending the email. Try again later!",
                500
            )
        );
    }
});

exports.verifyOtp = () => catchAsync(async (req, res, next) => {
    const { otp, type } = req.body;

    if (!otp || !type) {
        return next(new AppError("OTP and type are required", 400));
    }

    let tokenField;
    let expireField;
    let updateFields;

    let _sendWelcomeEmail = false;

    if (type === "email") {
        tokenField = "verification.emailToken";
        expireField = "verification.emailTokenExpire";
        updateFields = {
            "verification.emailToken": null,
            "verification.emailTokenExpire": null,
            isEmailVerified: true,
        };
        _sendWelcomeEmail = true;
    } else if (type === "forgotPassword") {
        tokenField = "verification.resetPasswordToken";
        expireField = "verification.resetPasswordTokenExpire";
        updateFields = {};
    } else {
        return next(new AppError("Invalid OTP type", 400));
    }

    // Find the user
    const user = await User.findOne({
        [tokenField]: otp,
        [expireField]: { $gt: new Date() },
    });

    if (!user) {
        return next(new AppError("Invalid or expired OTP", 400));
    }

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(user._id, updateFields, { new: true });

    if(_sendWelcomeEmail) {
        try {
            await sendWelcomeEmail(user)
        } catch (error) {
            console.log({ welcomeEmailError : error })
        }
    }

    if (type === "email") {
        //login user
        const token = signToken({ _id: user._id, pass: user.password });

        delete user._doc.password;
        return sendSuccessResponse(res, 200, logger, {
            message: "OTP verified successfully.",
            isEmailVerified: true,
            status: user.status,
            doc: { ...updatedUser._doc, token },
        });
    } else if (type === "forgotPassword") {
        return sendSuccessResponse(res, 200, logger, {
            message: "OTP verified successfully. You can now reset your password.",
        });
    }
});

exports.resendOtp = () => catchAsync(async (req, res, next) => {
    const { email , type } = req.body;

    if (!email) {
        return next(new AppError("Please provide Email", 400));
    }

    if (!type) {
        return next(new AppError("Type is required", 400));
    }

    const user = await User.findOne({ email });

    if (!user) {
        return next(new AppError("This email is not registered.", 400));
    }

    let otp;
    try {
        otp = await generateOtp(type);
    } catch (error) {
        return next(
            new AppError("Failed to generate OTP. Please try again later.", 500)
        );
    }

    try {
        let emailRes = await sendVerificationEmail(otp, user);
    } catch (error) {
        return next(
            new AppError("Failed to resend OTP. Please try again later.", 500)
        );
    }

    let updateFields;

    if (type === "email") {
        updateFields = {
            "verification.emailToken": otp,
            "verification.emailTokenExpire": moment().add(10, "minutes"),
        };
    } else if (type === "forgotPassword") {
        updateFields = {
            "verification.resetPasswordToken": otp,
            "verification.resetPasswordTokenExpire": moment().add(10, "minutes"),
        };
    }

    await User.findByIdAndUpdate(user._id, updateFields, { new: true });

    return sendSuccessResponse(res, 200, logger, {
        message: "OTP resent to your email.",
    });
});

exports.profile = () => catchAsync(async (req, res, next) => {
    const doc = await User.findById(req.user._id);

    if (!doc) return next(new AppError("User not found.", 404));
    delete doc._doc.password;
    delete doc._doc.accountType;
    return sendSuccessResponse(res, 200, logger, {
        doc,
    });
});

exports.logout = () => (req, res, next) => {
    res.cookie("token", "loggedOut", {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    });
    return sendSuccessResponse(res, 200, logger, {
        message: "Logged out successfully.",
    });
};

exports.updatePassword = () => catchAsync(async (req, res, next) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
        return next(new AppError("Missing required credentials.", 400));
    }

    const doc = await User.findById(req.user._id).select("+password");

    if (!doc || !(await doc.comparePassword(currentPassword))) {
        return next(
            new AppError(
                "Unable to change password. Current password is incorrect.",
                400
            )
        );
    }

    if (newPassword !== confirmPassword) {
        return next(new AppError("Passwords do not match.", 400));
    }

    doc.password = newPassword;
    await doc.save();

    return sendSuccessResponse(res, 200, logger, {
        message: "Password updated successfully.",
    });
});

exports.resetPassword = () => catchAsync(async (req, res, next) => {
    const { otp, newPassword, confirmPassword } = req.body;
    const user = await User.findOne({ "verification.resetPasswordToken": otp });
    if (confirmPassword && newPassword !== confirmPassword) {
        return next(new AppError("Passwords are incorrect.", 400));
    }
    user.password = newPassword;
    user.verification.resetPasswordToken = undefined;
    user.verification.resetPasswordTokenExpire = undefined;
    if(user.status ==="deleted") {
        user.status = "active"
    }
    await user.save();
    sendSuccessResponse(res, 200, logger, {
        message: "Password updated successfully.",
    });
});

exports.saveFcmToken = () => catchAsync(async (req, res, next) => {
    const { fcmToken } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { fcm_token: fcmToken },
        {
            new: true,
            runValidators: true,
        }
    );
    sendSuccessResponse(res, 200, logger, {
        message: "Token saved successfully.",
        doc: updatedUser,
    });
});