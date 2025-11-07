

// This file can be shared between frontend and backend in a monorepo

export interface AlternateJob {
  jobTitle: string;
  skillMatchPercentage: number;
  pathSummary: string;
}

export interface AnalysisResult {
  matchScore: number;
  requiredChanges: string; // Markdown string
  coverLetter: string;
}

export interface AnswerBreakdown {
  question: string;
  userAnswer: string;
  situationFeedback: string;
  taskFeedback: string;
  actionFeedback: string;
  resultFeedback: string;
}

export interface SuggestedImprovement {
  originalAnswer: string;
  improvedAnswer: string;
  reasoning: string;
}

export interface InterviewFeedback {
  finalScore: number;
  overallFeedback: string; // Markdown string
  answerBreakdowns: AnswerBreakdown[];
  suggestedImprovements: SuggestedImprovement[];
}


export interface TranscriptMessage {
  speaker: 'user' | 'model';
  text: string;
}

// --- NEW: Types for Learning Pathfinder ---
export interface LearningResource {
  skill: string;
  resourceType: 'Online Course' | 'Article' | 'Video Tutorial' | 'Official Documentation' | 'Book' | 'Project Idea';
  title: string;
  description: string;
  url: string;
}

export interface LearningPathResult {
  targetRole: string;
  skillGaps: string[];
  learningResources: LearningResource[];
}