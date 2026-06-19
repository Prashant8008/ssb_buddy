import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ShieldCheck, User, Mail, Lock, Award, ChevronRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthService } from '../../services/api';

const Register = () => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    try {
      await AuthService.register({
        first_name: firstName,
        last_name: lastName,
        username,
        email,
        password,
      });
      // Navigate to login with query param to show success alert
      navigate('/login?registered=true');
    } catch (err: any) {
      console.error("Registration failed:", err);
      // Format backend serializer errors
      if (err.response?.data) {
        const errors = err.response.data;
        const messages = Object.keys(errors).map(key => `${key}: ${errors[key]}`);
        setErrorMsg(messages.join(' | '));
      } else if (!err.response) {
        setErrorMsg('Cannot reach the server. Start Django on http://127.0.0.1:8001');
      } else {
        setErrorMsg('Failed to register account. Please check your inputs.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4 py-12 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-army-500 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-gold-500 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-army-500 rounded-2xl flex items-center justify-center font-bold text-white text-3xl mx-auto mb-4 shadow-2xl shadow-army-500/20">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Join the Academy</h1>
          <p className="text-navy-300 mt-2">Start your journey towards the Olive Greens</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          {errorMsg && (
            <div className="mb-6 bg-red-500/20 border border-red-500/50 text-red-200 text-xs font-semibold p-3.5 rounded-2xl">
              {errorMsg}
            </div>
          )}

          <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-xs font-bold text-navy-300 uppercase tracking-wider ml-1">First Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" />
                <input 
                  type="text" 
                  required
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="First name"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-army-500 transition-all outline-none"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-navy-300 uppercase tracking-wider ml-1">Last Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" />
                <input 
                  type="text" 
                  required
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Last name"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-army-500 transition-all outline-none"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-navy-300 uppercase tracking-wider ml-1">Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" />
                <input 
                  type="text" 
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Choose username"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-army-500 transition-all outline-none"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-navy-300 uppercase tracking-wider ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="aspirant@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-army-500 transition-all outline-none"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-navy-300 uppercase tracking-wider ml-1">Create Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="•••••••• (min 8 chars)"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-army-500 transition-all outline-none"
                  disabled={isLoading}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="md:col-span-2 w-full bg-army-600 hover:bg-army-700 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 group shadow-xl shadow-army-500/10 disabled:opacity-55"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} /> Registering...
                </>
              ) : (
                <>
                  <Award size={20} />
                  Enlist Now
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-navy-400 text-sm">
              Already an aspirant?{' '}
              <NavLink to="/login" className="text-army-400 font-bold hover:underline">Login here</NavLink>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
