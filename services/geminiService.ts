import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateMockData = async (schemaOrDescription: string, url: string, method: string): Promise<any> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please set process.env.API_KEY.");
  }

  const prompt = `
    You are a high-performance mock server API. 
    I need you to generate a realistic JSON response for an HTTP ${method} request to the URL: "${url}".
    
    The user has provided the following Type Definition / Schema / Description for the expected response data:
    ---
    ${schemaOrDescription}
    ---
    
    Rules:
    1. Output ONLY valid JSON. No markdown formatting, no explanations.
    2. Make the data realistic (names, dates, emails, etc.).
    3. If the schema implies an array (e.g. "List of users"), generate 3-5 items.
    4. If the input is vague, infer the best structure from the URL.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-latest',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text;
    if (!text) return { error: "No response generated" };
    
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse Gemini JSON", text);
      return { error: "Failed to parse generated mock data", raw: text };
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate mock data. Check API Key or Quota.");
  }
};