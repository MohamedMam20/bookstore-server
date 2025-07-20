const express = require("express");
const router = express.Router();
const cloudinary = require("../utils/cloudinary");
const upload = require("../middlewares/upload");

router.post("/upload", upload.single("image"), (req, res) => {
  const fileBuffer = req.file.buffer;

  const stream = cloudinary.uploader.upload_stream(
    { folder: "bookStore" },
    (error, result) => {
      if (error) {
        console.error("Upload error:", error);
        return res.status(500).json({ error: "Upload failed" });
      }
      res.status(200).json({ url: result.secure_url });
    }
  );

  stream.end(fileBuffer);
});

module.exports = router;
