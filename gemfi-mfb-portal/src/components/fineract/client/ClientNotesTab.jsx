import React, { useState, useEffect } from 'react';
import { fineractApi } from '@/lib/fineract';
import { Loader2, Send, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

export default function ClientNotesTab({ clientId }) {
  const { toast } = useToast();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fineractApi(`/clients/${clientId}/notes`);
      setNotes(Array.isArray(res) ? res : []);
    } catch {
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [clientId]);

  const addNote = async () => {
    if (!newNote.trim()) return;
    setSaving(true);
    try {
      await fineractApi(`/clients/${clientId}/notes`, { method: 'POST', body: { note: newNote } });
      setNewNote('');
      toast({ title: 'Note added' });
      load();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
        <Textarea
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          placeholder="Add a note about this client..."
          className="bg-slate-900 border-slate-700 text-white text-sm resize-none"
          rows={3}
        />
        <div className="flex justify-end mt-2">
          <Button onClick={addNote} disabled={saving || !newNote.trim()} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-1" />} Add Note
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-600" /></div>
      ) : notes.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-sm flex flex-col items-center gap-2">
          <StickyNote className="w-8 h-8 text-slate-700" />
          No notes yet
        </div>
      ) : (
        <div className="space-y-2">
          {notes.map(n => (
            <div key={n.id} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{n.note}</p>
              <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500">
                <span>{n.createdByUsername || 'System'}</span>
                <span>·</span>
                <span>{n.createdOn?.join(' ') || ''}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}