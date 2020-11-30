const express = require("express");
const app = express();

app.get("/", async (req, res) => {
  const { spawn } = require("child_process");
  const pythonProcess = spawn("python", ["./test.py"]);

  console.log("starting...");

  pythonProcess.stdout.on("data", function(data) {
    console.log("getting data");
    console.log(data.toString());
  });

  res.send("done");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
