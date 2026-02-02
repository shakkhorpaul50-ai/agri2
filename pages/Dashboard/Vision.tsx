
import React, { useState, useRef } from 'react';
import { User } from '../../types';
import { GeminiService, PlantDiagnosis } from '../../services/gemini';

const Vision: React.FC<{ user: User }> = ({ user }) => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<PlantDiagnosis | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setDiagnosis(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const runDiagnosis = async () => {
    if (!image) return;
    setLoading(true);
    const base64Data = image.split(',')[1];
    const mimeType = image.split(';')[0].split(':')[1];
    
    try {
      const result = await GeminiService.diagnosePlantHealth(base64Data, mimeType);
      setDiagnosis(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImage(null);
    setDiagnosis(null);
  };

  const getSeverityStyles = (sev: string) => {
    switch (sev) {
      case 'critical': return { bg: 'bg-red-500', text: 'text-red-500', light: 'bg-red-50' };
      case 'high': return { bg: 'bg-orange-500', text: 'text-orange-500', light: 'bg-orange-50' };
      case 'medium': return { bg: 'bg-yellow-500', text: 'text-yellow-600', light: 'bg-yellow-50' };
      default: return { bg: 'bg-emerald-500', text: 'text-emerald-500', light: 'bg-emerald-50' };
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter">AI Bio-Scanner</h1>
          <p className="text-slate-500 font-medium text-lg mt-2">Upload a leaf photo for instant pathogenic diagnosis.</p>
        </div>
        <div className="flex items-center gap-4 bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100">
          <i className="fas fa-microscope text-emerald-600"></i>
          <span className="text-xs font-black uppercase text-emerald-700 tracking-widest">Neural Engine 3.0</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Left Side: Upload/Preview */}
        <div className="space-y-6">
          {!image ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="group h-[550px] border-4 border-dashed border-slate-200 rounded-[4rem] bg-white hover:bg-slate-50 hover:border-emerald-400 transition-all cursor-pointer flex flex-col items-center justify-center p-12 text-center"
            >
              <div className="w-24 h-24 bg-slate-50 text-slate-300 rounded-[2rem] flex items-center justify-center text-4xl mb-8 group-hover:scale-110 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all">
                <i className="fas fa-camera"></i>
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-4">Initialize Bio-Scan</h3>
              <p className="text-slate-400 font-medium max-w-[280px]">Ensure the leaf is well-lit and covers at least 50% of the frame.</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageUpload} 
              />
            </div>
          ) : (
            <div className="relative h-[550px] rounded-[4rem] overflow-hidden shadow-2xl border-4 border-white group">
              <img src={image} className="w-full h-full object-cover" alt="Captured biomass" />
              
              {/* Scanline Animation */}
              {loading && (
                <div className="absolute inset-0 pointer-events-none z-20">
                  <div className="w-full h-1 bg-emerald-400 shadow-[0_0_20px_#10b981] absolute top-0 animate-[scan_3s_infinite]"></div>
                  <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-[2px]"></div>
                </div>
              )}

              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 z-30">
                <button onClick={reset} className="w-16 h-16 bg-white text-red-500 rounded-3xl flex items-center justify-center hover:scale-110 transition-transform shadow-xl">
                  <i className="fas fa-trash text-xl"></i>
                </button>
              </div>

              {loading && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl flex flex-col items-center justify-center text-white z-40">
                  <div className="w-20 h-20 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-8"></div>
                  <div className="text-2xl font-black tracking-[0.2em] animate-pulse">DECRYPTING DNA...</div>
                  <p className="text-slate-400 text-xs mt-4 uppercase font-bold tracking-widest">Comparing to 45,000+ Pathogen Models</p>
                </div>
              )}
            </div>
          )}

          {image && !loading && !diagnosis && (
            <button 
              onClick={runDiagnosis}
              className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black text-xl shadow-2xl shadow-emerald-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
            >
              <i className="fas fa-dna text-emerald-400"></i> Run Diagnostic Sequence
            </button>
          )}
        </div>

        {/* Right Side: Results */}
        <div className="space-y-8">
          {diagnosis ? (
            <div className="animate-in fade-in slide-in-from-right-12 duration-700">
              <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-2xl relative overflow-hidden">
                {/* Header Section */}
                <div className="mb-10 flex justify-between items-start">
                  <div>
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4 inline-block ${getSeverityStyles(diagnosis.severity).bg} text-white shadow-lg`}>
                      {diagnosis.severity} Priority Issue
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{diagnosis.diagnosis}</h2>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Confidence</div>
                    <div className="text-3xl font-black text-emerald-600">{(diagnosis.confidence * 100).toFixed(0)}%</div>
                  </div>
                </div>

                <div className="space-y-10">
                  <div className={`${getSeverityStyles(diagnosis.severity).light} p-8 rounded-[2.5rem] border border-dashed border-current flex gap-6 items-start`}>
                    <div className={`w-12 h-12 ${getSeverityStyles(diagnosis.severity).bg} text-white rounded-2xl flex items-center justify-center shrink-0`}>
                      <i className="fas fa-circle-exclamation text-lg"></i>
                    </div>
                    <div>
                      <h4 className={`text-xs font-black uppercase tracking-widest mb-2 ${getSeverityStyles(diagnosis.severity).text}`}>Pathogen Summary</h4>
                      <p className="text-slate-700 font-medium leading-relaxed">{diagnosis.issue}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-8">
                    <div className="bg-slate-50 p-8 rounded-[2.5rem]">
                      <h4 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-3">
                        <i className="fas fa-notes-medical text-emerald-600"></i> Treatment Plan
                      </h4>
                      <p className="text-slate-600 leading-relaxed font-medium italic">"{diagnosis.treatment}"</p>
                    </div>

                    <div className="bg-slate-50 p-8 rounded-[2.5rem]">
                      <h4 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-3">
                        <i className="fas fa-shield-virus text-emerald-600"></i> Prevention Strategy
                      </h4>
                      <p className="text-slate-600 leading-relaxed font-medium italic">"{diagnosis.prevention}"</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={reset}
                  className="mt-12 w-full py-5 border-2 border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-300 rounded-[2rem] font-bold transition-all text-sm uppercase tracking-widest"
                >
                  Clear Result & Start New Scan
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-16 bg-slate-50 rounded-[4rem] border border-dashed border-slate-200">
              <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center text-4xl text-slate-100 mb-8 shadow-sm">
                <i className="fas fa-bolt"></i>
              </div>
              <h3 className="text-2xl font-black text-slate-400 mb-2">Diagnosis Pipeline Idle</h3>
              <p className="text-slate-500 font-medium max-w-[320px] leading-relaxed">System awaiting sensory input for neural plant pathology analysis.</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}</style>
    </div>
  );
};

export default Vision;
