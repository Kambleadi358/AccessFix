import { Violation, AIFixSuggestion } from '@accessfix/shared';
import { Eye, Code2, CheckCircle2, AlertTriangle, X, Download } from 'lucide-react';
import { useState } from 'react';

interface Props {
  violation: Violation;
  suggestion: AIFixSuggestion;
  onClose: () => void;
  onDownloadReport?: () => void;
}

export function RemediationPreview({ violation, suggestion, onClose, onDownloadReport }: Props) {
  const [view, setView] = useState<'preview' | 'code'>('preview');

  const sanitizeForIframe = (html: string) => {
    // Basic wrap to ensure it looks decent in iframe
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { 
            font-family: sans-serif; 
            padding: 20px; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            min-height: 100vh;
            margin: 0;
            background: #f8fafc;
          }
          * { box-sizing: border-box; }
          /* Reset some styles that might interfere */
          button, input, select, textarea { font-family: inherit; }
        </style>
      </head>
      <body>
        ${html}
      </body>
      </html>
    `;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <Eye className="w-5 h-5 text-purple-600" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 leading-tight">Remediation Preview</h3>
              <p className="text-xs text-slate-500 font-medium">{violation.ruleId}: {violation.title}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setView('preview')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${view === 'preview' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Visual Preview
              </button>
              <button
                onClick={() => setView('code')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${view === 'code' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Code Diff
              </button>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Close preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-slate-50">
          {view === 'preview' ? (
            <div className="h-full grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Before (Original)</span>
                </div>
                <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm relative">
                  <iframe
                    title="Original HTML Preview"
                    srcDoc={sanitizeForIframe(suggestion.originalHtml)}
                    className="w-full h-full border-none"
                    sandbox="allow-scripts"
                  />
                  <div className="absolute top-3 right-3 px-2 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded border border-red-100 uppercase">Violation</div>
                </div>
              </div>
              
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">After (Fixed)</span>
                </div>
                <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm relative">
                  <iframe
                    title="Fixed HTML Preview"
                    srcDoc={sanitizeForIframe(suggestion.fixedHtml)}
                    className="w-full h-full border-none"
                    sandbox="allow-scripts"
                  />
                  <div className="absolute top-3 right-3 px-2 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded border border-green-100 uppercase">Accessible</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full p-6 overflow-auto">
              <div className="space-y-6 max-w-4xl mx-auto">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Comparison</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">Current Code</span>
                      </div>
                      <pre className="p-4 bg-slate-900 text-slate-300 rounded-lg font-mono text-sm overflow-x-auto border border-slate-800">
                        {suggestion.originalHtml}
                      </pre>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">Suggested Fix</span>
                      </div>
                      <pre className="p-4 bg-slate-900 text-white rounded-lg font-mono text-sm overflow-x-auto border border-slate-800 ring-1 ring-green-500/30">
                        {suggestion.fixedHtml}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 mb-1">Accessibility Improvement</h4>
                      <p className="text-sm text-slate-600 leading-relaxed">{suggestion.accessibilityImpact}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 pt-4 border-t border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Code2 className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 mb-1">AI Explanation</h4>
                      <p className="text-sm text-slate-600 leading-relaxed">{suggestion.explanation}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between">
          <p className="text-xs text-slate-400 font-medium">Confidence Score: <span className="text-slate-700 font-bold">{Math.round(suggestion.confidence * 100)}%</span></p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="btn-secondary text-xs px-6"
            >
              Close
            </button>
            {onDownloadReport && (
              <button
                onClick={onDownloadReport}
                className="btn-primary text-xs px-6 flex items-center gap-2 bg-slate-900 border-none"
              >
                <Download className="w-3.5 h-3.5" />
                Download Remediation Report
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
