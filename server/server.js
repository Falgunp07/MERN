// import express from "express";
// import cors from "cors";
// import "dotenv/config";
// import connectDB from "./configs/mongodb.js";
// import { clerkWebhooks, stripeWebhooks } from "./controllers/webhooks.js";
// import educatorRouter from "./routes/educatorRoutes.js";
// import { clerkMiddleware } from "@clerk/express";
// import connectCloudinary from "./configs/cloudinary.js";
// import courseRouter from "./routes/courseRoute.js";
// import userRouter from "./routes/userRoutes.js";

// // Initialize express
// const app = express();

// // Connect to database & cloudinary
// await connectDB();
// await connectCloudinary();

// // Middlewares
// app.use(cors());

// // --- ROUTES ---
// app.get("/", (req, res) => res.send("API Working"));


// app.post(
//   "/stripe", // Use a consistent base path if desired, e.g., /api/webhook/stripe
//   express.raw({ type: "application/json" }),
//   stripeWebhooks
// );

// // Now, apply the JSON parser for all other routes that come after this line
// app.use(express.json());

// // Apply the Clerk middleware after parsing JSON
// app.use(clerkMiddleware());

// // All other routes will now use the middlewares defined above
// app.post("/clerk", clerkWebhooks);
// app.use("/api/educator", educatorRouter);
// app.use("/api/course", courseRouter);
// app.use("/api/user", userRouter);

// // Port
// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
// });


import express from 'express';
import cors from 'cors';
import 'dotenv/config'; // Your method - this is correct. Keep it at the top.

import connectDB from './configs/mongodb.js';
import { clerkWebhooks, stripeWebhooks } from './controllers/webhooks.js';
import educatorRouter from './routes/educatorRoutes.js';
import { clerkMiddleware } from '@clerk/express';
import connectCloudinary from './configs/cloudinary.js';
import courseRouter from './routes/courseRoute.js';
import userRouter from './routes/userRoutes.js';

const app = express();

// Connect to database & cloudinary
await connectDB();
await connectCloudinary();

// --- Middlewares & Routes ---
app.use(cors());
app.get('/', (req, res) => res.send('API Working'));

// --- Webhook Routes (must come BEFORE express.json()) ---
// Both webhooks need the raw request body for security verification.
app.post('/stripe', express.raw({ type: 'application/json' }), stripeWebhooks);
app.post('/clerk', express.raw({ type: 'application/json' }), clerkWebhooks);

// --- Normal Middlewares for your API routes ---
app.use(express.json());
app.use(clerkMiddleware());

// --- API Routes ---
app.use('/api/educator', educatorRouter);
app.use('/api/course', courseRouter);
app.use('/api/user', userRouter);
        
// --- Start server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});