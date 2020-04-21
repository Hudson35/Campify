var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var middleware = require("../middleware/index");
//Setup Node-Geocoder
var NodeGeocoder = require('node-geocoder');
 
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);

// INDEX ROUTE - this will SHOW all the campgrounds
// Making the campgrounds Route "/campgrounds" page
router.get("/campgrounds", function(req, res){
	// eval(require('locus'));
	//console.log(req.user); // this line demonstrates how we can gather the user info, when logged in 
	var noMatch = null;
	if(req.query.search) {
		// passing a string from req.query.search into function esacpeRegex which will be returned in a new Regular Express with 
		// flags 'gi' global and ignore. 
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		// Search aka find (using the find method) all campgrounds from my DB that match the query string
		Campground.find({ name: regex }, function(err, allCampgrounds){
			if(err){
				console.log("You encountered an error", err);
			} 
			else {
				
				if(allCampgrounds.length < 1) {
					noMatch = "No campgrounds match that query, please try again.";
				}
				// Take the allCampgrounds parameter that just came through from the callback function (and has our data) and send it into the campgrounds key which then gets passed into the index.ejs file. And use campgrounds to reference in the index.ejs file.
				res.render("campgrounds/index", { campgrounds: allCampgrounds, page: 'campgrounds', noMatch: noMatch });
			}
		});
	}
	else {
		// Get aka Read (using the find method) all campgrounds from my DB
		Campground.find({}, function(err, allCampgrounds){
			if(err){
				console.log("You encountered an error", err);
			} else {
				// Take the allCampgrounds parameter that just came through from the callback function (and has our data) and send it into the campgrounds key which then gets passed into the index.ejs file. And use campgrounds to reference in the index.ejs file.
				res.render("campgrounds/index", { campgrounds: allCampgrounds, page: 'campgrounds', noMatch: noMatch });
			}
		});
	}
});


//CREATE - add new campground to DB
router.post("/campgrounds", middleware.isLoggedIn, function(req, res){
  // get data from form and add to campgrounds array
  var name = req.body.name;
  var price = req.body.price;
  var image = req.body.image;
  var desc = req.body.description;
  var author = {
      id: req.user._id,
      username: req.user.username
  }
  geocoder.geocode(req.body.location, function (err, data) {
    if (err || !data.length) {
		console.log(err, "Error occurred.");
      req.flash('error', 'Invalid address ... BATMAN ERROR');
      return res.redirect('back');
    }
    var lat = data[0].latitude;
    var lng = data[0].longitude;
    var location = data[0].formattedAddress;
    var newCampground = {name: name, price: price, image: image, description: desc, author:author, location: location, lat: lat, lng: lng};
    // Create a new campground and save to DB
    Campground.create(newCampground, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            //redirect back to campgrounds page
            console.log(newlyCreated);
            res.redirect("/campgrounds");
        }
    });
  });
});





// Put comments from this section in the above CREATE route. 
// // CREATE ROUTE - add a new campground to the DB
// // Creating the POST routes
// // Making the POST Route and calling it "/campgrounds" but it is different because it is a POST and not a  GET like above. This Post allows you to create a new campground
// router.post("/campgrounds", middleware.isLoggedIn, function(req, res){
// 	/* This line below is for testing POST out in POSTMAN application
// 	res.send("You hit the POST ROUTE!"); */
	
// 	// Need to get data from page that the input form is on "new.ejs" and add to the get /campgrounds.ejs route
// 	var name = req.body.name;
// 	var price = req.body.price;
// 	var image = req.body.image;
// 	var desc = req.body.description;
// 	var author = {
// 		// given a req.user object automatically.
// 		id: req.user._id,
// 		username: req.user.username
// 	}
	
// 	// Creating an object (newCampground) that will then be created/saved in the campgroundSchema on the DB
// 	var newCampground = {name: name, price: price, image: image, description: desc, author: author};
	
// 	//How to do it with DB: Create and save a newCampground and then save it to the DB all at once using the create method 
// 	Campground.create(newCampground, function(err, newlyCreated){
// 		if(err){
// 			console.log(err);
// 		} else {
// 		//redirect back to campgrounds page. Since we have two "/campgrounds" routes (a GET and POST) the question arrises which page will it go to. Well by default a redirect always directs us back using a GET request and not a POST request.
// 		res.redirect("/campgrounds");
// 		}
// 	});
	
// 	//How to do it without DB:Need to push an object newCampground (which has new data) into the campgrounds array
// 	//campgrounds.push(newCampground);
	
// 	//redirect back to campgrounds page. Since we have two "/campgrounds" routes (a GET and POST) the question arrises which page will it go to. Well by default a redirect always directs us back using a GET request and not a POST request.
// 	//res.redirect("/campgrounds");
// });







// NEW - show form to create a new campground
// Making the Route "/campgrounds/new" page which will show the form which will send/submit a POST request with the data to the POST route "/campgrounds" which in turn then redirects us back to "/campgrounds" as a GET which then shows us all the campgrounds including the new one made from the form post 
router.get("/campgrounds/new", middleware.isLoggedIn, function(req, res){
	res.render("campgrounds/new");
});


// SHOW - shows more info about one campground
router.get("/campgrounds/:id", function(req, res){
	//var cleanID = req.params.id;
	//striping any whitespaces
    //cleanID = cleanID.replace(/\s/g,'');
	
	// find the Campground with the provided ID and a new method called .findById to do that
	// Campground.findById(id, callbackFunction);
	Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
		// the foundCampground can be null (aka !foundCampground means no foundCampground which is a null), and this can crash the application, so we need to be able to handle this in error control
		if(err || !foundCampground){
			req.flash("error", "Campground not found");
			res.redirect("back");
		} else {
			// Render the show template with that id's campground. In show.ejs use BATMAN key (it should be called campground, not BATMAN) to access data. I am calling it BATMAN to show that the naming doesn't matter. However, whatever you call the key here is how you reference it in the show.ejs file.  
			res.render("campgrounds/show", { BATMAN: foundCampground });
		}
	});
});


// EDIT CAMPGROUND ROUTE - Show edit form for a campground 
// remember a middleware is called before a route handler
router.get("/campgrounds/:id/edit", middleware.checkCampgroundOwnership, function(req, res) {
	Campground.findById(req.params.id, function(err, foundCampground) {
		res.render("campgrounds/edit", {campground: foundCampground});
	}); 	 
});


// UPDATE CAMPGROUND ROUTE
router.put("/campgrounds/:id", middleware.checkCampgroundOwnership, function(req, res){
  geocoder.geocode(req.body.location, function (err, data) {
    if (err || !data.length) {
      req.flash('error', 'Invalid address ... SUPERMAN.');
      return res.redirect('back');
    }
    req.body.campground.lat = data[0].latitude;
    req.body.campground.lng = data[0].longitude;
    req.body.campground.location = data[0].formattedAddress;

    Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            req.flash("success","Successfully Updated!");
            res.redirect("/campgrounds/" + updatedCampground._id);
        }
    });
  });
});




// UPDATE CAMPGROUND ROUTE - Update particular campground, then redirect somewhere
// router.put("/campgrounds/:id", middleware.checkCampgroundOwnership, function(req, res) {
// 	// find and update the correct campground 
// 	Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground){
// 		if(err) {
// 			res.redirect("/campgrounds");
// 		} 
// 		else {
// 			// redirect somewhere (show page)
// 			res.redirect("/campgrounds/" + req.params.id);
// 		}
// 	});
	
// });


// DESTROY CAMPGROUND ROUTE - Delete a particular campground, then redirect somewhere 
router.delete("/campgrounds/:id", middleware.checkCampgroundOwnership, function(req, res) {
	Campground.findByIdAndRemove(req.params.id, function(err, campgroundRemoved) {
		if(err) {
			res.redirect("/campgrounds");
		}
		Comment.deleteMany( { _id: { $in: campgroundRemoved.comments } }, function(err) {
			if(err) {
				console.log(err);
			}
			res.redirect("/campgrounds")
		});
	});	
});


// for the fuzzy search, regular express function declaration
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};



// Export router
module.exports = router;