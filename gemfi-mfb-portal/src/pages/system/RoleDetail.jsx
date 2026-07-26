import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fineractApi } from '@/lib/fineract';
import { ArrowLeft, Loader2, Save, Search, Shield, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

export default function RoleDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPerms, setSelectedPerms] = useState(new Set());
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [roleRes, permsRes] = await Promise.all([
        fineractApi(`/roles/${id}`),
        fineractApi('/permissions'),
      ]);
      setRole(roleRes);
      // roleRes.permissionGroups may contain the currently assigned permissions
      const assigned = new Set();
      if (roleRes.permissionGroups) {
        roleRes.permissionGroups.forEach(g => {
          (g.permissions || []).forEach(p => {
            if (p.selected) assigned.add(p.code);
          });
        });
      }
      setSelectedPerms(assigned);
      setPermissions(Array.isArray(permsRes) ? permsRes : []);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const togglePerm = (code) => {
    setSelectedPerms(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });
  };

  const toggleGroup = (groupPerms) => {
    const allSelected = groupPerms.every(p => selectedPerms.has(p.code));
    setSelectedPerms(prev => {
      const next = new Set(prev);
      groupPerms.forEach(p => { if (allSelected) next.delete(p.code); else next.add(p.code); });
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fineractApi(`/roles/${id}/permissions`, {
        method: 'POST',
        body: { permissions: Array.from(selectedPerms) }
      });
      toast({ title: 'Permissions updated successfully' });
      load();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Group permissions by their first word or category
  const groupedPerms = React.useMemo(() => {
    const groups = {};
    permissions.forEach(p => {
      const code = p.code || p;
      const category = code.split('_')[0];
      if (!groups[category]) groups[category] = [];
      groups[category].push({ code, name: p.name || code, description: p.description || '' });
    });
    return groups;
  }, [permissions]);

  const filteredGroups = React.useMemo(() => {
    if (!search) return groupedPerms;
    const s = search.toLowerCase();
    const result = {};
    Object.entries(groupedPerms).forEach(([cat, perms]) => {
      const filtered = perms.filter(p => p.code.toLowerCase().includes(s) || p.name?.toLowerCase().includes(s));
      if (filtered.length) result[cat] = filtered;
    });
    return result;
  }, [groupedPerms, search]);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-emerald-400" /></div>;
  if (!role) return <div className="p-8 text-center text-slate-500">Role not found</div>;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <Link to="/system/roles" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Roles
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{role.name}</h1>
          <p className="text-sm text-slate-400 mt-1">{role.description || 'No description'}</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save Permissions
        </Button>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 mb-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <div className="text-sm text-white font-medium">{selectedPerms.size} permissions selected</div>
          <div className="text-xs text-slate-500">of {permissions.length} available permissions</div>
        </div>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search permissions…"
          className="pl-9 bg-slate-900 border-slate-700 text-white placeholder:text-slate-600" />
      </div>

      <div className="space-y-4">
        {Object.entries(filteredGroups).map(([category, perms]) => {
          const allSelected = perms.every(p => selectedPerms.has(p.code));
          return (
            <div key={category} className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between bg-slate-800/80">
                <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5" /> {category}
                </h3>
                <button onClick={() => toggleGroup(perms)} className="text-xs text-slate-400 hover:text-white">
                  {allSelected ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 p-2">
                {perms.map(p => (
                  <label key={p.code} className="flex items-start gap-2 p-2 rounded hover:bg-slate-700/50 cursor-pointer">
                    <input type="checkbox" checked={selectedPerms.has(p.code)} onChange={() => togglePerm(p.code)} className="w-4 h-4 mt-0.5 accent-emerald-600" />
                    <div>
                      <div className="text-sm text-slate-300">{p.code}</div>
                      {p.description && <div className="text-xs text-slate-500">{p.description}</div>}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
        {Object.keys(filteredGroups).length === 0 && (
          <div className="text-center py-8 text-slate-500 text-sm">No permissions found</div>
        )}
      </div>
    </div>
  );
}