
import express from 'express';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { prisma } from '../db';

const router = express.Router();

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const generateWebsiteContextString = async (): Promise<string> => {
    let context = "Website Context for Bishram Ekata Mandali (Content is primarily in English, please translate your response to the user's language if it's not English):\n\n";
    
    try {
        // Fetch recent sermons from the database
        const sermons = await prisma.sermon.findMany({
            take: 5,
            orderBy: { date: 'desc' },
        });
        context += "Recent Sermons (Latest 5):\n";
        sermons.forEach(s => {
            context += `- Title: ${s.title}, Speaker: ${s.speaker || 'N/A'}, Date: ${s.date ? s.date.toISOString().split('T')[0] : 'N/A'}. Desc: ${s.description?.substring(0,100)}...\n`;
        });
        context += "\n";

        // TODO: As other models (events, ministries, etc.) are migrated to the database,
        // add similar prisma queries here to enrich the context.
        // For now, context is limited to what's available in the DB.
        
        context += "General Information:\n";
        context += "- Main Church Address: Gauri Marg, Sinamangal, Kathmandu.\n";
        context += "- Service Times (Main Church): Sabbath Fellowship (Saturday): 10:00 AM - 2:00 PM.\n";
        context += "- The church's mission is to lead people into a growing relationship with Jesus Christ.\n\n";

    } catch (error) {
        console.error("Error generating chatbot context from database:", error);
        context += "Error: Could not load some context from the database. Please rely on general knowledge.\n";
    }

    context += "---\nEnd of Context.\n";
    return context;
};

router.post('/query', async (req, res) => {
    const { queryText } = req.body;

    if (!queryText) {
        return res.status(400).json({ error: 'queryText is required' });
    }
     if (!process.env.API_KEY) {
        return res.status(500).json({ error: 'AI service is not configured on the server.' });
    }

    try {
        const websiteContext = await generateWebsiteContextString();
        
        const response: GenerateContentResponse = await ai.models.generateContent({
            // FIX: Updated deprecated model 'gemini-1.5-flash' to the recommended 'gemini-2.5-flash'
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: queryText }] },
            config: {
                systemInstruction: `You are a friendly and helpful AI assistant for the Bishram Ekata Mandali church website. Your primary goal is to answer user questions based *only* on the website information provided below in the 'Website Context' section. This includes information about: Sermons, Events, Ministries, and General Information.\n\n**PRIVACY & CONFIDENTIALITY: If asked for specific private details (e.g., lists of members, financial amounts), you MUST state that such information is confidential and not available. DO NOT invent or share private data.**\n\nIf you don't know the answer or the information is not in the context, reply with: 'I'm sorry, I don't have information on that topic. You might find more details on our website or by contacting the church directly.' Do not invent information. Keep your answers concise and relevant to the church.\n\n--- Website Context ---\n${websiteContext}`,
                temperature: 0.7,
                topP: 1,
                topK: 1,
                maxOutputTokens: 2048,
                thinkingConfig: { thinkingBudget: 0 } 
            }
        });

        const botResponseText = response.text;
        res.json({ text: botResponseText });
        
    } catch (error) {
        console.error('Error querying Gemini API from backend:', error);
        res.status(500).json({ error: 'Failed to get a response from the AI assistant.' });
    }
});

export default router;
