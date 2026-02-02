
import React from 'react';

const Navbar: React.FC<{ activeTab: string, setActiveTab: (t: string) => void, isLoggedIn: boolean, onLogout: () => void }> = ({ activeTab, setActiveTab, isLoggedIn, onLogout }) => {
  const links = isLoggedIn 
    ? [
        { id: 'dashboard', label: 'Overview', icon: 'fa-grid-2' },
        { id: 'intelligence', label: 'Intelligence', icon: 'fa-brain' },
        { id: 'vision', label: 'AI Vision', icon: 'fa-eye' },
        { id: 'management', label: 'Management', icon: 'fa-list-check' },
        { id: 'sensors', label: 'Sensors', icon: 'fa-microchip' }
      ]
    : [
        { id: 'home', label: 'Home' },
        { id: 'how-it-works', label: 'How it Works' },
        { id: 'pricing', label: 'Pricing' },
        { id: 'public-demo', label: 'Public Demo' }
      ];

  return (
    <nav className="sticky top-0 z-[100] px-4 pt-4">
      <div className="max-w-7xl mx-auto glass-card h-20 rounded-[2rem] px-8 flex justify-between items-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/40">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab('home')}>
          <div className="w-11 h-11 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 group-hover:rotate-12 transition-transform">
            <i className="fas fa-leaf text-xl"></i>
          </div>
          <span className="text-2xl font-black text-slate-900 tracking-tighter">Agricare</span>
        </div>

        <div className="hidden md:flex items-center gap-2">
          {links.map(l => (
            <button
              key={l.id}
              onClick={() => setActiveTab(l.id)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === l.id 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <div className="flex items-center gap-4">
              <button onClick={onLogout} className="text-slate-400 hover:text-red-500 font-bold text-sm px-4 py-2 transition-colors">Logout</button>
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 border border-slate-200">
                <i className="fas fa-user text-sm"></i>
              </div>
            </div>
          ) : (
            <button onClick={() => setActiveTab('signup')} className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-sm font-black hover:bg-slate-800 transition-all shadow-xl active:scale-95">
              Get Started
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
