const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const Queue = require("bull");
const Worker = require("./worker.js");

// Initialize Express instance
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

app.get("/mosaic", (req, res) => {
  const pythonProcess = spawn("python", [
    "./python_scripts/mosaic.py",
    "./images/cute_turtle.jpg",
    "./images/turtles",
    "50 50",
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

app.post("/bigsum", async (req, res) => {
  let job = await workQueue.add();
  res.json({ id: job.id });
});

app.get("/bigsum/:job_id", async (req, res) => {
  let id = req.params.job_id;
  let job = await workQueue.getJob(id);

  console.log(job);

  if (job === null || job === undefined) {
    res.status(404).end();
  } else {
    let state = await job.getState();
    let progress = job._progress;
    let reason = job.failedReason;
    let returnvalue = job.returnvalue;
    res.json({ id, state, progress, reason, returnvalue });
  }
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
      console.log(returnvalue);

      var img = Buffer.from(returnvalue, "base64");
      res.writeHead(200, {
        "Content-Type": "image/jpeg",
        "Content-Length": img.length
      });
      res.end(img);
    } else if (state == "failed") {
      console.log(job);
      res.json({ msg: "job failed" });
    } else {
      res.json({ msg: "try again later" });
    }
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
