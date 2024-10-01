require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const nanoid = require("nanoid");
const dns = require("dns");
const url = require("url");

// Basic Configuration
const port = process.env.PORT || 3000;

// In-memory database for short Urls
const urls = {};

// Handle form data for post requests
app.use(bodyParser.urlencoded({ extended: false }));

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

app.post("/api/shorturl", (req, res) => {
  const url = req.body.url;

  let hostname;

  try {
    // Use the URL constructor to parse the URL
    const parsedUrl = new URL(url);
    hostname = parsedUrl.hostname;
  } catch (error) {
    // If the URL is invalid, return an error
    return res.json({ error: "invalid url" });
  }

  if (!hostname) {
    return res.json({ error: "invalid url" });
  }

  dns.lookup(hostname, (err, address, family) => {
    if (err) {
      console.log(err);
      return res.json({ error: "invalid url" });
    }

    // Generate the short code and store the URL
    const shortCode = nanoid.nanoid(7);
    urls[shortCode] = url;

    // Respond with the original URL and the short code
    res.json({ original_url: url, short_url: shortCode });
  });
});

// Handle URL Shortener
app.get("/api/shorturl/:shortCode", (req, res) => {
  const shortCode = req.params.shortCode;
  const originalUrl = urls[shortCode];

  if (originalUrl) {
    res.redirect(originalUrl);
  } else {
    res.status(404).json({ error: "invalid url" });
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
