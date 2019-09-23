var express = require("express");
var router = express.Router();
var Artifactpost = require("../models/artifactpost");
var middleware = require("../middleware");
var config = require("../config.js");

//--------------------ROUTES--------------------
//INDEX ROUTE
router.get("/timeline", function(req, res){
    var admin = config.admin;
    Artifactpost.find({},{'_id': 0,}, {sort: '-year'}, function(err, allArtiposts){
        if(err){
            console.log(err);
        }else{

            res.render("timeline/index",{artipost:allArtiposts, admin:admin});
        }
    });
});

module.exports = router;