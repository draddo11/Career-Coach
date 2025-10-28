
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

export interface InterviewFeedback {
  finalScore: number;
  feedback: string; // Markdown string
}

export interface TranscriptMessage {
  speaker: 'user' | 'model';
  text: string;
}
