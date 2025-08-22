import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./configs/mongodb.js";
import { clerkWebhooks, stripeWebhooks } from "./controllers/webhooks.js";
import educatorRouter from "./routes/educatorRoutes.js";
import { clerkMiddleware } from "@clerk/express";
import connectCloudinary from "./configs/cloudinary.js";
import courseRouter from "./routes/courseRoute.js";
import userRouter from "./routes/userRoutes.js";

// Initialize express
const app = express();

// Connect to database & cloudinary
await connectDB();
await connectCloudinary();

// Middlewares
app.use(cors());

// --- ROUTES ---

app.get("/", (req, res) => res.send("API Working"));

// Stripe webhook must come BEFORE express.json() as it needs the raw body
app.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhooks
);

// Now, apply the JSON parser for all other routes that come after this line
app.use(express.json());

// Apply the Clerk middleware after parsing JSON
app.use(clerkMiddleware());

// All other routes will now use the middlewares defined above
app.post("/clerk", clerkWebhooks);
app.use("/api/educator", educatorRouter);
app.use("/api/course", courseRouter);
app.use("/api/user", userRouter);

// Port
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});