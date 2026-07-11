const IMG_DIR = require("../constants/imgDir.constants");
const menus = require("../constants/menus.constants");
const {
    createProvisionalReceipt,updatePRBounce,updatePRApproved,getAllPRs
} = require("../controllers/prController");
const { protect, checkAccess } = require("../middlewares/protect");
const setUploadDirectory = require("../middlewares/setUploadDirectory");
const router = require("express").Router();
const { printRequest } = require("../logger")("PAYMENT_CONTROLLER");
const upload = require("../middlewares/multer");


router.route("/",)
    .get(printRequest , protect ,checkAccess(menus.payment),
       getAllPRs);
router.route("/",)
    .post(printRequest , protect ,checkAccess(menus.payment),
    setUploadDirectory(IMG_DIR.payment),
       createProvisionalReceipt);
router.route("/:id/cheque-bounced",)
    .put(printRequest , protect ,checkAccess(menus.payment),
    setUploadDirectory(IMG_DIR.payment),
       updatePRBounce);
router.route("/:id/cheque-cleared",)
    .put(printRequest , protect ,checkAccess(menus.payment),
    setUploadDirectory(IMG_DIR.payment),
       updatePRApproved);
       

       




module.exports = router;