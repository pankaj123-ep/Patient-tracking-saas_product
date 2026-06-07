import { VitalRecord } from "../types";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

interface VitalChartsProps {
  vitals: VitalRecord[];
}

export default function VitalCharts({ vitals }: VitalChartsProps) {
  if (!vitals || vitals.length === 0) {
    return (
      <div id="no-vitals-container" className="flex items-center justify-center h-52 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
        <p className="text-slate-400 font-sans text-sm">No vital indicators logged yet.</p>
      </div>
    );
  }

  // Map and sort chronologically for recharts
  const chartData = [...vitals]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((v) => {
      const time = new Date(v.timestamp);
      return {
        timeLabel: time.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " " + time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        "Heart Rate": v.heartRate,
        Systolic: v.systolic,
        Diastolic: v.diastolic,
        "Oxygen SpO2": v.spo2,
        Temperature: v.temperature,
        Respiration: v.respiratoryRate
      };
    });

  return (
    <div id="vitals-charts-section" className="space-y-6">
      {/* Chart 1: Blood Pressure & Heart Rate */}
      <div id="chart-bp-hr-panel" className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Cardiovascular indicators (BP & Pulse)</h4>
        <div id="chart-bp-container" className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="timeLabel" stroke="#94a3b8" fontSize={10} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e293b", borderRadius: "8px", border: "none", color: "white" }}
                itemStyle={{ color: "#f8fafc", fontSize: "11px" }}
                labelStyle={{ color: "#94a3b8", fontSize: "10px", fontWeight: "bold" }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
              <Line type="monotone" dataKey="Systolic" stroke="#3b82f6" strokeWidth={2.5} activeDot={{ r: 6 }} name="Systolic BP (mmHg)" />
              <Line type="monotone" dataKey="Diastolic" stroke="#06b6d4" strokeWidth={2.2} activeDot={{ r: 5 }} name="Diastolic BP (mmHg)" />
              <Line type="monotone" dataKey="Heart Rate" stroke="#ef4444" strokeWidth={2} activeDot={{ r: 5 }} name="Pulse (bpm)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: SpO2, Temperature and Respiration */}
      <div id="chart-other-vitals-panel" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Oxygen & Respiration */}
        <div id="chart-resp-panel" className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Respiratory & Blood Oxygenation</h4>
          <div id="chart-resp-container" className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="timeLabel" stroke="#94a3b8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", borderRadius: "8px", border: "none", color: "white" }}
                  itemStyle={{ fontSize: "10px" }}
                />
                <Legend verticalAlign="top" height={28} iconType="circle" wrapperStyle={{ fontSize: "10px" }} />
                <Line type="monotone" dataKey="Oxygen SpO2" stroke="#10b981" strokeWidth={2} name="SpO2 (%)" />
                <Line type="monotone" dataKey="Respiration" stroke="#8b5cf6" strokeWidth={1.8} name="Respiratory Rate" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Temperature */}
        <div id="chart-temp-panel" className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Thermodynamic Trend</h4>
          <div id="chart-temp-container" className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="timeLabel" stroke="#94a3b8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", borderRadius: "8px", border: "none", color: "white" }}
                  itemStyle={{ fontSize: "10px" }}
                />
                <Legend verticalAlign="top" height={28} iconType="circle" wrapperStyle={{ fontSize: "10px" }} />
                <Line type="monotone" dataKey="Temperature" stroke="#f97316" strokeWidth={2} name="Temp (°C)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
