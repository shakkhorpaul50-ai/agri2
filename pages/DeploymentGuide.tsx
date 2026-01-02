
import React from 'react';

const DeploymentGuide: React.FC = () => {
  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <section className="bg-slate-900 py-20 text-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-6 text-emerald-400">
            <i className="fas fa-shield-halved text-2xl"></i>
            <span className="font-bold uppercase tracking-widest text-sm">AI Security & Connection</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-6">Connecting Your AI Key</h1>
          <p className="text-xl text-slate-400 leading-relaxed">
            Agricare requires a Gemini API Key to provide localized crop advice and real-time weather grounding. On platforms like Cloudflare, you have two ways to provide this.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 -mt-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-emerald-600 p-8 rounded-3xl shadow-xl text-white">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <i className="fas fa-bolt"></i>
              Method A: Interactive
            </h3>
            <p className="text-sm opacity-90 leading-relaxed mb-6">
              Use the <strong>"Connect Gemini AI"</strong> button on your dashboard. This opens a secure dialog to select your key. It is saved in your browser's context and works instantly without a rebuild.
            </p>
            <div className="bg-white/10 p-4 rounded-xl text-xs font-mono">
              Status: Recommendation
            </div>
          </div>

          <div className="bg-slate-800 p-8 rounded-3xl shadow-xl text-white">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <i className="fas fa-code"></i>
              Method B: Build-Time
            </h3>
            <p className="text-sm opacity-90 leading-relaxed mb-6">
              Set the <code className="bg-slate-700 px-1 rounded">API_KEY</code> in Cloudflare's Environment Variables. Note: You <strong>must</strong> use a build tool like Vite or Webpack to "bake" this key into the JS files.
            </p>
            <div className="bg-white/5 p-4 rounded-xl text-xs font-mono text-slate-400">
              Variable: API_KEY
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Why is my key not working?</h3>
            <p className="text-slate-600 mb-4 leading-relaxed">
              Cloudflare Pages environment variables are <strong>Server-Side</strong> by default. Since Agricare is a Client-Side (React) application, the browser cannot see those variables unless they are explicitly injected during the build step using a tool like <code className="bg-slate-100 px-1 rounded">dotenv</code> or Vite's <code className="bg-slate-100 px-1 rounded">define</code> plugin.
            </p>
            <div className="flex items-center gap-2 text-emerald-600 font-bold">
              <i className="fas fa-check-circle"></i>
              <span>Solution: Use Method A (Interactive Button) for the best experience.</span>
            </div>
          </div>

          <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white">
            <h4 className="text-lg font-bold mb-6">One-Time Setup (Vite / Node)</h4>
            <div className="space-y-4">
               <p className="text-sm text-slate-400 italic">If you are using a standard build script, your build command should look like this:</p>
               <div className="bg-black/50 p-6 rounded-2xl font-mono text-sm border border-white/5">
                 <span className="text-emerald-400"># Cloudflare Build Command</span><br/>
                 API_KEY=$API_KEY vite build
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeploymentGuide;
