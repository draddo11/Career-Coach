import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Modality, type LiveServerMessage } from '@google/genai';
import { generateInterviewTurn, generateInterviewReport } from '../services/appService';
import { getAiClient } from '../services/geminiService';
import Card from './common/Card';
import Loader from './common/Loader';
import { SettingsIcon, ChatBubbleIcon, MicrophoneIcon, WaveformIcon, StopIcon } from './common/Icons';
import type { InterviewFeedback, TranscriptMessage } from '../types';
import MarkdownRenderer from './common/MarkdownRenderer';
import JdInput from './common/JdInput';
import { decode, decodeAudioData, createPcmBlob } from '../utils/audioUtils';

type InterviewStyle = 'friendly' | 'formal' | 'stress';
type InterviewMode = 'text' | 'voice';
type VoiceState = 'idle' | 'listening' | 'speaking' | 'ending';

// --- Constants for Audio Processing ---
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;
const SCRIPT_PROCESSOR_BUFFER_SIZE = 4096;


const InterviewPrep: React.FC = () => {
    // --- Shared State ---
    const [jdText, setJdText] = useState('');
    const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
    const [finalReport, setFinalReport] = useState<InterviewFeedback | null>(null);
    const [isLoadingReport, setIsLoadingReport] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [interviewStyle, setInterviewStyle] = useState<InterviewStyle>('friendly');
    const [skillsToPractice, setSkillsToPractice] = useState('');
    const [interviewMode, setInterviewMode] = useState<InterviewMode>('text');

    // --- Text Mode State ---
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [isAwaitingTextResponse, setIsAwaitingTextResponse] = useState(false);
    const [isTextInterviewing, setIsTextInterviewing] = useState(false);
    
    // --- Voice Mode State & Refs ---
    const [voiceState, setVoiceState] = useState<VoiceState>('idle');
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const nextStartTimeRef = useRef(0);
    const outputSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const currentInputTranscriptionRef = useRef('');
    const currentOutputTranscriptionRef = useRef('');
    
    const transcriptEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);

    const resetState = () => {
        setTranscript([]);
        setFinalReport(null);
        setError(null);
        setCurrentAnswer('');
        setIsAwaitingTextResponse(false);
        setIsTextInterviewing(false);
        setVoiceState('idle');
        currentInputTranscriptionRef.current = '';
        currentOutputTranscriptionRef.current = '';
    };

    // --- Core Interview Logic ---
    const handleGenerateReport = async () => {
        if (transcript.length <= 1) return;
        setIsLoadingReport(true);
        const fullTranscriptText = transcript.map(t => `${t.speaker}: ${t.text}`).join('\n');
        try {
            const report = await generateInterviewReport(fullTranscriptText);
            setFinalReport(report);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate report.');
        } finally {
            setIsLoadingReport(false);
        }
    };
    
    // --- Text Mode Handlers ---
    const startTextInterview = async () => {
        if (!jdText.trim()) {
            setError('Please provide a job description for the mock interview.');
            return;
        }
        resetState();
        setIsTextInterviewing(true);
        setIsAwaitingTextResponse(true);

        try {
            const result = await generateInterviewTurn({ jdText, transcript: [], interviewStyle, skillsToPractice });
            setTranscript([{ speaker: 'model', text: result }]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start interview.');
            setIsTextInterviewing(false);
        } finally {
            setIsAwaitingTextResponse(false);
        }
    };
    
    const handleSendAnswer = async () => {
        if (!currentAnswer.trim()) return;

        const newTranscript: TranscriptMessage[] = [...transcript, { speaker: 'user', text: currentAnswer }];
        setTranscript(newTranscript);
        setCurrentAnswer('');
        setIsAwaitingTextResponse(true);
        setError(null);
        
        try {
            const result = await generateInterviewTurn({ jdText, transcript: newTranscript, interviewStyle, skillsToPractice });
            setTranscript(prev => [...prev, { speaker: 'model', text: result }]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to get next question.');
        } finally {
            setIsAwaitingTextResponse(false);
        }
    };

    const stopTextInterview = () => {
        setIsTextInterviewing(false);
        handleGenerateReport();
    };

    // --- Voice Mode Handlers ---
    const cleanupAudio = useCallback(() => {
        // Stop all playing audio sources
        outputSourcesRef.current.forEach(source => {
            try { source.stop(); } catch(e) { console.warn("Failed to stop audio source", e)}
        });
        outputSourcesRef.current.clear();

        // Disconnect audio nodes
        scriptProcessorRef.current?.disconnect();
        mediaStreamSourceRef.current?.disconnect();
        
        // Stop microphone track
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        
        // Clear refs for nodes and stream, but not for contexts
        scriptProcessorRef.current = null;
        mediaStreamSourceRef.current = null;
        mediaStreamRef.current = null;
    }, []);

    const startVoiceInterview = async () => {
        if (!jdText.trim()) {
            setError('Please provide a job description for the mock interview.');
            return;
        }
        resetState();
        setVoiceState('listening');

        try {
            const ai = getAiClient();
            
            if (!inputAudioContextRef.current) {
                inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: INPUT_SAMPLE_RATE });
            }
            if (!outputAudioContextRef.current) {
                outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: OUTPUT_SAMPLE_RATE });
            }
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        mediaStreamSourceRef.current = inputAudioContextRef.current!.createMediaStreamSource(stream);
                        scriptProcessorRef.current = inputAudioContextRef.current!.createScriptProcessor(SCRIPT_PROCESSOR_BUFFER_SIZE, 1, 1);
                        
                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createPcmBlob(inputData);
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(inputAudioContextRef.current!.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        // Handle Transcription
                        if (message.serverContent?.outputTranscription) {
                            currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
                            setVoiceState('speaking');
                        } else if (message.serverContent?.inputTranscription) {
                            currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
                            setVoiceState('listening');
                        }
                        
                        if (message.serverContent?.turnComplete) {
                            const fullInput = currentInputTranscriptionRef.current.trim();
                            const fullOutput = currentOutputTranscriptionRef.current.trim();
                            
                            setTranscript(prev => {
                                const newTurns: TranscriptMessage[] = [];
                                if (fullInput) newTurns.push({ speaker: 'user', text: fullInput });
                                if (fullOutput) newTurns.push({ speaker: 'model', text: fullOutput });
                                return [...prev, ...newTurns];
                            });

                            currentInputTranscriptionRef.current = '';
                            currentOutputTranscriptionRef.current = '';
                        }
                        
                        // Handle Audio Output
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                        if (base64Audio) {
                            const outputContext = outputAudioContextRef.current!;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputContext.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputContext, OUTPUT_SAMPLE_RATE, 1);
                            const source = outputContext.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputContext.destination);
                            
                            const currentSources = outputSourcesRef.current;
                            currentSources.add(source);
                            source.addEventListener('ended', () => {
                                currentSources.delete(source);
                                if (currentSources.size === 0) {
                                    setVoiceState('listening');
                                }
                            });
                            
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                        }

                        if(message.serverContent?.interrupted) {
                            outputSourcesRef.current.forEach(s => s.stop());
                            outputSourcesRef.current.clear();
                            nextStartTimeRef.current = 0;
                            setVoiceState('listening');
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live session error:', e);
                        setError('A connection error occurred during the voice interview.');
                        setVoiceState('idle');
                    },
                    onclose: (e: CloseEvent) => {
                        console.log('Live session closed.');
                        cleanupAudio();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    outputAudioTranscription: {},
                    inputAudioTranscription: {},
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                    systemInstruction: `You are an interviewer conducting a mock interview for the role described in the job description. Your persona is ${interviewStyle}. ${skillsToPractice ? `Focus on these skills: ${skillsToPractice}.` : ''} The user will provide the job description in the first message. Start the interview by introducing yourself and asking the first question.`
                },
            });
            // Send initial message with JD
            const session = await sessionPromiseRef.current;
            session.sendRealtimeInput({ text: `Here is the job description I'm interviewing for:\n\n${jdText}` });

        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Failed to start voice interview. Check microphone permissions.');
            setVoiceState('idle');
            cleanupAudio();
        }
    };
    
    const stopVoiceInterview = async () => {
        setVoiceState('ending');
        try {
            const session = await sessionPromiseRef.current;
            session?.close();
        } catch (e) {
            console.error("Error closing session:", e);
        } finally {
            cleanupAudio();
            sessionPromiseRef.current = null;
            handleGenerateReport();
        }
    };
    
    useEffect(() => {
        // Cleanup function for when the component unmounts
        return () => {
            if (sessionPromiseRef.current) {
                sessionPromiseRef.current.then(session => session?.close()).catch(console.error);
            }
            cleanupAudio();
            // This is the only place audio contexts are fully closed
            inputAudioContextRef.current?.close().catch(console.error);
            outputAudioContextRef.current?.close().catch(console.error);
        };
    }, [cleanupAudio]);
    
    // --- Render Logic ---
    const isInterviewActive = isTextInterviewing || voiceState !== 'idle';
    const isConfigDisabled = isInterviewActive || isLoadingReport;

    const renderTextMode = () => (
        <>
            {isTextInterviewing && !isAwaitingTextResponse && (
                <div className="mt-4 flex items-start gap-3">
                    <textarea
                        value={currentAnswer}
                        onChange={(e) => setCurrentAnswer(e.target.value)}
                        placeholder="Type your answer here..."
                        className="w-full flex-grow p-3 bg-[#2D2D2D]/60 border border-white/10 rounded-xl focus:ring-2 focus:ring-[#A8C7FA] focus:outline-none transition-all resize-none"
                        rows={4}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendAnswer();
                            }
                        }}
                    />
                    <button
                        onClick={handleSendAnswer}
                        disabled={!currentAnswer.trim() || isAwaitingTextResponse}
                        className="bg-[#A8C7FA] text-[#1F1F1F] font-bold py-3 px-6 rounded-xl hover:bg-opacity-90 disabled:bg-slate-600 transition-colors h-full"
                    >
                        Send
                    </button>
                </div>
            )}
        </>
    );

    const renderVoiceMode = () => {
        const getVoiceButton = () => {
            switch (voiceState) {
                case 'idle':
                    return <button onClick={startVoiceInterview} disabled={!jdText.trim()} className="w-full flex items-center justify-center gap-3 bg-green-500 text-white font-bold py-3 px-4 rounded-full hover:bg-green-600 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all"><MicrophoneIcon /> Start Voice Interview</button>
                case 'listening':
                    return <button onClick={stopVoiceInterview} className="w-full flex items-center justify-center gap-3 bg-red-500 text-white font-bold py-3 px-4 rounded-full hover:bg-red-600 transition-all"><div className="w-5 h-5 relative"><div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></div><MicrophoneIcon /></div> Listening... (End Interview)</button>
                case 'speaking':
                     return <button disabled className="w-full flex items-center justify-center gap-3 bg-blue-500 text-white font-bold py-3 px-4 rounded-full disabled:cursor-not-allowed transition-all"><WaveformIcon /> AI is Speaking...</button>
                case 'ending':
                    return <button disabled className="w-full flex items-center justify-center gap-3 bg-slate-600 text-white font-bold py-3 px-4 rounded-full disabled:cursor-not-allowed transition-all"><StopIcon /> Ending Session...</button>
            }
        };

        return (
            <div className="mt-6">
                {getVoiceButton()}
            </div>
        );
    }
    

    return (
        <div className="space-y-8">
            <Card>
                <h2 className="text-2xl font-bold mb-2 text-slate-100">AI Interview Prep</h2>
                <p className="text-slate-400 mb-6">Practice your interview skills with an AI. Choose text for a classic mock interview or voice for a real-time conversational practice.</p>
                {!isInterviewActive && (
                    <div className="space-y-4">
                        <div className="flex justify-center mb-4">
                            <div className="flex w-full sm:w-auto flex-wrap justify-center gap-1 bg-[#2D2D2D] p-1.5 rounded-full border border-white/10">
                                <button onClick={() => setInterviewMode('text')} className={`px-5 py-2.5 text-sm font-bold rounded-full transition-all ${interviewMode === 'text' ? 'bg-[#A8C7FA] text-[#1F1F1F]' : 'text-slate-300 hover:bg-white/10'}`}>Text Mode</button>
                                <button onClick={() => setInterviewMode('voice')} className={`px-5 py-2.5 text-sm font-bold rounded-full transition-all ${interviewMode === 'voice' ? 'bg-[#A8C7FA] text-[#1F1F1F]' : 'text-slate-300 hover:bg-white/10'}`}>Voice Mode</button>
                            </div>
                        </div>

                        <JdInput value={jdText} onChange={setJdText} disabled={isConfigDisabled} />
                        
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                            <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2"><SettingsIcon/> Interview Customization</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="interview-style" className="block text-sm font-medium text-slate-400 mb-1">Interviewer Persona</label>
                                    <select id="interview-style" value={interviewStyle} onChange={(e) => setInterviewStyle(e.target.value as InterviewStyle)} className="w-full p-2 bg-[#1F1F1F] border border-white/10 rounded-lg focus:ring-2 focus:ring-[#A8C7FA] focus:outline-none" disabled={isConfigDisabled}>
                                        <option value="friendly">Friendly & Encouraging</option>
                                        <option value="formal">Formal & Corporate</option>
                                        <option value="stress">Stress Interview</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="skills-practice" className="block text-sm font-medium text-slate-400 mb-1">Skills to Practice</label>
                                    <input type="text" id="skills-practice" value={skillsToPractice} onChange={(e) => setSkillsToPractice(e.target.value)} placeholder="e.g., leadership, python" className="w-full p-2 bg-[#1F1F1F] border border-white/10 rounded-lg focus:ring-2 focus:ring-[#A8C7FA] focus:outline-none" disabled={isConfigDisabled} />
                                </div>
                            </div>
                        </div>
                        {interviewMode === 'text' && (
                            <button onClick={startTextInterview} disabled={!jdText.trim() || isConfigDisabled} className="!mt-6 w-full flex items-center justify-center gap-3 bg-green-500 text-white font-bold py-3 px-4 rounded-full hover:bg-green-600 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all"><ChatBubbleIcon /> Start Mock Interview</button>
                        )}
                        {interviewMode === 'voice' && renderVoiceMode()}
                    </div>
                )}
                {error && <p className="mt-4 text-red-400 text-center">{error}</p>}
            </Card>

            {(isInterviewActive || transcript.length > 0 || isLoadingReport || finalReport) && (
                <Card>
                    <div className="flex justify-between items-center mb-4">
                         <h3 className="text-xl font-bold">Interview Transcript</h3>
                         {isTextInterviewing && <button onClick={stopTextInterview} className="bg-red-500 text-white font-bold py-2 px-5 rounded-full hover:bg-red-600 transition-all">End Interview</button>}
                    </div>
                    <div className="space-y-4 max-h-96 overflow-y-auto p-4 bg-[#1F1F1F] rounded-2xl border border-white/10">
                        {transcript.map((msg, index) => (
                            <div key={index} className={`flex flex-col gap-1 ${msg.speaker === 'user' ? 'items-end' : 'items-start'}`}>
                                <p className={`text-xs font-bold capitalize px-2 ${msg.speaker === 'user' ? 'text-[#A8C7FA]' : 'text-green-300'}`}>{msg.speaker === 'user' ? 'You' : 'Interviewer'}</p>
                                <div className={`max-w-xl px-4 py-2.5 ${msg.speaker === 'user' ? 'bg-[#A8C7FA] text-[#1F1F1F] rounded-t-2xl rounded-bl-2xl' : 'bg-[#3C3C3C] text-slate-200 rounded-t-2xl rounded-br-2xl'}`}>
                                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                </div>
                            </div>
                        ))}
                        {isAwaitingTextResponse && (
                            <div className="flex justify-start items-center gap-3 p-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-300"></div>
                                <p className="text-green-300 font-medium">Interviewer is typing...</p>
                            </div>
                        )}
                        <div ref={transcriptEndRef} />
                    </div>
                    {interviewMode === 'text' && renderTextMode()}
                    {isTextInterviewing && interviewMode === 'voice' && <div className="mt-4">{renderVoiceMode()}</div> /* Show end button if switched mid-interview */}
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
                    <div className="space-y-8">
                        <div>
                            <h4 className="text-lg font-bold text-[#A8C7FA] mb-3">Overall Feedback</h4>
                            <div className="bg-[#2D2D2D]/60 p-4 rounded-2xl border border-white/10">
                               <MarkdownRenderer content={finalReport.overallFeedback} />
                            </div>
                        </div>

                        {finalReport.answerBreakdowns?.length > 0 && (
                            <div>
                                <h4 className="text-lg font-bold text-[#A8C7FA] mb-3">STAR Method Analysis</h4>
                                <div className="space-y-4">
                                    {finalReport.answerBreakdowns.map((breakdown, idx) => (
                                        <div key={idx} className="bg-[#2D2D2D]/60 p-4 rounded-2xl border border-white/10">
                                            <p className="text-slate-400 text-sm italic mb-2">Interviewer: "{breakdown.question}"</p>
                                            <p className="bg-slate-800/50 p-3 rounded-lg text-slate-300 mb-4">Your Answer: "{breakdown.userAnswer}"</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                                <div className="bg-[#1F1F1F] p-3 rounded-lg"><strong className="text-blue-300 block">Situation:</strong> {breakdown.situationFeedback}</div>
                                                <div className="bg-[#1F1F1F] p-3 rounded-lg"><strong className="text-purple-300 block">Task:</strong> {breakdown.taskFeedback}</div>
                                                <div className="bg-[#1F1F1F] p-3 rounded-lg"><strong className="text-green-300 block">Action:</strong> {breakdown.actionFeedback}</div>
                                                <div className="bg-[#1F1F1F] p-3 rounded-lg"><strong className="text-yellow-300 block">Result:</strong> {breakdown.resultFeedback}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {finalReport.suggestedImprovements?.length > 0 && (
                             <div>
                                <h4 className="text-lg font-bold text-[#A8C7FA] mb-3">Suggested Improvements</h4>
                                <div className="space-y-4">
                                     {finalReport.suggestedImprovements.map((imp, idx) => (
                                         <div key={idx} className="bg-[#2D2D2D]/60 p-4 rounded-2xl border border-white/10">
                                            <p className="text-slate-200 font-semibold mb-2">Reasoning: <span className="font-normal text-slate-300">{imp.reasoning}</span></p>
                                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="border border-red-500/30 bg-red-900/20 p-3 rounded-lg">
                                                    <p className="text-red-300 font-bold mb-2">Original Answer</p>
                                                    <p className="text-slate-300 text-sm italic">"{imp.originalAnswer}"</p>
                                                </div>
                                                <div className="border border-green-500/30 bg-green-900/20 p-3 rounded-lg">
                                                    <p className="text-green-300 font-bold mb-2">Improved Answer</p>
                                                    <p className="text-slate-200 text-sm">"{imp.improvedAnswer}"</p>
                                                </div>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             </div>
                        )}

                    </div>
                </Card>
            )}
        </div>
    );
};

export default InterviewPrep;