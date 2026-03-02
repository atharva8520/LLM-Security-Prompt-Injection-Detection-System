import { createContext, useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('llm_token'));
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const initAuth = async () => {
            if (token) {
                try {
                    const res = await axiosClient.get('/auth/me');
                    setUser(res.data.user);
                    setIsAuthenticated(true);
                } catch (error) {
                    logout();
                }
            }
            setIsLoading(false);
        };
        initAuth();
    }, [token]);

    const login = async (email, password) => {
        const res = await axiosClient.post('/auth/login', { email, password });
        localStorage.setItem('llm_token', res.data.token);
        localStorage.setItem('llm_user', JSON.stringify(res.data.user));
        setToken(res.data.token);
        setUser(res.data.user);
        setIsAuthenticated(true);
        return res.data;
    };

    const register = async (username, email, password) => {
        const res = await axiosClient.post('/auth/register', { username, email, password });
        localStorage.setItem('llm_token', res.data.token);
        localStorage.setItem('llm_user', JSON.stringify(res.data.user));
        setToken(res.data.token);
        setUser(res.data.user);
        setIsAuthenticated(true);
        return res.data;
    };

    const logout = () => {
        localStorage.removeItem('llm_token');
        localStorage.removeItem('llm_user');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
