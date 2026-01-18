import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, User } from '../api/services';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (token: string, userData: any) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            // With cookies, we just try to fetch the profile. 
            // If it succeeds, we are logged in. If 401, we are not.
            try {
                const profile = await authService.getProfile();
                setUser(profile);
            } catch (error) {
                // Not logged in or session expired
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };
        initAuth();
    }, []);

    const login = (token: string | null, userData: any) => {
        // Token arg is kept for compatibility but ignored for cookies
        setUser(userData);
    };

    const logout = async () => {
        try {
            // Optional: Call backend logout to clear cookies
            // await authService.logout(); 
        } catch (e) {
            console.error(e);
        }
        setUser(null);
        // Clear local storage if any legacy tokens remain
        localStorage.removeItem('jwt_token');
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
