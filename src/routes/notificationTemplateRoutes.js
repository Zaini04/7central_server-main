const express = require("express");
const router = express.Router();

const controller = require("../controllers/notificationTemplateController");
const { protect } = require("../middlewares/protect");

// add your admin auth middleware if you have one
router.post("/", protect, controller.create);
router.get("/", protect, controller.getAll);
router.get("/:id", protect, controller.getOne);
router.patch("/:id", protect, controller.update);
router.delete("/:id", protect, controller.delete);

module.exports = router;