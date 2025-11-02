import { GoogleGenAI, Type } from '@google/genai';
import type { AlternateJob, AnalysisResult, InterviewFeedback } from '../types';

const getAiClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const analyzeResumeForCareerPaths = async (resumeText: string): Promise<AlternateJob[]> => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Based on the following resume, suggest 12 alternative job titles. For each, provide a skill match percentage and a brief 'path summary' explaining what skills are missing or need to be developed.\n\nResume:\n${resumeText}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              jobTitle: { type: Type.STRING },
              skillMatchPercentage: { type: Type.NUMBER },
              pathSummary: { type: Type.STRING },
            },
            required: ["jobTitle", "skillMatchPercentage", "pathSummary"],
          },
        },
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as AlternateJob[];
  } catch (error) {
    console.error("Error analyzing resume for career paths:", error);
    throw new Error("Failed to generate career paths. Please check the console for details.");
  }
};

export const analyzeJobMatch = async (resumeText: string, jdText: string): Promise<AnalysisResult> => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: `Perform an 'ATS Simulation' comparing the user's resume to the provided job description. Provide a 'Match Score' from 0-100. Generate a list of actionable resume changes (as markdown bullets) to boost the score, focusing on keywords and STAR method rewrites. Finally, write a complete, tailored cover letter.
      \n\n---RESUME---\n${resumeText}\n\n---JOB DESCRIPTION---\n${jdText}`,
      config: {
        thinkingConfig: { thinkingBudget: 32768 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchScore: { type: Type.NUMBER },
            requiredChanges: { type: Type.STRING, description: "Markdown formatted string" },
            coverLetter: { type: Type.STRING },
          },
          required: ["matchScore", "requiredChanges", "coverLetter"],
        },
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as AnalysisResult;
  } catch (error) {
    console.error("Error analyzing job match:", error);
    throw new Error("Failed to analyze job match. Please check the console for details.");
  }
};

export const getJdFromUrl = async (jobUrl: string): Promise<string> => {
    const ai = getAiClient();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Access the following URL and extract the full text of the job description. 
            
Your response must contain ONLY the raw text of the job description. Do not include any conversational filler, headings, summaries, or explanations.
            
If you access the page but cannot find any job description content, return the exact string: "ERROR: No job description content was found on this page."
            
URL: ${jobUrl}`,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (!groundingChunks || groundingChunks.length === 0) {
            throw new Error("Could not retrieve information from the URL. The link might be invalid or the site may be blocking automated access.");
        }

        const text = response.text.trim();

        if (!text || text === "ERROR: No job description content was found on this page.") {
            throw new Error("The URL was accessed, but no job description content was found. Please try pasting the description manually.");
        }

        return text;
    } catch (error) {
        console.error("Error fetching JD from URL:", error);
        if (error instanceof Error && error.message) {
            // Rethrow specific, user-friendly errors
            throw new Error(error.message);
        }
        // Generic fallback
        throw new Error("An unexpected error occurred while fetching the job description. Please try again or paste the content manually.");
    }
  };

export const getSalaryStrategy = async (details: { jobTitle: string; industry: string; location: string; yearsOfExperience: number; salaryOffer?: number; }): Promise<string> => {
    const ai = getAiClient();
    try {
        const prompt = `You are a Salary Negotiation Copilot. Your task is to provide a comprehensive salary negotiation strategy based on the user's input. Use Google Search to find up-to-date, location-specific market data.

User's Job Details:
- Job Title: ${details.jobTitle}
- Industry: ${details.industry}
- Location: ${details.location}
- Years of Experience: ${details.yearsOfExperience}
${details.salaryOffer ? `- Current Offer: $${details.salaryOffer}` : ''}

Your response MUST be a single markdown string, structured with the following headings:

## Market Analysis
Provide a realistic salary range for this role, with this experience level, in this specific location. Cite the typical range (e.g., 25th to 75th percentile).

## Counter Offer Recommendation
Based on the market analysis and the user's experience, recommend a specific, ambitious but reasonable counter-offer amount. Explain the reasoning behind this number.

## Negotiation Script
Provide a script for the user to follow. Use markdown bullet points for key talking points. The script should be polite, firm, and data-driven. It should cover the opening, presenting the case, and handling potential objections.

## Key Tips
Provide 3-5 actionable tips for the negotiation conversation. Use markdown bullet points.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (!groundingChunks || groundingChunks.length === 0) {
            throw new Error("Could not find reliable market data for the specified role and location. Please check your inputs or try a broader search.");
        }

        return response.text.trim();

    } catch (error) {
        console.error("Error generating salary strategy:", error);
         if (error instanceof Error && error.message) {
            throw new Error(error.message);
        }
        throw new Error("An unexpected error occurred while generating the salary strategy. Please try again.");
    }
};

export const generateResumeContent = async (rawExperience: string, jobDescription?: string): Promise<string> => {
    const ai = getAiClient();
    try {
        const prompt = `You are an expert career coach and resume writer. Your task is to rewrite a user's raw experience notes into professional, impactful resume bullet points.

Follow these instructions strictly:
1.  Use the STAR (Situation, Task, Action, Result) method to structure each bullet point.
2.  Start each bullet point with a strong action verb.
3.  Quantify achievements with metrics and data whenever possible. If the user provides numbers, use them.
4.  The output must be a single markdown string, with each point as a bullet item (using '-').
5.  Do not add any conversational text, headings, or summaries. Only return the list of bullet points.

${jobDescription ? `
IMPORTANT: The user has provided a target job description. Tailor the language, keywords, and emphasis of the bullet points to align perfectly with this description.

---TARGET JOB DESCRIPTION---
${jobDescription}
` : ''}

---USER'S RAW NOTES---
${rawExperience}
`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
        });

        return response.text.trim();

    } catch (error) {
        console.error("Error generating resume content:", error);
        throw new Error("An unexpected error occurred while generating resume content. Please try again.");
    }
};


export const generateInterviewReport = async (transcript: string): Promise<InterviewFeedback> => {
    const ai = getAiClient();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: `Analyze the following mock interview transcript. The user's responses are prefixed with "user:".
            1.  Provide a final performance score from 0 to 100.
            2.  Write overall feedback as a markdown string, summarizing strengths and key areas for improvement.
            3.  For each of the user's significant behavioral answers (at least 2, max 4), provide a granular STAR method breakdown. Critique each component (Situation, Task, Action, Result).
            4.  Identify 1 or 2 of the user's weakest answers. For each, provide the original answer, a rewritten "improved" answer, and a brief reasoning for the changes.
            \n\n---INTERVIEW TRANSCRIPT---\n${transcript}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        finalScore: { type: Type.NUMBER },
                        overallFeedback: { type: Type.STRING, description: "Markdown formatted summary" },
                        answerBreakdowns: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    question: { type: Type.STRING },
                                    userAnswer: { type: Type.STRING },
                                    situationFeedback: { type: Type.STRING },
                                    taskFeedback: { type: Type.STRING },
                                    actionFeedback: { type: Type.STRING },
                                    resultFeedback: { type: Type.STRING },
                                },
                                required: ["question", "userAnswer", "situationFeedback", "taskFeedback", "actionFeedback", "resultFeedback"],
                            },
                        },
                        suggestedImprovements: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    originalAnswer: { type: Type.STRING },
                                    improvedAnswer: { type: Type.STRING },
                                    reasoning: { type: Type.STRING },
                                },
                                required: ["originalAnswer", "improvedAnswer", "reasoning"],
                            },
                        },
                    },
                    required: ["finalScore", "overallFeedback", "answerBreakdowns", "suggestedImprovements"],
                },
            },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as InterviewFeedback;
    } catch (error) {
        console.error("Error generating interview report:", error);
        throw new Error("Failed to generate interview report. Please check the console for details.");
    }
};