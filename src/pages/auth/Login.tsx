import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AuthPanel from '../../components/auth/AuthPanel';

const Login = () => {
  const [tab, setTab] = useState<'login' | 'signup'>('login');

  return (
    <div className="min-h-screen bg-navy-50 flex items-center justify-center p-4 relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-navy-500 hover:text-accent-600 mb-6">
            ← Back to home
          </Link>
          <div className="w-14 h-14 bg-accent-500 rounded-2xl flex items-center justify-center font-bold text-white text-2xl mx-auto mb-3 shadow-sm">
            SC
          </div>
          <h1 className="text-2xl font-display font-bold text-navy-900 tracking-tight">Welcome back</h1>
          <p className="text-navy-500 mt-1 text-sm">Login to your SSB Connect account</p>
        </div>

        <AuthPanel tab={tab} onTabChange={setTab} variant="page" />
      </motion.div>
    </div>
  );
};

export default Login;
