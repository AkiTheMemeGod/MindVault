import express from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/", authenticate, upload.single("file"), uploadFile);

export default router;
