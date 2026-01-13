//src/server.js

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import OpenAI from "openai";
import { searchDocuments } from "./search.js";
import { buildPrompt } from "./prompt.js";

const app = express();

app.use(cors());

app.use(express.json());

const openai = new OpenAI({
    apiKey:process.env.OPENAI_API_KEY
});


app.post("/ask", async (req, res) => {
  const { question } = req.body;
  console.log("Received question:", question);
  try{
  const docs = await searchDocuments(question);

  const context = docs.map(d => d.content).join("\n---\n");

  const prompt = buildPrompt(context, question);
  console.log("Constructed prompt:", prompt);
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }]
  });
  console.log("Generated answer:", completion.choices[0].message.content);

  res.json({ answer: completion.choices[0].message.content });
  }catch(err){
    console.error("Error during /ask:", err);
    res.status(500).json({ error: "Internal server error" });
    return;
  }

});

app.listen(3000, () =>
  console.log("RAG server running on http://localhost:3000")
);