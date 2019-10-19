var express = require("express");
var router = express.Router();
var passport = require("passport");
var Artifactpost = require("../models/artifactpost");
var User = require("../models/user");
var UserInvite = require("../models/userinvite");
const uuidGenerate = require("nodejs-simple-uuid");
var middleware = require("../middleware");
var multer = require('multer');

//Contact form
var nodemailer = require("nodemailer");
//API key storage
var config = require("../config.js");

var serverdomain = "https://it-project.herokuapp.com";


//--------------------CONFIGURING MULTER and CLOUDINARY FOR IMAGE UPLOAD
// adapted from https://github.com/nax3t/image_upload_example/tree/edit-delete --------------------

var storage = multer.diskStorage({
  filename: function (req, file, callback) {
    callback(null, Date.now() + '_' + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
  // accept image files only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|tif)$/i)) {
    return cb(new Error('Only image files are supported'), false);
  }
  cb(null, true);
};
var upload = multer({storage: storage, fileFilter: imageFilter});

var cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: 'dvwezxakw',
  api_key: '862182883151951',
  api_secret: '75kzWvbY-siNUFuUWHLVpzmAcDU'
});


//".router" is used instead of "app." as our routes are now in a separate file that links back to the "app.js" file

//ROOT ROUTE
router.get("/", function(req, res) {
  res.render("landing");
});


//invite family member ROUTE
router.get("/invitefamily", middleware.isLoggedIn, function(req, res) {
  res.render("invitefamily");
  /* res.redirect('back'); */
});

// user profile page
router.get("/profile", middleware.isLoggedIn, function(req, res) {
  Artifactpost.find({"author.username" : req.user.username}, function (err, results) {
    if (err) {
      console.log(err);
    } else {
      res.render("profile", {
        user: req.user,
        artifacts: results.reverse().slice(0, 9)  // show the latest uploaded 9 artifacts (3*3)
      });
    }
  });
});

// edit profile
router.get("/profile/edit", middleware.isLoggedIn, function(req, res) {
  res.render("editprofile", {user: req.user});
});

// manage artifacts
router.get("/profile/manage", middleware.isLoggedIn, function(req, res) {
  Artifactpost.find({"author.username" : req.user.username}, function (err, results) {
    if (err) {
      console.log(err);
    } else {
      res.render("manageart", {user: req.user, artifacts: results});
    }
  });
});

// upload photo
router.post("/profile/edit/photo", middleware.isLoggedIn, upload.single("photo"), function (req, res) {
  cloudinary.uploader.upload(req.file.path, function (err, result) {
    if (err) {
      console.log(err);
    } else {
      User.updateOne({username : req.user.username}, {photo : result.secure_url}, function (err, raw) {
        if (err) {
          console.log(err);
          req.flash("error", "Sorry, an error has occurred.");
          res.redirect("back");
        } else {
          req.flash("success", "Success! Your photo has been updated.");
          res.redirect("back");
        }
      });
    }
  });
});

// change name
router.post("/profile/edit/name", middleware.isLoggedIn, function(req, res) {
  User.updateOne({username : req.user.username}, {name : req.body.name}, function (err, raw) {
    if (err) {
      console.log(err);
      req.flash("error", "Sorry, an error has occurred.");
      res.redirect("back");
    } else {
      req.flash("success", "Success! Your new name is " + req.body.name + ".");
      res.redirect("back");
    }
  });
});

// change password
router.post("/profile/edit/password", middleware.isLoggedIn, function(req, res) {
  req.user.changePassword(req.body.old_pwd, req.body.new_pwd, function (err, result) {
    if (err) {
      console.log(err);
      req.flash("error", `Error: ${err.message}.`);
      res.redirect("back");
    } else {
      req.flash("success", "Success! Your password has be changed.");
      res.redirect("back");
    }
  })
});

//--------------------REGISTER----------------------------------------
//REGISTER ROUTE (form)
router.get("/register", function(req, res) {
  res.render("register");
});
router.get("/invite/:id", function(req, res) {
  console.log("Invite registration", req.params.id);
  UserInvite.findOne({ guid: req.params.id }, function(err, foundInvite) {
    if (err) {
      req.flash("error", "Invalid Invitation with URL");
      console.log("Not Found invite ", foundInvite);

      res.render("invalidinvite");
    } else {
      console.log("Found invite ", foundInvite);
      if (foundInvite) {
        res.render("invitereg", { userinvite: foundInvite });
      } else {
        req.flash("error", "Wrong code invitation");
        console.log("Not Found invite ", foundInvite);
        res.render("invalidinvite");
      }
    }
  });
});

//REGISTER ROUTE (logic)
router.post("/register", function(req, res) {
  console.log("register ", req.body);
  var newUser = new User({ username: req.body.username, name: req.body.name });
  User.register(newUser, req.body.password, function(err, user) {
    if (err) {
      req.flash("error", err.message);
      return res.redirect("register");
    }
    passport.authenticate("local")(req, res, function() {
      req.flash("success", "Welcome, " + user.username + ".");
      res.redirect("/artifactposts/p/1");
    });
  });
});
//UPDATE artifactposts
router.put("/inviteregister", function(req, res) {
  console.log("register ", req.body);
  var newUser = new User({ username: req.body.username, name: req.body.name });
  User.register(newUser, req.body.password, function(err, user) {
    if (err) {
      req.flash("error", err.message);
      return res.redirect("register");
    }
    passport.authenticate("local")(req, res, function() {
      req.flash("success", "Welcome, " + user.username + ".");
      res.redirect("/artifactposts/p/1");
    });
  });
});
router.post("/inviteregister", function(req, res) {
  var newUser = new User({ username: req.body.username });
  User.register(newUser, req.body.password, function(err, user) {
    if (err) {
      req.flash("error", err.message);
      return res.redirect("register");
    }
    passport.authenticate("local")(req, res, function() {
      req.flash("success", "Welcome, " + user.username + ".");
      res.redirect("/artifactposts/p/1");
    });
  });
});
//--------------------LOGIN----------------------------------------
//LOGIN ROUTE (form)
router.get("/login", function(req, res) {
  res.render("login");
});

//LOGIN ROUTE (form)
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/artifactposts/p/1",
    successFlash: "Welcome, you have successfully logged in.",
    failureRedirect: "/login",
    failureFlash: "Invalid username or password."
  }),
  function(req, res) {
    //No action required for callback
  }
);

//LOGOUT ROUTE
router.get("/logout", function(req, res) {
  req.logout();
  req.flash("success", "Logout successful.");
  res.redirect("/");
});


router.post("/send", function(req, res) {
  console.log("request body", req.body);
  /* req.flash("success", "Invitation Email is sent.");
  res.redirect("contact"); */
  var contactname = req.body.name,
    email = req.body.username,
    company = "Company",
    title = "Subject",
    message = "Hi";
  var guid = uuidGenerate();

  // Content that is delivered to my email
  var output = `
            <p> -------------------- Please don't reply to this mail -------------------- </p>
            <p>${message} ${contactname},</p>
            <p>Here's an e-mail invitation for Family Artifact Registry App signup.</p>
            <p><b>Please click the link below to sign up for a new account: </b></p>
            <p><b><a href="${serverdomain}/invite/${guid}">Signup</a></b></p>
            <p>Regards,</p>
            <p>Team Internet Architects</p>
        `;

  let account = nodemailer.createTestAccount();

  // Account connection and authorization
  let transporter = nodemailer.createTransport({
    service: "gmail", 
    auth: {
      user: "artifactinvite@gmail.com", 
      pass: "ITProj123"
    }
  });

  // Listens for new access tokens, if an access token expires it uses refreshToken to generate a new access token
  transporter.on("token", token => {
    console.log("A new access token was generated");
    console.log("User: %s", token.user);
    console.log("Access Token: %s", token.accessToken);
    console.log("Expires: %s", new Date(token.expires));
  });

  // Sending information
  let mailOptions = {
    from: `<artifactinvite@gmail.com>`, // sender address
    to: `${email}`, // list of receivers
    subject: "Invitation Email", // subject
    text: "No message entered.", // text if nothing is filled out
    html: output // html body
  };

  console.log("request body: \n", mailOptions);

  // Send mail
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      req.flash("error", "Message failed to send.");
      res.redirect("/invitefamily");
    } else {
      console.log("Message sent: %s", info.messageId);
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
      var newUserInvite = {
        name: contactname,
        username: email,
        guid: guid
      };
      UserInvite.create(newUserInvite, function(err, newlyCreated) {
        if (err) {
          console.log(err);
        } else {
          console.log("user invitation inserted successfully", newlyCreated);
        }
      });
      req.flash("success", "Invitation Email sent successfully!");
      res.redirect("invitefamily");
    }
  });
});

// debug
router.get("/debug", function (req, res) {
  User.updateOne({username : 'xlin5'},
      {photo : 'https://res.cloudinary.com/dvwezxakw/image/upload/v1570892444/soxtjio53gigscyggtmh.jpg'},
      function (err, raw) {
    if (err) {
      console.log(err);
    } else {
      console.log(raw);
    }
  });

});

//--------------------EXPORT----------------------------------------
module.exports = router;
