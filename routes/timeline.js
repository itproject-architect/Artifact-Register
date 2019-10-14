var express = require("express");
var router = express.Router();
var Artifactpost = require("../models/artifactpost");
var middleware = require("../middleware");
var config = require("../config.js");

//--------------------ROUTES--------------------


router.get(
    "/timeline", function (req, res) {
        var query = (req.user) ? {$or: [{option : '1'},{option :'2'}, {"author.id" : req.user._id}] } : {option : '1'}
        //ternary query if logged in, check for post marked as public(1), friends only(2) and private( user id matches author id)

        Artifactpost.find(query)
            .sort({year : -1}) //display most recently created post to be on top
            .exec(function (err, allArtiposts) {
                    if (err) console.log(err);
                    res.render("timeline/index", {
                        artipost: allArtiposts
                    });
                })
    }
);

module.exports = router;