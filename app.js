const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const session = require("express-session");

mongoose.connect("mongodb://localhost:27017/palleteDB");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(session({
    secret: "good secret anyway",
    resave: false,
    saveUninitialized: true,
}))

app.use(passport.initialize());
app.use(passport.session());

app.set("view engine", "ejs");

const lockedSrc = "img/secured-lock.png";
const unlockedSrc = "img/padlock-unlock.png";
const colorsNum = 6;
const saltRounds = 10;
let currentUser = "";


const itemSchema = new mongoose.Schema({
    color: String,
    locked: Boolean
})

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    colors: [itemSchema]
})

userSchema.plugin(passportLocalMongoose);

itemSchema.path("locked").default(false);

const Item = mongoose.model("Item", itemSchema);
const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

// passport.serializeUser(function (user, cb) {
//     process.nextTick(function () {
//         return cb(null, {
//             id: user.id,
//             username: user.username,
//             picture: user.picture
//         });
//     });
// });

// passport.deserializeUser(function (user, cb) {
//     process.nextTick(function () {
//         return cb(null, user);
//     });
// });

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

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
    console.log(req.user);
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
                res.render("pallete", { colors: user.colors, isLogged: req.user, name: req.user.username })
            }
        })
    } else {
        res.redirect("/login");
    }
})

// app.get("pallete/:color", function (req, res) {
//     const colorParam = req.params.color;
//     const isFaviconRequest = req.url.includes('favicon.ico');

//     if (colorParam && !isFaviconRequest) {
//         if (req.user) {
//             User.findOne({ username: req.user.username }).then(user => {
//                 let foundColor = user.colors.filter(color => { return color.color == "#" + req.params.color });
//                 foundColor[0].locked = true;
//                 user.save().then(() => { res.redirect("/") });
//             })
//         }
//     }
// })

// app.get("/", function (req, res) {
//     console.log(req.user);
//     if (req.user) {
//         User.findOne({ username: req.user.username }).then(user => {
//             if (user.colors.length > 0) {
//                 user.colors.forEach(color => {
//                     if (!color.locked) {
//                         color.color = randomColor();
//                     }
//                 })
//                 user.save();
//                 res.render("index", { colors: user.colors, isLogged: req.user, name: req.user.username })
//             } else {
//                 for (let i = 0; i < colorsNum; i++) {
//                     user.colors.push({ color: randomColor(), locked: false });
//                 }
//                 user.save();
//                 res.render("index", { colors: user.colors, isLogged: req.user, name: req.user.username })
//             }
//         })
//     } else {
//         Item.find({}).then((items) => {
//             items.forEach(item => {
//                 if (!item.locked) {
//                     item.color = randomColor();
//                     item.save();
//                 }
//             })
//             res.render("index", { colors: items, isLogged: req.user, name: "" });
//         })
//     }

// })



// app.post("/register", function (req, res) {
//     User.register({ username: req.body.name }, req.body.password, function (err, user) {
//         if (err) {
//             console.log(err);
//             res.redirect("/");
//         } else {
//             passport.authenticate("local")(req, res, function () {
//                 //currentUser = req.body.name
//                 res.redirect("/");
//             })
//         }
//     })

// })

// app.post("/login", passport.authenticate("local", {
//     successRedirect: "/",
//     failureRedirect: "/failure",
// })
// User.findOne({ username: req.body.name }).then((user) => {
//     bcrypt.compare(req.body.password, user.password, function (err, result) {
//         if (result) {
//             currentUser = user.username;
//             res.redirect("/");
//         }
//     })
// })


// )

// app.post("/logout", function (req, res) {
//     //currentUser = "";
//     req.logout(() => { res.redirect("/") });
// })

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