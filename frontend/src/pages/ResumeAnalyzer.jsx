import React, { useState } from 'react';
import axios from 'axios';
import { UploadCloud, FileText, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const ResumeAnalyzer = () => {
    const [file, setFile] = useState(null);
    const [jobDescription, setJobDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleAnalyze = async () => {
        if (!file || !jobDescription) {
            setError('Please provide both a Resume PDF and a Job Description.');
            return;
        }

        setError('');
        setLoading(true);

        const formData = new FormData();
        formData.append('resume_file', file);
        formData.append('job_description', jobDescription);

        try {
            const API_URL = process.env.REACT_APP_AI_API_URL || 'http://localhost:8000';
            const response = await axios.post(`${API_URL}/analyze_resume`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'x-api-key': process.env.REACT_APP_AI_API_KEY
                }
            });
            const analysisData = response.data.data;
            setResult(analysisData);

            // Persist the score to the User's latest Resume in DB for Dashboard Analytics
            try {
                const NODE_API = process.env.REACT_APP_NODE_API_URL || 'http://localhost:5000/api';
                const token = localStorage.getItem('token');
                if (token && analysisData) {
                    await axios.post(`${NODE_API}/user/resume-analysis`, {
                        score: analysisData.score || 0,
                        missingKeywords: analysisData.missing_keywords || [],
                        feedback: analysisData.feedback || 'Analysis Completed'
                    }, { headers: { Authorization: `Bearer ${token}` } });
                }
            } catch (e) {
                console.error('Failed to save analysis score for dashboard:', e);
            }

        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || 'An error occurred during analysis.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto font-sans">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Resume Analyzer</h1>
                <p className="text-gray-600 dark:text-gray-400">Upload your ATS resume and compare it against a specific job description.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Inputs Section */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-800 transition-all hover:shadow-soft-lg">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100"><UploadCloud size={20} className="text-brand-600" /> Upload Resume (PDF)</h2>
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-brand-50 dark:file:bg-brand-900/40 file:text-brand-700 dark:file:text-brand-400 hover:file:bg-brand-100 dark:hover:file:bg-brand-900/60 mb-2 cursor-pointer transition-colors"
                        />
                        {file && <p className="text-sm text-green-600 font-medium">Selected: {file.name}</p>}
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-800 transition-all hover:shadow-soft-lg">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100"><FileText size={20} className="text-brand-600" /> Target Job Description</h2>
                        <textarea
                            className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-4 h-48 focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 dark:focus:border-brand-500 bg-slate-50 dark:bg-slate-950 outline-none transition-all resize-none text-slate-700 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                            placeholder="Paste the job requirements here..."
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                        />
                    </div>

                    {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">{error}</div>}

                    <button
                        onClick={handleAnalyze}
                        disabled={loading}
                        className={`w-full py-4 rounded-xl font-bold text-white transition-all transform active:scale-[0.98] ${loading ? 'bg-brand-400 cursor-not-allowed hidden-shadow' : 'bg-brand-600 hover:bg-brand-700 shadow-glow hover:shadow-lg'}`}
                    >
                        {loading ? 'Analyzing with AI...' : 'Analyze Match Score'}
                    </button>
                </div>

                {/* Results Section */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-8 flex flex-col">
                    <h2 className="text-xl font-bold border-b border-slate-200 dark:border-slate-800 pb-4 flex items-center gap-2 text-slate-900 dark:text-slate-100"><Activity size={24} /> Analysis Report</h2>

                    {!result ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                            <FileText size={48} className="mb-4 opacity-50" />
                            <p>Run formatting and matching analysis to see your score.</p>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col py-4 mt-4 space-y-8 animate-fade-in">

                            {/* Scores Container */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                                {/* JD Match Score Dial */}
                                <div className="flex flex-col items-center">
                                    <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Job Match</h3>
                                    <div className="relative w-40 h-40">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        { name: 'Score', value: result.score },
                                                        { name: 'Remaining', value: 100 - result.score }
                                                    ]}
                                                    cx="50%" cy="50%"
                                                    innerRadius={50}
                                                    outerRadius={70}
                                                    startAngle={90}
                                                    endAngle={-270}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    <Cell fill={result.score >= 75 ? '#22c55e' : result.score >= 50 ? '#eab308' : '#ef4444'} />
                                                    <Cell fill="#e2e8f0" />
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-3xl font-black text-gray-800 dark:text-gray-100">{result.score}%</span>
                                        </div>
                                    </div>
                                    <p className="text-center text-xs text-slate-600 mt-2 font-medium max-w-[150px]">{result.feedback}</p>
                                </div>

                                {/* Base ATS Score Dial */}
                                <div className="flex flex-col items-center">
                                    <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Base ATS Score</h3>
                                    <div className="relative w-40 h-40">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        { name: 'Score', value: result.base_score || 0 },
                                                        { name: 'Remaining', value: 100 - (result.base_score || 0) }
                                                    ]}
                                                    cx="50%" cy="50%"
                                                    innerRadius={50}
                                                    outerRadius={70}
                                                    startAngle={90}
                                                    endAngle={-270}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    <Cell fill={(result.base_score || 0) >= 80 ? '#3b82f6' : (result.base_score || 0) >= 60 ? '#f97316' : '#ef4444'} />
                                                    <Cell fill="#e2e8f0" />
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-3xl font-black text-gray-800 dark:text-gray-100">{result.base_score || 0}</span>
                                        </div>
                                    </div>
                                    <p className="text-center text-xs text-slate-600 mt-2 font-medium max-w-[150px]">Structural quality & formatting</p>
                                </div>
                            </div>

                            {/* Resume Structure & Mistakes Panel */}
                            {result.section_analysis && (
                                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-sm">
                                    <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                                        📋 Structure Analysis
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {Object.entries(result.section_analysis).map(([section, isPresent]) => (
                                            <div key={section} className={`flex items-center gap-3 p-3 rounded-xl border ${isPresent ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg ${isPresent ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                    {isPresent ? '✓' : '×'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-700 capitalize">{section} Section</p>
                                                    <p className={`text-xs font-semibold ${isPresent ? 'text-green-600' : 'text-red-500'}`}>
                                                        {isPresent ? 'Found and parsed' : 'Missing or not recognized'}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Keywords Analysis */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Matched Keywords */}
                                {result.matched_keywords && result.matched_keywords.length > 0 && (
                                    <div className="bg-white dark:bg-slate-800 p-5 border border-green-200 dark:border-green-900/50 rounded-2xl shadow-sm">
                                        <h3 className="font-bold text-green-800 dark:text-green-500 mb-3 flex items-center gap-2">
                                            ✅ Matched Keywords
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {result.matched_keywords.map((kw, i) => (
                                                <span key={i} className="px-3 py-1.5 bg-green-50 dark:bg-green-900/40 border border-green-200 dark:border-green-800/60 text-xs font-bold rounded-full text-green-700 dark:text-green-400">{kw}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Missing Keywords */}
                                {result.missing_keywords && result.missing_keywords.length > 0 && (
                                    <div className="bg-white dark:bg-slate-800 p-5 border border-red-200 dark:border-red-900/50 rounded-2xl shadow-sm">
                                        <h3 className="font-bold text-red-800 dark:text-red-500 mb-3 flex items-center gap-2">
                                            ⚠️ Missing Keywords
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {result.missing_keywords.map((kw, i) => (
                                                <span key={i} className="px-3 py-1.5 bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-800/60 text-xs font-bold rounded-full text-red-700 dark:text-red-400">{kw}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default ResumeAnalyzer;
