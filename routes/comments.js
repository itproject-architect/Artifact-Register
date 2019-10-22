var express = require("express");
var router = express.Router();
var Artifactpost = require("../models/artifactpost");
var Comment = require("../models/comment");
var middleware = require("../middleware");
const asyncHandler = require("express-async-handler");
const uuidGenerate = require("nodejs-simple-uuid");
var ensure = require('connect-ensure-login');

//NEW COMMENT ROUTE (form)
router.get(
    "/artifactposts/:id/comments/new",
    ensure.ensureLoggedIn('/login'),
    asyncHandler(async (req, res, next) => {
        await Artifactpost.findById(req.params.id, function(err, artipost) {
            if (err) {
                console.log(err);
            } else {
                res.render("comments/new", { artipost: artipost });
            }
        });
    })
);

//CREATE COMMENT ROUTE
router.post(
    "/artifactposts/:id/comments",
    asyncHandler(async (req, res, next) => {
        Artifactpost.findById(req.params.id, function(err, artipost) {
            if (err) {
                console.log(err);
                res.redirect("/artifactposts");
            } else {
                Comment.create(req.body.comment, function(err, comment) {
                    if (err) {
                        req.flash("error", "Something went wrong. Please Try Again");
                        console.log(err);
                    } else {
                        console.log();
                        if (req.user) {
                            comment.author.id = req.user._id;
                            comment.author.username = req.user.username;
                            comment.author.name = req.user.name;
                        } else {
                            var guid = uuidGenerate();
                            comment.author.id = guid;
                            comment.author.username = "Guest";
                        }

                        comment.save();
                        artipost.comments.push(comment);
                        artipost.save();
                        res.redirect("/artifactposts/" + artipost._id);
                    }
                });
            }
        });
    })
);

//EDIT COMMENT
router.get(
    "/artifactposts/:id/comments/:comment_id/edit",
    middleware.checkCommentOwnership,
    function(req, res) {
        Artifactpost.findById(req.params.id, function(err, foundpost) {
            if (err || !foundpost) {
                req.flash("error", "No post found.");
                return res.redirect("back");
            }
            Comment.findById(req.params.comment_id, function(err, foundComment) {
                if (err) {
                    res.redirect("back");
                } else {
                    res.render("comments/edit", {
                        artipost_id: req.params.id,
                        comment: foundComment
                    });
                }
            });
        });
    }
);

//UPDATE COMMENT
router.put(
    "/artifactposts/:id/comments/:comment_id",
    middleware.checkCommentOwnership,
    function(req, res) {
        Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(
            err,
            updatedComment
        ) {
            if (err) {
                res.redirect("back");
            } else {
                res.redirect("/artifactposts/" + req.params.id);
            }
        });
    }
);

//DESTROY COMMENT
router.delete(
    "/artifactposts/:id/comments/:comment_id",
    middleware.checkCommentOwnership,
    function(req, res) {
        Comment.findByIdAndRemove(req.params.comment_id, function(err) {
            if (err) {
                res.redirect("back");
            } else {
                req.flash("success", "Comment deleted.");
                res.redirect("/artifactposts/" + req.params.id);
            }
        });
    }
);

module.exports = router;
