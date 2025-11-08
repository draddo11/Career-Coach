
import React from 'react';

interface JdInputProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    className?: string;
}

const JdInput: React.FC<JdInputProps> = ({ value, onChange, disabled, className = '' }) => {
    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Paste the job description text here."
                className="w-full flex-grow p-4 bg-[#2D2D2D]/60 border border-white/10 rounded-xl focus:ring-2 focus:ring-[#A8C7FA] focus:outline-none transition-all resize-none"
                rows={10}
                disabled={disabled}
            />
        </div>
    );
};

export default JdInput;
