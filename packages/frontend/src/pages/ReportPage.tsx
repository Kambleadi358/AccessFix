import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getScan, downloadReport } from '@/lib/api';
import { ScanResult } from '@accessfix/shared';
import { ScoreRing } from '@/components/ScoreRing';
import { ViolationTable } from '@/components/ViolationTable';
import { AISuggestionsPanel } from '@/components/AISuggestionsPanel';
import { AccessibilityCharts } from '@/components/AccessibilityCharts';
import {
  Loader2, AlertCircle, ExternalLink, Download,
  FileJson, FileText, Globe, Calendar, Clock,
  Sparkles, BarChart3, List, Image as ImgIcon,
  ChevronLeft,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type Tab = 'overview' | 'violations' | 'ai' | 'screenshot';

export function ReportPage() {
  const { scanId } = useParams<{ scanId: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  useEffect(() => {
    if (!scanId) return;
    setLoading(true);
    getScan(scanId)
      .then(setResult)
      .catch((e: any) => setError(e?.response?.data?.error || 'Failed to load report data'))
      .finally(() => setLoading(false));
  }, [scanId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4" role="status">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-slate-500 font-medium">Generating report view...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <AlertCircle className="w-12 h-12 text-red-600" aria-hidden="true" />
        <h2 className="text-xl font-bold text-slate-900">Audit Report Unavailable</h2>
        <p className="text-slate-500 max-w-sm">{error}</p>
        <button onClick={() => navigate('/scan')} className="btn-primary mt-2">Perform New Audit</button>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: any; count?: number }[] = [
    { key: 'overview',    label: 'Audit Overview',   icon: BarChart3 },
    { key: 'violations',  label: 'WCAG Violations',  icon: List, count: result.violations.length },
    { key: 'ai',          label: 'AI Remediation', icon: Sparkles, count: result.aiSuggestions.length },
    { key: 'screenshot',  label: 'Page Preview',     icon: ImgIcon },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back link */}
      <button 
        onClick={() => navigate('/history')}
        className="group flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" aria-hidden="true" />
        Back to History
      </button>

      {/* Report Summary Card */}
      <div className="card">
        <div className="flex flex-col lg:flex-row lg:items-center gap-8">
          {/* Score */}
          <div className="flex-shrink-0 lg:border-r lg:border-slate-100 lg:pr-8">
            <ScoreRing score={result.score} size="lg" />
          </div>

          {/* Metadata */}
          <div className="flex-1 min-w-0 space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2 break-words leading-tight">
                {result.pageTitle || 'Accessibility Audit Report'}
              </h1>
              <a
                href={result.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-mono text-sm group"
              >
                <Globe className="w-4 h-4 text-slate-400 group-hover:text-blue-600" aria-hidden="true" />
                {result.url}
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2 text-slate-500">
                <Calendar className="w-4 h-4" aria-hidden="true" />
                <span className="font-medium">Audited:</span>
                {formatDistanceToNow(new Date(result.scannedAt), { addSuffix: true })}
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <Clock className="w-4 h-4" aria-hidden="true" />
                <span className="font-medium">Time:</span>
                {(result.durationMs / 1000).toFixed(1)}s audit duration
              </div>
              {result.pageLanguage && (
                <div className="flex items-center gap-2 text-slate-500">
                  <Globe className="w-4 h-4" aria-hidden="true" />
                  <span className="font-medium">Language:</span>
                  {result.pageLanguage.toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="badge-critical font-bold">{result.score.violationCounts.critical} Critical</span>
              <span className="badge-major font-bold">{result.score.violationCounts.major} Major</span>
              <span className="badge-minor font-bold">{result.score.violationCounts.minor} Minor</span>
              <span className="badge-info font-bold">{result.score.passRate}% Rule Success</span>
            </div>
          </div>

          {/* Export Actions */}
          <div className="flex flex-col gap-2 pt-6 lg:pt-0 lg:border-l lg:border-slate-100 lg:pl-8 min-w-[160px]">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-1">Export Result</p>
            <button onClick={() => downloadReport(result.scanId, 'json')} className="btn-secondary w-full justify-start text-xs">
              <FileJson className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" /> Raw Data (JSON)
            </button>
            <button onClick={() => downloadReport(result.scanId, 'csv')} className="btn-secondary w-full justify-start text-xs">
              <FileText className="w-3.5 h-3.5 text-green-600" aria-hidden="true" /> Spreadsheet (CSV)
            </button>
            <button onClick={() => downloadReport(result.scanId, 'html')} className="btn-primary w-full justify-start text-xs bg-slate-800 hover:bg-slate-900 border-none">
              <Download className="w-3.5 h-3.5 text-white" aria-hidden="true" /> PDF / HTML Report
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <nav className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1 shadow-sm" aria-label="Report sections">
        {tabs.map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            aria-current={activeTab === key ? 'page' : undefined}
            className={`flex items-center gap-2.5 px-6 py-2.5 text-sm font-semibold rounded-md transition-all duration-150 ${
              activeTab === key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Icon className="w-4 h-4" aria-hidden="true" />
            {label}
            {count !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>{count}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      <div className="focus:outline-none" role="tabpanel" tabIndex={0}>
        {activeTab === 'overview' && (
          <AccessibilityCharts score={result.score} />
        )}
        {activeTab === 'violations' && (
          <ViolationTable violations={result.violations} />
        )}
        {activeTab === 'ai' && (
          <AISuggestionsPanel suggestions={result.aiSuggestions} />
        )}
        {activeTab === 'screenshot' && (
          <div className="card space-y-4">
            <h3 className="section-title text-lg">Visual Audit Preview</h3>
            {result.screenshotPath ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-500 italic">Page appearance at the time of the accessibility audit.</p>
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 shadow-inner">
                  <img
                    src={result.screenshotPath}
                    alt={`Audit screenshot of ${result.url}`}
                    className="w-full h-auto block"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-20 bg-slate-50 rounded-lg border border-slate-100">
                <ImgIcon className="w-12 h-12 mx-auto mb-3 text-slate-300" aria-hidden="true" />
                <p className="text-slate-500 font-medium">No preview image available</p>
                <p className="text-xs text-slate-400 mt-1">Enable "Visual Preview" in scan options to capture screenshots.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
