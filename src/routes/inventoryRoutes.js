const router = require("express").Router();
const IMG_DIR = require("../constants/imgDir.constants");
const menus = require("../constants/menus.constants");
const {
    createInventory,
    getAllInventories,
    getSingle,
    update,
    deleteInventory,
    inventoryPaymentStats,
    createCSVUploadOfInventory
} = require("../controllers/inventoryController");
const upload = require("../middlewares/multer");
const { printRequest } = require("../logger")("SONG_CONTROLLER");
const { protect , checkAccess } = require('../middlewares/protect');
const setUploadDirectory = require("../middlewares/setUploadDirectory");



router.route('/')
    .post(
        printRequest ,
        protect , 
        checkAccess(menus.inventories) ,
        createInventory
    )
    .get(printRequest , protect , getAllInventories )

router.get('/payment-stats' , printRequest , protect , inventoryPaymentStats)
// router.get('/by-category/:category' , printRequest , protect , getSongsByCategory)
// router.get('/cast-details-with-songs/:castId' , printRequest , protect , getCastDetailsWithSongs)
// router.get('/new-release-and-most-listened' , printRequest , getNewAndMostListenedSongs)
router.post('/upload-by-csv' , printRequest , protect , createCSVUploadOfInventory)

router.route('/:id')
    .get(printRequest , getSingle)
    .put(
        printRequest ,
        protect , 
        checkAccess(menus.inventories) ,
        update
    )
    .delete(printRequest , protect , checkAccess(menus.songs) , deleteInventory)

module.exports = router;