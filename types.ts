

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