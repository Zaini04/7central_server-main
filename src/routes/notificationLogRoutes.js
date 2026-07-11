const express = require("express");
const router = express.Router();

const controller = require("../controllers/notificationLogController");
const { protect } = require("../middlewares/protect");

// admin only ideally
router.get("/", protect, controller.getAll);

module.exports = router;