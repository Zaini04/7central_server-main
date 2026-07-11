const IMG_DIR = require("../constants/imgDir.constants");
const menus = require("../constants/menus.constants");
const {
    createPayment,createInventoryPayment,verifyPayment,
    getAllPayments,
    getSinglePayment,
    mergePayment,
    mergePendingPayment
} = require("../controllers/paymentController");
const { protect, checkAccess, isSuperAdmin } = require("../middlewares/protect");
const setUploadDirectory = require("../middlewares/setUploadDirectory");
const router = require("express").Router();
const { printRequest } = require("../logger")("PAYMENT_CONTROLLER");
const upload = require("../middlewares/multer");


router.route("/",)
    .get(printRequest , protect ,checkAccess(menus.payment),
       getAllPayments);
router.route("/merge",)
    .post(printRequest , protect ,checkAccess(menus.payment),
       mergePayment);
router.route("/merge-pending",)
    .post(printRequest , protect ,checkAccess(menus.payment),
       mergePendingPayment);
router.route("/submit-pay-installment",)
    .post(printRequest , protect ,checkAccess(menus.payment),
    setUploadDirectory(IMG_DIR.payment),
       createPayment);
router.route("/submit-inventory-payment",)
    .post(printRequest , protect ,checkAccess(menus.payment),
    setUploadDirectory(IMG_DIR.payment),
       createInventoryPayment);
       
router.route("/verify-payment-from-admin",)
    .put(printRequest , protect ,isSuperAdmin,
           verifyPayment);
router.route("/:id",)
    .get(printRequest ,
           getSinglePayment);

       




module.exports = router;