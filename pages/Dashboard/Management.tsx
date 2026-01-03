
import React, { useState, useEffect } from 'react';
import { User, Field } from '../../types';
import { generateMockSensorData } from '../../constants';
import { syncFields, getManualDiagnosticsForFields } from '../../services/db';

const Management: React.FC<{ user: User }> = ({ user }) => {
  const [fieldData, setFieldData] = useState<{field: Field, data: any}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const userFields = await syncFields(user.id);
      
      if (userFields.length > 0) {
        const fieldIds = userFields.map(f => f.field_id);
        const manualDiags = await getManualDiagnosticsForFields(fieldIds);
        
        const enrichedData = userFields.map(f => {
          const mock = generateMockSensorData(f.field_id)[6];
          const manual = manualDiags[f.field_id];
          
          return {
            field: f,
            data: manual ? {
              ...mock,
              moisture: manual.moisture ?? mock.moisture,
              temperature: manual.temp ?? mock.temperature,
              ph_level: manual.ph ?? mock.ph_level,
              npk_n: manual.n ?? mock.npk_n,
              npk_p: manual.p ?? mock.npk_p,
              npk_k: manual.k ?? mock.npk_k
            } : mock
          };
        });
        setFieldData(enrichedData);
      }
      setLoading(false);
    };
    loadData();
  }, [user.id]);

  const getWaterPrescription = (moisture: number, size: number) => {
    const targetMoisture = 65; 
    if (moisture >= targetMoisture) return null;
    const deficit = targetMoisture - moisture;
    const litersRequired = Math.round(deficit * size * 1000);
    return litersRequired;
  };

  const getFertilizerPrescription = (npk_n: number, npk_p: number, npk_k: number) => {
    const targetN = 60;
    const targetP = 50;
    const targetK = 70;
    
    let needs = [];
    if (npk_n < targetN) needs.push({ type: 'Urea (N)', deficit: targetN - npk_n });
    if (npk_p < targetP) needs.push({ type: 'DAP (P)', deficit: targetP - npk_p });
    if (npk_k < targetK) needs.push({ type: 'MOP (K)', deficit: targetK - npk_k });
    
    return needs;
  };

  const handleDownloadReport = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
    
    let reportContent = `AGRICARE - COMPREHENSIVE FARM MANAGEMENT REPORT\n`;
    reportContent += `Generated on: ${dateStr}\n`;
    reportContent += `============================================================\n\n`;

    fieldData.forEach(({ field, data }) => {
      const waterNeed = getWaterPrescription(data.moisture, field.size);
      const fertNeeds = getFertilizerPrescription(data.npk_n, data.npk_p, data.npk_k);

      reportContent += `FIELD: ${field.field_name}\n`;
      reportContent += `Location: ${field.location}\n`;
      reportContent += `Size: ${field.size} acres | Soil: ${field.soil_type}\n`;
      reportContent += `------------------------------------------------------------\n`;
      reportContent += `CURRENT DIAGNOSTIC STATE:\n`;
      reportContent += `- Temperature: ${data.temperature.toFixed(1)}°C\n`;
      reportContent += `- Moisture: ${data.moisture.toFixed(1)}%\n`;
      reportContent += `- pH Level: ${data.ph_level.toFixed(1)}\n`;
      reportContent += `- Nutrient Profile (NPK): ${data.npk_n.toFixed(0)}-${data.npk_p.toFixed(0)}-${data.npk_k.toFixed(0)}\n\n`;

      reportContent += `PRESCRIPTIVE ACTIONS:\n`;
      
      if (waterNeed) {
        reportContent += `[!] IRRIGATION: Required. Apply approx. ${waterNeed.toLocaleString()} Liters.\n`;
      } else {
        reportContent += `[✓] IRRIGATION: Not required. Soil moisture is optimal.\n`;
      }

      if (fertNeeds.length > 0) {
        reportContent += `[!] FERTILIZER: Deficit detected.\n`;
        fertNeeds.forEach(n => {
          reportContent += `    - Add ${n.type}: +${n.deficit.toFixed(0)} kg/ha\n`;
        });
      } else {
        reportContent += `[✓] FERTILIZER: All nutrient levels within target range.\n`;
      }

      reportContent += `\n============================================================\n\n`;
    });

    reportContent += `End of Report.\n`;

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Agricare_Farm_Report_${now.toISOString().split('T')[0]}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900">Farm Management Hub</h1>
        <p className="text-slate-500">Cloud-Synced Prescriptions based on live field telemetry.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <i className="fas fa-bell text-orange-500"></i> Active Management Alerts
          </h2>
          
          {loading ? (
            <div className="py-20 text-center bg-white rounded-[2.5rem] border border-slate-100">
               <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
               <p className="text-slate-400 font-medium">Fetching Cloud Directives...</p>
            </div>
          ) : fieldData.length > 0 ? fieldData.map(({ field, data }) => {
            const waterNeed = getWaterPrescription(data.moisture, field.size);
            const fertNeeds = getFertilizerPrescription(data.npk_n, data.npk_p, data.npk_k);
            
            return (
              <div key={field.field_id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-slate-900 text-lg">{field.field_name}</div>
                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{field.location}</div>
                  </div>
                  <div className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-bold">Live Synced</div>
                </div>
                
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className={`p-6 rounded-[2rem] border transition-all ${waterNeed ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-50 opacity-60'}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${waterNeed ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                        <i className="fas fa-droplet"></i>
                      </div>
                      <h4 className="font-bold text-slate-900">Irrigation Plan</h4>
                    </div>
                    {waterNeed ? (
                      <div>
                        <div className="text-[10px] font-bold text-blue-700 uppercase mb-1 tracking-wider">Deficit Found</div>
                        <p className="text-sm text-blue-900 mb-3 font-medium leading-relaxed">Required Volume: <span className="font-black text-blue-600">{waterNeed.toLocaleString()} Liters</span>.</p>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">Current moisture ({data.moisture.toFixed(1)}%) is optimal for the crop cycle.</p>
                    )}
                  </div>

                  <div className={`p-6 rounded-[2rem] border transition-all ${fertNeeds.length > 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-50 opacity-60'}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${fertNeeds.length > 0 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                        <i className="fas fa-flask"></i>
                      </div>
                      <h4 className="font-bold text-slate-900">Nutrient Cycle</h4>
                    </div>
                    {fertNeeds.length > 0 ? (
                      <div className="space-y-3">
                        {fertNeeds.map((f, i) => (
                          <div key={i} className="flex justify-between items-center bg-white p-3 rounded-xl border border-emerald-100 shadow-sm">
                            <span className="text-xs font-bold text-emerald-800">{f.type}</span>
                            <span className="text-[10px] bg-emerald-100 px-3 py-1 rounded-full font-black text-emerald-700">+{f.deficit.toFixed(0)} kg/ha</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">Soil NPK markers are currently balanced.</p>
                    )}
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="bg-white p-20 rounded-[3rem] border border-dashed border-slate-200 text-center text-slate-400">
              <i className="fas fa-folder-open text-5xl mb-6 opacity-20"></i>
              <p className="text-lg font-medium">No active fields found for prescription generation.</p>
              <p className="text-sm mt-1">Please add a field to initialize management algorithms.</p>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-emerald-500 opacity-5 rounded-full translate-x-10 translate-y-10"></div>
            <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
              <i className="fas fa-microscope text-emerald-400"></i> Agronomic Data
            </h3>
            <div className="space-y-6">
              <div className="border-l-4 border-emerald-500 pl-4 bg-white/5 py-4 rounded-r-xl">
                <div className="text-[10px] text-emerald-400 uppercase font-black tracking-widest mb-1">Volumetric Water Model</div>
                <p className="text-xs text-slate-300">Using VWC% sensors to calculate exact liter deficit per hectare.</p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4 bg-white/5 py-4 rounded-r-xl">
                <div className="text-[10px] text-blue-400 uppercase font-black tracking-widest mb-1">Stoichiometric NPK</div>
                <p className="text-xs text-slate-300">Balancing soil pH with nutrient ionization for maximum uptake.</p>
              </div>
            </div>
            <button 
              onClick={handleDownloadReport}
              disabled={fieldData.length === 0}
              className="w-full mt-10 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl text-sm font-black transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
              <i className="fas fa-file-pdf mr-2"></i> Download Advisory PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Management;
