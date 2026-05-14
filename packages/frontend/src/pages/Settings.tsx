import { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Shield, Settings as SettingsIcon, Brain, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [settings, setSettings] = useState({
    aiProvider: 'openai',
    modelName: 'gpt-4o',
    criticalPenalty: 15,
    majorPenalty: 8,
    minorPenalty: 3
  });

  useEffect(() => {
    axios.get('/api/settings')
      .then(res => {
        setSettings(res.data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await axios.patch('/api/settings', settings);
      setMessage({ type: 'success', text: 'Configuration saved successfully.' });
      setTimeout(() => setMessage(null), 5000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update configuration.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-slate-500 font-medium">Retrieving configuration...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <SettingsIcon className="w-6 h-6 text-slate-400" aria-hidden="true" />
            Audit Settings
          </h1>
          <p className="text-slate-500 text-sm mt-1">Configure AI remediation engine and scoring penalties.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" aria-hidden="true" />
          )}
          {saving ? 'Saving changes...' : 'Save Configuration'}
        </button>
      </header>

      {message && (
        <div 
          className={`p-4 rounded-lg flex items-center gap-3 border ${
            message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}
          role="alert"
        >
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="text-sm font-semibold">{message.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* AI Configuration */}
        <section className="card" aria-labelledby="ai-heading">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-6">
            <Brain className="w-5 h-5 text-purple-600" aria-hidden="true" />
            <h2 id="ai-heading" className="font-bold text-slate-900">AI Remediation Engine</h2>
          </div>
          
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="ai-provider" className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                AI Provider
              </label>
              <select 
                id="ai-provider"
                value={settings.aiProvider}
                onChange={e => setSettings({...settings, aiProvider: e.target.value})}
                className="input-field font-sans"
              >
                <option value="openai">OpenAI (GPT-4 / 4o)</option>
                <option value="anthropic">Anthropic (Claude 3.5)</option>
                <option value="local">Local Instance (Ollama / Llama 3)</option>
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label htmlFor="model-name" className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Specific Model
              </label>
              <input 
                id="model-name"
                type="text" 
                value={settings.modelName}
                onChange={e => setSettings({...settings, modelName: e.target.value})}
                className="input-field"
                placeholder="e.g. gpt-4o, claude-3-5-sonnet"
              />
              <p className="text-[10px] text-slate-400">Model name must match provider's API specification.</p>
            </div>
          </div>
        </section>

        {/* Scoring Configuration */}
        <section className="card" aria-labelledby="scoring-heading">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-6">
            <Shield className="w-5 h-5 text-blue-600" aria-hidden="true" />
            <h2 id="scoring-heading" className="font-bold text-slate-900">Score Penalty Weights</h2>
          </div>
          
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="crit-penalty" className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Critical Violation
              </label>
              <div className="flex items-center gap-3">
                <input 
                  id="crit-penalty"
                  type="number" 
                  value={settings.criticalPenalty}
                  onChange={e => setSettings({...settings, criticalPenalty: parseInt(e.target.value)})}
                  className="input-field w-24"
                />
                <span className="text-xs text-slate-400 font-medium">Points deducted per instance</span>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label htmlFor="major-penalty" className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Major Violation
              </label>
              <div className="flex items-center gap-3">
                <input 
                  id="major-penalty"
                  type="number" 
                  value={settings.majorPenalty}
                  onChange={e => setSettings({...settings, majorPenalty: parseInt(e.target.value)})}
                  className="input-field w-24"
                />
                <span className="text-xs text-slate-400 font-medium">Points deducted per instance</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="minor-penalty" className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Minor Violation
              </label>
              <div className="flex items-center gap-3">
                <input 
                  id="minor-penalty"
                  type="number" 
                  value={settings.minorPenalty}
                  onChange={e => setSettings({...settings, minorPenalty: parseInt(e.target.value)})}
                  className="input-field w-24"
                />
                <span className="text-xs text-slate-400 font-medium">Points deducted per instance</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
        <p className="text-xs text-slate-500 leading-relaxed">
          <strong>Note:</strong> Changes to scoring weights will only affect future audits. Past reports will maintain the scores generated at the time of the scan.
        </p>
      </div>
    </div>
  );
}
