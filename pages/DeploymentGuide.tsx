
import React from 'react';

const DeploymentGuide: React.FC = () => {
  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <section className="bg-slate-900 py-20 text-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-6 text-emerald-400">
            <i className="fas fa-shield-halved text-2xl"></i>
            <span className="font-bold uppercase tracking-widest text-sm">Deployment & AI</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-6">Cloudflare Setup Guide</h1>
          <p className="text-xl text-slate-400 leading-relaxed">
            Because this is a static site, environment variables like <code className="bg-white/10 px-1 rounded">process.env.API_KEY</code> must be injected during your build step on Cloudflare.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 -mt-10">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 mb-12">
          <h3 className="text-2xl font-black text-slate-900 mb-6">Method 1: Shared API Key (Centralized)</h3>
          <p className="text-slate-600 mb-6">Follow these steps in your Cloudflare Pages dashboard to ensure every visitor uses your central API key:</p>
          
          <div className="space-y-6">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="font-bold text-slate-900 mb-2">Step 1: Set Variables</div>
              <p className="text-sm text-slate-500">Go to <strong>Settings > Environment Variables</strong>. Add <strong>API_KEY</strong> with your Gemini Key value.</p>
            </div>
            
            <div className="p-6 bg-slate-900 rounded-2xl border border-emerald-500/20 text-white">
              <div className="font-bold text-emerald-400 mb-2">Step 2: Update Build Command</div>
              <p className="text-sm opacity-80 mb-4">In <strong>Settings > Build & Deploy</strong>, change your "Build Command" to:</p>
              <div className="bg-black p-4 rounded-xl font-mono text-sm border border-white/10">
                API_KEY=$API_KEY npm run build
              </div>
              <p className="text-[10px] text-slate-500 mt-4 italic">Note: This explicitly passes the environment variable into the React bundling process.</p>
            </div>
          </div>
        </div>

        <div className="bg-emerald-600 p-8 rounded-3xl shadow-xl text-white">
          <h3 className="text-2xl font-black mb-4 flex items-center gap-3">
            <i className="fas fa-user-check"></i>
            Method 2: Interactive (Per User)
          </h3>
          <p className="text-sm opacity-90 leading-relaxed mb-6">
            If you don't want to redeploy, simply use the <strong>Connect Gemini AI</strong> button on the dashboard. This allows individual users to provide their own key securely via the browser's native selector.
          </p>
          <div className="bg-white/10 p-4 rounded-xl text-[10px] font-mono uppercase tracking-widest text-center">
            Ideal for Private / Internal usage
          </div>
        </div>
        
        <div className="mt-12 text-center text-slate-400 text-xs italic">
          Need help? Visit <a href="https://ai.google.dev" className="underline hover:text-emerald-500">ai.google.dev</a> to learn more about Gemini API capabilities.
        </div>
      </div>
    </div>
  );
};

export default DeploymentGuide;
