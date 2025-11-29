import express from "express";
import { generate } from "./chatbot.js";
import cors from "cors";
// import dotenv from "dotenv";
// dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.send("AI Chatbot Server Running...");
});

// Example route for AI processing
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    // ---- Call LLM or tools here ----
    const result=await generate(message);
     console.log("result")
    console.log(result)
    res.json({
    result
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Start server
const PORT = process.env.PORT || 300;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
