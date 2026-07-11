const router = require("express").Router();
const IMG_DIR = require("../constants/imgDir.constants");
const menus = require("../constants/menus.constants");
const {
    create , createJoint , 
    getProgress,
    createNextOfKin,
    getSingle,
    update,
    deleteOne,
    getAll,
    updateNextOfKin,
    getCustomerInventories,
    getCustomerInstallments,
    getCustomerPayments,
    getCustomerPR
} = require("../controllers/customerController");
const upload = require("../middlewares/multer");
const { printRequest } = require("../logger")("CAST_CONTROLLER");
const { protect , checkAccess } = require('../middlewares/protect');
const setUploadDirectory = require("../middlewares/setUploadDirectory");

router.route('/')
    .post(
        printRequest , 
        protect , 
        checkAccess(menus.customers) ,
        setUploadDirectory(IMG_DIR.customer),
        // upload.single('image') , 
        create
    )
    .get(printRequest , protect , checkAccess(menus.customers) , getAll)

router.post('/joint-members' , printRequest , 
        protect , 
        checkAccess(menus.customers) ,
        setUploadDirectory(IMG_DIR.customer),
        upload.single('image') , 
        createJoint)
router.post('/next-of-kin' , printRequest , 
        protect , 
        checkAccess(menus.customers) ,
        setUploadDirectory(IMG_DIR.customer),
        // upload.single('image') , 
        createNextOfKin)

router.put('/update-next-of-kin/:id' , printRequest , 
        protect , 
        checkAccess(menus.customers) ,
        setUploadDirectory(IMG_DIR.customer),
        // upload.single('image') , 
        updateNextOfKin)
router.post('/progress/:id' , printRequest , protect ,checkAccess(menus.customers) , getProgress)
router.get('/:id/inventories' , printRequest , protect ,checkAccess(menus.customers) , getCustomerInventories)
router.get('/:id/installments' , printRequest , protect ,checkAccess(menus.customers) , getCustomerInstallments)
router.get('/:id/payments' , printRequest , protect ,checkAccess(menus.customers) , getCustomerPayments)
router.get('/:id/prs' , printRequest , protect ,checkAccess(menus.customers) , getCustomerPR)

router.route('/:id')
    .get(printRequest , protect , checkAccess(menus.customers) , getSingle)
    .put(
        printRequest , 
        protect , 
        checkAccess(menus.customers) ,
        setUploadDirectory(IMG_DIR.customer) , 
        // upload.single('image') , 
        update
    )
    .delete(printRequest , protect , checkAccess(menus.customers) , deleteOne)


module.exports = router;