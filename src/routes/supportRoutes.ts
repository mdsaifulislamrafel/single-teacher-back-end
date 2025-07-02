import express from "express"
import { createSupport, deleteSupport, getAllSupport, getSingleSupport, updateSupportStatus } from "../controllers/supportController"


const router = express.Router()

// Route for uploading PDF files
router.post("/", createSupport)

// Route for uploading video files to Vimeo
router.get("/:id", getSingleSupport) 
router.get("/", getAllSupport) 
router.patch("/:id", updateSupportStatus);
router.delete("/:id", deleteSupport);

export default router