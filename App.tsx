
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Overview from './pages/Dashboard/Overview';
import Sensors from './pages/Dashboard/Sensors';
import Management from './pages/Dashboard/Management';
import IntelligenceHub from './pages/Dashboard/IntelligenceHub';
import Vision from './pages/Dashboard/Vision';
import HowItWorks from './pages/HowItWorks';
import PublicDashboard from './pages/PublicDashboard';
import Pricing from './pages/Pricing';
import FeaturesPublic from './pages/FeaturesPublic';

import { User } from './types';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('agricare_session');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('agricare_session') !== null);
  const [activeTab, setActiveTab] = useState(() => {
    const h = window.location.hash.replace('#', '');
    return h || (localStorage.getItem('agricare_session') ? 'dashboard' : 'home');
  });

  useEffect(() => {
    const handleHash = () => {
      const h = window.location.hash.replace('#', '');
      setActiveTab(h || (isLoggedIn ? 'dashboard' : 'home'));
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [isLoggedIn]);

  const navigateTo = (tab: string) => { window.location.hash = tab; };

  const handleLogin = (user: User) => {
    localStorage.setItem('agricare_session', JSON.stringify(user));
    setCurrentUser(user);
    setIsLoggedIn(true);
    navigateTo('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('agricare_session');
    setCurrentUser(null);
    setIsLoggedIn(false);
    navigateTo('home');
  };

  const renderContent = () => {
    const auth = (comp: React.ReactNode) => isLoggedIn ? comp : <Login onLogin={handleLogin} onSwitchToSignup={() => navigateTo('signup')} />;

    switch (activeTab) {
      case 'home': return <Home onGetStarted={() => navigateTo('signup')} />;
      case 'login': return <Login onLogin={handleLogin} onSwitchToSignup={() => navigateTo('signup')} />;
      case 'signup': return <Signup onSignup={handleLogin} onSwitchToLogin={() => navigateTo('login')} />;
      case 'how-it-works': return <HowItWorks />;
      case 'pricing': return <Pricing />;
      case 'features': return <FeaturesPublic onNavigate={navigateTo} />;
      case 'public-demo': return <PublicDashboard />;
      
      case 'dashboard': return auth(<Overview user={currentUser!} />);
      case 'intelligence': return auth(<IntelligenceHub user={currentUser!} />);
      case 'vision': return auth(<Vision user={currentUser!} />);
      case 'management': return auth(<Management user={currentUser!} />);
      case 'sensors': return auth(<Sensors user={currentUser!} />);
      
      default: return <Home onGetStarted={() => navigateTo('signup')} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar activeTab={activeTab} setActiveTab={navigateTo} isLoggedIn={isLoggedIn} onLogout={handleLogout} />
      <main className="flex-grow animate-in fade-in duration-500">
        {renderContent()}
      </main>
      <Footer onNavigate={navigateTo} />
    </div>
  );
};

export default App;
