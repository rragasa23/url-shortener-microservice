require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");

const { MongoClient } = require("mongodb");
const client = new MongoClient(process.env.MONGO_URI);
const db = client.db("fcc-urlshortener");
const urls = db.collection("urls");

const bodyParser = require("body-parser");
const nanoid = require("nanoid");
const dns = require("dns");
const urlparser = require("url");

// In-memory database for short Urls
// const urls = {};

// Basic Configuration
const port = process.env.PORT || 3000;
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use("/public", express.static(`${process.cwd()}/public`));
app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Process form data
app.post("/api/shorturl", (req, res) => {
  const url = new URL(req.body.url);
  const hostname = url.hostname;

  const dnslookup = dns.lookup(hostname, async (err, address, family) => {
    if (!address) {
      console.log(err);
      return res.json({ error: "invalid url" });
    } else {
      // Generate the short code
      const shortCode = nanoid.nanoid(7);

      // Store in database
      const urlDoc = {
        url: req.body.url,
        short_url: shortCode,
      };
      const result = await urls.insertOne(urlDoc);

      // Respond with the original URL and the short code
      res.json({ original_url: url, short_url: shortCode });
    }
  });
});

// Handle URL Shortener and allow redirect
app.get("/api/shorturl/:shortCode", async (req, res) => {
  const shortCode = req.params.shortCode;
  const originalUrl = await urls.findOne({ short_url: shortCode });
  res.redirect(originalUrl.url);
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
