import React, { useState, useEffect } from 'react';
import { User, Field } from '../../types';
import { syncFields, syncSensorsFromDb } from '../../services/db';
import { GeminiService, ManagementPrescription } from '../../services/gemini';

const Management: React.FC<{ user: User }> = ({ user }) => {
  const [fields, setFields] = useState<Field[]>([]);
  const [prescriptions, setPrescriptions] = useState<Record<number, ManagementPrescription>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const f = await syncFields(user.id);
      setFields(f);
      
      const results: Record<number, ManagementPrescription> = {};
      for (const field of f) {
        // In a real app we'd fetch actual sensor data here
        const data = { moisture: 45, temperature: 28, npk_n: 100 }; 
        const p = await GeminiService.getManagementPrescriptions(field, data);
        results[field.field_id] = p;
      }
      setPrescriptions(results);
      setLoading(false);
    };
    load();
  }, [user.id]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <header className="mb-12">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Management Advisory</h1>
        <p className="text-slate-500 font-medium">AI-driven prescriptions for irrigation and nutrition.</p>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-12">
          {fields.map(field => {
            const p = prescriptions[field.field_id];
            return (
              <div key={field.field_id} className="bento-card bg-white overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">{field.field_name}</h3>
                    <p className="text-sm font-medium text-slate-400">{field.location} • {field.soil_type}</p>
                  </div>
                  <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest border border-emerald-100">
                    <i className="fas fa-robot mr-2"></i> AI Verified
                  </div>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Irrigation Section */}
                  <div className={`p-8 rounded-[2rem] border ${p?.irrigation.needed ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-50'}`}>
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${
                        p?.irrigation.needed ? 'bg-blue-500 text-white shadow-lg' : 'bg-slate-200 text-slate-400'
                      }`}>
                        <i className="fas fa-droplet"></i>
                      </div>
                      <h4 className="font-bold text-slate-900">Irrigation Protocol</h4>
                    </div>
                    {p?.irrigation.needed ? (
                      <div className="space-y-4">
                        <div className="text-2xl font-bold text-blue-900">{p.irrigation.volume}</div>
                        <p className="text-sm text-blue-700/80 leading-relaxed font-medium">
                          Scheduled: <span className="font-bold">{p.irrigation.schedule}</span>
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 font-medium italic">Soil saturation levels are currently within optimal parameters.</p>
                    )}
                  </div>

                  {/* Nutrients Section */}
                  <div className={`p-8 rounded-[2rem] border ${p?.nutrient.needed ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-50'}`}>
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${
                        p?.nutrient.needed ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-200 text-slate-400'
                      }`}>
                        <i className="fas fa-vial"></i>
                      </div>
                      <h4 className="font-bold text-slate-900">Nutrition Cycle</h4>
                    </div>
                    {p?.nutrient.needed ? (
                      <div className="space-y-6">
                        <div className="flex flex-wrap gap-2">
                          {p.nutrient.fertilizers.map((f, i) => (
                            <div key={i} className="bg-white border border-emerald-100 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-sm">
                              <span className="text-[10px] font-black text-slate-400 uppercase">{f.type}</span>
                              <span className="text-sm font-bold text-emerald-700">{f.amount}</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-sm text-emerald-800/80 leading-relaxed font-medium bg-white/50 p-4 rounded-2xl border border-white/80 italic">
                          "{p.nutrient.advice}"
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 font-medium italic">NPK balance verified. No immediate supplemental feeding required.</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Management;