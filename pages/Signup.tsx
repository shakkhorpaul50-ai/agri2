
import React, { useState } from 'react';
import { User } from '../types';

interface SignupProps {
  onSignup: (user: User) => void;
  onSwitchToLogin: () => void;
}

const Signup: React.FC<SignupProps> = ({ onSignup, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    plan: 'premium'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSignup({
      id: Math.random().toString(),
      name: formData.name,
      email: formData.email,
      subscriptionPlan: formData.plan as any,
      subscriptionEnd: '2025-12-31'
    });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl border border-slate-100 shadow-xl">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-100">
            <i className="fas fa-user-plus text-white text-2xl"></i>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">Join Agricare</h2>
          <p className="mt-2 text-sm text-slate-500">Start your 30-day free trial today</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder="John Doe"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
              <input
                type="email"
                required
                className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder="you@farm.com"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Plan</label>
              <select 
                className="block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                value={formData.plan}
                onChange={e => setFormData({...formData, plan: e.target.value})}
              >
                <option value="basic">Basic ($15/mo)</option>
                <option value="premium">Premium ($50/mo) - Best Value</option>
              </select>
            </div>
          </div>

          <div className="text-xs text-slate-500">
            By clicking "Create Account", you agree to our Terms of Service and Privacy Policy. No credit card required for trial.
          </div>

          <button
            type="submit"
            className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 shadow-lg shadow-emerald-100 transition-all active:scale-95"
          >
            Create Account
          </button>
        </form>

        <div className="text-center">
          <p className="text-sm text-slate-500">
            Already have an account?{' '}
            <button onClick={onSwitchToLogin} className="font-bold text-emerald-600 hover:text-emerald-500">Sign in here</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
