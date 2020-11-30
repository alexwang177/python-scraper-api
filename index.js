const express = require("express");
const app = express();

app.get("/", (req, res) => {
  const { spawn } = require("child_process");
  const pythonProcess = spawn("python", ["./test.py"]);

  pythonProcess.stdout.on("data", function(data) {
    res.send(data.toString());
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
