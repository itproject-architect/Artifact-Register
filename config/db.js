const mongoose = require("mongoose");


const dbURI =

    "mongodb+srv://suh:suh1077@artifact-registry-bgtyn.mongodb.net/test";


const options = {
    useNewUrlParser: true,
    dbName: "INFO30022"
};

mongoose.connect(dbURI, options).then(
    () => {
        console.log("Database connection established!");
    },
    err => {
        console.log("Error connecting Database instance due to: ", err);
    }
);



