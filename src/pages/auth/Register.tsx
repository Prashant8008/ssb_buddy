import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, User, Users, Brain, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import AuthPanel from '../../components/auth/AuthPanel';

const Register = () => {
  const [tab, setTab] = useState<'login' | 'signup'>('signup');

  return (
    <div className="min-h-screen bg-white text-[#191c1f] flex items-stretch overflow-x-hidden font-sans">
      {/* Form Panel (Left) */}
      <main className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 bg-white z-10 relative">
        <div className="max-w-md w-full py-12">
          {/* Brand Anchor */}
          <Link to="/" className="mb-12 flex items-center gap-3 w-fit group">
            <div className="w-10 h-10 bg-[#000317] flex items-center justify-center rounded-lg shadow-lg group-hover:scale-105 transition-transform">
              <Shield className="text-[#ffe08f] w-5 h-5 fill-current" />
            </div>
            <h1 className="text-xl font-bold text-[#000317] tracking-tight">SSB Connect</h1>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#1A1F36] tracking-tight">Create Your Account</h2>
            <p className="text-sm text-[#6B7280] mt-2">
              Join the elite community of future officers and begin your structured preparation journey.
            </p>
          </div>

          <AuthPanel tab={tab} onTabChange={setTab} variant="page" />
        </div>
      </main>

      {/* Decorative Panel (Right) */}
      <aside className="hidden lg:flex w-1/2 bg-[#000317] relative overflow-hidden flex-col items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-[#000317] via-[#000317]/95 to-[#000317]/80"></div>
        
        {/* Mountain Silhouette Watermark placeholder */}
        <div 
          className="absolute bottom-0 left-0 w-full h-1/2 opacity-10 pointer-events-none bg-cover bg-bottom" 
          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBFABcCRj_orpyt2bKD0MJj26E5nzEEZIYXhOvuqW-Oj-FayWkg1X0hmXKGY5Tuw6ysbm-L1Dtze8S-784U0JdamsQeK-_CSP07C74JwmZwH5zKbqzvplxj0lNAY1cwUzPLYt351G-jgvVv2OpkTs3JWlCWOANI848X8Ouzmj8Bmgb-NeOdDyKqXSMJPDAlG4vL8n76NCAZr4IR-In1QIevvGLOoNQI0P80-SeAsEeXeczb-5XsP_LagBZBIWNDsqo-qEG0bqTrXFg5')" }}
        ></div>

        {/* Content Overlay */}
        <div className="relative z-10 w-full max-w-lg">
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-white tracking-tight">Begin Your Journey</h2>
            <p className="text-sm text-[#7984ad] mt-4 max-w-sm leading-relaxed">
              The path to becoming a Recommended Candidate starts with discipline and the right community.
            </p>
          </div>

          {/* Vertical Timeline */}
          <div className="space-y-8 relative">
            <div className="absolute left-6 top-8 bottom-8 w-px bg-white/10"></div>
            
            {/* Step 1 */}
            <div className="flex items-start gap-6 group">
              <div className="relative z-10 w-12 h-12 flex-shrink-0 rounded-full bg-[#000317] border-2 border-[#ffe08f] flex items-center justify-center text-[#ffe08f] shadow-[0_0_15px_rgba(255,224,143,0.3)] transition-transform group-hover:scale-105">
                <User size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#ffe08f]">Profile</h4>
                <p className="text-xs text-[#7984ad] mt-0.5">Build your officer candidate profile and set your career goals.</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-6 group">
              <div className="relative z-10 w-12 h-12 flex-shrink-0 rounded-full bg-[#000317] border-2 border-white/10 flex items-center justify-center text-[#7984ad] group-hover:border-[#ffe08f] group-hover:text-[#ffe08f] transition-all">
                <Users size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Connect</h4>
                <p className="text-xs text-[#7984ad] mt-0.5">Engage with fellow aspirants and retired officers for peer guidance.</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-6 group">
              <div className="relative z-10 w-12 h-12 flex-shrink-0 rounded-full bg-[#000317] border-2 border-white/10 flex items-center justify-center text-[#7984ad] group-hover:border-[#ffe08f] group-hover:text-[#ffe08f] transition-all">
                <Brain size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Practice</h4>
                <p className="text-xs text-[#7984ad] mt-0.5">Master WAT, SRT, and TAT with structured, timed practice modules.</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start gap-6 group">
              <div className="relative z-10 w-12 h-12 flex-shrink-0 rounded-full bg-[#000317] border-2 border-white/10 flex items-center justify-center text-[#7984ad] group-hover:border-[#ffe08f] group-hover:text-[#ffe08f] transition-all">
                <Award size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Recommended</h4>
                <p className="text-xs text-[#7984ad] mt-0.5">Track your OLQs and get ready for the Call Up letter.</p>
              </div>
            </div>
          </div>

          {/* Motivational Quote */}
          <div className="mt-16 p-6 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
            <p className="text-white italic text-xs sm:text-sm leading-relaxed mb-2">
              "True leadership is not about being in charge. It is about taking care of those in your charge."
            </p>
            <span className="text-[#ffe08f] text-[10px] font-bold uppercase tracking-widest">— SSB Connect Academy</span>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Register;
