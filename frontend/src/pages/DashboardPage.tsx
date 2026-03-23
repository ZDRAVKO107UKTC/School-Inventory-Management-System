import React, { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Menu, Search, LogOut, Package, History, CalendarClock, Building, ChevronDown, Plus, Trash2, X, Download, ListTodo, Square, MinusCircle, Edit, CheckCircle2, ArchiveX, XCircle, FileJson } from 'lucide-react';
import { ThemeToggle } from '@/components/auth/ThemeToggle';
import { InteractiveBackground } from '@/components/auth/InteractiveBackground';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/authStore';
import { getEquipmentList, getConditionHistory } from '@/services/inventoryService';
import {
  getMyRequests,
  submitBorrowRequest,
  returnBorrowRequest,
  deleteBorrowRequest,
  getAllRequestsAdmin,
  approveRequest,
  rejectRequest
} from '../services/requestService';
import { getFloors, createFloor, deleteFloor, updateFloor, deleteRoom, updateRoom, assignEquipmentToRoom, Floor, Room } from '@/services/spatialService';
import { getUsageReport, getFullHistoryReport, downloadHistoryCSV, resetSystemHistory } from '@/services/reportService';
import {
  getUsersAsAdmin,
  createEquipmentAsAdmin,
  deleteEquipmentAsAdmin,
  createUserAsAdmin,
  deleteUserAsAdmin,
  updateEquipmentAsAdmin,
  updateUserAsAdmin,
  getAdminEquipmentHistory,
  getAdminUserHistory
} from '@/services/adminService';
import type { BorrowRequest, Equipment, User } from '@/types/auth';
import { ParallaxCarousel } from '@/components/ui/ParallaxCarousel';
import { Virtual3DModel } from '@/components/ui/Virtual3DModel';
import { FloorPlanMap } from '@/components/spatial/FloorPlanMap';
import { motion, AnimatePresence } from 'framer-motion';

interface GroupedEquipment extends Equipment {
  totalQuantity: number;
  availableQuantity: number;
  all_items: Equipment[];
}

const fallbackUsageData = [
  { name: 'Microscope Demo', borrowCount: 15 },
  { name: 'MacBook Pro', borrowCount: 12 },
  { name: 'Projector XYZ', borrowCount: 8 },
  { name: 'Tablet Gen 5', borrowCount: 5 },
];

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, token, isAuthenticated, logout } = useAuthStore();

  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    localStorage.getItem('sims_theme') === 'light' ? 'light' : 'dark'
  );

  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [requests, setRequests] = useState<BorrowRequest[] | null>(null);
  const [adminRequests, setAdminRequests] = useState<BorrowRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);

  const [loadingEquipment, setLoadingEquipment] = useState(true);
  const [currentFloorId, setCurrentFloorId] = useState<number | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [isFloorMenuOpen, setIsFloorMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'3d' | 'map'>('3d');
  const [mapMode, setMapMode] = useState<'select' | 'draw'>('select');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<GroupedEquipment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Management Logic
  const [isAssigningMode, setIsAssigningMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAllUnits, setShowAllUnits] = useState(false);
  const [mgmtTab, setMgmtTab] = useState<'spatial' | 'approvals' | 'system' | 'reports'>('spatial');
  const [reportData, setReportData] = useState<{ usage: any[]; history: any[] }>({ usage: [], history: [] });
  const [systemSubTab, setSystemSubTab] = useState<'assets' | 'users' | 'directory'>('assets');

  // Admin System State
  const [newEquipment, setNewEquipment] = useState({ name: '', type: '', condition: 'good' as any, quantity: 1 });
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'student' as any });
  const [mgmSearch, setMgmSearch] = useState('');

  const [editEquipmentModal, setEditEquipmentModal] = useState<Equipment | null>(null);
  const [editUserModal, setEditUserModal] = useState<User | null>(null);
  const [editFloorModal, setEditFloorModal] = useState<Floor | null>(null);
  const [editRoomModal, setEditRoomModal] = useState<Room | null>(null);
  const [isCreateFloorModalOpen, setIsCreateFloorModalOpen] = useState(false);
  const [newFloorName, setNewFloorName] = useState('');
  const [isDeleteFloorModalOpen, setIsDeleteFloorModalOpen] = useState(false);
  const [floorToDeleteId, setFloorToDeleteId] = useState<number | null>(null);
  const [isResetHistoryModalOpen, setIsResetHistoryModalOpen] = useState(false);
  const [conditionHistoryModal, setConditionHistoryModal] = useState<{ id: number; name: string } | null>(null);
  const [historyModal, setHistoryModal] = useState<{ type: 'user' | 'equipment', id: number, title: string } | null>(null);

  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  const isManager = isAdmin || isTeacher;

  useEffect(() => {
    localStorage.setItem('sims_theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const fetchData = async () => {
    if (!token) return;
    try {
      setLoadingEquipment(true);
      const res = await getEquipmentList({ search: searchTerm });
      if (res.success) {
        setEquipment(res.data || []);
      } else setError(res.error || 'Failed to load inventory');

      const reqResult = await getMyRequests(token);
      if (reqResult.success) setRequests(reqResult.data || []);

      const floorResult = await getFloors(token);
      if (floorResult.success && floorResult.data) {
        setFloors(floorResult.data.floors);
        if (!currentFloorId && floorResult.data.floors.length > 0) {
          setCurrentFloorId(floorResult.data.floors[0].id);
        }
      }

      if (isManager) {
        const adminReqResult = await getAllRequestsAdmin(token);
        if (adminReqResult.success && adminReqResult.data?.requests) {
          setAdminRequests(adminReqResult.data.requests);
        }

        if (isAdmin) {
          const [usageResult, usersResult] = await Promise.all([
            getUsageReport(token),
            getUsersAsAdmin(token)
          ]);

          if (usageResult.success && usageResult.data) {
            setReportData(prev => ({ ...prev, usage: (usageResult.data as any).data || [] }));
          }

          getFullHistoryReport(token).then(histRes => {
            if (histRes.success && histRes.data) {
              setReportData(prev => ({ ...prev, history: (histRes.data as any).data || [] }));
            }
          });
          if (usersResult.success && usersResult.data) {
            setUsers(usersResult.data.users);
          }
        }
      }
    } catch {
      setError('A connection error occurred');
    } finally {
      setLoadingEquipment(false);
    }
  };

  const handleEditEquipmentSubmit = async () => {
    if (!editEquipmentModal || !token) return;
    const res = await updateEquipmentAsAdmin(token, editEquipmentModal.id, {
      name: editEquipmentModal.name,
      type: editEquipmentModal.type,
      condition: editEquipmentModal.condition as any,
      quantity: Number(editEquipmentModal.quantity),
      serial_number: editEquipmentModal.serial_number || undefined,
      location: editEquipmentModal.location || undefined,
      photo_url: editEquipmentModal.photo_url || undefined,
    });
    if (res.success) {
      setEditEquipmentModal(null);
      fetchData();
    } else alert(res.error || 'Failed to update equipment');
  };

  const handleEditUserSubmit = async () => {
    if (!editUserModal || !token) return;
    const res = await updateUserAsAdmin(token, editUserModal.id, {
      username: editUserModal.username,
      email: editUserModal.email,
      role: editUserModal.role,
    });
    if (res.success) {
      setEditUserModal(null);
      fetchData();
    } else alert(res.error || 'Failed to update user');
  };

  const handleUpdateFloor = async () => {
    if (!token || !editFloorModal) return;
    const res = await updateFloor(token, editFloorModal.id, { name: editFloorModal.name });
    if (res.success) {
      setEditFloorModal(null);
      fetchData();
    } else alert(res.error || 'Failed to update floor');
  };

  const handleUpdateRoom = async () => {
    if (!token || !editRoomModal) return;
    const res = await updateRoom(token, editRoomModal.id, { name: editRoomModal.name });
    if (res.success) {
      setEditRoomModal(null);
      fetchData();
    } else alert(res.error || 'Failed to update room');
  };

  const onDownloadCSV = () => {
    if (token) downloadHistoryCSV(token);
  };

  const handleResetHistory = async () => {
    if (!token) return;
    setIsResetHistoryModalOpen(true);
  };

  const handleResetHistorySubmit = async () => {
    if (!token) return;
    const res = await resetSystemHistory(token);
    if (res.success) {
      setIsResetHistoryModalOpen(false);
      setMessage('System history has been reset.');
      setTimeout(() => setMessage(null), 3000);
      fetchData();
    } else {
      alert(res.error || "Failed to reset history");
    }
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

  useEffect(() => {
    if (!isAuthenticated || !token) {
      navigate('/auth', { replace: true });
      return;
    }
    fetchData();
  }, [isAuthenticated, navigate, searchTerm, token, selectedRoomId, currentFloorId]);

  const handleCreateFloor = async () => {
    setNewFloorName(`Floor ${floors.length + 1}`);
    setIsCreateFloorModalOpen(true);
  };

  const handleCreateFloorSubmit = async () => {
    if (!token) return;
    const name = newFloorName.trim();
    if (!name) {
      setError('Floor name is required.');
      return;
    }

    const res = await createFloor(token, { name, level: floors.length + 1 });
    if (res.success) {
      setIsCreateFloorModalOpen(false);
      setNewFloorName('');
      setMessage('Floor created successfully.');
      setTimeout(() => setMessage(null), 3000);
      fetchData();
      if (res.data?.floor) setCurrentFloorId(res.data.floor.id);
    } else alert(res.error || 'Failed to create floor');
  };

  const handleApprove = async (id: number) => {
    if (!token) return;
    const res = await approveRequest(token, id);
    if (res.success) {
      alert('Request approved!');
      fetchData();
    } else alert(res.error || 'Failed to approve');
  };

  const handleReject = async (id: number) => {
    if (!token) return;
    const reason = prompt('Reason for rejection (optional):');
    const res = await rejectRequest(token, id, reason || undefined);
    if (res.success) {
      alert('Request rejected.');
      fetchData();
    } else alert(res.error || 'Failed to reject');
  };

  const handleDeleteFloor = async (id: number) => {
    if (!token || !isAdmin) return;
    setFloorToDeleteId(id);
    setIsDeleteFloorModalOpen(true);
  };

  const handleDeleteFloorSubmit = async () => {
    if (!token || !isAdmin || floorToDeleteId == null) return;
    const res = await deleteFloor(token, floorToDeleteId);
    if (res.success) {
      if (currentFloorId === floorToDeleteId) setCurrentFloorId(null);
      setIsDeleteFloorModalOpen(false);
      setFloorToDeleteId(null);
      fetchData();
      setMessage('Floor deleted.');
      setTimeout(() => setMessage(null), 3000);
    } else alert(res.error || 'Failed to delete floor');
  };

  const handleDeleteRoom = async (id: number) => {
    if (!token || !isAdmin) return;
    if (!confirm('Delete this room and unassign all equipment?')) return;
    const res = await deleteRoom(token, id);
    if (res.success) {
      if (selectedRoomId === id) setSelectedRoomId(null);
      fetchData();
    } else alert(res.error || 'Failed to delete room');
  };

  const handleDeleteEquipment = async (id: number) => {
    if (!token || !isAdmin) return;
    if (!confirm('Permanently remove this equipment?')) return;
    const res = await deleteEquipmentAsAdmin(token, id);
    if (res.success) {
      fetchData();
      setMessage('Equipment deleted');
      setTimeout(() => setMessage(null), 3000);
    } else alert(res.error || 'Deletion failed');
  };

  const handleAddUser = async () => {
    if (!token || !isAdmin) return;
    const res = await createUserAsAdmin(token, newUser);
    if (res.success) {
      setNewUser({ username: '', email: '', password: '', role: 'student' });
      fetchData();
      setMessage('User created successfully');
      setTimeout(() => setMessage(null), 3000);
    } else alert(res.error || 'Failed to create user');
  };

  const handleDeleteUser = async (id: number) => {
    if (!token || !isAdmin) return;
    if (id === user?.id) return alert('You cannot delete yourself');
    if (!confirm('Are you sure you want to delete this user?')) return;
    const res = await deleteUserAsAdmin(token, id);
    if (res.success) {
      fetchData();
    } else alert(res.error || 'Failed to delete user');
  };

  const handleAssignEquipment = async (equipmentId: number, roomId: number | null) => {
    if (!token) return;
    const res = await assignEquipmentToRoom(token, equipmentId, roomId);
    if (res.success) {
      setMessage(roomId ? 'Equipment assigned to room!' : 'Equipment removed from room.');
      setIsAssigningMode(false);
      fetchData();
      setTimeout(() => setMessage(null), 3000);
    } else {
      alert(res.error || 'Failed to update assignment');
    }
  };

  const groupedEquipment = useMemo(() => {
    if (requests === null) return [];

    const filteredEquipment = equipment.filter(e => {
      const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase());

      if (selectedRoomId) {
        return matchesSearch && Number(e.room_id) === Number(selectedRoomId);
      }

      if (!showAllUnits && currentFloorId) {
        const floorRooms = floors.find(f => f.id === currentFloorId)?.rooms.map(r => r.id) || [];
        return matchesSearch && e.room_id !== null && floorRooms.includes(Number(e.room_id));
      }

      return matchesSearch;
    });

    const groups: Record<string, any> = {};

    filteredEquipment.forEach(item => {
      const key = `${item.name}-${item.type}`;
      if (!groups[key]) {
        groups[key] = { ...item, totalQuantity: 0, availableQuantity: 0, all_items: [] };
      }
      groups[key].totalQuantity += 1;
      const isRequestedByMe = requests.some(r => r.equipment_id === item.id && r.status === 'pending');
      if (item.status === 'available' && !isRequestedByMe) {
        groups[key].availableQuantity += 1;
        groups[key].id = item.id;
      }
      groups[key].all_items.push(item);
    });
    return Object.values(groups) as GroupedEquipment[];
  }, [equipment, requests, selectedRoomId, showAllUnits, floors, currentFloorId, searchTerm]);

  const usageChartData = reportData.usage.length > 0 ? reportData.usage : fallbackUsageData;

  const onQuickBorrow = async (equipmentId: number) => {
    if (!token) return;
    const now = new Date();
    const due = new Date(now);
    due.setDate(now.getDate() + 7);

    const result = await submitBorrowRequest(token, {
      equipment_id: equipmentId,
      request_date: now.toISOString(),
      due_date: due.toISOString(),
      notes: 'Requested from spatial dashboard',
    });

    if (result.success) {
      fetchData();
    } else {
      setError(result.error || 'Borrow request failed');
    }
  };

  const onReturn = async (requestId: number, condition: 'new' | 'good' | 'fair' | 'damaged' = 'good', notes?: string) => {
    if (!token) return;
    const result = await returnBorrowRequest(token, requestId, { condition, notes: notes || 'Returned by user' });
    if (result.success) fetchData();
    else setError(result.error || 'Return failed');
  };

  const performDelete = async (requestId: number) => {
    if (!token) return;
    const result = await deleteBorrowRequest(token, requestId);
    if (result.success) {
      fetchData();
      setMessage('Request dismissed');
      setTimeout(() => setMessage(null), 3000);
    } else {
      setError(result.error || 'Failed to dismiss request');
      setTimeout(() => setError(null), 5000);
    }
  };

  const onSignOut = async () => {
    await logout();
    navigate('/auth', { replace: true });
  };

  const currentFloor = floors.find(f => f.id === currentFloorId);

  const ManagementPanel = (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-[#f5f5f7] dark:border-[#303030] shrink-0 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Management</h2>
        </div>
        <div className="flex bg-[#f5f5f7] dark:bg-[#1d1d1f] p-1 rounded-xl border border-[#d2d2d7] dark:border-[#303030] shrink-0">
          <button onClick={() => setViewMode('3d')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${viewMode === '3d' ? 'bg-white dark:bg-[#303030] shadow-sm text-[#1d1d1f] dark:text-[#f5f5f7]' : 'text-[#86868b]'}`}>3D View</button>
          <button onClick={() => setViewMode('map')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${viewMode === 'map' ? 'bg-white dark:bg-[#303030] shadow-sm text-[#1d1d1f] dark:text-[#f5f5f7]' : 'text-[#86868b]'}`}>Map View</button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
          <StatPill icon={<Package size={16} />} label="Available gear" value={groupedEquipment.reduce((acc, g) => acc + (g.availableQuantity || 0), 0)} color="bg-emerald-500" />
          <StatPill icon={<History size={16} />} label="My requests" value={requests?.length || 0} color="bg-blue-500" />
          <StatPill icon={<CalendarClock size={16} />} label="Queue status" value={requests ? requests.filter(r => r.status === 'pending').length : 0} color="bg-amber-500" />
        </div>

        <div className="flex p-1 bg-[#f5f5f7] dark:bg-[#1d1d1f] rounded-xl border border-[#d2d2d7] dark:border-[#303030]">
          <button onClick={() => setMgmtTab('spatial')} className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${mgmtTab === 'spatial' ? 'bg-white dark:bg-[#303030] shadow-sm text-[#0066cc]' : 'text-[#86868b]'}`}>Spatial</button>
          <button onClick={() => setMgmtTab('approvals')} className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${mgmtTab === 'approvals' ? 'bg-white dark:bg-[#303030] shadow-sm text-[#0066cc]' : 'text-[#86868b]'}`}>Approvals</button>
          <button onClick={() => setMgmtTab('reports')} className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${mgmtTab === 'reports' ? 'bg-white dark:bg-[#303030] shadow-sm text-[#0066cc]' : 'text-[#86868b]'}`}>Reports</button>
          {isAdmin && <button onClick={() => setMgmtTab('system')} className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${mgmtTab === 'system' ? 'bg-white dark:bg-[#303030] shadow-sm text-[#0066cc]' : 'text-[#86868b]'}`}>Global</button>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6">
        {mgmtTab === 'spatial' && (
          <div className="space-y-8">

            <div className="space-y-2">
              {floors.map(floor => (
                <div key={floor.id} className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all ${currentFloorId === floor.id ? 'bg-[#0066cc] text-white shadow-lg' : 'bg-[#f5f5f7] dark:bg-[#1d1d1f] text-[#1d1d1f] dark:text-[#f5f5f7]'}`}>
                  <button onClick={() => { setCurrentFloorId(floor.id); setSelectedRoomId(null); }} className="flex-1 text-left">
                    <span className="text-xs font-bold uppercase">{floor.name}</span>
                  </button>
                  <div className="flex gap-1">
                    <button onClick={() => setEditFloorModal(floor)} className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                      <Edit size={12} />
                    </button>
                    <button onClick={() => { setCurrentFloorId(floor.id); setSelectedRoomId(null); }} className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                      <Building size={14} />
                    </button>
                    {isAdmin && (
                      <button onClick={() => handleDeleteFloor(floor.id)} className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-500 transition-colors">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {isAdmin && (
                <button onClick={handleCreateFloor} className="w-full py-3 border-2 border-dashed border-[#d2d2d7] dark:border-[#303030] rounded-xl flex items-center justify-center gap-2 text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7] hover:border-[#86868b] transition-all text-[9px] font-black uppercase tracking-widest">
                  <Plus size={14} /> New Floor
                </button>
              )}
            </div>

            {selectedRoomId && (
              <section className="space-y-4 pt-4 border-t border-[#f5f5f7] dark:border-[#303030]">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase font-black tracking-widest text-[#86868b]">Active Zone</p>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 bg-[#0066cc]/10 text-[#0066cc] rounded-full text-[9px] font-black uppercase flex items-center gap-2">
                      {currentFloor?.rooms.find(r => r.id === selectedRoomId)?.name}
                      <button onClick={() => setEditRoomModal(currentFloor?.rooms.find(r => r.id === selectedRoomId) || null)} className="hover:scale-110"><Edit size={10} /></button>
                    </span>
                    {isAdmin && (
                      <button onClick={() => handleDeleteRoom(selectedRoomId)} className="text-rose-500 hover:scale-110 transition-transform">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                  {equipment.filter(e => e.room_id !== null && Number(e.room_id) === Number(selectedRoomId)).map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-[#f5f5f7] dark:bg-[#1d1d1f] rounded-xl border border-[#d2d2d7] dark:border-[#303030]">
                      <div>
                        <p className="text-[11px] font-bold dark:text-white uppercase">{item.name}</p>
                        <p className="text-[8px] text-[#86868b] font-medium">{item.serial_number || 'No S/N'}</p>
                      </div>
                      <button onClick={() => handleAssignEquipment(item.id, null)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                        <MinusCircle size={14} />
                      </button>
                    </div>
                  ))}
                  {equipment.filter(e => e.room_id !== null && Number(e.room_id) === Number(selectedRoomId)).length === 0 && (
                    <p className="text-[10px] italic text-[#86868b] text-center py-4 bg-[#f5f5f7] dark:bg-[#1d1d1f] rounded-xl">Empty room.</p>
                  )}
                </div>

                <div className="pt-2 border-t border-[#f5f5f7] dark:border-[#303030]">
                  <button
                    onClick={() => setIsAssigningMode(!isAssigningMode)}
                    className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wider transition-all ${isAssigningMode ? 'bg-[#1d1d1f] text-white dark:bg-[#f5f5f7] dark:text-[#1d1d1f]' : 'bg-white dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-[#f5f5f7] border border-[#d2d2d7] dark:border-[#303030] shadow-sm'}`}
                  >
                    <Package size={14} /> {isAssigningMode ? 'Cancel Selection' : 'Assign Unit to Room'}
                  </button>

                  <AnimatePresence>
                    {isAssigningMode && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-4 space-y-2">
                        <p className="text-[9px] font-bold text-[#86868b] mb-2 uppercase">Available for Assignment:</p>
                        <div className="space-y-1 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                          {equipment.filter(e => e.status === 'available' && (e.room_id === null || Number(e.room_id) !== Number(selectedRoomId))).map(item => (
                            <button key={item.id} onClick={() => handleAssignEquipment(item.id, selectedRoomId)} className="w-full flex items-center justify-between p-2 rounded-lg bg-white dark:bg-[#2c2c2e] border border-[#f5f5f7] dark:border-[#303030] hover:border-[#0066cc] transition-all group text-left">
                              <span className="text-[10px] font-bold dark:text-white truncate">{item.name}</span>
                              <span className="text-[8px] opacity-0 group-hover:opacity-100 transition-opacity text-[#0066cc] font-black uppercase shrink-0 ml-2">Assign</span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </section>
            )}
          </div>
        )}

        {mgmtTab === 'approvals' && (
          <div className="space-y-4">
            <p className="text-[10px] uppercase font-black tracking-widest text-[#86868b]">Claim Requests</p>
            {adminRequests.filter(r => r.status === 'pending').length === 0 ? (
              <div className="p-10 rounded-3xl border-2 border-dashed border-[#d2d2d7] dark:border-[#303030] flex flex-col items-center justify-center opacity-40">
                <ListTodo size={32} className="mb-2" />
                <p className="text-[10px] font-bold uppercase tracking-wider">Queue Clear</p>
              </div>
            ) : (
              adminRequests.filter(r => r.status === 'pending').map(request => (
                <div key={request.id} className="p-4 bg-white dark:bg-[#1d1d1f] rounded-2xl border border-[#d2d2d7] dark:border-[#303030] shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-xs font-black uppercase truncate">{request.equipment?.name || 'Unknown Unit'}</h4>
                    <span className="text-[8px] font-black px-1.5 py-0.5 bg-amber-500/10 text-amber-600 rounded-full">PENDING</span>
                  </div>
                  <div className="space-y-1 mb-4">
                    <p className="text-[10px] font-medium text-[#86868b]">User ID: <span className="font-bold text-[#1d1d1f] dark:text-[#f5f5f7]">{request.user_id}</span></p>
                    {request.equipment?.room && (
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-[#0066cc] uppercase">
                        <Building size={10} /> Location: {request.equipment.room.name}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(request.id)} className="flex-1 py-2 bg-emerald-500/10 text-emerald-600 text-[9px] font-black uppercase rounded-lg hover:bg-emerald-500 hover:text-white transition-all">Approve</button>
                    <button onClick={() => handleReject(request.id)} className="flex-1 py-2 bg-rose-500/10 text-rose-600 text-[9px] font-black uppercase rounded-lg hover:bg-rose-500 hover:text-white transition-all">Reject</button>
                  </div>
                </div>
              ))
            )}

            <section className="mt-12 pt-8 border-t border-[#f5f5f7] dark:border-[#303030]">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#86868b] mb-4">My Personal Claims</p>
              <div className="flex flex-col gap-4">
                {requests && requests.length > 0 ? (
                  requests.map(r => (
                    <RequestCard key={r.id} request={r} onReturn={onReturn} onDelete={performDelete} />
                  ))
                ) : (
                  <div className="p-8 rounded-[22px] border-2 border-dashed border-[#d2d2d7] dark:border-[#303030] text-center opacity-40">
                    <p className="text-[9px] font-bold uppercase tracking-widest">No personal gear claimed</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {mgmtTab === 'system' && isAdmin && (
          <div className="space-y-6 pb-12">
            <div className="flex p-1 bg-[#f5f5f7] dark:bg-[#1d1d1f] rounded-xl border border-[#d2d2d7] dark:border-[#303030] mb-4">
              <button onClick={() => setSystemSubTab('assets')} className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${systemSubTab === 'assets' ? 'bg-white dark:bg-[#303030] shadow-sm text-[#0066cc]' : 'text-[#86868b]'}`}>Assets</button>
              <button onClick={() => setSystemSubTab('users')} className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${systemSubTab === 'users' ? 'bg-white dark:bg-[#303030] shadow-sm text-[#0066cc]' : 'text-[#86868b]'}`}>Users</button>
              <button onClick={() => setSystemSubTab('directory')} className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${systemSubTab === 'directory' ? 'bg-white dark:bg-[#303030] shadow-sm text-[#0066cc]' : 'text-[#86868b]'}`}>Directory</button>
            </div>

            {systemSubTab === 'assets' && (
              <section className="space-y-4">
                <p className="text-[10px] uppercase font-black tracking-widest text-[#86868b]">Add Asset</p>
                <div className="space-y-2 p-4 bg-[#f5f5f7] dark:bg-[#1d1d1f] rounded-2xl border border-[#d2d2d7] dark:border-[#303030]">
                  <Input className="text-[11px] h-10 rounded-xl bg-white dark:bg-[#2c2c2e]" placeholder="Equipment Name" value={newEquipment.name} onChange={e => setNewEquipment(p => ({ ...p, name: e.target.value }))} />
                  <div className="flex gap-2">
                    <Input className="flex-1 text-[11px] h-10 rounded-xl bg-white dark:bg-[#2c2c2e]" placeholder="Type" value={newEquipment.type} onChange={e => setNewEquipment(p => ({ ...p, type: e.target.value }))} />
                    <Input className="w-20 text-[11px] h-10 rounded-xl bg-white dark:bg-[#2c2c2e]" type="number" value={newEquipment.quantity} onChange={e => setNewEquipment(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))} />
                  </div>
                  <Button className="w-full text-[9px] font-black py-4 uppercase tracking-widest bg-[#0066cc]" onClick={async () => {
                    if (!token) return;
                    const res = await createEquipmentAsAdmin(token, newEquipment);
                    if (res.success) {
                      setMessage('Asset created!');
                      setNewEquipment({ name: '', type: '', condition: 'good' as any, quantity: 1 });
                      fetchData();
                      setTimeout(() => setMessage(null), 3000);
                    } else alert(res.error);
                  }}>Register Units</Button>
                </div>
              </section>
            )}

            {systemSubTab === 'users' && (
              <section className="space-y-4">
                <p className="text-[10px] uppercase font-black tracking-widest text-[#86868b]">New User</p>
                <div className="space-y-2 p-4 bg-[#f5f5f7] dark:bg-[#1d1d1f] rounded-2xl border border-[#d2d2d7] dark:border-[#303030]">
                  <Input className="text-[11px] h-10 rounded-xl bg-white dark:bg-[#2c2c2e]" placeholder="Username" value={newUser.username} onChange={e => setNewUser(p => ({ ...p, username: e.target.value }))} />
                  <Input className="text-[11px] h-10 rounded-xl bg-white dark:bg-[#2c2c2e]" placeholder="Email" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} />
                  <Input className="text-[11px] h-10 rounded-xl bg-white dark:bg-[#2c2c2e]" type="password" placeholder="Password" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} />
                  <select className="w-full text-[11px] h-10 rounded-xl bg-white dark:bg-[#2c2c2e] px-3 border-transparent" value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value as any }))}>
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                  <Button className="w-full text-[9px] font-black py-4 uppercase tracking-widest" onClick={handleAddUser}>Create User Account</Button>
                </div>
              </section>
            )}

            {systemSubTab === 'directory' && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase font-black tracking-widest text-[#86868b]">Global Directory</p>
                  <div className="flex gap-4 relative">
                    <button onClick={() => setMgmSearch('')} className={`text-[9px] uppercase font-black tracking-widest transition-all ${mgmSearch === '' ? 'text-[#0066cc]' : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'}`}>Users</button>
                    <button onClick={() => setMgmSearch('equip')} className={`text-[9px] uppercase font-black tracking-widest transition-all ${mgmSearch === 'equip' ? 'text-[#0066cc]' : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'}`}>Gear</button>
                    <div className={`absolute -bottom-1 h-0.5 bg-[#0066cc] transition-all duration-300 ${mgmSearch === '' ? 'left-0 w-8' : 'left-11 w-7'}`} />
                  </div>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {mgmSearch === 'equip' ? (
                    equipment.map(e => (
                      <div key={e.id} className="p-3 bg-white dark:bg-[#1d1d1f] rounded-xl border border-[#d2d2d7] dark:border-[#303030] flex items-center justify-between group">
                        <div className="truncate">
                          <p className="text-[10px] font-bold uppercase truncate">{e.name}</p>
                          <p className="text-[8px] text-[#86868b]">{e.serial_number || e.type}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setEditEquipmentModal(e)} className="p-2 text-[#0066cc] bg-blue-50 dark:bg-blue-500/10 rounded-lg hover:scale-110 transition-all" title="Edit Info">
                            <Edit size={14} />
                          </button>
                          <button onClick={() => setConditionHistoryModal({ id: e.id, name: e.name })} className="p-2 text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg hover:scale-110 transition-all" title="Condition Log">
                            <FileJson size={14} />
                          </button>
                          <button onClick={() => setHistoryModal({ type: 'equipment', id: e.id, title: e.name })} className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg hover:scale-110 transition-all" title="Borrow History">
                            <History size={14} />
                          </button>
                          <button onClick={() => handleDeleteEquipment(e.id)} className="p-2 text-rose-600 bg-rose-50 dark:bg-rose-500/10 rounded-lg hover:scale-110 transition-all" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    users.map(u => (
                      <div key={u.id} className="p-3 bg-white dark:bg-[#1d1d1f] rounded-xl border border-[#d2d2d7] dark:border-[#303030] flex items-center justify-between group">
                        <div className="truncate">
                          <p className="text-[10px] font-bold uppercase truncate">{u.username}</p>
                          <p className="text-[8px] text-[#86868b] italic">{u.email}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setEditUserModal(u)} className="p-2 text-[#0066cc] bg-blue-50 dark:bg-blue-500/10 rounded-lg hover:scale-110 transition-all" title="Edit">
                            <Edit size={14} />
                          </button>
                          <button onClick={() => setHistoryModal({ type: 'user', id: u.id, title: u.username })} className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg hover:scale-110 transition-all" title="History">
                            <History size={14} />
                          </button>
                          {u.id !== user?.id && (
                            <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-rose-600 bg-rose-50 dark:bg-rose-500/10 rounded-lg hover:scale-110 transition-all" title="Delete">
                              <Trash2 size={14} />
                            </button>
                          )}
                          <span className={`w-14 text-center py-0.5 rounded-full text-[7px] font-black uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>{u.role}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            )}
          </div>
        )}

        {mgmtTab === 'reports' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase font-black tracking-widest text-[#86868b]">Usage Analytics</p>
              <button
                onClick={() => {
                  const eqSheet = XLSX.utils.json_to_sheet(equipment.map(e => ({
                    'ID': e.id, 'Name': e.name, 'Type': e.type,
                    'Serial #': e.serial_number || '', 'Location': e.location || '',
                    'Condition': e.condition, 'Status': e.status, 'Qty': e.quantity,
                  })));
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, eqSheet, 'Inventory');
                  XLSX.writeFile(wb, `inventory-${new Date().toISOString().slice(0, 10)}.xlsx`);
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#0066cc] text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:shadow-lg transition-all"
              >
                <Download size={12} /> Export XLSX
              </button>
            </div>

            <div className="h-[240px] w-full bg-white dark:bg-[#1d1d1f] p-4 rounded-2xl border border-[#d2d2d7] dark:border-[#303030]">
              {usageChartData.length > 0 ? (
                <ResponsiveContainer width="99%" height={200}>
                  <BarChart data={usageChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#86868b', fontWeight: 'bold' }} width={100} />
                    <Tooltip
                      cursor={{ fill: 'transparent' }}
                      itemStyle={{ color: '#0066cc', fontWeight: 'bold' }}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #d2d2d7', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="borrowCount" radius={[0, 4, 4, 0]} barSize={12}>
                      {usageChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#0066cc' : '#5e5e66'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : null}
            </div>

            <div className="space-y-4 pt-4 border-t border-[#f5f5f7] dark:border-[#303030]">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase font-black tracking-widest text-[#86868b]">Full System Logs</p>
                <div className="flex items-center gap-4">
                  <button onClick={onDownloadCSV} className="text-[9px] font-black uppercase text-[#0066cc] hover:underline">Download CSV</button>
                  <button onClick={handleResetHistory} className="text-[9px] font-black uppercase text-rose-500 hover:underline">Reset Data</button>
                </div>
              </div>
              <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                {reportData.history.length > 0 ? reportData.history.map((log: any, i: number) => (
                  <div key={i} className="p-3 bg-white dark:bg-black/20 rounded-xl border border-[#d2d2d7] dark:border-[#303030] flex justify-between items-center group">
                    <div>
                      <p className="text-[10px] font-black uppercase text-[#1d1d1f] dark:text-white">
                        {log.user} <span className="text-[#86868b] mx-1">•</span> {log.equipment}
                      </p>
                      <p className="text-[8px] text-[#86868b]">{log.request_date.split('T')[0]}</p>
                    </div>
                    <span className={`text-[8px] font-black uppercase ${log.status === 'approved' ? 'text-emerald-500' : 'text-blue-500'}`}>{log.status}</span>
                  </div>
                )) : (
                  <div className="py-12 flex flex-col items-center justify-center opacity-40">
                    <History size={24} className="mb-2" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-center">No system activity recorded today</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const UserOverviewPanel = (
    <div className="h-full flex flex-col p-6 gap-8">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 underline decoration-[#0066cc] decoration-4 underline-offset-8">My Space</h2>

      <div className="flex bg-[#f5f5f7] dark:bg-[#1d1d1f] p-1 rounded-xl border border-[#d2d2d7] dark:border-[#303030] shrink-0">
        <button onClick={() => setViewMode('3d')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${viewMode === '3d' ? 'bg-white dark:bg-[#303030] shadow-sm text-[#1d1d1f] dark:text-[#f5f5f7]' : 'text-[#86868b]'}`}>3D View</button>
        <button onClick={() => setViewMode('map')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${viewMode === 'map' ? 'bg-white dark:bg-[#303030] shadow-sm text-[#1d1d1f] dark:text-[#f5f5f7]' : 'text-[#86868b]'}`}>Map View</button>
      </div>

      <div className="flex flex-col gap-3">
        <StatPill icon={<Package size={18} />} label="Available gear" value={groupedEquipment.reduce((acc, g) => acc + (g.availableQuantity || 0), 0)} color="bg-emerald-500" />
        <StatPill icon={<History size={18} />} label="My requests" value={requests?.length || 0} color="bg-blue-500" />
        <StatPill icon={<CalendarClock size={18} />} label="Queue status" value={requests ? requests.filter(r => r.status === 'pending').length : 0} color="bg-amber-500" />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mt-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#86868b] mb-4">Current Claims</p>
        <div className="flex flex-col gap-4">
          {requests && requests.length > 0 ? (
            requests.map(r => (
              <RequestCard key={r.id} request={r} onReturn={onReturn} onDelete={performDelete} />
            ))
          ) : (
            <div className="p-8 rounded-[25px] border-2 border-dashed border-[#d2d2d7] dark:border-[#303030] text-center opacity-40">
              <p className="text-[9px] font-bold uppercase tracking-widest">No gear claimed</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={theme === 'dark' ? 'dark' : 'light'}>
      <div className="min-h-screen relative overflow-hidden bg-[#f5f5f7] dark:bg-[#000000] transition-colors duration-500">
        <InteractiveBackground theme={theme} />

        <div
          className={`relative z-10 w-full h-screen flex flex-col pt-4 sm:pt-8 pb-4 px-4 sm:px-8 transition-all duration-500 ease-in-out ${isSidebarCollapsed ? 'lg:pr-[88px]' : 'lg:pr-[344px] xl:pr-[444px]'
            }`}
        >
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden fixed top-6 right-6 z-[70] p-3 bg-white dark:bg-[#1d1d1f] rounded-2xl border border-[#d2d2d7] dark:border-[#303030] shadow-xl text-[#1d1d1f] dark:text-[#f5f5f7] active:scale-95 transition-all"
          >
            <Menu size={20} />
          </button>
          <div className="flex flex-col gap-6 sm:gap-8 mb-8 sm:mb-12 shrink-0 relative z-50 w-full">
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-5xl font-black text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight leading-tight">
                School <span className="text-[#0066cc]">Lobby</span>
              </h1>
              <p className="text-xs sm:text-base text-slate-500 font-medium pb-2 border-b border-[#d2d2d7] dark:border-[#303030]">
                Welcome, <span className="text-[#1d1d1f] dark:text-[#f5f5f7] font-bold">{user?.username}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full pr-12 lg:pr-0">
              <ThemeToggle defaultTheme={theme} onThemeChange={(t) => setTheme(t)} />

              <button
                onClick={() => setViewMode(viewMode === '3d' ? 'map' : '3d')}
                className="flex items-center justify-center px-4 sm:px-6 h-10 bg-white dark:bg-[#1d1d1f] rounded-full border border-[#d2d2d7] dark:border-[#303030] shadow-sm hover:shadow-md hover:border-[#0066cc] transition-all font-black text-[8px] sm:text-[9px] uppercase tracking-wider sm:tracking-[0.2em]"
              >
                {viewMode === '3d' ? 'Floor Plan' : '3D Orbit'}
              </button>

              <div className="relative flex-1 min-w-[150px] sm:flex-none sm:w-64">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86868b] pointer-events-none">
                  <Search size={14} />
                </div>
                <input
                  type="text"
                  placeholder="Search gear..."
                  className="w-full pl-10 pr-4 h-10 rounded-full bg-[#f5f5f7] dark:bg-[#1d1d1f] border-transparent focus:bg-white dark:focus:bg-[#161617] text-xs transition-all focus:ring-2 focus:ring-[#0066cc]/20 outline-none"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-2 px-2 shrink-0">
            <div className="flex items-center gap-2">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-[#86868b]">
                {showAllUnits ? 'Global School Assets' : `${currentFloor?.name || 'Current'} Floor Inventory`}
              </h2>
              <button
                onClick={() => setShowAllUnits(!showAllUnits)}
                className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter transition-all shadow-sm ${showAllUnits ? 'bg-[#0066cc] text-white' : 'bg-white dark:bg-[#1d1d1f] text-[#86868b] border border-[#d2d2d7] dark:border-[#303030]'}`}
              >
                {showAllUnits ? 'Showing Global' : 'Show All Units'}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="mx-4 mb-4 p-4 rounded-2xl border border-red-300 bg-red-50 text-red-700 dark:bg-red-900/20 dark:border-red-700 dark:text-red-200 text-xs font-bold uppercase shadow-sm">{error}</motion.div>
            )}
            {message && (
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="mx-4 mb-4 p-3 bg-[#0066cc]/10 text-[#0066cc] border border-[#0066cc]/20 rounded-xl text-center text-xs font-bold uppercase tracking-widest">{message}</motion.div>
            )}
          </AnimatePresence>

          <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
            <AnimatePresence mode="wait">
              {viewMode === '3d' ? (
                <motion.div key="3d" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="flex-1 flex flex-col h-full">
                  {loadingEquipment ? (
                    <div className="flex-1 flex items-center justify-center"><div className="w-12 h-12 border-4 border-[#0066cc] border-t-transparent rounded-full animate-spin" /></div>
                  ) : groupedEquipment.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-40"><Package size={80} className="mb-4" /><p className="text-xl font-bold">No gear in this orbit.</p></div>
                  ) : (
                    <ParallaxCarousel items={groupedEquipment} onExpand={item => setSelectedItem(item as GroupedEquipment)} />
                  )}
                </motion.div>
              ) : (
                <motion.div key="map" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex-1 flex flex-col gap-6 max-w-6xl mx-auto w-full px-2 lg:px-4">
                  <div className="flex items-center justify-between">
                    <div className="relative">
                      <button onClick={() => setIsFloorMenuOpen(!isFloorMenuOpen)} className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-[#1d1d1f] rounded-full border border-[#d2d2d7] dark:border-[#303030] shadow-sm hover:shadow-md font-semibold text-sm">
                        <Building size={16} className="text-[#86868b]" /> {currentFloor?.name || 'Floors'} <ChevronDown size={14} className={isFloorMenuOpen ? 'rotate-180' : ''} />
                      </button>
                      {isFloorMenuOpen && (
                        <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-[#1d1d1f] border border-[#d2d2d7] dark:border-[#303030] rounded-2xl shadow-xl z-50 overflow-hidden">
                          {floors.map(f => (<button key={f.id} onClick={() => { setCurrentFloorId(f.id); setSelectedRoomId(null); setIsFloorMenuOpen(false); }} className="w-full px-5 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold border-b last:border-0 border-[#f5f5f7] dark:border-[#303030]">{f.name}</button>))}
                          {isAdmin && (
                            <button onClick={handleCreateFloor} className="w-full px-5 py-3 text-left text-[#0066cc] text-[10px] font-black uppercase hover:bg-blue-50 transition-colors">
                              + Add Floor
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    {selectedRoomId && (
                      <div className="flex items-center gap-2">
                        {isAdmin && (
                          <button
                            onClick={() => setMapMode(mapMode === 'select' ? 'draw' : 'select')}
                            className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${mapMode === 'draw' ? 'bg-[#0066cc] text-white' : 'bg-white dark:bg-[#2c2c2e] text-[#86868b] border border-[#d2d2d7] dark:border-[#303030]'}`}
                          >
                            {mapMode === 'draw' ? 'Drawing Active' : 'Draw Room'}
                          </button>
                        )}
                        <button onClick={() => setSelectedRoomId(null)} className="flex items-center gap-2 bg-[#1d1d1f] dark:bg-[#f5f5f7] px-4 py-2 rounded-full text-white dark:text-[#1d1d1f] text-[10px] font-black uppercase tracking-widest shadow-lg">
                          Zone: {currentFloor?.rooms.find(r => r.id === selectedRoomId)?.name} <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 bg-white/50 dark:bg-black/20 rounded-[40px] border border-[#d2d2d7] dark:border-[#303030] overflow-hidden backdrop-blur-sm relative">
                    <FloorPlanMap
                      floorId={currentFloorId || 0}
                      rooms={currentFloor?.rooms || []}
                      isAdmin={isAdmin}
                      token={token!}
                      onRoomSelect={setSelectedRoomId}
                      selectedRoomId={selectedRoomId}
                      onRefresh={fetchData}
                      mode={mapMode}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>


        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-md z-[55]"
            />
          )}
        </AnimatePresence>

        <aside
          className={`fixed top-0 bottom-0 right-0 lg:top-6 lg:bottom-6 lg:right-6 bg-white/95 dark:bg-[#1d1d1f]/95 backdrop-blur-2xl border-l lg:border border-[#d2d2d7] dark:border-[#303030] lg:rounded-[32px] shadow-2xl z-[60] lg:z-30 transition-all duration-500 ease-in-out 
            ${isSidebarCollapsed ? 'lg:w-[64px]' : 'lg:w-[320px] xl:w-[400px]'}
            ${isMobileMenuOpen ? 'w-[320px] translate-x-0' : 'w-[320px] translate-x-full lg:translate-x-0'}
          `}
        >
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden lg:flex absolute -left-3 top-12 z-[60] items-center justify-center w-6 h-6 bg-white dark:bg-[#2c2c2e] border border-[#d2d2d7] dark:border-[#303030] rounded-full shadow-md hover:scale-110 transition-transform"
          >
            <ChevronDown size={14} className={`text-[#86868b] transition-transform duration-500 ${isSidebarCollapsed ? 'rotate-90' : '-rotate-90'}`} />
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden absolute left-4 top-6 z-[70] p-2 text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white transition-colors"
          >
            <X size={20} />
          </button>

          <div className="h-full flex flex-col relative overflow-hidden lg:rounded-[32px] pt-14 lg:pt-0">
            {(!isSidebarCollapsed || isMobileMenuOpen) && (
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-hidden">
                  {isManager ? ManagementPanel : UserOverviewPanel}
                </div>

                <div className="p-6 border-t border-[#f5f5f7] dark:border-[#303030] bg-[#fcfcfd] dark:bg-black/10">
                  <button
                    onClick={onSignOut}
                    className="w-full h-12 flex items-center gap-3 px-4 rounded-2xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all font-black text-[10px] uppercase tracking-widest border border-[#d2d2d7] dark:border-[#303030] shadow-sm active:scale-95"
                  >
                    <LogOut size={18} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}

            {isSidebarCollapsed && !isMobileMenuOpen && (
              <div className="flex flex-col items-center py-12 gap-8 h-full">
                <div className="w-8 h-8 rounded-full bg-[#0066cc] flex items-center justify-center text-white text-[10px] font-black">{user?.username[0].toUpperCase()}</div>
                <div className="flex-1 flex flex-col gap-6 items-center">
                  <button onClick={() => { setIsSidebarCollapsed(false); setMgmtTab('spatial'); }} className="p-2 rounded-xl text-[#0066cc] hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"><Building size={20} /></button>
                  <button onClick={() => { setIsSidebarCollapsed(false); setMgmtTab('approvals'); }} className="p-2 rounded-xl text-[#86868b] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"><ListTodo size={20} /></button>
                  {isAdmin && <button onClick={() => { setIsSidebarCollapsed(false); setMgmtTab('system'); }} className="p-2 rounded-xl text-[#86868b] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"><Square size={20} /></button>}
                </div>
                <button onClick={onSignOut} className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"><LogOut size={20} /></button>
              </div>
            )}
          </div>
        </aside>

        {/* Product Expand Modal */}
        <AnimatePresence>
          {selectedItem && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-20">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedItem(null)} className="fixed inset-0 bg-black/80 backdrop-blur-xl" />
              <motion.div layoutId={`card-${selectedItem.id}`} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-5xl bg-white dark:bg-[#1d1d1f] rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-[#d2d2d7] dark:border-[#303030]">
                <button onClick={() => setSelectedItem(null)} className="absolute top-6 right-6 z-10 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={24} /></button>
                <div className="w-full md:w-1/2 bg-[#f5f5f7] dark:bg-black p-12 flex items-center justify-center"><Virtual3DModel type={selectedItem.type} quantity={selectedItem.totalQuantity || 1} isExpanded /></div>
                <div className="w-full md:w-1/2 p-12 flex flex-col">
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#86868b] mb-4">Specifications</p>
                  <h2 className="text-4xl font-bold mb-8">{selectedItem.name}</h2>
                  <div className="grid grid-cols-2 gap-8 mb-12">
                    <div><p className="text-[9px] uppercase font-bold text-[#86868b] mb-1">Asset ID</p><p className="font-mono text-sm">{selectedItem.serial_number || 'N/A'}</p></div>
                    <div><p className="text-[9px] uppercase font-bold text-[#86868b] mb-1">Type</p><p className="text-sm">{selectedItem.type}</p></div>
                    <div><p className="text-[9px] uppercase font-bold text-[#86868b] mb-1">Status</p><p className="text-sm uppercase font-black">{selectedItem.status}</p></div>
                    <div><p className="text-[9px] uppercase font-bold text-[#86868b] mb-1">Availability</p><p className="text-sm font-bold">{selectedItem.availableQuantity} / {selectedItem.totalQuantity}</p></div>
                  </div>
                  <Button className="mt-auto w-full py-8 rounded-[25px] text-xs font-black uppercase tracking-[0.2em]" onClick={() => { if (selectedItem) onQuickBorrow(selectedItem.id); setSelectedItem(null); }} disabled={selectedItem.status !== 'available' || (selectedItem.availableQuantity || 0) <= 0}>Process Claim</Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
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
                <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
              ) : historyData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
                  <ArchiveX className="w-10 h-10 opacity-50" />
                  <p className="text-sm font-semibold uppercase tracking-widest">No history recorded</p>
                </div>
              ) : (
                historyData.map((log: any, i) => (
                  <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 flex items-center gap-1 rounded-md text-[10px] font-black uppercase ${log.status ? (log.status === 'borrowed' ? 'bg-amber-100 text-amber-700' : log.status === 'returned' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700') : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                        {log.status || log.condition || 'Activity'}
                      </span>
                      <span className="text-xs text-slate-500 font-semibold">{new Date(log.request_date || log.recorded_at || log.created_at).toLocaleString()}</span>
                    </div>
                    {historyModal.type === 'equipment' ? (
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        <span className="font-semibold text-slate-900 dark:text-white">User:</span> {log.user?.username || log.user_id || 'Unknown'}
                        {log.quantity && ` • Qty: ${log.quantity}`}
                        {log.notes && log.notes !== 'Requested from dashboard' && ` • Notes: ${log.notes}`}
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

      {editUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setEditUserModal(null)}>
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black uppercase tracking-widest text-[#1d1d1f] dark:text-white">Edit User Account</h3>
              <button onClick={() => setEditUserModal(null)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition"><XCircle size={20} /></button>
            </div>
            <div className="space-y-4">
              <Input label="Username" value={editUserModal.username} onChange={e => setEditUserModal({ ...editUserModal, username: e.target.value })} />
              <Input label="Email" value={editUserModal.email} onChange={e => setEditUserModal({ ...editUserModal, email: e.target.value })} />
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-[#86868b] tracking-widest ml-1">Access Level</p>
                <select
                  value={editUserModal.role}
                  onChange={e => setEditUserModal({ ...editUserModal, role: e.target.value as any })}
                  className="w-full h-12 px-4 rounded-[10px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-5 mt-4 border-t border-slate-100 dark:border-slate-800">
              <Button className="flex-1" variant="secondary" onClick={() => setEditUserModal(null)}>Cancel</Button>
              <Button className="flex-1" onClick={handleEditUserSubmit} icon={<CheckCircle2 className="w-4 h-4" />}>Save User</Button>
            </div>
          </div>
        </div>
      )}

      {editFloorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setEditFloorModal(null)}>
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-black uppercase tracking-widest mb-5">Edit Floor Name</h3>
            <Input label="Floor Name" value={editFloorModal.name} onChange={e => setEditFloorModal({ ...editFloorModal, name: e.target.value })} />
            <div className="flex gap-3 pt-5 mt-4 border-t">
              <Button className="flex-1" variant="secondary" onClick={() => setEditFloorModal(null)}>Cancel</Button>
              <Button className="flex-1" onClick={handleUpdateFloor}>Update Name</Button>
            </div>
          </div>
        </div>
      )}

      {isCreateFloorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-md p-4" onClick={() => setIsCreateFloorModalOpen(false)}>
          <div
            className="w-full max-w-md rounded-3xl border border-[#8fb0ff]/45 dark:border-[#3a5aa8]/55 bg-gradient-to-br from-[#f8fbff]/98 via-[#eef4ff]/96 to-[#e7f0ff]/94 dark:from-[#08142e]/98 dark:via-[#0a1a3d]/96 dark:to-[#0d2458]/94 shadow-[0_24px_70px_-28px_rgba(11,39,96,0.85)] p-6 sm:p-7"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-4">
              <h3 className="font-black uppercase tracking-[0.16em] text-3xl text-[#1d1d1f] dark:text-[#e9eefc]">Create Floor</h3>
              <p className="mt-1 text-sm text-[#415a8b] dark:text-[#a7b8e8]">Add a new level to the spatial map.</p>
            </div>

            <Input
              label="Floor Name"
              value={newFloorName}
              onChange={e => setNewFloorName(e.target.value)}
              placeholder="e.g., Floor 1"
            />

            <div className="flex gap-3 pt-5 mt-5 border-t border-[#5f79bc]/35">
              <Button
                className="flex-1 h-12 !rounded-xl !font-black !tracking-wide !text-[#1d1d1f] dark:!text-[#e9eefc]"
                variant="secondary"
                onClick={() => setIsCreateFloorModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-12 !rounded-xl !font-black !tracking-wide !bg-[#0066cc] hover:!bg-[#0b73e8] !text-white"
                onClick={handleCreateFloorSubmit}
              >
                Create Floor
              </Button>
            </div>
          </div>
        </div>
      )}

      {isDeleteFloorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-md p-4" onClick={() => { setIsDeleteFloorModalOpen(false); setFloorToDeleteId(null); }}>
          <div
            className="w-full max-w-md rounded-3xl border border-[#8fb0ff]/45 dark:border-[#3a5aa8]/55 bg-gradient-to-br from-[#f8fbff]/98 via-[#eef4ff]/96 to-[#e7f0ff]/94 dark:from-[#08142e]/98 dark:via-[#0a1a3d]/96 dark:to-[#0d2458]/94 shadow-[0_24px_70px_-28px_rgba(11,39,96,0.85)] p-6 sm:p-7"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-4">
              <h3 className="font-black uppercase tracking-[0.16em] text-3xl text-[#1d1d1f] dark:text-[#e9eefc]">Delete Floor</h3>
              <p className="mt-1 text-sm text-[#415a8b] dark:text-[#a7b8e8]">Are you sure you want to delete this floor? All rooms will be removed.</p>
            </div>

            <div className="flex gap-3 pt-5 mt-5 border-t border-[#5f79bc]/35">
              <Button
                className="flex-1 h-12 !rounded-xl !font-black !tracking-wide !text-[#1d1d1f] dark:!text-[#e9eefc]"
                variant="secondary"
                onClick={() => { setIsDeleteFloorModalOpen(false); setFloorToDeleteId(null); }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-12 !rounded-xl !font-black !tracking-wide"
                variant="destructive"
                onClick={handleDeleteFloorSubmit}
              >
                Delete Floor
              </Button>
            </div>
          </div>
        </div>
      )}

      {isResetHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-md p-4" onClick={() => setIsResetHistoryModalOpen(false)}>
          <div
            className="w-full max-w-md rounded-3xl border border-[#8fb0ff]/45 dark:border-[#3a5aa8]/55 bg-gradient-to-br from-[#f8fbff]/98 via-[#eef4ff]/96 to-[#e7f0ff]/94 dark:from-[#08142e]/98 dark:via-[#0a1a3d]/96 dark:to-[#0d2458]/94 shadow-[0_24px_70px_-28px_rgba(11,39,96,0.85)] p-6 sm:p-7"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-4">
              <h3 className="font-black uppercase tracking-[0.16em] text-3xl text-[#1d1d1f] dark:text-[#e9eefc]">Reset History</h3>
              <p className="mt-1 text-sm text-[#415a8b] dark:text-[#a7b8e8]">This will permanently erase ALL borrowing activity and condition logs. This action cannot be undone.</p>
            </div>

            <div className="flex gap-3 pt-5 mt-5 border-t border-[#5f79bc]/35">
              <Button
                className="flex-1 h-12 !rounded-xl !font-black !tracking-wide !text-[#1d1d1f] dark:!text-[#e9eefc]"
                variant="secondary"
                onClick={() => setIsResetHistoryModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-12 !rounded-xl !font-black !tracking-wide"
                variant="destructive"
                onClick={handleResetHistorySubmit}
              >
                Reset Data
              </Button>
            </div>
          </div>
        </div>
      )}

      {editRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setEditRoomModal(null)}>
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-black uppercase tracking-widest mb-5">Edit Zone Name</h3>
            <Input label="Zone Name" value={editRoomModal.name} onChange={e => setEditRoomModal({ ...editRoomModal, name: e.target.value })} />
            <div className="flex gap-3 pt-5 mt-4 border-t">
              <Button className="flex-1" variant="secondary" onClick={() => setEditRoomModal(null)}>Cancel</Button>
              <Button className="flex-1" onClick={handleUpdateRoom}>Update Zone</Button>
            </div>
          </div>
        </div>
      )}

      {conditionHistoryModal && (
        <ConditionHistoryModal
          item={conditionHistoryModal}
          token={token!}
          onClose={() => setConditionHistoryModal(null)}
        />
      )}


      <style dangerouslySetInnerHTML={{ __html: `.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #86868b; border-radius: 10px; }` }} />
    </div>
  );
};

const ConditionHistoryModal: React.FC<{ item: { id: number; name: string }; token: string; onClose: () => void }> = ({ item, token, onClose }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const res = await getConditionHistory(token, item.id);
      if (res.success) setLogs(res.data || []);
      setLoading(false);
    };
    fetchLogs();
  }, [item.id, token]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-[#d2d2d7] dark:border-[#303030] bg-white dark:bg-slate-900 shadow-2xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-black uppercase tracking-widest text-[#1d1d1f] dark:text-white">Condition Timeline</h3>
            <p className="text-[10px] text-[#86868b] font-bold uppercase">{item.name}</p>
          </div>
          <button onClick={onClose} className="p-2 text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white transition-colors"><XCircle size={24} /></button>
        </div>

        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : logs.length > 0 ? (
            logs.map((log, i) => (
              <div key={i} className="flex gap-4 group">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                  <div className="w-0.5 flex-1 bg-slate-100 dark:bg-slate-800" />
                </div>
                <div className="pb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-black uppercase text-[#86868b]">{new Date(log.recorded_at || log.created_at).toLocaleDateString()}</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 text-[8px] font-black uppercase">{log.condition}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{log.notes || 'Routine condition check.'}</p>
                  <p className="text-[9px] text-[#86868b] mt-1 italic font-medium">Recorded by {log.request?.user?.username || 'Staff/System'}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-[#86868b] opacity-40">
              <ArchiveX className="mx-auto mb-2" size={48} />
              <p className="text-[10px] uppercase font-black tracking-widest">No condition timeline available</p>
              <p className="text-[8px] font-bold mt-1">Logs will appear here after item returns or inspections.</p>
            </div>
          )}
        </div>

        <div className="pt-6 border-t mt-4">
          <Button onClick={onClose} className="w-full" variant="secondary">Close Timeline</Button>
        </div>
      </div>
    </div>
  );
};


const StatPill: React.FC<{ icon: React.ReactNode; label: string; value: string | number; color: string }> = ({ icon, label, value, color }) => (
  <div className="h-14 sm:h-16 flex items-center justify-between px-3 sm:px-6 rounded-2xl bg-white/70 dark:bg-[#1d1d1f]/70 border border-[#d2d2d7] dark:border-[#303030] shadow-sm transition-all hover:scale-[1.02]">
    <div className="flex items-center gap-2 sm:gap-4">
      <div className={`p-2 sm:p-2.5 rounded-xl text-white ${color}`}>{icon}</div>
      <span className="text-[9px] sm:text-[11px] font-bold text-[#86868b] uppercase tracking-wider">{label}</span>
    </div>
    <span className="text-lg sm:text-2xl font-black">{value}</span>
  </div>
);

const STATUS_CHIP: Record<string, string> = {
  approved: 'bg-emerald-500/10 text-emerald-600',
  pending: 'bg-amber-500/10 text-amber-600',
  returned: 'bg-blue-500/10 text-blue-600',
  rejected: 'bg-rose-500/10 text-rose-600',
};

const RequestCard: React.FC<{
  request: BorrowRequest;
  onReturn: (id: number, condition: 'new' | 'good' | 'fair' | 'damaged', notes?: string) => void;
  onDelete: (id: number) => void;
}> = ({ request, onReturn, onDelete }) => {
  const [showReturnPicker, setShowReturnPicker] = React.useState(false);
  const [returnCondition, setReturnCondition] = React.useState<'new' | 'good' | 'fair' | 'damaged'>('good');
  const [returnNotes, setReturnNotes] = React.useState('');

  const isDone = request.status === 'returned' || request.status === 'rejected';

  return (
    <div className="p-4 sm:p-5 bg-white/70 dark:bg-[#1d1d1f]/70 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-[#d2d2d7] dark:border-[#303030] shadow-sm group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-sm font-black uppercase leading-tight">{request.equipment?.name || 'Item'}</h3>
          <p className="text-[10px] font-bold text-[#86868b] uppercase tracking-widest">{request.request_date.split('T')[0]}</p>
          {request.return_date && (
            <p className="text-[9px] text-blue-500 font-semibold mt-0.5">Returned: {request.return_date.split('T')[0]}</p>
          )}
          {request.return_condition && (
            <p className="text-[9px] text-[#86868b] capitalize mt-0.5">Condition: <span className="font-bold">{request.return_condition}</span></p>
          )}
        </div>
        <span className={`px-2 py-0.5 text-[8px] font-black rounded-full uppercase ${STATUS_CHIP[request.status] ?? 'bg-slate-100 text-slate-500'}`}>{request.status}</span>
      </div>

      {showReturnPicker && (
        <div className="mb-3 p-3 bg-[#f5f5f7] dark:bg-black/30 rounded-2xl space-y-2">
          <p className="text-[9px] font-black uppercase tracking-widest text-[#86868b] mb-1">Return Condition</p>
          <div className="grid grid-cols-2 gap-1.5">
            {(['new', 'good', 'fair', 'damaged'] as const).map(c => (
              <button
                key={c}
                onClick={() => setReturnCondition(c)}
                className={`py-1.5 rounded-xl text-[9px] font-black uppercase capitalize transition ${returnCondition === c
                  ? c === 'damaged' ? 'bg-rose-500 text-white' : 'bg-[#0066cc] text-white'
                  : 'bg-white dark:bg-[#2c2c2e] text-[#86868b] border border-[#d2d2d7] dark:border-[#303030]'
                  }`}
              >{c}</button>
            ))}
          </div>
          <textarea
            value={returnNotes}
            onChange={e => setReturnNotes(e.target.value)}
            placeholder="Notes (optional)..."
            rows={2}
            className="w-full text-[10px] rounded-xl bg-white dark:bg-[#2c2c2e] border border-[#d2d2d7] dark:border-[#303030] px-3 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-[#0066cc]"
          />
          <div className="flex gap-2">
            <button onClick={() => setShowReturnPicker(false)} className="flex-1 py-2 text-[9px] font-black uppercase text-[#86868b] border border-[#d2d2d7] dark:border-[#303030] rounded-xl">Cancel</button>
            <button
              onClick={() => { onReturn(request.id, returnCondition, returnNotes); setShowReturnPicker(false); }}
              className="flex-1 py-2 text-[9px] font-black uppercase bg-[#0066cc] text-white rounded-xl"
            >Confirm</button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mt-auto pt-2">
        {request.status === 'approved' && !showReturnPicker && (
          <button onClick={() => setShowReturnPicker(true)} className="flex-1 py-2 bg-[#1d1d1f] text-white dark:bg-[#f5f5f7] dark:text-[#1d1d1f] text-[9px] font-black uppercase rounded-xl tracking-widest">Return Gear</button>
        )}
        {request.status === 'pending' && (
          <button onClick={() => onDelete(request.id)} className="flex-1 py-2 text-rose-500 text-[9px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">Cancel Request</button>
        )}
        {isDone && (
          <button
            onClick={() => onDelete(request.id)}
            className="flex-1 py-2 text-[#86868b] text-[9px] font-black uppercase tracking-widest opacity-100 hover:text-rose-500 transition-colors rounded-xl border border-[#d2d2d7] dark:border-[#303030] bg-[#f5f5f7] dark:bg-black/20"
          >
            Dismiss
          </button>
        )}
      </div>


    </div>
  );
};

export default DashboardPage;
