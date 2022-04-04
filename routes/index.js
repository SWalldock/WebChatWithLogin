const router = require('express').Router();
const passport = require('passport');
const genPassword = require('../lib/passwordUtils').genPassword;
const connection = require('../config/database');
const User = connection.models.User;
const isAuth = require('./authMiddleware').isAuth
const isAdmin = require('./authMiddleware').isAdmin
const fs = require('fs')

/**
 * -------------- POST ROUTES ----------------
 */

 // TODO
 router.post('/login', passport.authenticate('local', { failureRedirect: '/login-failure', successRedirect: 'login-success' }), (req, res, next) => {});

 // TODO
 router.post('/register', (req, res, next) => {
    console.log(req.body.uname)
    //check if a user already exists
    User.findOne({username:req.body.uname}).exec().then((user)=>{

        console.log(user)

        if(user){

            res.redirect('/register-failure');

        }else{
            const saltHash = genPassword(req.body.pw);
        
            const salt = saltHash.salt;
            const hash = saltHash.hash;



            const newUser = new User({
                username: req.body.uname,
                hash: hash,
                salt: salt,
                admin: true
        });

    newUser.save()
        .then((user) => {
            console.log(user);
        });

    res.redirect('/login');
    }



    });
    
    
 });


 /**
 * -------------- GET ROUTES ----------------
 */

router.get('/', (req, res, next) => {
    res.send('<h1>Home</h1><p>Please <a href="/register">register</a> or <a href="/login">login</a></p>');
});

// When you visit http://localhost:3000/login, you will see "Login Page"
router.get('/login', (req, res, next) => {
   
    const form = '<h1>Login Page</h1><form method="POST" action="/login">\
    Enter Username:<br><input type="text" name="uname">\
    <br>Enter Password:<br><input type="password" name="pw">\
    <br><br><input type="submit" value="Submit"></form>';

    res.send(form);

});

// When you visit http://localhost:3000/register, you will see "Register Page"
router.get('/register', (req, res, next) => {

    const form = '<h1>Register Page</h1><form method="post" action="register">\
                    Enter Username:<br><input type="text" name="uname">\
                    <br>Enter Password:<br><input type="password" name="pw">\
                    <br><br><input type="submit" value="Submit"></form>';

    res.send(form);
    
});

router.get('/register-failure', (req, res, next) => {

    res.send(`<h2>Username in use. Please click link to return to <a href="/register">registeration</a></h2>`)

});

/**
 * Lookup how to authenticate users on routes with Local Strategy
 * Google Search: "How to use Express Passport Local Strategy"
 * 
 * Also, look up what behaviour express session has without a maxage set
 */
router.get('/chat',isAuth, (req, res, next) => {

    fs.readFile('D:/G/Documents/WebChatWithLogin/index.html',(err,data)=>{
        
        var a = data.toString().replace('{user}',"'"+req.user.username+"'")
        res.send(a)
    })


    console.log(req.user)
   //res.sendFile('D:/G/Documents/WebChatWithLogin/index.html');
});

router.get('/admin-route',isAdmin, (req, res, next) => {
    
    res.send('You made it to the route as an admin');
 });

// Visiting this route logs the user out
router.get('/logout', (req, res, next) => {
    req.logout();
    res.redirect('/login');
});

router.get('/login-success', (req, res, next) => {
    res.redirect('/chat')
});

router.get('/login-failure', (req, res, next) => {
    res.send('You entered the wrong password. <a href="/login">Please try again.</a>');
});

module.exports = router;