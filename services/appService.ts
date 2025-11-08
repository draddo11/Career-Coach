
import { getAiClient } from './geminiService';
import { Type } from '@google/genai';
import type { AlternateJob, AnalysisResult, InterviewFeedback, TranscriptMessage, LearningPathResult } from '../types';

// --- Helper for parsing JSON responses ---
const parseJsonResponse = <T>(text: string, typeName: string): T => {
    try {
        const cleanedText = text.replace(/^```json\s*|```\s*$/g, '').trim();
        return JSON.parse(cleanedText) as T;
    } catch (error) {
        console.error(`Error parsing JSON for ${typeName}:`, text);
        throw new Error(`The AI returned an invalid format for ${typeName}.`);
    }
};

// --- AI Features (Direct-to-API) ---

export const analyzeResumeForCareerPaths = async (resumeText: string): Promise<AlternateJob[]> => {
    const ai = getAiClient();
    const prompt = `Based on the following resume, suggest 3 to 5 alternative career paths or related job titles the person could be a good fit for. For each suggestion, provide a job title, a skill match percentage (0-100), and a brief one-sentence path summary explaining why it's a good fit.\n\nRESUME:\n${resumeText}`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        jobTitle: { type: Type.STRING },
                        skillMatchPercentage: { type: Type.NUMBER },
                        pathSummary: { type: Type.STRING }
                    },
                    required: ["jobTitle", "skillMatchPercentage", "pathSummary"]
                }
            }
        }
    });
    return parseJsonResponse<AlternateJob[]>(response.text, 'AlternateJob[]');
};

export const analyzeJobMatch = async (resumeText: string, jdText: string): Promise<AnalysisResult> => {
    const ai = getAiClient();
    const prompt = `Act as an expert career coach. Critically analyze the resume against the provided job description. Perform the following tasks:
1.  Calculate a "match score" from 0 to 100 representing how well the resume aligns with the job description's key requirements.
2.  Provide a concise list of "requiredChanges" in markdown format. These should be actionable suggestions to improve the resume for this specific job application.
3.  Write a professional and tailored "coverLetter" (as a plain string, with newlines) based on the resume and job description.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jdText}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    matchScore: { type: Type.NUMBER },
                    requiredChanges: { type: Type.STRING, description: "Markdown formatted string" },
                    coverLetter: { type: Type.STRING }
                },
                required: ["matchScore", "requiredChanges", "coverLetter"]
            },
            thinkingConfig: { thinkingBudget: 8192 }
        }
    });
    return parseJsonResponse<AnalysisResult>(response.text, 'AnalysisResult');
};

export const getSalaryStrategy = async (details: any): Promise<string> => {
    const ai = getAiClient();
    const { jobTitle, industry, location, yearsOfExperience, salaryOffer } = details;
    const prompt = `Act as an expert salary negotiation consultant. I will provide details for a job role. Use Google Search to find current, relevant market data for this role. Based on your research and the details provided, generate a negotiation strategy in markdown format.

Job Title: ${jobTitle}
Industry: ${industry}
Location: ${location}
Years of Experience: ${yearsOfExperience}
${salaryOffer ? `Current Salary Offer (USD): ${salaryOffer}` : ''}

Your strategy should include:
- A researched market salary range for this role and location.
- Key points to emphasize during negotiation based on the experience level.
- Specific phrases or talking points to use.
- If an offer was provided, critique it and suggest a counter-offer range.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }]
        }
    });

    return response.text;
};

export const generateResumeContent = async (rawExperience: string, jobDescription?: string): Promise<string> => {
    const ai = getAiClient();
    const prompt = `You are an expert resume writer. Transform the following raw experience notes into 3-5 professional, action-oriented resume bullet points. Each bullet point should start with an action verb and ideally follow the STAR (Situation, Task, Action, Result) method. Quantify results where possible.

${jobDescription ? `IMPORTANT: Tailor the bullet points to align with the keywords and requirements in this target job description:\n${jobDescription}\n\n` : ''}
Raw Experience Notes:
"${rawExperience}"

Return the result as a markdown list.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
};

export const generateInterviewReport = async (transcript: string): Promise<InterviewFeedback> => {
    const ai = getAiClient();
    const prompt = `Analyze the provided mock interview transcript. Provide a detailed performance report.
    
    TRANSCRIPT:
    ${transcript}
    
    The report must include:
    1.  A "finalScore" (0-100).
    2.  "overallFeedback" in markdown format.
    3.  An array of "answerBreakdowns" for each of the user's answers. For each, analyze it using the STAR method (Situation, Task, Action, Result) and provide brief feedback for each component. Include the original question and user answer.
    4.  An array of "suggestedImprovements" for the 1-2 weakest answers, providing the original answer, an improved version, and the reasoning for the change.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    finalScore: { type: Type.NUMBER },
                    overallFeedback: { type: Type.STRING },
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
                                resultFeedback: { type: Type.STRING }
                            },
                             required: ["question", "userAnswer", "situationFeedback", "taskFeedback", "actionFeedback", "resultFeedback"]
                        }
                    },
                    suggestedImprovements: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                originalAnswer: { type: Type.STRING },
                                improvedAnswer: { type: Type.STRING },
                                reasoning: { type: Type.STRING }
                            },
                            required: ["originalAnswer", "improvedAnswer", "reasoning"]
                        }
                    }
                },
                required: ["finalScore", "overallFeedback"]
            }
        }
    });
    return parseJsonResponse<InterviewFeedback>(response.text, 'InterviewFeedback');
};

export const generateInterviewTurn = async (payload: {
    jdText: string;
    transcript: TranscriptMessage[];
    interviewStyle: string;
    skillsToPractice: string;
}): Promise<string> => {
    const ai = getAiClient();
    const { jdText, transcript, interviewStyle, skillsToPractice } = payload;
    const history = transcript.map(t => `${t.speaker}: ${t.text}`).join('\n');

    const prompt = `You are an AI interviewer conducting a mock interview.
Your persona is: ${interviewStyle}.
The job description is:
---
${jdText}
---
${skillsToPractice ? `You should focus your questions on these skills: ${skillsToPractice}.\n` : ''}

Here is the conversation so far:
---
${history}
---
Based on the conversation history and the job description, ask the next logical interview question. Keep your response concise and focused on a single question. Do not add any conversational filler.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });

    return response.text;
};

export const getLearningPath = async (resumeText: string, targetRole: string): Promise<LearningPathResult> => {
    const ai = getAiClient();
    const prompt = `Act as a technical career advisor. Analyze the user's resume and their stated target role.
1. Identify the key "skillGaps" between their current experience and what's required for the target role.
2. Create a list of 5-7 "learningResources" to bridge these gaps. For each resource, specify the skill it targets, the resource type (e.g., 'Online Course', 'Article', 'Project Idea'), a title, a brief description, and a valid URL.

Resume:
---
${resumeText}
---
Target Role:
---
${targetRole}
---
`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    targetRole: { type: Type.STRING },
                    skillGaps: { type: Type.ARRAY, items: { type: Type.STRING } },
                    learningResources: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                skill: { type: Type.STRING },
                                resourceType: { type: Type.STRING, enum: ['Online Course', 'Article', 'Video Tutorial', 'Official Documentation', 'Book', 'Project Idea'] },
                                title: { type: Type.STRING },
                                description: { type: Type.STRING },
                                url: { type: Type.STRING }
                            },
                            required: ["skill", "resourceType", "title", "description", "url"]
                        }
                    }
                },
                required: ["targetRole", "skillGaps", "learningResources"]
            }
        }
    });
    return parseJsonResponse<LearningPathResult>(response.text, 'LearningPathResult');
};
