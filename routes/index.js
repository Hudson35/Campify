var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Campground = require("../models/campground");
var async = require("async");
var nodemailer = require("nodemailer");
// crypto comes with nodejs. No package is install, so can just require it
var crypto = require("crypto");


// INDEX.js in the routes directory is for miscallaneous routes / functions

// Making the ROOT ROUTE "/" aka the home page
router.get("/", function(req, res){
	res.render("landing");
});


// =================
// AUTH ROUTES 
// =================

// show register form
router.get("/register", function(req, res) {
	res.render("register", {page: 'register'});
});

// handle register/sign up logic
router.post("/register", function(req, res) {
	var newUser = new User({
			username: req.body.username,
			firstName: req.body.firstName,
			lastName: req.body.lastName,
			email: req.body.email,
			avatar: req.body.avatar	
		});
	//checking to see if user is admin or not admin 
	if(req.body.adminCode === 'Jarvis'){
		newUser.isAdmin = true;
	}	
	
	User.register(newUser, req.body.password, function(err, user){
		if(err) {
			console.log(err)
			// passport will generate the correct error if one exist, like user already taken, password already in use etc. 
			req.flash("error", err.message);
			return res.redirect("/register");
		}
		passport.authenticate("local")(req, res, function(){
			req.flash("success", "Welcome To Campify " + user.username);
			res.redirect("/campgrounds");
		})
	});	
});

// show login form
router.get("/login", function(req, res) {
	res.render("login", {page: 'login'});
})

// handling login logic and using a middleware function that passport provides
router.post("/login", passport.authenticate("local", 
	{
		successRedirect: "/campgrounds", 
		failureRedirect: "/login"
	}), function(req, res){	
});

// logout route
router.get("/logout", function(req, res){
	req.logout();
	req.flash("success", "Logged You Out!");
	res.redirect("/campgrounds");
});

//if doesn't work on heroku, comment out reset password code 

// FORGOT PASSWORD GET ROUTE
router.get('/forgot', function(req, res) {
	res.render('forgot');
});


// FORGOT PASSWORD POST ROUTE 
router.post('/forgot', function(req, res, next) {
	async.waterfall([
		function(done) {
			crypto.randomBytes(20, function(err, buf){
				var token = buf.toString('hex');
				done(err, token);
			});
		},
		function(token, done) {
			User.findOne({ email: req.body.email}, function(err, user) {
				if(!user) {
					req.flash('error', 'No account with that email address exists.');
					return res.redirect('/forgot');
				}
				
				user.resetPasswordToken = token;
				user.resetPasswordExpires = Date.now() + 3600000 // 1 hour
				
				user.save(function(err) {
					done(err, token, user);
				});
			});
		}, function(token, user, done) {
			var smtpTransport = nodemailer.createTransport({
				service: 'Gmail',
				auth: {
					user: 'devhudson35@gmail.com',
					pass: process.env.GMAILPW
				}
			});
			var mailOptions = {
				to: user.email,
				from: 'devhudson35@gmail.com',
				subject: 'Node.js Password Reset',
				text: 'You are receiving this because you (or someone else) have requested a reset of your password for your account. ' +
				'Please click on the following link, or paste this into your browser to complete the process: ' +
				'http://' + req.headers.host + '/reset/' + token + '\n\n' +
				'If you did not request a password reset, please ignore this email and your password will remain unchanged.'
			};
			smtpTransport.sendMail(mailOptions, function(err) {
				console.log('Email sent');
				req.flash('success', 'An email has been sent to ' + user.email + ' with further instructions.');
				done(err, 'done');
			});
		}
	], function(err) {
		if(err) return next(err);
		res.redirect('/forgot');
	});
});


// RESET PASSWORD GET ROUTE
router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});




// RESET PASSWORD POST ROUTE
router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'devhudson35@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'devhudson35@gmail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/campgrounds');
  });
});


	
// USER PROFILE ROUTE
router.get("/users/:id", function(req, res) {
	User.findById(req.params.id, function(err, foundUser) {
		if(err) {
			req.flash("error",  "Something went wrong.");
			res.redirect("/");
		}
		Campground.find().where('author.id').equals(foundUser._id).exec(function(err, campgrounds) {
			if(err) {
				req.flash("error",  "Something went wrong.");
				res.redirect("/");
			}
			res.render("users/showUser", { user: foundUser, campgrounds: campgrounds });
		});
	});
});



// Export router
module.exports = router;