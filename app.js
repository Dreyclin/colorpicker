const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

mongoose.connect("mongodb://localhost:27017/palleteDB");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

const lockedSrc = "img/secured-lock.png";
const unlockedSrc = "img/padlock-unlock.png";
const colorsNum = 6;
const saltRounds = 10;
let isLogged = false;
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

itemSchema.path("locked").default(false);

const Item = mongoose.model("Item", itemSchema);
const User = mongoose.model("User", userSchema);

app.get("/", function (req, res) {
    if (currentUser != "" && isLogged) {
        User.findOne({ username: currentUser }).then(user => {
            if (user.colors.length > 0) {
                user.colors.forEach(color => {
                    if (!color.locked) {
                        color.color = randomColor();
                    }
                })
                user.save();
                res.render("index", { colors: user.colors, isLogged: isLogged, name: currentUser })
            } else {
                for (let i = 0; i < 6; i++) {
                    user.colors.push({ color: randomColor(), locked: false });
                }
                user.save();
                res.render("index", { colors: user.colors, isLogged: isLogged, name: currentUser })
            }
        })
    } else {
        Item.find({}).then((items) => {
            items.forEach(item => {
                if (!item.locked) {
                    item.color = randomColor();
                    item.save();
                }
            })
            res.render("index", { colors: items, isLogged: isLogged, name: currentUser });
        })
    }

})

app.get("/:color", function (req, res) {
    const colorParam = req.params.color;
    const isFaviconRequest = req.url.includes('favicon.ico');
    
    if (colorParam && !isFaviconRequest) {
        if (currentUser != "" && isLogged) {
            User.findOne({ username: currentUser }).then(user => {
                let foundColor = user.colors.filter(color => { return color.color == "#" + req.params.color });
                foundColor[0].locked = true;
                user.save().then(() => { res.redirect("/") });
            })
        } else {
            Item.findOne({ color: "#" + req.params.color }).then((item) => {
                if (item) {
                    item.locked = !item.locked;
                    item.save().then(() => { res.redirect("/") });
                }
            })
        }
    }
})

app.post("/register", function (req, res) {
    const name = req.body.name;
    const password = req.body.password;

    bcrypt.hash(password, saltRounds, function (err, hash) {
        const newUser = new User({
            username: name,
            password: hash
        })

        newUser.save().then(() => {
            isLogged = true;
            currentUser = name;
            res.redirect("/");
        });
    })
})

app.post("/login", function (req, res) {
    User.findOne({username: req.body.name}).then((user) => {
        bcrypt.compare(req.body.password, user.password, function(err, result) {
            if(result){
                isLogged = true;
                currentUser = user.username;
                res.redirect("/");
            }
        })
    })
})

app.post("/logout", function (req, res) {
    isLogged = false;
    currentUser = "";
    res.redirect("/");
})

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