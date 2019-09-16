var mongoose = require("mongoose");

//Artifact Post SCHEMA
var artifactSchema = new mongoose.Schema({
   imageId: String, //only used for identifying images in cloudinary
   name: String,
   year: Number,
   public: Boolean,
   image: String,
   description: String,
   created: {type: Date, default: Date.now},
   author: {
      id: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User"
      },
      username: String
   },
   comments:[
      {
         type:mongoose.Schema.Types.ObjectId,
         ref:"Comment"
      }
   ]
});

module.exports = mongoose.model("Artifactpost", artifactSchema);