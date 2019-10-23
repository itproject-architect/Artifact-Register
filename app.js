//----------------REQUIRE PACKAGES--------------------
var express = require("express"),
    app = express(),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
    flash = require("connect-flash"),
    passport = require("passport"),
    LocalStrategy = require("passport-local"),
    methodOverride = require("method-override"),
    Blogpost = require("./models/artifactpost"),
    Comment = require("./models/comment"),
    User = require("./models/user"),
    nodemailer = require("nodemailer"),
    config = require("./config.js");

//----------------REQUIRE ROUTES--------------------

var commentRoutes = require("./routes/comments"),
    blogpostRoutes = require("./routes/artifactposts"),
    indexRoutes = require("./routes/index"),
    timelineRoutes = require("./routes/timeline"),
    landingRoutes = require("./routes/landing");

//----------------DATABASE CONNECTION-------------------

const dbURI =
    "mongodb+srv://suh:suh1077@artifact-registry-bgtyn.mongodb.net/test?retryWrites=true&w=majority";

const options = {
    useNewUrlParser: true,
    dbName: "INFO30022"
};

mongoose.connect(dbURI, options).then(
    () => {
        console.log("Database connection established!");
    },
    err => {
        console.log("Error connecting Database due to: ", err);
    }
);

mongoose.Promise = global.Promise;

//----------------USE PACKAGES--------------------

app.use(bodyParser.urlencoded({ extended: true }));
//Contact page - middleware
app.use(bodyParser.json());
app.set("view engine", "ejs");
//Static link to public directory which contains all images and stylesheets
app.use(express.static(__dirname + "/public"));
//Treats POST requests as PUT
app.use(methodOverride("_method"));
app.use(flash());



//----------------PASSPORT CONFIG--------------------
app.use(
    require("express-session")({
        secret: "THIS IS USED TO ENCODE",
        resave: false,
        saveUninitialized: false
    })
);
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

//----------------USE ROUTES--------------------
app.use(indexRoutes);
app.use(blogpostRoutes);
app.use(commentRoutes);
app.use(timelineRoutes);
app.use(landingRoutes);


//--------------------LISTENER--------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, function() {
    console.log(`Server started at port ${PORT}`);
});
