import React, { useState } from 'react';
import { getSalaryStrategy } from '../services/geminiService';
import Card from './common/Card';
import Loader from './common/Loader';
import MarkdownRenderer from './common/MarkdownRenderer';

const InputField: React.FC<{ 
  label: string; 
  value: string | number; 
  onChange: (val: string) => void; 
  placeholder: string; 
  type?: string; 
  required?: boolean; 
  disabled?: boolean;
}> = ({ label, value, onChange, placeholder, type = 'text', required = false, disabled = false }) => (
  <div>
      <label className="block text-sm font-medium text-slate-400 mb-1">
          {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full p-3 bg-[#1F1F1F] border border-white/10 rounded-lg focus:ring-2 focus:ring-[#A8C7FA] focus:outline-none transition-all"
          disabled={disabled}
      />
  </div>
);

const SalaryStrategist: React.FC = () => {
  const [jobTitle, setJobTitle] = useState('');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [salaryOffer, setSalaryOffer] = useState('');
  
  const [strategyResult, setStrategyResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const isFormValid = jobTitle.trim() && industry.trim() && location.trim() && yearsOfExperience.trim() !== '';

  const handleGenerate = async () => {
    if (!isFormValid) {
      setError('Please fill in all required fields.');
      return;
    }
    setError(null);
    setIsLoading(true);
    setStrategyResult(null);
    try {
      const result = await getSalaryStrategy({
        jobTitle,
        industry,
        location,
        yearsOfExperience: Number(yearsOfExperience),
        salaryOffer: salaryOffer ? Number(salaryOffer) : undefined,
      });
      setStrategyResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <h2 className="text-2xl font-bold mb-2 text-slate-100">Salary Strategist</h2>
        <p className="text-slate-400 mb-6">Empower your salary negotiation. Provide job details, and the AI will research market rates and generate a data-driven negotiation plan for you.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <InputField label="Job Title" value={jobTitle} onChange={setJobTitle} placeholder="e.g., Senior Software Engineer" required disabled={isLoading} />
            <InputField label="Industry" value={industry} onChange={setIndustry} placeholder="e.g., Tech / SaaS" required disabled={isLoading} />
            <InputField label="Location" value={location} onChange={setLocation} placeholder="e.g., San Francisco, CA" required disabled={isLoading} />
            <InputField label="Years of Experience" value={yearsOfExperience} onChange={setYearsOfExperience} placeholder="e.g., 5" type="number" required disabled={isLoading} />
            <InputField label="Current Salary Offer (USD)" value={salaryOffer} onChange={setSalaryOffer} placeholder="e.g., 120000 (Optional)" type="number" disabled={isLoading} />
        </div>

        <button
          onClick={handleGenerate}
          disabled={isLoading || !isFormValid}
          className="mt-6 w-full bg-[#A8C7FA] text-[#1F1F1F] font-bold py-3 px-4 rounded-full hover:bg-opacity-90 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isLoading ? 'Researching & Strategizing...' : 'Generate Negotiation Strategy'}
        </button>
        {error && <p className="mt-4 text-red-400 text-center">{error}</p>}
      </Card>
      
      {isLoading && <Loader message="Analyzing market data..." />}

      {strategyResult && (
        <Card>
            <h3 className="text-xl font-bold text-slate-200 mb-6">Your Negotiation Strategy</h3>
            <div className="bg-[#2D2D2D]/60 p-6 rounded-2xl border border-white/10">
                <MarkdownRenderer content={strategyResult} />
            </div>
        </Card>
      )}
    </div>
  );
};

export default SalaryStrategist;