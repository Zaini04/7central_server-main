const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const { sendSuccessResponse } = require('../../utils/helpers');
const bcrypt = require('bcryptjs');
const APIFeatures = require('../../utils/APIFeatures');
const uploadImage = require('../../utils/uploadImage');
const { uploadBase64Image } = require('../../utils/uploadFiles');

exports.createOne = (Model , docValidation = null , logger , options = {} ) => catchAsync(async(req , res , next) => {
    const { imageField = 'image', isSingleImage = true , imgDir } = options;
    
    // Handle single image upload
    if (req.file && isSingleImage) {
        const newImage = req.file.location;
        req.body[imageField] = newImage;
    }

    // Handle multiple images upload
    if (req.files && !isSingleImage && req.files.length > 0) {
        const newImages = req.files.map(file => file.location);
        req.body[imageField] = [...doc[imageField], ...newImages]; // Append new images to existing ones
    }

    if(docValidation){
        const { error } = docValidation.validate(req.body);
        if(error){
            return next(new AppError(error.details[0].message , 400))
        }
    }

    const newDoc = await Model.create(req.body);
    return sendSuccessResponse(res , 201 , logger , {
        message : 'Created successfully.' ,
        doc : newDoc 
    })
});

exports.getMy = (Model, populateItems = {}, logger, query = {}) => {
    return catchAsync(async (req, res, next) => {
        query = { ...query, user: req.user._id };
        const features = new APIFeatures(Model.find(query), req.query)
            .filter()
            .limitFields()
            .sort()
            .paginate();

        const docs = await features.query.populate(populateItems);
        const docsCount = await Model.countDocuments({...query , ...features.queryObj});
        const pages = Math.ceil(docsCount / features.pageSize);

        sendSuccessResponse(res, 200, logger, {
            docs,
            page: features.page,
            pages,
            docsCount,
        });
    });
};

exports.getAll = (Model, populateItems = {}, logger, query = {}) => {
    return catchAsync(async (req, res, next) => {;
        const features = new APIFeatures(Model.find(query), req.query)
            .filter()
            .limitFields()
            .sort()
            .paginate();

        const docs = await features.query.populate(populateItems);
        const docsCount = await Model.countDocuments({...query , ...features.queryObj});
        const pages = Math.ceil(docsCount / features.pageSize);

        sendSuccessResponse(res, 200, logger, {
            docs,
            page: features.page,
            pages,
            docsCount,
        });
    });
};

exports.getTotal = (Model, populateItems = '' , logger) => catchAsync(async(req , res , next) => {
    const features = new APIFeatures(Model.find() , req.query)
    .filter()
    .limitFields()
    .sort();  

    const docs = await features.query.populate(populateItems)
    const docCount = await Model.countDocuments(features.queryObj);
    
    sendSuccessResponse(res , 200 , logger , {
        docs , docCount 
    });
});

exports.getOne = (Model, populateItems = '', logger, paramName = 'id', field = '_id') => catchAsync(async (req, res, next) => {
    const value = req.params[paramName];
    
    let query;
    if (field === '_id') {
        query = Model.findById(value);
    } else {
        query = Model.findOne({ [field] : value });
    }

    const doc = await query.populate(populateItems);
    if (!doc) return next(new AppError(`No record found with that ${field}.`, 404));
    sendSuccessResponse(res, 200, logger, { doc });
});

exports.updateOne = (Model, logger, options = {}) => catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { imageField = 'image', isSingleImage = true } = options;

    const doc = await Model.findById(id);
    if (!doc) {
        return next(new AppError('Document not found.', 404));
    }

    if(doc?.isSuperAdmin){
        return next(new AppError('You can not update super admin user.', 400));
    }
    // Handle single image upload
    // if (req.file && isSingleImage) {
    //     const newImage = req.file.location;
    //     req.body[imageField] = newImage;
    // }

    // // Handle multiple images upload
    // if (req.files && !isSingleImage && req.files.length > 0) {
    //     const newImages = req.files.map(file => file.location);
    //     req.body[imageField] = [...doc[imageField], ...newImages]; // Append new images to existing ones
    // }


    console.log(req.body);

      if(req.body.image && req.body.image.startsWith('data:image/')) {

         const base64String = req.body.image.split(",")[1];
        const uploadDir = `/uploads/${req.uploadDirectory}`;
    
        const result = await uploadBase64Image(base64String, uploadDir);
        const relativeAddress = `${req.uploadDirectory}/${result.fileName}`;
        req.body.image = relativeAddress;
      }
      
    // Handle password hashing if admin wants to update user password case
    if (req.body.password) {
        req.body.password = await bcrypt.hash(req.body.password, 10);
    }

    
    const updatedDoc = await Model.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true
    });

    return sendSuccessResponse(res, 200, logger, {
        message: 'Updated successfully.',
        doc: updatedDoc
    });
});


exports.deleteOne = (Model , logger ) => catchAsync(async( req , res , next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id , { status : 'deleted'} , {
        new : true 
    });
    if(doc?.isSuperAdmin){
        return next(new AppError('You can not update super admin user.', 400));
    }
    if(!doc){
        return next(new AppError('Document not found.' , 404))
    }
    sendSuccessResponse(res , 200 , logger , {
        message : 'Deleted successfully.' ,
        doc
    })
});

exports.removeFromDb = (Model , logger ) => catchAsync(async( req , res , next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    
    sendSuccessResponse(res , 200 , logger , {
        message : 'Deleted successfully.' ,
    })
});