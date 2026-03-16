import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useResume } from '../context/ResumeContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { FileText, MessageSquare, Activity, TrendingUp, Award, Clock, Trophy, UploadCloud } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const MotionLink = motion(Link);

const API_URL = process.env.REACT_APP_NODE_API_URL || 'http://localhost:5000/api';

const StatCard = ({ title, value, subValue, icon: Icon, colorClass, linkTo }) => {
    const content = (
        <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-800 flex items-start justify-between transition-shadow hover:shadow-soft-lg h-full"
        >
            <div>
                <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{value}</h3>
                {subValue && <p className="text-sm mt-2 font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 inline-block px-2 py-1 rounded">{subValue}</p>}
            </div>
            <div className={`p-4 rounded-xl ${colorClass}`}>
                <Icon size={24} className="text-white" />
            </div>
        </motion.div>
    );
    return linkTo ? <Link to={linkTo} className="block w-full h-full">{content}</Link> : content;
};

const Dashboard = () => {
    const { user } = useAuth();
    const { importPrebuiltResume, createNewResume } = useResume();
    const firstName = user?.name ? user.name.split(' ')[0] : 'User';
    const [isMounted, setIsMounted] = useState(false);
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            toast.error('Only PDF files are supported.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size must be less than 5MB.');
            return;
        }

        setUploading(true);
        const loadingToast = toast.loading('Parsing your resume with AI... Please wait.');

        const success = await importPrebuiltResume(file);

        toast.dismiss(loadingToast);
        setUploading(false);

        if (success) {
            toast.success('Resume imported successfully!');
            // Optional: navigate to builder here if you imported `useNavigate`
            // navigate('/builder'); 
        } else {
            toast.error('Failed to parse resume. Please try a different PDF or create manually.');
        }

        // Reset file input
        e.target.value = null;
    };

    useEffect(() => {
        setIsMounted(true);
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem('token');
                const { data } = await axios.get(`${API_URL}/user/dashboard-stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (data.success) {
                    setDashboardData(data.data);
                }
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();

        // Suppress benign Recharts ResizeObserver development warnings
        const originalWarn = console.warn;
        console.warn = (...args) => {
            if (typeof args[0] === 'string' && args[0].includes('The width') && args[0].includes('should be greater than 0')) {
                return;
            }
            originalWarn.apply(console, args);
        };
        return () => {
            console.warn = originalWarn;
        };
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans">
            <Toaster position="top-right" />
            <header className="flex justify-between items-end flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back, {firstName}! 👋</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Here is your career preparation overview for this week.</p>
                </div>
                <div className="flex gap-3">
                    <label
                        className={`bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-slate-700 hover:border-brand-400 dark:hover:border-brand-500 px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm hover:shadow-md flex items-center gap-2 cursor-pointer ${uploading ? 'opacity-70 pointer-events-none' : ''}`}
                    >
                        <UploadCloud size={18} />
                        {uploading ? 'Importing...' : 'Import LinkedIn PDF'}
                        <input
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            onChange={handleFileUpload}
                            disabled={uploading}
                        />
                    </label>
                    <MotionLink
                        to="/builder"
                        onClick={() => createNewResume()}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-glow hover:shadow-lg flex items-center"
                    >
                        New Resume
                    </MotionLink>
                </div>
            </header>

            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Mock Interviews Taken"
                    value={dashboardData?.topStats?.interviews || "0"}
                    subValue={dashboardData?.topStats?.interviews > 0 ? "Lifetime Total" : "Get started!"}
                    icon={MessageSquare}
                    colorClass="bg-indigo-500"
                />
                <StatCard
                    title="Avg. Resume Match Score"
                    value={`${dashboardData?.topStats?.avgScore || 0}%`}
                    subValue={dashboardData?.topStats?.avgScore > 75 ? "Top Tier!" : "Keep improving"}
                    icon={Activity}
                    colorClass="bg-emerald-500"
                />
                <StatCard
                    title="Global Resume Rank"
                    value={user?.globalRankScore || "0"}
                    subValue={user?.tier && user.tier !== 'Unranked' ? `Tier: ${user.tier}` : 'Save resume to rank'}
                    icon={Trophy}
                    colorClass="bg-yellow-500"
                    linkTo="/leaderboard"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Main Engagement Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-800 transition-all hover:shadow-soft-lg">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2"><TrendingUp size={20} className="text-brand-600 dark:text-brand-400" /> Engagement Overview</h2>
                    <div style={{ width: '100%', height: 300 }}>
                        {isMounted && (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dashboardData?.activityChart || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorResumes" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorInterviews" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} allowDecimals={false} />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Area type="monotone" dataKey="resumes" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorResumes)" name="Resumes Saved" />
                                    <Area type="monotone" dataKey="interviews" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorInterviews)" name="Mock Interviews" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Skill Profile Radar */}
                <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-800 transition-all hover:shadow-soft-lg">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-2"><Award size={20} className="text-indigo-600 dark:text-indigo-400" /> Skill Gap Analysis</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Based on your recent NLP evaluations.</p>
                    <div style={{ width: '100%', height: 250 }}>
                        {isMounted && (
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={dashboardData?.skillRadar || []}>
                                    <PolarGrid stroke="#e2e8f0" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                                    <Radar name={firstName} dataKey="A" stroke="#4f46e5" strokeWidth={2} fill="#6366f1" fillOpacity={0.4} />
                                </RadarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Activity List */}
            <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-800 transition-all hover:shadow-soft-lg">
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6">Recent Activity</h2>
                <div className="space-y-4">
                    {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
                        dashboardData.recentActivity.map((activity, i) => {
                            // Assign icons and colors dynamically based on activity type
                            let icon = FileText;
                            let color = 'text-brand-600';
                            let bg = 'bg-brand-100';

                            if (activity.type === 'interview') {
                                icon = MessageSquare;
                                color = 'text-indigo-600';
                                bg = 'bg-indigo-100';
                            } else if (activity.type === 'job') {
                                icon = Activity;
                                color = 'text-emerald-600';
                                bg = 'bg-emerald-100';
                            }

                            const IconComponent = icon;

                            return (
                                <div key={i} className="flex gap-4 p-4 border border-slate-100 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer group hover:shadow-sm">
                                    <div className={`w-12 h-12 rounded-full ${bg} ${color} dark:bg-opacity-20 flex items-center justify-center flex-shrink-0`}>
                                        <IconComponent size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800 dark:text-gray-200">{activity.title}</h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1"><Clock size={14} /> {activity.timeAgo}</p>
                                        <p className="text-gray-700 dark:text-gray-300">{activity.desc}</p>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400">No recent activity found. Start building your resume or take a mock interview!</p>
                    )}
                </div>
            </div>

        </div>
    );
};

export default Dashboard;
