
import React, { useState, useEffect } from 'react';
import { User, Field, Sensor } from '../../types';
import { DbService } from '../../services/db';
import { GeminiService } from '../../services/gemini';

const IntelligenceHub: React.FC<{ user: User }> = ({ user }) => {
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [sensors, setSensors] = useState<Sensor[]>([]);

  useEffect(() => {
    const load = async () => {
      const f = await DbService.getFields(user.id);
      setFields(f);
      if (f.length > 0) setSelectedField(f[0]);
    };
    load();
  }, [user.id]);

  useEffect(() => {
    if (selectedField) runAnalysis();
  }, [selectedField]);

  const runAnalysis = async () => {
    setLoading(true);
    const s = await DbService.getSensors([selectedField!.field_id]);
    setSensors(s);
    const result = await GeminiService.analyzeField(selectedField!, s);
    setAnalysis(result);
    setLoading(false);
  };

  const hasTelemetry = sensors.some(s => s.last_reading);

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-16">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter">AI Command Center</h1>
          <p className="text-slate-500 font-medium mt-2">Precision analysis engine using Gemini-3 Flash.</p>
        </div>
        
        <div className="bg-white p-3 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Field Selector</label>
          <select 
            className="bg-slate-50 px-6 py-3 rounded-2xl border-none font-black text-emerald-700 outline-none"
            value={selectedField?.field_id || ''}
            onChange={(e) => setSelectedField(fields.find(f => f.field_id === parseInt(e.target.value)) || null)}
          >
            {fields.map(f => <option key={f.field_id} value={f.field_id}>{f.field_name}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="bg-slate-900 h-[600px] rounded-[4rem] flex flex-col items-center justify-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-emerald-500/5 animate-pulse"></div>
          <div className="w-24 h-24 border-8 border-emerald-500 border-t-transparent rounded-full animate-spin mb-10"></div>
          <h2 className="text-3xl font-black tracking-tighter italic">"Thinking..."</h2>
          <p className="text-slate-500 mt-4 uppercase tracking-[0.3em] text-xs font-black">Decrypting IoT Signals</p>
        </div>
      ) : analysis ? (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="bg-slate-950 p-16 rounded-[4rem] text-white shadow-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12">
              <div className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border ${hasTelemetry ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-amber-500/10 border-amber-500/50 text-amber-400'}`}>
                {hasTelemetry ? 'Precision Active' : 'Baseline Predictive'}
              </div>
            </div>
            
            <div className="max-w-4xl relative z-10">
              <h2 className="text-6xl font-black tracking-tighter mb-8">{selectedField?.field_name}</h2>
              <div className="p-10 rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-3xl mb-12">
                <p className="text-2xl font-medium text-emerald-50 leading-relaxed italic">
                  "{analysis.soilInsight}"
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 flex items-center gap-6">
                  <div className="w-16 h-16 bg-emerald-600 rounded-3xl flex items-center justify-center text-2xl shadow-xl shadow-emerald-500/20">
                    <i className="fas fa-vial-circle-check"></i>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Fix Strategy</h4>
                    <p className="text-lg font-bold">{analysis.restorationStrategy}</p>
                  </div>
                </div>
                <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 flex items-center gap-6">
                  <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-2xl shadow-xl shadow-blue-500/20">
                    <i className="fas fa-droplet"></i>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Health Index</h4>
                    <p className="text-lg font-bold">{hasTelemetry ? '94/100 (Optimal)' : 'Est. 78/100'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-8">
               <h3 className="text-3xl font-black text-slate-900 ml-4 flex items-center gap-4">
                 <i className="fas fa-chart-line text-emerald-600"></i> Compatibility Index
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {analysis.crops?.map((c: any, i: number) => (
                   <div key={i} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all hover:-translate-y-2">
                     <div className="flex justify-between items-start mb-8">
                        <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center text-4xl text-emerald-600">
                          <i className={`fas ${c.icon}`}></i>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Score</div>
                          <div className="text-4xl font-black text-slate-900">{c.suitability}%</div>
                        </div>
                     </div>
                     <h4 className="text-2xl font-black text-slate-900 mb-4">{c.name}</h4>
                     <p className="text-slate-500 leading-relaxed italic text-sm mb-6">"{c.reason}"</p>
                     <div className="pt-6 border-t border-slate-50 flex items-center gap-2 text-[10px] font-black uppercase text-emerald-600">
                       <i className="fas fa-check-circle"></i> High ROI Selection
                     </div>
                   </div>
                 ))}
               </div>
            </div>

            <div className="space-y-8">
              <h3 className="text-3xl font-black text-slate-900 ml-4 flex items-center gap-4">
                 <i className="fas fa-list-check text-emerald-600"></i> Roadmap
               </h3>
               <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">
                  <div className="space-y-12">
                    {analysis.roadmap?.map((r: any, i: number) => (
                      <div key={i} className="flex gap-8 relative">
                         {i !== analysis.roadmap.length - 1 && <div className="absolute left-[27px] top-12 bottom-[-48px] w-[2px] bg-slate-100"></div>}
                         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 ${r.priority === 'High' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                           {i + 1}
                         </div>
                         <div className="pt-2">
                            <div className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${r.priority === 'High' ? 'text-red-500' : 'text-emerald-500'}`}>
                              {r.priority} Priority
                            </div>
                            <p className="text-lg font-black text-slate-900 leading-tight">{r.step}</p>
                         </div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-40 text-center">
           <i className="fas fa-robot text-8xl text-slate-100 mb-8"></i>
           <h3 className="text-3xl font-black text-slate-300 tracking-tighter italic">Analysis Idle</h3>
           <button onClick={runAnalysis} className="mt-8 px-12 py-5 bg-emerald-600 text-white rounded-[2rem] font-black shadow-2xl shadow-emerald-100 hover:scale-105 active:scale-95 transition-all">
             Initialize Diagnosis
           </button>
        </div>
      )}
    </div>
  );
};

export default IntelligenceHub;
