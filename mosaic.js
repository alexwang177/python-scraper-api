const fs = require("fs");
const path = require("path");
const { spawn, spawnSync } = require("child_process");

module.exports.scrape = function(tile_query) {
  console.log("Starting web scraping...\n");

  const scrapePyProcess = spawnSync("python", [
    "./python_scripts/scrape.py",
    tile_query
  ]);

  console.log(scrapePyProcess.stdout.toString());
  console.log("Scraping finished");

  const tileDirectory = tile_query
    .toLowerCase()
    .split(" ")
    .join("_");

  fs.readdir("./images/" + tileDirectory, (err, files) => {
    if (err) throw err;

    console.log("Number of images: " + files.length);
  });

  return makeMosaic(tileDirectory);
};

function makeMosaic(tileDirectory) {
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

      return b64_data;
    });
  });
}
