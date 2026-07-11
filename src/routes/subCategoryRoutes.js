const router = require("express").Router();
const IMG_DIR = require("../constants/imgDir.constants");
const menus = require("../constants/menus.constants");
const {
    createSubCategory , getAllSubCategories , getSingleSubCategory , updateSubCategory , deleteSubCategory,
    getTotalSubCategories
} = require("../controllers/subCategoryController");
const { printRequest } = require("../logger")("SUB_CATEGORY_CONTROLLER");
const { protect , checkAccess } = require('../middlewares/protect');


router.route('/')
    .post(printRequest , protect , checkAccess(menus.subCategory) , createSubCategory)
    .get(printRequest , protect , checkAccess(menus.subCategory) , getAllSubCategories)

router.get('/total' , printRequest , protect , checkAccess(menus.subCategory) , getTotalSubCategories)

router.route('/:id')
    .get(printRequest , protect , checkAccess(menus.subCategory) , getSingleSubCategory)
    .put(printRequest , protect , checkAccess(menus.subCategory) , updateSubCategory)
    .delete(printRequest , protect , checkAccess(menus.subCategory) , deleteSubCategory)

module.exports = router;