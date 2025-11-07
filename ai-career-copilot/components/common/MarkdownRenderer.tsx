
import React from 'react';

// A simple component to render markdown-like content
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: string[] = [];

    const flushList = () => {
        if (listItems.length > 0) {
            elements.push(
                <ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-2 text-slate-300 pl-2">
                    {listItems.map((item, index) => <li key={index} className="leading-relaxed">{item}</li>)}
                </ul>
            );
            listItems = [];
        }
    };

    lines.forEach((line, index) => {
        // Don't trim the line here to preserve indentation in code blocks etc. if added later.
        let processed = false;

        // Headings
        if (line.startsWith('## ')) {
            flushList();
            elements.push(<h4 key={index} className="text-lg font-bold text-[#A8C7FA] mt-6 mb-3">{line.substring(3)}</h4>);
            processed = true;
        } else if (line.startsWith('### ')) {
            flushList();
            elements.push(<h5 key={index} className="text-md font-bold text-slate-200 mt-4 mb-2">{line.substring(4)}</h5>);
            processed = true;
        }

        // List items
        if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
            listItems.push(line.trim().substring(2));
            processed = true;
        }

        // Handle paragraphs and flush lists
        if (!processed && line.trim().length > 0) {
            flushList();
            // Handle bold text within paragraphs
            const parts = line.split(/(\*\*.*?\*\*)/g);
            elements.push(
                <p key={index} className="text-slate-300 leading-relaxed">
                    {parts.map((part, i) =>
                        part.startsWith('**') && part.endsWith('**') ?
                        <strong key={i} className="text-slate-200 font-semibold">{part.slice(2, -2)}</strong> :
                        part
                    )}
                </p>
            );
        } else if (!processed) {
            // This is likely an empty line between paragraphs or end of a list
            flushList();
        }
    });

    flushList(); // Flush any remaining list items at the end

    return <div className="space-y-4">{elements}</div>;
};

export default MarkdownRenderer;