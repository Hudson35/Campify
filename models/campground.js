var mongoose = require('mongoose');

// SCHEMA SETUP - Defining a pattern of how are data will be stored in the DB
var campgroundSchema = new mongoose.Schema({
	name: String,
	price: String,
	image: String,
	description: String,
	location: String,
	lat: Number,
	lng: Number,
	createdAt: { type: Date, default: Date.now },
	author: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		username: String
	},
	comments: [
		{
			// Not embedding the comments themselves. Embbeding an id or a reference to the comments 
			type: mongoose.Schema.Types.ObjectId,
			ref: "Comment"
		}
	]
});

// Compiling and exporting into a Model so we can use properties and methods on the Campground object 
module.exports = mongoose.model("Campground", campgroundSchema);