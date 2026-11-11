'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { client as authClient } from '@/lib/auth-client';
import { Card } from '@/components/ui';

interface NoteItem {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

export default function NotesPage() {
  const { data: orgs } = authClient.useListOrganizations();
  const { data: activeOrg } = authClient.useActiveOrganization();
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState<'ok' | 'error'>('ok');

  async function refresh() {
    if (!activeOrg?.id) return;
    try {
      const resp = await fetch('/api/notes');
      const data = await resp.json();
      if (resp.ok) setNotes(data.notes ?? []);
      else setMessage(data.message ?? 'Failed to load notes');
    } catch {
      setMessage('Network error');
    }
  }

  useEffect(() => {
    // 数据获取型 effect：禁用 set-state-in-effect 检查
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrg?.id]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const resp = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body }),
      });
      const data = await resp.json();
      if (resp.ok) {
        setTitle('');
        setBody('');
        setTone('ok');
        setMessage('Note created. This is a demo of org-scoped data + free quota.');
        await refresh();
      } else {
        setTone('error');
        setMessage(data.message ?? 'Failed to create note');
      }
    } catch {
      setTone('error');
      setMessage('Network error');
    } finally {
      setBusy(false);
    }
  }

  if (orgs && orgs.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-extrabold">Notes (demo business)</h1>
        <Card className="mt-6">
          <p className="text-sm text-slate-600">
            You have no organization yet. Notes are scoped per organization — create one first.
          </p>
          <Link
            href="/orgs"
            className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:underline"
          >
            Create an organization →
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-extrabold">Notes</h1>
      <p className="mt-1 text-sm text-slate-500">
        Demo business isolated by organization:
        {activeOrg?.name ? ` showing notes of “${activeOrg.name}” only.` : ' switch org to see its notes.'}
      </p>

      <Card className="mt-6">
        <h2 className="font-bold">New note</h2>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
            placeholder="Title"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            maxLength={5000}
            rows={4}
            placeholder="Body"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Create note'}
          </button>
        </form>
        {message && (
          <p className={`mt-3 text-sm ${tone === 'ok' ? 'text-brand-700' : 'text-red-600'}`}>
            {message}
          </p>
        )}
      </Card>

      <ul className="mt-6 space-y-3">
        {notes.map((n) => (
          <li key={n.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-bold">{n.title}</h3>
              <span className="text-xs text-slate-400">
                {new Date(n.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{n.body}</p>
          </li>
        ))}
        {notes.length === 0 && (
          <li className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
            No notes in this organization yet.
          </li>
        )}
      </ul>
    </div>
  );
}
