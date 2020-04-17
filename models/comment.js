var mongoose = require("mongoose");

// SCHEMA SETUP - Defining a pattern of how are data will be stored in the DB
var commentSchema = mongoose.Schema({
	text: String,
	createdAt: {type: Date, default: Date.now },
	author: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		username: String
	}
});

// Can use Comment in other files to reference this model
module.exports = mongoose.model('Comment', commentSchema);