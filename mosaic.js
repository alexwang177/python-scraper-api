const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

// Returns a promise that resolves with tile_directory
module.exports.scrape = function(tile_query) {
  return new Promise(function(resolve, reject) {
    console.log("Starting web scraping...\n");

    const scrapePyProcess = spawn("python", [
      "./python_scripts/scrape.py",
      tile_query
    ]);

    scrapePyProcess.on("close", function(data) {
      console.log("Scraping finished");

      const tileDirectory = tile_query
        .toLowerCase()
        .split(" ")
        .join("_");

      fs.readdir("./images/" + tileDirectory, (err, files) => {
        if (err) throw err;

        console.log("Number of images: " + files.length);
      });

      resolve(tileDirectory);
    });

    scrapePyProcess.on("error", function(err) {
      reject(err);
    });
  });
};

// Returns a promise that resolves with b64 string
module.exports.makeMosaic = function(tileDirectory) {
  return new Promise(function(resolve, reject) {
    const mosaicPyProcess = spawn("python", [
      "./python_scripts/mosaic.py",
      "./images/target_image.jpg",
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

      resolve(b64_data);
    });

    mosaicPyProcess.on("error", function(err) {
      reject(err);
    });
  });
};
