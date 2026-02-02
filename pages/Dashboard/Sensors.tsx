import React, { useState, useEffect } from 'react';
import { User, Field, Sensor } from '../../types';
import { syncFields, syncSensorsFromDb, addOrUpdateSensorInDb, deleteSensorFromDb } from '../../services/db';

const Sensors: React.FC<{ user: User }> = ({ user }) => {
  const [fields, setFields] = useState<Field[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSensor, setEditingSensor] = useState<Sensor | null>(null);

  const [formData, setFormData] = useState({
    type: 'Moisture',
    fieldId: ''
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const f = await syncFields(user.id);
      setFields(f);
      if (f.length > 0) {
        setFormData(prev => ({ ...prev, fieldId: f[0].field_id.toString() }));
        const s = await syncSensorsFromDb(f);
        setSensors(s);
      }
      setLoading(false);
    };
    load();
  }, [user.id]);

  const handleAddSensor = async (e: React.FormEvent) => {
    e.preventDefault();
    const newSensor: Sensor = {
      sensor_id: Math.floor(1000 + Math.random() * 9000),
      field_id: parseInt(formData.fieldId),
      sensor_type: formData.type,
      battery_level: 100,
      status: 'active',
      last_active: new Date().toISOString()
    };
    await addOrUpdateSensorInDb(newSensor);
    setSensors([newSensor, ...sensors]);
    setShowAddModal(false);
  };

  const toggleStatus = async (sensor: Sensor) => {
    const updated = { ...sensor, status: sensor.status === 'active' ? 'inactive' : 'active' as any };
    await addOrUpdateSensorInDb(updated);
    setSensors(sensors.map(s => s.sensor_id === sensor.sensor_id ? updated : s));
  };

  const removeSensor = async (id: number) => {
    if (confirm("Remove this sensor node from your network?")) {
      await deleteSensorFromDb(id);
      setSensors(sensors.filter(s => s.sensor_id !== id));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">IoT Device Network</h1>
          <p className="text-slate-500 font-medium">Manage and monitor your field telemetry nodes.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl flex items-center gap-3 active:scale-95"
        >
          <i className="fas fa-plus"></i> Pair New Node
        </button>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sensors.map(sensor => {
            const field = fields.find(f => f.field_id === sensor.field_id);
            return (
              <div key={sensor.sensor_id} className="bento-card p-8 bg-white flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${
                    sensor.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <i className={`fas ${
                      sensor.sensor_type.includes('Moisture') ? 'fa-droplet' : 
                      sensor.sensor_type.includes('Temp') ? 'fa-temperature-half' : 
                      sensor.sensor_type.includes('NPK') ? 'fa-vial' : 'fa-flask'
                    }`}></i>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggleStatus(sensor)} className="w-10 h-10 bg-slate-50 text-slate-400 hover:text-emerald-500 rounded-xl transition-colors">
                      <i className="fas fa-power-off"></i>
                    </button>
                    <button onClick={() => removeSensor(sensor.sensor_id)} className="w-10 h-10 bg-slate-50 text-slate-400 hover:text-red-500 rounded-xl transition-colors">
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>

                <div className="flex-grow">
                  <h3 className="text-xl font-bold text-slate-900">{sensor.sensor_type}</h3>
                  <p className="text-sm font-medium text-slate-400 mb-6">{field?.field_name || 'Unassigned'}</p>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Battery</span>
                      <span className={`font-black ${sensor.battery_level < 20 ? 'text-red-500' : 'text-emerald-600'}`}>
                        {sensor.battery_level}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${sensor.battery_level < 20 ? 'bg-red-500' : 'bg-emerald-500'}`}
                        style={{ width: `${sensor.battery_level}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${sensor.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{sensor.status}</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">ID: #{sensor.sensor_id}</span>
                </div>
              </div>
            );
          })}
          
          {sensors.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white border-2 border-dashed border-slate-200 rounded-[3rem]">
              <i className="fas fa-satellite-dish text-6xl text-slate-100 mb-4"></i>
              <h3 className="text-xl font-bold text-slate-400">No nodes connected yet</h3>
              <button onClick={() => setShowAddModal(true)} className="mt-6 text-emerald-600 font-bold hover:underline">
                Register your first sensor node
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in duration-200">
            <h2 className="text-2xl font-black mb-8 text-slate-900">Pair New Device</h2>
            <form onSubmit={handleAddSensor} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Type</label>
                <select 
                  className="w-full px-5 py-4 rounded-2xl border-none bg-slate-50 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                >
                  <option>Moisture Probe</option>
                  <option>Temperature Node</option>
                  <option>NPK Analyzer</option>
                  <option>pH Diagnostic</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Assign to Field</label>
                <select 
                  className="w-full px-5 py-4 rounded-2xl border-none bg-slate-50 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={formData.fieldId}
                  onChange={e => setFormData({ ...formData, fieldId: e.target.value })}
                >
                  {fields.map(f => <option key={f.field_id} value={f.field_id}>{f.field_name}</option>)}
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 rounded-2xl font-bold bg-slate-100 text-slate-500">Cancel</button>
                <button type="submit" className="flex-1 py-4 rounded-2xl font-bold bg-emerald-600 text-white shadow-lg shadow-emerald-200">Activate Node</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sensors;