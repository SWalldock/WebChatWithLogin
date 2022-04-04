const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
var passport = require('passport');
var crypto = require('crypto');
var routes = require('./routes');
const connection = require('./config/database');



// Package documentation - https://www.npmjs.com/package/connect-mongo
const MongoStore = require('connect-mongo')(session);

// Need to require the entire Passport config module so app.js knows about it


/**
 * -------------- GENERAL SETUP ----------------
 */

// Gives us access to variables set in the .env file via `process.env.VARIABLE_NAME` syntax
require('dotenv').config();

// Create the Express application
var app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));

var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('./public'))

/**
 * -------------- SESSION SETUP ----------------
 */

const sessionStore = new MongoStore({mongooseConnection:connection, collection:'sessions'})

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    store: sessionStore,
    cookie:{
        maxAge: 1000*60*60*24
    }
}));
/**
 * -------------- PASSPORT AUTHENTICATION ----------------
 */
require('./config/passport');

app.use(passport.initialize());
app.use(passport.session());

app.use((req,res,next)=>{
    console.log(req.session);
    console.log(req.user);
    next()
})


/**
 * -------------- ROUTES ----------------
 */

// Imports all of the routes from ./routes/index.js
app.use(routes);


/**
 * -------------- SERVER ----------------
 */

// Server listens on http://localhost:3000

const messages={}
io.on('connection', function(socket){
   var room = 'DefaultRoom'

   socket.join(room)
   //console.log(socket.id)
   
   io.to(socket.id).emit('newUser', messages[room]);
   //console.log(messages[room])


   socket.on('roomChange', (data)=>{
      console.log(data)
      //data passed currently is a json object with the new room and the old room
      //need to join the new room. Socket handles room not yet existing
      //https://socket.io/docs/v4/rooms/
      socket.join(data.newRoom);
      //need to leave the old room
      socket.leave(data.oldRoom);
      //Need to set the current room to the new room
      room = data.newRoom
      io.to(socket.id).emit('newUser', messages[room]);
      console.log(socket.rooms)
   });
   socket.on('copyEvent', (data)=>{
      //check if there is message in the room the user is in if there is add to it otherwise create a new array and add to the messages object
      if(messages[room]){
         messages[room].push(data)
         console.log('Adding')
      }else{
         messages[room] = new Array
         messages[room].push(data)
         console.log('New')
      }
      console.log(messages[room])
      //Socket broacasts to other members of the same room
      socket.to(room).emit('copyEvent', data)
 })
})



http.listen(3000);