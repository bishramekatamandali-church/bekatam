import express from "express";
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

const router = express.Router();

// Ensure API key exists
if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set for aiTools");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

router.post("/generate-ad-copy", async (req, res) => {
  const { linkUrl } = req.body;

  if (!linkUrl) {
    return res.status(400).json({ error: "linkUrl is required" });
  }

  try {
    const prompt = `
      Analyze the content of this webpage and generate advertising copy.
      Webpage URL: ${linkUrl}
      Task:
        • Generate a very concise ad name (under 5 words)
        • Generate an alt text for an image (under 15 words)
      Output:
        Return a minified JSON object:
        {"name":"...", "altText":"..."}
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            altText: { type: Type.STRING },
          },
          required: ["name", "altText"],
        },
      },
    });

    // FIX: response.text may be undefined → provide fallback "{}"
    const safeText = response.text ?? "{}";

    let jsonResponse;
    try {
      jsonResponse = JSON.parse(safeText);
    } catch (err) {
      return res.status(500).json({
        error: "AI returned invalid JSON",
        raw: safeText,
      });
    }

    return res.json(jsonResponse);
  } catch (error: any) {
    console.error("Error generating ad copy:", error);
    return res.status(500).json({
      error: "Failed to get a response from the AI assistant",
      details: error.message,
    });
  }
});

export default router;
