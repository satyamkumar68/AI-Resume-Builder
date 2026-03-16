import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Phone, Mail, Hash, Image as ImageIcon, ExternalLink, Copy, CheckCircle } from 'lucide-react';

const Profile = () => {
    const { user, updateProfile, uploadProfileResume, deleteProfileResume } = useAuth();

    // Form state initialized from global user state
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        gender: '',
        age: '',
        profilePhoto: '',
        categoryTrack: 'Software Engineering',
        leaderboardOptIn: false,
        storedResumes: []
    });

    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Populate form data when user context loads/changes
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                phone: user.phone || '',
                gender: user.gender || '',
                age: user.age || '',
                profilePhoto: user.profilePhoto || '',
                categoryTrack: user.categoryTrack || 'Software Engineering',
                leaderboardOptIn: user.leaderboardOptIn || false,
                storedResumes: user.storedResumes || []
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const success = await updateProfile(formData);
            if (success) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
        } finally {
            setIsSaving(false);

            // Clear message after 3 seconds
            setTimeout(() => {
                setMessage({ type: '', text: '' });
            }, 3000);
        }
    };

    if (!user) return null;

    const copyPublicLink = () => {
        if (!user || !user._id) return;
        const link = `${window.location.origin}/u/${user._id}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const inputClass = "w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 dark:focus:border-brand-500 outline-none bg-slate-50 dark:bg-slate-950 transition-all text-slate-700 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 font-medium";
    const labelClass = "block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2";

    return (
        <div className="p-8 max-w-4xl mx-auto min-h-full font-sans">
            <header className="mb-10">
                <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                    <User className="text-brand-600 dark:text-brand-400" size={32} />
                    My Profile
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Manage your personal information and account settings.</p>
            </header>

            <div className="bg-white dark:bg-slate-950 p-8 rounded-3xl shadow-soft border border-slate-100 dark:border-slate-800">

                {/* Avatar Section */}
                <div className="flex items-center gap-6 mb-10 pb-10 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-24 h-24 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 flex items-center justify-center overflow-hidden border-4 border-white dark:border-slate-950 shadow-md flex-shrink-0">
                        {formData.profilePhoto ? (
                            <img src={formData.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-3xl font-black">{formData.name.charAt(0).toUpperCase()}</span>
                        )}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-gray-100">{user.name}</h3>
                        <p className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2 mt-1">
                            <Mail size={16} /> {user.email}
                        </p>
                    </div>
                </div>

                {/* Global Ranking Status */}
                <div className="bg-gradient-to-r from-brand-50 to-indigo-50 border border-brand-100 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between shadow-sm">
                    <div>
                        <h4 className="font-bold text-brand-900 flex items-center gap-2 mb-1">
                            🏆 Global Resume Rank
                        </h4>
                        <p className="text-sm font-medium text-brand-700 max-w-md block">
                            Your resume gets automatically evaluated against industry standards. Opt-in below to appear on the public leaderboard.
                        </p>
                    </div>
                    <div className="flex gap-4 mt-4 md:mt-0">
                        <div className="bg-white px-4 py-2 rounded-xl border border-brand-200 shadow-sm text-center">
                            <span className="block text-[10px] font-bold text-brand-500 uppercase tracking-widest">Score</span>
                            <span className="text-xl font-black text-brand-800">{user.globalRankScore || 0}</span>
                        </div>
                        <div className="bg-white px-4 py-2 rounded-xl border border-brand-200 shadow-sm text-center">
                            <span className="block text-[10px] font-bold text-brand-500 uppercase tracking-widest">Tier</span>
                            <span className={`text-xl font-black ${user.tier === 'Unranked' ? 'text-slate-400' : 'text-amber-500'}`}>{user.tier || 'Unranked'}</span>
                        </div>
                    </div>
                </div>

                {/* Status Message */}
                {message.text && (
                    <div className={`mb-6 p-4 rounded-xl font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'}`}>
                        {message.text}
                    </div>
                )}

                {/* Edit Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={labelClass}>Full Name</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                    <User size={18} />
                                </div>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={`${inputClass} pl-11`}
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Phone Number</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                    <Phone size={18} />
                                </div>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className={`${inputClass} pl-11`}
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Age</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                    <Hash size={18} />
                                </div>
                                <input
                                    type="number"
                                    name="age"
                                    value={formData.age}
                                    onChange={handleChange}
                                    className={`${inputClass} pl-11`}
                                    placeholder="25"
                                    min="16"
                                    max="120"
                                />
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Gender</label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className={inputClass}
                            >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                                <option value="Prefer not to say">Prefer not to say</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-2">
                        <label className={labelClass}>Profile Photo URL</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                <ImageIcon size={18} />
                            </div>
                            <input
                                type="url"
                                name="profilePhoto"
                                value={formData.profilePhoto}
                                onChange={handleChange}
                                className={`${inputClass} pl-11`}
                                placeholder="https://example.com/avatar.jpg"
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-2 font-medium">Provide a direct link to an image (JPEG/PNG). Leave blank to use your name initial.</p>
                    </div>

                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Leaderboard Settings</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelClass}>Category Track</label>
                                <select
                                    name="categoryTrack"
                                    value={formData.categoryTrack}
                                    onChange={handleChange}
                                    className={inputClass}
                                >
                                    <option value="Software Engineering">Software Engineering</option>
                                    <option value="Data Science">Data Science</option>
                                    <option value="Design">Design</option>
                                    <option value="Product Management">Product Management</option>
                                    <option value="Marketing">Marketing</option>
                                    <option value="Other">Other</option>
                                </select>
                                <p className="text-xs font-medium text-slate-500 mt-2">This determines which leaderboard you compete in.</p>
                            </div>

                            <div className="flex items-center gap-3">
                                <label className="relative inline-flex items-center cursor-pointer mt-4">
                                    <input
                                        type="checkbox"
                                        name="leaderboardOptIn"
                                        checked={formData.leaderboardOptIn}
                                        onChange={handleChange}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-brand-600"></div>
                                </label>
                                <div className="mt-4">
                                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Public Leaderboard Profile</span>
                                    <p className="text-xs font-medium text-slate-500">Allow other users to see your rank and tier.</p>
                                </div>
                            </div>
                        </div>

                        {formData.leaderboardOptIn && (
                            <div className="mt-6 p-4 bg-brand-50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-800/50 rounded-xl flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-bold text-brand-900 dark:text-brand-100">Your Public URL</h4>
                                    <p className="text-xs text-brand-700 dark:text-brand-300 font-medium mt-1">Share your AI-verified rank and portfolio with recruiters.</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={copyPublicLink}
                                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                                    >
                                        {copied ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
                                        {copied ? 'Copied' : 'Copy Link'}
                                    </button>
                                    <a
                                        href={`/u/${user._id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
                                        title="View Public Profile"
                                    >
                                        <ExternalLink size={16} />
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Stored Resumes Section */}
                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">My Stored Resumes</h3>
                            <label className="bg-brand-100 hover:bg-brand-200 text-brand-700 dark:bg-brand-900/30 dark:hover:bg-brand-900/50 dark:text-brand-300 px-4 py-2 rounded-lg font-bold text-sm cursor-pointer transition-colors shadow-sm focus-within:ring-2 focus-within:ring-brand-500">
                                + Upload PDF
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    className="hidden"
                                    onChange={async (e) => {
                                        const file = e.target.files[0];
                                        if (!file) return;
                                        if (file.type !== "application/pdf") {
                                            setMessage({ type: 'error', text: 'Only PDF files are allowed.' });
                                            return;
                                        }
                                        if (file.size > 5 * 1024 * 1024) {
                                            setMessage({ type: 'error', text: 'PDF must be smaller than 5MB.' });
                                            return;
                                        }

                                        // Auto-save this addition seamlessly
                                        setIsSaving(true);
                                        try {
                                            const success = await uploadProfileResume(file);
                                            if (success) {
                                                setMessage({ type: 'success', text: 'Resume uploaded successfully!' });
                                            }
                                        } catch (err) {
                                            setMessage({ type: 'error', text: 'Upload failed.' });
                                        } finally {
                                            setIsSaving(false);
                                            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
                                            e.target.value = ''; // Reset input
                                        }
                                    }}
                                />
                            </label>
                        </div>

                        {(formData.storedResumes && formData.storedResumes.length > 0) ? (
                            <ul className="space-y-3">
                                {formData.storedResumes.map((resume, idx) => (
                                    <li key={idx} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-brand-300 transition-colors">
                                        <div className="flex items-center gap-3 truncate">
                                            <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                                                PDF
                                            </div>
                                            <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[200px] md:max-w-xs">{resume.title}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <a
                                                href={resume.url}
                                                download={resume.title}
                                                className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded drop-shadow-sm text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                                            >
                                                Download
                                            </a>
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    setIsSaving(true);
                                                    try {
                                                        const success = await deleteProfileResume(idx);
                                                        if (success) {
                                                            setMessage({ type: 'success', text: 'Resume deleted.' });
                                                        }
                                                    } catch (err) {
                                                        setMessage({ type: 'error', text: 'Delete failed.' });
                                                    } finally {
                                                        setIsSaving(false);
                                                        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
                                                    }
                                                }}
                                                className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold text-sm rounded hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center py-8 px-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                                <p className="text-slate-500 font-medium">No external resumes stored yet.</p>
                                <p className="text-xs text-slate-400 mt-1">Upload your prebuilt PDFs here for easy access.</p>
                            </div>
                        )}
                    </div>

                    <div className="pt-6 flex justify-end cursor-pointer">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-glow hover:shadow-lg active:scale-95 disabled:opacity-70 disabled:pointer-events-none flex items-center gap-2 cursor-pointer"
                        >
                            {isSaving ? 'Saving Changes...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Profile;
