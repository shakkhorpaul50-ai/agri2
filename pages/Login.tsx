
import React, { useState } from 'react';
import { User } from '../types';
import { loginWithGoogle, isDatabaseEnabled } from '../services/db';

interface LoginProps {
  onLogin: (user: User) => void;
  onSwitchToSignup: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onSwitchToSignup }) => {
  const [isLoading, setIsLoading] = useState(false);
  const dbActive = isDatabaseEnabled();

  const handleGoogleLogin = async () => {
    if (!dbActive) {
      alert("Database is currently offline. Please check your configuration.");
      return;
    }
    setIsLoading(true);
    try {
      const user = await loginWithGoogle();
      if (user) {
        onLogin(user);
      }
    } catch (error: any) {
      console.error("Login Error:", error);
      alert("Login Error: " + (error.message || "Failed to authenticate with Google."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-50/50">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-2xl">
        <div className="text-center">
          <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-100">
            <i className="fas fa-leaf text-white text-3xl"></i>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">স্বাগতম (Welcome)</h2>
          <p className="mt-2 text-sm text-slate-500 font-medium">Access your farm intelligence securely</p>
        </div>
        
        <div className="mt-10 space-y-6">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="group relative w-full flex items-center justify-center gap-4 py-4 px-4 border border-slate-200 text-sm font-bold rounded-2xl text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            )}
            Sign in with Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-xs font-black uppercase tracking-widest">
              <span className="px-2 bg-white text-slate-400">Secured Access</span>
            </div>
          </div>

          <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-50 text-center">
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Agricare uses Google Cloud Identity to ensure your field telemetry and prescriptions are encrypted and accessible only to you.
            </p>
          </div>
        </div>

        <div className="text-center pt-4">
          <p className="text-sm text-slate-400">
            Don't have an account?{' '}
            <button onClick={onSwitchToSignup} className="font-bold text-emerald-600 hover:text-emerald-500">Register here</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
