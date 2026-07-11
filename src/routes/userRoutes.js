const router = require("express").Router();
const IMG_DIR = require("../constants/imgDir.constants");
const menus = require("../constants/menus.constants");
const {
    adminLogin,
    userLogin ,
    logout,
    getProfile,
    updatePassword,
    forgotPassword,
    verifyOtp,
    resetPassword,
    resendOtp,
    getAllUsers,
    getSingleUser,
    updateUser,
    deleteUser,
    register,
    updateProfile ,
    saveFcmToken,
    sendContactEmail,
    googleLogin,
    appleLogin , 
    deleteMyAccount,
    getAllAdminUsers,
    adminUserRegister,
    getInventorySalesSeries,
    dashboardStats
} = require("../controllers/userController");
const upload = require("../middlewares/multer");
const { printRequest } = require("../logger")("USER_CONTROLLER");
const { protect , checkAccess, isSuperAdmin } = require('../middlewares/protect');
const setUploadDirectory = require("../middlewares/setUploadDirectory");

router.post("/login", printRequest, userLogin);
router.post("/google-login", printRequest, googleLogin);
router.post("/apple-login", printRequest, appleLogin);
router.post("/admin-login", printRequest, adminLogin);
router.post("/register", printRequest, register);
router.post("/register-admin-user", printRequest, adminUserRegister);
router.get("/profile", printRequest, protect, getProfile);
router.put(
    '/update-profile' , 
    printRequest , 
    protect , 
    setUploadDirectory(IMG_DIR.user) , 
    upload.single('image') , 
    updateProfile
)
router.post("/forgot-password", printRequest, forgotPassword);
router.post("/verify-otp", printRequest, verifyOtp);
router.post("/resend-otp", printRequest, resendOtp);
router.put("/reset-password", printRequest, resetPassword);
router.put("/update-password", printRequest, protect, updatePassword);
router.put("/save-fcm-token", printRequest, protect, saveFcmToken);
router.get("/logout", printRequest, logout);
router.post('/send-contact-message' , printRequest , sendContactEmail)

router.get('/' , printRequest , protect , checkAccess(menus.user) , getAllUsers);
router.get('/dashboard-stats' , printRequest , protect  , dashboardStats);
router.get('/dashboard-inventory-sale-stats' , printRequest , protect  , getInventorySalesSeries);
router.get('/all-admins' , printRequest , protect , isSuperAdmin, getAllAdminUsers);
router.delete('/delete-my-account' , printRequest , protect , deleteMyAccount)

router.route('/:id')
    .get(printRequest , protect , checkAccess(menus.user) , getSingleUser)
    .put(printRequest , protect , checkAccess(menus.user) , updateUser)
    .delete(printRequest , protect , isSuperAdmin , deleteUser)


module.exports = router;