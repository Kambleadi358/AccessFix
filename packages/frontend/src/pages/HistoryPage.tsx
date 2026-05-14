import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listScans, deleteScan } from '@/lib/api';
import { ScanResult } from '@accessfix/shared';
import { Loader2, Trash2, ExternalLink, ScanLine, Clock, AlertCircle, ChevronRight, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 90 ? 'text-green-700 bg-green-50 border-green-200' :
    score >= 75 ? 'text-lime-700 bg-lime-50 border-lime-200'   :
    score >= 60 ? 'text-amber-700 bg-amber-50 border-amber-200' :
    score >= 40 ? 'text-orange-700 bg-orange-50 border-orange-200' :
                  'text-red-700 bg-red-50 border-red-200';
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded border text-xs font-bold font-mono ${color}`}>
      {score}
    </span>
  );
}

export function HistoryPage() {
  const navigate = useNavigate();
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchScans = async () => {
    setLoading(true);
    try {
      const data = await listScans(page, 15);
      setScans(data.items);
      setTotal(data.total);
    } catch {
      toast.error('Failed to load scan history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchScans(); }, [page]);

  const handleDelete = async (scanId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Permanently delete this report?')) return;
    setDeleting(scanId);
    try {
      await deleteScan(scanId);
      toast.success('Report deleted');
      fetchScans();
    } catch {
      toast.error('Failed to delete report');
    } finally {
      setDeleting(null);
    }
  };

  const filtered = scans.filter((s) =>
    s.url.toLowerCase().includes(search.toLowerCase()) ||
    (s.pageTitle || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit History</h1>
          <p className="text-sm text-slate-500 mt-1">Found {total} total records</p>
        </div>
        <button onClick={() => navigate('/scan')} className="btn-primary">
          <ScanLine className="w-4 h-4" aria-hidden="true" />
          New Audit
        </button>
      </div>

      {/* Search and Filters */}
      <div className="relative group">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" aria-hidden="true" />
        <input
          type="text"
          className="input-field pl-10 font-sans"
          placeholder="Filter by URL or page title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Filter audit history"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20" role="status">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16 bg-slate-50/50">
          <Clock className="w-12 h-12 mx-auto mb-4 text-slate-300" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-slate-900 mb-2">
            {scans.length === 0 ? 'No audit records' : 'No matching results'}
          </h2>
          <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
            {scans.length === 0
              ? 'Perform your first accessibility audit to see historical data here.'
              : 'Adjust your search terms to find what you are looking for.'}
          </p>
          {scans.length === 0 && (
            <button onClick={() => navigate('/scan')} className="btn-primary mx-auto">
              Perform First Audit
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Score</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Page Information</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell text-center">Violations</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Date</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((scan) => (
                <tr 
                  key={scan.scanId}
                  onClick={() => navigate(`/report/${scan.scanId}`)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors duration-150 group"
                >
                  <td className="px-6 py-4 align-middle">
                    <ScoreBadge score={scan.score.overall} />
                  </td>
                  <td className="px-6 py-4 align-middle min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate max-w-md">
                      {scan.pageTitle || 'Untitled Page'}
                    </p>
                    <p className="text-xs text-slate-500 font-mono truncate flex items-center gap-1 mt-0.5">
                      <ExternalLink className="w-3 h-3" />
                      {scan.url}
                    </p>
                  </td>
                  <td className="px-6 py-4 align-middle hidden md:table-cell">
                    <div className="flex items-center justify-center gap-2">
                      {scan.score.violationCounts.critical > 0 && (
                        <span className="badge-critical text-[10px] py-0">{scan.score.violationCounts.critical}C</span>
                      )}
                      {scan.score.violationCounts.major > 0 && (
                        <span className="badge-major text-[10px] py-0">{scan.score.violationCounts.major}M</span>
                      )}
                      {scan.score.violationCounts.minor > 0 && (
                        <span className="badge-minor text-[10px] py-0">{scan.score.violationCounts.minor}m</span>
                      )}
                      {scan.score.violationCounts.total === 0 && (
                        <span className="text-xs text-green-600 font-bold">Passed</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 align-middle hidden sm:table-cell text-slate-500 text-xs whitespace-nowrap">
                    {formatDistanceToNow(new Date(scan.scannedAt), { addSuffix: true })}
                  </td>
                  <td className="px-6 py-4 align-middle text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => handleDelete(scan.scanId, e)}
                        disabled={deleting === scan.scanId}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all opacity-0 group-hover:opacity-100"
                        title="Delete record"
                        aria-label="Delete audit record"
                      >
                        {deleting === scan.scanId
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Trash2 className="w-4 h-4" />}
                      </button>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total > 15 && (
        <nav className="flex items-center justify-between mt-8" aria-label="Pagination">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="btn-secondary"
          >
            Previous
          </button>
          <span className="text-sm text-slate-600 font-medium">
            Page {page} of {Math.ceil(total / 15)}
          </span>
          <button
            disabled={page >= Math.ceil(total / 15)}
            onClick={() => setPage(page + 1)}
            className="btn-secondary"
          >
            Next
          </button>
        </nav>
      )}
    </div>
  );
}
