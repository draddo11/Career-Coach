
import React from 'react';
import type { Feature } from '../../App';

interface AddResumeCTAProps {
  setActiveFeature: (feature: Feature) => void;
  className?: string;
}

const AddResumeCTA: React.FC<AddResumeCTAProps> = ({ setActiveFeature, className = '' }) => {
  return (
    <div className={`text-center p-6 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center h-full ${className}`}>
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m-1.5 9v-2.625c0-.621.504-1.125 1.125-1.125h1.5a1.125 1.125 0 011.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125h-1.5a3.375 3.375 0 00-3.375 3.375v2.25" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 14.25v2.25a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 16.5v-2.25" />
      </svg>
      <h3 className="text-lg font-bold text-slate-200">No Resume Found</h3>
      <p className="text-slate-400 mt-2 mb-4 max-w-sm">To use this feature, you first need to add your resume.</p>
      <button
        onClick={() => setActiveFeature('resume')}
        className="bg-[#A8C7FA] text-[#1F1F1F] font-bold py-2.5 px-6 rounded-full hover:bg-opacity-90 transition-all"
      >
        Add Resume
      </button>
    </div>
  );
};

export default AddResumeCTA;