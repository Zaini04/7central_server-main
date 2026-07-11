const menus = require("../constants/menus.constants");
const {
    createOrUpdate , getByCustomer
} = require("../controllers/notificationSettingController");
const { protect, checkAccess } = require("../middlewares/protect");
const router = require("express").Router();
const { printRequest } = require("../logger")("NOTIFICATION_SETTING_CONTROLLER");


router.route("/create-or-update")
    .post(printRequest , protect ,checkAccess(menus.customers) , createOrUpdate)


router.get('/customer/:customerId' , printRequest , protect , getByCustomer);


module.exports = router;