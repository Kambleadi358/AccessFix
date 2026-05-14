import { AccessibilityScore } from '@accessfix/shared';

interface Props {
  score: AccessibilityScore;
  size?: 'sm' | 'md' | 'lg';
}

function getScoreColor(score: number): { ring: string; text: string } {
  if (score >= 90) return { ring: '#16a34a', text: 'score-excellent' };
  if (score >= 75) return { ring: '#65a30d', text: 'score-good' };
  if (score >= 60) return { ring: '#d97706', text: 'score-fair' };
  if (score >= 40) return { ring: '#ea580c', text: 'score-poor' };
  return { ring: '#dc2626', text: 'score-bad' };
}

export function ScoreRing({ score, size = 'md' }: Props) {
  const { ring, text } = getScoreColor(score.overall);
  const dim = size === 'lg' ? 140 : size === 'md' ? 100 : 70;
  const stroke = size === 'lg' ? 8 : size === 'md' ? 6 : 4;
  const r = (dim - stroke * 2) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score.overall / 100) * circumference;
  const cx = dim / 2;

  const fontSize = size === 'lg' ? 'text-4xl' : size === 'md' ? 'text-2xl' : 'text-lg';
  const gradeSize = size === 'lg' ? 'text-sm' : 'text-xs';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative group" style={{ width: dim, height: dim }} aria-hidden="true">
        {/* Subtle glow effect */}
        <div 
          className="absolute inset-0 rounded-full opacity-10 blur-xl transition-opacity group-hover:opacity-20"
          style={{ backgroundColor: ring }}
        />
        
        <svg width={dim} height={dim} className="-rotate-90 relative z-10">
          {/* Background track */}
          <circle 
            cx={cx} cy={cx} r={r} 
            fill="none" 
            stroke="#f1f5f9" 
            strokeWidth={stroke} 
          />
          {/* Active progress ring */}
          <circle
            cx={cx} cy={cx} r={r}
            fill="none"
            stroke={ring}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-1000 ease-out"
          />
        </svg>
        
        {/* Central score display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
          <span className={`${fontSize} font-black tracking-tighter`} style={{ color: ring }}>
            {score.overall}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest -mt-1">
            Score
          </span>
        </div>
      </div>

      {/* Grade and Pass Rate */}
      <div className="text-center mt-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Compliance Grade</span>
          <span className={`text-sm font-black ${text}`}>{score.grade}</span>
        </div>
      </div>
    </div>
  );
}
