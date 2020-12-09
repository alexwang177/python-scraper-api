const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();

const { spawn, spawnSync } = require("child_process");

app.get("/", async (req, res) => {
  const pythonProcess = spawn("python", ["./python_scripts/test.py"]);

  console.log("starting...");

  let b64_data = "";

  pythonProcess.stdout.on("data", function(data) {
    b64_data += data;
  });

  pythonProcess.stdout.on("close", function(data) {
    b64_data = b64_data.substring(2, b64_data.length - 1);

    var img = Buffer.from(b64_data, "base64");
    res.writeHead(200, {
      "Content-Type": "image/jpeg",
      "Content-Length": img.length
    });
    res.end(img);
  });
});

app.get("/scrape", (req, res) => {
  const pythonProcess = spawn("python", ["./python_scripts/scrape.py"]);

  pythonProcess.stdout.on("data", function(data) {
    console.log(data.toString());
  });

  res.send("scraping...");
});

app.get("/mosaic", (req, res) => {
  const pythonProcess = spawn("python", [
    "./python_scripts/mosaic.py",
    "./images/cute_turtle.jpg",
    "./images/turtles",
    "200 200",
    ""
  ]);

  let b64_data = "";

  pythonProcess.stdout.on("data", function(data) {
    b64_data += data.toString();
  });

  pythonProcess.stdout.on("close", function(data) {
    b64_data = b64_data.substring(2, b64_data.length - 1);

    var img = Buffer.from(b64_data, "base64");
    res.writeHead(200, {
      "Content-Type": "image/jpeg",
      "Content-Length": img.length
    });
    res.end(img);
  });
});

app.get("/mosaic/:target_query/:tile_query", (req, res) => {
  console.log("Starting web scraping...\n");

  const scrapePyProcess = spawnSync("python", [
    "./python_scripts/scrape.py",
    req.params.tile_query
  ]);

  const tileDirectory = req.params.tile_query
    .toLowerCase()
    .split(" ")
    .join("_");

  const mosaicPyProcess = spawn("python", [
    "./python_scripts/mosaic.py",
    "./images/cute_turtle.jpg",
    "./images/" + tileDirectory,
    "100 100",
    ""
  ]);

  let b64_data = "";

  mosaicPyProcess.stdout.on("data", function(data) {
    b64_data += data.toString();
  });

  mosaicPyProcess.stdout.on("close", function(data) {
    b64_data = b64_data.substring(2, b64_data.length - 1);

    fs.readdir("./images/" + tileDirectory, (err, files) => {
      if (err) throw err;

      for (const file of files) {
        fs.unlink(path.join("./images/" + tileDirectory, file), err => {
          if (err) throw err;
        });
      }

      fs.rmdir("./images/" + tileDirectory, err => {
        if (err) throw err;
      });
    });

    var img = Buffer.from(b64_data, "base64");
    res.writeHead(200, {
      "Content-Type": "image/jpeg",
      "Content-Length": img.length
    });
    res.end(img);
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
