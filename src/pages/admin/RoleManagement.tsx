import { useEffect, useState } from 'react';
import ModuleLoading from '@/components/admin/ModuleLoading';
import { roleApi, type ManagedRole } from '@/apis/auth/roleApi';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import useToast from '@/hooks/component/useToast';
import type { RbacItem } from '@/types/api/authTypes';
import { getUserPayload } from '@/utils/localStorageUtils';
import { ADMIN_MODULES, getEffectiveRbac, type CrudAction } from '@/utils/rbacUtils';

const actions: readonly CrudAction[] = ['Create', 'Read', 'Update', 'Delete'];
const resource = 'Role-Based Access Control';
const emptyRow = (key: string): RbacItem => ({
  'module name': key,
  Create: 'false',
  Read: 'false',
  Update: 'false',
  Delete: 'false',
});

export default function RoleManagement() {
  const [roles, setRoles] = useState<ManagedRole[]>([]);
  const [selected, setSelected] = useState('');
  const [draft, setDraft] = useState<ManagedRole | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const { showError, showSuccess } = useToast();
  const actor = getUserPayload();
  const permissions = getEffectiveRbac(actor);
  const own = permissions.find((row) => row['module name'] === resource);
  const active = roles.find(({ id }) => id === selected);
  const role = draft ?? active;
  const mayGrant = (key: string, action: CrudAction) =>
    permissions.some((row) => row['module name'] === key && row[action] === 'true');
  const canManage =
    !active?.builtIn &&
    (active?.permissions ?? []).every((row) =>
      actions.every((action) => row[action] !== 'true' || mayGrant(row['module name'], action))
    );
  const canEditActive =
    own?.Update === 'true' &&
    (canManage || (active?.id === 'ADMIN' && actor.role === 'SUPER_ADMIN'));
  const canEdit = Boolean(draft && (draft.id ? canEditActive : own?.Create === 'true'));
  const modules = ADMIN_MODULES.filter((module) =>
    `${module.name} ${module.description}`.toLowerCase().includes(search.trim().toLowerCase())
  );

  useEffect(() => {
    if (own?.Read !== 'true') {
      setLoading(false);
      return;
    }
    let activeRequest = true;
    roleApi
      .list()
      .then((items) => {
        if (activeRequest) {
          setRoles(items);
          setSelected(items[0]?.id ?? '');
        }
      })
      .catch((error: Error) => {
        if (activeRequest) showError('Unable to load roles', error.message);
      })
      .finally(() => {
        if (activeRequest) setLoading(false);
      });
    return () => {
      activeRequest = false;
    };
  }, [own?.Read, showError]);

  const changePermission = (key: string, action: CrudAction, checked: boolean) => {
    setDraft((current) => {
      if (!current) return current;
      const row = current.permissions.find((item) => item['module name'] === key) ?? emptyRow(key);
      return {
        ...current,
        permissions: [
          ...current.permissions.filter((item) => item['module name'] !== key),
          { ...row, [action]: checked ? 'true' : 'false' },
        ],
      };
    });
  };

  const save = async () => {
    if (!draft || !canEdit) return;
    setBusy(true);
    try {
      const saved = await roleApi.save(
        { name: draft.name.trim(), permissions: draft.permissions },
        draft.id || undefined
      );
      setRoles((previous) =>
        previous.some(({ id }) => id === saved.id)
          ? previous.map((item) => (item.id === saved.id ? saved : item))
          : [...previous, saved]
      );
      setSelected(saved.id);
      setDraft(null);
      showSuccess('Role saved', saved.name);
    } catch (error) {
      showError('Unable to save role', (error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!active || !canManage || own?.Delete !== 'true' || active.id === actor.role) return;
    if (
      !window.confirm(
        `Delete "${active.name}"? Accounts assigned to this role will lose its admin permissions.`
      )
    )
      return;
    setBusy(true);
    try {
      await roleApi.remove(active.id);
      const remaining = roles.filter(({ id }) => id !== active.id);
      setRoles(remaining);
      setSelected(remaining[0]?.id ?? '');
      showSuccess('Role deleted', active.name);
    } catch (error) {
      showError('Unable to delete role', (error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <ModuleLoading />;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Role &amp; Permission Management</h1>
        {own?.Create === 'true' && (
          <Button
            disabled={busy || !!draft}
            onClick={() => setDraft({ id: '', name: '', builtIn: false, permissions: [] })}
          >
            Create role
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
        {draft ? (
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <label className="grid gap-1 text-sm">
              Role name
              <Input
                required
                minLength={2}
                maxLength={60}
                value={draft.name}
                readOnly={draft.builtIn}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              />
            </label>
            <Button type="submit" disabled={busy || !canEdit}>
              Save role
            </Button>
            <Button type="button" variant="outline" disabled={busy} onClick={() => setDraft(null)}>
              Cancel
            </Button>
          </form>
        ) : (
          <>
            {roles.length > 0 && (
              <label htmlFor="active-role" className="grid gap-1 text-sm">
                Active role
                <Select value={selected} disabled={busy} onValueChange={setSelected}>
                  <SelectTrigger id="active-role" className="w-full min-w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(({ id, name }) => (
                      <SelectItem key={id} value={id}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            )}
            {active && canEditActive && (
              <Button variant="outline" disabled={busy} onClick={() => setDraft(active)}>
                Edit role
              </Button>
            )}
            {active && canManage && own?.Delete === 'true' && active.id !== actor.role && (
              <Button variant="destructive" disabled={busy} onClick={() => void remove()}>
                Delete role
              </Button>
            )}
          </>
        )}
        <Input
          className="max-w-xs"
          aria-label="Filter modules"
          placeholder="Filter modules by name"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {role && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border p-4">
            <h2 className="font-semibold">Permission Matrix for {role.name || 'new role'}</h2>
            <p className="text-sm text-muted-foreground">
              {role.builtIn && role.id !== 'ADMIN'
                ? 'Built-in role permissions are defined by the system.'
                : 'Permission changes apply to every account assigned to this role.'}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th scope="col" className="min-w-52 p-4 text-left">
                    Resource / Module
                  </th>
                  {actions.map((action) => (
                    <th key={action} scope="col" className="min-w-20 p-4">
                      {action}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {modules.map((module) => {
                  const row = role.permissions.find((item) => item['module name'] === module.key);
                  const supported: readonly CrudAction[] = module.actions;
                  return (
                    <tr key={module.id}>
                      <th scope="row" className="p-4 text-left font-medium">
                        {module.name}
                      </th>
                      {actions.map((action) => (
                        <td key={action} className="p-4 text-center">
                          {supported.includes(action) ? (
                            <Switch
                              aria-label={`${module.name} ${action}`}
                              checked={row?.[action] === 'true'}
                              disabled={busy || !canEdit || !mayGrant(module.key, action)}
                              onCheckedChange={(checked) =>
                                changePermission(module.key, action, checked)
                              }
                            />
                          ) : (
                            <span aria-label="Unavailable" className="text-muted-foreground">
                              —
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                {modules.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center">
                      No matching modules.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {busy && (
        <p role="status" className="text-sm text-muted-foreground">
          Working…
        </p>
      )}
      {!role && !busy && own?.Read !== 'true' && (
        <p className="text-sm text-muted-foreground">
          Read permission is required to browse existing roles.
        </p>
      )}
    </div>
  );
}

export { RoleManagement };
