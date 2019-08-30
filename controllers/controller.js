const homePage = function (req, res, next) {
    res.render('home', {
        title: 'Home Page'
    })
};


module.exports.homePage = homePage;