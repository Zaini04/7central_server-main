const IMG_DIR = require("../constants/imgDir.constants");
const menus = require("../constants/menus.constants");
const {
    createCustomerDocument , createInventoryDocument,updateDocument,deleteOne,
    getAllDocuments
} = require("../controllers/documentController");
const { protect, checkAccess } = require("../middlewares/protect");
const setUploadDirectory = require("../middlewares/setUploadDirectory");
const router = require("express").Router();
const { printRequest } = require("../logger")("NOTIFICATION_SETTING_CONTROLLER");
const upload = require("../middlewares/multer");


router.route("/",)
    .get(printRequest , protect ,checkAccess(menus.document),
    // upload.array('files', 5),
       getAllDocuments);
       
router.route("/create-customer-document",)
    .post(printRequest , protect ,checkAccess(menus.document),
    setUploadDirectory(IMG_DIR.document),
    // upload.array('files', 5),
       createCustomerDocument);
       
router.post("/create-inventory-document",printRequest , protect ,checkAccess(menus.document),
    setUploadDirectory(IMG_DIR.document),
    upload.array('files', 5),   createInventoryDocument)

    router.put("/:id",)

router.route('/:id')
    .put(printRequest , protect ,checkAccess(menus.document),
    setUploadDirectory(IMG_DIR.document),
    upload.array('files', 5),   updateDocument
    )
    .delete(printRequest , protect , checkAccess(menus.document) , deleteOne)


module.exports = router;