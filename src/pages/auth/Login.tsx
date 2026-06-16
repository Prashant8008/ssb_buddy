import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Shield, Lock, User as UserIcon, ChevronRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    try {
      const response = await axios.post('http://localhost:8001/api/auth/token/', {
        username,
        password
      });
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      // Hard refresh or redirect to home page so App.tsx detects token
      window.location.href = '/';
    } catch (err: any) {
      console.error("Login failed:", err);
      setErrorMsg(err.response?.data?.detail || "Invalid username or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-gold-500 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-army-500 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gold-500 rounded-2xl flex items-center justify-center font-bold text-navy-900 text-3xl mx-auto mb-4 shadow-2xl shadow-gold-500/20">
            SC
          </div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Jai Hind, Aspirant</h1>
          <p className="text-navy-300 mt-2">Login to your SSB Connect account</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          {errorMsg && (
            <div className="mb-6 bg-red-500/20 border border-red-500/50 text-red-200 text-xs font-semibold p-3.5 rounded-2xl">
              {errorMsg}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-xs font-bold text-navy-300 uppercase tracking-wider ml-1">Username</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" />
                <input 
                  type="text" 
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-gold-500 transition-all outline-none"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold text-navy-300 uppercase tracking-wider">Password</label>
                <button type="button" className="text-[10px] font-bold text-gold-500 hover:underline">Forgot Password?</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-gold-500 transition-all outline-none"
                  disabled={isLoading}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 group shadow-xl shadow-gold-500/10 disabled:opacity-55"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} /> Reporting...
                </>
              ) : (
                <>
                  Report for Duty
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-navy-400 text-sm">
              New to the community?{' '}
              <NavLink to="/register" className="text-gold-500 font-bold hover:underline">Create Account</NavLink>
            </p>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-6 text-navy-500 text-xs font-bold uppercase tracking-widest">
          <span>Army</span>
          <div className="w-1 h-1 bg-navy-700 rounded-full" />
          <span>Navy</span>
          <div className="w-1 h-1 bg-navy-700 rounded-full" />
          <span>Air Force</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
