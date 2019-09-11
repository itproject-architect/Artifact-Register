var mongoose = require("mongoose");

//Artifact Post SCHEMA
var artifactSchema = new mongoose.Schema({
   name: String,
   year: Number,
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