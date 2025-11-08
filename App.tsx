
import React, { useState, useEffect } from 'react';
import CareerExplorer from './components/CareerExplorer';
import JobAnalyzer from './components/JobAnalyzer';
import InterviewPrep from './components/InterviewPrep';
import SalaryStrategist from './components/SalaryStrategist';
import ResumeStudio from './components/ResumeStudio';
import ResumeManager from './components/ResumeManager';
import LearningPathfinder from './components/LearningPathfinder';
import { BriefcaseIcon, ChatBubbleIcon, TelescopeIcon, DollarIcon, DocumentIcon, FileTextIcon, MapIcon } from './components/common/Icons';

export type Feature = 'resume' | 'explorer' | 'analyzer' | 'interview' | 'strategist' | 'studio' | 'pathfinder';

const App: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<Feature>('resume');
  const [resumeText, setResumeText] = useState<string>('');

  const handleSaveResume = async (newResumeText: string) => {
    setResumeText(newResumeText);
    return true; // Indicate success for the component
  };

  const renderFeature = () => {
    switch (activeFeature) {
      case 'resume':
        return <ResumeManager currentResume={resumeText} onSave={handleSaveResume} />;
      case 'explorer':
        return <CareerExplorer resumeText={resumeText} setActiveFeature={setActiveFeature} />;
      case 'analyzer':
        return <JobAnalyzer resumeText={resumeText} setActiveFeature={setActiveFeature} />;
      case 'studio':
        return <ResumeStudio />;
      case 'pathfinder':
        return <LearningPathfinder resumeText={resumeText} setActiveFeature={setActiveFeature} />;
      case 'interview':
        return <InterviewPrep />;
      case 'strategist':
        return <SalaryStrategist />;
      default:
        return <ResumeManager currentResume={resumeText} onSave={handleSaveResume} />;
    }
  };

  const NavButton = ({ feature, label, icon }: { feature: Feature; label: string; icon: React.ReactNode }) => (
    <button
      onClick={() => setActiveFeature(feature)}
      className={`flex items-center justify-center flex-1 sm:flex-initial sm:justify-start gap-3 px-5 py-3 text-sm font-medium rounded-full transition-all duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#2D2D2D] focus-visible:ring-[#A8C7FA] ${
        activeFeature === feature
          ? 'bg-[#A8C7FA] text-[#1F1F1F]'
          : 'text-[#E3E3E3] hover:bg-white/10'
      }`}
      aria-current={activeFeature === feature ? 'page' : undefined}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#141414] text-[#E3E3E3] font-sans">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-slate-100 tracking-tight">
            AI Career Copilot
          </h1>
          <p className="text-slate-400 mt-3 text-lg">Your intelligent partner in navigating the job market.</p>
        </header>

        <nav className="flex justify-center mb-10">
          <div className="flex w-full sm:w-auto flex-wrap justify-center gap-1 bg-[#2D2D2D] p-1.5 rounded-full border border-white/10">
            <NavButton feature="resume" label="My Resume" icon={<FileTextIcon />} />
            <NavButton feature="explorer" label="Career Explorer" icon={<TelescopeIcon />} />
            <NavButton feature="analyzer" label="Job Analyzer" icon={<BriefcaseIcon />} />
            <NavButton feature="studio" label="Resume Studio" icon={<DocumentIcon />} />
            <NavButton feature="pathfinder" label="Learning Path" icon={<MapIcon />} />
            <NavButton feature="interview" label="Interview Prep" icon={<ChatBubbleIcon />} />
            <NavButton feature="strategist" label="Salary Strategist" icon={<DollarIcon />} />
          </div>
        </nav>
        
        <main>
          {renderFeature()}
        </main>
      </div>
    </div>
  );
};

export default App;
