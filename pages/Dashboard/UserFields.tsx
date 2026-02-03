import React, { useState, useEffect } from 'react';
import { User, Field, CropRecommendation } from '../../types';
import { 
  getCropAnalysis, 
  getSoilHealthSummary, 
  getDetailedManagementPlan, 
  getPrecisionSensorCropMatch,
  SoilInsight,
  PrecisionCropMatch
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
  const [soilInsight, setSoilInsight] = useState<SoilInsight | null>(null);
  const [precisionMatch, setPrecisionMatch] = useState<PrecisionCropMatch | null>(null);
  const [managementPlan, setManagementPlan] = useState<ManagementTask[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentDataState, setCurrentDataState] = useState<any>(null);
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [isSavingField, setIsSavingField] = useState(false);
  const [newFieldData, setNewFieldData] = useState({ name: '', location: '', size: '', soilType: 'Loamy' });

  useEffect(() => {
    const init = async () => {
      try {
        const userFields = await syncFields(user.id);
        setFields(userFields);
        if (userFields.length > 0) {
          handleFieldSelect(userFields[0]);
        }
      } catch (err) {
        console.error("Failed to sync fields", err);
      }
    };
    init();
  }, [user.id]);

  const handleFieldSelect = async (field: Field) => {
    setSelectedField(field);
    setLoading(true);
    setRecommendations(null);
    setSoilInsight(null);
    setPrecisionMatch(null);
    setManagementPlan(null);
    
    try {
      const fieldSensors = await syncSensorsFromDb([field]);
      const stats: any = {};
      
      fieldSensors.forEach(s => {
        if (!s.last_reading) return;
        const t = s.sensor_type.toLowerCase();
        if (t.includes('moisture')) stats.moisture = s.last_reading.value;
        if (t.includes('temp')) stats.temperature = s.last_reading.value;
        if (t.includes('ph')) stats.ph_level = s.last_reading.value;
        if (t.includes('npk')) { 
          stats.npk_n = s.last_reading.n; 
          stats.npk_p = s.last_reading.p; 
          stats.npk_k = s.last_reading.k; 
        }
      });
      setCurrentDataState(stats);

      const [analysis, insight, plan, precision] = await Promise.all([
        getCropAnalysis(field, stats),
        getSoilHealthSummary(field, stats),
        getDetailedManagementPlan(field, stats),
        getPrecisionSensorCropMatch(field, stats)
      ]);
      
      setRecommendations(analysis);
      setSoilInsight(insight);
      setManagementPlan(plan);
      setPrecisionMatch(precision);
    } catch (err) {
      console.error("Critical AI synchronization failure:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingField) return;

    setIsSavingField(true);
    try {
      const f: Field = { 
        field_id: Date.now(), 
        user_id: user.id, 
        field_name: newFieldData.name, 
        location: newFieldData.location, 
        size: parseFloat(newFieldData.size) || 0, 
        soil_type: newFieldData.soilType 
      };
      
      await addFieldToDb(f);
      setFields(prev => [...prev, f]);
      setShowAddFieldModal(false);
      setNewFieldData({ name: '', location: '', size: '', soilType: 'Loamy' });
      handleFieldSelect(f);
    } catch (err) {
      console.error("Persistence error:", err);
      alert("Error saving field. Please check your database connection and try again.");
    } finally {
      setIsSavingField(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Agricare Hub</h1>
          <p className="text-slate-500 text-sm mt-1">Direct sensor-to-cloud diagnostics.</p>
        </div>
        <button 
          onClick={() => setShowAddFieldModal(true)} 
          className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg active:scale-95"
        >
          <i className="fas fa-plus mr-2"></i> Register New Plot
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Plot Inventory</h3>
            <span className="text-xs font-bold text-emerald-600">{fields.length} Active</span>
          </div>
          <div className="space-y-4">
            {fields.map(f => (
              <button 
                key={f.field_id} 
                onClick={() => handleFieldSelect(f)} 
                className={`w-full text-left p-6 rounded-2xl border transition-all duration-300 transform ${
                  selectedField?.field_id === f.field_id 
                    ? 'border-emerald-500 bg-emerald-50 shadow-md scale-[1.02]' 
                    : 'bg-white border-slate-100 hover:border-emerald-200'
                }`}
              >
                <div className="font-bold text-slate-800 text-lg">{f.field_name}</div>
                <div className="text-sm text-slate-400 font-medium">{f.location}</div>
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase bg-white px-2 py-1 rounded shadow-sm text-slate-500">{f.soil_type}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3">
          {!selectedField ? (
            <div className="bg-white rounded-[3rem] p-32 text-center border-dashed border-2 border-slate-200 flex flex-col items-center">
              <i className="fas fa-microscope text-4xl text-slate-200 mb-6"></i>
              <h3 className="text-slate-400 font-bold text-xl">Select a plot for sensor analysis.</h3>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in duration-700">
              <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 blur-[100px] rounded-full"></div>
                <div className="relative z-10">
                  <h2 className="text-5xl font-black mb-2">{selectedField.field_name}</h2>
                  <p className="text-slate-400 text-lg mb-8">{selectedField.location} • {selectedField.size} ha</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Moisture', val: currentDataState?.moisture != null ? `${currentDataState.moisture.toFixed(1)}%` : '---', icon: 'fa-droplet', color: 'text-blue-400' },
                      { label: 'pH Scale', val: currentDataState?.ph_level != null ? currentDataState.ph_level.toFixed(1) : '---', icon: 'fa-vial', color: 'text-purple-400' },
                      { label: 'Nitrogen', val: currentDataState?.npk_n != null ? `${currentDataState.npk_n} ppm` : '---', icon: 'fa-leaf', color: 'text-emerald-400' },
                      { label: 'Temperature', val: currentDataState?.temperature != null ? `${currentDataState.temperature.toFixed(1)}°C` : '---', icon: 'fa-temperature-half', color: 'text-orange-400' }
                    ].map((p, i) => (
                      <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-4 backdrop-blur-sm">
                        <i className={`fas ${p.icon} ${p.color}`}></i>
                        <div>
                          <div className="text-[8px] font-black uppercase text-slate-400 tracking-widest">{p.label}</div>
                          <div className="text-sm font-bold">{p.val}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="bg-white p-32 text-center rounded-[3rem] border border-slate-100 flex flex-col items-center">
                  <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                  <h3 className="text-xl font-black text-slate-800">Processing Field Telemetry...</h3>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Soil Health Summary */}
                      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <h3 className="font-black text-xl text-slate-900 mb-6 flex items-center gap-3">
                          <i className="fas fa-heart-pulse text-emerald-600"></i> Soil Diagnostics
                        </h3>
                        <p className="text-sm leading-relaxed text-slate-600 mb-6">{soilInsight?.summary}</p>
                        <div className="bg-emerald-50 p-4 rounded-2xl">
                          <div className="text-[8px] font-black uppercase text-emerald-600 mb-1">Top Additive</div>
                          <div className="font-bold text-slate-800 text-sm">{soilInsight?.soil_fertilizer}</div>
                        </div>
                      </div>

                      {/* Precision Matcher Card */}
                      <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute -right-8 -top-8 opacity-10 text-8xl group-hover:scale-110 transition-transform">
                          <i className="fas fa-bullseye"></i>
                        </div>
                        <h3 className="font-black text-xl mb-6 flex items-center gap-3">
                          <i className="fas fa-crosshairs text-emerald-400"></i> Precision Match
                        </h3>
                        {precisionMatch ? (
                          <div className="space-y-4">
                            <div>
                              <div className="text-[8px] font-black uppercase text-slate-400 mb-1">High-Fidelity Match</div>
                              <div className="font-black text-2xl text-emerald-400">{precisionMatch.best_crop}</div>
                            </div>
                            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-emerald-500 transition-all duration-1000" 
                                style={{ width: `${precisionMatch.match_probability}%` }}
                              ></div>
                            </div>
                            <p className="text-[11px] text-slate-300 italic">"{precisionMatch.biological_advantage}"</p>
                            <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                              <div className="text-[7px] font-black uppercase text-slate-500">Key Driver</div>
                              <div className="text-xs font-bold">{precisionMatch.critical_metric}</div>
                            </div>
                          </div>
                        ) : (
                          <div className="py-10 text-center opacity-30 text-xs font-bold">DNA MATCHING...</div>
                        )}
                      </div>
                    </div>

                    {/* Standard Recommendations */}
                    <div>
                      <h3 className="font-black text-2xl text-slate-900 mb-8 flex items-center gap-3">
                        <i className="fas fa-seedling text-emerald-600"></i> Optimized Rotation Plan
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {recommendations?.map((r, i) => (
                          <div key={i} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-6">
                              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                                <i className={`fas ${r.icon || 'fa-seedling'} text-xl`}></i>
                              </div>
                              <div className="text-right">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Match</div>
                                <div className="text-2xl font-black">{r.suitability}%</div>
                              </div>
                            </div>
                            <h4 className="font-black text-slate-900 text-lg mb-2">{r.name}</h4>
                            <p className="text-xs text-slate-500 leading-relaxed mb-4">"{r.requirements}"</p>
                            <div className="bg-slate-50 p-4 rounded-2xl text-xs font-bold text-slate-700">
                              <i className="fas fa-flask mr-2 text-emerald-600"></i> {r.fertilizer}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-10 rounded-[3rem] border border-slate-100 h-fit sticky top-24">
                    <h3 className="font-black text-xl text-slate-900 mb-10 flex items-center gap-3">
                      <i className="fas fa-route text-emerald-600"></i> Operational Roadmap
                    </h3>
                    <div className="space-y-8">
                      {managementPlan?.map((p, i) => (
                        <div key={i} className="relative pl-6">
                          <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-full ${p.priority.toLowerCase().includes('high') ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                          <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{p.priority} Priority</div>
                          <h4 className="font-bold text-slate-900 text-sm mb-1">{p.title}</h4>
                          <p className="text-xs text-slate-500 leading-relaxed">{p.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showAddFieldModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black text-slate-900">Add New Plot</h2>
              <button onClick={() => setShowAddFieldModal(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <form onSubmit={handleAddField} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1">Field Name</label>
                <input required type="text" value={newFieldData.name} onChange={e => setNewFieldData({...newFieldData, name: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-emerald-500 font-medium" placeholder="e.g. Rice Paddy Alpha" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1">Location</label>
                <input required type="text" value={newFieldData.location} onChange={e => setNewFieldData({...newFieldData, location: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-emerald-500 font-medium" placeholder="e.g. Bogura, Bangladesh" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1">Size (ha)</label>
                  <input required type="number" step="0.1" value={newFieldData.size} onChange={e => setNewFieldData({...newFieldData, size: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-emerald-500 font-medium" placeholder="1.2" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1">Soil Type</label>
                  <select value={newFieldData.soilType} onChange={e => setNewFieldData({...newFieldData, soilType: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-emerald-500 font-black">
                    <option value="Loamy">Loamy</option>
                    <option value="Clay">Clay</option>
                    <option value="Sandy">Sandy</option>
                    <option value="Alluvial">Alluvial</option>
                  </select>
                </div>
              </div>
              <button 
                type="submit" 
                disabled={isSavingField}
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-900/10 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 mt-4"
              >
                {isSavingField ? 'Registering...' : 'Register Field'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserFields;