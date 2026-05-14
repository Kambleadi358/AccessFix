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
  const dim = size === 'lg' ? 160 : size === 'md' ? 120 : 80;
  const stroke = size === 'lg' ? 10 : size === 'md' ? 8 : 6;
  const r = (dim - stroke * 2) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score.overall / 100) * circumference;
  const cx = dim / 2;

  const fontSize = size === 'lg' ? 'text-4xl' : size === 'md' ? 'text-2xl' : 'text-lg';
  const gradeSize = size === 'lg' ? 'text-sm' : 'text-xs';

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: dim, height: dim }} aria-hidden="true">
        <svg width={dim} height={dim} className="-rotate-90">
          {/* Background ring */}
          <circle cx={cx} cy={cx} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
          {/* Score ring */}
          <circle
            cx={cx} cy={cx} r={r}
            fill="none"
            stroke={ring}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${fontSize} font-extrabold ${text}`}>{score.overall}</span>
          <span className={`${gradeSize} text-slate-400 font-medium`}>/{100}</span>
        </div>
      </div>

      {/* Grade */}
      <div className="text-center">
        <div className={`text-2xl font-bold ${text}`}>Grade {score.grade}</div>
        <div className="text-sm text-slate-500">{score.passRate}% rules passed</div>
      </div>
    </div>
  );
}
