// const aws = require('aws-sdk')

// aws.config.update({
//     accessKeyId: process.env.AWS_S3_ACCESS_KEY ,
//     secretAccessKey: process.env.AWS_S3_SECRET_KEY ,
//     region: process.env.AWS_S3_REGION,
//     // signatureVersion : 'v4'
// });

// const s3 = new aws.S3({
//     region : process.env.AWS_S3_REGION
// })


// exports.createAd = catchAsync(async(req , res , next) => {
//     const { audioFileName , uploadType , fileType } = req.body;
//     // const { error } = adValidations.validate(req.body);
//     // if(error) {
//     //     return next(new AppError(error.details[0].message , 400))
//     // }

//     if(req.file) {
//         req.body.image = req.file.location;
//     }

//     // const ad = await Ad.create(req.body);

//     if(uploadType === 'single') {

//         const params = {
//             Bucket: process.env.AWS_S3_BUCKET_NAME,
//             Key: `${audioFileName}` ,
//             Expires: 60 * 60, // Expires in 5 minutes
//             ContentType: fileType
//         };
        
//         const url = await s3.getSignedUrl('putObject' , params);
//         console.log({ params , url })
//         sendSuccessResponse(res , 200 , logger , {
//             message: 'Ad created.' ,
//             uploadUrl: url ,
//             // doc : ad 
//         })

//     }else if(uploadType === 'multipart') {

//     }

// });