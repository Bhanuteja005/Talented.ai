const express = require("express");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { promisify } = require("util");

const pipeline = promisify(require("stream").pipeline);
const router = express.Router();

let upload;
(async () => {
  const multer = (await import("multer")).default;
  
  // New Multer 2.0 configuration
  upload = multer({
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    }
  });

  // Custom file type validator
  const validateFileType = (file, allowedTypes) => {
    return allowedTypes.includes(file.mimetype);
  };

  // Resume upload endpoint
  router.post("/resume", upload.single("file"), async (req, res) => {
    try {
      const { file } = req;
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Validate PDF
      if (!validateFileType(file, ['application/pdf'])) {
        return res.status(400).json({ message: "Only PDF files are allowed" });
      }

      const filename = `${uuidv4()}.pdf`;
      const filePath = path.join(__dirname, `../public/resume/${filename}`);

      // Create directory if it doesn't exist
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true });

      // Save file
      await fs.promises.writeFile(filePath, file.buffer);

      res.status(200).json({
        message: "File uploaded successfully",
        url: `/api/download/resume/${filename}`
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({
        message: error.message || "Error while uploading"
      });
    }
  });

  // Profile image upload endpoint
  router.post("/profile", upload.single("file"), async (req, res) => {
    try {
      const { file } = req;
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Validate image types
      if (!validateFileType(file, ['image/jpeg', 'image/png'])) {
        return res.status(400).json({ message: "Only JPG and PNG files are allowed" });
      }

      const filename = `${uuidv4()}${path.extname(file.originalname)}`;
      const filePath = path.join(__dirname, `../public/profile/${filename}`);

      // Create directory if it doesn't exist
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true });

      // Save file
      await fs.promises.writeFile(filePath, file.buffer);

      res.status(200).json({
        message: "Profile image uploaded successfully",
        url: `/api/download/profile/${filename}`
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({
        message: error.message || "Error while uploading"
      });
    }
  });

  // Download endpoint
  router.get("/:type/:file", async (req, res) => {
    try {
      const { type, file } = req.params;
      const address = path.join(__dirname, `../public/${type}/${file}`);
      
      await fs.promises.access(address, fs.constants.F_OK);
      res.sendFile(address);
    } catch (error) {
      res.status(404).json({ message: "File not found" });
    }
  });
})();

module.exports = router;