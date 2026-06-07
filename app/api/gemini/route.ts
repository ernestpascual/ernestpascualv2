import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import data from "../../config/data.json";

// Initialize Gemini with the API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY is missing in .env" }, { status: 500 });
    }

    // Get the model (using the fast and capable gemini-2.5-flash)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Prepend the system prompt from data.json
    const fullPrompt = `${data.systemPrompt}\n\nLimit your response to a maximum of 100 words.\n\nHere are the current card positions:\n${prompt}\n\nPlease provide a reading based on these positions.`;

    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const text = response.text();

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 });
  }
}
