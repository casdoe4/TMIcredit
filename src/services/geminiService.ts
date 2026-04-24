import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface CreditError {
  type: string;
  account: string;
  description: string;
  severity: 'critical' | 'warning';
}

export interface LegalCitation {
  law: string;
  description: string;
}

export interface AnalysisResult {
  errors: CreditError[];
  disputeLetter: string;
  legalCitations: LegalCitation[];
}

export async function analyzeCreditReport(reportText: string): Promise<AnalysisResult> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Analyze the following credit report text for errors, inconsistencies, or FCRA violations. 
      Identify specific errors, generate a formal dispute letter addressed to a credit bureau, and provide relevant legal citations (FCRA, FDCPA, etc.) that could be used in a lawsuit.
      
      IMPORTANT: Return ONLY a valid JSON object. Do not include markdown formatting or extra text.
      
      Credit Report Text:
      ${reportText}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            errors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, description: "Type of error (e.g., Payment Status Error, Duplicate Account)" },
                  account: { type: Type.STRING, description: "The account name associated with the error" },
                  description: { type: Type.STRING, description: "Detailed description of the error" },
                  severity: { type: Type.STRING, enum: ["critical", "warning"] }
                },
                required: ["type", "account", "description", "severity"]
              }
            },
            disputeLetter: { type: Type.STRING, description: "A complete, formal dispute letter in text format" },
            legalCitations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  law: { type: Type.STRING, description: "The law or section name (e.g., FCRA § 611)" },
                  description: { type: Type.STRING, description: "Brief explanation of the law's relevance" }
                },
                required: ["law", "description"]
              }
            }
          },
          required: ["errors", "disputeLetter", "legalCitations"]
        }
      }
    });

    const text = response.text?.trim();
    if (!text) {
      throw new Error("Empty response from AI");
    }

    // Clean up potential markdown blocks if Gemini ignored the mimeType hint
    const jsonStr = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(jsonStr) as AnalysisResult;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
}
