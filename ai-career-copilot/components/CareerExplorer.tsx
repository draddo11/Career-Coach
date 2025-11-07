
import React, { useState } from 'react';
import type { AlternateJob } from '../types';
import { analyzeResumeForCareerPaths } from '../services/appService';
import Card from './common/Card';
import Loader from './common/Loader';
import { Document, Packer, Paragraph, HeadingLevel } from 'docx';
import AddResumeCTA from './common/AddResumeCTA';
import type { Feature } from '../App';

interface CareerExplorerProps {
  resumeText: string;
  setActiveFeature: (feature: Feature) => void;
}

const CareerExplorer: React.FC<CareerExplorerProps> = ({ resumeText, setActiveFeature }) => {
  const [alternateJobs, setAlternateJobs] = useState<AlternateJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!resumeText.trim()) {
      setError('Please provide your resume first.');
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
  
  const handleDownload = () => {
    if (alternateJobs.length === 0) return;

    const children = alternateJobs.flatMap(job => {
        const jobElements = [
            new Paragraph({ text: job.jobTitle, heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 200 } }),
            new Paragraph({ text: `Skill Match: ${job.skillMatchPercentage}%` }),
        ];
        if (job.pathSummary) {
            jobElements.push(new Paragraph({ text: 'Path Summary:', spacing: { before: 200, after: 100 } }));
            jobElements.push(new Paragraph({ text: job.pathSummary }));
        }
        return jobElements;
    });

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ text: 'AI Career Copilot - Career Path Suggestions', heading: HeadingLevel.TITLE }),
          ...children,
        ],
      }],
    });

    Packer.toBlob(doc).then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Career_Path_Suggestions.docx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    });
  };

  const hasResults = alternateJobs.length > 0;
  const hasResume = resumeText.trim().length > 0;

  return (
    <div className="space-y-8">
      <Card>
        <h2 className="text-2xl font-bold mb-2 text-slate-100">Career Path Explorer</h2>
        <p className="text-slate-400 mb-6">Discover related job titles and alternative career paths you might be a good fit for based on your saved resume.</p>
        
        {!hasResume ? (
          <AddResumeCTA setActiveFeature={setActiveFeature} />
        ) : (
          <button
            onClick={handleAnalyze}
            disabled={isLoading || !resumeText.trim()}
            className="w-full bg-[#A8C7FA] text-[#1F1F1F] font-bold py-3 px-4 rounded-full hover:bg-opacity-90 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? 'Exploring...' : 'Find Career Paths From My Resume'}
          </button>
        )}

        {error && <p className="mt-4 text-red-400 text-center">{error}</p>}
      </Card>
      
      {isLoading && <Loader message="Discovering new horizons..." />}

      {hasResults && (
        <Card>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
              <h3 className="text-xl font-bold text-slate-200">Suggested Career Paths</h3>
              <button
                  onClick={handleDownload}
                  className="bg-green-600/20 border border-green-400 text-green-300 font-bold py-2 px-5 rounded-full hover:bg-green-600/40 transition-colors"
              >
                  Download as DOCX
              </button>
            </div>
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