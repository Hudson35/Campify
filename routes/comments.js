var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var middleware = require("../middleware/index");


// ============================================
// COMMENTS ROUTES
// ============================================

// NEW Comments Route, GET Request
router.get("/campgrounds/:id/comments/new", middleware.isLoggedIn, function(req, res) {
	// find campground by id
	// var cleanID = req.params.id;
	// cleanID = cleanID.replace(/\s/g,'');
	Campground.findById(req.params.id, function(err, campground){
		if(err || !campground){
			req.flash("error", "Campground not found");
			res.redirect("back");
		}
		else {
			res.render("comments/new", {campground: campground});
		}
	})
});


// CREATE Comments Route, POST Request
router.post("/campgrounds/:id/comments", middleware.isLoggedIn, function(req, res) {
	// lookup campground using ID
	// var cleanID = req.params.id;
	// cleanID = cleanID.replace(/\s/g,'');
	Campground.findById(req.params.id, function(err, campground){
		if(err) {
			console.log(err);
			res.redirect('/campgrounds');
		}
		else {
			// create new comments
			Comment.create(req.body.comment, function(err, comment) {
				if(err) {
					req.flash("error", "We're Sorry, Something Went Wrong.");
					console.log(err);
				}
				else {
					//add username and id to comment 
					comment.author.id = req.user._id;
					comment.author.username = req.user.username;
					//save comment
					comment.save();
					// this campground is the one up above in the first callback function
					campground.comments.push(comment);
					campground.save();
					req.flash("success", "Successfully Posted A Comment!");
					res.redirect('/campgrounds/' + campground._id);
				}
			});
		}
	});
	
});


// COMMENT EDIT ROUTE - Show edit form for one dog
router.get("/campgrounds/:id/comments/:comment_id/edit", middleware.checkCommentOwnership, function (req, res) {
	Campground.findById(req.params.id, function(err, foundCampground) {
		if(err || !foundCampground) {
			req.flash("error", "No campground found");
			return res.redirect("back");
		}
		Comment.findById(req.params.comment_id, function(err, foundComment){
			if(err){
				res.redirect("back");
			}
			else {
				res.render("comments/edit", {campground_id: req.params.id, comment: foundComment});
			}
		});
	});
});

// COMMENT UPDATE ROUTE - Update particular comment, then redirect somewhere 
router.put("/campgrounds/:id/comments/:comment_id", middleware.checkCommentOwnership, function(req, res) {
	Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
		if(err) {
			res.redirect("back");
		}
		else {
			res.redirect("/campgrounds/" + req.params.id);
		}
	});

})


// COMMENT DESTORY ROUTE - Delete a particular comment, then redirect somewhere 
router.delete("/campgrounds/:id/comments/:comment_id", middleware.checkCommentOwnership, function(req, res) {
	// findByIdAndRemove
	Comment.findByIdAndRemove(req.params.comment_id, function(err){
		if(err) {
			res.redirect("back");
		}
		else {
			req.flash("success", "Comment Deleted!");
			res.redirect("/campgrounds/" + req.params.id);
		}
	});
});



// Export router
module.exports = router;