import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  PieChart, Pie, Cell
} from 'recharts';
import { AccessibilityScore } from '@accessfix/shared';

interface Props {
  score: AccessibilityScore;
}

const SEVERITY_COLORS = {
  Critical: '#dc2626',
  Major:    '#ea580c',
  Minor:    '#ca8a04',
};

export function AccessibilityCharts({ score }: Props) {
  // Radar data — per-principle scores
  const radarData = Object.entries(score.byPrinciple).map(([name, value]) => ({
    principle: name,
    score: value,
    fullMark: 100,
  }));

  // Bar data — violation counts
  const barData = [
    { name: 'Critical', count: score.violationCounts.critical, fill: SEVERITY_COLORS.Critical },
    { name: 'Major',    count: score.violationCounts.major,    fill: SEVERITY_COLORS.Major },
    { name: 'Minor',    count: score.violationCounts.minor,    fill: SEVERITY_COLORS.Minor },
  ];

  // Pie data — violations vs passed rules
  const pieData = [
    { name: 'Passed',   value: score.passRate,       color: '#16a34a' },
    { name: 'Failed',   value: 100 - score.passRate, color: '#dc2626' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Radar — POUR principles */}
      <div className="card">
        <h3 className="text-xs font-bold text-slate-500 mb-6 uppercase tracking-widest">Accessibility Principles</h3>
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis dataKey="principle" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} />
            <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} />
            <Radar
              name="Compliance"
              dataKey="score"
              stroke="#2563eb"
              fill="#2563eb"
              fillOpacity={0.1}
              strokeWidth={2}
            />
            <Tooltip
              formatter={(v: number) => [`${v}/100`, 'Score']}
              contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: '12px' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Bar — violation severity breakdown */}
      <div className="card">
        <h3 className="text-xs font-bold text-slate-500 mb-6 uppercase tracking-widest">Violation Intensity</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={barData} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(v: number) => [v, 'Issues Found']}
              contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: '12px' }}
              cursor={{ fill: '#f8fafc' }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {barData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie — pass rate */}
      <div className="card flex flex-col">
        <h3 className="text-xs font-bold text-slate-500 mb-6 uppercase tracking-widest">Audit Success Rate</h3>
        <div className="flex-1 flex flex-col items-center justify-center">
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={4}
                dataKey="value"
                strokeWidth={0}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => [`${v}%`, '']}
                contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest mt-4">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-600" aria-hidden="true" />
              <span className="text-slate-600">Pass: {score.passRate}%</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600" aria-hidden="true" />
              <span className="text-slate-600">Fail: {100 - score.passRate}%</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
