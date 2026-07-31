import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Basic test route
app.get('/', (req, res) => {
    res.send("CampusConnect AI Backend is running!");
});

// AI Chat Route
// AI Chat Route
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    // Using the legacy syntax with the correct model name
   const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash', // Updated to the correct model version
        contents: message,
        config: {
            systemInstruction: `You are a helpful assistant named CampusConnect AI. Today's date is ${new Date().toDateString()}.`
        }
    });
    
    res.json({ reply: response.text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate AI response" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});