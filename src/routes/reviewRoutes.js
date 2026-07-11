const {
    getSingleSongReviews ,
    createReview , 
    deleteReview , 
    getSingleReview
} = require("../controllers/reviewController");
const { protect } = require("../middlewares/protect");
const router = require("express").Router();
const { printRequest } = require("../logger")("REVIEW_CONTROLLER");


router.route("/")
    .post(printRequest , protect , createReview)

router.get('/song/:songId' , printRequest , protect , getSingleSongReviews);

router.route('/:id')
    .get(printRequest , protect , getSingleReview)
    .delete(printRequest , protect , deleteReview)

module.exports = router;