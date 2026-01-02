
import React, { useState, useEffect } from 'react';
import { User, Field } from '../../types';
import { generateMockSensorData } from '../../constants';
import { getLiveWeatherAlert, checkAIConnection } from '../../services/gemini';

interface LiveWeather {
  location: string;
  text: string;
  sources: any[];
}

const Overview: React.FC<{ user: User }> = ({ user }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStep, setUpdateStep] = useState('');
  const [fieldCount, setFieldCount] = useState(0);
  const [latestFields, setLatestFields] = useState<Field[]>([]);
  const [aiConnected, setAiConnected] = useState(true);
  
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [weatherAlerts, setWeatherAlerts] = useState<LiveWeather[]>([]);
  
  useEffect(() => {
    setAiConnected(checkAIConnection());
    
    const savedFields = localStorage.getItem('agricare_fields');
    if (savedFields) {
      const allFields: Field[] = JSON.parse(savedFields);
      const userFields = allFields.filter(f => f.user_id === user.id);
      setFieldCount(userFields.length);
      const snapshotFields = userFields.slice(0, 2);
      setLatestFields(snapshotFields);
      
      // Only fetch weather if AI is actually connected
      if (snapshotFields.length > 0 && checkAIConnection()) {
        fetchWeather(snapshotFields);
      }
    }
  }, [user.id]);

  const fetchWeather = async (fields: Field[]) => {
    setLoadingWeather(true);
    const uniqueLocations = Array.from(new Set(fields.map(f => f.location)));
    
    try {
      const alerts = await Promise.all(
        uniqueLocations.map(async (loc) => {
          const result = await getLiveWeatherAlert(loc);
          return {
            location: loc,
            text: result.text,
            sources: result.sources
          };
        })
      );
      setWeatherAlerts(alerts);
    } catch (err) {
      console.error("Failed to load live weather", err);
    } finally {
      setLoadingWeather(false);
    }
  };

  const alerts = [
    { type: 'warning', text: 'Low moisture detected in your primary plots.', time: '2h ago' },
    { type: 'info', text: 'Weekly soil health report ready for review.', time: '5h ago' },
    { type: 'danger', text: 'One of your sensors is currently offline.', time: '1d ago' },
  ];

  const handleUpdateSchedules = () => {
    setIsUpdating(true);
    const steps = [
      'Analyzing recent weather patterns...',
      'Calculating evaporation rates...',
      'Optimizing irrigation cycles...',
      'Finalizing management plan...'
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setUpdateStep(steps[currentStep]);
        currentStep++;
      } else {
        clearInterval(interval);
        setIsUpdating(false);
        setUpdateStep('');
        alert("Success! Schedules updated based on the latest monsoon data. You can view the new prescriptions in the Management Hub.");
      }
    }, 800);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {!aiConnected && (
        <div className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-4 text-amber-800 animate-in slide-in-from-top-4">
          <i className="fas fa-triangle-exclamation text-xl"></i>
          <div className="text-sm">
            <span className="font-bold">AI System Configuration Required:</span> Your deployment environment is missing the <code className="bg-amber-100 px-1 rounded">API_KEY</code>. Live weather and crop diagnostics are currently using localized fallback models.
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user.name}</h1>
          <p className="text-slate-500 text-sm">Here's what's happening on your farm today.</p>
        </div>
        <div className="flex gap-4">
          <div className={`px-4 py-2 rounded-lg text-right border ${aiConnected ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-100 border-slate-200'}`}>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">AI Link</span>
            <span className={`text-xs font-bold ${aiConnected ? 'text-emerald-700' : 'text-slate-400'}`}>
              {aiConnected ? 'Connected' : 'Offline'}
            </span>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-lg text-right">
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest block">Subscription</span>
            <span className="text-sm font-bold text-emerald-900 capitalize">{user.subscriptionPlan}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="text-slate-500 text-sm mb-1">Active Fields</div>
              <div className="text-3xl font-bold text-slate-900">{fieldCount}</div>
              <div className="text-xs text-emerald-600 mt-2 font-medium">
                <i className="fas fa-chart-line mr-1"></i> Data-linked fields
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="text-slate-500 text-sm mb-1">Average Health</div>
              <div className="text-3xl font-bold text-emerald-600">88%</div>
              <div className="text-xs text-slate-400 mt-2 font-medium">Optimal conditions</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="text-slate-500 text-sm mb-1">Yield Forecast</div>
              <div className="text-3xl font-bold text-slate-900">+12%</div>
              <div className="text-xs text-emerald-600 mt-2 font-medium">Trending upwards</div>
            </div>
          </div>

          {/* Field Snapshot */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-900">Recent Field Snapshots</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {latestFields.length > 0 ? latestFields.map(f => {
                const data = generateMockSensorData(f.field_id)[6];
                return (
                  <div key={f.field_id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="font-bold text-slate-800 mb-3 truncate">{f.field_name}</div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-slate-500">Soil Moisture</span>
                      <span className="text-xs font-bold text-slate-900">{data.moisture.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${data.moisture}%` }}></div>
                    </div>
                  </div>
                );
              }) : (
                <div className="col-span-2 text-center py-10 text-slate-400">
                   <p className="text-sm italic">No fields configured yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Real-time Weather Alerts Card */}
          <div className="bg-emerald-900 text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden flex flex-col min-h-[400px]">
            <div className="relative z-10 flex-1">
              <h3 className="font-bold mb-6 flex items-center gap-3 text-emerald-400">
                <i className="fas fa-satellite-dish animate-pulse"></i> Live Agri-Weather Alerts
              </h3>
              
              {loadingWeather ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-24 bg-white/5 rounded-2xl"></div>
                  <div className="h-24 bg-white/5 rounded-2xl"></div>
                </div>
              ) : weatherAlerts.length > 0 ? (
                <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
                  {weatherAlerts.map((alert, idx) => (
                    <div key={idx} className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">{alert.location}</div>
                        <i className="fas fa-cloud-sun-rain text-emerald-500/50"></i>
                      </div>
                      <div className="text-sm leading-relaxed text-emerald-50">{alert.text}</div>
                      
                      {/* Grounding Citations */}
                      {alert.sources.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <div className="text-[9px] font-bold text-emerald-400/60 uppercase mb-2">Data Verified Via:</div>
                          <div className="flex flex-wrap gap-2">
                            {alert.sources.slice(0, 3).map((chunk, cIdx) => (
                              <a 
                                key={cIdx}
                                href={chunk.web?.uri || '#'} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded-md text-emerald-200/70 truncate max-w-[120px]"
                                title={chunk.web?.title}
                              >
                                {chunk.web?.title || 'Weather Source'}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 px-6">
                  <i className="fas fa-sun text-4xl text-emerald-500/30 mb-4"></i>
                  <p className="text-xs text-emerald-100/50 italic">
                    {aiConnected ? 'No fields detected to fetch localized weather data.' : 'AI Configuration required to fetch live weather.'}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-white/5 relative z-10">
              <button 
                onClick={handleUpdateSchedules}
                disabled={isUpdating}
                className={`w-full py-4 rounded-2xl text-sm font-black transition-all flex flex-col items-center justify-center gap-1 ${
                  isUpdating ? 'bg-emerald-700 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 shadow-xl shadow-emerald-950/20 active:scale-95'
                }`}
              >
                {isUpdating ? (
                  <>
                    <div className="flex items-center gap-2"><i className="fas fa-cog fa-spin"></i> Resynchronizing...</div>
                    <div className="text-[10px] opacity-60 font-normal">{updateStep}</div>
                  </>
                ) : (
                  'Recalculate Water Loads'
                )}
              </button>
            </div>
            <i className="fas fa-wind absolute -bottom-8 -right-8 text-9xl text-white/5 pointer-events-none"></i>
          </div>

          {/* Activity Log */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-bold text-slate-900 mb-6">Recent Notifications</h3>
            <div className="space-y-6">
              {alerts.map((a, i) => (
                <div key={i} className="flex gap-4">
                  <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                    a.type === 'warning' ? 'bg-orange-500' : a.type === 'danger' ? 'bg-red-500' : 'bg-blue-500'
                  }`}></div>
                  <div>
                    <div className="text-sm text-slate-800 font-medium leading-snug">{a.text}</div>
                    <div className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
