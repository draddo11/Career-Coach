
import { GoogleGenAI, Type } from '@google/genai';
import type { AlternateJob, AnalysisResult, InterviewFeedback } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeResumeForCareerPaths = async (resumeText: string): Promise<AlternateJob[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Based on the following resume, suggest 5-10 alternative job titles. For each, provide a skill match percentage and for the top 3, a brief 'path summary' explaining what skills are missing or need to be developed.\n\nResume:\n${resumeText}`,
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
            required: ["jobTitle", "skillMatchPercentage"],
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

export const generateInterviewReport = async (transcript: string): Promise<InterviewFeedback> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: `Analyze the following mock interview transcript. Provide a final performance score from 0 to 100. Also, give structured feedback as a markdown string on the user's answers, covering content relevance, use of the STAR method, and clarity.
            \n\n---INTERVIEW TRANSCRIPT---\n${transcript}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        finalScore: { type: Type.NUMBER },
                        feedback: { type: Type.STRING, description: "Markdown formatted string" },
                    },
                    required: ["finalScore", "feedback"],
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
