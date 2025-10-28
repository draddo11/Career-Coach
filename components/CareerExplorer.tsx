import React, { useState } from 'react';
import type { AlternateJob } from '../types';
import { analyzeResumeForCareerPaths } from '../services/geminiService';
import Card from './common/Card';
import Loader from './common/Loader';

const CareerExplorer: React.FC = () => {
  const [resumeText, setResumeText] = useState('');
  const [alternateJobs, setAlternateJobs] = useState<AlternateJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!resumeText.trim()) {
      setError('Please paste your resume text first.');
      return;
    }
    setError(null);
    setIsLoading(true);
    setAlternateJobs([]);
    try {
      const result = await analyzeResumeForCareerPaths(resumeText);
      setAlternateJobs(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const hasResults = alternateJobs.length > 0;

  return (
    <div className="space-y-8">
      <Card>
        <h2 className="text-2xl font-bold mb-2 text-slate-100">Career Path Explorer</h2>
        <p className="text-slate-400 mb-6">Paste your resume or CV below to discover related job titles and alternative career paths you might be a good fit for.</p>
        <textarea
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          placeholder="Paste your full resume text here..."
          className="w-full h-48 p-4 bg-[#1F1F1F] border border-white/10 rounded-xl focus:ring-2 focus:ring-[#A8C7FA] focus:outline-none transition-all duration-200 resize-none"
          rows={10}
        />
        <button
          onClick={handleAnalyze}
          disabled={isLoading}
          className="mt-4 w-full bg-[#A8C7FA] text-[#1F1F1F] font-bold py-3 px-4 rounded-full hover:bg-opacity-90 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isLoading ? 'Exploring...' : 'Find Career Paths'}
        </button>
        {error && <p className="mt-4 text-red-400 text-center">{error}</p>}
      </Card>
      
      {isLoading && <Loader message="Discovering new horizons..." />}

      {hasResults && (
        <Card>
            <h3 className="text-xl font-bold mb-4 text-slate-200">Suggested Career Paths</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alternateJobs.map((job, index) => (
                <div key={index} className="bg-[#2D2D2D]/60 p-4 rounded-2xl border border-white/10 flex flex-col justify-between transition-all duration-300 hover:bg-[#2D2D2D] hover:border-white/20">
                    <div>
                        <h4 className="text-lg font-bold text-[#A8C7FA]">{job.jobTitle}</h4>
                        <div className="my-3">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm text-slate-400 font-medium">Skill Match</span>
                                <span className="text-sm font-bold text-green-300">{job.skillMatchPercentage}%</span>
                            </div>
                            <div className="w-full bg-slate-600 rounded-full h-2.5">
                                <div className="bg-green-400 h-2.5 rounded-full" style={{ width: `${job.skillMatchPercentage}%` }}></div>
                            </div>
                        </div>
                    </div>
                    {job.pathSummary && (
                        <p className="text-sm text-slate-300 mt-2"><strong className="text-slate-200 font-medium">Path Summary:</strong> {job.pathSummary}</p>
                    )}
                </div>
            ))}
            </div>
        </Card>
      )}
    </div>
  );
};

export default CareerExplorer;