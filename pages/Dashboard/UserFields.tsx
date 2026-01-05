
import React, { useState, useEffect } from 'react';
import { User, Field, CropRecommendation } from '../../types';
import { 
  getCropAnalysis, 
  getSoilHealthSummary, 
  getDetailedManagementPlan, 
  isAiReady
} from '../../services/gemini';
import { syncFields, syncSensorsFromDb, addFieldToDb } from '../../services/db';

interface ManagementTask {
  priority: string;
  title: string;
  description: string;
  icon: string;
}

const UserFields: React.FC<{ user: User }> = ({ user }) => {
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [recommendations, setRecommendations] = useState<CropRecommendation[] | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [managementPlan, setManagementPlan] = useState<ManagementTask[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiConnected, setAiConnected] = useState(false);
  const [currentDataState, setCurrentDataState] = useState<any>(null);
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [newFieldData, setNewFieldData] = useState({ name: '', location: '', size: '', soilType: 'Loamy' });

  useEffect(() => {
    const init = async () => {
      setAiConnected(await isAiReady());
      setFields(await syncFields(user.id));
    };
    init();
  }, [user.id]);

  const handleFieldSelect = async (field: Field) => {
    setSelectedField(field);
    setLoading(true);
    setRecommendations(null);
    setAiSummary(null);
    setManagementPlan(null);
    
    try {
      const fieldSensors = await syncSensorsFromDb([field]);
      const stats: any = { temperature: null, moisture: null, ph_level: null, npk_n: null, npk_p: null, npk_k: null };
      fieldSensors.forEach(s => {
        if (!s.last_reading) return;
        const t = s.sensor_type.toLowerCase();
        if (t.includes('moisture')) stats.moisture = s.last_reading.value;
        if (t.includes('temp')) stats.temperature = s.last_reading.value;
        if (t.includes('ph')) stats.ph_level = s.last_reading.value;
        if (t.includes('npk')) { stats.npk_n = s.last_reading.n; stats.npk_p = s.last_reading.p; stats.npk_k = s.last_reading.k; }
      });
      setCurrentDataState(stats);

      const [analysis, summary, plan] = await Promise.all([
        getCropAnalysis(field, stats),
        getSoilHealthSummary(field, stats),
        getDetailedManagementPlan(field, stats)
      ]);
      
      setRecommendations(analysis);
      setAiSummary(summary);
      setManagementPlan(plan);
      setAiConnected(await isAiReady());
    } catch (err) {
      setAiSummary("Communication with the AI node failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();
    const f: Field = { field_id: Date.now(), user_id: user.id, field_name: newFieldData.name, location: newFieldData.location, size: parseFloat(newFieldData.size) || 0, soil_type: newFieldData.soilType };
    await addFieldToDb(f);
    setFields([...fields, f]);
    setShowAddFieldModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-[80vh]">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Field Command Center</h1>
          <p className="text-slate-500 text-sm">Automated diagnostic and analysis node.</p>
        </div>
        <button onClick={() => setShowAddFieldModal(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold">Add Field</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="space-y-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Managed Plots</div>
          {fields.map(f => (
            <button key={f.field_id} onClick={() => handleFieldSelect(f)} className={`w-full text-left p-6 rounded-2xl border transition-all ${selectedField?.field_id === f.field_id ? 'border-emerald-500 bg-emerald-50 shadow-md' : 'bg-white border-slate-100 hover:border-emerald-200'}`}>
              <div className="font-bold text-slate-800">{f.field_name}</div>
              <div className="text-sm text-slate-500 mt-1">{f.location}</div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-3">
          {!selectedField ? (
            <div className="bg-white rounded-[3rem] p-24 text-center border-dashed border-2 border-slate-200">
               <i className="fas fa-seedling text-4xl text-slate-200 mb-4 block"></i>
               <h3 className="text-slate-400 font-bold">Select a field to run AI health diagnostics.</h3>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${aiConnected ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{aiConnected ? 'AI Active' : 'AI Connection Error'}</span>
                    </div>
                    <h2 className="text-4xl font-black">{selectedField.field_name}</h2>
                    <p className="text-slate-400 mt-1">{selectedField.location} • {selectedField.size} Hectares</p>
                  </div>
                  <div className="flex gap-4">
                    {currentDataState?.moisture && <div className="bg-white/10 px-4 py-2 rounded-xl text-xs font-bold border border-white/5">MOISTURE {currentDataState.moisture}%</div>}
                    {currentDataState?.ph_level && <div className="bg-white/10 px-4 py-2 rounded-xl text-xs font-bold border border-white/5">PH {currentDataState.ph_level}</div>}
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="bg-white p-24 text-center rounded-[3rem] border border-slate-100">
                  <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                  <h3 className="text-xl font-bold text-slate-800">Synthesizing Data...</h3>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-10 rounded-[2.5rem] border border-emerald-50 shadow-sm relative overflow-hidden">
                      <h3 className="font-bold text-xl text-slate-900 mb-6 flex items-center gap-2"><i className="fas fa-stethoscope text-emerald-600"></i> AI Soil Health Analysis</h3>
                      <div className={`p-6 rounded-2xl ${!aiConnected ? 'bg-red-50 text-red-700' : 'text-slate-600'}`}>
                        <p className="text-lg leading-relaxed font-medium">{aiSummary || "Telemetry data synced. Awaiting AI response."}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {recommendations?.map((r, i) => (
                        <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 hover:shadow-lg transition-all">
                          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6"><i className={`fas ${r.icon || 'fa-wheat-awn'} text-xl`}></i></div>
                          <h4 className="font-bold text-slate-900 text-lg">{r.name}</h4>
                          <p className="text-sm text-slate-500 mt-4 leading-relaxed">{r.requirements}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 h-fit">
                    <h3 className="font-bold text-lg text-slate-900 mb-8 flex items-center gap-2"><i className="fas fa-road text-emerald-600"></i> Management Roadmap</h3>
                    <div className="space-y-8">
                      {managementPlan?.map((p, i) => (
                        <div key={i} className="relative pl-6">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-full"></div>
                          <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">{p.priority} Priority</div>
                          <h4 className="font-bold text-slate-900 mb-2">{p.title}</h4>
                          <p className="text-xs text-slate-500 leading-relaxed">{p.description}</p>
                        </div>
                      ))}
                      {(!managementPlan || managementPlan.length === 0) && <div className="text-slate-300 text-sm font-medium italic">Roadmap pending AI activation.</div>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserFields;
