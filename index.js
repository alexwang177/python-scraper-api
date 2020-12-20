const express = require("express");
const fs = require("fs");
const multer = require("multer");
const Queue = require("bull");
const Worker = require("./js_modules/worker.js");
const { spawn } = require("child_process");

// Initialize Express instance
const app = express();

// Default route
app.get("/", async (req, res) => {
  res.send("Hello Peeps");
});

// Scrape route
app.get("/scrape/:tile_query", (req, res) => {
  const pythonProcess = spawn("python", [
    "./python_scripts/scrape.py",
    req.params.tile_query
  ]);

  pythonProcess.stdout.on("data", function(data) {
    console.log(data.toString());
  });

  pythonProcess.stderr.on("data", function(data) {
    console.log(data.toString());
  });

  res.send("scraping...");
});

// Intialize multer object
const upload = multer({
  dest: "images"
});

// Initialize Work Queue
const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
let workQueue = new Queue("work", REDIS_URL);

Worker.process(workQueue);

// Work Queue Listener
workQueue.on("completed", (job, result) => {
  console.log(`Job with id: ${job.id} completed`);
});

// Start mosaic creation job route

// Optional query string parameters:
// num_scrape
// width
// height

app.post(
  "/mosaic/:tile_query",
  upload.single("target_image"),
  async (req, res) => {
    console.log("Uploading target image...\n");

    console.log(req.file.filename);
    fs.rename(
      "./images/" + req.file.filename,
      "./images/target_image.jpg",
      err => {
        if (err) console.log(err.message);
      }
    );

    const tile_query = req.params.tile_query;
    const num_scrape = req.query.num_scrape
      ? parseInt(req.query.num_scrape)
      : 30;
    const width = req.query.width ? parseInt(req.query.width) : 50;
    const height = req.query.height ? parseInt(req.query.height) : 50;

    console.log("tile_query: " + tile_query);
    console.log("num_scrape: " + num_scrape);
    console.log("width: " + width);
    console.log("height: " + height);

    let job = await workQueue.add({ tile_query, num_scrape, width, height });
    res.json({ id: job.id });
  }
);

// Check mosaic job route
app.get("/mosaic/job/:job_id", async (req, res) => {
  let id = req.params.job_id;
  let job = await workQueue.getJob(id);

  if (job === null || job === undefined) {
    res.status(404).end();
  } else {
    let state = await job.getState();
    let progress = job._progress;
    let reason = job.failedReason;
    let returnvalue = "" + job.returnvalue;

    console.log("state: " + state);

    if (state == "completed") {
      var img = Buffer.from(returnvalue, "base64");
      res.writeHead(200, {
        "Content-Type": "image/jpeg",
        "Content-Length": img.length
      });
      res.end(img);
    } else if (state == "failed") {
      res.json({ msg: "job failed" });
    } else {
      res.json({ msg: "try again later" });
    }
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
