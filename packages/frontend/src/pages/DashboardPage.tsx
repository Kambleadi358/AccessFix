import { useEffect, useState } from 'react';
import { getStats, getRules } from '@/lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import {
  Loader2, BarChart3, Shield, ScanLine,
  TrendingUp, AlertCircle, List, CheckCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Stats {
  totalScans:            number;
  averageScore:          number;
  avgCritical:           number;
  avgMajor:              number;
  avgMinor:              number;
  mostCommonViolations:  Array<{ ruleId: string; count: number }>;
  scoreDistribution:     Array<{ range: string; count: number }>;
}

const DIST_COLORS: Record<string, string> = {
  '90–100': '#16a34a',
  '75–89':  '#65a30d',
  '60–74':  '#d97706',
  '40–59':  '#ea580c',
  '0–39':   '#dc2626',
};

function KpiCard({ label, value, sub, icon: Icon, valueClass = 'text-slate-900' }: {
  label: string; value: string | number; sub?: string;
  icon: any; valueClass?: string;
}) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className={`text-3xl font-bold mt-1 ${valueClass}`}>{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className="w-9 h-9 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-slate-500" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats]   = useState<Stats | null>(null);
  const [rules, setRules]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getStats(), getRules()])
      .then(([s, r]) => { setStats(s); setRules(r); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-24" role="status" aria-label="Loading dashboard">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!stats || stats.totalScans === 0) {
    return (
      <div className="text-center py-24">
        <BarChart3 className="w-12 h-12 mx-auto mb-4 text-slate-300" aria-hidden="true" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-slate-500 mb-6">No scan data yet. Run your first scan to see analytics here.</p>
        <button onClick={() => navigate('/scan')} className="btn-primary mx-auto">
          <ScanLine className="w-4 h-4" aria-hidden="true" />
          Start First Scan
        </button>
      </div>
    );
  }

  const gradeFromScore = (s: number) =>
    s >= 90 ? 'A' : s >= 75 ? 'B' : s >= 60 ? 'C' : s >= 40 ? 'D' : 'F';

  const scoreColor =
    stats.averageScore >= 90 ? 'text-green-600' :
    stats.averageScore >= 75 ? 'text-lime-600'  :
    stats.averageScore >= 60 ? 'text-amber-600' :
    stats.averageScore >= 40 ? 'text-orange-600': 'text-red-600';

  return (
    <div className="space-y-8">

      {/* ── Page header ────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            Aggregated accessibility insights across all scans
          </p>
        </div>
        <button onClick={() => navigate('/scan')} className="btn-primary">
          <ScanLine className="w-4 h-4" aria-hidden="true" />
          New Scan
        </button>
      </div>

      {/* ── KPI cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" role="region" aria-label="Key metrics">
        <KpiCard icon={ScanLine}     label="Total Scans"  value={stats.totalScans} />
        <KpiCard icon={TrendingUp}   label="Avg Score"    value={stats.averageScore} valueClass={scoreColor} />
        <KpiCard icon={AlertCircle}  label="Avg Critical" value={stats.avgCritical.toFixed(1)} valueClass="text-red-600" sub="violations per scan" />
        <KpiCard icon={CheckCircle2} label="Avg Grade"    value={gradeFromScore(stats.averageScore)} valueClass={scoreColor} />
      </div>

      {/* ── Charts row ─────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Score Distribution */}
        <section className="card" aria-labelledby="chart-dist">
          <h2 id="chart-dist" className="section-title mb-5">
            <BarChart3 className="w-4 h-4 text-blue-600" aria-hidden="true" />
            Score Distribution
          </h2>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={stats.scoreDistribution} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="range" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6 }}
                labelStyle={{ color: '#0f172a', fontWeight: 600 }}
                cursor={{ fill: 'rgba(0,0,0,0.03)' }}
              />
              <Bar dataKey="count" name="Scans" radius={[4, 4, 0, 0]}>
                {stats.scoreDistribution.map((entry) => (
                  <Cell key={entry.range} fill={DIST_COLORS[entry.range] || '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </section>

        {/* Most Common Violations */}
        <section className="card" aria-labelledby="chart-violations">
          <h2 id="chart-violations" className="section-title mb-5">
            <List className="w-4 h-4 text-blue-600" aria-hidden="true" />
            Most Common Violations
          </h2>
          <div className="space-y-3">
            {stats.mostCommonViolations.slice(0, 8).map(({ ruleId, count }) => {
              const maxCount = stats.mostCommonViolations[0]?.count || 1;
              const pct = Math.round((count / maxCount) * 100);
              return (
                <div key={ruleId}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-mono text-slate-700">{ruleId}</span>
                    <span className="text-slate-500 font-medium">{count}×</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden" role="progressbar"
                    aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}
                    aria-label={`${ruleId}: ${count} occurrences`}>
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* ── Active WCAG Rules ───────────────────────────────── */}
      <section className="card" aria-labelledby="rules-heading">
        <h2 id="rules-heading" className="section-title mb-5">
          <Shield className="w-4 h-4 text-blue-600" aria-hidden="true" />
          Active WCAG Rules
          <span className="ml-auto text-xs font-normal text-slate-500">{rules.length} rules</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {rules.map((rule) => (
            <div key={rule.id} className="flex items-center gap-3 p-3 rounded-md bg-slate-50 border border-slate-200">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{rule.title}</p>
                <p className="text-xs text-slate-400 font-mono">WCAG {rule.wcag}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className={`level-${rule.level.toLowerCase()}`}>{rule.level}</span>
                <span className={
                  rule.severity === 'Critical' ? 'badge-critical' :
                  rule.severity === 'Major'    ? 'badge-major'    : 'badge-minor'
                }>{rule.severity}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
