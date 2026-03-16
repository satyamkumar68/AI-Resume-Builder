import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const Leaderboard = () => {
    const [category, setCategory] = useState('All');
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);

    const categories = ['All', 'Software Engineering', 'Data Science', 'Design', 'Product Management', 'Marketing', 'Other'];

    useEffect(() => {
        fetchLeaderboard();
    }, [category]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const API_URL = process.env.REACT_APP_NODE_API_URL || 'http://localhost:5000/api';
            const response = await axios.get(`${API_URL}/leaderboard?category=${category}`);
            if (response.data.success) {
                setLeaders(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTierColor = (tier) => {
        switch (tier) {
            case 'Diamond': return 'text-cyan-500 bg-cyan-50 border-cyan-200';
            case 'Platinum': return 'text-slate-600 bg-slate-100 border-slate-300';
            case 'Gold': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'Silver': return 'text-gray-500 bg-gray-50 border-gray-200';
            case 'Bronze': return 'text-orange-700 bg-orange-50 border-orange-200';
            default: return 'text-slate-400 bg-slate-50 border-slate-100';
        }
    };

    const getRankIcon = (index) => {
        if (index === 0) return <Trophy className="text-yellow-500" size={24} />;
        if (index === 1) return <Medal className="text-slate-400" size={24} />;
        if (index === 2) return <Medal className="text-orange-500" size={24} />;
        return <span className="font-bold text-slate-400 w-6 text-center">{index + 1}</span>;
    };

    return (
        <div className="p-8 max-w-6xl mx-auto h-full flex flex-col font-sans">
            <header className="mb-10 text-center">
                <h1 className="text-4xl font-black text-slate-800 dark:text-white flex items-center justify-center gap-3 mb-3">
                    <TrendingUp className="text-brand-600" size={36} />
                    Global Leaderboard
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto">
                    See how your resume stacks up against industry benchmarks. Scores are generated fairly using our deterministic AI extraction engine. Opt-in via your Profile settings to appear here.
                </p>
            </header>

            <div className="flex flex-wrap justify-center gap-2 mb-8">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all shadow-sm ${category === cat
                            ? 'bg-brand-600 text-white border border-brand-600 shadow-md'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-soft border border-slate-200 dark:border-slate-800 overflow-hidden flex-1 flex flex-col">
                <div className="bg-slate-50 dark:bg-slate-950 p-4 border-b border-slate-200 dark:border-slate-800 grid grid-cols-12 gap-4 font-bold text-xs uppercase tracking-wider text-slate-500">
                    <div className="col-span-2 md:col-span-1 text-center">Rank</div>
                    <div className="col-span-5 md:col-span-4">Candidate</div>
                    <div className="col-span-5 md:col-span-3">Track</div>
                    <div className="hidden md:block md:col-span-2 text-center">Tier</div>
                    <div className="hidden md:block md:col-span-2 text-right pr-4">Score</div>
                </div>

                <div className="overflow-y-auto flex-1 p-2">
                    {loading ? (
                        <div className="flex justify-center items-center h-40 text-slate-400 font-bold">Loading Rankings...</div>
                    ) : leaders.length === 0 ? (
                        <div className="flex justify-center items-center h-40 text-slate-400 font-medium text-center px-4">
                            No candidates found in this track yet. Become the first by opting in from your Profile!
                        </div>
                    ) : (
                        <div className="space-y-2 pb-4">
                            {leaders.map((leader, index) => (
                                <motion.div
                                    key={leader._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    whileHover={{ scale: 1.01, backgroundColor: 'var(--tw-colors-slate-50)' }}
                                    className="grid grid-cols-12 gap-4 items-center p-3 rounded-2xl dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
                                >
                                    <div className="col-span-2 md:col-span-1 flex justify-center">
                                        {getRankIcon(index)}
                                    </div>
                                    <div className="col-span-5 md:col-span-4 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-600 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden border border-brand-200">
                                            {leader.profilePhoto ? (
                                                <img src={leader.profilePhoto} alt={leader.name} className="w-full h-full object-cover" />
                                            ) : (
                                                leader.name.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div className="font-bold text-slate-800 dark:text-slate-100 truncate">
                                            {leader.name}
                                        </div>
                                    </div>
                                    <div className="col-span-5 md:col-span-3 text-sm text-slate-500 dark:text-slate-400 font-medium">
                                        {leader.categoryTrack}
                                    </div>
                                    <div className="hidden md:flex md:col-span-2 justify-center">
                                        <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest border ${getTierColor(leader.tier)}`}>
                                            {leader.tier}
                                        </span>
                                    </div>
                                    <div className="hidden md:block md:col-span-2 text-right pr-4 font-black text-brand-600 text-lg">
                                        {leader.globalRankScore}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
