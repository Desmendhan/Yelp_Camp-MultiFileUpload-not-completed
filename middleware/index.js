var Campground = require("../models/campground");
var Comment = require("../models/comment");
//all the middlewares

var middlewareObj = {};

middlewareObj.checkCampgroundOwnership = function(req, res, next){
        //loggin ot not
      if(req.isAuthenticated()){
       
        Campground.findById(req.params.id, function(err,foundCampground){
        if(err){
            req.flash("error","系统错误，请联系管理员")
            res.redirect("back")
        } else{
            
            //check if campground is in database
             if (!foundCampground){
                    req.flash("error", "没有您要找的页面");
                    return res.redirect("back");
                }
            //owned or not
            if(foundCampground.author.id.equals(req.user._id)){
              next();
            }
             else{
            req.flash("error","您没有权限")
            res.redirect("back")
             }
        }
    })
     } else {
         res.redirect("back")
     }
}

middlewareObj.checkCommentOwnership = function(req, res, next){
        //loggin ot not
      if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id, function(err,foundComment){
        if(err){
            req.flash("error","Campground not fouund");
            res.redirect("back")
        } else{
            //check if comment is in database
             if (!foundComment) {
                    req.flash("error", "没有您要找的页面");
                    return res.redirect("back");
                }
            //owned or not
            if(foundComment.author.id.equals(req.user._id)){
              next();
            }
             else{
            req.flash("error","您没有权限")
            res.redirect("back")
             }
        }
    })
     } else {
         res.redirect("back")
     }
}

middlewareObj.isLoggedIn = function(req, res, next){
    if(req.isAuthenticated()){
        return next();
        };
        req.flash("error","亲，请登录");
        req.session.redirectTo = req.originalUrl;
        res.redirect("/login") ;
    }


middlewareObj.checkUserCampground = function(req, res, next){
    Campground.findById(req.params.id, function(err, foundCampground){
      if(err || !foundCampground){
          console.log(err);
          req.flash('error', '您要找的页面不存在!');
          res.redirect('/campgrounds');
      } else if(foundCampground.author.id.equals(req.user._id) || req.user.isAdmin){
          req.campground = foundCampground;
          next();
      } else {
          req.flash('error', '您没有权限');
          res.redirect('/campgrounds/' + req.params.id);
      }
    });
  },

module.exports = middlewareObj;