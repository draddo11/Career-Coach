
import React, { useState, useEffect } from 'react';
import Card from './common/Card';
import ResumeInput from './common/ResumeInput';

interface ResumeManagerProps {
  currentResume: string;
  onSave: (resumeText: string) => Promise<boolean>;
}

const ResumeManager: React.FC<ResumeManagerProps> = ({ currentResume, onSave }) => {
  const [editText, setEditText] = useState(currentResume);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  useEffect(() => {
    setEditText(currentResume);
  }, [currentResume]);

  const handleSave = async () => {
    setSaveStatus('saving');
    const success = await onSave(editText);
    if (success) {
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } else {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 4000);
    }
  };

  const hasResume = currentResume.trim().length > 0;
  const hasChanges = editText.trim() !== currentResume.trim();
  const isSaving = saveStatus === 'saving';

  const getButtonText = () => {
    if (isSaving) return 'Saving...';
    if (saveStatus === 'success') return 'Saved!';
    return hasResume ? 'Update Resume' : 'Save Resume';
  };

  return (
    <div className="space-y-8">
      <Card>
        <h2 className="text-2xl font-bold mb-2 text-slate-100">My Resume</h2>
        <p className="text-slate-400 mb-6">
          {hasResume
            ? "Your resume is stored for this session. You can update it below."
            : "Add your resume here. It will be used across all features for your current session."}
        </p>
        
        <ResumeInput value={editText} onChange={setEditText} disabled={isSaving} />
        
        <div className="mt-4 flex justify-end items-center gap-4">
            {saveStatus === 'error' && <p className="text-red-400 font-medium transition-opacity duration-300">Could not save resume.</p>}
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className={`font-bold py-3 px-6 rounded-full transition-all duration-200 ${
                saveStatus === 'success' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-[#A8C7FA] text-[#1F1F1F] hover:bg-opacity-90'
              } disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed`}
            >
              {getButtonText()}
            </button>
        </div>
      </Card>
    </div>
  );
};

export default ResumeManager;