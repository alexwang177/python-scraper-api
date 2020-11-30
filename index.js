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
    res.send(b64_data);
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
