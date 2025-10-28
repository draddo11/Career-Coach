import React, { useState } from 'react';
import CareerExplorer from './components/CareerExplorer';
import JobAnalyzer from './components/JobAnalyzer';
import InterviewPrep from './components/InterviewPrep';
import { BriefcaseIcon, ChatBubbleIcon, TelescopeIcon } from './components/common/Icons';

type Feature = 'explorer' | 'analyzer' | 'interview';

const App: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<Feature>('explorer');

  const renderFeature = () => {
    switch (activeFeature) {
      case 'explorer':
        return <CareerExplorer />;
      case 'analyzer':
        return <JobAnalyzer />;
      case 'interview':
        return <InterviewPrep />;
      default:
        return <CareerExplorer />;
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
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-slate-100 tracking-tight">
            AI Career Copilot
          </h1>
          <p className="text-slate-400 mt-3 text-lg">Your intelligent partner in navigating the job market.</p>
        </header>

        <nav className="flex justify-center mb-10">
          <div className="flex w-full sm:w-auto space-x-2 bg-[#2D2D2D] p-1.5 rounded-full border border-white/10">
            <NavButton feature="explorer" label="Career Explorer" icon={<TelescopeIcon />} />
            <NavButton feature="analyzer" label="Job Analyzer" icon={<BriefcaseIcon />} />
            <NavButton feature="interview" label="Interview Prep" icon={<ChatBubbleIcon />} />
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