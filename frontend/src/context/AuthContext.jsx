import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    const API_URL = process.env.REACT_APP_NODE_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        const verifyToken = async () => {
            if (token) {
                try {
                    // We need a route just to fetch user profile using token to verify it
                    const { data } = await axios.get(`${API_URL}/auth/profile`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setUser(data);
                    setIsAuthenticated(true);
                } catch (error) {
                    console.error('Initial profile fetch failed', error);
                    // Only log out if we are sure the token is permanently invalid
                    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                        console.log('Token is invalid or expired. Logging out.');
                        logout();
                    } else {
                        console.log('Network error or server restarting. Retaining session token.');
                    }
                }
            }
            setLoading(false);
        };
        verifyToken();
    }, [token, API_URL]);

    const login = async (email, password) => {
        const { data } = await axios.post(`${API_URL}/auth/login`, { email, password });
        if (data.token) {
            localStorage.setItem('token', data.token);
            setToken(data.token);
            setUser({
                ...data,
                id: data._id,
                storedResumes: data.storedResumes || []
            });
            setIsAuthenticated(true);
            return true;
        }
        return false;
    };

    const register = async (name, email, password) => {
        const { data } = await axios.post(`${API_URL}/auth/register`, { name, email, password });
        if (data.token) {
            localStorage.setItem('token', data.token);
            setToken(data.token);
            setUser({
                ...data,
                id: data._id,
                storedResumes: data.storedResumes || []
            });
            setIsAuthenticated(true);
            return true;
        }
        return false;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
    };

    const updateProfile = async (profileData) => {
        try {
            const { data } = await axios.put(`${API_URL}/auth/profile`, profileData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data) {
                setUser({
                    ...data,
                    id: data._id,
                    storedResumes: data.storedResumes || []
                });
                return true;
            }
        } catch (error) {
            console.error('Update profile failed:', error);
            throw error;
        }
        return false;
    };

    const uploadProfileResume = async (file) => {
        try {
            const formData = new FormData();
            formData.append('resume', file);

            const { data } = await axios.post(`${API_URL}/auth/profile/resume`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            if (data) {
                setUser({
                    ...data,
                    id: data._id,
                    storedResumes: data.storedResumes || []
                });
                return true;
            }
        } catch (error) {
            console.error('Upload profile resume failed:', error);
            throw error;
        }
        return false;
    };

    const deleteProfileResume = async (index) => {
        try {
            const { data } = await axios.delete(`${API_URL}/auth/profile/resume/${index}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data) {
                setUser({
                    id: data._id,
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    gender: data.gender,
                    age: data.age,
                    profilePhoto: data.profilePhoto,
                    storedResumes: data.storedResumes || []
                });
                return true;
            }
        } catch (error) {
            console.error('Delete profile resume failed:', error);
            throw error;
        }
        return false;
    };

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated, loading, login, register, logout, updateProfile, uploadProfileResume, deleteProfileResume }}>
            {children}
        </AuthContext.Provider>
    );
};
