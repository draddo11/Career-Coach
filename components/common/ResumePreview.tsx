
import React from 'react';
import type { Feature } from '../../App';

interface ResumePreviewProps {
  resumeText: string;
  setActiveFeature: (feature: Feature) => void;
  className?: string;
}

const ResumePreview: React.FC<ResumePreviewProps> = ({ resumeText, setActiveFeature, className = '' }) => {
  return (
    <div className={`flex flex-col gap-2 h-full ${className}`}>
        <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-300 text-center">Your Saved Resume</h3>
             <button 
                onClick={() => setActiveFeature('resume')}
                className="text-sm font-medium text-[#A8C7FA] hover:underline"
            >
                Change
            </button>
        </div>
        <textarea
            value={resumeText}
            readOnly
            className="w-full flex-grow p-4 bg-[#2D2D2D]/60 border border-white/10 rounded-xl focus:outline-none resize-none"
            rows={10}
        />
    </div>
  );
};

export default ResumePreview;