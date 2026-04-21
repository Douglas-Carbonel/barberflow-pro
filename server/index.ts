import express from "express";
import cors from "cors";
import { healthRouter } from "./routes/health.js";
import { meRouter } from "./routes/me.js";
import { clientsRouter } from "./routes/clients.js";
import { professionalsRouter } from "./routes/professionals.js";
import { servicesRouter } from "./routes/services.js";
import { serviceCategoriesRouter } from "./routes/service-categories.js";
import { errorHandler } from "./middleware/error.js";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));

// Public routes
app.use("/api", healthRouter);

// Authenticated resource routes
app.use("/api/me", meRouter);
app.use("/api/clients", clientsRouter);
app.use("/api/professionals", professionalsRouter);
app.use("/api/services", servicesRouter);
app.use("/api/service-categories", serviceCategoriesRouter);

// 404 for unknown /api routes
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

app.use(errorHandler);

const PORT = Number(process.env.PORT_API ?? 3001);
app.listen(PORT, "0.0.0.0", () => {
  console.log(`[api] listening on http://0.0.0.0:${PORT}`);
});
