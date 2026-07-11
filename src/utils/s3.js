const { S3Client } = require('@aws-sdk/client-s3');
const { NodeHttpHandler } = require('@smithy/node-http-handler');


const config = {
    // region: process.env.AWS_S3_REGION,
    credentials: {
        // accessKeyId: process.env.AWS_S3_ACCESS_KEY,
        // secretAccessKey: process.env.AWS_S3_SECRET_KEY
    } ,
    requestHandler: new NodeHttpHandler({
        connectionTimeout: 30 * 60 * 1000, 
        socketTimeout: 30 * 60 * 1000,   
    }),
}

const s3 = new S3Client(config);

module.exports = s3;