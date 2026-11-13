
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(cors({
    origin: [
        "http://127.0.0.1:3000",
        "http://localhost:3000"
    ]
}));

app.use(express.json({ limit: "20kb" }));

// Check API key
if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is missing in backend/.env");
    process.exit(1);
}

// Initialize Gemini
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";

// Smart Academy AI instructions
const systemInstruction = `
You are Smart Academy AI Assistant.

Your purpose is to help students and parents visiting
the Smart Academy website.

You can help with:
- Available courses
- Course information
- Admissions
- Enrollment guidance
- General educational questions
- Website navigation

Available courses:
1. Kids Science Course
2. Kids Chef Course
3. Kids Music Course
4. Kids Swimming Course
5. Kids Aerobic Course
6. Kids Languages Course
7. Kids Craft and Art Course
8. Kids Go Green Course

Important rules:
- Be friendly, polite and professional.
- Use simple English.
- Keep answers clear and concise.
- Never invent course fees, timings or admission dates.
- If information is unavailable, ask visitors to contact Smart Academy.
- Never claim that a student is enrolled.
`;

// Test backend
app.get("/api/health", (req, res) => {
    res.json({
        status: "success",
        message: "Smart Academy Gemini AI server is running!",
        model: MODEL
    });
});

// Gemini chatbot API
app.post("/api/chat", async (req, res) => {
    try {
        const { messages } = req.body;

        // Validate messages
        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({
                error: "Please provide a message."
            });
        }

        const conversation = messages.slice(-12);

        const validMessages = conversation.every(message =>
            message &&
            ["user", "assistant"].includes(message.role) &&
            typeof message.content === "string" &&
            message.content.trim().length > 0 &&
            message.content.length <= 2000
        );

        if (!validMessages) {
            return res.status(400).json({
                error: "Invalid message format."
            });
        }

        // Convert messages to Gemini format
        const contents = conversation.map(message => ({
            role: message.role === "assistant" ? "model" : "user",
            parts: [
                { text: message.content }
            ]
        }));

        // Call Gemini API
        let response;
        let lastError;

        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                response = await ai.models.generateContent({
                    model: MODEL,
                    contents,
                    config: {
                        systemInstruction,
                        maxOutputTokens: 600,
                        temperature: 0.7
                    }
                });

                break;

            } catch (error) {
                lastError = error;

                const status = Number(
                    error.status || error.statusCode || 0
                );

                const temporary =
                    status === 503 ||
                    status === 429 ||
                    status >= 500;

                if (!temporary || attempt === 3) {
                    throw error;
                }

                const delay = 1000 * Math.pow(2, attempt - 1);

                console.log(
                    `Gemini retry ${attempt}/3 after ${delay}ms`
                );

                await new Promise(resolve =>
                    setTimeout(resolve, delay)
                );
            }
        }

        if (!response) {
            throw lastError || new Error("Gemini did not respond.");
        }

        const reply = response.text;

        if (!reply) {
            throw new Error("Gemini returned an empty response.");
        }

        // Send successful response to frontend
        return res.json({
            success: true,
            reply: reply,
            model: MODEL
        });

    } catch (error) {
        console.error("Gemini API error:", error.message);

        return res.status(503).json({
            success: false,
            error: "Smart Academy AI is temporarily unavailable. Please try again."
        });
    }

}); // IMPORTANT: closes the chatbot route

// Start backend server
app.listen(PORT, () => {
    console.log("----------------------------------");
    console.log("Smart Academy Gemini AI Started");
    console.log("Model:", MODEL);
    console.log(`Server: http://localhost:${PORT}`);
    console.log("----------------------------------");
});
