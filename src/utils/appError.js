class AppError extends Error {
   constructor(message , statusCode){
    super(message);
    this.message = message;
    this.message2 = message; // line 4 message gets disappeared somewhere?
    this.statusCode = statusCode || 500;
    this.status = `${this.statusCode}`.startsWith("4") ? "error" : "failed";
    this.isOperational = true;
    this.stack = Error.captureStackTrace(this, this.constructor);
   }
}
module.exports = AppError;


// 2) Cash Async function to avoid try catch block 
// file Location => src/utils/catchAsync.js

// const catchAsync = fn => {
//    return (req ,res , next) => {
//       fn(req , res , next).catch(err => next(err))
//    }
// }

// module.exports = catchAsync ;

// 3) AppError Class for generating error
// File Location => src/utils/appError.js

// class AppError extends Error {
//    constructor(message , statusCode){
//       super(message);
//       this.message = message ;
//       this.statusCode = statusCode || 500 ;
//       this.status = `${this.statusCode}`.startsWith('4') ? 'error' : 'failed';
//       this.isOperational = true ;
//       this.stack = Error.captureStackTrace(this , this.constructor);
//    }
// }
// module.exports = AppError;


// how i use this code and how i generate errors 

// catchAsync(async(req ,res , next) => {
//    return next(new AppError('message' , statusCode))
// })