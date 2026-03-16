import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Bot, User, Send, PlayCircle, CheckCircle, BarChart, Download, Mic, MicOff, Volume2, VolumeX, Timer, FileText } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const MockInterview = () => {
    const [step, setStep] = useState(1); // 1: Setup, 2: Interview, 3: Results
    const [jobDescription, setJobDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Interview State
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [results, setResults] = useState([]); // Array of { question, answer, score, feedback, keywords }

    // Context-Aware Resume Integration
    const [resumes, setResumes] = useState([]);
    const [storedResumes, setStoredResumes] = useState([]);
    const [selectedResumeId, setSelectedResumeId] = useState('');
    const [activeResumeText, setActiveResumeText] = useState('');
    const [activeResumeUrl, setActiveResumeUrl] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                const NODE_API = process.env.REACT_APP_NODE_API_URL || 'http://localhost:5000/api';

                // Fetch Builder Resumes
                const resumeRes = await axios.get(`${NODE_API}/resume/all`, { headers: { Authorization: `Bearer ${token}` } });
                if (resumeRes.data.success && resumeRes.data.data) {
                    setResumes(resumeRes.data.data);
                }

                // Fetch Stored Profile Resumes (Prebuilt PDFs)
                const profileRes = await axios.get(`${NODE_API}/auth/profile`, { headers: { Authorization: `Bearer ${token}` } });
                if (profileRes.data && profileRes.data.storedResumes) {
                    setStoredResumes(profileRes.data.storedResumes);
                }

            } catch (e) { console.error('Failed to fetch resume context data', e); }
        };
        fetchData();
    }, []);

    // Phase 18 Advanced Features
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [stressMode, setStressMode] = useState(false);
    const [timeLeft, setTimeLeft] = useState(90);

    // Text to Speech
    useEffect(() => {
        if (step === 2 && questions[currentIndex] && isAudioEnabled) {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                const msg = new SpeechSynthesisUtterance(questions[currentIndex]);
                msg.rate = 0.95;
                msg.pitch = 1.05;
                window.speechSynthesis.speak(msg);
            }
        }
    }, [currentIndex, step, questions, isAudioEnabled]);

    // Clean up TTS
    useEffect(() => {
        return () => {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);



    const chatEndRef = useRef(null);

    // Auto-scroll chat
    useEffect(() => {
        if (step === 2 && chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [currentIndex, step]);

    const handleStart = async () => {
        if (!jobDescription.trim()) {
            setError('Please provide a job description so we can tailor the questions.');
            return;
        }

        setLoading(true);
        setError('');

        let resumeText = '';
        let resumeUrl = '';
        if (selectedResumeId) {
            if (selectedResumeId.startsWith('stored_')) {
                const realId = selectedResumeId.replace('stored_', '');
                const selected = storedResumes.find(r => r._id === realId);
                if (selected) resumeUrl = selected.url;
            } else {
                const selected = resumes.find(r => r._id === selectedResumeId);
                if (selected && selected.content) {
                    const c = selected.content;
                    resumeText = `
                        Summary: ${c.summary || ''}
                        Experience: ${(c.experience || []).map(e => `${e.role} at ${e.company}. ${e.description || ''}`).join(' ')}
                        Education: ${(c.education || []).map(e => `${e.degree} at ${e.institution}. ${e.year || ''}`).join(' ')}
                        Projects: ${(c.projects || []).map(p => `${p.title}. ${p.description || ''}`).join(' ')}
                        Skills: ${(c.skills || []).join(', ')}
                    `.trim();
                }
            }
        }
        setActiveResumeText(resumeText);
        setActiveResumeUrl(resumeUrl);

        try {
            const API_URL = process.env.REACT_APP_AI_API_URL || 'http://localhost:8000';
            const response = await axios.post(`${API_URL}/generate_questions`, {
                job_description: jobDescription,
                num_questions: 5,
                resume_text: resumeText || undefined,
                resume_url: resumeUrl || undefined
            }, {
                headers: { 'x-api-key': process.env.REACT_APP_AI_API_KEY }
            });

            if (response.data.success) {
                setQuestions(response.data.questions);
                setCurrentIndex(0);
                setResults([]);
                setStep(2);
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || 'Failed to generate questions. Ensure the AI Engine is running.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitAnswer = React.useCallback(async () => {
        if (!currentAnswer.trim()) return;

        setLoading(true);
        const question = questions[currentIndex];
        const answerText = currentAnswer;

        try {
            const API_URL = process.env.REACT_APP_AI_API_URL || 'http://localhost:8000';
            const response = await axios.post(`${API_URL}/evaluate_answer`, {
                question: question,
                user_answer: answerText,
                expected_keywords: [], // We could extract JS keywords here, but backend handles basic eval
                resume_text: activeResumeText || undefined,
                resume_url: activeResumeUrl || undefined
            }, {
                headers: { 'x-api-key': process.env.REACT_APP_AI_API_KEY }
            });

            if (response.data.success) {
                const evaluation = response.data.data;
                const newResult = {
                    question: question,
                    answer: answerText,
                    score: evaluation.score,
                    feedback: evaluation.feedback,
                    keywords: evaluation.matched_keywords
                };

                const updatedResults = [...results, newResult];
                setResults(updatedResults);
                setCurrentAnswer('');

                if (currentIndex + 1 < questions.length) {
                    setCurrentIndex(currentIndex + 1);
                } else {
                    setStep(3); // Move to results

                    // Persist to Dashboard Analytics
                    try {
                        const NODE_API = process.env.REACT_APP_NODE_API_URL || 'http://localhost:5000/api';
                        const token = localStorage.getItem('token');
                        if (token) {
                            const averageScore = Math.round(updatedResults.reduce((acc, curr) => acc + curr.score, 0) / updatedResults.length);
                            await axios.post(`${NODE_API}/user/interviews`, {
                                jobRole: 'AI Mock Interview',
                                results: updatedResults,
                                overallScore: averageScore,
                                overallFeedback: 'Completed AI Mock Interview against Job Description.'
                            }, { headers: { Authorization: `Bearer ${token}` } });
                        }
                    } catch (e) {
                        console.error('Failed to save interview for analytics:', e);
                    }
                }
            }
        } catch (err) {
            console.error(err);
            setError('Failed to evaluate answer. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [currentAnswer, currentIndex, questions, results, activeResumeText, activeResumeUrl]);

    // Timer logic and auto-submit
    useEffect(() => {
        let timer;
        if (step === 2 && stressMode && !loading) {
            timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        handleSubmitAnswer(); // Auto-submit when time is up
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [step, stressMode, loading, currentIndex, questions.length, handleSubmitAnswer]);

    // Reset timer on new question
    useEffect(() => {
        if (stressMode) {
            setTimeLeft(90);
        }
    }, [currentIndex, stressMode]);

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmitAnswer();
        }
    };

    const renderSetup = () => (
        <div className="max-w-3xl mx-auto mt-10 p-8 bg-white dark:bg-slate-900 border-0 rounded-2xl shadow-soft">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bot size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">AI Mock Interviewer</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Paste a job description below, and our AI will conduct a tailored interview. Receive instant feedback on your answers.</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Target Job Description</label>
                    <textarea
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-4 h-48 focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 dark:focus:border-brand-500 outline-none resize-none bg-slate-50 dark:bg-slate-950 transition-all text-slate-700 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                        placeholder="e.g. We are looking for a Senior React Developer with experience in Next.js, TypeScript, and state management..."
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                    />
                </div>

                <div className="pt-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 mt-4 flex items-center gap-2">
                        <FileText size={16} className="text-brand-500" />
                        Personalize Interview (Optional)
                    </label>
                    {resumes.length > 0 || storedResumes.length > 0 ? (
                        <>
                            <select
                                value={selectedResumeId}
                                onChange={(e) => setSelectedResumeId(e.target.value)}
                                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all font-medium"
                            >
                                <option value="">Do not use my resume (Generic Interview)</option>

                                {resumes.length > 0 && (
                                    <optgroup label="Builder Resumes">
                                        {resumes.map(r => (
                                            <option key={r._id} value={r._id}>{r.title || 'Untitled Resume'}</option>
                                        ))}
                                    </optgroup>
                                )}

                                {storedResumes.length > 0 && (
                                    <optgroup label="Uploaded PDFs">
                                        {storedResumes.map(r => (
                                            <option key={`stored_${r._id}`} value={`stored_${r._id}`}>{r.title || 'Untitled PDF'}</option>
                                        ))}
                                    </optgroup>
                                )}
                            </select>
                            <p className="text-xs text-slate-500 mt-2 font-medium">Selecting a resume allows the AI to tailor its questions specifically to your past experience.</p>
                        </>
                    ) : (
                        <div className="w-full p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-sm font-medium flex items-center justify-between">
                            <span>No resumes found.</span>
                            <a href="/profile" className="text-brand-600 dark:text-brand-400 hover:underline">Upload a PDF to your Profile</a>
                        </div>
                    )}
                </div>


                {error && <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">{error}</div>}

                <div className="flex flex-col sm:flex-row items-center gap-6 mt-6 p-5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" className="w-5 h-5 text-brand-600 rounded focus:ring-brand-500 accent-brand-600 cursor-pointer" checked={stressMode} onChange={(e) => setStressMode(e.target.checked)} />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 group-hover:text-brand-600 transition-colors"><Timer size={18} className="text-orange-500" /> Stress Mode (90s Timer)</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" className="w-5 h-5 text-brand-600 rounded focus:ring-brand-500 accent-brand-600 cursor-pointer" checked={isAudioEnabled} onChange={(e) => setIsAudioEnabled(e.target.checked)} />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 group-hover:text-brand-600 transition-colors">
                            {isAudioEnabled ? <Volume2 size={18} className="text-brand-500" /> : <VolumeX size={18} className="text-slate-400" />}
                            AI Voice Prompt
                        </span>
                    </label>
                </div>

                <button
                    onClick={handleStart}
                    disabled={loading}
                    className={`w-full py-4 rounded-xl font-bold text-white transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 ${loading ? 'bg-brand-400 cursor-not-allowed hidden-shadow' : 'bg-brand-600 hover:bg-brand-700 shadow-glow hover:shadow-lg'}`}
                >
                    {loading ? 'Generating tailored questions...' : <><PlayCircle size={20} /> Start Interview</>}
                </button>
            </div>
        </div>
    );

    // Speech Recognition Setup
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript + ' ';
                    }
                }
                if (finalTranscript) {
                    setCurrentAnswer(prev => prev + finalTranscript);
                }
            };

            recognitionRef.current.onerror = (event) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const toggleListen = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            setCurrentAnswer(''); // Clear before speaking new answer
            try {
                recognitionRef.current?.start();
                setIsListening(true);
            } catch (err) {
                console.error("Failed to start listening", err);
            }
        }
    };

    const renderInterview = () => (
        <div className="max-w-4xl mx-auto mt-6 flex flex-col h-[85vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-soft overflow-hidden">
            {/* Header */}
            <div className="bg-brand-600 text-white p-4 flex justify-between items-center shadow-md z-10 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <Bot size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold">AI Technical Interviewer</h3>
                        <p className="text-xs text-brand-100 font-medium">Question {currentIndex + 1} of {questions.length}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {stressMode && (
                        <div className={`text-sm font-bold px-4 py-1.5 rounded-full shadow-inner flex items-center gap-2 ${timeLeft <= 15 ? 'bg-red-500 text-white animate-pulse' : 'bg-orange-500 text-white'}`}>
                            <Timer size={16} /> 00:{timeLeft.toString().padStart(2, '0')}
                        </div>
                    )}
                    <div className="text-sm font-bold bg-brand-700 px-4 py-1.5 rounded-full shadow-inner">
                        Progress: {Math.round((currentIndex / questions.length) * 100)}%
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-6 overflow-y-auto bg-slate-50 dark:bg-slate-950/50 space-y-6">
                {/* Previous Q&A */}
                {results.map((res, idx) => (
                    <React.Fragment key={idx}>
                        {/* AI Question */}
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-brand-600 dark:bg-brand-500 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                                <Bot size={16} className="text-white" />
                            </div>
                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl rounded-tl-sm shadow-sm max-w-[80%] text-gray-800 dark:text-gray-100">
                                <p>{res.question}</p>
                            </div>
                        </div>

                        {/* User Answer */}
                        <div className="flex items-start gap-4 flex-row-reverse">
                            <div className="w-8 h-8 rounded-full bg-slate-800 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 mt-1">
                                <User size={16} className="text-white" />
                            </div>
                            <div className="bg-slate-800 dark:bg-slate-700 text-white p-4 rounded-2xl rounded-tr-sm shadow-sm max-w-[80%]">
                                <p>{res.answer}</p>
                            </div>
                        </div>
                    </React.Fragment>
                ))}

                {/* Current Question */}
                <div className="flex items-start gap-4 animate-fade-in">
                    <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                        <Bot size={16} className="text-white" />
                    </div>
                    <div className="bg-white dark:bg-brand-900/40 border border-brand-100 dark:border-brand-800 p-4 rounded-2xl rounded-tl-sm shadow-soft max-w-[80%] text-gray-800 dark:text-gray-100">
                        <p className="font-medium text-brand-900 dark:text-brand-300">{questions[currentIndex]}</p>
                    </div>
                </div>

                {loading && (
                    <div className="flex items-start gap-4 flex-row-reverse animate-fade-in opacity-50">
                        <div className="w-8 h-8 rounded-full bg-slate-800 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 mt-1">
                            <User size={16} className="text-white" />
                        </div>
                        <div className="p-4 max-w-[80%] text-gray-500 dark:text-gray-400 italic">
                            Evaluating your response...
                        </div>
                    </div>
                )}
                {isListening && (
                    <div className="flex items-start gap-4 flex-row-reverse animate-fade-in">
                        <div className="p-2 max-w-[80%] text-brand-500 font-medium animate-pulse flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-bounce"></div>
                            Listening to your answer...
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            {error && <div className="p-3 bg-red-100 text-red-700 text-sm text-center font-medium">{error}</div>}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 relative rounded-b-2xl">
                <div className="flex gap-2 relative">
                    <textarea
                        className="flex-1 border border-slate-200 dark:border-slate-700 rounded-xl p-3 h-14 max-h-32 resize-none focus:outline-none focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 dark:focus:border-brand-500 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 pr-12 transition-all"
                        placeholder="Type or speak your answer... (Shift+Enter for newline)"
                        value={currentAnswer}
                        onChange={(e) => setCurrentAnswer(e.target.value)}
                        onKeyDown={handleKeyPress}
                        disabled={loading}
                    />

                    {/* Mic Button inserted inside textarea layout visually */}
                    <button
                        onClick={toggleListen}
                        disabled={loading}
                        className={`absolute right-[80px] top-2 p-3 rounded-full transition-all shadow-sm ${isListening ? 'bg-red-100 text-red-600 animate-pulse border border-red-200' : 'bg-white text-gray-400 hover:bg-gray-100 hover:text-gray-600 border border-slate-200'}`}
                        title={isListening ? "Stop Listening" : "Start Voice Answer"}
                    >
                        {isListening ? <Mic size={20} /> : <MicOff size={20} />}
                    </button>

                    <button
                        onClick={handleSubmitAnswer}
                        disabled={loading || !currentAnswer.trim()}
                        className="bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 text-white rounded-xl px-6 font-semibold flex items-center justify-center transition-all shadow-glow hover:shadow-lg active:scale-95"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );

    const renderResults = () => {
        const averageScore = Math.round(results.reduce((acc, curr) => acc + curr.score, 0) / results.length);

        const handleExportPDF = async () => {
            const element = document.getElementById('interview-scorecard');
            if (!element) return;
            try {
                const canvas = await html2canvas(element, { scale: 2, useCORS: true });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save('AI-Interview-Scorecard.pdf');
            } catch (err) {
                console.error("PDF Export failed", err);
            }
        };

        return (
            <div className="max-w-5xl mx-auto mt-8 p-8 font-sans">

                <div className="flex justify-end mb-4">
                    <button onClick={handleExportPDF} className="bg-brand-600 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2 hover:bg-brand-700 shadow-sm transition-all active:scale-95 text-sm">
                        <Download size={16} /> Export PDF Scorecard
                    </button>
                </div>

                <div id="interview-scorecard" className="bg-white p-2">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-soft p-8 mb-8 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-500 to-indigo-600"></div>
                        <h2 className="text-3xl font-black text-slate-800 dark:text-gray-100 mb-2 mt-4">Interview Completed</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">Here is a detailed breakdown of your performance based on AI NLP evaluation.</p>

                        <div className="flex flex-col md:flex-row justify-center items-center gap-8">
                            <div className="text-center p-6 bg-brand-50 dark:bg-brand-900/20 rounded-2xl border border-brand-100 dark:border-brand-800 min-w-[200px] shadow-sm">
                                <p className="text-sm font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-2">Overall Score</p>
                                <div className="text-6xl font-black text-slate-900 dark:text-gray-100">{averageScore}<span className="text-3xl text-slate-400 dark:text-slate-600">/100</span></div>
                            </div>
                            <div className="text-left space-y-3">
                                <p className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><CheckCircle className="text-green-500" size={20} /> Questions Completed: <span className="font-bold">{questions.length}</span></p>
                                <p className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><BarChart className="text-blue-500" size={20} /> Feedback Detail: <span className="font-bold">Sentence Clarity & Keywords</span></p>
                                <p className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><Timer className={stressMode ? "text-orange-500" : "text-gray-400"} size={20} /> Stress Mode: <span className="font-bold">{stressMode ? 'Enabled (90s)' : 'Disabled'}</span></p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-gray-100">Q&A Feedback Analysis</h3>
                        {results.map((res, index) => (
                            <div key={index} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-soft p-6 flex flex-col md:flex-row gap-6 hover:shadow-soft-lg transition-shadow">
                                <div className="md:w-2/3 space-y-4">
                                    <div>
                                        <span className="text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 px-3 py-1.5 rounded-md uppercase tracking-wider mb-2 inline-block">Question {index + 1}</span>
                                        <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">{res.question}</h4>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-800 text-sm text-gray-700 dark:text-gray-300">
                                        <span className="font-bold block text-slate-900 dark:text-slate-100 mb-1">Your Answer:</span>
                                        {res.answer}
                                    </div>
                                </div>
                                <div className="md:w-1/3 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-4 md:pt-0 md:pl-6 flex flex-col justify-center space-y-4">
                                    <div>
                                        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Score</span>
                                        <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-end gap-1">
                                            {res.score} <span className="text-sm text-gray-400 font-normal mb-1">/ 100</span>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 block mb-1">AI Feedback</span>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">{res.feedback}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <button
                        onClick={() => { setStep(1); setJobDescription(''); setQuestions([]); setResults([]); }}
                        className="px-8 py-3 bg-slate-800 dark:bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors shadow-md active:scale-95"
                    >
                        Start New Interview
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-full bg-slate-50 dark:bg-[#0f172a] pb-12 transition-colors">
            {step === 1 && renderSetup()}
            {step === 2 && renderInterview()}
            {step === 3 && renderResults()}
        </div>
    );
};

export default MockInterview;
