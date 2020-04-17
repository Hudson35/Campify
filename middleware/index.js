// ALL THE MIDDLEWARE FUNCTIONS GO HERE
var Campground = require("../models/campground");
var Comment = require("../models/comment");


// Declaring middlewareObject
var middlewareObject = {};

// ADDING FUNCTIONS ONTO THE middlewareObject declared above

// Middleware function called checkCampgroundOwnership
middlewareObject.checkCampgroundOwnership = function(req, res, next) {
	// check to see if user is logged in at all 
	if(req.isAuthenticated()) {
		// if they are, does the user own the campground, checking below 
		Campground.findById(req.params.id, function(err, foundCampground){
			// the foundCampground can be null (aka !foundCampground means no foundCampground which is a null), and this can crash the application, so we need to be able to handle this in error control
			if(err || !foundCampground){
				req.flash("error", "Campground not found.");
				res.redirect("back");
			}
			else {
				// does user own the campground, we compare the authors id with the currently logged in user's id. 
				if(foundCampground.author.id.equals(req.user._id) || req.user.isAdmin ){
					next();
				}
				else {
					req.flash("error", "You don't have permission to do that.");
					// takes the user back to the previous page they came from
					res.redirect("back");
				}
			}
		});
	} 
	else {
		req.flash("error", "You need to be logged in to do that!");
		// otherwise, redirect back
		res.redirect("back");
	}
}


// Middleware function called checkCommentOwnership
middlewareObject.checkCommentOwnership = function(req, res, next) {
	// check to see if user is logged in at all 
	if(req.isAuthenticated()) {
		// if they are, does the user own the comment, checking below 
		Comment.findById(req.params.comment_id, function(err, foundComment){
			if(err || !foundComment){
				req.flash("error", "Comment not found");
				res.redirect("back");
			}
			else {
				// does user own the comment, we compare the authors id with the currently logged in user's id. 
				if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin ){
					next();
				}
				else {
					req.flash("error", "You don't have permission to do that!");
					// takes the user back to the previous page they came from
					res.redirect("back");
				}
			}
		});
	} 
	else {
		req.flash("error", "You need to be logged in to do that!");
		// otherwise, redirect back
		res.redirect("back");
	}
}


// Remember middleware functions are called before a route handler
// Middleware function called isLoggedIn
middlewareObject.isLoggedIn = function(req, res, next) {
	if(req.isAuthenticated()){
		return next();
	}
	// using flash and passing in a key and a value
	req.flash("error", "You need to be logged in to do that!");
	res.redirect("/login");
}


module.exports = middlewareObject;