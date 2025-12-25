
import React from 'react';

const DeploymentGuide: React.FC = () => {
  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <section className="bg-slate-900 py-20 text-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-6 text-emerald-400">
            <i className="fas fa-gift text-2xl"></i>
            <span className="font-bold uppercase tracking-widest text-sm">Free Deployment Guide</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-6">Deploy Agricare for $0</h1>
          <p className="text-xl text-slate-400 leading-relaxed">
            You don't need a credit card to get Agricare running in production. By combining <strong>Cloudflare Pages</strong> and <strong>Google AI Studio</strong>, you can maintain a professional-grade monitoring system for free.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 -mt-10">
        {/* Free Tier Checklist */}
        <div className="bg-emerald-600 p-8 rounded-3xl shadow-xl mb-12 text-white">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <i className="fas fa-check-double"></i>
            The "Free Forever" Checklist
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 bg-white/10 p-4 rounded-xl">
              <i className="fab fa-github"></i>
              <span>GitHub (Free Repository)</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 p-4 rounded-xl">
              <i className="fas fa-cloud"></i>
              <span>Cloudflare Pages (Free Tier)</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 p-4 rounded-xl">
              <i className="fas fa-brain"></i>
              <span>Google AI Studio (Free API Key)</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 p-4 rounded-xl">
              <i className="fas fa-globe"></i>
              <span>.pages.dev (Free Subdomain)</span>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Step 1 */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex gap-6">
              <div className="shrink-0 w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center font-black text-xl">1</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Host Code on GitHub</h3>
                <p className="text-slate-600 mb-4">Create a free GitHub account and push your code. Cloudflare will watch this repo and redeploy every time you make a change.</p>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-mono text-slate-500">
                  git init<br/>
                  git add .<br/>
                  git commit -m "Initial Agricare deploy"<br/>
                  git push origin main
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex gap-6">
              <div className="shrink-0 w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center font-black text-xl">2</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Cloudflare Pages Settings</h3>
                <p className="text-slate-600 mb-4">When setting up the project in Cloudflare, use these "Zero Build" settings to ensure the free tier handles it easily:</p>
                <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-400 uppercase text-[10px]">Framework Preset</div>
                  <div className="text-slate-900">None</div>
                  <div className="font-bold text-slate-400 uppercase text-[10px]">Build Command</div>
                  <div className="text-slate-900">Leave Empty</div>
                  <div className="font-bold text-slate-400 uppercase text-[10px]">Output Directory</div>
                  <div className="text-slate-900">. (The root dot)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex gap-6">
              <div className="shrink-0 w-12 h-12 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center font-black text-xl">3</div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-slate-900">Get Your Free AI Key</h3>
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded">MOST IMPORTANT</span>
                </div>
                <p className="text-slate-600 mb-4">Go to <a href="https://aistudio.google.com" target="_blank" className="text-blue-600 underline">Google AI Studio</a> and click "Get API Key". It's free for up to 1,500 requests per day—more than enough for a large farm.</p>
                <div className="bg-slate-900 p-6 rounded-2xl text-white">
                  <div className="text-xs font-bold text-slate-400 uppercase mb-2">Cloudflare Dashboard</div>
                  <div className="text-sm text-emerald-400 font-mono">Environment Variable: API_KEY</div>
                  <div className="text-xs text-slate-500 mt-2 italic">Cloudflare encrypts this so your key stays secret.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex gap-6">
              <div className="shrink-0 w-12 h-12 bg-orange-100 text-orange-700 rounded-2xl flex items-center justify-center font-black text-xl">4</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Enable PWA (Mobile App)</h3>
                <p className="text-slate-600 mb-6">Once your site is live (e.g., <code>agricare.pages.dev</code>), open it on your phone's browser and click <strong>"Add to Home Screen"</strong>. You now have a free mobile app!</p>
                <div className="flex items-center gap-4 text-slate-400 grayscale">
                   <i className="fab fa-apple text-3xl"></i>
                   <i className="fab fa-android text-3xl"></i>
                   <span className="text-xs font-medium uppercase tracking-widest">Works Everywhere</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-slate-500 text-sm">Need a custom domain? Cloudflare allows you to connect <code>.com</code> or <code>.org</code> domains for free (you only pay the domain registrar).</p>
        </div>
      </div>
    </div>
  );
};

export default DeploymentGuide;
