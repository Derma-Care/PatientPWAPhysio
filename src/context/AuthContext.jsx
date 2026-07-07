import React, { createContext, useContext, useState, useEffect } from 'react';
import { customerService } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    const savedUser = sessionStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    sessionStorage.setItem('user', JSON.stringify(userData));

  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('user');
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (user?.customerId) {
          const response = await customerService.getProfile(user.customerId);
          setProfile(response.data);
          setDraft(response.data);
          // Only update user in context/storage if you want to overwrite it with profile.
          // Or just update specific missing fields so we don't break the token.
          sessionStorage.setItem('profile', JSON.stringify(response.data));
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user?.customerId) {
        fetchProfile();
    } else {
        setLoading(false);
    }
  }, [user?.customerId]);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, profile, draft }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
