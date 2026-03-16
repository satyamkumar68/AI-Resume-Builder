const asyncHandler = require('express-async-handler');
const axios = require('axios');
const User = require('../models/User');
const Resume = require('../models/Resume');
const JobApplication = require('../models/JobApplication');
const Interview = require('../models/Interview');

const getUserAnalytics = asyncHandler(async (req, res) => {
    const userId = req.user._id; // Fixed: use _id consistently

    // 1. Fetch data
    const resumes = await Resume.find({ user: userId }).sort({ updatedAt: -1 });
    const jobs = await JobApplication.find({ user: userId }).sort({ updatedAt: -1 });
    const interviews = await Interview.find({ user: userId }).sort({ updatedAt: -1 });

    // 2. Top Stats Calculations
    const totalInterviews = interviews.length;

    // Average Resume Score
    let avgMatchScore = 0;
    const scoredResumes = resumes.filter(r => r.analysisAnalysis && r.analysisAnalysis.score > 0);
    if (scoredResumes.length > 0) {
        const totalScore = scoredResumes.reduce((sum, r) => sum + r.analysisAnalysis.score, 0);
        avgMatchScore = Math.round(totalScore / scoredResumes.length);
    }

    // ATS Keyword Hits (Just an example metric based on resume length or actual keyword matches)
    let atsHits = 0;
    if (scoredResumes.length > 0 && scoredResumes[0].analysisAnalysis) {
        // If we saved matched keywords somewhere, we'd use it. For now, we'll estimate based on content length or default.
        atsHits = scoredResumes[0].content?.skills?.length * 5 || 24; // Mock calculation based on actual skill count
    } else {
        atsHits = resumes.length > 0 ? (resumes[0].content?.skills?.length * 3 || 12) : 0;
    }

    // 3. Activity Chart (Last 7 Days)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last7Days.push({
            date: d.toISOString().split('T')[0],
            name: d.toLocaleDateString('en-US', { weekday: 'short' }),
            interviews: 0,
            resumes: 0
        });
    }

    interviews.forEach(int => {
        const dateStr = int.updatedAt.toISOString().split('T')[0];
        const dayObj = last7Days.find(d => d.date === dateStr);
        if (dayObj) dayObj.interviews++;
    });

    resumes.forEach(res => {
        const dateStr = res.updatedAt.toISOString().split('T')[0];
        const dayObj = last7Days.find(d => d.date === dateStr);
        if (dayObj) dayObj.resumes++;
    });

    // 4. Skill Gap Radar
    // We take the latest resume skills, if none, provide default
    let skillData = [];
    if (resumes.length > 0 && resumes[0].content?.skills?.length > 0) {
        const skills = resumes[0].content.skills.slice(0, 6); // Top 6 skills
        skillData = skills.map(skill => ({
            subject: skill.substring(0, 12),
            A: Math.floor(Math.random() * 50) + 70, // Base level 70-120
            fullMark: 150
        }));
    }

    // Fallback if no skills
    if (skillData.length < 3) {
        skillData = [
            { subject: 'Communication', A: 120, fullMark: 150 },
            { subject: 'Teamwork', A: 98, fullMark: 150 },
            { subject: 'Problem Solving', A: 110, fullMark: 150 },
            { subject: 'Adaptability', A: 99, fullMark: 150 },
            { subject: 'Leadership', A: 85, fullMark: 150 },
        ];
    }

    // 5. Recent Activity Feed (Mix of all 3 models)
    let recentActivity = [];

    interviews.slice(0, 3).forEach(int => {
        recentActivity.push({
            type: 'interview',
            title: `Technical Interview (${int.jobRole})`,
            time: int.updatedAt,
            desc: int.overallScore ? `Scored ${int.overallScore}%. ${int.overallFeedback ? int.overallFeedback.substring(0, 50) + '...' : ''}` : 'Mock interview completed.',
            dateObj: new Date(int.updatedAt)
        });
    });

    resumes.slice(0, 3).forEach(res => {
        recentActivity.push({
            type: 'resume',
            title: `Updated "${res.title}"`,
            time: res.updatedAt,
            desc: `Resume saved with ${res.content?.skills?.length || 0} skills listed.`,
            dateObj: new Date(res.updatedAt)
        });
    });

    jobs.slice(0, 3).forEach(j => {
        recentActivity.push({
            type: 'job',
            title: `Job Status: ${j.company}`,
            time: j.updatedAt,
            desc: `Moved role "${j.role}" to ${j.status.toUpperCase()}`,
            dateObj: new Date(j.updatedAt)
        });
    });

    // Sort combined activity by date DESC and take top 5
    recentActivity.sort((a, b) => b.dateObj - a.dateObj);
    recentActivity = recentActivity.slice(0, 5);

    // Format times
    const formatTimeAgo = (date) => {
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " mins ago";
        return Math.floor(seconds) + " seconds ago";
    };

    recentActivity = recentActivity.map(act => ({
        ...act,
        timeAgo: formatTimeAgo(act.dateObj)
    }));

    res.status(200).json({
        success: true,
        data: {
            topStats: {
                interviews: totalInterviews,
                avgScore: avgMatchScore,
                atsHits: atsHits
            },
            activityChart: last7Days,
            skillRadar: skillData,
            recentActivity: recentActivity
        }
    });
});

const saveInterview = asyncHandler(async (req, res) => {
    const { jobRole, results, overallScore, overallFeedback } = req.body;

    // Format questions array combining questions and answers
    const formattedQuestions = results.map(r => ({
        questionText: r.question,
        userAnswer: r.answer,
        aiEvaluation: r.feedback,
        score: r.score
    }));

    const interview = await Interview.create({
        user: req.user._id,
        jobRole: jobRole || 'General Interview',
        questions: formattedQuestions,
        overallScore: overallScore || 0,
        overallFeedback: overallFeedback || 'Completed Mock Interview'
    });

    res.status(201).json({ success: true, data: interview });
});

const saveResumeAnalysis = asyncHandler(async (req, res) => {
    const { score, missingKeywords, feedback } = req.body;
    // Find the latest resume the user worked on
    const resume = await Resume.findOne({ user: req.user._id }).sort({ updatedAt: -1 });
    if (resume) {
        resume.analysisAnalysis = {
            score: score || 0,
            missingKeywords: missingKeywords || [],
            feedback: feedback || 'Analysis completed.'
        };
        await resume.save();
        res.status(200).json({ success: true, data: resume });
    } else {
        res.status(500);
        throw new Error('Server error analyzing resume');
    }
});

const evaluateGlobalRank = asyncHandler(async (req, res) => {
    const { resumeText } = req.body;
    if (!resumeText) {
        return res.status(400).json({ message: 'Resume text is required for ranking' });
    }

    // Call Python AI Engine
    const AI_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';
    const AI_KEY = process.env.AI_API_KEY || 'super-secret-ai-key-2026';

    let aiData;
    try {
        const response = await axios.post(`${AI_URL}/evaluate_global_rank`, {
            resume_text: resumeText
        }, {
            headers: { 'x-api-key': AI_KEY }
        });

        if (!response.data || !response.data.success) {
            return res.status(500).json({ message: 'Failed to evaluate resume from AI' });
        }
        aiData = response.data.data;
    } catch (error) {
        console.error('AI Engine ranking error:', error);
        return res.status(500).json({ message: 'Error communicating with AI Engine' });
    }

    // Deterministic Calculation
    let score = 0;

    // Years Experience (max 400 pts, scales up to 15 years)
    const years = Math.min(aiData.totalYearsExperience || 0, 15);
    score += (years / 15) * 400;

    // Education (max 100 pts)
    const edu = aiData.educationTier || 'None';
    if (edu === 'PhD') score += 100;
    else if (edu === 'Masters') score += 80;
    else if (edu === 'Bachelors') score += 60;
    else if (edu === 'High School') score += 30;

    // Skill Rarity (max 200 pts)
    const rarity = Math.min(aiData.skillRarity || 1, 10);
    score += (rarity / 10) * 200;

    // Impact Metrics (max 200 pts)
    const metrics = Math.min(aiData.impactMetricsCount || 0, 10);
    score += (metrics / 10) * 200;

    // Project Complexity (max 100 pts)
    const proj = Math.min(aiData.projectComplexity || 1, 10);
    score += (proj / 10) * 100;

    score = Math.round(score);

    // Determine Tier
    let tier = 'Bronze';
    if (score >= 850) tier = 'Diamond';
    else if (score >= 700) tier = 'Platinum';
    else if (score >= 500) tier = 'Gold';
    else if (score >= 300) tier = 'Silver';
    else if (score === 0) tier = 'Unranked'; // Edge case where nothing extracted

    // Save to User
    const user = await User.findById(req.user._id);
    if (user) {
        user.globalRankScore = score;
        user.tier = tier;
        await user.save();
    }

    res.json({
        success: true,
        score,
        tier,
        facts: aiData
    });
});

module.exports = {
    getUserAnalytics,
    saveInterview,
    saveResumeAnalysis,
    evaluateGlobalRank
};
