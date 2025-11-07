
import React, { useState } from 'react';
import type { LearningPathResult, LearningResource } from '../types';
import { getLearningPath } from '../services/appService';
import Card from './common/Card';
import Loader from './common/Loader';
import AddResumeCTA from './common/AddResumeCTA';
import type { Feature } from '../App';
import { LinkIcon, MapIcon } from './common/Icons';

interface LearningPathfinderProps {
  resumeText: string;
  setActiveFeature: (feature: Feature) => void;
}

const LearningPathfinder: React.FC<LearningPathfinderProps> = ({ resumeText, setActiveFeature }) => {
  const [targetRole, setTargetRole] = useState('');
  const [learningPath, setLearningPath] = useState<LearningPathResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!resumeText.trim()) {
      setError('Please provide your resume first.');
      return;
    }
    if (!targetRole.trim()) {
      setError('Please provide a target job title or description.');
      return;
    }
    setError(null);
    setIsLoading(true);
    setLearningPath(null);
    try {
      const result = await getLearningPath(resumeText, targetRole);
      setLearningPath(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const hasResults = learningPath !== null;
  const hasResume = resumeText.trim().length > 0;
  
  const ResourceCard: React.FC<{ resource: LearningResource }> = ({ resource }) => (
    <div className="bg-[#2D2D2D]/60 p-4 rounded-2xl border border-white/10 flex flex-col justify-between transition-all duration-300 hover:bg-[#2D2D2D] hover:border-white/20">
      <div>
        <span className="text-xs font-bold uppercase text-purple-300 bg-purple-900/50 px-2 py-1 rounded-full">{resource.resourceType.replace(/_/g, ' ')}</span>
        <h4 className="text-lg font-bold text-[#A8C7FA] mt-3">{resource.title}</h4>
        <p className="text-sm text-slate-400 mt-1 mb-3">Targets Skill: <strong className="text-slate-300">{resource.skill}</strong></p>
        <p className="text-sm text-slate-300">{resource.description}</p>
      </div>
      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-green-300 hover:text-green-200"
      >
        Go to Resource <LinkIcon />
      </a>
    </div>
  );

  return (
    <div className="space-y-8">
      <Card>
        <h2 className="text-2xl font-bold mb-2 text-slate-100">Learning Pathfinder</h2>
        <p className="text-slate-400 mb-6">Chart a course to your dream job. Enter a target role, and the AI will analyze your resume to create a personalized learning plan with curated resources.</p>
        
        {!hasResume ? (
          <AddResumeCTA setActiveFeature={setActiveFeature} />
        ) : (
          <div className="space-y-4">
             <div>
                <label htmlFor="target-role" className="block text-sm font-medium text-slate-400 mb-1">Target Job Title or Description</label>
                <textarea
                    id="target-role"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g., 'Senior Cloud Engineer' or paste a full job description here..."
                    className="w-full p-3 bg-[#1F1F1F] border border-white/10 rounded-lg focus:ring-2 focus:ring-[#A8C7FA] focus:outline-none transition-all resize-none"
                    rows={4}
                    disabled={isLoading}
                />
            </div>
            <button
              onClick={handleAnalyze}
              disabled={isLoading || !resumeText.trim() || !targetRole.trim()}
              className="w-full flex items-center justify-center gap-3 bg-[#A8C7FA] text-[#1F1F1F] font-bold py-3 px-4 rounded-full hover:bg-opacity-90 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? 'Generating Plan...' : 'Generate Learning Plan'}
            </button>
          </div>
        )}

        {error && <p className="mt-4 text-red-400 text-center">{error}</p>}
      </Card>
      
      {isLoading && <Loader message="Analyzing skill gaps & finding resources..." />}

      {hasResults && (
        <Card>
            <div className="text-center mb-8">
                <MapIcon />
                <h3 className="text-xl font-bold text-slate-200 mt-2">Your Learning Path to <span className="text-green-300">{learningPath.targetRole}</span></h3>
            </div>
            
            <div className="space-y-8">
                <div>
                    <h4 className="text-lg font-bold text-[#A8C7FA] mb-3">Identified Skill Gaps</h4>
                    <div className="flex flex-wrap gap-2">
                        {learningPath.skillGaps.map((skill, index) => (
                            <span key={index} className="bg-red-900/50 text-red-300 text-sm font-medium px-3 py-1.5 rounded-full border border-red-500/30">
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>

                <div>
                    <h4 className="text-lg font-bold text-[#A8C7FA] mb-3">Recommended Learning Resources</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {learningPath.learningResources.map((resource, index) => (
                            <ResourceCard key={index} resource={resource} />
                        ))}
                    </div>
                </div>
            </div>
        </Card>
      )}
    </div>
  );
};

export default LearningPathfinder;