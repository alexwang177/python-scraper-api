const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const Queue = require("bull");

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

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const workQueue = new Queue("work", REDIS_URL);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

workQueue.process(async job => {
  let progress = 0;

  while (progress < 20) {
    await sleep(1000);
    progress += 1;
    console.log(progress + " seconds");
    job.progress(progress);
  }

  return { value: "This is important data" };
});

workQueue.on("completed", (job, result) => {
  console.log(`Job with id: ${job.id} completed with result: ${result.value}`);
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
    res.json({ id, state, progress, reason });
  }
});

app.post(
  "/mosaic/:target_query/:tile_query",
  upload.single("target_image"),
  (req, res) => {
    console.log("Uploading target image...\n");

    console.log(req.file.filename);
    fs.rename(
      "./images/" + req.file.filename,
      "./images/target_image.jpg",
      err => {
        if (err) console.log(err.message);
      }
    );

    console.log("Starting web scraping...\n");

    const scrapePyProcess = spawnSync("python", [
      "./python_scripts/scrape.py",
      req.params.tile_query
    ]);

    console.log(scrapePyProcess.stdout.toString());
    console.log("Scraping finished");

    const tileDirectory = req.params.tile_query
      .toLowerCase()
      .split(" ")
      .join("_");

    fs.readdir("./images/" + tileDirectory, (err, files) => {
      if (err) throw err;

      console.log("Number of images: " + files.length);
    });

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

      console.log(b64_data);

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
  }
);

app.get("/mosaic/job/:job_id", async (req, res) => {});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
