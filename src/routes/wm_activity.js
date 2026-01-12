const express = require("express");
const router = express.Router();
const activityController = require("../controllers/activityController");

router.get("/:sid", activityController.getStatus);
router.post("/:sid", activityController.setDuty);

module.exports = router;
