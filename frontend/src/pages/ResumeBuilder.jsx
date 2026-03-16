import React, { useState } from 'react';
import { useResume } from '../context/ResumeContext';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Download, UploadCloud, PenTool, Linkedin } from 'lucide-react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const inputClass = "w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 dark:focus:border-brand-500 outline-none transition-all shadow-soft";
const labelClass = "block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5";

const ContactForm = () => {
    const { resumeData, updateContact, updateSummary, importFromLinkedIn, isLoading } = useResume();
    const [importError, setImportError] = useState('');

    const handleImportClick = () => {
        document.getElementById('linkedin-upload').click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setImportError('File size must be under 5MB.');
            return;
        }

        setImportError('');
        const success = await importFromLinkedIn(file);
        if (!success) {
            setImportError('Failed to parse LinkedIn PDF. Please try again.');
        }
        e.target.value = null; // reset
    };

    return (
        <div className="space-y-8 animate-fade-in pb-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-5 rounded-2xl shadow-sm text-center">
                <h4 className="text-sm font-bold text-blue-900 mb-2">Save Time with AI Import ✨</h4>
                <p className="text-xs text-blue-700 mb-4 font-medium">Upload your exported LinkedIn PDF profile to instantly fill out your entire resume.</p>
                <input type="file" id="linkedin-upload" className="hidden" accept="application/pdf" onChange={handleFileChange} />
                <button
                    onClick={handleImportClick}
                    disabled={isLoading}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-md active:scale-95 transition-all w-full flex items-center justify-center gap-2 disabled:bg-blue-400"
                >
                    <UploadCloud size={18} /> {isLoading ? 'Extracting via AI...' : 'Import LinkedIn PDF'}
                </button>
                {importError && <p className="text-red-500 text-xs font-bold mt-3">{importError}</p>}
            </div>

            <div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelClass}>Full Name</label>
                        <input className={inputClass} placeholder="e.g. John Doe" value={resumeData.contact.fullName} onChange={(e) => updateContact('fullName', e.target.value)} />
                    </div>
                    <div>
                        <label className={labelClass}>Email Address</label>
                        <input type="email" className={inputClass} placeholder="john.doe@example.com" value={resumeData.contact.email} onChange={(e) => updateContact('email', e.target.value)} />
                    </div>
                    <div>
                        <label className={labelClass}>Phone Number</label>
                        <input className={inputClass} placeholder="(123) 456-7890" value={resumeData.contact.phone} onChange={(e) => updateContact('phone', e.target.value)} />
                    </div>
                    <div>
                        <label className={labelClass}>LinkedIn / Website</label>
                        <input className={inputClass} placeholder="linkedin.com/in/johndoe" value={resumeData.contact.linkedin} onChange={(e) => updateContact('linkedin', e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="pt-2">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">Professional Summary</h3>
                <textarea className={`${inputClass} h-36 resize-none`} placeholder="Briefly describe your career goals, expertise, and what you bring to the table..." value={resumeData.summary} onChange={(e) => updateSummary(e.target.value)} />
            </div>
        </div>
    );
};

const ExperienceForm = () => {
    const { resumeData, addExperience, removeExperience } = useResume();
    const [newExp, setNewExp] = useState({ company: '', role: '', startDate: '', endDate: '', description: '' });

    const handleAdd = () => {
        if (newExp.company && newExp.role) {
            addExperience(newExp);
            setNewExp({ company: '', role: '', startDate: '', endDate: '', description: '' });
        }
    };

    const [enhancingBullet, setEnhancingBullet] = useState(false);

    const handleEnhanceBullet = async () => {
        if (!newExp.description.trim()) return;
        setEnhancingBullet(true);
        try {
            const API_URL = process.env.REACT_APP_AI_API_URL || 'http://localhost:8000';
            const response = await axios.post(`${API_URL}/enhance_bullet`, {
                bullet_point: newExp.description
            }, {
                headers: { 'x-api-key': process.env.REACT_APP_AI_API_KEY }
            });
            if (response.data.success) {
                setNewExp({ ...newExp, description: response.data.enhanced_bullet });
            }
        } catch (error) {
            console.error('Failed to enhance bullet point', error);
        } finally {
            setEnhancingBullet(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-4">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">Work Experience</h3>

            {resumeData.experience.length > 0 && (
                <div className="space-y-4 mb-8">
                    {resumeData.experience.map(exp => (
                        <div key={exp.id} className="border border-slate-200 p-5 rounded-2xl bg-slate-50 flex justify-between items-start shadow-soft transition-all hover:shadow-soft-lg">
                            <div>
                                <h4 className="font-bold text-slate-800 text-lg">{exp.role}</h4>
                                <p className="text-sm font-medium text-brand-600 mb-1">{exp.company}</p>
                                <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">{exp.startDate} - {exp.endDate}</p>
                            </div>
                            <button onClick={() => removeExperience(exp.id)} className="text-red-500 hover:text-red-700 text-sm font-bold bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors">
                                Remove
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-5">Add New Experience</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                    <div>
                        <label className={labelClass}>Company Name</label>
                        <input className={inputClass} placeholder="e.g. Google" value={newExp.company} onChange={e => setNewExp({ ...newExp, company: e.target.value })} />
                    </div>
                    <div>
                        <label className={labelClass}>Role / Job Title</label>
                        <input className={inputClass} placeholder="e.g. Software Engineer" value={newExp.role} onChange={e => setNewExp({ ...newExp, role: e.target.value })} />
                    </div>
                    <div>
                        <label className={labelClass}>Start Date</label>
                        <input className={inputClass} placeholder="e.g. Jan 2020" value={newExp.startDate} onChange={e => setNewExp({ ...newExp, startDate: e.target.value })} />
                    </div>
                    <div>
                        <label className={labelClass}>End Date</label>
                        <input className={inputClass} placeholder="e.g. Present" value={newExp.endDate} onChange={e => setNewExp({ ...newExp, endDate: e.target.value })} />
                    </div>
                </div>
                <div className="mb-6 relative">
                    <label className={labelClass}>Description & Achievements</label>
                    <textarea className={`${inputClass} h-28 resize-none`} placeholder="Describe your achievements and impact..." value={newExp.description} onChange={e => setNewExp({ ...newExp, description: e.target.value })} />

                    <button
                        onClick={handleEnhanceBullet}
                        disabled={enhancingBullet || !newExp.description.trim()}
                        className="absolute right-3 top-9 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 disabled:text-slate-300 dark:disabled:text-slate-600 font-medium text-xs flex items-center gap-1 transition-colors bg-white dark:bg-slate-800 p-1 rounded-md shadow-sm border border-indigo-100 dark:border-indigo-900/50"
                        title="Rewrite with AI"
                    >
                        {enhancingBullet ? '✨ Enhancing...' : '✨ Rewrite with AI'}
                    </button>

                    <div className="mt-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">Power Verbs:</span>
                        <div className="inline-flex flex-wrap gap-1.5 mt-1">
                            {['Spearheaded', 'Engineered', 'Optimized', 'Architected', 'Revamped', 'Orchestrated'].map(verb => (
                                <button
                                    key={verb}
                                    onClick={() => setNewExp({ ...newExp, description: newExp.description ? newExp.description.trimEnd() + ` \n• ${verb} ` : `• ${verb} ` })}
                                    className="text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-brand-100 hover:text-brand-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded transition-colors font-semibold"
                                >
                                    +{verb}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <button onClick={handleAdd} className="w-full bg-brand-600 text-white font-bold py-3 rounded-xl hover:bg-brand-700 transition-all shadow-glow hover:shadow-lg active:scale-[0.98]">
                    + Add Experience
                </button>
            </div>
        </div>
    );
};

const EducationSkillsForm = () => {
    const { resumeData, addEducation, removeEducation, addSkill, removeSkill } = useResume();
    const [newEdu, setNewEdu] = useState({ institution: '', degree: '', year: '' });
    const [newSkill, setNewSkill] = useState('');

    // AI Keyword Suggestions State
    const [jdText, setJdText] = useState('');
    const [suggestedSkills, setSuggestedSkills] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    const handleGetSuggestions = async () => {
        if (!jdText.trim()) return;
        setLoadingSuggestions(true);
        try {
            const API_URL = process.env.REACT_APP_AI_API_URL || 'http://localhost:8000';
            const response = await axios.post(`${API_URL}/extract_keywords`, {
                job_description: jdText
            }, {
                headers: { 'x-api-key': process.env.REACT_APP_AI_API_KEY }
            });
            if (response.data.success) {
                // Filter out skills already in resumeData.skills
                const existingLowercase = resumeData.skills.map(s => s.toLowerCase());
                const newSuggestions = response.data.keywords.filter(kw => !existingLowercase.includes(kw.toLowerCase()));
                setSuggestedSkills(newSuggestions);
            }
        } catch (error) {
            console.error('Failed to get suggestions', error);
        } finally {
            setLoadingSuggestions(false);
        }
    };

    const handleAddEdu = () => {
        if (newEdu.institution && newEdu.degree) {
            addEducation(newEdu);
            setNewEdu({ institution: '', degree: '', year: '' });
        }
    };

    const handleAddSkill = (e) => {
        e.preventDefault();
        if (newSkill.trim()) {
            addSkill(newSkill.trim());
            setNewSkill('');
        }
    };

    // ATS Score Calculation
    const calculateATSScore = () => {
        if (!jdText.trim() || suggestedSkills.length === 0) return 0;

        // Combine all resume text into one big string to search for keywords
        const fullResumeText = JSON.stringify(resumeData).toLowerCase();

        // Count how many of the suggested JD keywords are mentioned anywhere in the resume
        let matchedCount = 0;
        suggestedSkills.forEach(skill => {
            if (fullResumeText.includes(skill.toLowerCase())) {
                matchedCount++;
            }
        });

        // The total skills the JD cares about is what the AI extracted + any hardcoded skills the user mapped
        const totalJDKeywords = suggestedSkills.length;
        if (totalJDKeywords === 0) return 0;

        const score = Math.round((matchedCount / totalJDKeywords) * 100);
        return Math.min(score, 100); // Max 100%
    };

    const atsScore = calculateATSScore();

    return (
        <div className="space-y-10 animate-fade-in pb-8">
            {/* Education Section */}
            <section>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">Education</h3>

                {resumeData.education.length > 0 && (
                    <div className="space-y-4 mb-8">
                        {resumeData.education.map(edu => (
                            <div key={edu.id} className="border border-slate-200 p-5 rounded-2xl bg-slate-50 flex justify-between items-start shadow-soft transition-all hover:shadow-soft-lg">
                                <div>
                                    <h4 className="font-bold text-slate-800 text-lg">{edu.degree}</h4>
                                    <p className="text-sm font-medium text-brand-600 mb-1">{edu.institution}</p>
                                    <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Class of {edu.year}</p>
                                </div>
                                <button onClick={() => removeEducation(edu.id)} className="text-red-500 hover:text-red-700 text-sm font-bold bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors">
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-5">Add New Education</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                        <div className="md:col-span-2">
                            <label className={labelClass}>Institution Name</label>
                            <input className={inputClass} placeholder="e.g. Stanford University" value={newEdu.institution} onChange={e => setNewEdu({ ...newEdu, institution: e.target.value })} />
                        </div>
                        <div>
                            <label className={labelClass}>Degree</label>
                            <input className={inputClass} placeholder="e.g. B.S. Computer Science" value={newEdu.degree} onChange={e => setNewEdu({ ...newEdu, degree: e.target.value })} />
                        </div>
                        <div>
                            <label className={labelClass}>Graduation Year</label>
                            <input className={inputClass} placeholder="e.g. 2024" value={newEdu.year} onChange={e => setNewEdu({ ...newEdu, year: e.target.value })} />
                        </div>
                    </div>
                    <button onClick={handleAddEdu} className="w-full bg-brand-600 text-white font-bold py-3 rounded-xl hover:bg-brand-700 transition-all shadow-glow hover:shadow-lg active:scale-[0.98]">
                        + Add Education
                    </button>
                </div>
            </section>

            {/* Skills Section */}
            <section>
                <div className="flex items-end justify-between mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Skills</h3>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm mb-8">
                    <form onSubmit={handleAddSkill} className="flex flex-col sm:flex-row gap-3 mb-6">
                        <div className="flex-1">
                            <input className={inputClass} placeholder="Add a specific skill (e.g. React, Python)" value={newSkill} onChange={e => setNewSkill(e.target.value)} />
                        </div>
                        <button type="submit" className="bg-slate-800 text-white px-6 py-3 font-bold rounded-xl hover:bg-slate-900 transition-all shadow-soft active:scale-[0.98] whitespace-nowrap">
                            Add Skill
                        </button>
                    </form>

                    <div className="flex flex-wrap gap-2">
                        {resumeData.skills.length === 0 ? (
                            <p className="text-sm text-slate-400 italic">No skills added yet.</p>
                        ) : (
                            resumeData.skills.map(skill => (
                                <span key={skill} className="bg-brand-50 border border-brand-200 text-brand-700 px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 shadow-sm group">
                                    {skill}
                                    <button type="button" onClick={() => removeSkill(skill)} className="text-brand-400 hover:text-red-500 focus:outline-none transition-colors">×</button>
                                </span>
                            ))
                        )}
                    </div>
                </div>

                {/* AI Keyword Suggestions & ATS Score */}
                <div className="bg-gradient-to-r from-brand-50 to-indigo-50 border border-brand-100 p-6 rounded-2xl shadow-soft relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h4 className="text-sm font-bold text-brand-800 mb-2 uppercase tracking-wider flex items-center gap-2">
                                ✨ AI Keyword Optimizer
                            </h4>
                            <p className="text-xs text-brand-600 font-medium max-w-xs block">Paste a job description below, and our NLP engine will suggest missing keywords to boost your ATS score.</p>
                        </div>
                        {jdText.trim() && !loadingSuggestions && suggestedSkills.length > 0 && (
                            <div className="text-center bg-white p-3 rounded-2xl border border-brand-100 shadow-soft min-w-[100px] z-10">
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">ATS Match</div>
                                <div className={`text-2xl font-black ${atsScore >= 80 ? 'text-green-500' : atsScore >= 50 ? 'text-orange-500' : 'text-red-500'}`}>
                                    {atsScore}%
                                </div>
                            </div>
                        )}
                    </div>

                    <textarea
                        className={`${inputClass} border-brand-200 focus:border-brand-400 focus:ring-brand-400 mb-3`}
                        placeholder="Paste job description here..."
                        rows="3"
                        value={jdText}
                        onChange={(e) => setJdText(e.target.value)}
                    />
                    <button
                        onClick={handleGetSuggestions}
                        disabled={loadingSuggestions || !jdText.trim()}
                        className="text-white bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 font-bold rounded-xl text-sm px-5 py-3 transition-all shadow-glow hover:shadow-lg active:scale-[0.98] w-full md:w-auto"
                    >
                        {loadingSuggestions ? 'Analyzing with AI...' : 'Generate Suggestions & ATS Score'}
                    </button>

                    {suggestedSkills.length > 0 && (
                        <div className="mt-5 pt-5 border-t border-brand-100">
                            <p className="text-xs font-bold text-brand-800 mb-3">Suggested Keywords (Click to add & boost score):</p>
                            <div className="flex flex-wrap gap-2">
                                {suggestedSkills.map((skill, index) => (
                                    <button
                                        key={index}
                                        onClick={() => { addSkill(skill); setSuggestedSkills(suggestedSkills.filter(s => s !== skill)); }}
                                        className="text-xs border text-brand-700 font-bold border-brand-300 bg-white hover:bg-brand-50 px-3 py-1.5 rounded-full flex items-center gap-1 transition-all shadow-sm active:scale-95 hover:shadow-md"
                                    >
                                        + {skill}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

const ProjectsForm = () => {
    const { resumeData, addProject, removeProject } = useResume();
    const [newProj, setNewProj] = useState({ title: '', link: '', description: '' });

    const handleAdd = () => {
        if (newProj.title) {
            addProject(newProj);
            setNewProj({ title: '', link: '', description: '' });
        }
    };

    return (
        <div className="space-y-10 animate-fade-in pb-8">
            <section>
                <div className="flex items-end justify-between mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Projects</h3>
                </div>

                {resumeData.projects?.length > 0 && (
                    <div className="space-y-4 mb-8">
                        {resumeData.projects.map(proj => (
                            <div key={proj.id} className="border border-slate-200 p-5 rounded-2xl bg-slate-50 flex justify-between items-start shadow-soft transition-all hover:shadow-soft-lg">
                                <div>
                                    <h4 className="font-bold text-slate-800 text-lg mb-1">{proj.title}</h4>
                                    {proj.link && <p className="text-xs font-semibold text-brand-600 mb-2 truncate max-w-[250px]"><a href={proj.link.startsWith('http') ? proj.link : `http://${proj.link}`} target="_blank" rel="noreferrer">{proj.link}</a></p>}
                                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{proj.description}</p>
                                </div>
                                <button onClick={() => removeProject(proj.id)} className="text-red-500 hover:text-red-700 text-sm font-bold bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors ml-4 shrink-0">
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-5">Add New Project</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                        <div className="md:col-span-2">
                            <label className={labelClass}>Project Title</label>
                            <input className={inputClass} placeholder="e.g. AI Resume Builder" value={newProj.title} onChange={e => setNewProj({ ...newProj, title: e.target.value })} />
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClass}>Link (Optional)</label>
                            <input className={inputClass} placeholder="e.g. github.com/user/project" value={newProj.link} onChange={e => setNewProj({ ...newProj, link: e.target.value })} />
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClass}>Description</label>
                            <textarea className={`${inputClass} h-24 resize-none`} placeholder="Briefly describe what you built and tech used..." value={newProj.description} onChange={e => setNewProj({ ...newProj, description: e.target.value })} />
                        </div>
                    </div>
                    <button onClick={handleAdd} className="w-full bg-brand-600 text-white font-bold py-3 rounded-xl hover:bg-brand-700 transition-all shadow-glow hover:shadow-lg active:scale-[0.98]">
                        + Add Project
                    </button>
                </div>
            </section>
        </div>
    );
};

export const ResumePreview = () => {
    const { resumeData } = useResume();
    const theme = resumeData.theme || 'modern';

    const getThemeStyles = () => {
        switch (theme) {
            case 'classic':
                return {
                    wrapper: "bg-white h-full w-full p-12 pb-16 mx-auto text-[12px] font-serif text-black leading-snug",
                    header: "text-center border-b-[2px] border-black pb-4 mb-4",
                    name: "text-4xl font-medium tracking-normal text-black mb-2",
                    contact: "text-black text-xs font-normal flex flex-wrap justify-center gap-x-3",
                    sectionTitle: "text-sm font-bold uppercase border-b border-gray-400 pb-1 mb-2 mt-4 text-black tracking-wider",
                    roleName: "text-[14px] font-bold text-black",
                    dates: "text-black font-normal text-[11px]",
                    company: "text-black font-semibold text-[12px] italic mb-1",
                    textBlock: "text-black text-justify whitespace-pre-line leading-relaxed",
                    skills: "text-black font-normal leading-relaxed"
                };
            case 'minimal':
                return {
                    wrapper: "bg-white h-full w-full p-14 pb-16 mx-auto text-[13px] font-sans text-slate-600 leading-loose",
                    header: "text-left mb-8",
                    name: "text-3xl font-light tracking-wide text-slate-800 mb-1",
                    contact: "text-slate-500 text-xs flex flex-wrap justify-start gap-x-4",
                    sectionTitle: "text-xs font-bold uppercase text-brand-500 tracking-widest mb-3 mt-6",
                    roleName: "text-[14px] font-bold text-slate-800",
                    dates: "text-slate-400 font-medium text-xs",
                    company: "text-slate-600 font-medium text-[13px] mb-2",
                    textBlock: "text-slate-600 text-justify whitespace-pre-line",
                };
            case 'professional':
                return {
                    wrapper: "bg-white h-full w-full p-12 pb-16 mx-auto text-[12px] font-sans text-slate-800 leading-snug",
                    header: "border-b-[4px] border-blue-800 pb-4 mb-5 text-left",
                    name: "text-4xl font-black text-blue-900 mb-2 uppercase tracking-wide",
                    contact: "text-slate-700 text-xs font-semibold flex flex-wrap justify-start gap-x-4",
                    sectionTitle: "text-sm font-bold uppercase text-blue-800 border-b-2 border-blue-100 pb-1 mb-3 mt-5 tracking-wider",
                    roleName: "text-[14px] font-bold text-slate-900",
                    dates: "text-blue-800 font-bold text-[11px] uppercase",
                    company: "text-slate-700 font-semibold text-[13px] mb-1",
                    textBlock: "text-slate-700 text-justify whitespace-pre-line leading-relaxed",
                    skills: "text-slate-700 font-semibold leading-relaxed"
                };
            case 'creative':
                return {
                    wrapper: "bg-slate-50 h-full w-full p-12 pb-16 mx-auto text-[13px] font-sans text-slate-800 leading-relaxed",
                    header: "bg-indigo-600 text-white p-8 rounded-2xl mb-6 text-center shadow-lg",
                    name: "text-4xl font-black tracking-widest text-white mb-2",
                    contact: "text-indigo-100 text-xs font-medium flex flex-wrap justify-center gap-x-4",
                    sectionTitle: "text-sm font-black uppercase text-indigo-600 mb-3 mt-6 tracking-widest bg-indigo-50 inline-block px-3 py-1 rounded-lg",
                    roleName: "text-[15px] font-bold text-slate-900",
                    dates: "text-indigo-500 font-bold text-xs uppercase",
                    company: "text-slate-600 font-medium text-[13px] italic mb-1",
                    textBlock: "text-slate-700 whitespace-pre-line",
                    skills: "text-slate-700 font-medium leading-relaxed bg-white p-4 rounded-xl shadow-sm border border-slate-100"
                };
            case 'elegant':
                return {
                    wrapper: "bg-[#FAFAFA] h-full w-full p-14 pb-16 mx-auto text-[12px] font-serif text-gray-800 leading-loose",
                    header: "text-center mb-8",
                    name: "text-4xl font-serif font-light text-[#D4AF37] mb-2 tracking-widest",
                    contact: "text-gray-500 text-[11px] uppercase tracking-widest flex flex-wrap justify-center gap-x-5",
                    sectionTitle: "text-xs font-bold uppercase border-t border-b border-[#D4AF37] py-1 mb-4 mt-6 text-gray-800 tracking-widest text-center",
                    roleName: "text-[13px] font-bold text-gray-900 uppercase",
                    dates: "text-gray-500 font-medium text-[10px] uppercase tracking-widest",
                    company: "text-[#D4AF37] font-serif italic text-[13px] mb-2",
                    textBlock: "text-gray-700 text-justify whitespace-pre-line",
                    skills: "text-gray-700 font-medium leading-relaxed text-center"
                };
            case 'energetic':
                return {
                    wrapper: "bg-white h-full w-full p-10 pb-16 mx-auto text-[13px] font-sans text-gray-900 leading-snug",
                    header: "border-l-[8px] border-orange-500 pl-6 mb-8",
                    name: "text-5xl font-black text-gray-900 mb-2 uppercase",
                    contact: "text-orange-600 font-bold text-xs flex flex-wrap justify-start gap-x-4",
                    sectionTitle: "text-lg font-black uppercase text-gray-900 mb-3 mt-6 flex items-center gap-2 before:content-[''] before:w-4 before:h-4 before:bg-orange-500 before:inline-block",
                    roleName: "text-[16px] font-black text-gray-900",
                    dates: "text-orange-500 font-black text-xs uppercase",
                    company: "text-gray-700 font-bold text-[14px] mb-1",
                    textBlock: "text-gray-800 whitespace-pre-line font-medium",
                    skills: "text-gray-800 font-bold leading-relaxed"
                };
            case 'technical':
                return {
                    wrapper: "bg-black h-full w-full p-10 pb-16 mx-auto text-[12px] font-mono text-green-400 leading-tight border border-green-800",
                    header: "border-b border-green-500 pb-4 mb-4",
                    name: "text-3xl font-bold text-green-300 mb-2",
                    contact: "text-green-500 text-[10px] flex flex-wrap justify-start gap-x-4",
                    sectionTitle: "text-sm font-bold text-green-300 mb-2 mt-4 uppercase border-b border-green-800 pb-1 flex items-center before:content-['>_'] before:mr-2",
                    roleName: "text-[13px] font-bold text-green-200",
                    dates: "text-green-600 font-normal text-[10px]",
                    company: "text-green-500 font-normal text-[12px] mb-1",
                    textBlock: "text-green-400 whitespace-pre-line",
                    skills: "text-green-400 font-normal leading-relaxed"
                };
            case 'executive':
                return {
                    wrapper: "bg-white h-full w-full p-12 pb-16 mx-auto text-[12.5px] font-serif text-slate-800 leading-relaxed",
                    header: "text-center mb-8 bg-slate-900 p-8 rounded-sm",
                    name: "text-4xl font-serif text-white mb-2 tracking-wide",
                    contact: "text-slate-300 text-xs flex flex-wrap justify-center gap-x-4",
                    sectionTitle: "text-sm font-bold uppercase border-b-2 border-slate-900 pb-1 mb-4 mt-8 text-slate-900 tracking-widest",
                    roleName: "text-[14px] font-bold text-slate-900",
                    dates: "text-slate-500 font-semibold text-xs",
                    company: "text-slate-800 font-semibold text-[13px] italic mb-2",
                    textBlock: "text-slate-700 text-justify whitespace-pre-line",
                    skills: "text-slate-700 font-medium leading-relaxed"
                };
            case 'startup':
                return {
                    wrapper: "bg-white h-full w-full p-10 pb-16 mx-auto text-[13px] font-sans text-gray-700 leading-relaxed",
                    header: "text-left border-b-4 border-fuchsia-500 pb-4 mb-6",
                    name: "text-4xl font-black text-gray-900 tracking-tight mb-2",
                    contact: "text-gray-500 text-xs font-semibold flex flex-wrap justify-start gap-x-3",
                    sectionTitle: "text-sm font-black uppercase text-fuchsia-600 mb-4 mt-6 tracking-wide",
                    roleName: "text-[15px] font-bold text-gray-900",
                    dates: "text-fuchsia-500 font-bold text-xs uppercase bg-fuchsia-50 px-2 py-0.5 rounded-md",
                    company: "text-gray-800 font-bold text-[13px] mb-2 mt-1",
                    textBlock: "text-gray-600 whitespace-pre-line",
                    skills: "text-gray-700 font-bold leading-relaxed"
                };
            default: // modern
                return {
                    wrapper: "bg-white h-full w-full p-10 pb-16 mx-auto text-[13px] font-sans text-slate-800 leading-relaxed",
                    header: "text-center border-b-[1.5px] border-slate-900 pb-5 mb-5",
                    name: "text-4xl font-serif font-black uppercase tracking-widest text-slate-900 mb-3",
                    contact: "text-slate-600 mt-2 flex flex-wrap justify-center items-center gap-x-4 gap-y-1 font-medium text-xs",
                    sectionTitle: "text-sm font-bold uppercase border-b border-slate-300 pb-1 mb-4 mt-6 text-slate-900 tracking-wider",
                    roleName: "text-[14px] font-bold text-slate-900",
                    dates: "text-slate-600 font-bold text-xs uppercase tracking-wide",
                    company: "font-bold text-slate-700 italic text-xs mb-2",
                    textBlock: "text-slate-700 text-justify whitespace-pre-line",
                    skills: "text-slate-700 font-medium leading-relaxed"
                };
        }
    };

    const s = getThemeStyles();

    return (
        <div className={s.wrapper} id="resume-preview">
            <header className={s.header}>
                <h1 className={s.name}>{resumeData.contact.fullName || 'YOUR NAME'}</h1>
                <div className={s.contact}>
                    {resumeData.contact.email && <span>{resumeData.contact.email}</span>}
                    {resumeData.contact.phone && <span>• {resumeData.contact.phone}</span>}
                    {resumeData.contact.linkedin && <span>• {resumeData.contact.linkedin}</span>}
                </div>
            </header>

            {resumeData.summary && (
                <section>
                    <h2 className={s.sectionTitle}>Professional Summary</h2>
                    <p className={s.textBlock}>{resumeData.summary}</p>
                </section>
            )}

            {resumeData.experience.length > 0 && (
                <section>
                    <h2 className={s.sectionTitle}>Experience</h2>
                    <div className="space-y-4">
                        {resumeData.experience.map(exp => (
                            <div key={exp.id}>
                                <div className="flex justify-between items-baseline mb-0.5">
                                    <h3 className={s.roleName}>{exp.role}</h3>
                                    <span className={s.dates}>{exp.startDate} – {exp.endDate}</span>
                                </div>
                                <div className={s.company}>{exp.company}</div>
                                <p className={s.textBlock}>{exp.description}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {resumeData.projects?.length > 0 && (
                <section>
                    <h2 className={s.sectionTitle}>Projects</h2>
                    <div className="space-y-4">
                        {resumeData.projects.map(proj => (
                            <div key={proj.id}>
                                <div className="flex justify-between items-baseline mb-0.5">
                                    <h3 className={s.roleName}>{proj.title}</h3>
                                    {proj.link && <span className={s.dates}><a href={proj.link.startsWith('http') ? proj.link : `https://${proj.link}`} target="_blank" rel="noreferrer" className="hover:underline">{proj.link.replace(/^https?:\/\//, '')}</a></span>}
                                </div>
                                <p className={s.textBlock}>{proj.description}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {resumeData.education.length > 0 && (
                <section>
                    <h2 className={s.sectionTitle}>Education</h2>
                    <div className="space-y-3">
                        {resumeData.education.map(edu => (
                            <div key={edu.id}>
                                <div className="flex justify-between items-baseline mb-0.5">
                                    <h3 className={s.roleName}>{edu.degree}</h3>
                                    <span className={s.dates}>{edu.year}</span>
                                </div>
                                <div className={s.textBlock}>{edu.institution}</div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {resumeData.skills.length > 0 && (
                <section>
                    <h2 className={s.sectionTitle}>Skills</h2>
                    <p className={s.skills}>{resumeData.skills.join(' • ')}</p>
                </section>
            )}
        </div>
    );
};

const ResumeBuilder = () => {
    const [activeTab, setActiveTab] = useState('contact');
    const { saveToCloud, isSaving, lastSaved, resumeData, updateTheme, importFromLinkedIn, importPrebuiltResume } = useResume();
    const [uploading, setUploading] = useState(false);
    const [zoom, setZoom] = useState(100);

    const handleDownloadPdf = async () => {
        const element = document.getElementById('resume-preview');
        if (!element) return;

        try {
            const canvas = await html2canvas(element, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');

            // Note: jsPDF needs to be imported if used, but let's assume it's globally available or we just skip it if it's not defined
            // Since jsPDF is imported at the top, this should work.
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save('resume.pdf');
        } catch (error) {
            console.error('Failed to generate PDF', error);
        }
    };

    const handleLinkedInUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size must be under 5MB.');
            return;
        }

        setUploading(true);
        const l_toast = toast.loading('Extracting LinkedIn data...');
        const success = await importFromLinkedIn(file);
        toast.dismiss(l_toast);
        setUploading(false);
        if (success) toast.success('LinkedIn profile imported successfully!');
        else toast.error('Failed to parse LinkedIn PDF. Please try again.');
        e.target.value = null; // reset
    };

    const TabButton = ({ id, label }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-wide transition-all ${activeTab === id
                ? 'text-brand-600 border-b-[3px] border-brand-600 bg-white'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border-b-[3px] border-transparent'
                }`}
        >
            {label}
        </button>
    );

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-900 font-sans">
            <Toaster position="top-right" />
            {/* Sidebar Tools */}
            <aside className="w-[420px] bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] z-10 shrink-0">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-xl font-black text-slate-800 dark:text-gray-100 flex items-center gap-2 mb-4">
                        <PenTool className="text-brand-600" size={24} />
                        Builder
                    </h2>
                    <div className="flex gap-2 relative">
                        {/* LinkedIn Import */}
                        <label className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-bold border ${uploading ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:border-slate-700' : 'bg-[#0077b5]/10 border-[#0077b5]/20 text-[#0077b5] hover:bg-[#0077b5]/20 cursor-pointer'} transition-colors`}>
                            {uploading ? <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div> : <Linkedin size={16} />}
                            {uploading ? 'Importing...' : 'LinkedIn'}
                            <input type="file" accept=".pdf" className="hidden" onChange={handleLinkedInUpload} disabled={uploading} />
                        </label>

                        {/* Prebuilt PDF Import */}
                        <label className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-bold border ${uploading ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:border-slate-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400 cursor-pointer'} transition-colors`}>
                            <UploadCloud size={16} />
                            Prebuilt PDF
                            <input type="file" accept=".pdf" className="hidden" onChange={async (e) => {
                                const file = e.target.files[0];
                                if (!file) return;
                                if (file.size > 5 * 1024 * 1024) return toast.error('File must be under 5MB');
                                setUploading(true);
                                const l_toast = toast.loading('Parsing PDF using AI...');
                                const success = await importPrebuiltResume(file);
                                toast.dismiss(l_toast);
                                setUploading(false);
                                if (success) toast.success('Imported successfully!');
                                else toast.error('Failed to parse PDF.');
                                e.target.value = null;
                            }} disabled={uploading} />
                        </label>
                    </div>
                </div>

                <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 sticky top-0 z-20 shadow-sm flex-wrap text-center">
                    <TabButton id="contact" label="1. Profile" />
                    <TabButton id="experience" label="2. Experience" />
                    <TabButton id="education" label="3. Education" />
                    <TabButton id="projects" label="4. Projects" />
                </div>

                <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                    {activeTab === 'contact' && <ContactForm />}
                    {activeTab === 'experience' && <ExperienceForm />}
                    {activeTab === 'education' && <EducationSkillsForm />}
                    {activeTab === 'projects' && <ProjectsForm />}
                </div>
            </aside>

            <div className="flex-1 bg-slate-200 dark:bg-slate-800 overflow-y-auto overflow-x-auto flex flex-col items-center p-8 custom-scrollbar">
                <div className="w-[210mm] flex justify-between items-center mb-6 sticky top-0 z-20">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={saveToCloud}
                            disabled={isSaving}
                            className="bg-slate-800 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-900 transition-all shadow-md active:scale-95 disabled:bg-slate-500"
                        >
                            {isSaving ? 'Saving...' : '💾 Save to Cloud'}
                        </button>
                        {lastSaved && (
                            <span className="text-xs font-semibold text-slate-500">
                                Last saved: {lastSaved.toLocaleTimeString()}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1.5 shadow-sm mr-2">
                            <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="text-slate-400 hover:text-brand-600 font-bold px-1.5" disabled={zoom <= 50}>-</button>
                            <span className="text-xs font-bold text-slate-600 w-9 text-center">{zoom}%</span>
                            <input type="range" min="50" max="150" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-16 accent-brand-600 cursor-pointer" />
                            <button onClick={() => setZoom(z => Math.min(150, z + 10))} className="text-slate-400 hover:text-brand-600 font-bold px-1.5" disabled={zoom >= 150}>+</button>
                        </div>

                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wide hidden xl:block">Theme:</label>
                        <select
                            value={resumeData.theme || 'modern'}
                            onChange={(e) => updateTheme(e.target.value)}
                            className="bg-white border text-sm font-bold border-slate-300 text-slate-700 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm cursor-pointer"
                        >
                            <option value="modern">Modern</option>
                            <option value="classic">Classic</option>
                            <option value="minimal">Minimal</option>
                            <option value="professional">Professional</option>
                            <option value="creative">Creative</option>
                            <option value="elegant">Elegant</option>
                            <option value="energetic">Energetic</option>
                            <option value="technical">Technical</option>
                            <option value="executive">Executive</option>
                            <option value="startup">Startup</option>
                        </select>
                        <button onClick={handleDownloadPdf} className="bg-brand-600 ml-1 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-brand-700 transition-all shadow-md active:scale-95">
                            <Download size={18} /> Export PDF
                        </button>
                    </div>
                </div>
                {/* A4 Paper Container with Zoom */}
                <div
                    className="origin-top"
                    style={{ transform: `scale(${zoom / 100})`, transition: 'transform 0.15s ease-out' }}
                >
                    <div className="w-[210mm] min-h-[297mm] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] bg-white shrink-0 mb-12 ring-1 ring-slate-900/5">
                        <ResumePreview />
                    </div>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
            `}</style>
        </div>
    );
};

export default ResumeBuilder;
