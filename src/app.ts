import express, { type Request, type Response } from "express";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import http from "http";

import { createAdminIfNotExists } from "./config/seed.js";
import authRouter from "./routes/authRoutes.js";
import teamRouter from "./routes/teamRoutes.js";
import projectRouter from "./routes/projectRoutes.js";
import userRouter from "./routes/userRoutes.js";
import dashboardRouter from "./routes/dashboardRoutes.js";
import taskRouter from "./routes/taskRoutes.js";
import chatRouter from "./routes/chatRoutes.js";
import initializeSockets from "./config/sockets.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json()); // parses req.body
app.use(express.urlencoded({ extended: true })); // parsing url encoded data
app.use(cookieParser());
app.use(morgan("dev")); //Logging
app.use(
  cors({
    origin: "*",
  }),
);

// env loading
dotenv.config();

// Routes
app.use("/auth", authRouter);
app.use("/team", teamRouter);
app.use("/project", projectRouter);
app.use("/users", userRouter);
app.use("/dashboard", dashboardRouter);
app.use("/tasks", taskRouter);
app.use("/chats", chatRouter);

// Testing Route
app.get("/test", (req, res) => {
  res.send("Backend is alive!");
});

// Seeding
await createAdminIfNotExists();

// Initializing Socket
const server = http.createServer(app);
await initializeSockets(server);

// Start server
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
