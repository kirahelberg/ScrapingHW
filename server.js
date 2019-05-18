var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");
var mongojs = require("mongojs");

var PORT = 3000;

var app = express();

var MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI);

app.use(logger("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

mongoose.connect("mongodb://localhost/userdb", { useNewUrlParser: true });

var databaseUrl = "scraper";
var collections = ["scrapedData"];

// Hook mongojs configuration to the db variable
var db = mongojs(databaseUrl, collections);
db.on("error", function(error) {
  console.log("Database Error:", error);
});

// Main route (simple Hello World Message)
app.get("/", function(req, res) {
  res.send("Hello world");
});

// Retrieve data from the db
app.get("/all", function(req, res) {
  // Find all results from the scrapedData collection in the db
  db.scrapedData.find({}, function(error, found) {
    // Throw any errors to the console
    if (error) {
      console.log(error);
    }
    // If there are no errors, send the data to the browser as json
    else {
      res.json(found);
    }
  });
});

// Scrape data from one site and place it into the mongodb db
app.get("/scrape", function(req, res) {
  axios.get("https://news.ycombinator.com/").then(function(response) {
    var $ = cheerio.load(response.data);

    $(".title").each(function(i, element) {
      var title = $(element)
        .children("a")
        .text();
      var link = $(element)
        .children("a")
        .attr("href");

      if (title && link) {
        db.scrapedData.insert(
          {
            title: title,
            link: link
          },
          function(err, inserted) {
            if (err) {
              console.log(err);
            } else {
              console.log(inserted);
            }
          }
        );
      }
    });
  });

  res.send("Scrape Complete");
});

// Listen on port 3000
app.listen(3000, function() {
  console.log("App running on port 3000!");
});
