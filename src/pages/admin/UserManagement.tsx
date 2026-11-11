import authApi from '@/apis/auth/authApi';
import { isAxiosError } from 'axios';
import { validateNewUser } from '@/utils/userValidation';
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import useToast from '@/hooks/component/useToast';
import type { ManagedUser, UserPayload } from '@/types/api/authTypes';
import { getUserPayload, setUserPayload } from '@/utils/localStorageUtils';
import { getEffectiveRbac } from '@/utils/rbacUtils';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  Mail,
  Pencil,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

type SystemRole = string;

interface RoleOption {
  role: SystemRole;
  label: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  badgeClass: string;
}

const AVAILABLE_ROLES: RoleOption[] = [
  {
    role: 'SUPER_ADMIN',
    label: 'Super Admin',
    badge: 'Full Root Access',
    description: 'Unrestricted permissions across all 15 system modules',
    icon: ShieldAlert,
    colorClass: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20',
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  },
  {
    role: 'ADMIN',
    label: 'Admin',
    badge: 'Administrative',
    description: 'Can manage park assets, maps, viewpoints, and sync packages',
    icon: ShieldCheck,
    colorClass: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  },
  {
    role: 'MODERATOR',
    label: 'Moderator',
    badge: 'Content Staff',
    description: 'Can manage audio tracks, narration, viewpoints, and itineraries',
    icon: Shield,
    colorClass: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20',
    badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  },
  {
    role: 'USER',
    label: 'User',
    badge: 'Standard Visitor',
    description: 'Read-only visitor for tourist navigation and audio playback',
    icon: User,
    colorClass: 'text-slate-600 dark:text-slate-400 bg-slate-500/10 border-slate-500/20',
    badgeClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  },
];

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [availableRoles, setAvailableRoles] = useState<ManagedRole[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', role: 'USER' });
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // User Profile Modal State
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [modalForm, setModalForm] = useState<{
    name: string;
    email: string;
    role: SystemRole;
    is_active: boolean;
    assignedFloorIds: string[];
  }>({
    name: '',
    email: '',
    role: 'USER',
    is_active: true,
    assignedFloorIds: [],
  });
  const [isSavingModal, setIsSavingModal] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<ManagedUser | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const { showSuccess, showError, showInfo } = useToast();

  const currentUser = useMemo<UserPayload | null>(() => {
    try {
      return getUserPayload();
    } catch {
      return null;
    }
  }, []);

  const actorPermissions = getEffectiveRbac(currentUser);
  const permissions = actorPermissions.find(
    (row) => row['module name'] === 'Staff & User Accounts'
  );
  const canRead = permissions?.Read === 'true';
  const canCreate = permissions?.Create === 'true';
  const canUpdate = permissions?.Update === 'true';
  const canDelete = permissions?.Delete === 'true';

  useEffect(() => {
    if (!canCreate && !canUpdate) return;
    let active = true;
    roleApi
      .list()
      .then((roles) => {
        if (active) setAvailableRoles(roles);
      })
      .catch((error: Error) => {
        if (active) showError('Unable to load roles', error.message);
      });
    return () => {
      active = false;
    };
  }, [canCreate, canUpdate, showError]);

  const assignableRoles = availableRoles.filter(({ id, builtIn, permissions: rolePermissions }) => {
    if (currentUser?.role === 'SUPER_ADMIN') return true;
    if (builtIn) return id === 'USER' || (id === 'MODERATOR' && currentUser?.role === 'ADMIN');
    return rolePermissions.every((row) => {
      const own = actorPermissions.find((item) => item['module name'] === row['module name']);
      return (['Create', 'Read', 'Update', 'Delete'] as const).every(
        (action) => row[action] !== 'true' || own?.[action] === 'true'
      );
    });
  });
  const roleOptions: RoleOption[] = assignableRoles.map(({ id, name }) => {
    const builtIn = AVAILABLE_ROLES.find((role) => role.role === id);
    return (
      builtIn ?? {
        ...AVAILABLE_ROLES[3],
        role: id,
        label: name,
        badge: 'Custom role',
        description: '',
      }
    );
  });

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canCreate || creating) return;
    const payload = { ...createForm, name: createForm.name.trim(), email: createForm.email.trim() };
    const validationError = validateNewUser(payload);
    if (validationError) {
      showError('Unable to create user', validationError);
      return;
    }
    setCreating(true);
    try {
      const user = await authApi.createUser({ ...payload, name: payload.name || undefined });
      if (canRead) setUsers((previous) => [user, ...previous]);
      setCreateOpen(false);
      setShowPassword(false);
      setCreateForm({ name: '', email: '', password: '', role: 'USER' });
      showSuccess('User created', user.name);
    } catch (error) {
      showError(
        'Unable to create user',
        isAxiosError<{ message?: string }>(error)
          ? (error.response?.data?.message ?? error.message)
          : (error as Error).message
      );
    } finally {
      setCreating(false);
    }
  };

  const fetchUsers = useCallback(async () => {
    if (!canRead) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const userList = await authApi.getAllUsers();
      setUsers(userList);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch users';
      showError('Error', message);
    } finally {
      setLoading(false);
    }
  }, [canRead, showError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (user: ManagedUser, newRole: SystemRole) => {
    if (!canUpdate || user.id === currentUser?.id || user.role === newRole) return;

    // Safeguard: Prevent accidental demotion of the primary administrator
    if (
      (user.id === 'usr_admin' ||
        user.email.toLowerCase() === 'admin@colosseumtour.it' ||
        user.name === 'Primary Administrator') &&
      newRole !== 'SUPER_ADMIN'
    ) {
      showError(
        'Action Restricted',
        'The Primary Administrator account cannot be demoted from Super Admin.'
      );
      return;
    }

    try {
      setUpdatingUserId(user.id);
      await authApi.updateUserRole(user.id, newRole);

      // Update state locally
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)));

      const targetRoleDef = roleOptions.find((r) => r.role === newRole);
      showSuccess(
        'Role Updated Successfully',
        `Changed role for "${user.name}" to ${targetRoleDef?.label || newRole}.`
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not update user role';
      showError('Update Failed', message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleOpenUserModal = (user: ManagedUser) => {
    setSelectedUser(user);
    setModalForm({
      name: user.name,
      email: user.email,
      role: user.role || 'USER',
      is_active: user.is_active !== undefined ? user.is_active : true,
      assignedFloorIds: user.assignedFloorIds || [],
    });
    setCopiedId(false);
    setIsModalOpen(true);
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
    showInfo('Copied to Clipboard', `User ID: ${id}`);
  };

  const handleSaveModalUser = async () => {
    if (!canUpdate || !selectedUser) return;
    if (!modalForm.name.trim() || !modalForm.email.trim()) {
      showError('Validation Error', 'Name and email are required.');
      return;
    }

    // Safeguard: Prevent accidental demotion of the primary administrator
    if (
      (selectedUser.id === 'usr_admin' ||
        selectedUser.email.toLowerCase() === 'admin@colosseumtour.it' ||
        selectedUser.name === 'Primary Administrator') &&
      modalForm.role !== 'SUPER_ADMIN'
    ) {
      showError(
        'Action Restricted',
        'The Primary Administrator account cannot be demoted from Super Admin.'
      );
      return;
    }

    try {
      setIsSavingModal(true);
      const updated = await authApi.updateUserDetails(selectedUser.id, {
        name: modalForm.name.trim(),
        email: modalForm.email.trim().toLowerCase(),
        role: modalForm.role,
        is_active: modalForm.is_active,
        assignedFloorIds: modalForm.assignedFloorIds,
      });

      // Update state in user table
      setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? { ...u, ...updated } : u)));
      setSelectedUser((prev) => (prev ? { ...prev, ...updated } : null));

      showSuccess(
        'User Profile Updated',
        `Account details for "${modalForm.name}" updated successfully.`
      );

      if (currentUser?.id === selectedUser.id) {
        setUserPayload({ ...currentUser, name: updated.name, email: updated.email });
        window.dispatchEvent(new Event('rbac-updated'));
      }

      setIsModalOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not save user profile';
      showError('Save Failed', message);
    } finally {
      setIsSavingModal(false);
    }
  };

  const handleOpenDeleteModal = (user: ManagedUser) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!canDelete || !userToDelete) return;
    try {
      setIsDeleting(true);
      await authApi.deleteUser(userToDelete.id);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      showSuccess('User Deleted', `Account for "${userToDelete.name}" has been removed.`);
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete user account.';
      showError('Delete Failed', message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered users list
  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return users;

    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.role.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = users.length;
    const superAdmins = users.filter((u) => u.role.toUpperCase() === 'SUPER_ADMIN').length;
    const admins = users.filter((u) => u.role.toUpperCase() === 'ADMIN').length;
    const moderators = users.filter((u) => u.role.toUpperCase() === 'MODERATOR').length;
    const standardUsers = users.filter((u) => u.role.toUpperCase() === 'USER').length;
    return { total, superAdmins, admins, moderators, standardUsers };
  }, [users]);

  const getRoleDef = (roleName: string): RoleOption => {
    const normalized = roleName.startsWith('CUSTOM_') ? roleName : roleName.toUpperCase();
    return (
      AVAILABLE_ROLES.find((r) => r.role === normalized) || {
        role: 'USER',
        label:
          availableRoles.find(({ id }) => id === normalized)?.name ??
          (normalized.startsWith('CUSTOM_') ? 'Custom role' : roleName),
        badge: 'Custom',
        description: 'Standard role',
        icon: User,
        colorClass: 'text-muted-foreground bg-muted',
        badgeClass: 'bg-muted text-muted-foreground border-border',
      }
    );
  };

  if (loading) return <ModuleLoading />;

  return (
    <div className="flex-1 bg-background text-foreground space-y-8 max-w-6xl mx-auto w-full pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-foreground tracking-tight">
            Users & Role Management
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          {canCreate && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              New user
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            disabled={loading || !canRead}
            className="gap-2 cursor-pointer border-border hover:bg-muted"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Role Summary Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-card border border-border rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Total Users</span>
            <Users className="size-3.5 text-primary" />
          </div>
          <div className="text-xl font-black text-foreground">{stats.total}</div>
        </div>

        <div className="bg-card border border-border rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Super Admins</span>
            <ShieldAlert className="size-3.5 text-rose-500" />
          </div>
          <div className="text-xl font-black text-foreground">{stats.superAdmins}</div>
        </div>

        <div className="bg-card border border-border rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Admins</span>
            <ShieldCheck className="size-3.5 text-blue-500" />
          </div>
          <div className="text-xl font-black text-foreground">{stats.admins}</div>
        </div>

        <div className="bg-card border border-border rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Moderators</span>
            <Shield className="size-3.5 text-purple-500" />
          </div>
          <div className="text-xl font-black text-foreground">{stats.moderators}</div>
        </div>

        <div className="bg-card border border-border rounded-xl p-3.5 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Visitors</span>
            <User className="size-3.5 text-slate-500" />
          </div>
          <div className="text-xl font-black text-foreground">{stats.standardUsers}</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search users by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8 h-9 text-xs bg-muted/30 border-border focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-border focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-card border border-border rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs font-bold text-foreground uppercase tracking-wider">
                <th scope="col" className="py-3.5 px-6 min-w-[260px]">
                  User
                </th>
                <th scope="col" className="py-3.5 px-6 min-w-[220px]">
                  Assign Role
                </th>
                <th scope="col" className="py-3.5 px-6 text-right min-w-[110px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-muted-foreground">
                    <p className="text-sm">No users found matching your search filter.</p>
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="mt-2 text-xs text-primary font-semibold underline cursor-pointer"
                    >
                      Clear search
                    </button>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((userItem) => {
                  const roleDef = getRoleDef(userItem.role);
                  const RoleIcon = roleDef.icon;
                  const isUpdating = updatingUserId === userItem.id;
                  const isCurrentLoggedUser =
                    currentUser &&
                    (currentUser.id === userItem.id ||
                      currentUser.email.toLowerCase() === userItem.email.toLowerCase());

                  return (
                    <tr key={userItem.id} className="hover:bg-muted/30 transition-colors group">
                      {/* User Info */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleOpenUserModal(userItem)}
                            disabled={!canUpdate}
                            className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0 cursor-pointer hover:ring-2 hover:ring-primary/40 hover:scale-105 transition-all"
                            title={`Click to view ${userItem.name}'s profile`}
                          >
                            {userItem.name?.charAt(0)?.toUpperCase() || 'U'}
                          </button>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenUserModal(userItem)}
                                className="font-bold text-sm text-foreground hover:text-primary hover:underline transition-colors truncate cursor-pointer text-left"
                                title="Click to view full user profile"
                              >
                                {userItem.name}
                              </button>
                              {isCurrentLoggedUser && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-primary/15 text-primary">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground truncate font-mono">
                              {userItem.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Dropdown Menu */}
                      <td className="py-4 px-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isUpdating || !canUpdate || Boolean(isCurrentLoggedUser)}
                              className="h-9 px-3 gap-2.5 bg-card hover:bg-secondary border-border font-medium min-w-[170px] justify-between cursor-pointer shadow-xs"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <div
                                  className={`flex size-5 items-center justify-center rounded-md ${roleDef.colorClass}`}
                                >
                                  <RoleIcon className="size-3" />
                                </div>
                                <span className="truncate text-xs font-bold text-foreground">
                                  {roleDef.label}
                                </span>
                              </div>
                              <ChevronDown className="size-3.5 text-muted-foreground opacity-70 shrink-0" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent
                            className="w-64 bg-card border-border shadow-xl p-1.5 z-50"
                            align="start"
                          >
                            <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold px-2 py-1">
                              Select Role for {userItem.name}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-border" />
                            {roleOptions.map((roleOpt) => {
                              const OptIcon = roleOpt.icon;
                              const isSelected = userItem.role === roleOpt.role;

                              return (
                                <DropdownMenuItem
                                  key={roleOpt.role}
                                  onClick={() => handleRoleChange(userItem, roleOpt.role)}
                                  className={`flex items-start gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                                    isSelected
                                      ? 'bg-secondary text-secondary-foreground font-semibold'
                                      : 'text-foreground hover:bg-muted'
                                  }`}
                                >
                                  <div className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0 mt-0.5">
                                    <OptIcon className="size-3.5" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold">{roleOpt.label}</span>
                                      {isSelected && (
                                        <Check className="size-3.5 text-primary shrink-0" />
                                      )}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground line-clamp-1 font-normal">
                                      {roleOpt.description}
                                    </p>
                                  </div>
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>

                      {/* Actions: Edit & Delete */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenUserModal(userItem)}
                            className="size-8 p-0 rounded-lg border-border hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer focus-visible:ring-0 focus-visible:outline-none"
                            title={`Edit ${userItem.name}`}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDeleteModal(userItem)}
                            disabled={!canDelete || Boolean(isCurrentLoggedUser)}
                            className="size-8 p-0 rounded-lg border-destructive/20 hover:border-destructive/40 bg-destructive/5 hover:bg-destructive/15 text-destructive cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed focus-visible:ring-0 focus-visible:outline-none"
                            title={
                              isCurrentLoggedUser
                                ? 'You cannot delete your own account'
                                : `Delete ${userItem.name}`
                            }
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          if (!creating) {
            setCreateOpen(open);
            if (!open) {
              setShowPassword(false);
              setCreateForm({ name: '', email: '', password: '', role: 'USER' });
            }
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New user</DialogTitle>
          </DialogHeader>
          <form className="grid gap-4" noValidate onSubmit={handleCreate}>
            <label className="grid gap-1 text-sm">
              Name (optional)
              <Input
                minLength={2}
                autoComplete="off"
                value={createForm.name}
                onChange={(event) => setCreateForm({ ...createForm, name: event.target.value })}
              />
            </label>
            <label className="grid gap-1 text-sm">
              Email
              <Input
                required
                type="email"
                autoComplete="off"
                value={createForm.email}
                onChange={(event) => setCreateForm({ ...createForm, email: event.target.value })}
              />
            </label>
            <div className="grid gap-1 text-sm">
              <label htmlFor="new-user-password">Initial password</label>
              <div className="relative">
                <Input
                  id="new-user-password"
                  required
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={32}
                  className="pr-10"
                  aria-describedby="new-user-password-help"
                  value={createForm.password}
                  onChange={(event) =>
                    setCreateForm({ ...createForm, password: event.target.value })
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full w-10"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
              <span id="new-user-password-help" className="text-xs text-muted-foreground">
                Use 8–32 characters with at least one uppercase letter (A–Z), one lowercase letter
                (a–z), one number (0–9), and one special character (for example, @, # or !).
              </span>
            </div>
            <label htmlFor="new-user-role" className="grid gap-1 text-sm">
              Role
              <Select
                value={createForm.role}
                onValueChange={(role) => setCreateForm({ ...createForm, role })}
              >
                <SelectTrigger id="new-user-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {!roleOptions.some(({ role }) => role === 'USER') && (
                    <SelectItem value="USER">User</SelectItem>
                  )}
                  {roleOptions.map(({ role, label }) => (
                    <SelectItem key={role} value={role}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <DialogFooter>
              <Button type="submit" disabled={creating}>
                Create account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* User Information Modal Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="sm:max-w-xl bg-card border-border shadow-2xl p-6 overflow-hidden focus:outline-none focus-visible:ring-0"
        >
          <DialogHeader className="pb-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-base shrink-0 border border-primary/20">
                {modalForm.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-lg font-black text-foreground tracking-tight">
                  {selectedUser?.name || 'User Profile'}
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>

          {/* User Details Form */}
          <div className="space-y-4 py-2 max-h-[68vh] overflow-y-auto pr-1">
            {/* Account ID */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center justify-between">
                <span>Account Identifier (User ID)</span>
                {copiedId && (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 normal-case">
                    <Check className="size-3" /> Copied!
                  </span>
                )}
              </label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={selectedUser?.id || ''}
                  className="font-mono text-xs bg-muted/40 border-border select-all focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-border focus:outline-none"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => selectedUser?.id && handleCopyId(selectedUser.id)}
                  className="h-9 px-3 gap-1.5 cursor-pointer border-border hover:bg-muted shrink-0 text-xs font-semibold focus-visible:ring-0 focus-visible:outline-none"
                  title="Copy User ID"
                >
                  <Copy className="size-3.5 text-muted-foreground" />
                  <span>Copy</span>
                </Button>
              </div>
            </div>

            {/* Name & Email Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <User className="size-3.5 text-primary" />
                  <span>Full Name</span>
                </label>
                <Input
                  value={modalForm.name}
                  onChange={(e) => setModalForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Marcus Aurelius"
                  className="text-xs bg-muted/20 border-border focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-border focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="size-3.5 text-primary" />
                  <span>Email Address</span>
                </label>
                <Input
                  type="email"
                  value={modalForm.email}
                  onChange={(e) => setModalForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="e.g. user@roma.it"
                  className="text-xs bg-muted/20 border-border font-mono focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-border focus:outline-none"
                />
              </div>
            </div>

            {/* Assigned Role & Account Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-primary" />
                  <span>Assigned System Role</span>
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-9 justify-between bg-muted/20 hover:bg-muted/40 border-border px-3 text-xs font-semibold cursor-pointer text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-border focus:outline-none"
                    >
                      <div className="flex items-center gap-2 truncate">
                        {(() => {
                          const roleDef = getRoleDef(modalForm.role);
                          const RoleIcon = roleDef.icon;
                          return (
                            <>
                              <RoleIcon className="size-3.5 text-primary shrink-0" />
                              <span className="truncate">
                                {roleDef.label} ({roleDef.badge})
                              </span>
                            </>
                          );
                        })()}
                      </div>
                      <ChevronDown className="size-3.5 text-muted-foreground opacity-70 shrink-0 ml-1.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-(--radix-dropdown-menu-trigger-width) min-w-56 bg-card border-border shadow-xl p-1.5 z-50"
                    align="start"
                  >
                    <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold px-2 py-1">
                      Select System Role
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border" />
                    {roleOptions.map((r) => {
                      const isSelected = modalForm.role === r.role;
                      const RoleIcon = r.icon;
                      return (
                        <DropdownMenuItem
                          key={r.role}
                          onClick={() => setModalForm((prev) => ({ ...prev, role: r.role }))}
                          className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-secondary text-secondary-foreground font-semibold'
                              : 'text-foreground hover:bg-muted'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
                              <RoleIcon className="size-3.5" />
                            </div>
                            <div className="truncate">
                              <span className="text-xs font-bold">{r.label}</span>
                              <span className="text-[11px] text-muted-foreground ml-1.5 font-normal">
                                ({r.badge})
                              </span>
                            </div>
                          </div>
                          {isSelected && <Check className="size-3.5 text-primary shrink-0" />}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="size-3.5 text-primary" />
                  <span>Account Status</span>
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-9 justify-between bg-muted/20 hover:bg-muted/40 border-border px-3 text-xs font-semibold cursor-pointer text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-border focus:outline-none"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`size-2 rounded-full ${
                            modalForm.is_active ? 'bg-emerald-500' : 'bg-destructive'
                          }`}
                        />
                        <span
                          className={
                            modalForm.is_active
                              ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                              : 'text-destructive font-semibold'
                          }
                        >
                          {modalForm.is_active
                            ? 'Active (Unrestricted)'
                            : 'Deactivated (Suspended)'}
                        </span>
                      </div>
                      <ChevronDown className="size-3.5 text-muted-foreground opacity-70 shrink-0 ml-1.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-(--radix-dropdown-menu-trigger-width) min-w-48 bg-card border-border shadow-xl p-1.5 z-50"
                    align="start"
                  >
                    <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold px-2 py-1">
                      Select Account Status
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem
                      onClick={() => setModalForm((prev) => ({ ...prev, is_active: true }))}
                      className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                        modalForm.is_active
                          ? 'bg-secondary text-secondary-foreground font-semibold'
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          Active (Unrestricted)
                        </span>
                      </div>
                      {modalForm.is_active && <Check className="size-3.5 text-primary shrink-0" />}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => setModalForm((prev) => ({ ...prev, is_active: false }))}
                      className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                        !modalForm.is_active
                          ? 'bg-secondary text-secondary-foreground font-semibold'
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-destructive shrink-0" />
                        <span className="text-xs font-bold text-destructive">
                          Deactivated (Suspended)
                        </span>
                      </div>
                      {!modalForm.is_active && <Check className="size-3.5 text-primary shrink-0" />}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              disabled={isSavingModal}
              className="cursor-pointer border-border hover:bg-muted focus-visible:ring-0 focus-visible:outline-none"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveModalUser}
              disabled={isSavingModal}
              className="gap-2 bg-primary text-primary-foreground font-semibold cursor-pointer shadow-xs hover:opacity-90 focus-visible:ring-0 focus-visible:outline-none"
            >
              {isSavingModal ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="size-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Warning Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="sm:max-w-md bg-card border-border shadow-2xl p-6 overflow-hidden focus:outline-none focus-visible:ring-0"
        >
          <DialogHeader className="pb-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive font-bold shrink-0 border border-destructive/20">
                <AlertTriangle className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-lg font-black text-foreground tracking-tight">
                  Delete User Account
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>

          <div className="py-3 space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Delete the account for{' '}
              <span className="font-bold text-foreground">{userToDelete?.name}</span>? This will
              disable sign-in for the account.
            </p>

            {userToDelete && (
              <div className="p-3 bg-muted/40 border border-border rounded-xl space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">User ID:</span>
                  <span className="font-mono font-semibold text-foreground">{userToDelete.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-mono font-semibold text-foreground">
                    {userToDelete.email}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Current Role:</span>
                  <span className="font-semibold text-foreground">
                    {getRoleDef(userToDelete.role as SystemRole).label}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
              className="cursor-pointer border-border hover:bg-muted focus-visible:ring-0 focus-visible:outline-none"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold cursor-pointer shadow-xs focus-visible:ring-0 focus-visible:outline-none"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="size-3.5" />
                  <span>Delete User</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
