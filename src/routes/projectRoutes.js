const router = require("express").Router();
const menus = require("../constants/menus.constants");
const {
    create,
    getAll,
    getSingle,
    update,
    deleteProject
} = require("../controllers/projectController");
const { printRequest } = require("../logger")("PROJECT_CONTROLLER");
const { protect , checkAccess } = require('../middlewares/protect');

router.route('/')
    .post(
        printRequest ,
        protect , 
        checkAccess(menus.projects) ,
        create
    )
    .get(printRequest , protect , checkAccess(menus.projects) , getAll);


router.route('/:id')
    .get(printRequest , protect , checkAccess(menus.projects) , getSingle)
    .put(
        printRequest , 
        protect , 
        checkAccess(menus.projects) , 
        update
    )
    .delete(printRequest , protect , checkAccess(menus.projects) , deleteProject);


module.exports = router;