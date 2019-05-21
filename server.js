let express = require("express");
let logger = require("morgan");
let mongoose = require("mongoose");
let axios = require("axios");
let cheerio = require("cheerio");
let db = require("./models");

let PORT = process.env.PORT || 3000;

let MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI);

let app = express();

app.use(logger("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/scarperHW", { useNewUrlParser: true });

// --------------------- HTML ROUTES ---------------------

app.get("/scrape", function(req, res) {
  axios.get("http://www.npr.org/sections/news/").then(function(response) {
    const $ = cheerio.load(response.data);
    let results = [];

    $("article.item").each(function(i, element) {
      let title = $(element)
        .find(".item-info")
        .find(".title")
        .find("a")
        .text();
      let link = $(element)
        .find(".item-info")
        .find(".title")
        .children()
        .attr("href");
      results.push({
        title: title,
        link: link
      });
    });
    db.Article.create(results)
      .then(function(dbArticle) {
        console.log(dbArticle);
      })
      .catch(function(err) {
        console.log(err);
      });
    console.log(results);
  });
  res.send("Scrape Complete");
});

app.get("/articles", function(req, res) {
  db.Article.find({})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.get("/articles/:id", function(req, res) {
  db.Article.findOne({ _id: req.params.id })
    .populate("note")
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.post("/articles/:id", function(req, res) {
  db.Note.create(req.body)
    .then(function(dbNote) {
      return db.Article.findOneAndUpdate(
        { _id: req.params.id },
        { note: dbNote._id },
        { new: true }
      );
    })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
