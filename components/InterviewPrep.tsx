import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { generateInterviewReport } from '../services/geminiService';
import Card from './common/Card';
import Loader from './common/Loader';
import { createPcmBlob, decode, decodeAudioData } from '../utils/audioUtils';
import { MicrophoneIcon, StopIcon } from './common/Icons';
import type { InterviewFeedback, TranscriptMessage } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Simple component to render markdown-like bullet points
const MarkdownRenderer = ({ content }: { content: string }) => {
    const lines = content.split('\n').filter(line => line.trim() !== '');
    return (
        <ul className="list-disc list-inside space-y-2 text-slate-300 pl-2">
            {lines.map((line, index) => {
                const text = line.replace(/^\s*[-*]\s*/, '');
                return <li key={index} className="leading-relaxed">{text}</li>;
            })}
        </ul>
    );
};

const InterviewPrep: React.FC = () => {
    const [jdText, setJdText] = useState('');
    const [isInterviewing, setIsInterviewing] = useState(false);
    const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
    const [finalReport, setFinalReport] = useState<InterviewFeedback | null>(null);
    const [isLoadingReport, setIsLoadingReport] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied' | 'checking'>('checking');

    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const transcriptEndRef = useRef<HTMLDivElement>(null);

    const currentInputTranscriptionRef = useRef('');
    const currentOutputTranscriptionRef = useRef('');
    const nextStartTimeRef = useRef(0);
    const audioSourcesRef = useRef(new Set<AudioBufferSourceNode>());

    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);

    useEffect(() => {
        const checkMicPermission = async () => {
            if (!navigator.permissions) {
                setMicPermission('prompt');
                return;
            }
            try {
                const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
                setMicPermission(permissionStatus.state);
                permissionStatus.onchange = () => {
                    setMicPermission(permissionStatus.state);
                };
            } catch (err) {
                console.error("Could not query microphone permission status:", err);
                setMicPermission('prompt'); // Fallback
            }
        };
        checkMicPermission();
    }, []);
    
    const stopInterview = useCallback(async () => {
        setIsInterviewing(false);
        if (sessionPromiseRef.current) {
            try {
                const session = await sessionPromiseRef.current;
                session.close();
            } catch (e) {
                console.error("Error closing session:", e);
            }
        }
        sessionPromiseRef.current = null;

        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
        
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }
        
        inputAudioContextRef.current?.close().catch(console.error);
        outputAudioContextRef.current?.close().catch(console.error);
        
        audioSourcesRef.current.forEach(source => source.stop());
        audioSourcesRef.current.clear();
        nextStartTimeRef.current = 0;

        if (transcript.length > 0) {
            setIsLoadingReport(true);
            const fullTranscript = transcript.map(t => `${t.speaker}: ${t.text}`).join('\n');
            try {
                const report = await generateInterviewReport(fullTranscript);
                setFinalReport(report);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to generate report.');
            } finally {
                setIsLoadingReport(false);
            }
        }
    }, [transcript]);


    const startInterview = async () => {
        if (!jdText.trim()) {
            setError('Please provide a job description for the mock interview.');
            return;
        }
        setError(null);
        setTranscript([]);
        setFinalReport(null);
        setIsInterviewing(true);

        try {
            mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    systemInstruction: `You are a friendly but professional interviewer conducting a mock interview for the role described below. Ask relevant behavioral and technical questions. Keep your responses concise. Start by introducing yourself and asking the candidate to tell you about themselves. \n\nJOB DESCRIPTION:\n${jdText}`,
                },
                callbacks: {
                    onopen: () => {
                        const source = inputAudioContextRef.current!.createMediaStreamSource(mediaStreamRef.current!);
                        mediaStreamSourceRef.current = source;
                        
                        const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;

                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createPcmBlob(inputData);
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(scriptProcessor);
                        // The line below was causing an audio feedback loop and has been removed.
                        // scriptProcessor.connect(inputAudioContextRef.current!.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        handleServerMessage(message);
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Session error:', e);
                        setError('A connection error occurred during the interview.');
                        stopInterview();
                    },
                    onclose: (e: CloseEvent) => {
                        console.log('Session closed');
                    },
                },
            });

        } catch (err) {
            console.error("Failed to start interview:", err);
            setError("Could not access microphone. Please grant permission and try again.");
            if (err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
                setMicPermission('denied');
            }
            setIsInterviewing(false);
        }
    };
    
    const handleServerMessage = async (message: LiveServerMessage) => {
        if (message.serverContent?.inputTranscription) {
            currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
        }
        if (message.serverContent?.outputTranscription) {
            currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
        }
        
        if (message.serverContent?.turnComplete) {
            setTranscript(prev => {
                const newTranscript = [...prev];
                if (currentInputTranscriptionRef.current.trim()) {
                    newTranscript.push({ speaker: 'user', text: currentInputTranscriptionRef.current.trim() });
                }
                if (currentOutputTranscriptionRef.current.trim()) {
                    newTranscript.push({ speaker: 'model', text: currentOutputTranscriptionRef.current.trim() });
                }
                return newTranscript;
            });
            currentInputTranscriptionRef.current = '';
            currentOutputTranscriptionRef.current = '';
        }

        const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        if (audioData && outputAudioContextRef.current) {
            const ctx = outputAudioContextRef.current;
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
            const audioBuffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += audioBuffer.duration;
            audioSourcesRef.current.add(source);
            source.onended = () => audioSourcesRef.current.delete(source);
        }
    }


    return (
        <div className="space-y-8">
            <Card>
                <h2 className="text-2xl font-bold mb-2 text-slate-100">AI Interview Prep</h2>
                <p className="text-slate-400 mb-6">Practice your interview skills with an AI interviewer tailored to a specific job. Speak naturally and get a full performance report afterward.</p>
                {!isInterviewing && (
                    <>
                        <textarea
                            value={jdText}
                            onChange={(e) => setJdText(e.target.value)}
                            placeholder="Paste the job description here to start..."
                            className="w-full h-32 p-4 bg-[#1F1F1F] border border-white/10 rounded-xl focus:ring-2 focus:ring-[#A8C7FA] focus:outline-none transition-all resize-none"
                            rows={6}
                        />
                         {micPermission === 'denied' ? (
                            <div className="mt-4 p-4 bg-red-900/50 border border-red-500 rounded-xl text-center">
                                <p className="font-bold text-red-300">Microphone Access Denied</p>
                                <p className="text-red-400 text-sm">Please enable microphone access in your browser settings to use this feature.</p>
                            </div>
                        ) : (
                            <button
                                onClick={startInterview}
                                disabled={!jdText.trim() || micPermission === 'checking'}
                                className="mt-4 w-full flex items-center justify-center gap-3 bg-green-500 text-white font-bold py-3 px-4 rounded-full hover:bg-green-600 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all"
                            >
                                <MicrophoneIcon /> 
                                {micPermission === 'checking' ? 'Checking Mic...' : 'Start Mock Interview'}
                            </button>
                        )}
                    </>
                )}
                {isInterviewing && (
                    <button
                        onClick={stopInterview}
                        className="mt-4 w-full flex items-center justify-center gap-3 bg-red-500 text-white font-bold py-3 px-4 rounded-full hover:bg-red-600 transition-all"
                    >
                        <StopIcon /> End Interview & Get Report
                    </button>
                )}
                {error && <p className="mt-4 text-red-400 text-center">{error}</p>}
            </Card>

            {(isInterviewing || transcript.length > 0) && (
                <Card>
                    <h3 className="text-xl font-bold mb-4">Interview Transcript</h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto p-4 bg-[#1F1F1F] rounded-2xl border border-white/10">
                        {transcript.map((msg, index) => (
                            <div key={index} className={`flex flex-col gap-1 ${msg.speaker === 'user' ? 'items-end' : 'items-start'}`}>
                                <p className={`text-xs font-bold capitalize px-2 ${msg.speaker === 'user' ? 'text-[#A8C7FA]' : 'text-green-300'}`}>{msg.speaker === 'user' ? 'You' : 'Interviewer'}</p>
                                <div className={`max-w-xl px-4 py-2.5 ${msg.speaker === 'user' ? 'bg-[#A8C7FA] text-[#1F1F1F] rounded-t-2xl rounded-bl-2xl' : 'bg-[#3C3C3C] text-slate-200 rounded-t-2xl rounded-br-2xl'}`}>
                                    <p className="leading-relaxed">{msg.text}</p>
                                </div>
                            </div>
                        ))}
                         {isInterviewing && <div className="text-center text-slate-400 animate-pulse font-medium">Listening...</div>}
                         <div ref={transcriptEndRef} />
                    </div>
                </Card>
            )}

            {isLoadingReport && <Loader message="Generating your performance report..." />}
            
            {finalReport && (
                <Card>
                    <h3 className="text-xl font-bold text-slate-200 mb-6">Interview Performance Report</h3>
                    <div className="text-center mb-8">
                        <p className="text-lg text-slate-400 font-medium">Final Score</p>
                        <p className="text-7xl font-black text-green-400">{finalReport.finalScore}<span className="text-3xl font-bold text-green-400/80">/100</span></p>
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-[#A8C7FA] mb-3">Feedback</h4>
                        <div className="bg-[#2D2D2D]/60 p-4 rounded-2xl border border-white/10">
                           <MarkdownRenderer content={finalReport.feedback} />
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default InterviewPrep;