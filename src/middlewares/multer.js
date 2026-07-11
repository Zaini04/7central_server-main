const multer = require('multer');
const { S3Client  } = require('@aws-sdk/client-s3');
const multerS3 = require('multer-s3');
const path = require('path');
const fs = require("fs");

// Configure AWS S3 Client
const s3 = new S3Client({
    // region: process.env.AWS_S3_REGION,
    credentials: {
        // accessKeyId: process.env.AWS_S3_ACCESS_KEY,
        // secretAccessKey: process.env.AWS_S3_SECRET_KEY,
    },
    requestHandler: {
        connectionTimeout: 2 * 60 * 1000, 
        socketTimeout: 2 * 60 * 1000,    
    }
});

// Create multer S3 storage
const storage1 = multerS3({
    s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    metadata: (req, file, cb) => {
        cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
        const directory = req.uploadDirectory || ''; // Use `req.uploadDirectory` for dynamic folders
        const filePath = directory ? `${directory}/${filename}` : filename;
        cb(null, filePath);
    },
    contentType: multerS3.AUTO_CONTENT_TYPE,
});
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use dynamic directory from request, or default to /uploads
    const directory = req.uploadDirectory
      ? path.join(__dirname, `../uploads/${req.uploadDirectory}`)
      : path.join(__dirname, "../uploads");

    // ✅ Ensure directory exists
    fs.mkdirSync(directory, { recursive: true });

    cb(null, directory);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, filename);
  },
});
// Create file filter function
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg' , "application/pdf"];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Unsupported file type'), false);
    }
};

// Create upload middleware
const upload = multer({
    storage,
    fileFilter ,
    limits: {
        fileSize: 1024 * 1024 * 10, 
    },
});


module.exports = upload;