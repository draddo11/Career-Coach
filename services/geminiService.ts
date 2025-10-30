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