
import React from 'react';

const HowItWorks: React.FC = () => {
  const steps = [
    {
      id: "01",
      title: "Create Your Digital Farm",
      desc: "Sign up and configure your organizational profile. Choose between Basic (manual data) or Premium (automated IoT) plans to unlock specific features.",
      icon: "fa-user-plus",
      color: "bg-emerald-500"
    },
    {
      id: "02",
      title: "Map Your Fields",
      desc: "Go to the 'My Fields' tab to register your land. Specify the area (acres/ha) and soil composition. This allows our AI to calibrate specific crop recommendations.",
      icon: "fa-map-location-dot",
      color: "bg-blue-500"
    },
    {
      id: "03",
      title: "Pair IoT Hardware",
      desc: "Using the 'Sensors' tab, enter the unique ID of your Agricare Nodes. Link each physical sensor to its corresponding field for live telemetry synchronization.",
      icon: "fa-link",
      color: "bg-purple-500"
    },
    {
      id: "04",
      title: "Act on Prescriptions",
      desc: "Visit the 'Management' hub daily. The app will provide exact instructions—e.g., 'Apply 4,200 Liters of water' or 'Apply 3 bags of Urea'—based on real-time soil chemistry.",
      icon: "fa-clipboard-check",
      color: "bg-orange-500"
    }
  ];

  return (
    <div className="bg-slate-50">
      {/* Header Section */}
      <section className="relative overflow-hidden bg-emerald-950 py-24">
        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6">The Science of Growth</h1>
          <p className="text-xl text-emerald-100/80 max-w-2xl mx-auto leading-relaxed">
            Discover how Agricare's precision hardware and cloud intelligence work together to revolutionize your field's potential.
          </p>
          
          <div className="mt-12 flex justify-center gap-8 text-emerald-400">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full border border-emerald-500/30 flex items-center justify-center mb-2">
                <i className="fas fa-microchip"></i>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-tighter">IoT Sensing</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full border border-emerald-500/30 flex items-center justify-center mb-2">
                <i className="fas fa-wifi"></i>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-tighter">LoRaWAN Sync</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full border border-emerald-500/30 flex items-center justify-center mb-2">
                <i className="fas fa-brain"></i>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-tighter">AI Analysis</span>
            </div>
          </div>
        </div>
        
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-500/10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>
      </section>

      {/* Sensor Deep Dive Section */}
      <section className="max-w-6xl mx-auto px-4 py-24 space-y-32">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-slate-900 mb-6">How Our Sensors Help You Grow</h2>
          <p className="text-xl text-slate-500 max-w-3xl mx-auto">Scientific precision integrated into every circuit. We monitor 14 different environmental markers to ensure optimal plant phenology.</p>
        </div>

        {/* Moisture Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-emerald-600 font-bold uppercase tracking-widest text-sm bg-emerald-50 px-3 py-1 rounded">Moisture Dynamics</span>
            <h3 className="text-3xl font-bold text-slate-900 mt-4 mb-6">Volumetric Water Content ($VWC$)</h3>
            <p className="text-slate-600 text-lg leading-relaxed mb-6">
              Our sensors use <strong>Time-Domain Reflectometry (TDR)</strong> to measure the soil's dielectric constant. This allows us to calculate the exact percentage of water volume relative to total soil volume.
            </p>
            <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm">
              <div className="text-sm font-bold text-slate-800 mb-2 underline decoration-emerald-200">The Science:</div>
              <p className="text-sm text-slate-500 leading-relaxed italic">
                By detecting moisture at 15cm (Surface), 30cm (Root Base), and 60cm (Sub-base), we can determine if water is reaching the roots or simply evaporating from the surface.
              </p>
            </div>
          </div>
          <div className="bg-white p-10 rounded-[3rem] shadow-inner border border-slate-100 flex flex-col items-center">
             <div className="text-2xl font-mono text-emerald-700 font-bold mb-4 italic">VWC = (V<sub>w</sub> / V<sub>s</sub>) × 100</div>
             <div className="w-48 h-64 bg-slate-200 rounded-2xl relative overflow-hidden border-4 border-slate-300">
               <div className="absolute bottom-0 w-full bg-blue-500/80 animate-bounce duration-[3000ms]" style={{ height: '40%' }}></div>
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-black text-slate-800">40%</div>
             </div>
          </div>
        </div>

        {/* NPK Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center lg:flex-row-reverse">
          <div className="order-1 lg:order-2">
            <span className="text-blue-600 font-bold uppercase tracking-widest text-sm bg-blue-50 px-3 py-1 rounded">Nutrient Balance</span>
            <h3 className="text-3xl font-bold text-slate-900 mt-4 mb-6">Real-Time Stoichiometry</h3>
            <p className="text-slate-600 text-lg leading-relaxed mb-6">
              Unlike traditional soil tests that take weeks, our Ion-Selective Electrodes (ISE) monitor active ions in the soil solution. We track <strong>Nitrogen (N)</strong> for leaf growth, <strong>Phosphorus (P)</strong> for ATP/Energy, and <strong>Potassium (K)</strong> for water regulation.
            </p>
            <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm">
              <div className="text-sm font-bold text-slate-800 mb-2 underline decoration-blue-200">The Impact:</div>
              <p className="text-sm text-slate-500 leading-relaxed italic">
                Over-fertilization leads to salt buildup and nitrogen runoff. We help you apply precisely what the plant can absorb, reducing costs by up to 22%.
              </p>
            </div>
          </div>
          <div className="order-2 lg:order-1 grid grid-cols-3 gap-4">
             {['N', 'P', 'K'].map((nut) => (
               <div key={nut} className="bg-slate-900 text-white h-40 rounded-3xl flex flex-col items-center justify-center shadow-2xl">
                 <span className="text-4xl font-black">{nut}</span>
                 <span className="text-[10px] uppercase font-bold text-slate-400 mt-2">Sensor Active</span>
               </div>
             ))}
          </div>
        </div>

        {/* Weather Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-orange-600 font-bold uppercase tracking-widest text-sm bg-orange-50 px-3 py-1 rounded">Atmospheric Analysis</span>
            <h3 className="text-3xl font-bold text-slate-900 mt-4 mb-6">Vapor Pressure Deficit ($VPD$)</h3>
            <p className="text-slate-600 text-lg leading-relaxed mb-6">
              We monitor the difference between the amount of moisture in the air and how much it can hold when saturated. High VPD causes plants to close their stomata, halting photosynthesis.
            </p>
            <div className="bg-white p-6 rounded-2xl border border-orange-100 shadow-sm">
              <div className="text-sm font-bold text-slate-800 mb-2 underline decoration-orange-200">The Harvest Secret:</div>
              <p className="text-sm text-slate-500 leading-relaxed italic">
                By correlating VPD with Growing Degree Days (GDD), we can predict the exact harvest window with 98% accuracy.
              </p>
            </div>
          </div>
          <div className="relative">
            <img src="https://images.unsplash.com/photo-1594398901394-4e34939a4fe0?q=80&w=800&auto=format&fit=crop" className="rounded-[3rem] shadow-2xl" alt="Weather sensing" />
            <div className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 max-w-[200px]">
               <div className="text-xs font-bold text-orange-500 mb-1">VPD Alert</div>
               <div className="text-sm text-slate-900 font-bold italic">1.2 kPa - Moderate Stress</div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start Guide Section */}
      <section className="bg-white py-24 px-4 border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <span className="text-emerald-600 font-bold uppercase tracking-widest text-xs mb-4 block">Onboarding Guide</span>
            <h2 className="text-4xl font-bold text-slate-900">How to use the Agricare Platform</h2>
            <p className="text-slate-500 mt-4">Four simple steps to transform your agricultural data into actionable yield.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, idx) => (
              <div key={idx} className="relative group">
                <div className="absolute -top-6 -left-6 text-8xl font-black text-slate-50 opacity-10 group-hover:text-emerald-100 transition-colors pointer-events-none">
                  {step.id}
                </div>
                <div className="relative bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-emerald-100 transition-all duration-300 h-full">
                  <div className={`w-14 h-14 ${step.color} text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-slate-200`}>
                    <i className={`fas ${step.icon} text-2xl`}></i>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4">{step.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical CTA */}
      <section className="bg-emerald-600 py-20 px-4 text-center">
        <h2 className="text-3xl font-bold text-white mb-10">Ready to modernize your operations?</h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all">Get Started Now</button>
          <button className="bg-white text-emerald-700 px-10 py-4 rounded-2xl font-bold hover:bg-slate-100 transition-all">Contact a Consultant</button>
        </div>
      </section>
    </div>
  );
};

export default HowItWorks;
