const {
    createNotification , 
    getAllNotifications , 
    getMyNotifications , 
    deleteNotification
} = require("../controllers/notificationController");
const { protect } = require("../middlewares/protect");
const router = require("express").Router();
const { printRequest } = require("../logger")("NOTIFICATION_CONTROLLER");


router.route("/")
    .post(printRequest , protect , createNotification)
    .get(printRequest , protect , getAllNotifications)

router.get('/my' , printRequest , protect , getMyNotifications);

router.route('/:id')
    .delete(printRequest , protect , deleteNotification)

module.exports = router;