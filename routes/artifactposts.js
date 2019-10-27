const express = require("express");
const router = express.Router();
const Artifactpost = require("../models/artifactpost");
const middleware = require("../middleware");
const config = require("../config.js");
const url = require('url');
const multer = require('multer');
const ensure = require('connect-ensure-login');


//--------------------CONFIGURING MULTER and CLOUDINARY FOR IMAGE UPLOAD
// adapted from https://github.com/nax3t/image_upload_example/tree/edit-delete --------------------

var storage = multer.diskStorage({
    filename: function (req, file, callback) {
        callback(null, Date.now() + '_' + file.originalname);
    }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(bmp|jpg|jpeg|png|gif|tif)$/i)) {
        return cb(new Error('Only image files are supported'), false);
    }
    cb(null, true);
};
var upload = multer({storage: storage, fileFilter: imageFilter});

var cloudinary = require('cloudinary');
cloudinary.config({
    cloud_name: 'dvwezxakw',
    api_key: '862182883151951',
    api_secret: '75kzWvbY-siNUFuUWHLVpzmAcDU'
});

var perPage = 6;    // Maximum number of artifacts per page (6 items are displayed)

//--------------------ROUTES--------------------

//index routes
router.get(
    "/artifactposts", function (req, res) {
        var reqURL = url.parse(req.url, true);
        var page = reqURL.query.page || 1;    //current page number
        var path = reqURL.pathname;
        var admin = config.admin;
        var query = (req.user) ? {$or: [{option: '1'}, {option: '2'}, {"author.id": req.user._id}]} : {option: '1'};
        //ternary query if logged in, check for post marked as public(1), friends only(2) and private( user id matches author id)

        Artifactpost.find(query)
            .sort({created: -1}) //display most recently created post to be on top
            .skip((perPage * page) - perPage) // skip and limit for indexing  (used for pagination)
            .limit(perPage)
            .exec(function (err, allArtiposts) {
                Artifactpost.countDocuments(query).exec(function (err, count) { //count the number of query documents
                    if (err) console.log(err);
                    res.render("artifactposts/index", {
                        artipost: allArtiposts,
                        admin: admin,
                        current: page,
                        pages: Math.ceil(count / perPage),
                        path: path
                    })
                });
            });
    });


//CREATE ARTIFACT POST ROUTE
router.post("/artifactposts", ensure.ensureLoggedIn('/login'), upload.array('image', 5), function (req, res) {
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
        let images = result.map(value => value.secure_url);
        let imageIds = result.map(value => value.public_id);
        var name = req.body.name;
        var year = req.body.year;
        var location = req.body.location;
        var desc = req.body.description;
        var option = req.body.option;
        var author = {
            id: req.user._id,
            username: req.user.username,
            name: req.user.name,
            photo: req.user.photo
        };
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
        console.log("Error: ", error)
    })

});

//NEW ARTIFACT POST ROUTE (displays form)
router.get("/artifactposts/new", ensure.ensureLoggedIn('/login'), function (req, res) {
    res.render("artifactposts/new");
});

// Search artifact by name, don't need to log in
router.get("/artifactposts/search", function (req, res) {
    var reqURL = url.parse(req.url, true);
    var path = reqURL.path;
    var params = reqURL.query;
    var page = params.page || 1;    //current page number
    var query = {
        "name" : {$regex : params.name.replace(/\s/g, "|"), $options : "$i"}, // RegExp matching, case insensitive
        "author.name" : {$regex : params.author, $options : "$i"},
        "location" : {$regex : params.location.replace(/\s/g, "|"), $options : "$i"},
        "year": {}
    };
    /* Filter by privilege */
    if (req.user) {
        query.$or = [{option: '1'}, {option: '2'}, {"author.id": req.user._id}];
    } else {
        query.option = '1';
    }
    /* Filter by a range of date */
    if (params.date_from !== "") {
        query.year.$gte = Number(params.date_from);
    }
    if (params.date_to !== "") {
        query.year.$lte = Number(params.date_to);
    }
    /* Prevent CastError when date is not specified */
    if (Object.keys(query.year).length === 0 && query.year.constructor === Object) {
        delete query.year;
    }
    console.log(query);
    Artifactpost.find(query)
        .sort({year: params.order === "date_asc" ? 1 : -1})
        .skip(perPage * (page - 1))
        .limit(perPage)
        .exec(function (err, results) {
        if (err) {
            console.log(err);
        } else {
            Artifactpost.countDocuments(query, function (err, count) {
                var pages = Math.ceil(count / perPage);
                /*
                results.forEach(function (item) {
                    console.log(item.id + "\t" + item.name)
                });
                 */
                res.render("artifactposts/index", {
                    artipost : results,
                    admin : config.admin,
                    current: page,
                    pages: pages,
                    path: path
                });
            })
        }
    });
});

//SHOW ARTIFACT POST ROUTE
router.get("/artifactposts/:id", function (req, res) {
    Artifactpost.findById(req.params.id).populate("comments").exec(function (err, foundArtipost) {
        if (err || !foundArtipost) {
            req.flash("error", "Sorry, artifact not found.");
            res.redirect("back");
        } else {
            res.render("artifactposts/show", {artipost: foundArtipost});
        }
    });
});

//EDIT ARTIFACT POST ROUTE
router.get("/artifactposts/:id/edit", middleware.checkBlogpostOwnership, function (req, res) {
    Artifactpost.findById(req.params.id, function (err, foundArtipost) {
        if (err) {
            res.flash("error", "Sorry, artifact not found.");
            res.redirect("/artifactposts");
        } else {
            res.render("artifactposts/edit", {artipost: foundArtipost});
        }
    });
});

//UPDATE ARTIFACT POST
router.put("/artifactposts/:id", middleware.checkBlogpostOwnership, upload.array('image', 5), function (req, res) {
    console.log(req.body);
    Artifactpost.findById(req.params.id, async function (err, updatedArtipost) {
        if (err) {
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            if (req.files.length > 0) {
                let {files} = req;
                let {image, imageId} = updatedArtipost;
                let destroyPromises = imageId.map( (value) => cloudinary.v2.uploader.destroy(value));
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
            updatedArtipost.location = req.body.location;
            updatedArtipost.option = req.body.option;
            updatedArtipost.description = req.body.description;
            updatedArtipost.save();

            req.flash('success', "Successfully updated.");
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
        let destroyPromises = imageId.map( (value) => cloudinary.v2.uploader.destroy(value));

        try {

            await Promise.all(destroyPromises);
            post.remove();
            req.flash('success', 'Successfully deleted.');
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