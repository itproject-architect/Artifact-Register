var express = require("express");
var router = express.Router();
var Artifactpost = require("../models/artifactpost");
var middleware = require("../middleware");
var config = require("../config.js");

//--------------------ROUTES--------------------
//INDEX ROUTE
router.get("/timeline", function(req, res){
    var admin = config.admin;
    Artifactpost.find({}, function(err, allArtiposts){
        if(err){
            console.log(err);
        }else{
            res.render("timeline/index",{artipost:allArtiposts, admin:admin});
        }
    });
});


//CREATE ARTIFACT POST ROUTE
router.post("/timeline", middleware.isLoggedIn, function(req, res){
    var name = req.body.name;
    var year = req.body.year;
    var image = req.body.image;
    var desc = req.body.description;
    var author = {
        id: req.user._id,
        username: req.user.username
    }
    var newArtipost = {name:name, year:year, image:image, description:desc, author:author};
    Artifactpost.create(newArtipost, function(err, newlyCreated){
        if(err){
            console.log(err);
        }else{
            res.redirect("/timeline");
        }
    });
});

//NEW ARTIFACT POST ROUTE (displays form)
router.get("/timeline/new", middleware.isLoggedIn, function(req, res){
    res.render("timeline/new");
});

//SHOW ARTIFACT POST ROUTE
router.get("/timeline/:id", function(req,res){
   Artifactpost.findById(req.params.id).populate("comments").exec(function(err, foundArtipost){
       if(err || !foundArtipost){
            req.flash("error", "Artifact not found.");
            res.redirect("back");
       }else{
           console.log(foundArtipost);
           res.render("timeline/show", {artipost: foundArtipost});
       }
   });
   
})

//EDIT ARTIFACT POST ROUTE
router.get("/timeline/:id/edit", middleware.checkBlogpostOwnership, function(req, res){
    Artifactpost.findById(req.params.id, function(err, foundArtipost){
        if(err){
            res.redirect("/timeline");
            
        }else{
            res.render("timeline/edit", {artipost: foundArtipost});
            
        }
    });
});

//UPDATE ARTIFACT POST
router.put("/timeline/:id", middleware.checkBlogpostOwnership, function(req, res){
    Artifactpost.findByIdAndUpdate(req.params.id, req.body.artipost, function(err, updatedArtipost){
        if(err){
            res.redirect("/timeline");
        }else{
            res.redirect("/timeline/" + req.params.id);
        }
    });
});

//DESTROY   POST
router.delete("/timeline/:id", middleware.checkBlogpostOwnership,  function(req, res){
    Artifactpost.findByIdAndRemove(req.params.id, function(err){
        if(err){
            res.redirect("/timeline");
        }else{
            res.redirect("/timeline");
        }
    }); 
});

module.exports = router;