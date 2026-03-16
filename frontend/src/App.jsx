import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ResumeProvider } from './context/ResumeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LayoutDashboard, FileText, CheckSquare, MessageSquare, Activity, PenTool, LogOut, Sun, Moon, Folder, TrendingUp } from 'lucide-react';
import PageTransition from './components/PageTransition';

// Pages
import ResumeBuilder from './pages/ResumeBuilder';
import ResumeAnalyzer from './pages/ResumeAnalyzer';
import MockInterview from './pages/MockInterview';
import Dashboard from './pages/Dashboard';
import CoverLetter from './pages/CoverLetter';
import JobTracker from './pages/JobTracker';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import PublicProfile from './pages/PublicProfile';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return <div className="h-screen flex items-center justify-center font-bold text-slate-400">Loading...</div>;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return children;
};

const SidebarItem = ({ to, icon: Icon, label }) => {
    const location = useLocation();
    const isActive = location.pathname === to;
    return (
        <Link
            to={to}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${isActive ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400' : 'text-slate-600 hover:bg-brand-50 hover:text-brand-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'}`}
        >
            <Icon size={20} />
            <span>{label}</span>
        </Link>
    );
};

const Sidebar = () => {
    const { logout, user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    return (
        <aside className="w-64 bg-white dark:bg-slate-950 border-r dark:border-slate-800 h-screen hidden md:flex flex-col">
            <div className="p-6">
                <h2 className="text-2xl font-black text-brand-600 dark:text-brand-400 tracking-tight">AI<span className="text-slate-900 dark:text-white">Ready</span></h2>
            </div>
            <nav className="flex-1 px-4 space-y-2 mt-4">
                <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" />
                <SidebarItem to="/builder" icon={FileText} label="Resume Builder" />
                <SidebarItem to="/analyzer" icon={Activity} label="Resume Analyzer" />
                <SidebarItem to="/cover-letter" icon={PenTool} label="Cover Letter" />
                <SidebarItem to="/interview" icon={MessageSquare} label="Mock Interview" />
                <SidebarItem to="/leaderboard" icon={TrendingUp} label="Leaderboard" />
                <SidebarItem to="/jobs" icon={CheckSquare} label="Job Tracker" />
            </nav>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button onClick={toggleTheme} className="p-2 text-slate-400 hover:text-brand-500 hover:bg-slate-50 dark:hover:bg-slate-800 dark:hover:text-brand-400 rounded-lg transition-colors cursor-pointer" title="Toggle Theme">
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <Link to="/profile" className="flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-lg transition-colors group cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-sm overflow-hidden border border-brand-200 dark:border-brand-800">
                        {user?.profilePhoto ? (
                            <img src={user.profilePhoto} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            user?.name?.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate max-w-[80px] group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{user?.name}</div>
                </Link>
                <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors cursor-pointer" title="Sign Out">
                    <LogOut size={18} />
                </button>
            </div>
        </aside>
    );
};

const InternalLayout = ({ children }) => (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900 font-sans transition-colors duration-200">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
            {children}
        </main>
    </div>
);

const AnimatedRoutes = () => {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/u/:id" element={<PublicProfile />} />

                {/* Protected Routes */}
                <Route path="/*" element={
                    <ProtectedRoute>
                        <InternalLayout>
                            <AnimatePresence mode="wait">
                                <Routes location={location} key={location.pathname}>
                                    <Route path="/" element={<PageTransition><Dashboard /></PageTransition>} />
                                    <Route path="/builder" element={<PageTransition><ResumeBuilder /></PageTransition>} />
                                    <Route path="/analyzer" element={<PageTransition><ResumeAnalyzer /></PageTransition>} />
                                    <Route path="/cover-letter" element={<PageTransition><CoverLetter /></PageTransition>} />
                                    <Route path="/interview" element={<PageTransition><MockInterview /></PageTransition>} />
                                    <Route path="/leaderboard" element={<PageTransition><Leaderboard /></PageTransition>} />
                                    <Route path="/jobs" element={<PageTransition><JobTracker /></PageTransition>} />
                                    <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
                                </Routes>
                            </AnimatePresence>
                        </InternalLayout>
                    </ProtectedRoute>
                } />
            </Routes>
        </AnimatePresence>
    );
};

const AppContent = () => {
    const { user } = useAuth();
    return (
        <ResumeProvider key={user?._id || 'guest'}>
            <Router>
                <AnimatedRoutes />
            </Router>
        </ResumeProvider>
    );
};

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
