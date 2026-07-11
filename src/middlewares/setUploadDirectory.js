
const setUploadDirectory = (directory) => {
    return (req, res, next) => {
        req.uploadDirectory = directory;
        next();
    };
};

module.exports = setUploadDirectory;
