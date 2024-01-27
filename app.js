const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/palleteDB");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

const lockedSrc = "img/secured-lock.png";
const unlockedSrc = "img/padlock-unlock.png";
const colorsNum = 6;


const itemSchema = new mongoose.Schema({
    color: String,
    locked: Boolean
})

const palleteSchema = new mongoose.Schema({
    title: String,
    colors: [itemSchema]
})


itemSchema.path("locked").default(false);
palleteSchema.path("title").default("Untitled");


const Item = mongoose.model("Item", itemSchema);


app.get("/", function (req, res) {
    Item.find({}).then((items) => {
        items.forEach(item => {
            if (!item.locked) {
                item.color = randomColor();
                item.save();
            }
        })
        res.render("index", { colors: items });
    })
})

app.post("/", function (req, res) {
    console.log(req.body.name);
    Item.find({}).then((items) => {

    })

})

app.get("/:color", function (req, res) {
    Item.findOne({ color: "#" + req.params.color }).then((item) => {
        if (item) {
            item.locked = !item.locked;
            item.save().then(() => { res.redirect("/") });
        }
    })
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