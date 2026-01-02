
import React from 'react';

const DeploymentGuide: React.FC = () => {
  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <section className="bg-slate-900 py-20 text-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-6 text-emerald-400">
            <i className="fas fa-gift text-2xl"></i>
            <span className="font-bold uppercase tracking-widest text-sm">Deployment Strategy</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-6">Deploying Agricare AI</h1>
          <p className="text-xl text-slate-400 leading-relaxed">
            To ensure the AI system works on your live site (e.g., Cloudflare Pages), you must explicitly inject your <strong>API_KEY</strong> into the frontend bundle. Standard static hosting cannot read environment variables at runtime in the browser.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 -mt-10">
        <div className="bg-emerald-600 p-8 rounded-3xl shadow-xl mb-12 text-white">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <i className="fas fa-triangle-exclamation"></i>
            Important: Client-Side Environment Variables
          </h3>
          <p className="text-sm opacity-90 leading-relaxed">
            Because this application runs entirely in your user's browser, the <code className="bg-emerald-700 px-1 rounded">process.env.API_KEY</code> must be replaced with your actual key <strong>at build time</strong>. If you use "Zero Build" on Cloudflare, the AI will not be able to connect.
          </p>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex gap-6">
              <div className="shrink-0 w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center font-black text-xl">1</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Set Cloudflare Environment Variables</h3>
                <p className="text-slate-600 mb-4">In your Cloudflare Pages Dashboard, navigate to <strong>Settings > Environment Variables</strong>. Add a new variable:</p>
                <div className="bg-slate-900 p-4 rounded-xl font-mono text-sm">
                  <span className="text-emerald-400">Variable Name:</span> API_KEY<br/>
                  <span className="text-emerald-400">Value:</span> [Your Gemini API Key]
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex gap-6">
              <div className="shrink-0 w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center font-black text-xl">2</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Required Build Step</h3>
                <p className="text-slate-600 mb-4">To make the key available to React, you need a build command. If you are using a standard Vite or Create React App setup, use:</p>
                <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-400 uppercase text-[10px]">Build Command</div>
                  <div className="text-slate-900">npm run build</div>
                  <div className="font-bold text-slate-400 uppercase text-[10px]">Output Directory</div>
                  <div className="text-slate-900">dist (or build)</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex gap-6">
              <div className="shrink-0 w-12 h-12 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center font-black text-xl">3</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Vite / Modern Tooling Note</h3>
                <p className="text-slate-600 mb-4">If you are using Vite, you must prefix your variable with <code className="bg-slate-100 px-1 rounded">VITE_</code> and access it via <code className="bg-slate-100 px-1 rounded">import.meta.env.VITE_API_KEY</code>. Agricare's code uses <code className="bg-slate-100 px-1 rounded">process.env.API_KEY</code> to remain compatible with standard Webpack/Node environments.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-12 bg-slate-900 p-8 rounded-[2.5rem] text-center text-white">
          <h4 className="text-lg font-bold mb-4">Troubleshooting</h4>
          <p className="text-sm text-slate-400 mb-6 italic">"AI Advisor is showing Configuration Required"</p>
          <p className="text-xs text-slate-500 leading-relaxed">
            This means the browser cannot find your API key. Open your site's DevTools (F12) and type <code className="text-emerald-400">console.log(process.env.API_KEY)</code>. If it says <code className="text-red-400">undefined</code>, your build process is not successfully injecting the key from Cloudflare's settings into your JavaScript code.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DeploymentGuide;
