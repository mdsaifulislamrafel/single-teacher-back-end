import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose"; // ✅ only here
import cookieParser from "cookie-parser";

// Routes
import categoryRoutes from "./routes/categoryRoutes";
import subcategoryRoutes from "./routes/subcategoryRoutes";
import videoRoutes from "./routes/videoRoutes";
import pdfRoutes from "./routes/pdfRoutes";
import userRoutes from "./routes/userRoutes";
import authRoutes from "./routes/authRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import bookRoutes from "./routes/bookRoutes";
import supportRouters from "./routes/supportRoutes";

// Load env
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Express setup
const app = express();
app.use(cookieParser());
const PORT = process.env.PORT || 5000;
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(cors({
  origin: [ "https://single-teacher.netlify.app","https://single.alokshikha.com", "http://localhost:5173"],
  
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
}));

// Static files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes
app.use("/api/categories", categoryRoutes);
app.use("/api/subcategories", subcategoryRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/pdfs", pdfRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/support", supportRouters);

// Health check
app.get("/", (_req, res) => {
  res.status(200).json({ status: "Single teacher server is raining" });
});

// Connect DB & start server
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
