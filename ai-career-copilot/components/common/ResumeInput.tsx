
import React, { useRef, useState, useCallback } from 'react';
import { parseResumeFile } from '../../utils/fileUtils';

interface ResumeInputProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    className?: string;
}

const ResumeInput: React.FC<ResumeInputProps> = ({ value, onChange, disabled, className = '' }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const [parseError, setParseError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = async (file: File | undefined) => {
        if (!file) return;

        setIsParsing(true);
        setParseError(null);
        setFileName(file.name);
        try {
            const text = await parseResumeFile(file);
            onChange(text);
        } catch (error) {
            setParseError(error instanceof Error ? error.message : "Failed to parse file.");
            setFileName(null);
        } finally {
            setIsParsing(false);
            if(fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const onFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        handleFileChange(event.target.files?.[0]);
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (!disabled) setIsDragging(true);
    }, [disabled]);

     const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(async (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
        if (disabled) return;
        handleFileChange(event.dataTransfer.files?.[0]);
    }, [onChange, disabled]);

    return (
        <div className={`flex flex-col gap-4 ${className}`}>
            <div 
                className={`relative border-2 border-dashed border-white/20 rounded-xl p-6 text-center transition-all duration-300 bg-[#2D2D2D]/40 ${isDragging ? 'border-white/40 bg-white/10' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={onFileSelect}
                    className="hidden"
                    accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.txt,.pdf,application/pdf"
                    disabled={disabled || isParsing}
                />
                <div className="flex flex-col items-center justify-center space-y-3">
                    <svg className="h-10 w-10 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    <p className="text-slate-400">Drag & drop your resume here, or</p>
                    <button
                        type="button"
                        onClick={handleUploadClick}
                        disabled={disabled || isParsing}
                        className="bg-white/10 text-white font-semibold py-2 px-5 rounded-full hover:bg-white/20 disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors"
                    >
                        {isParsing ? 'Parsing...' : 'Browse File'}
                    </button>
                    {fileName && !parseError && <p className="text-sm text-green-400 mt-2">Loaded: {fileName}</p>}
                    <p className="text-xs text-slate-500 pt-1">Supports: .docx, .txt, .pdf</p>
                </div>
                {parseError && <p className="mt-2 text-sm text-red-400">{parseError}</p>}
            </div>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="... or paste your resume text here. Uploading a file will populate this area."
                className="w-full flex-grow p-4 bg-[#2D2D2D]/60 border border-white/10 rounded-xl focus:ring-2 focus:ring-[#A8C7FA] focus:outline-none transition-all duration-200 resize-none"
                rows={10}
                disabled={disabled}
            />
        </div>
    );
};

export default ResumeInput;