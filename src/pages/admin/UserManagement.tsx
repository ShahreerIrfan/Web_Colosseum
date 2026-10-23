import authApi from '@/apis/auth/authApi';
import { Button } from '@/components/ui/button';
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
import { getUserPayload } from '@/utils/localStorageUtils';
import { getFallbackRbacForRole } from '@/utils/rbacUtils';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Copy,
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

type SystemRole = 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'USER';

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

  const fetchUsers = useCallback(async () => {
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
  }, [showError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (user: ManagedUser, newRole: SystemRole) => {
    if (user.role.toUpperCase() === newRole) return;

    try {
      setUpdatingUserId(user.id);
      await authApi.updateUserRole(user.id, newRole);

      // Update state locally
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)));

      const targetRoleDef = AVAILABLE_ROLES.find((r) => r.role === newRole);
      showSuccess(
        'Role Updated Successfully',
        `Changed role for "${user.name}" to ${targetRoleDef?.label || newRole}.`
      );

      // If updating the currently logged-in user, update session payload so sidebar dynamically reacts
      if (
        currentUser &&
        (currentUser.id === user.id || currentUser.email.toLowerCase() === user.email.toLowerCase())
      ) {
        const normalizedRole = newRole.toLowerCase();
        const updatedPayload: UserPayload = {
          ...currentUser,
          role: newRole,
          userRole: normalizedRole,
          rback: getFallbackRbacForRole(normalizedRole),
        };
        localStorage.setItem('colosseum_user_payload', JSON.stringify(updatedPayload));
        window.dispatchEvent(new Event('rbac-updated'));
        showInfo('Session Synchronized', `Your active administrative privileges are now updated.`);
      }
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
      role: (user.role.toUpperCase() as SystemRole) || 'USER',
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
    if (!selectedUser) return;
    if (!modalForm.name.trim() || !modalForm.email.trim()) {
      showError('Validation Error', 'Name and email are required.');
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

      // If updating currently logged in user
      if (
        currentUser &&
        (currentUser.id === selectedUser.id ||
          currentUser.email.toLowerCase() === selectedUser.email.toLowerCase())
      ) {
        const normalizedRole = modalForm.role.toLowerCase();
        const updatedPayload: UserPayload = {
          ...currentUser,
          name: modalForm.name.trim(),
          email: modalForm.email.trim().toLowerCase(),
          role: modalForm.role,
          userRole: normalizedRole,
          rback: getFallbackRbacForRole(normalizedRole),
        };
        localStorage.setItem('colosseum_user_payload', JSON.stringify(updatedPayload));
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
    if (!userToDelete) return;
    try {
      setIsDeleting(true);
      await authApi.deleteUser(userToDelete.id);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      showSuccess(
        'User Deleted',
        `Account for "${userToDelete.name}" has been permanently removed.`
      );
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
    const normalized = roleName.toUpperCase();
    return (
      AVAILABLE_ROLES.find((r) => r.role === normalized) || {
        role: 'USER',
        label: roleName,
        badge: 'Custom',
        description: 'Standard role',
        icon: User,
        colorClass: 'text-muted-foreground bg-muted',
        badgeClass: 'bg-muted text-muted-foreground border-border',
      }
    );
  };

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
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            disabled={loading}
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
              {loading ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="size-4 animate-spin text-primary" />
                      <span>Loading user accounts...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
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
                              disabled={isUpdating}
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
                            {AVAILABLE_ROLES.map((roleOpt) => {
                              const OptIcon = roleOpt.icon;
                              const isSelected = userItem.role.toUpperCase() === roleOpt.role;

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
                            disabled={Boolean(isCurrentLoggedUser)}
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
                    {AVAILABLE_ROLES.map((r) => {
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
              Are you sure you want to permanently delete{' '}
              <span className="font-bold text-foreground">{userToDelete?.name}</span>? This action
              cannot be undone and will completely remove this user account from the system.
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
