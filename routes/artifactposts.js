var express = require("express");
var router = express.Router();
var Artifactpost = require("../models/artifactpost");
var middleware = require("../middleware");
var config = require("../config.js");
var asyncHandler = require("express-async-handler");
var http = require('http');
var url = require('url');
var util = require('util');


//--------------------CONFIGURING MULTER and CLOUDINARY FOR IMAGE UPLOAD
// adapted from https://github.com/nax3t/image_upload_example/tree/edit-delete --------------------

var multer = require('multer');
var storage = multer.diskStorage({
    filename: function (req, file, callback) {
        callback(null, Date.now() + file.originalname);
    }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are supported'), false);
    }
    cb(null, true);
};
var upload = multer({storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({
    cloud_name: 'dvwezxakw',
    api_key: '862182883151951',
    api_secret: '75kzWvbY-siNUFuUWHLVpzmAcDU'
});

//--------------------ROUTES--------------------
//INDEX ROUTE
router.get(
    "/artifactposts", function (req, res) {
        var admin = config.admin;
        Artifactpost.find({}).exec(function (err, allArtiposts) {
            if (err) {
                console.log(err);
            } else {
                var artipost;
                if (req.user) {
                    artipost = getPrivatePosts(allArtiposts, req.user.username);
                } else {
                    artipost = getPublicPosts(allArtiposts);
                }
                artipost.sort(function (a,b) {
                    return b.year - a.year;
                });
                res.render("artifactposts/index", {
                    artipost: artipost,
                    admin: admin
                });
            }
        });
    }
);

function getPrivatePosts(allArtiposts, email) {
    let newPosts = [];
    console.log("iteration ", email);

    for (var prop in allArtiposts) {
        let post = allArtiposts[prop];
        console.log("iteration author ", post.author.username);
        console.log("iteration name ", post.name);

        if (post.option === "1" || post.option === "2") {
            console.log("post name public family ", post.name);
            newPosts.push(post);
        } else if (post.option === "3" && post.author.username === email) {
            console.log("post name private ", post.name);

            newPosts.push(post);
        }
    }
    return newPosts;
}

function getPublicPosts(allArtiposts) {
    let newPosts = [];
    for (var prop in allArtiposts) {
        let post = allArtiposts[prop];
        if (post.option === "1") {
            newPosts.push(post);
        }
    }
    return newPosts;
}

//CREATE ARTIFACT POST ROUTE
router.post("/artifactposts", middleware.isLoggedIn, upload.array('image', 5), function (req, res) {
    let files = req.files;
    // Files contains an array of "images" {destination, fieldname, filename, path, size ...}

    let uploadPromises = files.map((value, index, array) => {
        return new Promise((resolve, reject) => {
            cloudinary.uploader.upload(value.path, (result) => {
                resolve(result)
            })
        })
    });



    Promise.all(uploadPromises).then( (result) => {
        let images = result.map(value => value.secure_url)
        let imageIds = result.map(value => value.public_id)
        var name = req.body.name;
        var year = req.body.year;
        var location = req.body.location;
        var desc = req.body.description;
        var option = req.body.option
        var author = {
            id: req.user._id,
            username: req.user.username
        }
        var newArtipost = {
            name: name,
            year: year,
            imageId: imageIds,
            image: images,
            description: desc,
            location: location,
            option: option,
            author: author
        };
        Artifactpost.create(newArtipost, function (err, newlyCreated) {
            if (err) {
                console.log(err);
            } else {
                res.redirect("/artifactposts");
            }
        });
    }).catch( (error) => {
        console.log("error", error)
    })

});

//NEW ARTIFACT POST ROUTE (displays form)
router.get("/artifactposts/new", middleware.isLoggedIn, function (req, res) {
    res.render("artifactposts/new");
});

function filterByYear(artiposts, year) {
    var newArtiposts = [];
    for (var i in artiposts) {
        if (artiposts[i].year === year) {
            newArtiposts.push(artiposts[i]);
        }
    }
    return newArtiposts;
}

// Search artifact by name, don't need to log in
router.get("/artifactposts/search", function (req, res) {
    var params = url.parse(req.url, true).query;
    Artifactpost.find({
        "name" : {$regex : params.name.replace(" ", "|"), $options : "$i"},    // RegExp matching, case insensitive
        "author.username" : {$regex : params.author, $options : "$i"}
    }).populate("comments").exec(function (err, results) {
        if (err) {
            console.log(err);
        } else {
            if (req.user) {
                results = getPrivatePosts(results, req.user.username);
            } else {
                results = getPublicPosts(results);
            }
            if (params.date !== "") {
                results = filterByYear(results, Number(params.date));
            }
            results.forEach(function (item) {
                console.log(item.id + "\t" + item.name)
            });
            res.render("artifactposts/index", {artipost : results, admin : config.admin});
        }
    });
});

//SHOW ARTIFACT POST ROUTE
router.get("/artifactposts/:id", function (req, res) {
    Artifactpost.findById(req.params.id).populate("comments").exec(function (err, foundArtipost) {
        if (err || !foundArtipost) {
            req.flash("error", "Artifact not found.");
            res.redirect("back");
        } else {
            res.render("artifactposts/show", {artipost: foundArtipost});
        }
    });

})

//EDIT ARTIFACT POST ROUTE
router.get("/artifactposts/:id/edit", middleware.checkBlogpostOwnership, function (req, res) {
    Artifactpost.findById(req.params.id, function (err, foundArtipost) {
        if (err) {
            res.redirect("/artifactposts");

        } else {
            res.render("artifactposts/edit", {artipost: foundArtipost});

        }
    });
});

//UPDATE ARTIFACT POST
router.put("/artifactposts/:id", middleware.checkBlogpostOwnership, upload.array('image', 5), function (req, res) {

    Artifactpost.findById(req.params.id, async function (err, updatedArtipost) {
        if (err) {
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            if (req.files.length > 0) {
                let {files} = req;
                let {image, imageId} = updatedArtipost;
                let destroyPromises = imageId.map( (value) => cloudinary.v2.uploader.destroy(value))
                let uploadPromises = files.map((value) => cloudinary.uploader.upload(value.path));

                try {
                    await Promise.all(destroyPromises);
                    let uploads = await Promise.all(uploadPromises);

                    let images_ids = uploads.map(value => value.public_id);
                    let images_secure_urls = uploads.map(value => value.secure_url);

                    updatedArtipost.imageId = images_ids;
                    updatedArtipost.image = images_secure_urls;
                } catch (err) {
                    req.flash('error', err.message);
                    return res.redirect('back');
                }
            }

            updatedArtipost.name = req.body.name;
            updatedArtipost.year = req.body.year;
            updatedArtipost.option = req.body.option;
            updatedArtipost.description = req.body.description;
            updatedArtipost.save();

            req.flash('success', "successfuly updated")
            res.redirect("/artifactposts/" + req.params.id);

        }
    });
});

//DESTROY   POST
router.delete("/artifactposts/:id", middleware.checkBlogpostOwnership, function (req, res) {
    Artifactpost.findById(req.params.id, async function (err, post) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect('back');
        }

        let {imageId} = post;
        let destroyPromises = imageId.map( (value) => cloudinary.v2.uploader.destroy(value))

        try {

            await Promise.all(destroyPromises);
            post.remove();
            req.flash('success', 'Successfuly deleted')
            res.redirect('/artifactposts');
        } catch (err) {
            if (err) {
                req.flash('error', err.message);
                return res.redirect('back');
            }
        }

    });
});

module.exports = router;