import { Violation } from '@accessfix/shared';
import { AlertCircle, AlertTriangle, Info, ChevronDown, ChevronUp, Wrench, Trash2, CheckSquare, Square, Filter } from 'lucide-react';
import { useState, useMemo } from 'react';

interface Props {
  violations: Violation[];
}

const severityConfig = {
  Critical: { badge: 'badge-critical', icon: AlertCircle,   color: 'text-red-600',    bg: 'bg-red-50' },
  Major:    { badge: 'badge-major',    icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
  Minor:    { badge: 'badge-minor',    icon: Info,            color: 'text-amber-600',  bg: 'bg-amber-50' },
};

export function ViolationTable({ violations: initialViolations }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<'All' | 'Critical' | 'Major' | 'Minor'>('All');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [ignoredIds, setIgnoredIds] = useState<Set<number>>(new Set());

  const visibleViolations = useMemo(() => {
    return initialViolations
      .map((v, index) => ({ ...v, originalIndex: index }))
      .filter((v) => !ignoredIds.has(v.originalIndex));
  }, [initialViolations, ignoredIds]);

  const filtered = useMemo(() => {
    return filter === 'All' 
      ? visibleViolations 
      : visibleViolations.filter((v) => v.severity === filter);
  }, [visibleViolations, filter]);

  const toggleSelection = (idx: number) => {
    const next = new Set(selectedIds);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(v => v.originalIndex)));
    }
  };

  const dismissSelected = () => {
    const nextIgnored = new Set(ignoredIds);
    selectedIds.forEach(id => nextIgnored.add(id));
    setIgnoredIds(nextIgnored);
    setSelectedIds(new Set());
  };

  const isAllSelected = filtered.length > 0 && selectedIds.size === filtered.length;

  return (
    <div className="space-y-4">
      {/* Table Controls */}
      <div className="sticky top-16 z-40 bg-slate-50 p-3 rounded-lg border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" aria-hidden="true" />
            {(['All', 'Critical', 'Major', 'Minor'] as const).map((f) => {
              const count = f === 'All' ? visibleViolations.length
                : visibleViolations.filter((v) => v.severity === f).length;
              const isActive = filter === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-all border ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                  }`}
                  aria-pressed={isActive}
                >
                  {f} <span className={`ml-1 ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>{count}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4">
            {ignoredIds.size > 0 && (
              <span className="text-xs text-slate-500 font-medium italic">
                {ignoredIds.size} violations hidden
              </span>
            )}
            {selectedIds.size > 0 && (
              <button
                onClick={dismissSelected}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded text-xs font-bold hover:bg-red-700 shadow-sm transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                Dismiss Selected ({selectedIds.size})
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 px-2">
          <button 
            onClick={toggleSelectAll}
            className="text-slate-400 hover:text-blue-600 transition-colors"
            aria-label={isAllSelected ? "Deselect all" : "Select all"}
          >
            {isAllSelected ? <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5" />}
          </button>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Toggle All Results</span>
        </div>
      </div>

      {/* Violation List */}
      <div className="space-y-3" role="list">
        {filtered.length === 0 ? (
          <div className="card text-center py-20 bg-white border-dashed">
            <Info className="w-10 h-10 mx-auto mb-3 text-slate-300" aria-hidden="true" />
            <p className="font-semibold text-slate-900 text-lg">Clean Category</p>
            <p className="text-sm text-slate-500">No issues found for the selected filter.</p>
          </div>
        ) : (
          filtered.map((v) => {
            const idx = v.originalIndex;
            const key = `v-${idx}`;
            const cfg = severityConfig[v.severity];
            const Icon = cfg.icon;
            const isOpen = expanded === key;
            const isSelected = selectedIds.has(idx);

            return (
              <div 
                key={key} 
                role="listitem"
                className={`group border rounded-lg overflow-hidden transition-all duration-150 ${
                  isOpen ? 'ring-1 ring-blue-200 border-blue-200' : 'bg-white border-slate-200 hover:border-slate-300'
                } ${isSelected ? 'bg-blue-50/30' : ''}`}
              >
                <div className="flex items-start">
                  {/* Selection Checkbox */}
                  <div className="p-4 pr-0">
                    <button 
                      onClick={() => toggleSelection(idx)}
                      className="text-slate-300 hover:text-blue-600 transition-colors"
                      aria-label={isSelected ? "Deselect violation" : "Select violation"}
                    >
                      {isSelected ? <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5" />}
                    </button>
                  </div>

                  <button
                    className="flex-1 w-full p-4 flex items-start gap-4 text-left focus:outline-none"
                    onClick={() => setExpanded(isOpen ? null : key)}
                    aria-expanded={isOpen}
                  >
                    <div className={`p-2 rounded-md ${cfg.bg} flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${cfg.color}`} aria-hidden="true" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className={cfg.badge}>{v.severity}</span>
                        <span className={`level-${v.level.toLowerCase()}`}>{v.level}</span>
                        <span className="text-xs font-mono text-slate-400">WCAG {v.wcag}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 leading-tight mb-1">{v.title}</h4>
                      <p className="text-xs font-mono text-slate-500 truncate bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 max-w-fit">
                        {v.selector}
                      </p>
                    </div>

                    <div className="flex-shrink-0 text-slate-400 self-center">
                      {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </button>
                </div>

                {isOpen && (
                  <div className="px-6 pb-6 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-6">
                    <div>
                      <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Description</h5>
                      <p className="text-sm text-slate-700 leading-relaxed">{v.message}</p>
                    </div>

                    {v.htmlSnippet && (
                      <div>
                        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Violation Snippet</h5>
                        <pre className="code-block bg-slate-900 text-slate-100 border-none shadow-inner max-h-48">
                          {v.htmlSnippet}
                        </pre>
                      </div>
                    )}

                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <Wrench className="w-4 h-4 text-blue-600" aria-hidden="true" />
                        <h5 className="text-xs font-bold text-blue-700 uppercase tracking-widest">Recommended Fix</h5>
                      </div>
                      <p className="text-sm text-slate-800 font-medium leading-relaxed bg-white/60 p-3 rounded border border-blue-200">
                        {v.howToFix}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Principle</span>
                        <span className="text-sm font-semibold text-slate-700">{v.principle}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Auto-Remediation</span>
                        <span className={`text-sm font-bold ${v.fixable ? 'text-green-600' : 'text-slate-400'}`}>
                          {v.fixable ? 'Available' : 'Manual Required'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
