import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, LogOut, UserPlus, UserCog, UserX, Boxes, Trash2, CheckCircle2,
  XCircle, LayoutDashboard, ChevronDown, Package, Clock, ArchiveX,
  RotateCcw, Download, Plus, AlertCircle, Tag, MapPin, Camera, Edit, History,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ThemeToggle } from '@/components/auth/ThemeToggle';
import { InteractiveBackground } from '@/components/auth/InteractiveBackground';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/authStore';
import {
  approveRequestAsAdmin,
  createEquipmentAsAdmin,
  createUserAsAdmin,
  deleteEquipmentAsAdmin,
  deleteRequestAsAdmin,
  deleteUserAsAdmin,
  getAdminDashboard,
  getUsersAsAdmin,
  getRequestsAsAdmin,
  rejectRequestAsAdmin,
  returnRequestAsAdmin,
  updateUserRoleAsAdmin,
  updateEquipmentAsAdmin,
  getAdminEquipmentHistory,
  getAdminUserHistory,
} from '@/services/adminService';
import { getEquipmentList } from '@/services/inventoryService';
import { updateEquipmentStatus } from '@/services/inventoryService';
import type { Equipment, User, UserRole, BorrowRequest } from '@/types/auth';
import { ExplosionEffect } from '@/components/ui/ExplosionEffect';

type RequestTab = 'pending' | 'active' | 'archive';

interface ReturnModalState {
  requestId: number;
  equipmentName: string;
  condition: 'new' | 'good' | 'fair' | 'damaged';
  notes: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending:  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  approved: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  returned: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  available: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  checked_out: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  under_repair: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  retired: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
};

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, token, isAuthenticated, logout } = useAuthStore();

  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    localStorage.getItem('sims_theme') === 'light' ? 'light' : 'dark'
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dashboardInfo, setDashboardInfo] = useState<string>('Loading admin data...');
  const [users, setUsers] = useState<User[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [openStatusMenuId, setOpenStatusMenuId] = useState<number | null>(null);
  const [openRoleMenuId, setOpenRoleMenuId] = useState<number | null>(null);
  const [requestTab, setRequestTab] = useState<RequestTab>('pending');
  const [returnModal, setReturnModal] = useState<ReturnModalState | null>(null);
  const [explodingEquipmentId, setExplodingEquipmentId] = useState<number | null>(null);

  const [editEquipmentModal, setEditEquipmentModal] = useState<Equipment | null>(null);
  const [historyModal, setHistoryModal] = useState<{ type: 'user' | 'equipment', id: number, title: string } | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'student' as UserRole });
  const [equipment, setEquipment] = useState({
    name: '', type: '', condition: 'good' as 'new' | 'good' | 'fair' | 'damaged',
    quantity: '1', serial_number: '', location: '', photo_url: ''
  });

  const pendingRequests = useMemo(() => requests.filter(r => r.status === 'pending'), [requests]);
  const activeRequests  = useMemo(() => requests.filter(r => r.status === 'approved'), [requests]);
  const archiveRequests = useMemo(() => requests.filter(r => r.status === 'returned' || r.status === 'rejected'), [requests]);

  const handleDeleteEquipment = (id: number) => setExplodingEquipmentId(id);
  const performDeleteEquipment = async (id: number) => {
    await withResult(deleteEquipmentAsAdmin(token!, id), 'Equipment deleted');
    setExplodingEquipmentId(null);
  };

  const refreshAdminData = async () => {
    if (!token) return;
    const [dashboardResult, usersResult, equipmentResult, requestsResult] = await Promise.all([
      getAdminDashboard(token),
      getUsersAsAdmin(token),
      getEquipmentList(),
      getRequestsAsAdmin(token),
    ]);

    if (dashboardResult.success && dashboardResult.data) {
      setDashboardInfo(dashboardResult.data.message || 'Admin session active');
    } else {
      setDashboardInfo('Admin session active');
    }
    if (usersResult.success && usersResult.data) setUsers(usersResult.data.users);
    if (equipmentResult.success && equipmentResult.data) setEquipmentList(equipmentResult.data);
    if (requestsResult.success && requestsResult.data) {
      const payload = Array.isArray(requestsResult.data) ? requestsResult.data : requestsResult.data.requests;
      setRequests(Array.isArray(payload) ? payload : []);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !token) { navigate('/admin/login', { replace: true }); return; }
    if (user?.role !== 'admin') { navigate('/dashboard', { replace: true }); return; }
    refreshAdminData();
    const id = setInterval(refreshAdminData, 10000);
    return () => clearInterval(id);
  }, [isAuthenticated, navigate, token, user?.role]);

  useEffect(() => {
    const handler = () => { setOpenStatusMenuId(null); setOpenRoleMenuId(null); };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const clearNotices = () => { setMessage(null); setError(null); };

  const withResult = async (
    action: Promise<{ success: boolean; message?: string; error?: string }>,
    successMessage: string,
    onSuccess?: () => void,
  ) => {
    clearNotices();
    const result = await action;
    if (!result.success) { setError(result.error || 'Operation failed'); return; }
    setMessage(result.message || successMessage);
    onSuccess?.();
    await refreshAdminData();
  };

  const onLogout = async () => { await logout(); navigate('/admin/login', { replace: true }); };

  const handleEditEquipmentSubmit = async () => {
    if (!editEquipmentModal || !token) return;
    await withResult(
      updateEquipmentAsAdmin(token, editEquipmentModal.id, {
        name: editEquipmentModal.name,
        type: editEquipmentModal.type,
        condition: editEquipmentModal.condition as any,
        quantity: Number(editEquipmentModal.quantity),
        serial_number: editEquipmentModal.serial_number || undefined,
        location: editEquipmentModal.location || undefined,
        photo_url: editEquipmentModal.photo_url || undefined,
      }),
      'Equipment updated successfully'
    );
    setEditEquipmentModal(null);
  };

  useEffect(() => {
    if (!historyModal || !token) { setHistoryData([]); return; }
    const fetchHistory = async () => {
      setHistoryLoading(true);
      const res = historyModal.type === 'equipment'
        ? await getAdminEquipmentHistory(token, historyModal.id)
        : await getAdminUserHistory(token, historyModal.id);
      setHistoryLoading(false);
      if (res.success && res.data) setHistoryData(res.data);
      else setError(res.error || 'Failed to fetch history');
    };
    fetchHistory();
  }, [historyModal, token]);

  const handleReturnSubmit = async () => {
    if (!returnModal || !token) return;
    await withResult(
      returnRequestAsAdmin(token, returnModal.requestId, returnModal.condition, returnModal.notes),
      'Item returned successfully',
    );
    setReturnModal(null);
  };

  const exportToExcel = () => {
    const reqSheet = XLSX.utils.json_to_sheet(requests.map(r => ({
      'Request ID': r.id,
      'User ID': r.user_id,
      'Equipment': r.equipment?.name || r.equipment_id,
      'Status': r.status,
      'Qty': r.quantity,
      'Requested': r.request_date ? new Date(r.request_date).toLocaleDateString() : '',
      'Due': r.due_date ? new Date(r.due_date).toLocaleDateString() : '',
      'Return Condition': r.return_condition || '',
      'Notes': r.notes || '',
    })));
    const invSheet = XLSX.utils.json_to_sheet(equipmentList.map(e => ({
      'ID': e.id,
      'Name': e.name,
      'Type': e.type,
      'Serial #': e.serial_number || '',
      'Location': e.location || '',
      'Condition': e.condition,
      'Status': e.status,
      'Quantity': e.quantity,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, reqSheet, 'Requests');
    XLSX.utils.book_append_sheet(wb, invSheet, 'Inventory');
    XLSX.writeFile(wb, `SIMS_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  if (!token || user?.role !== 'admin') return null;

  return (
    <div className={theme === 'dark' ? 'dark' : 'light'}>
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-lime-50 via-cyan-50 to-lime-100 dark:from-slate-950 dark:via-purple-950 dark:to-slate-900 transition-colors duration-300">
        <InteractiveBackground theme={theme} />
        <ThemeToggle defaultTheme={theme} onThemeChange={setTheme} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-lime-700 dark:text-white flex items-center gap-2">
                <Shield className="w-8 h-8" />
                Admin Control Center
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1">
                {dashboardInfo} • Signed in as <span className="font-semibold">{user.email}</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => navigate('/dashboard')} icon={<LayoutDashboard className="w-4 h-4" />}>
                User dashboard
              </Button>
              <Button variant="secondary" onClick={exportToExcel} icon={<Download className="w-4 h-4" />}>
                Export Excel
              </Button>
              <Button variant="secondary" onClick={onLogout} icon={<LogOut className="w-4 h-4" />}>
                Log out
              </Button>
            </div>
          </div>

          {message && <Notice type="success" text={message} />}
          {error && <Notice type="error" text={error} />}

          <div className="flex flex-col xl:flex-row items-start gap-4 sm:gap-6">
            {/* Left column */}
            <div className="w-full xl:w-1/2 space-y-4 sm:space-y-6">

              {/* User Management */}
              <Panel title="User Management" icon={<UserPlus className="w-5 h-5" />}>
                <div className="space-y-3">
                  <Input label="Username" value={newUser.username} onChange={e => setNewUser(p => ({ ...p, username: e.target.value }))} />
                  <Input label="Email" type="email" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} />
                  <Input label="Password" type="password" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} />
                  <SelectRole label="Role" value={newUser.role} onChange={role => setNewUser(p => ({ ...p, role }))} />
                  <Button className="w-full" onClick={() => withResult(
                    createUserAsAdmin(token, {
                      username: newUser.username, email: newUser.email,
                      password: newUser.password, role: newUser.role,
                    }),
                    'User created',
                    () => setNewUser({ username: '', email: '', password: '', role: 'student' }),
                  )}>
                    Create user
                  </Button>
                </div>

                <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold">
                    <UserCog className="w-4 h-4" />
                    All Users
                  </div>
                  <div className="space-y-2 max-h-[45vh] sm:max-h-64 overflow-y-auto pr-1">
                    {users.map(u => (
                      <article key={u.id} className="relative overflow-visible rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/60 p-3">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{u.username}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{u.email}</p>
                            <RoleBadge role={u.role} />
                          </div>
                          <div className="flex w-full sm:w-auto items-center gap-2">
                            <div className="relative w-full sm:w-auto sm:min-w-[130px]">
                              <button
                                type="button"
                                onClick={e => { e.stopPropagation(); setOpenRoleMenuId(prev => prev === u.id ? null : u.id); }}
                                className="h-9 w-full rounded-lg border border-blue-300 dark:border-blue-500 bg-white dark:bg-slate-800 px-3 text-xs font-semibold text-slate-900 dark:text-white shadow-sm transition hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <span className="flex items-center justify-between gap-2">
                                  <span className="capitalize">{u.role}</span>
                                  <ChevronDown className={`h-3.5 w-3.5 transition ${openRoleMenuId === u.id ? 'rotate-180' : ''}`} />
                                </span>
                              </button>
                              {openRoleMenuId === u.id && (
                                <div className="absolute right-0 z-30 top-full mt-2 w-full overflow-hidden rounded-lg border border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-900 shadow-xl" onClick={e => e.stopPropagation()}>
                                  {(['student', 'teacher', 'admin'] as UserRole[]).map(r => (
                                    <button key={r} type="button"
                                      onClick={async () => { setOpenRoleMenuId(null); await withResult(updateUserRoleAsAdmin(token, u.id, r), 'Role updated'); }}
                                      className={`block w-full px-3 py-2 text-left text-xs font-medium transition ${u.role === r ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200' : 'text-slate-800 dark:text-slate-100 hover:bg-blue-50 dark:hover:bg-slate-800'}`}
                                    >
                                      <span className="capitalize">{r}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <Button className="w-full sm:w-auto" variant="secondary" size="sm"
                              onClick={() => setHistoryModal({ type: 'user', id: u.id, title: u.username })}
                              icon={<History className="w-3 h-3" />}>
                              History
                            </Button>
                            <Button className="w-full sm:w-auto" variant="destructive" size="sm"
                              onClick={() => withResult(deleteUserAsAdmin(token, u.id), 'User deleted')}
                              icon={<UserX className="w-3 h-3" />}>
                              Delete
                            </Button>
                          </div>
                        </div>
                      </article>
                    ))}
                    {users.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No users found.</p>}
                  </div>
                </div>
              </Panel>

              {/* Tabbed Request Moderation */}
              <Panel
                title="Request Moderation"
                icon={<CheckCircle2 className="w-5 h-5" />}
                headerRight={
                  <div className="flex gap-1 text-xs">
                    <TabButton active={requestTab === 'pending'} onClick={() => setRequestTab('pending')} count={pendingRequests.length} icon={<Clock className="w-3 h-3" />} label="Pending" />
                    <TabButton active={requestTab === 'active'}  onClick={() => setRequestTab('active')}  count={activeRequests.length}  icon={<Package className="w-3 h-3" />} label="Active" />
                    <TabButton active={requestTab === 'archive'} onClick={() => setRequestTab('archive')} count={archiveRequests.length} icon={<ArchiveX className="w-3 h-3" />} label="Archive" />
                  </div>
                }
              >
                <div className="space-y-2 max-h-[55vh] sm:max-h-[400px] overflow-auto pr-1">
                  {requestTab === 'pending' && (
                    <>
                      {pendingRequests.map(req => (
                        <RequestCard key={req.id} req={req}
                          actions={
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Button variant="primary" size="sm" className="flex-1"
                                onClick={() => withResult(approveRequestAsAdmin(token, req.id), 'Request approved')}
                                icon={<CheckCircle2 className="w-3 h-3" />}>Approve</Button>
                              <Button variant="secondary" size="sm" className="flex-1"
                                onClick={() => withResult(rejectRequestAsAdmin(token, req.id), 'Request rejected')}
                                icon={<XCircle className="w-3 h-3" />}>Reject</Button>
                              <Button variant="destructive" size="sm" className="flex-1"
                                onClick={() => withResult(deleteRequestAsAdmin(token, req.id), 'Request deleted')}
                                icon={<Trash2 className="w-3 h-3" />}>Delete</Button>
                            </div>
                          }
                        />
                      ))}
                      {pendingRequests.length === 0 && <EmptyState icon={<CheckCircle2 className="w-6 h-6" />} text="No pending requests — all caught up!" />}
                    </>
                  )}

                  {requestTab === 'active' && (
                    <>
                      {activeRequests.map(req => (
                        <RequestCard key={req.id} req={req}
                          actions={
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Button variant="primary" size="sm" className="flex-1"
                                onClick={() => setReturnModal({ requestId: req.id, equipmentName: req.equipment?.name || `ID ${req.equipment_id}`, condition: 'good', notes: '' })}
                                icon={<RotateCcw className="w-3 h-3" />}>Log Return</Button>
                              <Button variant="destructive" size="sm" className="flex-1"
                                onClick={() => withResult(deleteRequestAsAdmin(token, req.id), 'Request deleted')}
                                icon={<Trash2 className="w-3 h-3" />}>Delete</Button>
                            </div>
                          }
                        />
                      ))}
                      {activeRequests.length === 0 && <EmptyState icon={<Package className="w-6 h-6" />} text="No items currently checked out." />}
                    </>
                  )}

                  {requestTab === 'archive' && (
                    <>
                      {archiveRequests.map(req => (
                        <RequestCard key={req.id} req={req}
                          actions={
                            <Button variant="destructive" size="sm" className="w-full sm:w-auto"
                              onClick={() => withResult(deleteRequestAsAdmin(token, req.id), 'Request deleted')}
                              icon={<Trash2 className="w-3 h-3" />}>Delete</Button>
                          }
                        />
                      ))}
                      {archiveRequests.length === 0 && <EmptyState icon={<ArchiveX className="w-6 h-6" />} text="No archived requests." />}
                    </>
                  )}
                </div>
              </Panel>
            </div>

            {/* Right column — Inventory */}
            <div className="w-full xl:w-1/2 space-y-4 sm:space-y-6">
              <Panel title="Inventory Management" icon={<Boxes className="w-5 h-5" />}>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Equipment name" value={equipment.name} onChange={e => setEquipment(p => ({ ...p, name: e.target.value }))} />
                    <Input label="Type" value={equipment.type} onChange={e => setEquipment(p => ({ ...p, type: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Condition</label>
                      <select
                        value={equipment.condition}
                        onChange={e => setEquipment(p => ({ ...p, condition: e.target.value as typeof p.condition }))}
                        className="w-full rounded-[10px] border-2 border-slate-300 dark:border-slate-600 px-3 py-[11px] bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500"
                      >
                        <option value="new">New</option>
                        <option value="good">Good</option>
                        <option value="fair">Fair</option>
                        <option value="damaged">Damaged</option>
                      </select>
                    </div>
                    <Input label="Quantity" type="number" value={equipment.quantity} onChange={e => setEquipment(p => ({ ...p, quantity: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Serial #" placeholder="SN-XXXX" value={equipment.serial_number} onChange={e => setEquipment(p => ({ ...p, serial_number: e.target.value }))} />
                    <Input label="Location" placeholder="Room 101" value={equipment.location} onChange={e => setEquipment(p => ({ ...p, location: e.target.value }))} />
                  </div>
                  <Input label="Photo URL (optional)" placeholder="https://..." value={equipment.photo_url} onChange={e => setEquipment(p => ({ ...p, photo_url: e.target.value }))} />
                  <Button className="w-full" icon={<Plus className="w-4 h-4" />} onClick={() =>
                    withResult(
                      createEquipmentAsAdmin(token, {
                        name: equipment.name, type: equipment.type,
                        condition: equipment.condition, quantity: Number(equipment.quantity),
                        serial_number: equipment.serial_number || undefined,
                        location: equipment.location || undefined,
                        photo_url: equipment.photo_url || undefined,
                      }),
                      'Equipment created',
                      () => setEquipment({ name: '', type: '', condition: 'good', quantity: '1', serial_number: '', location: '', photo_url: '' })
                    )
                  }>
                    Create equipment
                  </Button>
                </div>

                {/* Equipment list with delete */}
                <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold">
                    <Trash2 className="w-4 h-4" />
                    Equipment List
                  </div>
                  <div className="space-y-2 max-h-[42vh] sm:max-h-60 overflow-auto pr-1">
                    {equipmentList.map(item => (
                      <ExplosionEffect key={item.id} isExploding={explodingEquipmentId === item.id} onComplete={() => performDeleteEquipment(item.id)}>
                        <article className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/60 p-3">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{item.name}</p>
                              <p className="text-sm text-slate-600 dark:text-slate-400">{item.type}</p>
                              <div className="flex flex-wrap gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {item.serial_number && <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{item.serial_number}</span>}
                                {item.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{item.location}</span>}
                                <span>Qty: {item.quantity}</span>
                              </div>
                              <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[item.status] ?? 'bg-slate-100 text-slate-700'}`}>
                                {item.status.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <div className="flex w-full sm:w-auto items-center gap-2 shrink-0">
                              <Button variant="secondary" size="sm" onClick={() => setEditEquipmentModal(item)} icon={<Edit className="w-3 h-3" />}>Edit</Button>
                              <Button variant="secondary" size="sm" onClick={() => setHistoryModal({ type: 'equipment', id: item.id, title: item.name })} icon={<History className="w-3 h-3" />}>History</Button>
                              <Button variant="destructive" size="sm"
                                onClick={() => handleDeleteEquipment(item.id)} icon={<Trash2 className="w-3 h-3" />}>
                                Delete
                              </Button>
                            </div>
                          </div>
                        </article>
                      </ExplosionEffect>
                    ))}
                    {equipmentList.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No equipment found.</p>}
                  </div>
                </div>

                {/* Equipment status panel */}
                <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold">
                    <Boxes className="w-4 h-4" />
                    Change Status
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Items must be set to <span className="font-semibold">retired</span> before deletion.
                  </p>
                  <div className="space-y-3 max-h-[50vh] sm:max-h-none overflow-y-auto sm:overflow-visible">
                    {equipmentList.map(item => (
                      <article key={item.id} className="relative rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-gradient-to-r from-white to-slate-50 dark:from-slate-900/80 dark:to-slate-800/60 p-3 overflow-visible">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div className="flex gap-3 items-start">
                            {item.photo_url ? (
                              <img src={item.photo_url} alt={item.name} className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-600" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                <Camera className="w-4 h-4 text-slate-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-slate-100">{item.name}</p>
                              <p className="text-sm text-slate-600 dark:text-slate-400">{item.type} • Qty {item.quantity}</p>
                              <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[item.status] ?? ''}`}>
                                {item.status.replace(/_/g, ' ')}
                              </span>
                            </div>
                          </div>
                          <div className="flex w-full md:w-[280px] items-center gap-2">
                            <div className="relative w-full">
                              <button type="button"
                                onClick={e => { e.stopPropagation(); setOpenStatusMenuId(prev => prev === item.id ? null : item.id); }}
                                className="h-10 w-full rounded-xl border border-blue-300 dark:border-blue-500 bg-white dark:bg-slate-800 px-3 text-sm font-semibold text-slate-900 dark:text-white shadow-sm transition hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <span className="flex items-center justify-between gap-2">
                                  <span className="capitalize">{item.status.replace(/_/g, ' ')}</span>
                                  <ChevronDown className={`h-4 w-4 transition ${openStatusMenuId === item.id ? 'rotate-180' : ''}`} />
                                </span>
                              </button>
                              {openStatusMenuId === item.id && (
                                <div className="absolute z-30 top-full mt-2 w-full overflow-hidden rounded-xl border border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-900 shadow-2xl" onClick={e => e.stopPropagation()}>
                                  {(['available', 'checked_out', 'under_repair', 'retired'] as const).map(s => (
                                    <button key={s} type="button"
                                      onClick={async () => { setOpenStatusMenuId(null); await withResult(updateEquipmentStatus(token, item.id, s), 'Status updated'); }}
                                      className={`block w-full px-3 py-2.5 text-left text-sm font-medium transition ${item.status === s ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200' : 'text-slate-800 dark:text-slate-100 hover:bg-blue-50 dark:hover:bg-slate-800'}`}
                                    >
                                      {s.replace(/_/g, ' ')}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                    {equipmentList.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No equipment available.</p>}
                  </div>
                </div>
              </Panel>
            </div>
          </div>
        </div>
      </div>

      {/* Return Modal */}
      {returnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setReturnModal(null)}>
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Log Return</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{returnModal.equipmentName}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Return Condition</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['new', 'good', 'fair', 'damaged'] as const).map(c => (
                    <button key={c} type="button"
                      onClick={() => setReturnModal(p => p ? { ...p, condition: c } : p)}
                      className={`py-2.5 rounded-xl border-2 text-sm font-semibold capitalize transition ${
                        returnModal.condition === c
                          ? c === 'damaged'
                            ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                            : 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              {returnModal.condition === 'damaged' && (
                <div className="flex items-start gap-2 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 p-3">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-rose-700 dark:text-rose-300">Marking as damaged — equipment condition will be updated.</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Notes (optional)</label>
                <textarea
                  value={returnModal.notes}
                  onChange={e => setReturnModal(p => p ? { ...p, notes: e.target.value } : p)}
                  rows={3}
                  placeholder="Describe any damage, missing parts, etc."
                  className="w-full rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <Button className="flex-1" variant="secondary" onClick={() => setReturnModal(null)}>Cancel</Button>
                <Button className="flex-1" onClick={handleReturnSubmit} icon={<RotateCcw className="w-4 h-4" />}>Confirm Return</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Equipment Modal */}
      {editEquipmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setEditEquipmentModal(null)}>
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <Edit className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Edit Equipment</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{editEquipmentModal.name}</p>
              </div>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              <Input label="Name" value={editEquipmentModal.name} onChange={e => setEditEquipmentModal({ ...editEquipmentModal, name: e.target.value })} />
              <Input label="Type" value={editEquipmentModal.type} onChange={e => setEditEquipmentModal({ ...editEquipmentModal, type: e.target.value })} />
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Condition</label>
                <select
                  value={editEquipmentModal.condition}
                  onChange={e => setEditEquipmentModal({ ...editEquipmentModal, condition: e.target.value as any })}
                  className="w-full rounded-[10px] border-2 border-slate-300 dark:border-slate-600 px-3 py-3 bg-white dark:bg-slate-800 text-sm focus:outline-none"
                >
                  <option value="new">New</option><option value="good">Good</option><option value="fair">Fair</option><option value="damaged">Damaged</option>
                </select>
              </div>
              <Input label="Quantity" type="number" value={editEquipmentModal.quantity} onChange={e => setEditEquipmentModal({ ...editEquipmentModal, quantity: e.target.value as any })} />
              <Input label="Serial #" value={editEquipmentModal.serial_number || ''} onChange={e => setEditEquipmentModal({ ...editEquipmentModal, serial_number: e.target.value })} />
              <Input label="Location" value={editEquipmentModal.location || ''} onChange={e => setEditEquipmentModal({ ...editEquipmentModal, location: e.target.value })} />
              <Input label="Photo URL" value={editEquipmentModal.photo_url || ''} onChange={e => setEditEquipmentModal({ ...editEquipmentModal, photo_url: e.target.value })} />
            </div>
            <div className="flex gap-3 pt-5 mt-4 border-t border-slate-100 dark:border-slate-800">
              <Button className="flex-1" variant="secondary" onClick={() => setEditEquipmentModal(null)}>Cancel</Button>
              <Button className="flex-1" onClick={handleEditEquipmentSubmit} icon={<CheckCircle2 className="w-4 h-4" />}>Save Changes</Button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setHistoryModal(null)}>
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                  <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Activity History</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{historyModal.title}</p>
                </div>
              </div>
              <button onClick={() => setHistoryModal(null)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="h-[400px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
              {historyLoading ? (
                <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"/></div>
              ) : historyData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
                  <ArchiveX className="w-10 h-10 opacity-50" />
                  <p className="text-sm font-semibold uppercase tracking-widest">No history recorded</p>
                </div>
              ) : (
                historyData.map((log: any, i) => (
                  <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 flex items-center gap-1 rounded-md text-[10px] font-black uppercase ${log.status ? STATUS_COLORS[log.status] || 'bg-slate-200 text-slate-700' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                        {log.status || log.condition || 'Activity'}
                      </span>
                      <span className="text-xs text-slate-500 font-semibold">{new Date(log.request_date || log.recorded_at || log.created_at).toLocaleString()}</span>
                    </div>
                    {historyModal.type === 'equipment' ? (
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        <span className="font-semibold text-slate-900 dark:text-white">User ID:</span> {log.user_id || log.user?.username || log.request?.user_id || 'Unknown'}
                        {log.quantity && ` • Qty: ${log.quantity}`}
                        {log.notes && ` • Notes: ${log.notes}`}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        <span className="font-semibold text-slate-900 dark:text-white">Item:</span> {log.equipment?.name || `ID ${log.equipment_id}`}
                        {log.quantity && ` • Qty: ${log.quantity}`}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ──────────────────── Sub-components ──────────────────── */

const Panel: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}> = ({ title, icon, children, headerRight }) => (
  <section className="self-start rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white/90 dark:bg-slate-900/80 backdrop-blur-lg p-4 sm:p-6">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
        {icon}
        {title}
      </h2>
      {headerRight && <div className="shrink-0">{headerRight}</div>}
    </div>
    {children}
  </section>
);

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  count: number;
  icon: React.ReactNode;
  label: string;
}> = ({ active, onClick, count, icon, label }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap ${
      active
        ? 'bg-blue-600 text-white shadow-sm'
        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
    }`}
  >
    {icon}
    {label}
    {count > 0 && (
      <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active ? 'bg-white/20' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'}`}>
        {count}
      </span>
    )}
  </button>
);

const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const colors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    teacher: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    student: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  };
  return (
    <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${colors[role] ?? 'bg-slate-100 text-slate-700'}`}>
      {role}
    </span>
  );
};

const RequestCard: React.FC<{ req: BorrowRequest; actions: React.ReactNode }> = ({ req, actions }) => (
  <article className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/60 p-3">
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
            {req.equipment?.name || `Equipment ID ${req.equipment_id}`}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {(req as any).user?.username ? `${(req as any).user.username} • ` : `User ID: ${req.user_id} • `}
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[req.status] ?? ''}`}>
              {req.status}
            </span>
          </p>
          <div className="text-xs text-slate-500 dark:text-slate-500 mt-1 space-y-0.5">
            <p>Requested: {req.request_date ? new Date(req.request_date).toLocaleDateString() : '—'}</p>
            {req.due_date && <p>Due: {new Date(req.due_date).toLocaleDateString()}</p>}
            {req.return_date && <p>Returned: {new Date(req.return_date).toLocaleDateString()}</p>}
            {req.return_condition && <p>Condition on return: <span className="font-semibold capitalize">{req.return_condition}</span></p>}
          </div>
        </div>
      </div>
      {actions}
    </div>
  </article>
);

const EmptyState: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
  <div className="flex flex-col items-center justify-center gap-2 py-8 text-slate-400 dark:text-slate-600">
    {icon}
    <p className="text-sm">{text}</p>
  </div>
);

const Notice: React.FC<{ type: 'success' | 'error'; text: string }> = ({ type, text }) => (
  <div className={`mb-4 rounded-lg border p-3 text-sm font-medium ${
    type === 'success'
      ? 'border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-200'
      : 'border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200'
  }`}>
    {text}
  </div>
);

const SelectRole: React.FC<{ label: string; value: UserRole; onChange: (value: UserRole) => void }> = ({ label, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const options: { value: UserRole; label: string }[] = [
    { value: 'student', label: 'Student' }, { value: 'teacher', label: 'Teacher' }, { value: 'admin', label: 'Admin' },
  ];
  const selectedLabel = options.find(o => o.value === value)?.label || 'Student';

  return (
    <label className="block">
      <span className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{label}</span>
      <div ref={wrapperRef} className="relative">
        <button type="button" onClick={e => { e.stopPropagation(); setOpen(p => !p); }}
          className="w-full rounded-[10px] border-2 border-slate-300 dark:border-slate-600 px-4 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all hover:border-blue-400 focus:outline-none focus:border-blue-500">
          <span className="flex items-center justify-between gap-2">
            <span className="font-medium">{selectedLabel}</span>
            <ChevronDown className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} />
          </span>
        </button>
        {open && (
          <div className="absolute z-40 mt-2 w-full overflow-hidden rounded-xl border border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-900 shadow-xl">
            {options.map(o => (
              <button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false); }}
                className={`block w-full px-4 py-2.5 text-left text-sm font-medium transition ${value === o.value ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200' : 'text-slate-800 dark:text-slate-100 hover:bg-blue-50 dark:hover:bg-slate-800'}`}>
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </label>
  );
};

export default AdminDashboardPage;
