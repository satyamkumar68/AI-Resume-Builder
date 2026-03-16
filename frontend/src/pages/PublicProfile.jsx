import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Award, Shield, FileText, Download, TrendingUp, Briefcase } from 'lucide-react';

const PublicProfile = () => {
    const { id } = useParams();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const API_URL = process.env.REACT_APP_NODE_API_URL || 'http://localhost:5000/api';
                const { data } = await axios.get(`${API_URL}/public/profile/${id}`);

                if (data.success && data.data) {
                    setProfileData(data.data);
                } else {
                    setError('Profile not found.');
                }
            } catch (err) {
                console.error(err);
                setError('Profile not found or might be private.');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center font-bold text-slate-400">
                <div className="animate-pulse flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-brand-500 animate-bounce"></div>
                    <div className="w-4 h-4 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-4 h-4 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
            </div>
        );
    }

    if (error || !profileData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-soft text-center max-w-md w-full mx-4">
                    <Shield size={48} className="text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Profile Unavailable</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
                    <Link to="/" className="inline-block px-6 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition">
                        Go to Homepage
                    </Link>
                </div>
            </div>
        );
    }

    const { name, profilePhoto, globalRankScore, tier, categoryTrack, storedResumes } = profileData;

    // Helper to get tier color
    const getTierColor = (t) => {
        switch (t?.toLowerCase()) {
            case 'diamond': return 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-400 dark:border-cyan-800/50';
            case 'platinum': return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-400 dark:border-purple-800/50';
            case 'gold': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800/50';
            case 'silver': return 'bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
            default: return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-400 dark:border-orange-800/50'; // Bronze
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header Profile Section */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-soft border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center sm:items-start gap-8 relative overflow-hidden">
                    {/* Decorative Background */}
                    <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-brand-600 to-indigo-600 rounded-t-3xl z-0"></div>

                    <div className="relative z-10 sm:mt-8">
                        {profilePhoto ? (
                            <img src={profilePhoto} alt={name} className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-900 shadow-lg object-cover bg-white dark:bg-slate-800" />
                        ) : (
                            <div className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-900 shadow-lg bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-400 flex items-center justify-center text-4xl font-black">
                                {name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>

                    <div className="relative z-10 sm:mt-16 flex-1 text-center sm:text-left">
                        <h1 className="text-3xl font-black text-slate-800 dark:text-white capitalize tracking-tight">{name}</h1>
                        <p className="text-lg text-slate-500 dark:text-slate-400 mt-1 font-medium capitalize">{categoryTrack || 'Verified Professional'}</p>

                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-4">
                            <div className={`px-4 py-1.5 rounded-full border font-bold text-sm flex items-center gap-1.5 ${getTierColor(tier)}`}>
                                <Award size={16} />
                                {tier || 'Unranked'} Tier
                            </div>
                            {globalRankScore && (
                                <div className="px-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm flex items-center gap-1.5">
                                    <TrendingUp size={16} className="text-brand-500" />
                                    {globalRankScore} AI Score
                                </div>
                            )}
                            <div className="px-4 py-1.5 rounded-full border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-bold text-sm flex items-center gap-1.5">
                                <Shield size={16} />
                                AI Verified
                            </div>
                        </div>
                    </div>
                </div>

                {/* Resumes Section */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-soft border border-slate-100 dark:border-slate-800">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <Briefcase className="text-brand-500" /> Professional Portfolio
                    </h3>

                    {storedResumes && storedResumes.length > 0 ? (
                        <div className="grid sm:grid-cols-2 gap-4">
                            {storedResumes.map((resume, idx) => (
                                <div key={idx} className="group p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/50 hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg transition-all flex items-center justify-between">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="p-3 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-xl group-hover:scale-110 transition-transform">
                                            <FileText size={24} />
                                        </div>
                                        <span className="font-bold text-slate-700 dark:text-slate-200 truncate">{resume.title || `Resume ${idx + 1}`}</span>
                                    </div>
                                    <a
                                        href={resume.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:text-brand-400 dark:hover:bg-brand-900/30 rounded-lg transition-colors cursor-pointer shrink-0"
                                        title="View/Download"
                                    >
                                        <Download size={20} />
                                    </a>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                            <p className="text-slate-500 dark:text-slate-400 font-medium">This user hasn't uploaded any public documents yet.</p>
                        </div>
                    )}
                </div>

                {/* Footer powered by AIReady */}
                <div className="text-center pt-8 pb-4">
                    <p className="text-sm font-bold text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
                        Powered by
                        <span className="text-brand-500"><Link to="/">AIReady</Link></span>
                    </p>
                </div>

            </div>
        </div>
    );
};

export default PublicProfile;
