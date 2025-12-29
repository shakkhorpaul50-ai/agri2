
import React from 'react';

const HowItWorks: React.FC = () => {
  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 bg-emerald-900 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-400 rounded-full -translate-x-1/2 -translate-y-1/2 blur-[100px]"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-400 rounded-full translate-x-1/2 translate-y-1/2 blur-[100px]"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <span className="inline-block px-4 py-2 rounded-full bg-emerald-800/50 border border-emerald-700 text-emerald-300 text-xs font-bold uppercase tracking-widest mb-6">
            Hardware Engineering
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-8">
            The Science Behind <br/><span className="text-emerald-400">Precision Agriculture</span>
          </h1>
          <p className="text-xl text-emerald-100/70 max-w-3xl mx-auto leading-relaxed">
            Our multi-parameter IoT probes utilize advanced electrochemical and dielectric sensors to translate soil biology into actionable digital data.
          </p>
        </div>
      </section>

      {/* Sensor Deep Dives */}
      <div className="max-w-7xl mx-auto px-4 py-24 space-y-32">
        
        {/* 1. Temperature Sensor */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center">
                <i className="fas fa-temperature-high text-xl"></i>
              </div>
              <h2 className="text-3xl font-bold text-slate-900">Thermal Gradient Monitoring</h2>
            </div>
            <p className="text-lg text-slate-600 mb-6 leading-relaxed">
              Agricare utilizes high-precision <strong>Negative Temperature Coefficient (NTC) Thermistors</strong>. These sensors operate by measuring the change in electrical resistance as soil temperature fluctuates. 
            </p>
            <div className="space-y-4">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h4 className="font-bold text-slate-800 mb-2 italic">How it works in the field:</h4>
                <p className="text-sm text-slate-600">
                  Temperature dictates the rate of plant metabolism and microbial activity. Our sensors track soil heat at root depth to calculate <strong>Growing Degree Days (GDD)</strong>. This helps farmers in Bangladesh predict exactly when a crop like Rice or Wheat will transition from the vegetative to the reproductive stage, ensuring precise harvest timing.
                </p>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <img 
              src="https://images.unsplash.com/photo-1510133769068-68884a589708?q=80&w=1200&auto=format&fit=crop" 
              className="rounded-[3rem] shadow-2xl border-8 border-white hover:scale-105 transition-transform duration-500" 
              alt="Temperature Sensor" 
            />
          </div>
        </section>

        {/* 2. Moisture Sensor */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <img 
              src="https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=1200&auto=format&fit=crop" 
              className="rounded-[3rem] shadow-2xl border-8 border-white hover:scale-105 transition-transform duration-500" 
              alt="Moisture Sensor" 
            />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                <i className="fas fa-droplet text-xl"></i>
              </div>
              <h2 className="text-3xl font-bold text-slate-900">Volumetric Water Content (VWC)</h2>
            </div>
            <p className="text-lg text-slate-600 mb-6 leading-relaxed">
              Our moisture sensors employ <strong>Capacitive Frequency Domain Reflectometry (FDR)</strong>. Unlike cheap resistive sensors, capacitive probes do not corrode and provide much higher accuracy.
            </p>
            <div className="space-y-4">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h4 className="font-bold text-slate-800 mb-2 italic">How it works in the field:</h4>
                <p className="text-sm text-slate-600">
                  By creating an electromagnetic field, the sensor measures the soil's dielectric constant, which is primarily influenced by water content. In the real field, this prevents over-irrigation in low-lying delta regions of Bangladesh, saving up to 40% of fuel costs for water pumps while ensuring the roots never hit a "wilting point."
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. NPK Sensor */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                <i className="fas fa-flask-vial text-xl"></i>
              </div>
              <h2 className="text-3xl font-bold text-slate-900">Electrochemical Nutrient Profiling</h2>
            </div>
            <p className="text-lg text-slate-600 mb-6 leading-relaxed">
              The NPK sensor is the heart of our hardware. It uses <strong>Ion-Selective Electrodes (ISE)</strong> to detect Nitrogen (N), Phosphorus (P), and Potassium (K) ions within the soil solution.
            </p>
            <div className="space-y-4">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h4 className="font-bold text-slate-800 mb-2 italic">How it works in the field:</h4>
                <p className="text-sm text-slate-600">
                  In a real field environment, nutrients aren't distributed evenly. Our sensors calculate the "Plant Available" NPK by measuring the electrical conductivity of specific ions. This tells the farmer exactly how many kg of Urea or DAP to apply per bigha, preventing the leaching of expensive fertilizers into the groundwater.
                </p>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <img 
              src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=1200&auto=format&fit=crop" 
              className="rounded-[3rem] shadow-2xl border-8 border-white hover:scale-105 transition-transform duration-500" 
              alt="NPK Sensor" 
            />
          </div>
        </section>

        {/* 4. pH Sensor */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <img 
              src="https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=1200&auto=format&fit=crop" 
              className="rounded-[3rem] shadow-2xl border-8 border-white hover:scale-105 transition-transform duration-500" 
              alt="pH Sensor" 
            />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center">
                <i className="fas fa-vial text-xl"></i>
              </div>
              <h2 className="text-3xl font-bold text-slate-900">Acidity & Alkalinity Balance</h2>
            </div>
            <p className="text-lg text-slate-600 mb-6 leading-relaxed">
              Our pH sensors consist of a <strong>Glass Measuring Electrode</strong> and a <strong>Reference Electrode</strong>. It measures the potential difference generated by hydrogen ions across the glass membrane.
            </p>
            <div className="space-y-4">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h4 className="font-bold text-slate-800 mb-2 italic">How it works in the field:</h4>
                <p className="text-sm text-slate-600">
                  Soil pH determines "Nutrient Availability." If the soil is too acidic (common in red soil areas) or too alkaline, even if you add fertilizer, the plant cannot absorb it. In the field, our real-time pH monitoring alerts farmers if they need to apply lime to reduce acidity or sulfur to reduce alkalinity, ensuring the soil stays in the "Golden Zone" of 6.0–7.5 pH.
                </p>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* Technical Summary */}
      <section className="bg-slate-900 py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-12">Integrated Intelligence</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
              <i className="fas fa-microchip text-emerald-400 text-3xl mb-4"></i>
              <h4 className="text-white font-bold mb-2">LoRaWAN Mesh</h4>
              <p className="text-slate-400 text-sm">Data travels up to 10km across your farm with ultra-low power consumption.</p>
            </div>
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
              <i className="fas fa-shield-halved text-emerald-400 text-3xl mb-4"></i>
              <h4 className="text-white font-bold mb-2">Industrial Grade</h4>
              <p className="text-slate-400 text-sm">IP68 waterproof housing designed to survive monsoon rain and intense heat.</p>
            </div>
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
              <i className="fas fa-bolt text-emerald-400 text-3xl mb-4"></i>
              <h4 className="text-white font-bold mb-2">Solar Powered</h4>
              <p className="text-slate-400 text-sm">Infinite battery life through integrated high-efficiency PV panels.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-8">Ready to see your field in high definition?</h2>
        <button className="bg-emerald-600 text-white px-12 py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100">
          Get Started Now
        </button>
      </section>
    </div>
  );
};

export default HowItWorks;
