import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import AuthPanel from '../../components/auth/AuthPanel';

const Register = () => {
  const [tab, setTab] = useState<'login' | 'signup'>('signup');

  return (
    <div className="min-h-screen bg-navy-50 flex items-center justify-center p-4 py-12 relative">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-navy-500 hover:text-accent-600 mb-6">
            ← Back to home
          </Link>
          <div className="w-14 h-14 bg-accent-500 rounded-2xl flex items-center justify-center text-white mx-auto mb-3 shadow-sm">
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-2xl font-display font-bold text-navy-900 tracking-tight">Join the Academy</h1>
          <p className="text-navy-500 mt-1 text-sm">Start your journey towards the Olive Greens</p>
        </div>

        <AuthPanel tab={tab} onTabChange={setTab} variant="page" />
      </motion.div>
    </div>
  );
};

export default Register;
