const otpGenerator = require('otp-generator')
const User = require('../models/userModel');

const options = {
    upperCaseAlphabets: false,
    specialChars: false,
    lowerCaseAlphabets: false
}

const generateOtp = async (type , maxAttempts = 20) => {
    let attempts = 0;
    let otp;

    while (attempts < maxAttempts) {
        otp = otpGenerator.generate(6, options);

        const query = type === 'email' 
        ?
            { 
                'verification.emailToken': otp, 
                'verification.emailTokenExpire': { $gt: new Date() } 
            } 
        :
            { 
                'verification.resetPasswordToken': otp, 
                'verification.resetPasswordTokenExpire': { $gt: new Date() } 
            };

        const existingUser = await User.findOne(query);

        if (!existingUser) {
            return otp;
        }

        attempts++;
    }

    throw new Error('Failed to generate OTP. please try again later.')
}

module.exports = generateOtp;