declare const mammoth: any;

export const parseResumeFile = (file: File): Promise<string> => {
    const reader = new FileReader();
    const fileName = file.name.toLowerCase();

    return new Promise((resolve, reject) => {
        reader.onload = async (event) => {
            try {
                if (!event.target?.result) {
                    return reject(new Error("Failed to read file."));
                }
                
                if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
                    const arrayBuffer = event.target.result as ArrayBuffer;
                    const result = await mammoth.extractRawText({ arrayBuffer });
                    resolve(result.value);
                } else if (fileName.endsWith('.txt')) {
                    resolve(event.target.result as string);
                } else if (fileName.endsWith('.pdf')) {
                    const pdfjsLib = (window as any).pdfjsLib;
                    if (!pdfjsLib) {
                        return reject(new Error("PDF parsing library is not loaded. Please check your internet connection."));
                    }
                    const arrayBuffer = event.target.result as ArrayBuffer;
                    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                    let textContent = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const text = await page.getTextContent();
                        textContent += text.items.map((s: any) => s.str).join(' ');
                        textContent += '\n'; // Add a newline between pages
                    }
                    resolve(textContent);
                } else {
                     reject(new Error(`Unsupported file type. Please upload a .docx, .txt, or .pdf file.`));
                }

            } catch (e) {
                console.error("Error parsing file:", e);
                reject(new Error("Could not parse the file. It might be corrupted."));
            }
        };

        reader.onerror = () => reject(new Error('Error reading file.'));

        if (fileName.endsWith('.docx') || fileName.endsWith('.doc') || fileName.endsWith('.pdf')) {
            reader.readAsArrayBuffer(file);
        } else if (fileName.endsWith('.txt')) {
            reader.readAsText(file);
        } else {
            reject(new Error(`Unsupported file type. Please upload a .docx, .txt, or .pdf file.`));
        }
    });
};