import express from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();
// Store uploads in memory first so we can write to DB
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", authenticate, upload.single("file"), uploadFile);

export default router;
