import React, { useState, useMemo } from 'react';
import { fineractApi, getFineractConfig } from '@/lib/fineract';
import { Play, Loader2, Copy, Check, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PageHeader from '@/components/fineract/PageHeader';
import { endpointCategories, allEndpoints } from '@/lib/fineract-endpoints';

const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

const methodColors = {
  GET: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  POST: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  PUT: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  DELETE: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  PATCH: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
};

export default function ApiExplorer() {
  const [method, setMethod] = useState('GET');
  const [path, setPath] = useState('/clients');
  const [body, setBody] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(null);
  const [status, setStatus] = useState(null);
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState('');
  const [collapsedCats, setCollapsedCats] = useState({});

  const selectedEndpoint = useMemo(
    () => allEndpoints.find(ep => ep.path === path && ep.method === method),
    [path, method]
  );

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return endpointCategories;
    const q = search.toLowerCase();
    return endpointCategories
      .map(cat => ({
        ...cat,
        endpoints: cat.endpoints.filter(ep =>
          ep.label.toLowerCase().includes(q) ||
          ep.path.toLowerCase().includes(q) ||
          ep.description.toLowerCase().includes(q)
        ),
      }))
      .filter(cat => cat.endpoints.length > 0);
  }, [search]);

  const execute = async () => {
    setLoading(true);
    setResponse(null);
    setElapsed(null);
    setStatus(null);
    const start = Date.now();
    try {
      let parsedBody = undefined;
      if (body.trim() && method !== 'GET') {
        parsedBody = JSON.parse(body);
      }
      const res = await fineractApi(path, { method, body: parsedBody });
      setResponse(JSON.stringify(res, null, 2));
      setStatus(200);
    } catch (err) {
      setResponse(err.message);
      setStatus('Error');
    } finally {
      setElapsed(Date.now() - start);
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (response) {
      navigator.clipboard.writeText(response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const selectEndpoint = (ep) => {
    setMethod(ep.method);
    setPath(ep.path);
    setBody('');
  };

  const toggleCat = (cat) => {
    setCollapsedCats(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const config = getFineractConfig();

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="API Explorer" description="Test any Fineract API endpoint directly — full endpoint catalog" />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 sticky top-4">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search endpoints..."
                className="pl-9 bg-slate-900 border-slate-700 text-white text-sm h-9"
              />
            </div>
            <div className="text-[11px] text-slate-500 mb-2">
              {allEndpoints.length} endpoints · {endpointCategories.length} categories
            </div>
            <div className="space-y-1 max-h-[65vh] overflow-y-auto">
              {filteredCategories.map(cat => {
                const isCollapsed = collapsedCats[cat.category];
                return (
                  <div key={cat.category}>
                    <button
                      onClick={() => toggleCat(cat.category)}
                      className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300"
                    >
                      {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {cat.category}
                      <span className="text-slate-600 font-normal normal-case">({cat.endpoints.length})</span>
                    </button>
                    {!isCollapsed && (
                      <div className="space-y-0.5 mb-1">
                        {cat.endpoints.map((ep, i) => {
                          const active = path === ep.path && method === ep.method;
                          return (
                            <button
                              key={i}
                              onClick={() => selectEndpoint(ep)}
                              title={ep.description}
                              className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-2 ${
                                active
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                              }`}
                            >
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border flex-shrink-0 ${methodColors[ep.method]}`}>
                                {ep.method}
                              </span>
                              <span className="truncate">{ep.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredCategories.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-xs">No endpoints found</div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            {selectedEndpoint && (
              <div className="mb-3 pb-3 border-b border-slate-700/50">
                <div className="text-sm font-medium text-white">{selectedEndpoint.label}</div>
                <div className="text-xs text-slate-400 mt-0.5">{selectedEndpoint.description}</div>
              </div>
            )}
            <div className="flex gap-2 mb-4">
              <select
                value={method}
                onChange={e => setMethod(e.target.value)}
                className="h-10 px-3 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm font-mono font-bold"
              >
                {methods.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 text-xs font-mono">/v1</span>
                <Input
                  value={path}
                  onChange={e => setPath(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && execute()}
                  className="pl-10 bg-slate-900 border-slate-700 text-white font-mono text-sm"
                  placeholder="/clients"
                />
              </div>
              <Button onClick={execute} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 px-6">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              </Button>
            </div>

            {method !== 'GET' && (
              <div>
                <Label className="text-slate-400 text-xs mb-1 block">Request Body (JSON)</Label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  className="w-full h-32 p-3 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs resize-y"
                  placeholder='{"key": "value"}'
                />
              </div>
            )}

            {config && (
              <div className="text-[11px] text-slate-600 mt-2 font-mono break-all">
                {config.baseUrl}/fineract-provider/api/v1{path}
              </div>
            )}
          </div>

          {response !== null && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold ${status === 200 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {status}
                  </span>
                  {elapsed && <span className="text-xs text-slate-500">{elapsed}ms</span>}
                </div>
                <button onClick={handleCopy} className="text-slate-400 hover:text-white">
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <pre className="p-4 text-xs text-slate-300 font-mono overflow-auto max-h-[50vh] whitespace-pre-wrap">
                {response}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}