import { AIFixSuggestion, Violation } from '@accessfix/shared';
import { Sparkles, Code2, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, Wand2, Eye } from 'lucide-react';
import { useState } from 'react';
import { RemediationPreview } from './RemediationPreview';

interface Props {
  suggestions: AIFixSuggestion[];
  violations: Violation[];
}

export function AISuggestionsPanel({ suggestions, violations }: Props) {
  const [expanded, setExpanded] = useState<number | null>(0);
  const [previewItem, setPreviewItem] = useState<{ v: Violation, s: AIFixSuggestion } | null>(null);

  if (suggestions.length === 0) {
    return (
      <div className="card text-center py-20 bg-slate-50 border-dashed border-2">
        <Sparkles className="w-12 h-12 mx-auto mb-4 text-slate-300" aria-hidden="true" />
        <h3 className="text-lg font-bold text-slate-900 mb-2">No AI fixes generated</h3>
        <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
          Fixes are only generated for supported rules when "AI Recommendations" is enabled during the audit.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 flex items-center gap-3">
        <Wand2 className="w-5 h-5 text-purple-600" aria-hidden="true" />
        <p className="text-sm font-medium text-purple-900">
          AI suggestions are based on best practices. Review before applying to production.
        </p>
      </div>

      <div className="space-y-3">
        {suggestions.map((s, i) => {
          const isOpen = expanded === i;
          return (
            <div 
              key={i} 
              className={`border rounded-lg overflow-hidden transition-all duration-150 ${
                isOpen ? 'border-purple-200 ring-1 ring-purple-100 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <button
                className="w-full p-4 flex items-center gap-4 text-left focus:outline-none"
                onClick={() => setExpanded(isOpen ? null : i)}
                aria-expanded={isOpen}
              >
                <div className={`w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 ${isOpen ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-600'}`}>
                  <Sparkles className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rule Fix</span>
                    <span className="text-xs font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">{s.ruleId}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 leading-tight">{s.explanation}</h4>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confidence</p>
                    <p className="text-xs font-bold text-slate-700">{Math.round(s.confidence * 100)}%</p>
                  </div>
                  {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </div>
              </button>

              {isOpen && (
                <div className="p-6 border-t border-purple-100 bg-slate-50/30 space-y-6">
                  {/* Accessibility Impact */}
                  <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-purple-100 shadow-sm">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <h5 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-1.5">Impact on Accessibility</h5>
                      <p className="text-sm text-slate-600 leading-relaxed font-medium">{s.accessibilityImpact}</p>
                    </div>
                  </div>

                  {/* Comparison View */}
                  <div className="space-y-3">
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Proposed Code Change</h5>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden shadow-inner">
                      {/* Original HTML */}
                      <div className="bg-white p-4 space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-500" aria-hidden="true" />
                          <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Current HTML</span>
                        </div>
                        <pre className="text-xs font-mono text-slate-500 bg-red-50/50 p-3 rounded border border-red-100 whitespace-pre-wrap break-all min-h-[80px] leading-relaxed">
                          {s.originalHtml || '(Snippet not available)'}
                        </pre>
                      </div>

                      {/* Fixed HTML */}
                      <div className="bg-white p-4 space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" aria-hidden="true" />
                          <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Suggested Fix</span>
                        </div>
                        <pre className="text-xs font-mono text-slate-800 bg-green-50/50 p-3 rounded border border-green-100 whitespace-pre-wrap break-all min-h-[80px] leading-relaxed">
                          {s.fixedHtml || '(Suggestion failed to generate)'}
                        </pre>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => {
                        const violation = violations.find(v => v.ruleId === s.ruleId);
                        if (violation) setPreviewItem({ v: violation, s });
                      }}
                      className="btn-primary text-[10px] h-8 px-4 flex items-center gap-2 bg-purple-600 hover:bg-purple-700 border-none"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Visual Preview Fix
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {previewItem && (
        <RemediationPreview 
          violation={previewItem.v} 
          suggestion={previewItem.s} 
          onClose={() => setPreviewItem(null)} 
        />
      )}
    </div>
  );
}
