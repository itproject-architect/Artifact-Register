var mongoose = require("mongoose");

//Artifact Post SCHEMA
var artifactSchema = new mongoose.Schema({
   image: Array,
   imageId: Array, //only used for identifying images in cloudinary
   name: String,
   year: Number,
   public: Boolean,
   location: String,
   description: String,
   option: String,
   created: {type: Date, default: Date.now},
   author: {
      id: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User"
      },
      username: String,
      name: String,
      photo: String
   },
   comments:[
      {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Comment"
      }
   ]
});

module.exports = mongoose.model("Artifactpost", artifactSchema);