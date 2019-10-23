var express = require("express");
var router = express.Router();
var Artifactpost = require("../models/artifactpost");
var middleware = require("../middleware");
var config = require("../config.js");

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