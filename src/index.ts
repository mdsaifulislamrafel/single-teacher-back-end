import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import path from "path"
import mongoose from "mongoose"
import categoryRoutes from "./routes/categoryRoutes"
import subcategoryRoutes from "./routes/subcategoryRoutes"
import videoRoutes from "./routes/videoRoutes"
import pdfRoutes from "./routes/pdfRoutes"
import userRoutes from "./routes/userRoutes"
import authRoutes from "./routes/authRoutes"
import paymentRoutes from "./routes/paymentRoutes"
import uploadRoutes from "./routes/uploadRoutes"
import cookieParser from "cookie-parser";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Create Express app
const app = express()
app.use(cookieParser());
const PORT = process.env.PORT || 5000
app.use(express.urlencoded({ extended: true }));

// File upload handling
app.use(express.static(path.join(__dirname, '../uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!)
    console.log("MongoDB connected successfully")
  } catch (error) {
    console.error("MongoDB connection error:", error)
    process.exit(1)
  }
}

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}))
app.use(express.json())

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")))

// Routes
app.use("/api/categories", categoryRoutes);
app.use("/api/subcategories", subcategoryRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/pdfs", pdfRoutes)
app.use("/api/users", userRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/payments", paymentRoutes)
app.use("/api/upload", uploadRoutes)

// Health check
app.get("/", (req, res) => {
  res.status(200).json({ status: "Single teacher server is raining" })
})

// Connect to database and start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
})