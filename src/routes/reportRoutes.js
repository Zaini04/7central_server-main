const router = require("express").Router();
const menus = require("../constants/menus.constants");
const {
    reporting,
} = require("../controllers/reportController");
const { printRequest } = require("../logger")("SECTOR_CONTROLLER");
const { protect , checkAccess } = require('../middlewares/protect');

router.route('/')
    .get(
        printRequest ,
        // protect , 
        reporting
    );
    

module.exports = router;