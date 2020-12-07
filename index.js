const express = require("express");
const app = express();

app.get("/", async (req, res) => {
  const { spawn } = require("child_process");
  const pythonProcess = spawn("python", ["./test.py"]);

  console.log("starting...");

  b64_data = "";

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
  const { spawn } = require("child_process");
  const pythonProcess = spawn("python", ["./python_scripts/scrape.py"]);

  pythonProcess.stdout.on("data", function(data) {
    console.log(data.toString());
  });

  res.send("scraping...");
});

app.get("/mosaic", (req, res) => {
  res.send("creating mosaic...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
