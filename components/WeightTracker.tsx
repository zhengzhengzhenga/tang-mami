import React, { useMemo, useState } from 'react';
import { ChevronLeft, Scale, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { WeightLog } from '../types';

interface WeightTrackerProps {
  logs: WeightLog[];
  onAddLog: (log: WeightLog) => void;
  onBack: () => void;
}

const WeightTracker: React.FC<WeightTrackerProps> = ({ logs, onAddLog, onBack }) => {
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const sortedLogs = useMemo(
    () => [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [logs]
  );

  const latestWeight = sortedLogs[0]?.weight;

  const handleSave = () => {
    if (!weight) return;

    const existingSameDay = sortedLogs.find(
      l => new Date(l.timestamp).toISOString().split('T')[0] === selectedDate
    );

    const logDate = new Date(selectedDate);
    const now = new Date();
    logDate.setHours(now.getHours(), now.getMinutes(), 0, 0);

    onAddLog({
      id: existingSameDay?.id || Date.now().toString(),
      weight: parseFloat(weight),
      note: note.trim() || undefined,
      timestamp: logDate,
    });

    setWeight('');
    setNote('');
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
      <div className="flex items-center justify-between mb-2">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:text-rose-500 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-bold text-slate-900">每日体重</h2>
        <div className="w-10" />
      </div>

      <section className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <p className="text-xs text-slate-400 mb-2">最新体重</p>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold text-indigo-600">{latestWeight ?? '--'}</span>
          <span className="text-xs text-slate-500 mb-1">kg</span>
        </div>
      </section>

      <section className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-700">记录体重</h3>
        <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
          <CalendarIcon size={16} className="text-slate-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-xs font-bold text-slate-600 w-full"
          />
        </div>
        <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <Scale size={18} className="text-indigo-500" />
          <input
            type="number"
            step="0.1"
            placeholder="请输入体重"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="bg-transparent border-none focus:ring-0 font-bold text-slate-700 w-full"
          />
          <span className="text-xs text-slate-400 font-bold">kg</span>
        </div>
        <textarea
          placeholder="备注（可选）：如晨起空腹"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full p-3 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-300 min-h-[72px] text-sm"
        />
        <button
          onClick={handleSave}
          className="w-full py-4 bg-indigo-500 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={18} /> 保存今日体重
        </button>
      </section>

      <section className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-700">近期记录</h3>
        {sortedLogs.length > 0 ? sortedLogs.slice(0, 14).map(log => (
          <div key={log.id} className="flex items-center justify-between bg-slate-50 rounded-2xl px-4 py-3">
            <div>
              <p className="text-xs font-bold text-slate-700">{new Date(log.timestamp).toLocaleDateString()}</p>
              {log.note && <p className="text-[10px] text-slate-400 mt-0.5">{log.note}</p>}
            </div>
            <p className="text-sm font-bold text-indigo-600">{log.weight} kg</p>
          </div>
        )) : (
          <p className="text-xs text-slate-400">暂无体重记录</p>
        )}
      </section>
    </div>
  );
};

export default WeightTracker;
