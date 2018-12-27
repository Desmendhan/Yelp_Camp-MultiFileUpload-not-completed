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
    filename:function(req,file,cb){
        cb(null,file.fieldname+"-"+Date.now())
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
    //res.render("campgrounds", {campgrounds:campgrounds})
});

//CREATE
router.post("/", upload.array('image',[,9]), function(req, res){
    
  // get data from form and add to campgrounds array
  var name = req.body.name;
  var video = req.body.video;
  var desc = req.body.description;
  var price = req.body.price
  var author = {
      id: req.user._id,
      username: req.user.username
  };
 

      geocoder.geocode(req.body.location, function (err, data) {
        if (err || !data.length) {
          console.log(err);
          req.flash('error', '无法找到该地址');
          return res.redirect('back');
        }
        var lat = data[0].latitude;
        var lng = data[0].longitude;
        var location = data[0].formattedAddress;
        var image = []
        async function init(){
             await req.files.forEach(function(img,index,array){
 
                cloudinary.uploader.upload(img.path, function(result) {
                    
                   image.push(result.secure_url)
                    // add cloudinary url for the image to the campground object under image property
                     if(!result.secure_url || !result.secure_url.length){
                        console.log(result.secure_url)
                        req.flash("error","图片上传失败")
                        res.redirect("back")
                        }
                    console.log(req.body.campground.image) 
                    })
                })
            console.log(image)
            var newCampground = {name: name, image:image, video:video, description: desc,price:price, author:author, location: location, lat: lat, lng: lng}
            Campground.create(req.body.campground, function(err, campground){
                            if (err) {
                              req.flash('error', err.message);
                              return res.redirect('back');
                            }
                            res.redirect('/campgrounds/' + campground.id);
                          })
        }
        init();

                       
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