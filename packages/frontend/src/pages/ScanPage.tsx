import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { startScan } from '@/lib/api';
import { ScanOptions } from '@accessfix/shared';
import {
  ScanLine, Loader2, Globe, Settings2, ChevronDown, ChevronUp,
  AlertCircle, Zap, Brain, Camera,
} from 'lucide-react';
import toast from 'react-hot-toast';

const EXAMPLE_URLS = [
  'https://example.com',
  'https://wikipedia.org',
  'https://reactjs.org',
];

export function ScanPage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState<ScanOptions>({
    captureScreenshot: true,
    enableAI: false,
    waitUntil: 'networkidle2',
    viewportWidth: 1280,
    viewportHeight: 800,
    timeout: 30000,
  });

  const handleScan = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      toast.error('Please enter a URL to scan');
      return;
    }
    if (!/^https?:\/\/.+/.test(trimmed)) {
      toast.error('URL must start with http:// or https://');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Launching accessibility audit...', {
      style: { borderRadius: '8px', background: '#fff', color: '#0f172a' }
    });

    try {
      const result = await startScan({ url: trimmed, options });
      toast.dismiss(toastId);

      if (result.status === 'failed') {
        toast.error(`Scan failed: ${result.error}`);
      } else {
        toast.success('Audit complete');
        navigate(`/report/${result.scanId}`);
      }
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(err?.response?.data?.error || 'Scan request failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      {/* Header */}
      <div className="text-center sm:text-left">
        <h1 className="text-3xl font-bold text-slate-900 mb-3 flex items-center justify-center sm:justify-start gap-2">
          <ScanLine className="w-8 h-8 text-blue-600" aria-hidden="true" />
          Audit a Website
        </h1>
        <p className="text-slate-600 text-lg">
          Enter a URL to perform a comprehensive accessibility analysis based on WCAG 2.1/2.2 standards.
        </p>
      </div>

      {/* Input section */}
      <div className="card space-y-6">
        <div>
          <label htmlFor="scan-url" className="block text-sm font-semibold text-slate-700 mb-2">
            Target URL
          </label>
          <div className="relative group">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" aria-hidden="true" />
            <input
              id="scan-url"
              type="url"
              className="input-field pl-12 text-base font-sans"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              disabled={loading}
              aria-required="true"
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-3" aria-label="Example URLs">
            <span className="text-xs text-slate-500 font-medium">Examples:</span>
            {EXAMPLE_URLS.map((u) => (
              <button
                key={u}
                onClick={() => setUrl(u)}
                className="text-xs text-blue-600 hover:text-blue-700 hover:underline font-medium"
              >
                {u.replace('https://', '')}
              </button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="border-t border-slate-100 pt-4">
          <button
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            onClick={() => setShowOptions(!showOptions)}
            aria-expanded={showOptions}
          >
            <Settings2 className="w-4 h-4" aria-hidden="true" />
            Audit Configuration
            {showOptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showOptions && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-6 p-5 bg-slate-50 rounded-lg border border-slate-200">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  checked={options.enableAI}
                  onChange={(e) => setOptions({ ...options, enableAI: e.target.checked })}
                />
                <div>
                  <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                    <Brain className="w-4 h-4 text-purple-600" aria-hidden="true" />
                    AI Fix Recommendations
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Generate intelligent HTML fixes for detected issues.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  checked={options.captureScreenshot}
                  onChange={(e) => setOptions({ ...options, captureScreenshot: e.target.checked })}
                />
                <div>
                  <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-blue-600" aria-hidden="true" />
                    Visual Preview
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Capture a full-page screenshot of the audited site.</p>
                </div>
              </label>

              <div className="space-y-1.5">
                <label htmlFor="timeout" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Timeout Limit (ms)
                </label>
                <input
                  id="timeout"
                  type="number"
                  className="input-field py-2"
                  value={options.timeout}
                  onChange={(e) => setOptions({ ...options, timeout: parseInt(e.target.value) })}
                  min={5000}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="waitUntil" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Rendering Mode
                </label>
                <select
                  id="waitUntil"
                  className="input-field py-2 font-sans"
                  value={options.waitUntil}
                  onChange={(e) => setOptions({ ...options, waitUntil: e.target.value as any })}
                >
                  <option value="networkidle2">Reliable (Network Idle)</option>
                  <option value="domcontentloaded">Fast (DOM Ready)</option>
                  <option value="load">Standard (Full Load)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleScan}
          disabled={loading || !url}
          className="btn-primary w-full justify-center py-4 text-base"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              Performing Accessibility Audit...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" aria-hidden="true" />
              Analyze Website
            </>
          )}
        </button>
      </div>

      {/* Feature pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" role="list">
        {[
          { icon: Globe,    label: 'Modern Web Support', desc: 'React, Vue, and SPAs' },
          { icon: ScanLine, label: 'WCAG 2.2 Compliant', desc: '10+ Rule categories' },
          { icon: Brain,    label: 'Automated Fixes',    desc: 'Intelligent suggestions' },
        ].map(({ icon: Icon, label, desc }) => (
          <div key={label} className="card-sm flex items-center gap-4" role="listitem">
            <div className="p-2 rounded bg-blue-50">
              <Icon className="w-5 h-5 text-blue-600" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{label}</p>
              <p className="text-xs text-slate-500">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-sm text-amber-800 leading-relaxed">
          <strong>Note:</strong> Automated audits are a first step towards accessibility compliance. 
          Manual testing with screen readers is always recommended for a full evaluation.
        </p>
      </div>
    </div>
  );
}
