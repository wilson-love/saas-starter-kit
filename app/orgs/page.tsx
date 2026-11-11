'use client';

import { useEffect, useState } from 'react';
import { client as authClient } from '@/lib/auth-client';
import { Card } from '@/components/ui';

const ROLE_LABEL: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
};

export default function OrgsPage() {
  const { data: orgs, isPending: orgsPending, refetch: refetchOrgs } = authClient.useListOrganizations();
  const {
    data: activeOrg,
    isPending: activePending,
    refetch: refetchActive,
  } = authClient.useActiveOrganization();
  const orgId = activeOrg?.id;

  // better-auth organization API 返回结构（本地声明，避免泛型推导塌缩为 any）
  interface MemberRow {
    id: string;
    role: string;
    user: { id: string; email: string; name: string; image?: string | null };
  }
  interface InvitationRow {
    id: string;
    email: string;
    role: string | null;
    status: string;
  }
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [invitations, setInvitations] = useState<InvitationRow[]>([]);
  // 当前登录用户收到的邀请（不带 organizationId 查询；非成员也能看到，是站内接受的入口）
  const [myInvitations, setMyInvitations] = useState<InvitationRow[]>([]);

  async function loadOrgData() {
    // 无 orgId 时仅加载"我的邀请"（未入任何组织的新用户也能看到邀请）
    const mine = await authClient.organization.listInvitations();
    if (mine.data) setMyInvitations(mine.data as InvitationRow[]);
    if (!orgId) return;
    const [m, inv] = await Promise.all([
      authClient.organization.listMembers({ query: { organizationId: orgId } }),
      authClient.organization.listInvitations({ query: { organizationId: orgId } }),
    ]);
    if (m.data) setMembers(m.data.members as MemberRow[]);
    if (inv.data) setInvitations(inv.data as InvitationRow[]);
  }

  useEffect(() => {
    // 数据获取型 effect：禁用 set-state-in-effect 检查
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOrgData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  const [orgName, setOrgName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member');
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState<'ok' | 'error'>('ok');

  function notice(text: string, isError = false) {
    setMessage(text);
    setTone(isError ? 'error' : 'ok');
  }

  async function createOrg(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!orgName.trim()) return;
    setBusy('create');
    setMessage('');
    try {
      const { data, error } = await authClient.organization.create({
        name: orgName.trim(),
        slug: orgName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      });
      if (error) {
        notice(error.message ?? 'Failed to create organization', true);
      } else {
        // better-auth create 不会自动 set active：新组织需手动激活，否则成员列表/业务数据为空
        await authClient.organization.setActive({ organizationId: data.id });
        notice(`Organization "${data.name}" created.`);
        setOrgName('');
        await Promise.all([refetchOrgs(), refetchActive(), loadOrgData()]);
      }
    } catch {
      notice('Network error', true);
    } finally {
      setBusy('');
    }
  }

  async function setActive(organizationId: string) {
    setBusy(`active-${organizationId}`);
    try {
      const { error } = await authClient.organization.setActive({ organizationId });
      if (error) notice(error.message ?? 'Failed to switch', true);
      else {
        await refetchActive();
        await loadOrgData();
      }
    } catch {
      notice('Network error', true);
    } finally {
      setBusy('');
    }
  }

  async function inviteMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!orgId || !inviteEmail.trim()) return;
    setBusy('invite');
    setMessage('');
    try {
      const { error } = await authClient.organization.inviteMember({
        organizationId: orgId,
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      if (error) notice(error.message ?? 'Failed to invite', true);
      else {
        notice(`Invitation sent to ${inviteEmail.trim()}.`);
        setInviteEmail('');
        await loadOrgData();
      }
    } catch {
      notice('Network error', true);
    } finally {
      setBusy('');
    }
  }

  async function removeMember(memberId: string) {
    if (!orgId) return;
    setBusy(`remove-${memberId}`);
    try {
      const { error } = await authClient.organization.removeMember({
        organizationId: orgId,
        memberIdOrEmail: memberId,
      });
      if (error) notice(error.message ?? 'Failed to remove member', true);
      else {
        notice('Member removed.');
        await loadOrgData();
      }
    } catch {
      notice('Network error', true);
    } finally {
      setBusy('');
    }
  }

  async function acceptInvitation(invitationId: string) {
    setBusy(`accept-${invitationId}`);
    try {
      const { error } = await authClient.organization.acceptInvitation({ invitationId });
      if (error) notice(error.message ?? 'Failed to accept invitation', true);
      else {
        notice('Invitation accepted.');
        await Promise.all([refetchOrgs(), refetchActive(), loadOrgData()]);
      }
    } catch {
      notice('Network error', true);
    } finally {
      setBusy('');
    }
  }

  async function cancelInvitation(invitationId: string) {
    if (!orgId) return;
    setBusy(`cancel-${invitationId}`);
    try {
      const { error } = await authClient.organization.cancelInvitation({ invitationId });
      if (error) notice(error.message ?? 'Failed to cancel invitation', true);
      else {
        notice('Invitation canceled.');
        await loadOrgData();
      }
    } catch {
      notice('Network error', true);
    } finally {
      setBusy('');
    }
  }

  if (orgsPending || activePending) {
    return <div className="mx-auto max-w-3xl px-4 py-12 text-sm text-slate-500">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-extrabold">Organizations</h1>
      <p className="mt-1 text-sm text-slate-500">
        Multi-tenant core: create organizations, switch between them, invite members. New business
        tables are isolated by the active organization.
      </p>

      {/* 创建组织 */}
      <Card className="mt-6">
        <h2 className="font-bold">Create organization</h2>
        <form onSubmit={createOrg} className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            required
            maxLength={64}
            placeholder="Organization name (slug auto-generated)"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
          />
          <button
            type="submit"
            disabled={busy === 'create'}
            className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
          >
            Create
          </button>
        </form>
      </Card>

      {/* 组织列表 */}
      <Card className="mt-4">
        <h2 className="font-bold">Your organizations</h2>
        <ul className="mt-3 divide-y divide-slate-100">
          {(orgs ?? []).map((org) => (
            <li key={org.id} className="flex items-center justify-between gap-3 py-2.5">
              <div>
                <span className="font-semibold">{org.name}</span>
                {org.id === activeOrg?.id && (
                  <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
                    active
                  </span>
                )}
              </div>
              {org.id !== activeOrg?.id && (
                <button
                  type="button"
                  onClick={() => setActive(org.id)}
                  disabled={busy === `active-${org.id}`}
                  className="text-sm font-semibold text-brand-700 hover:underline disabled:opacity-50"
                >
                  Switch
                </button>
              )}
            </li>
          ))}
          {(orgs ?? []).length === 0 && (
            <li className="py-3 text-sm text-slate-400">No organizations yet.</li>
          )}
        </ul>
      </Card>

      {orgId && (
        <>
          {/* 成员 + 邀请 */}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Card>
              <h2 className="font-bold">Members</h2>
              <ul className="mt-3 divide-y divide-slate-100">
                {(members ?? []).map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {m.user.name ?? m.user.email}
                      </p>
                      <p className="text-xs text-slate-400">
                        {ROLE_LABEL[m.role] ?? m.role}
                      </p>
                    </div>
                    {m.role !== 'owner' && (
                      <button
                        type="button"
                        onClick={() => removeMember(m.id)}
                        disabled={busy === `remove-${m.id}`}
                        className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
                      >
                        Remove
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <h2 className="font-bold">Invite member</h2>
              <form onSubmit={inviteMember} className="mt-3 space-y-3">
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="teammate@example.com"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                />
                <div className="flex gap-2">
                  {(['member', 'admin'] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setInviteRole(role)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${
                        inviteRole === role
                          ? 'border-brand-600 bg-brand-50 text-brand-700'
                          : 'border-slate-300 text-slate-500 hover:border-slate-400'
                      }`}
                    >
                      {ROLE_LABEL[role]}
                    </button>
                  ))}
                </div>
                <button
                  type="submit"
                  disabled={busy === 'invite'}
                  className="w-full rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
                >
                  Send invitation
                </button>
              </form>
            </Card>
          </div>

          {/* 待处理邀请 */}
          <Card className="mt-4">
            <h2 className="font-bold">Pending invitations</h2>
            <ul className="mt-3 divide-y divide-slate-100">
              {(invitations ?? []).map((inv) => (
                <li key={inv.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span>
                    {inv.email}{' '}
                    <span className="text-xs text-slate-400">
                      ({ROLE_LABEL[inv.role ?? 'member'] ?? inv.role})
                    </span>
                  </span>
                  <div className="flex items-center gap-2">
                    {inv.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => acceptInvitation(inv.id)}
                        disabled={busy === `accept-${inv.id}`}
                        className="text-xs font-semibold text-brand-700 hover:underline disabled:opacity-50"
                      >
                        Accept
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => cancelInvitation(inv.id)}
                      disabled={busy === `cancel-${inv.id}`}
                      className="text-xs font-semibold text-slate-500 hover:underline disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </li>
              ))}
              {(invitations ?? []).length === 0 && (
                <li className="py-3 text-sm text-slate-400">No pending invitations.</li>
              )}
            </ul>
          </Card>
        </>
      )}

      {/* 我收到的邀请（站内接受入口；未入任何组织的新用户也能看到） */}
      <Card className="mt-4">
        <h2 className="font-bold">Invitations for you</h2>
        <ul className="mt-3 divide-y divide-slate-100">
          {(myInvitations ?? [])
            .filter((inv) => inv.status === 'pending')
            .map((inv) => (
              <li key={inv.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span>
                  {inv.email}{' '}
                  <span className="text-xs text-slate-400">
                    ({ROLE_LABEL[inv.role ?? 'member'] ?? inv.role})
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => acceptInvitation(inv.id)}
                  disabled={busy === `accept-${inv.id}`}
                  className="text-xs font-semibold text-brand-700 hover:underline disabled:opacity-50"
                >
                  Accept
                </button>
              </li>
            ))}
          {myInvitations.filter((inv) => inv.status === 'pending').length === 0 && (
            <li className="py-3 text-sm text-slate-400">No invitations for you.</li>
          )}
        </ul>
      </Card>

      {message && (
        <p className={`mt-4 text-sm ${tone === 'ok' ? 'text-brand-700' : 'text-red-600'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
