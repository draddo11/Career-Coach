import React, { useState } from 'react';
import type { AnalysisResult } from '../types';
import { analyzeJobMatch } from '../services/geminiService';
import Card from './common/Card';
import Loader from './common/Loader';
import { Document, Packer, Paragraph, HeadingLevel } from 'docx';
import ResumeInput from './common/ResumeInput';
import MarkdownRenderer from './common/MarkdownRenderer';
import JdInput from './common/JdInput';

const JobAnalyzer: React.FC = () => {
  const [resumeText, setResumeText] = useState('');
  const [jdText, setJdText] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleAnalyze = async () => {
    if (!resumeText.trim() || !jdText.trim()) {
      setError('Please provide both your resume and the job description.');
      return;
    }
    setError(null);
    setIsLoading(true);
    setAnalysisResult(null);
    try {
      const result = await analyzeJobMatch(resumeText, jdText);
      setAnalysisResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!analysisResult) return;

    const formatMarkdownToDocx = (markdown: string) => {
        return markdown.split('\n').filter(line => line.trim() !== '').map(line => {
            const text = line.replace(/^\s*[-*]\s*/, '');
            return new Paragraph({
                text: text,
                bullet: { level: 0 },
            });
        });
    }

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ text: 'AI Career Copilot - Job Application Materials', heading: HeadingLevel.TITLE }),
          new Paragraph({ text: `Job Match Score: ${analysisResult.matchScore}/100`, heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ text: 'Recommended Resume Changes', heading: HeadingLevel.HEADING_1 }),
          ...formatMarkdownToDocx(analysisResult.requiredChanges),
          new Paragraph({ text: 'Generated Cover Letter', heading: HeadingLevel.HEADING_1 }),
          ...analysisResult.coverLetter.split('\n').map(p => new Paragraph(p)),
        ],
      }],
    });

    Packer.toBlob(doc).then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Job_Application_Materials.docx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    });
  };

  const hasResults = analysisResult !== null;

  return (
    <div className="space-y-8">
      <Card>
        <h2 className="text-2xl font-bold mb-2 text-slate-100">Job Description Analyzer</h2>
        <p className="text-slate-400 mb-6">Get an edge in your job search. This tool analyzes your resume against a job description to give you a match score, actionable feedback, and a tailored cover letter.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-semibold text-slate-300 text-center">Your Resume</h3>
            <ResumeInput value={resumeText} onChange={setResumeText} disabled={isLoading} className="flex-grow" />
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-semibold text-slate-300 text-center">Job Description</h3>
            <JdInput value={jdText} onChange={setJdText} disabled={isLoading} className="flex-grow" />
          </div>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={isLoading || !resumeText.trim() || !jdText.trim()}
          className="mt-6 w-full bg-[#A8C7FA] text-[#1F1F1F] font-bold py-3 px-4 rounded-full hover:bg-opacity-90 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isLoading ? 'Analyzing with Thinking Mode...' : 'Analyze Match'}
        </button>
        {error && <p className="mt-4 text-red-400 text-center">{error}</p>}
      </Card>

      {isLoading && <Loader message="Performing deep analysis..." />}

      {hasResults && (
        <Card>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
            <h3 className="text-xl font-bold text-slate-200">Analysis Results</h3>
            <button
                onClick={handleDownload}
                className="bg-green-600/20 border border-green-400 text-green-300 font-bold py-2 px-5 rounded-full hover:bg-green-600/40 transition-colors"
            >
                Download as DOCX
            </button>
          </div>
          <div className="text-center mb-8">
            <p className="text-lg text-slate-400 font-medium">Job Match Score</p>
            <p className="text-7xl font-black text-green-400">{analysisResult.matchScore}<span className="text-3xl font-bold text-green-400/80">%</span></p>
          </div>
          <div className="space-y-8">
            <div>
              <h4 className="text-lg font-bold text-[#A8C7FA] mb-3">Recommended Resume Changes</h4>
              <div className="bg-[#2D2D2D]/60 p-4 rounded-2xl border border-white/10">
                <MarkdownRenderer content={analysisResult.requiredChanges} />
              </div>
            </div>
            <div>
              <h4 className="text-lg font-bold text-[#A8C7FA] mb-3">Generated Cover Letter</h4>
              <div className="bg-[#2D2D2D]/60 p-4 rounded-2xl border border-white/10 whitespace-pre-wrap font-mono text-sm text-slate-300 leading-relaxed">{analysisResult.coverLetter}</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default JobAnalyzer;