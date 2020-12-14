const express = require("express");
const fs = require("fs");
const multer = require("multer");
const Queue = require("bull");
const Worker = require("./worker.js");

// Initialize Express instance
const app = express();

const { spawn } = require("child_process");

app.get("/", async (req, res) => {
  res.send("Hello Peeps");
});

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

// Intialize Work Queue
const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
let workQueue = new Queue("work", REDIS_URL);

Worker.process(workQueue);

workQueue.on("completed", (job, result) => {
  console.log(`Job with id: ${job.id} completed with result: ${result}`);
});

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

    let job = await workQueue.add({ tile_query: req.params.tile_query });
    res.json({ id: job.id });
  }
);

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
