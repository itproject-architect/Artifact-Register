const express = require("express");
const router = express.Router();
const Artifactpost = require("../models/artifactpost");

//--------------------ROUTES--------------------

router.get(
    "/", function (req, res) {

        Artifactpost.find()
            .sort({year : -1}) //display most recently created post to be on top
            .limit(5)
            .exec(function (err, allArtiposts) {
                if (err) console.log(err);
                res.render("landing", {
                    artipost: allArtiposts
                });
            })
    }
);

module.exports = router;