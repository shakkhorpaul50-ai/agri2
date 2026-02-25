
import React from 'react';
import { User } from '../../types';
import AICropAdvisor from '../../components/AICropAdvisor';

const Advisor: React.FC<{ user: User }> = ({ user }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900">AI Crop Advisor</h1>
        <p className="text-slate-500 mt-1">Get personalized crop recommendations based on your field's soil profile.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <AICropAdvisor />
      </div>

      <div className="mt-12 bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-500 opacity-5 rounded-full translate-x-20 translate-y-20"></div>
        <div className="relative z-10">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <i className="fas fa-lightbulb text-emerald-400"></i> Pro Tip
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
            For the most accurate results, ensure your soil samples are taken from multiple points across your field. 
            The AI Advisor cross-references your inputs with over 1,000 historical records from BARI and global agricultural datasets 
            to provide high-confidence recommendations.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Advisor;
