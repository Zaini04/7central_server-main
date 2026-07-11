const sendCookie = (res , token) => {
    let cookieOptions =  {
        expires : new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly : true
    }
    if(process.env.NODE_ENV === "production") cookieOptions.secure = true ;
    res.cookie('token' , token  , cookieOptions);
}

module.exports = sendCookie;