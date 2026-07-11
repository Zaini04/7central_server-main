
const { createSale, createPaymentPlan, getPaymentPlan, getAllInstallments, changeInventoryOwnershipSale, getSingleInventoryAllOwnerShips, getSingleInstallment, updatePaymentPlan } = require("../controllers/saleController");
const { protect } = require("../middlewares/protect");
const router = require("express").Router();
const { printRequest } = require("../logger")("FAVORITE_CONTROLLER");


router.route("/assign-inventory")
    .post(printRequest , protect , createSale)

    router.route("/inventory-ownership-transfer")
    .post(printRequest , protect , changeInventoryOwnershipSale)
router.route("/create-purchase-plan")
    .post(printRequest , protect , createPaymentPlan)
router.route("/update-purchase-plan")
    .post(printRequest , protect , updatePaymentPlan)
router.route("/get-purchase-plan")
    .get(printRequest , protect , getPaymentPlan)
router.route("/get-all-installments")
    .get(printRequest , protect , getAllInstallments)
router.route("/get-all-installments/:id")
    .get(printRequest , protect , getSingleInstallment)
router.route("/get-inventory-all-ownership-history")
    .get(printRequest , protect , getSingleInventoryAllOwnerShips)

// router.get("/my", printRequest, protect , getAllMyFavorites);

// router.route('/:id')
//     .delete(printRequest , protect , removeFromFavorite)

module.exports = router;