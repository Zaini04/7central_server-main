const express = require("express");
const router = express.Router();

const controller = require("../controllers/broadcastCampaignController");
const { protect } = require("../middlewares/protect");

// add your admin auth middleware if needed
router.post("/", protect, controller.create);
router.get("/", protect, controller.getAll);
router.get("/:id", protect, controller.getOne);
router.patch("/:id", protect, controller.update);
router.post("/:id/send", protect, controller.send);
router.delete("/:id", protect, controller.delete);

module.exports = router;