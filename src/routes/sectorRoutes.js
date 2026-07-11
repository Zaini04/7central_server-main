const router = require("express").Router();
const menus = require("../constants/menus.constants");
const {
    create,
    getAll,
    getSingle,
    update,
    deleteSector
} = require("../controllers/sectorController");
const { printRequest } = require("../logger")("SECTOR_CONTROLLER");
const { protect , checkAccess } = require('../middlewares/protect');

router.route('/')
    .post(
        printRequest ,
        protect , 
        checkAccess(menus.sectors) ,
        create
    )
    .get(printRequest , protect , checkAccess(menus.sectors) , getAll);


router.route('/:id')
    .get(printRequest , protect , checkAccess(menus.sectors) , getSingle)
    .put(
        printRequest , 
        protect , 
        checkAccess(menus.sectors) , 
        update
    )
    .delete(printRequest , protect , checkAccess(menus.sectors) , deleteSector);


module.exports = router;