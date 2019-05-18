var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");
var mongojs = require("mongojs");

var PORT = process.env.PORT || 3000;

var app = express();

var MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI);

app.use(logger("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

mongoose.connect("mongodb://localhost/scarperHW", { useNewUrlParser: true });

// Database configuration
var databaseUrl = "scraperHW";
var collections = ["scrapedData"];

// Hook mongojs configuration to the db variable
var db = mongojs(databaseUrl, collections);
db.on("error", function(error) {
  console.log("Database Error:", error);
});

//------------------------------------
//HTML ROUTES
app.get("/", function(req, res) {
  res.send("Hello world");
});

app.get("/all", function(req, res) {
  db.scrapedData.find({}, function(error, found) {
    if (error) {
      console.log(error);
    } else {
      res.json(found);
    }
  });
});

axios.get("https://www.npr.org/").then(function(response) {
  var $ = cheerio.load(response.data);
  var results = [];

  $(".story-text").each(function(i, element) {
    var title = $(element)
      .children(".title")
      .text();
    var link = $(element)
      .children("a")
      .attr("href");
    results.push({
      title: title,
      link: link
    });
  });
  console.log(results);
  db.scrapedData.insert(results);
});

//------------------------------------

// Listen on port 3000
app.listen(PORT, function() {
  console.log("App running on port 3000!");
});
