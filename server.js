const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const helmet = require('helmet');
const yes = require('yes-https');
const passport = require('./config/passport');
const session = require('express-session');
const morgan = require('morgan');
const cors = require('cors');
var flash = require('connect-flash');
require('dotenv').config();


//Initialize app
const app = express();

//Connect to DB
const connect = require('./config/db');
connect();

//Configure middleware
app.use( session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 43200000 }
}));
app.use( bodyParser.urlencoded({ extended: true }) );
app.use( bodyParser.json() );
app.use( morgan('combined', {
  skip: function (req, res) { return res.statusCode < 400 }
}));
app.use( cors({ credentials: true }) );
app.use( flash() );

// Passport Config
app.use( passport.initialize() );
app.use( passport.session() );

//Define routes
app.use( '/api/user', require('./routes/api/user') );
app.use( '/api/teacher', require('./routes/api/teacher') );
app.use( '/api/auth', require('./routes/api/auth') );

app.use( '/robots.txt', function (req, res, next) {
  res.type('text/plain')
  res.sendFile(path.resolve(__dirname, 'client', 'robots.txt'));
});

//Set up end points
if ( process.env.NODE_ENV === "development" ) {
  app.get ("/", (req, res) => res.send('api running') )
} else {
  app.use( helmet() );
  app.use( yes() );
  
  app.use( express.static(__dirname + '/client') );

  app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'client', 'index.html'));
  });
}

//Set up Listening PORT
const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server running on PORT ${PORT}`);
});
