import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFineractConfig, saveFineractConfig, fineractApi, clearFineractConfig } from '@/lib/fineract';
import { CheckCircle, XCircle, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import GemfiLogo from '@/components/fineract/GemfiLogo';
import { useBranding } from '@/lib/branding';

export default function Connection() {
  const navigate = useNavigate();
  const branding = useBranding();
  const [form, setForm] = useState({
    baseUrl: import.meta.env.VITE_FINERACT_API_URL || '',
    tenantId: import.meta.env.VITE_FINERACT_TENANT_ID || 'default',
    username: '',
    password: '',
    kycBaseUrl: import.meta.env.VITE_KYC_API_URL || '',
    accountServiceBaseUrl: import.meta.env.VITE_ACCOUNT_SERVICE_API_URL || '',
  });
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const existing = getFineractConfig();
    if (existing) setForm(existing);
  }, []);

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const testConnection = async () => {
    setTesting(true);
    setResult(null);
    saveFineractConfig(form);
    try {
      await fineractApi('/offices', { params: { limit: 1 } });
      setResult({ success: true, message: 'Connected successfully!' });
    } catch (err) {
      setResult({ success: false, message: err.message });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    saveFineractConfig(form);
    navigate('/');
  };

  const handleDisconnect = () => {
    clearFineractConfig();
    setResult(null);
    setForm({
      baseUrl: import.meta.env.VITE_FINERACT_API_URL || '',
      tenantId: import.meta.env.VITE_FINERACT_TENANT_ID || 'default',
      username: '',
      password: '',
      kycBaseUrl: import.meta.env.VITE_KYC_API_URL || '',
      accountServiceBaseUrl: import.meta.env.VITE_ACCOUNT_SERVICE_API_URL || '',
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <GemfiLogo className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">{branding.companyName} Microfinance Bank</h1>
          <p className="text-sm text-slate-400 mt-2 italic">...growing businesses is our business</p>
        </div>

        <div className="space-y-4 bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <div>
            <Label className="text-slate-300 text-xs font-medium">Username</Label>
            <Input
              value={form.username}
              onChange={e => update('username', e.target.value)}
              placeholder="mifos"
              className="mt-1.5 bg-slate-900 border-slate-700 text-white placeholder:text-slate-600"
            />
          </div>
          <div>
            <Label className="text-slate-300 text-xs font-medium">Password</Label>
            <Input
              type="password"
              value={form.password}
              onChange={e => update('password', e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 bg-slate-900 border-slate-700 text-white placeholder:text-slate-600"
            />
          </div>
          <div>
            <Label className="text-slate-300 text-xs font-medium">Account Service URL</Label>
            <Input
              value={form.accountServiceBaseUrl}
              onChange={e => update('accountServiceBaseUrl', e.target.value)}
              placeholder="https://account-service.example.com/api/v1"
              className="mt-1.5 bg-slate-900 border-slate-700 text-white placeholder:text-slate-600"
            />
            <p className="text-[10px] text-slate-500 mt-1">Used to generate the customer Account Number on savings account creation.</p>
          </div>

          {result && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
              result.success ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
            }`}>
              {result.success ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {result.message}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              onClick={testConnection}
              disabled={testing}
              variant="outline"
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              {testing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Test
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Save & Continue
            </Button>
          </div>

          {getFineractConfig() && (
            <Button
              onClick={handleDisconnect}
              variant="ghost"
              className="w-full text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Disconnect
            </Button>
          )}
        </div>

        <p className="text-center text-[11px] text-slate-600 mt-6">
          Server configuration is pre-filled from this deployment's settings.
        </p>
      </div>
    </div>
  );
}