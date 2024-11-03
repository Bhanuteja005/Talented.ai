const express = require("express");
// const multer = require("multer"); // Remove this line
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { promisify } = require("util");

const pipeline = promisify(require("stream").pipeline);

const router = express.Router();

// Use dynamic import for multer
let upload;
(async () => {
  const multer = (await import("multer")).default;
  upload = multer();

  // Ensure the directories exist
  const ensureDirectoryExistence = (filePath) => {
    const dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
      return true;
    }
    fs.mkdirSync(dirname, { recursive: true });
  };

  router.post("/resume", upload.single("file"), (req, res) => {
    const { file } = req;
    if (!file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    if (file.mimetype !== "application/pdf") {
      return res.status(400).json({
        message: "Invalid format. Only PDF files are allowed.",
      });
    }

    const filename = `${uuidv4()}.pdf`;
    const filePath = path.join(__dirname, `../public/resume/${filename}`);

    ensureDirectoryExistence(filePath);

    pipeline(file.stream, fs.createWriteStream(filePath))
      .then(() => {
        res.send({
          message: "File uploaded successfully",
          url: `/api/download/resume/${filename}`,
        });
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({
          message: "Error while uploading",
        });
      });
  });

  router.get("/resume/:file", (req, res) => {
    const address = path.join(__dirname, `../public/resume/${req.params.file}`);
    fs.access(address, fs.F_OK, (err) => {
      if (err) {
        res.status(404).json({
          message: "File not found",
        });
        return;
      }
      res.sendFile(address);
    });
  });

  router.post("/profile", upload.single("file"), (req, res) => {
    const { file } = req;
    if (!file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    if (file.mimetype !== "image/jpeg" && file.mimetype !== "image/png") {
      return res.status(400).json({
        message: "Invalid format. Only JPG and PNG files are allowed.",
      });
    }

    const filename = `${uuidv4()}${path.extname(file.originalname)}`;
    const filePath = path.join(__dirname, `../public/profile/${filename}`);

    ensureDirectoryExistence(filePath);

    pipeline(file.stream, fs.createWriteStream(filePath))
      .then(() => {
        res.send({
          message: "Profile image uploaded successfully",
          url: `/api/download/profile/${filename}`,
        });
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({
          message: "Error while uploading",
        });
      });
  });

  // Export the router after multer is initialized
})();
  module.exports = router;
