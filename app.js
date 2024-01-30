require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const session = require("express-session");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require('mongoose-findorcreate');

mongoose.connect("mongodb://localhost:27017/palleteDB");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(session({
    secret: process.env.CLIENT_SECRET,
    resave: false,
    saveUninitialized: true,
}))

app.use(passport.initialize());
app.use(passport.session());

app.set("view engine", "ejs");

const colorsNum = 6;


const itemSchema = new mongoose.Schema({
    color: String,
    locked: Boolean
})

const userSchema = new mongoose.Schema({
    username: String,
    googleId: String,
    password: String,
    colors: [itemSchema]
})

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


itemSchema.path("locked").default(false);


const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/pallete"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id, username: profile.displayName }, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, {
            id: user.id,
            username: user.username,
            picture: user.picture
        });
    });
});

passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, user);
    });
});


app.get("/", function (req, res) {
    res.render("home");
})

app.get("/login", function (req, res) {
    res.render("login");
})

app.get("/register", function (req, res) {
    res.render("register");
})

app.post("/register", function (req, res) {
    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/");
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/pallete");
            })
        }
    })
})

app.post("/login", function (req, res) {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    })

    req.login(user, function (err) {
        if (err) {
            console.log(err);
            res.redirect("/");  
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/pallete");
            })
        }
    })
})

app.get("/pallete", function (req, res) {
    if (req.isAuthenticated()) {
        User.findOne({ username: req.user.username }).then((user) => {
            if (user.colors.length > 0) {
                user.colors.forEach(color => {
                    if (!color.locked) {
                        color.color = randomColor();
                    }
                })
                user.save();
                res.render("pallete", { colors: user.colors, name: req.user.username });
            } else {
                for (let i = 0; i < colorsNum; i++) {
                    user.colors.push({ color: randomColor(), locked: false });
                }
                user.save();
                res.render("pallete", { colors: user.colors, name: req.user.username })
            }
        })
    } else {
        res.redirect("/login");
    }
})

app.get("/logout", function(req, res) {
    req.logout(function(err) {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/");
        }
    });
})

app.get("/pallete/:color", function (req, res) {
    const colorParam = req.params.color;
    const isFaviconRequest = req.url.includes('favicon.ico');

    if (colorParam && !isFaviconRequest) {
        if (req.user) {
            User.findOne({ username: req.user.username }).then(user => {
                let foundColor = user.colors.filter(color => { return color.color == "#" + req.params.color });
                foundColor[0].locked = !foundColor[0].locked;
                user.save().then(() => { res.redirect("/pallete") });
            })
        }
    }
})

app.get("/auth/google", passport.authenticate("google", { scope: ["profile"] }))

app.get("/auth/google/pallete",
    passport.authenticate("google", { failureRedirect: "/login" }),
    function (req, res) {
        res.redirect("/pallete");
    });

function randomColor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);

    return rgbToHex(r, g, b);
}

function componentToHex(c) {
    const hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}


app.listen(3000, function (req, res) {
    console.log("Server is up 3000");
})