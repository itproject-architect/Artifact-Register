
var express = require('express');
var app = express();

//declaring port number
const PORT = process.env.PORT || 3000;
//allows access to public folder (CSS,images,JS,etc)
app.use(express.static('public'));




// Database setup
require('./config/db.js');

//Setting up routes to be used
var routes = require('./routes/routes.js');

//Set the view engine
app.set('view engine', 'pug');

app.use('/',routes);




// Starting the server with port # 3000
app.listen(PORT,function(){
    console.log(`Express listening on port ${PORT}`);
});