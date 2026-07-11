const jwt = require('jsonwebtoken');

const signToken = (payload) => {
    return jwt.sign( payload , process.env.JWT_SECRET , {
        expiresIn : process.env.JWT_EXPIRES
    })
}

module.exports = signToken;