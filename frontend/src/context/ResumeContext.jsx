import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const ResumeContext = createContext();

export const useResume = () => useContext(ResumeContext);

export const ResumeProvider = ({ children }) => {
    const [resumeData, setResumeData] = useState({
        title: 'My Resume',
        contact: {
            fullName: 'John Doe',
            phone: '(123) 456-7890',
            email: 'john.doe@example.com',
            linkedin: 'linkedin.com/in/johndoe',
            portfolio: 'johndoe.dev'
        },
        summary: 'A passionate software engineer with experience in building scalable web applications.',
        experience: [],
        education: [],
        skills: [],
        projects: [],
        theme: 'modern'
    });

    const [resumeId, setResumeId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);

    const loadFromCloud = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        setIsLoading(true);
        try {
            const API_URL = process.env.REACT_APP_NODE_API_URL || 'http://localhost:5000/api';
            const { data } = await axios.get(`${API_URL}/resume`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success && data.data) {
                setResumeId(data.data._id);
                const content = data.data.content || {};
                setResumeData({
                    title: content.title || 'My Resume',
                    contact: {
                        fullName: content.contact?.fullName || '',
                        email: content.contact?.email || '',
                        phone: content.contact?.phone || '',
                        linkedin: content.contact?.linkedin || '',
                        portfolio: content.contact?.portfolio || ''
                    },
                    summary: content.summary || '',
                    experience: Array.isArray(content.experience) ? content.experience : [],
                    education: Array.isArray(content.education) ? content.education : [],
                    projects: Array.isArray(content.projects) ? content.projects : [],
                    skills: Array.isArray(content.skills) ? content.skills : [],
                    theme: content.theme || 'modern'
                });
                setLastSaved(new Date());
            } else if (data.success && !data.data) {
                // No resume found, do nothing (keep default state)
            }
        } catch (error) {
            if (error.response?.status !== 404) {
                console.error('Failed to load resume from cloud:', error);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const saveToCloud = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        setIsSaving(true);
        try {
            const API_URL = process.env.REACT_APP_NODE_API_URL || 'http://localhost:5000/api';
            const payload = {
                title: resumeData.title || 'My Resume',
                content: resumeData
            };
            if (resumeId) payload.id = resumeId;

            const { data } = await axios.post(`${API_URL}/resume`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) {
                if (!resumeId) setResumeId(data.data._id);
                setLastSaved(new Date());

                // Trigger background evaluation of global rank
                try {
                    const text = `
                        Summary: ${resumeData.summary || ''}
                        Experience: ${(resumeData.experience || []).map(e => `${e.role} at ${e.company}. ${e.description || ''}`).join(' ')}
                        Education: ${(resumeData.education || []).map(e => `${e.degree} at ${e.institution}. ${e.year || ''}`).join(' ')}
                        Projects: ${(resumeData.projects || []).map(p => `${p.title}. ${p.description || ''}`).join(' ')}
                        Skills: ${(resumeData.skills || []).join(', ')}
                    `;
                    axios.post(`${API_URL}/user/rank`, { resumeText: text }, {
                        headers: { Authorization: `Bearer ${token}` }
                    }).catch(e => console.error('Silent rank evaluation failed', e));
                } catch (e) { }
            }
        } catch (error) {
            console.error('Failed to save resume to cloud:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // Auto-load on mount
    useEffect(() => {
        loadFromCloud();
    }, []);

    const loadResume = (id, content) => {
        setResumeId(id);
        setResumeData({
            title: content.title || 'My Resume',
            contact: {
                fullName: content.contact?.fullName || '',
                email: content.contact?.email || '',
                phone: content.contact?.phone || '',
                linkedin: content.contact?.linkedin || '',
                portfolio: content.contact?.portfolio || ''
            },
            summary: content.summary || '',
            experience: Array.isArray(content.experience) ? content.experience : [],
            education: Array.isArray(content.education) ? content.education : [],
            projects: Array.isArray(content.projects) ? content.projects : [],
            skills: Array.isArray(content.skills) ? content.skills : [],
            theme: content.theme || 'modern'
        });
        setLastSaved(new Date());
    };

    const createNewResume = () => {
        setResumeId(null);
        setResumeData({
            title: 'New Resume',
            contact: { fullName: '', phone: '', email: '', linkedin: '', portfolio: '' },
            summary: '',
            experience: [],
            education: [],
            skills: [],
            projects: [],
            theme: 'modern'
        });
        setLastSaved(null);
    };

    const importFromLinkedIn = async (file) => {
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const API_URL = process.env.REACT_APP_AI_API_URL || 'http://localhost:8000';
            const response = await axios.post(`${API_URL}/parse_linkedin`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'x-api-key': process.env.REACT_APP_AI_API_KEY
                }
            });

            if (response.data.success && response.data.data) {
                const aiData = response.data.data;
                const newResumeData = {
                    title: aiData.title || 'LinkedIn Auto-Import',
                    contact: {
                        fullName: aiData.contact?.fullName || '',
                        email: aiData.contact?.email || '',
                        phone: aiData.contact?.phone || '',
                        linkedin: aiData.contact?.linkedin || '',
                        portfolio: aiData.contact?.portfolio || ''
                    },
                    summary: aiData.summary || '',
                    experience: Array.isArray(aiData.experience) ? aiData.experience : [],
                    education: Array.isArray(aiData.education) ? aiData.education : [],
                    projects: Array.isArray(aiData.projects) ? aiData.projects : [],
                    skills: Array.isArray(aiData.skills) ? aiData.skills : [],
                    theme: resumeData.theme || 'modern'
                };

                let savedId = null;
                const token = localStorage.getItem('token');

                if (token) {
                    try {
                        const payload = {
                            title: `LinkedIn Import - ${new Date().toLocaleDateString()}`,
                            content: newResumeData
                        };
                        const NODE_URL = process.env.REACT_APP_NODE_API_URL || 'http://localhost:5000/api';
                        const saveResponse = await axios.post(`${NODE_URL}/resume`, payload, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        if (saveResponse.data.success) {
                            savedId = saveResponse.data.data._id;
                            setLastSaved(new Date());
                        }
                    } catch (e) {
                        console.error('Failed to auto-save to cloud', e);
                    }
                }

                setResumeData(newResumeData);
                setResumeId(savedId);
                return true;
            }
        } catch (error) {
            console.error('LinkedIn Import Failed:', error);
            return false;
        } finally {
            setIsLoading(false);
        }
        return false;
    };

    const importPrebuiltResume = async (file) => {
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const API_URL = process.env.REACT_APP_AI_API_URL || 'http://localhost:8000';
            const NODE_API_URL = process.env.REACT_APP_NODE_API_URL || 'http://localhost:5000/api';
            const token = localStorage.getItem('token');

            // 1. Parse PDF using AI
            const response = await axios.post(`${API_URL}/parse_resume`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'x-api-key': process.env.REACT_APP_AI_API_KEY
                }
            });

            if (response.data.success && response.data.data) {
                const aiData = response.data.data;
                const newResumeData = {
                    title: aiData.title || 'Prebuilt Import',
                    contact: {
                        fullName: aiData.contact?.fullName || '',
                        email: aiData.contact?.email || '',
                        phone: aiData.contact?.phone || '',
                        linkedin: aiData.contact?.linkedin || '',
                        portfolio: aiData.contact?.portfolio || ''
                    },
                    summary: aiData.summary || '',
                    experience: Array.isArray(aiData.experience) ? aiData.experience : [],
                    education: Array.isArray(aiData.education) ? aiData.education : [],
                    projects: Array.isArray(aiData.projects) ? aiData.projects : [],
                    skills: Array.isArray(aiData.skills) ? aiData.skills : [],
                    theme: resumeData.theme || 'modern'
                };

                let savedId = null;

                // 2. Auto-save to cloud so it shows in My Resumes immediately
                if (token) {
                    try {
                        const payload = {
                            title: `Prebuilt PDF - ${new Date().toLocaleDateString()}`,
                            content: newResumeData
                        };
                        const saveResponse = await axios.post(`${NODE_API_URL}/resume`, payload, {
                            headers: { Authorization: `Bearer ${token}` }
                        });

                        if (saveResponse.data.success) {
                            savedId = saveResponse.data.data._id;
                            setLastSaved(new Date());
                        }
                    } catch (e) {
                        console.error('Auto-save failed', e);
                    }
                }

                setResumeData(newResumeData);
                setResumeId(savedId);

                // 3. Immediately Rank (Silent background trigger)
                if (token) {
                    try {
                        const resumeData = response.data.data;
                        const text = `
                            Summary: ${resumeData.summary || ''}
                            Experience: ${(resumeData.experience || []).map(e => `${e.role} at ${e.company}. ${e.description || ''}`).join(' ')}
                            Education: ${(resumeData.education || []).map(e => `${e.degree} at ${e.institution}. ${e.year || ''}`).join(' ')}
                            Projects: ${(resumeData.projects || []).map(p => `${p.title}. ${p.description || ''}`).join(' ')}
                            Skills: ${(resumeData.skills || []).join(', ')}
                        `;
                        axios.post(`${NODE_API_URL}/user/rank`, { resumeText: text }, {
                            headers: { Authorization: `Bearer ${token}` }
                        }).catch(() => { });
                    } catch (e) { }
                }

                return true;
            }
        } catch (error) {
            console.error('Prebuilt Import Failed:', error);
            return false;
        } finally {
            setIsLoading(false);
        }
        return false;
    };

    const updateContact = (field, value) => {
        setResumeData(prev => ({
            ...prev,
            contact: { ...prev.contact, [field]: value }
        }));
    };

    const updateTheme = (theme) => {
        setResumeData(prev => ({ ...prev, theme }));
    };

    const updateSummary = (value) => {
        setResumeData(prev => ({ ...prev, summary: value }));
    };

    const addExperience = (exp) => {
        setResumeData(prev => ({
            ...prev,
            experience: [...prev.experience, { id: Date.now(), ...exp }]
        }));
    };

    const removeExperience = (id) => {
        setResumeData(prev => ({
            ...prev,
            experience: prev.experience.filter(exp => exp.id !== id)
        }));
    };

    const addEducation = (edu) => {
        setResumeData(prev => ({
            ...prev,
            education: [...prev.education, { id: Date.now(), ...edu }]
        }));
    };

    const removeEducation = (id) => {
        setResumeData(prev => ({
            ...prev,
            education: prev.education.filter(edu => edu.id !== id)
        }));
    };

    const addSkill = (skill) => {
        if (!resumeData.skills.includes(skill)) {
            setResumeData(prev => ({
                ...prev,
                skills: [...prev.skills, skill]
            }));
        }
    };

    const removeSkill = (skill) => {
        setResumeData(prev => ({
            ...prev,
            skills: prev.skills.filter(s => s !== skill)
        }));
    };

    const addProject = (project) => {
        setResumeData(prev => ({
            ...prev,
            projects: [...(prev.projects || []), { id: Date.now(), ...project }]
        }));
    };

    const removeProject = (id) => {
        setResumeData(prev => ({
            ...prev,
            projects: (prev.projects || []).filter(proj => proj.id !== id)
        }));
    };

    return (
        <ResumeContext.Provider value={{
            resumeData,
            updateContact,
            updateSummary,
            addExperience,
            removeExperience,
            addEducation,
            removeEducation,
            addSkill,
            removeSkill,
            addProject,
            removeProject,
            updateTheme,
            saveToCloud,
            loadFromCloud,
            loadResume,
            createNewResume,
            importFromLinkedIn,
            importPrebuiltResume,
            resumeId,
            isSaving,
            isLoading,
            lastSaved
        }}>
            {children}
        </ResumeContext.Provider>
    );
};
