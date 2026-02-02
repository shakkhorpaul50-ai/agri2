
import React from 'react';

interface SignupProps {
  onSignup: (user: any) => void;
  onSwitchToLogin: () => void;
}

const Signup: React.FC<SignupProps> = ({ onSwitchToLogin }) => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-50/50">
      <div className="max-w-md w-full space-y-8 bg-white p-12 rounded-[3rem] border border-slate-100 shadow-2xl text-center">
        <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-100">
          <i className="fas fa-user-plus text-white text-3xl"></i>
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Deploy Your Farm</h2>
        <p className="mt-2 text-slate-500 font-medium">Join thousands of farmers using Agricare across Bangladesh.</p>
        
        <div className="py-10">
          <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 mb-8">
            <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest mb-4">Why Google Sign-In?</h4>
            <ul className="text-left space-y-4">
              <li className="flex gap-3 text-xs font-bold text-slate-600">
                <i className="fas fa-check text-emerald-500"></i> No password to remember
              </li>
              <li className="flex gap-3 text-xs font-bold text-slate-600">
                <i className="fas fa-check text-emerald-500"></i> Secure cloud data encryption
              </li>
              <li className="flex gap-3 text-xs font-bold text-slate-600">
                <i className="fas fa-check text-emerald-500"></i> One-tap across all devices
              </li>
            </ul>
          </div>
          
          <button 
            onClick={onSwitchToLogin}
            className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all transform hover:-translate-y-1 active:scale-95"
          >
            Sign Up with Google
          </button>
        </div>

        <p className="text-sm text-slate-400">
          Already a member?{' '}
          <button onClick={onSwitchToLogin} className="font-bold text-emerald-600 hover:text-emerald-500 transition-colors">Sign in here</button>
        </p>
      </div>
    </div>
  );
};

export default Signup;
