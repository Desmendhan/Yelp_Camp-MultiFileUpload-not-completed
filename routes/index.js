var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user")
// var Campground = require("../models/campgrounds")
// var Comment = require("../models/comment")

//root route

router.get("/", function(req, res){
    res.render("home");
});

//register form
router.get("/register", function(req, res){
    res.render("register")
})
//register logic
router.post("/register", function(req, res){
    var newUser = User({username: req.body.username});
    User.register(newUser, req.body.password,function(err, user){
        if(err){
            req.flash("error",err.message)
            return res.render("register")
        }
        passport.authenticate("local")(req, res, function(){
            req.flash("success","欢迎来到YelpCamp，" + user.username);
            res.redirect("/campgrounds")
        })
    })
})
//login form
router.get("/login",function(req, res){
    res.render("login")
})
//login logic
router.post("/login",passport.authenticate("local", {
}), function(req, res){
    req.flash("success","欢迎回来，" + req.body.username);
    res.redirect(req.session.redirectTo || "/campgrounds");
    delete req.session.returnTo;
});
//logout
router.get("/logout", function(req, res){
    req.logout();
    req.flash("success", "您已登出")
    res.redirect("/campgrounds")
})

   
module.exports = router;