// Dotenv is a zero-dependency module that loads environment variables from a .env file into process.env. Storing configuration in the environment separate from code is based on The Twelve-Factor App methodology
require('dotenv').config();

// Import/install express with require and store it in express variable
var express = require("express");

// Create an app variable where we execute Express 
var app = express();

var passport = require("passport");

var LocalStrategy = require("passport-local");

var methodOverride = require("method-override");

// Import/install body-parser with require
var bodyParser = require("body-parser");

// Import/install mongoose with require
var mongoose = require("mongoose");

// Import/installing connect-flash package with require
var flash = require('connect-flash');

var session = require('express-session');

// Requiring the campgound.js file and using the Campground Object we get back with it.
var Campground = require("./models/campground");

// Requiring the comments.js file 
var Comment = require("./models/comment");

// Requiring the User model
var User = require("./models/user");

// Requiring the seeds.js file
var seedDB = require("./seeds");

// Requiring in the different Route files  
var commentRoutes    = require("./routes/comments"),
    campgroundRoutes = require("./routes/campgrounds"),
    indexRoutes      = require("./routes/index");


// DATABASE MONGODB ATLAS SETUP START
//Connecting to mongodb atlas database and or creating a database if one is not set up yet
// mongoose.connect("mongodb+srv://devhudson:devhudsonpassword@cluster0-campify-qkat4.mongodb.net/campifyProduction?retryWrites=true&w=majority", { 
// 	useNewUrlParser: true,
// 	useCreateIndex: true
// }).then(() => {
// 	console.log('Connected to Campify MongoDB Atlas!');
// }).catch(err => {
// 	console.log('ERROR:', err.message);
// });
// DATABASE MONGODB ATLAS SETUP END 


console.log(process.env.DATABASEURL);
//Creating a environment variable to help with deployed version of DB and testing version of DB for our application. 
//url will equal the enviroment variable if it exist, if it doesn't exist it will be local 
var url = process.env.DATABASEURL || "mongodb://localhost:27017/campifyDevelopment";
mongoose.connect(url, { useNewUrlParser: true });



// DATABASE LOCAL SETUP //

// Use this when Connecting to a database locally and or creating a database if one is not set up yet
// Connecting to a database and or creating a database if one is not set up yet
// mongoose.connect('mongodb://localhost:27017/yelp_camp_v2', { useNewUrlParser: true });

// console.log(process.env.DATABASEURL);
//mongoose.connect('mongodb://localhost:27017/campifyDevelopment', { useNewUrlParser: true });

// END OF LOCAL DATABASE SETUP //




// This line tells Express to use the package body parser just copy and paste this line don't worry about not knowing exactly what it does
app.use(bodyParser.urlencoded({extended: true}));

// For leaving off the results.ejs, posts.ejs, on the res.render("results.ejs") we can tell Express to know that it's an .ejs file and therefore this allows us to leave off the extension
app.set("view engine", "ejs");

// linking my custom css file
app.use(express.static(__dirname + "/public"));

// telling methodOverride what to look for when using it 
app.use(methodOverride("_method"));

// Executing flash. Telling the app to use it
app.use(flash());

// Executing seedDB 
// seedDB();


// Requiring Moment.js package to use for "Time Since Created" functionality.
// Now moment is available for use in all my view files via the variable named moment
app.locals.moment = require('moment');


// PASSPORT CONFIGURATION

// Setting up Express-Session
app.use(session({
	// This secret line will be use to encode or decode the session. The data in the session won't be in human language, we
	// use this secret to decode it.
	secret: "Build amazing things using JavaScript",
	resave: false,
	saveUninitialized: false
}));

// Setting passport up in this application. Need these two lines anytime I use passport.
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));

// These two methods, serialize and deserialize are extremely important. They are responsible for reading the session
// taking the data from the session that's encoded, and un-encoding it aka decoding it.
// serialize == encoding it
// deserialize == decoding it
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Making my own middleware function, currentUser, which will be added to or available for every route template. 
app.use(function(req, res, next) {
	res.locals.currentUser = req.user;
	res.locals.error = req.flash('error');
	res.locals.success = req.flash('success');
	next();
});

// Tell app to use these 3 route files we required from up top
app.use(indexRoutes);
app.use(campgroundRoutes);
app.use(commentRoutes);



// This is where the server will start and listen for the specified port number on whatever environment
// the code is running on for PORT and IP address. e.g. a heroku or goorm ide environment or a local one, hence the 3000.
app.listen(process.env.PORT || 3000, process.env.IP, function(){
	console.log("The Campify Server Has Started!");
});