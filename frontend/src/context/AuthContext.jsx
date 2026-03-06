import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

const AuthContext = createContext(null);

/**
 * Append a cache-busting timestamp to a photo URL so the browser
 * always fetches the latest version of the image file.
 */
const bustCache = (url) => {
    if (!url) return null;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${Date.now()}`;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkLogin = async () => {
            const token = localStorage.getItem('access_token');
            if (token) {
                try {
                    const decoded = jwtDecode(token);
                    const isExpired = decoded.exp * 1000 < Date.now();
                    if (!isExpired) {
                        // Fetch full profile (includes photo_url) from backend
                        try {
                            const profileRes = await api.get(`auth/profile/?t=${Date.now()}`);
                            const profileData = {
                                ...profileRes.data,
                                photo_url: bustCache(profileRes.data.photo_url),
                            };
                            setUser({ ...decoded, ...profileData });
                        } catch {
                            setUser(decoded);
                        }
                    } else {
                        localStorage.clear();
                    }
                } catch (err) {
                    localStorage.clear();
                }
            }
            setLoading(false);
        };
        checkLogin();
    }, []);

    const login = async (username, password) => {
        const response = await api.post('auth/login/', { username, password });
        const { access, refresh } = response.data;
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);

        // Decode the JWT — with the fix in get_token(), role etc. are now
        // embedded as JWT claims. We also merge the response body as a
        // fallback for any fields the token might not yet include.
        const decoded = jwtDecode(access);
        const userData = {
            ...decoded,
            // Explicitly pull these from the response body as authoritative
            role: response.data.role ?? decoded.role ?? 'member',
            first_name: response.data.first_name ?? decoded.first_name ?? '',
            last_name: response.data.last_name ?? decoded.last_name ?? '',
            member_id: response.data.member_id ?? decoded.member_id ?? null,
            username: response.data.username ?? decoded.username ?? username,
            photo_url: bustCache(response.data.photo_url),
        };
        setUser(userData);
        return response.data;
    };

    const logout = () => {
        localStorage.clear();
        setUser(null);
    };

    // Allow other components to update user state (e.g. after profile picture upload)
    const updateUser = (updates) => {
        setUser(prev => ({ ...prev, ...updates }));
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
