var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware");
var NodeGeocoder = require('node-geocoder');
var multer = require("multer")



var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};

var geocoder = NodeGeocoder(options);

var storage = multer.diskStorage({

    destination: function (req, file, cb) {
        cb(null, './public/pictures')
    },
    filename:function(req,file,cb){
        cb(null, Date.now() + file.originalname)
    }
    
})
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

var upload = multer({ storage: storage, fileFilter: imageFilter})
var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'dhzvinfe8', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

//RESTful campgrounds INDEX 
router.get("/", function(req, res){
    
    //Get all campgrounds from DB
    Campground.find({},function(err, campgrounds){
        if(err){
            console.log(err);
        } else{
            res.render("campgrounds/index", {campgrounds: campgrounds});
        }
    });
});

//CREATE
router.post("/", upload.array('campground[image]',9), function(req, res){
    
  // get data from form and add to campgrounds array
      geocoder.geocode(req.body.campground.location, function (err, data) {
        if (err || !data.length) {
          console.log(err);
          req.flash('error', '无法找到该地址');
          return res.redirect('back');
        }
        req.body.campground.lat = data[0].latitude;
        req.body.campground.lng = data[0].longitude;
        req.body.campground.location = data[0].formattedAddress;
        req.body.campground.image=[]
                req.files.forEach(function(img,index,array){
                    req.body.campground.image.push(img.path)
                })
            req.body.campground.author = {
                id: req.user.id,
                username: req.user.username
            }
            
            Campground.create(req.body.campground, function(err, campground){
            req.body.campground.image
                            if (err) {
                              req.flash('error', err.message);
                              return res.redirect('back');
                            }
                            res.redirect('/campgrounds/' + campground.id);
                          })
                   
    })
});


//NEW
router.get("/new",middleware.isLoggedIn, function(req, res){
    res.render("campgrounds/new");
});


//SHOW
router.get("/:id", function(req, res){
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
       if(err){
           console.log(err);
       } else{
           if (!foundCampground) {
                    req.flash("error", "没有您要找的页面");
                    return res.redirect("back");
                }
           res.render("campgrounds/show", {campground: foundCampground});
       }
    });
});

//EDIT
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findById(req.params.id, function(err,foundCampground){
        res.render("campgrounds/edit", {campground: foundCampground});
    });
});
//UPDATE

router.put("/:id", middleware.checkCampgroundOwnership, function(req, res){
  geocoder.geocode(req.body.location, function (err, data) {
    if (err || !data.length) {
        console.log(err, data)
      req.flash('error', '无法找到该地址');
      return res.redirect('back');
    }
    req.body.campground.lat = data[0].latitude;
    req.body.campground.lng = data[0].longitude;
    req.body.campground.location = data[0].formattedAddress;

    Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, campground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            req.flash("success","更新成功");
            res.redirect("/campgrounds/" + campground._id);
        }
    });
  });
});

//Destroy

router.delete("/:id", middleware.checkCampgroundOwnership,function(req, res){
   Campground.findByIdAndDelete(req.params.id,function(err){
       if(err){
           res.redirect("/campgrounds")
       } else {
           res.redirect("/campgrounds")
       }
   })
})

//middleware


module.exports = router;