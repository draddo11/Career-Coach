
import React, { useState, useEffect } from 'react';
import CareerExplorer from './components/CareerExplorer';
import JobAnalyzer from './components/JobAnalyzer';
import InterviewPrep from './components/InterviewPrep';
import SalaryStrategist from './components/SalaryStrategist';
import ResumeStudio from './components/ResumeStudio';
import ResumeManager from './components/ResumeManager';
import LearningPathfinder from './components/LearningPathfinder';
import { BriefcaseIcon, ChatBubbleIcon, TelescopeIcon, DollarIcon, DocumentIcon, FileTextIcon, MapIcon } from './components/common/Icons';
import { checkBackendHealth } from './services/appService';
import Alert from './components/common/Alert';
import Loader from './components/common/Loader';

export type Feature = 'resume' | 'explorer' | 'analyzer' | 'interview' | 'strategist' | 'studio' | 'pathfinder';
type BackendStatusState = 'checking' | 'ok' | 'error';

const App: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<Feature>('resume');
  const [resumeText, setResumeText] = useState<string>('');
  const [backendStatus, setBackendStatus] = useState<BackendStatusState>('checking');
  const [errorDetails, setErrorDetails] = useState('');

  useEffect(() => {
    const verifyBackendConnection = async () => {
      try {
        await checkBackendHealth();
        setBackendStatus('ok');
      } catch (error) {
        setBackendStatus('error');
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        
        const details = `Failed to connect to the backend service. This is a common issue after deploying to a new project. Let's debug it step-by-step.\n\n**Error:** ${errorMessage}

---

### **Troubleshooting Action Plan**

**Step 1: Check the Cloud Run Logs**
This is the most important step to locate the problem.

1.  Open the Google Cloud Console for your project (\`resumehacathon\`).
2.  Navigate to **Cloud Run** and click on the \`ai-career-copilot-backend\` service.
3.  Go to the **"LOGS"** tab.
4.  Refresh this web page to trigger another connection attempt.

*   **Do you see a new log entry that says \`[Server] Incoming request: GET /api/health\`?**
    *   **YES:** Great! The connection is working. The service is likely crashing. Look for red error messages in the logs immediately after the "Incoming request" line. A common cause is a missing \`API_KEY\` secret in Secret Manager.
    *   **NO:** The request from the frontend is not reaching your backend. This points to a routing or permissions issue. Please proceed to Step 2.

**Step 2: Check Permissions & Routing**
If you saw no logs in Step 1, the issue is likely here.

*   **The Easiest Fix:** Open your terminal in the project folder and run \`firebase deploy --only hosting\`. The Firebase CLI is smart and will often ask to add the required "Cloud Run Invoker" permission. Say **yes** if prompted.
*   **Manual Check:** Make sure your \`firebase.json\` file has the correct \`serviceId\` ("ai-career-copilot-backend") and \`region\` ("us-central1").

If you've tried these steps and are still stuck, review the service status on the Cloud Run main page to ensure it's not reporting any deployment errors.`;

        setErrorDetails(details);
        console.error("Backend health check failed:", error);
      }
    };
    // Give a brief moment for initial render to avoid flash of content
    const timer = setTimeout(verifyBackendConnection, 250);
    return () => clearTimeout(timer);
  }, []);


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
  
  if (backendStatus === 'checking') {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <Loader message="Connecting to AI Copilot server..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-[#E3E3E3] font-sans">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-slate-100 tracking-tight">
            AI Career Copilot
          </h1>
          <p className="text-slate-400 mt-3 text-lg">Your intelligent partner in navigating the job market.</p>
        </header>

        {backendStatus === 'error' && (
           <div className="mb-8">
             <Alert
                type="error"
                title="Backend Connection Error"
                message={errorDetails}
              />
           </div>
        )}
        
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
        
        <main className={backendStatus === 'error' ? 'opacity-60 pointer-events-none' : ''}>
          {renderFeature()}
        </main>
      </div>
    </div>
  );
};

export default App;