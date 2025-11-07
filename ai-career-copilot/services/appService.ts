
import { apiClient } from './apiClient';
import type { AlternateJob, AnalysisResult, InterviewFeedback, TranscriptMessage, LearningPathResult } from '../types';

// --- Health Check ---
export const checkBackendHealth = (): Promise<{ status: string }> =>
    apiClient.get('/health');

// --- AI Features ---
export const analyzeResumeForCareerPaths = (resumeText: string): Promise<AlternateJob[]> => 
    apiClient.post('/analyze/career-paths', { resumeText });

export const analyzeJobMatch = (resumeText: string, jdText: string): Promise<AnalysisResult> =>
    apiClient.post('/analyze/job-match', { resumeText, jdText });

export const getJdFromUrl = (jobUrl: string): Promise<string> =>
    apiClient.post('/analyze/jd-from-url', { jobUrl });

export const getSalaryStrategy = (details: any): Promise<string> =>
    apiClient.post('/generate/salary-strategy', { details });

export const generateResumeContent = (rawExperience: string, jobDescription?: string): Promise<string> =>
    apiClient.post('/generate/resume-content', { rawExperience, jobDescription });

export const generateInterviewReport = (transcript: string): Promise<InterviewFeedback> =>
    apiClient.post('/generate/interview-report', { transcript });

export const generateInterviewTurn = async (payload: {
    jdText: string;
    transcript: TranscriptMessage[];
    interviewStyle: string;
    skillsToPractice: string;
}): Promise<string> => {
    const response = await apiClient.post('/generate/interview-turn', payload);
    return response.text;
};

export const getLearningPath = (resumeText: string, targetRole: string): Promise<LearningPathResult> =>
    apiClient.post('/generate/learning-path', { resumeText, targetRole });