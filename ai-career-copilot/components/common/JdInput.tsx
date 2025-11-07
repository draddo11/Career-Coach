
import React, { useState } from 'react';
import { getJdFromUrl } from '../../services/appService';
import { LinkIcon } from './Icons';

interface JdInputProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    className?: string;
}

const JdInput: React.FC<JdInputProps> = ({ value, onChange, disabled, className = '' }) => {
    const [jobUrl, setJobUrl] = useState('');
    const [isFetching, setIsFetching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFetchJd = async () => {
        if (!jobUrl.trim()) {
            setError('Please enter a valid URL.');
            return;
        }
        try {
            new URL(jobUrl);
        } catch (_) {
            setError('Please enter a valid URL.');
            return;
        }

        setError(null);
        setIsFetching(true);
        try {
            const fetchedJd = await getJdFromUrl(jobUrl);
            onChange(fetchedJd);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch job description from the link.');
        } finally {
            setIsFetching(false);
        }
    };

    const isDisabled = disabled || isFetching;

    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            <div className="flex items-center gap-2">
                <input
                    type="url"
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    placeholder="Paste job link..."
                    className="w-full flex-grow p-3 bg-[#1F1F1F] border border-white/10 rounded-xl focus:ring-2 focus:ring-[#A8C7FA] focus:outline-none transition-all text-sm"
                    disabled={isDisabled}
                    aria-label="Job post URL"
                />
                <button
                    onClick={handleFetchJd}
                    disabled={isDisabled || !jobUrl.trim()}
                    className="flex items-center justify-center gap-2 bg-white/10 text-white font-semibold py-3 px-4 rounded-xl hover:bg-white/20 disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors shrink-0"
                    aria-live="polite"
                >
                    {isFetching ? (
                        <>
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Fetching...</span>
                        </>
                    ) : (
                        <>
                            <LinkIcon />
                            <span>Fetch</span>
                        </>
                    )}
                </button>
            </div>
            {error && <p className="text-red-400 text-center text-sm mt-1">{error}</p>}
            <div className="relative flex items-center my-2">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink mx-4 text-slate-500 text-xs">OR</span>
                <div className="flex-grow border-t border-white/10"></div>
            </div>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Paste the job description text here, or use the link fetcher above."
                className="w-full flex-grow p-4 bg-[#2D2D2D]/60 border border-white/10 rounded-xl focus:ring-2 focus:ring-[#A8C7FA] focus:outline-none transition-all resize-none"
                rows={10}
                disabled={isDisabled}
            />
        </div>
    );
};

export default JdInput;