import React, { useState, useEffect } from 'react';
import { User, Field, Sensor } from '../../types';
import { DbService } from '../../services/db';

const Overview: React.FC<{ user: User }> = ({ user }) => {
  const [fields, setFields] = useState<Field[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const f = await DbService.getFields(user.id);
      const s = await DbService.getSensors(f.map(field => field.field_id));
      setFields(f);
      setSensors(s);
      setLoading(false);
    };
    load();
  }, [user.id]);

  const activeSensors = sensors.filter(s => s.status === 'active');
  const lowBatteryCount = sensors.filter(s => s.battery_level < 20).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
      <header className="mb-12">
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
          Hello, <span className="text-emerald-600">{user.name.split(' ')[0]}</span>
        </h1>
        <p className="text-slate-500 mt-2 font-medium">Here's what's happening across your farms today.</p>
      </header>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bento-card p-6 bg-white flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl">
              <i className="fas fa-grid-2"></i>
            </div>
            <span className="text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-full">+2 new</span>
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900">{fields.length}</div>
            <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Active Plots</div>
          </div>
        </div>

        <div className="bento-card p-6 bg-white flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl">
              <i className="fas fa-microchip"></i>
            </div>
            <span className="text-blue-600 text-xs font-bold bg-blue-50 px-2 py-1 rounded-full">
              {activeSensors.length} Online
            </span>
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900">{sensors.length}</div>
            <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Total Sensors</div>
          </div>
        </div>

        <div className="bento-card p-6 bg-white flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center text-xl">
              <i className="fas fa-battery-half"></i>
            </div>
            {lowBatteryCount > 0 && (
              <span className="text-red-600 text-xs font-bold bg-red-50 px-2 py-1 rounded-full">
                {lowBatteryCount} Critical
              </span>
            )}
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900">88%</div>
            <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Avg. Battery</div>
          </div>
        </div>

        <div className="bento-card p-6 bg-slate-900 text-white flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-white/10 text-emerald-400 rounded-2xl flex items-center justify-center text-xl">
              <i className="fas fa-cloud-sun"></i>
            </div>
            <span className="text-emerald-400 text-xs font-bold">Live</span>
          </div>
          <div>
            <div className="text-3xl font-bold">29°C</div>
            <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Rajshahi Local</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Field List */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-900">Registered Plots</h2>
            <button className="text-emerald-600 text-sm font-bold hover:underline">View All</button>
          </div>
          <div className="space-y-4">
            {fields.map(field => (
              <div key={field.field_id} className="bento-card p-6 bg-white flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-2xl text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                    <i className="fas fa-leaf"></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{field.field_name}</h3>
                    <p className="text-sm text-slate-400 font-medium">{field.location}</p>
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-bold text-slate-700">{field.size} Hectares</div>
                  <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">
                    {field.soil_type}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                    <i className="fas fa-chevron-right text-xs"></i>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts & Insights Panel */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900">Critical Alerts</h2>
          <div className="space-y-4">
            <div className="p-5 rounded-[2rem] bg-orange-50 border border-orange-100 flex gap-4">
              <div className="w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center shrink-0">
                <i className="fas fa-droplet-slash"></i>
              </div>
              <div>
                <h4 className="font-bold text-orange-900 text-sm">Low Moisture Detected</h4>
                <p className="text-xs text-orange-700/80 mt-1 leading-relaxed">Bogura Potato Project - Sector 4 requires immediate irrigation to maintain yield targets.</p>
              </div>
            </div>
            <div className="p-5 rounded-[2rem] bg-emerald-50 border border-emerald-100 flex gap-4">
              <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shrink-0">
                <i className="fas fa-sparkles"></i>
              </div>
              <div>
                <h4 className="font-bold text-emerald-900 text-sm">Optimization Insight</h4>
                <p className="text-xs text-emerald-700/80 mt-1 leading-relaxed">Soil conditions in Rajshahi are currently optimal for top-dressing Nitrogen fertilizers.</p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-8 bg-slate-900 rounded-[2.5rem] text-white relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-2">Agricare Pro AI</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">Unlock deeper insights with satellite imagery and multispectral analysis.</p>
              <button className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-500/20">
                Upgrade Now
              </button>
            </div>
            <i className="fas fa-rocket absolute -bottom-6 -right-6 text-9xl text-white/5 group-hover:translate-x-4 group-hover:-translate-y-4 transition-transform duration-700"></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;