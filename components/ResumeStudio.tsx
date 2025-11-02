import React, { useState } from 'react';
import { generateResumeContent } from '../services/geminiService';
import Card from './common/Card';
import Loader from './common/Loader';
import MarkdownRenderer from './common/MarkdownRenderer';
import JdInput from './common/JdInput';
import { ClipboardIcon, CheckIcon } from './common/Icons';

const ResumeStudio: React.FC = () => {
    const [jdText, setJdText] = useState('');
    const [rawExperience, setRawExperience] = useState('');
    const [generatedContent, setGeneratedContent] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);

    const handleGenerate = async () => {
        if (!rawExperience.trim()) {
            setError('Please provide your experience notes first.');
            return;
        }
        setError(null);
        setIsLoading(true);
        setGeneratedContent(null);
        try {
            const result = await generateResumeContent(rawExperience, jdText.trim() ? jdText : undefined);
            setGeneratedContent(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (!generatedContent) return;

        // Convert markdown to plain text for clipboard
        const plainText = generatedContent
            .replace(/^##\s*(.*)/gm, '$1')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/^- \s*/gm, '• ')
            .replace(/^\* \s*/gm, '• ');

        navigator.clipboard.writeText(plainText).then(() => {
            setIsCopied(true);
            setTimeout(() => {
                setIsCopied(false);
            }, 2000);
        }).catch(err => {
            console.error("Failed to copy text: ", err);
        });
    };

    return (
        <div className="space-y-8">
            <Card>
                <h2 className="text-2xl font-bold mb-2 text-slate-100">Resume Studio</h2>
                <p className="text-slate-400 mb-6">Transform your raw experience into polished, professional resume bullets. Provide a target job description to tailor your content for any role.</p>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6 items-stretch">
                    {/* Left side: inputs */}
                    <div className="space-y-6 flex flex-col">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-300">Target Job Description (Optional)</h3>
                            <p className="text-sm text-slate-400 mb-3">Provide a JD to tailor your resume with the right keywords.</p>
                            <JdInput value={jdText} onChange={setJdText} disabled={isLoading} />
                        </div>
                        <div className="bg-[#2D2D2D]/60 border border-white/10 rounded-xl p-4 space-y-3 flex flex-col flex-grow">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-300">Your Raw Experience Notes</h3>
                                <p className="text-sm text-slate-400">Jot down your accomplishments for one role. The AI will polish them.</p>
                            </div>
                            <div className="relative flex-grow">
                                <textarea
                                    value={rawExperience}
                                    onChange={(e) => setRawExperience(e.target.value)}
                                    placeholder="e.g., Led team of 5. Built new checkout flow. Increased conversion 15%."
                                    className="w-full h-full p-4 bg-[#1F1F1F] border border-white/10 rounded-xl focus:ring-2 focus:ring-[#A8C7FA] focus:outline-none transition-all resize-none min-h-[150px]"
                                    maxLength={2000}
                                    disabled={isLoading}
                                    aria-describedby="experience-char-count"
                                />
                                <p id="experience-char-count" className="absolute bottom-2 right-3 text-xs font-mono text-slate-500 pointer-events-none">
                                    {rawExperience.length} / 2000
                                </p>
                            </div>
                        </div>
                    </div>
                    {/* Right side: results */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-start">
                             <div>
                                <h3 className="text-lg font-semibold text-slate-300">AI-Generated Resume Bullets</h3>
                                <p className="text-sm text-slate-400 mt-1">Copy these STAR-method bullets into your resume.</p>
                            </div>
                            <button
                                onClick={handleCopy}
                                disabled={!generatedContent || isLoading || isCopied}
                                className={`flex items-center gap-2 py-2 px-4 rounded-full text-sm font-semibold transition-all duration-200 shrink-0 ${
                                    isCopied
                                        ? 'bg-green-600/20 text-green-300'
                                        : 'bg-white/10 text-white hover:bg-white/20 disabled:bg-slate-700/50 disabled:text-slate-500 disabled:cursor-not-allowed'
                                }`}
                                aria-label="Copy resume content to clipboard"
                            >
                                {isCopied ? <CheckIcon /> : <ClipboardIcon />}
                                {isCopied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>

                        <div className="relative bg-[#2D2D2D]/60 border border-white/10 rounded-xl p-4 min-h-[300px] lg:min-h-[560px] flex flex-col justify-center">
                            {isLoading && <Loader message="Crafting your resume..." />}
                            {!isLoading && generatedContent && (
                                <div className="absolute top-0 left-0 right-0 bottom-0 overflow-y-auto p-4">
                                    <MarkdownRenderer content={generatedContent} />
                                </div>
                            )}
                            {!isLoading && !generatedContent && (
                                <p className="text-slate-500 text-center">
                                    Your professional resume content will appear here.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !rawExperience.trim()}
                    className="mt-6 w-full bg-[#A8C7FA] text-[#1F1F1F] font-bold py-3 px-4 rounded-full hover:bg-opacity-90 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-200"
                >
                    {isLoading ? 'Generating...' : 'Craft Resume Bullets'}
                </button>
                {error && <p className="mt-4 text-red-400 text-center">{error}</p>}
            </Card>
        </div>
    );
};

export default ResumeStudio;