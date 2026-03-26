import React, { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Menu, Search, LogOut, Package, History, CalendarClock, Building, ChevronDown, Plus, Trash2, X, Download, ListTodo, Square, MinusCircle, Edit, CheckCircle2, ArchiveX, XCircle, FileJson, MousePointer2, LayoutPanelLeft, PenTool, MapPin, Archive, Clock, FileSpreadsheet, Loader2, ScanLine, QrCode, ClipboardCheck, Info, BarChart3, Bell, AlertCircle } from 'lucide-react';
import QRCode from 'react-qr-code';
import { ThemeToggle } from '@/components/auth/ThemeToggle';
import { InteractiveBackground } from '@/components/auth/InteractiveBackground';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/authStore';
import { getEquipmentList } from '@/services/inventoryService';
import { BarcodeModal } from '@/components/ui/BarcodeModal';
import { ConditionHistoryModal } from '@/components/ui/ConditionHistoryModal';
import { BarcodeScannerModal } from '@/components/ui/BarcodeScannerModal';
import { FileUploader } from '@/components/ui/FileUploader';
import { DocumentPreview } from '@/components/ui/DocumentPreview';
import { GlobalDocuments } from '@/components/dashboard/GlobalDocuments';
import { NotificationPreferences } from '@/components/dashboard/NotificationPreferences';
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
import { getUsageReport, getFullHistoryReport, downloadHistoryCSV, resetSystemHistory, exportToGoogleSheets } from '@/services/reportService';
import {
  getUsersAsAdmin,
  createEquipmentAsAdmin,
  deleteEquipmentAsAdmin,
  createUserAsAdmin,
  deleteUserAsAdmin,
  updateEquipmentAsAdmin,
  updateUserAsAdmin,
  getAdminEquipmentHistory,
  getAdminUserHistory,
  assignUserToRoom,
  unassignUserFromRoom,
  getUserRooms
} from '@/services/adminService';
import type { BorrowRequest, Equipment, User } from '@/types/auth';
import { ParallaxCarousel } from '@/components/ui/ParallaxCarousel';
import { Virtual3DModel } from '@/components/ui/Virtual3DModel';
import { DashboardActionModal } from '@/components/ui/DashboardActionModal';
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

const VECTOR_UI_OPTIONS = [
  { id: 'laptop', label: 'Laptop', icon: '💻' },
  { id: 'computer', label: 'Computer', icon: '🖥️' },
  { id: 'projector', label: 'Projector', icon: '📽️' },
  { id: 'tablet', label: 'Tablet', icon: '📱' },
  { id: 'phone', label: 'Phone', icon: '🤳' },
  { id: 'camera', label: 'Camera', icon: '📷' },
  { id: 'cable', label: 'Accessory', icon: '🔌' },
  { id: 'generic', label: 'Other', icon: '📦' },
];

const parsePhotos = (url: string | null): string[] => {
  if (!url) return [];
  try {
    const parsed = JSON.parse(url);
    return Array.isArray(parsed) ? parsed : [url];
  } catch {
    return url ? [url] : [];
  }
};

const buildItemQrValue = (item: Partial<Equipment> & { id?: number; room?: { name?: string } | null; qr_code_value?: string | null }) => {
  const infoParts = [
    item.name ? `Name: ${item.name}` : null,
    item.type ? `Type: ${item.type}` : null,
    item.serial_number ? `Serial: ${item.serial_number}` : null,
    item.condition ? `Condition: ${item.condition}` : null,
    item.status ? `Status: ${item.status}` : null,
    item.room?.name ? `Room: ${item.room.name}` : null,
    item.location ? `Location: ${item.location}` : null,
  ].filter(Boolean);

  const query = infoParts.length > 0
    ? `School Inventory Item | ${infoParts.join(' | ')}`
    : `School Inventory Item ID: ${item.id ?? 'unknown'}`;

  return `https://www.google.com/search?udm=50&q=${encodeURIComponent(query)}`;
};

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
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);

  // Management Logic
  const [isAssigningMode, setIsAssigningMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAllUnits, setShowAllUnits] = useState(false);
  const [mgmtTab, setMgmtTab] = useState<'spatial' | 'approvals' | 'system' | 'reports' | 'storage' | 'notifications'>('spatial');
  const [reportData, setReportData] = useState<{ usage: any[]; history: any[] }>({ usage: [], history: [] });
  const [systemSubTab, setSystemSubTab] = useState<'assets' | 'users' | 'directory' | 'vault'>('assets');

  // Admin System State
  const [newEquipment, setNewEquipment] = useState({ name: '', type: 'laptop', condition: 'good' as any, quantity: 1, serial_number: '', room_id: null as number | null, is_sensitive: false });
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
  const [isExportingSheets, setIsExportingSheets] = useState(false);
  const [conditionHistoryModal, setConditionHistoryModal] = useState<{ id: number; name: string } | null>(null);
  const [historyModal, setHistoryModal] = useState<{ type: 'user' | 'equipment', id: number, title: string } | null>(null);
  const [userRoomModal, setUserRoomModal] = useState<{ user: User, rooms: any[] } | null>(null);
  const [teacherRoomIds, setTeacherRoomIds] = useState<number[]>([]);
  const [barcodeModal, setBarcodeModal] = useState<{ name: string; serial: string } | null>(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [showClaimPreview, setShowClaimPreview] = useState(false);
  const [showRegisterPreview, setShowRegisterPreview] = useState(false);
  const [conditionHistoryOpen, setConditionHistoryOpen] = useState<{ id: number; name: string } | null>(null);

  const [newPhotoUrls, setNewPhotoUrls] = useState<string[]>([]);
  const [editPhotoUrls, setEditPhotoUrls] = useState<string[]>([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmText: string;
    cancelText?: string;
    variant?: 'danger' | 'primary';
    onConfirm: () => void | Promise<void>;
  } | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{ requestId: number; reason: string } | null>(null);

  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  const isManager = isAdmin || isTeacher;
  const roleBadgeConfig = {
    admin: {
      label: 'Admin Dashboard',
      className: 'border-[#0066cc]/40 bg-[#0066cc]/10 text-[#0066cc] dark:border-[#7aa8ff]/40 dark:bg-[#7aa8ff]/10 dark:text-[#9fc0ff]'
    },
    teacher: {
      label: 'Teacher Dashboard',
      className: 'border-[#0f6abd]/40 bg-[#0f6abd]/10 text-[#0f6abd] dark:border-[#63b3ff]/40 dark:bg-[#63b3ff]/10 dark:text-[#99cbff]'
    },
    student: {
      label: 'Student Dashboard',
      className: 'border-emerald-600/40 bg-emerald-600/10 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-400/10 dark:text-emerald-300'
    }
  } as const;
  const currentRoleBadge = user?.role ? roleBadgeConfig[user.role] : null;

  const showError = (text: string) => {
    setError(text);
    setTimeout(() => setError(null), 4000);
  };

  const showMessage = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 3000);
  };

  useEffect(() => {
    localStorage.setItem('sims_theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    if (mapMode === 'draw') {
      setShowAllUnits(false);
    }
  }, [mapMode]);

  const fetchData = async () => {
    if (!token) return;
    try {
      setLoadingEquipment(true);
      const res = await getEquipmentList();
      if (res.success) {
        setEquipment(res.data || []);
      } else setError(res.error || 'Failed to load inventory');

      const reqResult = await getMyRequests(token);
      if (reqResult.success) setRequests(reqResult.data || []);

      if (isTeacher) {
        const trRes = await getUserRooms(token, user!.id);
        if (trRes.success && trRes.data) {
          setTeacherRoomIds(trRes.data.assignedRooms.map((r: any) => r.id));
        }
      }

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

          const timeout = (ms: number) => new Promise<null>(resolve => setTimeout(() => resolve(null), ms));
          const histRes = await Promise.race([getFullHistoryReport(token), timeout(10000)]);
          if (histRes && histRes.success && histRes.data) {
              setReportData(prev => ({ ...prev, history: (histRes.data as any).data || [] }));
          }
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
      room_id: editEquipmentModal.room_id || null,
      photo_url: editPhotoUrls.length > 0 ? JSON.stringify(editPhotoUrls) : '',
    });
    if (res.success) {
      setEditEquipmentModal(null);
      fetchData();
    } else showError(res.error || 'Failed to update equipment');
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
    } else showError(res.error || 'Failed to update user');
  };

  const handleUpdateFloor = async () => {
    if (!token || !editFloorModal) return;
    const res = await updateFloor(token, editFloorModal.id, { name: editFloorModal.name });
    if (res.success) {
      setEditFloorModal(null);
      fetchData();
    } else showError(res.error || 'Failed to update floor');
  };

  const handleUpdateRoom = async () => {
    if (!token || !editRoomModal) return;
    const res = await updateRoom(token, editRoomModal.id, { name: editRoomModal.name });
    if (res.success) {
      setEditRoomModal(null);
      fetchData();
    } else showError(res.error || 'Failed to update room');
  };

  const onDownloadCSV = () => {
    if (token) downloadHistoryCSV(token);
  };

  const onExportToSheets = async () => {
    if (!token) return;
    setIsExportingSheets(true);
    const res = await exportToGoogleSheets(token);
    setIsExportingSheets(false);
    if (res.success && res.data?.url) {
      if (res.data.url.includes('mock-sheet-url')) {
        setConfirmDialog({
        title: "Backup Initialized",
        message: "The UI works, but no real Google Sheet was created because the Google Cloud credentials aren't set in the backend .env file yet.\n\nMock Backup Successful!",
        confirmText: "Understood",
        variant: "primary",
        onConfirm: () => setConfirmDialog(null)
      });
      } else {
        window.open(res.data.url, '_blank');
      }
      setMessage(res.data.message || 'Backup created successfully');
      setTimeout(() => setMessage(null), 3000);
    } else {
      setConfirmDialog({
        title: "Backup Failed",
        message: res.error || "Failed to create Google Sheets backup. Make sure server credentials are set in the backend .env file.",
        confirmText: "Back",
        onConfirm: () => setConfirmDialog(null)
      });
    }
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
      showMessage('System history has been reset.');
      fetchData();
    } else {
      showError(res.error || 'Failed to reset history');
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
  }, [isAuthenticated, navigate, token]);

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
      showMessage('Floor created successfully.');
      fetchData();
      if (res.data?.floor) setCurrentFloorId(res.data.floor.id);
    } else showError(res.error || 'Failed to create floor');
  };

  const handleApprove = async (id: number) => {
    if (!token) return;
    const res = await approveRequest(token, id);
    if (res.success) {
      showMessage('Request approved!');
      fetchData();
    } else showError(res.error || 'Failed to approve');
  };

  const handleReject = async (id: number) => {
    setRejectDialog({ requestId: id, reason: '' });
  };

  const handleRejectSubmit = async () => {
    if (!token || !rejectDialog) return;
    const res = await rejectRequest(token, rejectDialog.requestId, rejectDialog.reason || undefined);
    if (res.success) {
      setRejectDialog(null);
      showMessage('Request rejected.');
      fetchData();
    } else {
      showError(res.error || 'Failed to reject');
    }
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
      showMessage('Floor deleted.');
    } else showError(res.error || 'Failed to delete floor');
  };

  const handleDeleteRoom = async (id: number) => {
    if (!token || !isAdmin) return;
    setConfirmDialog({
      title: 'Delete Room',
      message: 'Are you sure you want to delete this room? All assigned equipment will be unassigned.',
      confirmText: 'Delete Room',
      variant: 'danger',
      onConfirm: async () => {
        const res = await deleteRoom(token, id);
        if (res.success) {
          if (selectedRoomId === id) setSelectedRoomId(null);
          fetchData();
          showMessage('Room deleted.');
        } else {
          showError(res.error || 'Failed to delete room');
        }
      }
    });
  };

  const handleDeleteEquipment = async (id: number) => {
    if (!token || !isAdmin) return;
    setConfirmDialog({
      title: 'Delete Equipment',
      message: 'Are you sure you want to permanently delete this equipment item?',
      confirmText: 'Delete Gear',
      variant: 'danger',
      onConfirm: async () => {
        const res = await deleteEquipmentAsAdmin(token, id);
        if (res.success) {
          fetchData();
          showMessage('Equipment deleted');
        } else {
          showError(res.error || 'Deletion failed');
        }
      }
    });
  };

  const handleAddUser = async () => {
    if (!token || !isAdmin) return;
    const res = await createUserAsAdmin(token, newUser);
    if (res.success) {
      setNewUser({ username: '', email: '', password: '', role: 'student' });
      fetchData();
      showMessage('User created successfully');
    } else showError(res.error || 'Failed to create user');
  };

  const handleDeleteUser = async (id: number) => {
    if (!token || !isAdmin) return;
    if (id === user?.id) {
      showError('You cannot delete yourself');
      return;
    }

    setConfirmDialog({
      title: 'Delete User',
      message: 'Are you sure you want to delete this user account?',
      confirmText: 'Delete User',
      variant: 'danger',
      onConfirm: async () => {
        const res = await deleteUserAsAdmin(token, id);
        if (res.success) {
          fetchData();
          showMessage('User deleted.');
        } else {
          showError(res.error || 'Failed to delete user');
        }
      }
    });
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
      showError(res.error || 'Failed to update assignment');
    }
  };

  const groupedEquipment = useMemo(() => {
    if (requests === null) return [];

    const approvedBorrowedByEquipmentId = requests.reduce<Record<number, number>>((acc, request) => {
      if (request.status !== 'approved') return acc;
      const equipmentId = Number(request.equipment_id);
      const qty = Math.max(0, Number(request.quantity) || 0);
      acc[equipmentId] = (acc[equipmentId] || 0) + qty;
      return acc;
    }, {});

    const filteredEquipment = equipment.filter(e => {
      const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase());

      if (selectedRoomId) {
        return matchesSearch && Number(e.room_id) === Number(selectedRoomId);
      }

      if (showAllUnits) {
        return matchesSearch;
      }

      if (mgmtTab === 'storage') {
        const storageRoomIds = floors.flatMap(f => f.rooms).filter(r => r.type === 'storage').map(r => r.id);
        return matchesSearch && e.room_id !== null && storageRoomIds.includes(Number(e.room_id));
      }

      if (isTeacher) {
        return matchesSearch && e.room_id !== null && teacherRoomIds.includes(Number(e.room_id));
      }

      if (currentFloorId) {
        const floorRooms = floors.find(f => f.id === currentFloorId)?.rooms.map(r => r.id) || [];
        return matchesSearch && e.room_id !== null && floorRooms.includes(Number(e.room_id));
      }

      return matchesSearch;
    });

    const groups: Record<string, any> = {};

    filteredEquipment.forEach(item => {
      const key = `${item.name}-${item.type}-${item.condition}`;
      if (!groups[key]) {
        groups[key] = { ...item, totalQuantity: 0, availableQuantity: 0, all_items: [], rooms: [] as string[] };
      }
      const itemQuantity = Math.max(0, Number(item.quantity) || 0);
      groups[key].totalQuantity += itemQuantity;
      if (item.status === 'available') {
        groups[key].availableQuantity += itemQuantity;
        groups[key].id = item.id;
      }
      groups[key].all_items.push(item);
      if (item.room?.name && !groups[key].rooms.includes(item.room.name)) {
        groups[key].rooms.push(item.room.name);
      }
    });

    Object.values(groups).forEach((group: any) => {
      const borrowedUnits = group.all_items.reduce((sum: number, item: Equipment) => {
        return sum + (approvedBorrowedByEquipmentId[item.id] || 0);
      }, 0);

      group.totalQuantity += borrowedUnits;
    });

    return Object.values(groups) as GroupedEquipment[];
  }, [equipment, requests, selectedRoomId, showAllUnits, floors, currentFloorId, searchTerm]);

  const usageChartData = reportData.usage.length > 0 ? reportData.usage : fallbackUsageData;

  const onQuickBorrow = async (equipmentId: number) => {
    if (!token || isSubmittingClaim) return false;

    setError(null);
    setMessage(null);
    setIsSubmittingClaim(true);

    const now = new Date();
    const due = new Date(now);
    due.setDate(now.getDate() + 7);

    try {
      const _result = await submitBorrowRequest(token, {
        equipment_id: equipmentId,
        quantity: 1,
        request_date: now.toISOString(),
        due_date: due.toISOString(),
        notes: 'Requested from spatial dashboard',
      });

      if (_result.success) {
        setMessage('Request submitted');
        setTimeout(() => setMessage(null), 3000);
        await fetchData();
        return true;
      }

      setError(_result.error || 'Borrow request failed');
      return false;
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  const onReturn = async (requestId: number, condition: 'new' | 'good' | 'fair' | 'damaged' = 'good', notes?: string) => {
    if (!token) return;
    const _result = await returnBorrowRequest(token, requestId, { condition, notes: notes || 'Returned by user' });
    if (_result.success) fetchData();
    else setError(_result.error || 'Return failed');
  };

  const performDelete = async (requestId: number) => {
    if (!token) return;
    const _result = await deleteBorrowRequest(token, requestId);
    if (_result.success) {
      fetchData();
      setMessage('Request dismissed');
      setTimeout(() => setMessage(null), 3000);
    } else {
      setError(_result.error || 'Failed to dismiss request');
      setTimeout(() => setError(null), 5000);
    }
  };

  const onSignOut = async () => {
    await logout();
    navigate('/auth', { replace: true });
  };

  const currentFloor = floors.find(f => f.id === currentFloorId);

  const selectedItemAvailability = useMemo(() => {
    if (!selectedItem) return null;

    const sameGear = equipment.filter(
      (item) => item.name === selectedItem.name && item.type === selectedItem.type
    );

    const approvedBorrowedByEquipmentId = (requests || []).reduce<Record<number, number>>((acc, request) => {
      if (request.status !== 'approved') return acc;
      const equipmentId = Number(request.equipment_id);
      const qty = Math.max(0, Number(request.quantity) || 0);
      acc[equipmentId] = (acc[equipmentId] || 0) + qty;
      return acc;
    }, {});

    if (sameGear.length === 0) {
      const fallbackQty = Math.max(0, Number((selectedItem as any).quantity) || 0);
      return {
        available: selectedItem.availableQuantity ?? fallbackQty,
        total: selectedItem.totalQuantity ?? fallbackQty,
      };
    }

    const total = sameGear.reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0), 0);
    const available = sameGear.reduce((sum, item) => {
      if (item.status !== 'available') return sum;
      return sum + Math.max(0, Number(item.quantity) || 0);
    }, 0);

    const borrowed = sameGear.reduce((sum, item) => {
      return sum + (approvedBorrowedByEquipmentId[item.id] || 0);
    }, 0);

    return { available, total: total + borrowed };
  }, [selectedItem, equipment, requests]);

  const roomLocationOptions = useMemo(() => {
    return floors
      .slice()
      .sort((a, b) => a.level - b.level)
      .flatMap((floor) =>
        floor.rooms
          .filter((room) => room.type !== 'inactive')
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((room) => ({
            id: room.id,
            label: `${floor.name} - ${room.name}`,
          }))
      );
  }, [floors]);

  const ManagementPanel = (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-[#f5f5f7] dark:border-[#303030] shrink-0 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Management</h2>
        </div>
        <div className="flex bg-[#f5f5f7] dark:bg-[#1d1d1f] p-1 rounded-xl border border-[#d2d2d7] dark:border-[#303030] shrink-0">
          <button onClick={() => { setViewMode('3d'); setShowAllUnits(false); }} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${viewMode === '3d' && !showAllUnits ? 'bg-white dark:bg-[#303030] shadow-sm text-[#1d1d1f] dark:text-[#f5f5f7]' : 'text-[#86868b]'}`}>{isTeacher ? 'My Rooms' : '3D View'}</button>
          <button onClick={() => { setViewMode('3d'); setShowAllUnits(true); }} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${viewMode === '3d' && showAllUnits ? 'bg-white dark:bg-[#303030] shadow-sm text-[#1d1d1f] dark:text-[#f5f5f7]' : 'text-[#86868b]'}`}>See All</button>
          <button onClick={() => setViewMode('map')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${viewMode === 'map' ? 'bg-white dark:bg-[#303030] shadow-sm text-[#1d1d1f] dark:text-[#f5f5f7]' : 'text-[#86868b]'}`}>Map View</button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
          <StatPill icon={<Package size={16} />} label="Available gear" value={groupedEquipment.reduce((acc, g) => acc + (g.availableQuantity || 0), 0)} color="bg-emerald-500" />
          <StatPill icon={<History size={16} />} label="My requests" value={requests?.length || 0} color="bg-blue-500" />
          <StatPill icon={<CalendarClock size={16} />} label="Queue status" value={requests ? requests.filter(r => r.status === 'pending').length : 0} color="bg-amber-500" />
        </div>

        <div className="flex flex-wrap gap-2 p-2 bg-[#f5f5f7] dark:bg-[#1d1d1f] rounded-2xl border border-[#d2d2d7] dark:border-[#303030] shadow-sm mb-4">
          <button onClick={() => setMgmtTab('spatial')} className={`flex-1 min-w-[75px] py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${mgmtTab === 'spatial' ? 'bg-white dark:bg-[#303030] shadow-md text-[#0066cc]' : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'}`}>Spatial</button>
          <button onClick={() => setMgmtTab('approvals')} className={`flex-1 min-w-[75px] py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${mgmtTab === 'approvals' ? 'bg-white dark:bg-[#303030] shadow-md text-[#0066cc]' : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'}`}>Approvals</button>
          <button onClick={() => setMgmtTab('storage')} className={`flex-1 min-w-[75px] py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${mgmtTab === 'storage' ? 'bg-white dark:bg-[#303030] shadow-md text-[#0066cc]' : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'}`}>Storage</button>
          <button onClick={() => setMgmtTab('reports')} className={`flex-1 min-w-[75px] py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${mgmtTab === 'reports' ? 'bg-white dark:bg-[#303030] shadow-md text-[#0066cc]' : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'}`}>Reports</button>
          <button onClick={() => setMgmtTab('notifications')} className={`flex-1 min-w-[75px] py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${mgmtTab === 'notifications' ? 'bg-white dark:bg-[#303030] shadow-md text-[#0066cc]' : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'}`}>Alerts</button>
          {isAdmin && <button onClick={() => setMgmtTab('system')} className={`flex-1 min-w-[75px] py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${mgmtTab === 'system' ? 'bg-white dark:bg-[#303030] shadow-md text-[#0066cc]' : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'}`}>Global</button>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6">
        {mgmtTab === 'spatial' && (
          <div className="space-y-6">
            {isAdmin && floors.length > 0 && (
              <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
                <button
                  onClick={() => setMapMode('select')}
                  className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${mapMode === 'select' ? 'bg-white dark:bg-slate-700 shadow-md text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <MousePointer2 size={14} /> Selector
                </button>
                <button
                  onClick={() => setMapMode('draw')}
                  disabled={floors.length === 0}
                  className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${mapMode === 'draw' && floors.length > 0 ? 'bg-indigo-500 shadow-lg text-white' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <PenTool size={14} /> Vector Drawing
                </button>
              </div>
            )}

            <div className="space-y-2">
              {floors.length === 0 ? (
                <div className="p-6 rounded-2xl border-2 border-dashed border-[#d2d2d7] dark:border-[#303030] flex flex-col items-center justify-center text-center space-y-3">
                  <Building size={32} className="text-[#86868b] opacity-50" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#86868b] mb-1">No Floors Created</p>
                    <p className="text-[8px] text-[#86868b]">Create a floor first to start drawing zones</p>
                  </div>
                </div>
              ) : (
                floors.map(floor => (
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
                ))
              )}
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
                      {currentFloor?.rooms.find(r => r.id === selectedRoomId)?.name} ({currentFloor?.rooms.find(r => r.id === selectedRoomId)?.type === 'storage' ? 'Storage' : 'Regular'})
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
                    disabled={selectedRoomId ? currentFloor?.rooms.find(r => r.id === selectedRoomId)?.type === 'inactive' : true}
                    onClick={() => setIsAssigningMode(!isAssigningMode)}
                    className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-30 disabled:cursor-not-allowed ${isAssigningMode ? 'bg-[#1d1d1f] text-white dark:bg-[#f5f5f7] dark:text-[#1d1d1f]' : 'bg-white dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-[#f5f5f7] border border-[#d2d2d7] dark:border-[#303030] shadow-sm'}`}
                  >
                    <Package size={14} />
                    {currentFloor?.rooms.find(r => r.id === selectedRoomId)?.type === 'inactive'
                      ? 'Zone Restricted (Inactive)'
                      : (isAssigningMode ? 'Cancel Selection' : 'Assign Unit to Room')}
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
                      <button onClick={() => handleApprove(request.id)} className="flex-1 py-2.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[9px] font-black uppercase rounded-xl hover:bg-emerald-600 hover:text-white hover:shadow-lg hover:shadow-emerald-500/20 transition-all active:scale-95 shadow-sm">Approve</button>
                      <button onClick={() => handleReject(request.id)} className="flex-1 py-2.5 bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 text-[9px] font-black uppercase rounded-xl hover:bg-rose-600 hover:text-white hover:shadow-lg hover:shadow-rose-500/20 transition-all active:scale-95 shadow-sm">Reject</button>
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
        {mgmtTab === 'storage' && (
          <div className="space-y-4">
            <p className="text-[10px] uppercase font-black tracking-widest text-[#86868b]">Stored Inventory</p>
            {(() => {
              const storageItems = equipment.filter(e => {
                const room = floors.flatMap(f => f.rooms).find(r => r.id === Number(e.room_id));
                return room?.type === 'storage';
              });

              if (storageItems.length === 0) {
                return (
                  <div className="p-10 rounded-3xl border-2 border-dashed border-[#d2d2d7] dark:border-[#303030] flex flex-col items-center justify-center opacity-40">
                    <Archive size={32} className="mb-2" />
                    <p className="text-[10px] font-bold uppercase tracking-wider">No stored units</p>
                  </div>
                );
              }

              return storageItems.map(item => {
                const floor = floors.find(f => f.rooms.some(r => r.id === Number(item.room_id)));
                const room = floor?.rooms.find(r => r.id === Number(item.room_id));

                return (
                  <div key={item.id} className="p-4 bg-white dark:bg-[#1d1d1f] rounded-2xl border border-[#d2d2d7] dark:border-[#303030] shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-xs font-black uppercase truncate group-hover:text-[#0066cc] transition-colors">{item.name}</h4>
                        <p className="text-[8px] font-bold text-[#86868b] uppercase tracking-tighter">{item.serial_number || 'No Serial Tracking'}</p>
                      </div>
                      <button
                        onClick={() => {
                          if (floor && room) {
                            setCurrentFloorId(floor.id);
                            setSelectedRoomId(room.id);
                            setViewMode('map');
                          }
                        }}
                        className="p-2 text-[#0066cc] bg-blue-100 dark:bg-blue-500/20 rounded-xl hover:scale-110 hover:shadow-md transition-all flex items-center justify-center shadow-sm"
                        title="Locate on Map"
                      >
                        <MapPin size={14} />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md text-[8px] font-black uppercase tracking-tighter">
                        Floor: {floor?.name || 'N/A'}
                      </span>
                      <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-[#0066cc] rounded-md text-[8px] font-black uppercase tracking-tighter">
                        Room: {room?.name || 'Unknown'} (Storage)
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter ${item.status === 'available' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}


        {mgmtTab === 'system' && isAdmin && (
          <div className="space-y-6 pb-12">
            <div className="flex p-1 bg-[#f5f5f7] dark:bg-[#1d1d1f] rounded-xl border border-[#d2d2d7] dark:border-[#303030] mb-4">
              <button onClick={() => setSystemSubTab('assets')} className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${systemSubTab === 'assets' ? 'bg-white dark:bg-[#303030] shadow-sm text-[#0066cc]' : 'text-[#86868b]'}`}>Assets</button>
              <button onClick={() => setSystemSubTab('users')} className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${systemSubTab === 'users' ? 'bg-white dark:bg-[#303030] shadow-sm text-[#0066cc]' : 'text-[#86868b]'}`}>Users</button>
              <button onClick={() => setSystemSubTab('directory')} className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${systemSubTab === 'directory' ? 'bg-white dark:bg-[#303030] shadow-sm text-[#0066cc]' : 'text-[#86868b]'}`}>Users List</button>
              <button onClick={() => setSystemSubTab('vault')} className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${systemSubTab === 'vault' ? 'bg-white dark:bg-[#303030] shadow-sm text-[#0066cc]' : 'text-[#86868b]'}`}>Vault</button>
            </div>

            {systemSubTab === 'assets' && (
              <section className="space-y-4">
                <p className="text-[10px] uppercase font-black tracking-widest text-[#86868b]">Add Asset</p>
                <div className="space-y-2 p-4 bg-[#f5f5f7] dark:bg-[#1d1d1f] rounded-2xl border border-[#d2d2d7] dark:border-[#303030]">
                  <Input className="text-[11px] h-10 rounded-xl bg-white dark:bg-[#2c2c2e]" placeholder="Equipment Name" value={newEquipment.name} onChange={e => setNewEquipment(p => ({ ...p, name: e.target.value }))} />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input className="flex-1 text-[11px] h-10 rounded-xl bg-white dark:bg-[#2c2c2e]" placeholder="Serial Number (Optional)" value={newEquipment.serial_number || ''} onChange={e => setNewEquipment(p => ({ ...p, serial_number: e.target.value }))} />
                    <Input className="w-full sm:w-20 text-[11px] h-10 rounded-xl bg-white dark:bg-[#2c2c2e]" type="number" placeholder="Qty" value={newEquipment.quantity} onChange={e => setNewEquipment(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase text-[#86868b] tracking-widest">Condition</p>
                    <select
                      value={newEquipment.condition}
                      onChange={e => setNewEquipment(p => ({ ...p, condition: e.target.value as any }))}
                      className="w-full h-12 px-4 rounded-[10px] bg-white dark:bg-[#2c2c2e] border border-[#d2d2d7] dark:border-[#303030] text-[10px] font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                    >
                      <option value="new">Brand New</option>
                      <option value="good">Good Condition</option>
                      <option value="fair">Fair / Used</option>
                      <option value="damaged">Damaged / Repair</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase text-[#86868b] tracking-widest ml-1 flex items-center gap-1">
                      <Building size={10} /> Spatial Assignment
                    </p>
                    <select
                      value={newEquipment.room_id || ''}
                      onChange={e => setNewEquipment(p => ({ ...p, room_id: e.target.value ? parseInt(e.target.value) : null }))}
                      className="w-full h-12 px-4 rounded-[10px] bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-900/30 text-[#0066cc] text-[10px] font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                    >
                      <option value="">Unassigned (No Room)</option>
                      {roomLocationOptions.map((room) => (
                        <option key={room.id} value={room.id}>{room.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-white dark:bg-[#2c2c2e] rounded-xl border border-[#d2d2d7] dark:border-[#303030]">
                    <input
                      type="checkbox"
                      id="isSensitive"
                      checked={newEquipment.is_sensitive}
                      onChange={e => setNewEquipment(p => ({ ...p, is_sensitive: e.target.checked }))}
                      className="w-4 h-4 rounded border-slate-300 text-[#0066cc] focus:ring-[#0066cc]"
                    />
                    <label htmlFor="isSensitive" className="text-[10px] font-black uppercase tracking-widest text-[#1d1d1f] dark:text-[#f5f5f7] cursor-pointer">
                      Mark as Sensitive Item (Requires Admin Approval)
                    </label>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase text-[#86868b] ml-1">UI Model</p>
                    <div className="grid grid-cols-4 gap-2">
                      {VECTOR_UI_OPTIONS.map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => setNewEquipment(p => ({ ...p, type: opt.id }))}
                          className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${newEquipment.type === opt.id ? 'bg-[#0066cc] border-[#0066cc] text-white shadow-lg' : 'bg-white dark:bg-[#2c2c2e] border-[#d2d2d7] dark:border-[#303030] text-[#1d1d1f] dark:text-[#f5f5f7] hover:border-[#86868b]'}`}
                        >
                          <span className="text-lg mb-1">{opt.icon}</span>
                          <span className="text-[7px] font-black uppercase">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between ml-1 mb-2">
                      <p className="text-[9px] font-black uppercase text-[#86868b]">Real Photos</p>
                    </div>
                    <FileUploader
                      token={useAuthStore.getState().token || ''}
                      onUploadSuccess={(url) => setNewPhotoUrls(p => [...p, url])}
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      hintText="Supports Images Only (JPG, PNG)"
                    />
                    <div className="flex flex-wrap gap-2">
                      {newPhotoUrls.map((url, i) => (
                        <div key={i} className="relative group w-12 h-12 rounded-lg overflow-hidden border border-[#d2d2d7] dark:border-[#303030]">
                          <DocumentPreview url={url} isThumbnail className="w-full h-full" />
                          <button onClick={() => setNewPhotoUrls(p => p.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-rose-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                      {newPhotoUrls.length === 0 && <p className="text-[8px] italic text-[#86868b] p-3 w-full text-center bg-white/50 dark:bg-black/20 rounded-lg">No photos attached</p>}
                    </div>
                  </div>

                  {showRegisterPreview ? (
                    <div className="space-y-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 animate-in fade-in zoom-in-95">
                      <div className="flex items-start gap-3">
                         <Info size={18} className="text-[#0066cc] mt-0.5" />
                         <div>
                            <p className="text-[10px] font-black uppercase text-[#0066cc]">Preview Registration</p>
                            <p className="text-[11px] font-bold mt-1">
                              Creating "{newEquipment.name}" ({newEquipment.quantity} units, {newEquipment.condition}) 
                              {newEquipment.room_id ? ' in assigned room.' : ' in lobby.'}
                            </p>
                         </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="secondary" className="flex-1 py-3" onClick={() => setShowRegisterPreview(false)}>Edit</Button>
                        <Button className="flex-[2] py-3 bg-[#0066cc]" onClick={async () => {
                          if (!token) return;
                          const res = await createEquipmentAsAdmin(token, {
                            ...newEquipment,
                            photo_url: newPhotoUrls.length > 0 ? JSON.stringify(newPhotoUrls) : undefined
                          });
                          if (res.success) {
                            setMessage(newEquipment.room_id ? 'Asset registered to room!' : 'Asset created in lobby!');
                            setShowRegisterPreview(false);
                            setNewEquipment({ name: '', type: 'laptop', condition: 'good' as any, quantity: 1, serial_number: '', room_id: null, is_sensitive: false });
                            setNewPhotoUrls([]);
                            fetchData();
                            setShowRegisterPreview(false);
                            setTimeout(() => setMessage(null), 3000);
                          } else showError(res.error || 'Failed to create equipment');
                        }}>Confirm & Register</Button>
                      </div>
                    </div>
                  ) : (
                    <Button 
                      className="w-full text-[9px] font-black py-4 uppercase tracking-widest bg-gradient-to-r from-[#0066cc] to-[#004e9c] hover:shadow-xl hover:shadow-blue-500/20 active:scale-[0.98] transition-all" 
                      onClick={() => {
                        if (!newEquipment.name) return showError('Name is required');
                        setShowRegisterPreview(true);
                      }}
                    >
                      Process Registration
                    </Button>
                  )}
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
                  <Button className="w-full text-[9px] font-black py-4 uppercase tracking-widest bg-gradient-to-r from-[#0066cc] to-[#004e9c] hover:shadow-xl hover:shadow-blue-500/20 active:scale-[0.98] transition-all" onClick={handleAddUser}>Create User Account</Button>
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
                          <div className="flex items-center gap-2">
                            <p className="text-[8px] text-[#86868b]">{e.serial_number || e.type}</p>
                            {e.room && <span className="text-[8px] font-black text-[#0066cc] uppercase tracking-tighter">@{e.room.name}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => {
                            setEditEquipmentModal(e);
                            setEditPhotoUrls(parsePhotos(e.photo_url));
                          }} className="p-2 text-[#0066cc] bg-blue-50 dark:bg-blue-500/10 rounded-lg hover:scale-110 transition-all" title="Edit Info">
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
                          {u.role === 'teacher' && (
                            <button onClick={async () => {
                              if (!token) return;
                              const res = await getUserRooms(token, u.id);
                              if (res.success && res.data) {
                                setUserRoomModal({ user: u, rooms: res.data.assignedRooms });
                              } else {
                                setConfirmDialog({
                                  title: "Error",
                                  message: res.error || 'Failed to fetch user rooms',
                                  confirmText: "Back",
                                  onConfirm: () => setConfirmDialog(null)
                                });
                              }
                            }} className="p-2 text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/20 rounded-xl hover:scale-110 active:scale-95 transition-all shadow-sm flex items-center justify-center" title="Manage Rooms">
                              <Building size={14} />
                            </button>
                          )}
                          <button onClick={() => setEditUserModal(u)} className="p-2 text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl hover:scale-110 active:scale-95 transition-all shadow-sm flex items-center justify-center" title="Edit">
                            <Edit size={14} />
                          </button>
                          <button onClick={() => setHistoryModal({ type: 'user', id: u.id, title: u.username })} className="p-2 text-indigo-700 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl hover:scale-110 active:scale-95 transition-all shadow-sm flex items-center justify-center" title="History">
                            <History size={14} />
                          </button>
                          {u.id !== user?.id && (
                            <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-500/20 rounded-xl hover:scale-110 active:scale-95 transition-all shadow-sm flex items-center justify-center" title="Delete">
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
            {systemSubTab === 'vault' && token && (
              <GlobalDocuments token={token} isAdmin={isAdmin} />
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
                  <RechartsBarChart data={usageChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#86868b', fontWeight: 'bold' }} width={100} />
                    <Tooltip
                      cursor={{ fill: 'transparent' }}
                      formatter={(value) => [String(value ?? 0), 'Borrow Count']}
                      labelStyle={{ color: theme === 'dark' ? '#f8fafc' : '#111827', fontWeight: 800, fontSize: '11px' }}
                      itemStyle={{ color: theme === 'dark' ? '#93c5fd' : '#0066cc', fontWeight: 800, fontSize: '10px' }}
                      contentStyle={{
                        borderRadius: '12px',
                        border: theme === 'dark' ? '1px solid #334155' : '1px solid #d2d2d7',
                        backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                        fontSize: '10px',
                        fontWeight: 800
                      }}
                    />
                    <Bar dataKey="borrowCount" radius={[0, 4, 4, 0]} barSize={12}>
                      {usageChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#0066cc' : '#5e5e66'} />
                      ))}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              ) : null}
            </div>

            <div className="space-y-4 pt-4 border-t border-[#f5f5f7] dark:border-[#303030]">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase font-black tracking-widest text-[#86868b]">Full System Logs</p>
                <div className="flex items-center gap-3">
                  <button onClick={onDownloadCSV} className="text-[9px] font-black uppercase text-[#0066cc] hover:underline whitespace-nowrap">CSV Export</button>
                  <button onClick={onExportToSheets} disabled={isExportingSheets} className="flex items-center gap-1 text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 disabled:opacity-50 transition-colors whitespace-nowrap">
                    {isExportingSheets ? <Loader2 size={12} className="animate-spin" /> : <FileSpreadsheet size={12} />} Sheets Backup
                  </button>
                  <button onClick={handleResetHistory} className="text-[9px] font-black uppercase text-rose-500 hover:underline border-l border-[#d2d2d7] dark:border-[#303030] pl-3 ml-1">Reset Data</button>
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
        {mgmtTab === 'notifications' && (
          <NotificationPreferences role={user?.role as any || 'student'} />
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
                {currentRoleBadge && (
                  <span className={`ml-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${currentRoleBadge.className}`}>
                    {currentRoleBadge.label}
                  </span>
                )}
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
                disabled={mapMode === 'draw'}
                className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter transition-all shadow-sm ${mapMode === 'draw' ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border-dashed border-slate-300 dark:border-slate-700' : showAllUnits ? 'bg-[#0066cc] text-white' : 'bg-white dark:bg-[#1d1d1f] text-[#86868b] border border-[#d2d2d7] dark:border-[#303030]'}`}
              >
                {mapMode === 'draw' ? 'Global Disabled (Drawing)' : showAllUnits ? 'Showing Global' : 'View All Assets'}
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

          <div className="relative flex-1 flex flex-col min-h-0 min-w-0">
            <AnimatePresence mode="wait">
              {viewMode === '3d' ? (
                <motion.div key="3d" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="flex-1 flex flex-col h-full min-h-0">
                  {loadingEquipment ? (
                    <div className="flex-1 flex items-center justify-center"><div className="w-12 h-12 border-4 border-[#0066cc] border-t-transparent rounded-full animate-spin" /></div>
                  ) : groupedEquipment.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-40"><Package size={80} className="mb-4" /><p className="text-xl font-bold">No gear in this orbit.</p></div>
                  ) : (
                    <ParallaxCarousel items={groupedEquipment} onExpand={item => setSelectedItem(item as GroupedEquipment)} />
                  )}
                </motion.div>
              ) : (
                <motion.div key="map" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex-1 flex flex-col gap-4 max-w-6xl mx-auto w-full px-2 lg:px-4 min-h-0">
                  <div className="flex items-center justify-between shrink-0">
                    <div className="relative">
                      <button onClick={() => setIsFloorMenuOpen(!isFloorMenuOpen)} className="flex items-center gap-3 px-6 py-2 bg-white dark:bg-[#1d1d1f] rounded-full border border-[#d2d2d7] dark:border-[#303030] shadow-sm hover:shadow-md font-semibold text-sm">
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
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <button
                          onClick={() => setMapMode(mapMode === 'select' ? 'draw' : 'select')}
                          className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all shadow-lg hover:scale-105 active:scale-95 ${mapMode === 'draw' ? 'bg-indigo-500 text-white' : 'bg-white dark:bg-[#2c2c2e] text-[#86868b] border border-[#d2d2d7] dark:border-[#303030]'}`}
                        >
                          <PenTool size={12} className="inline mr-2" />
                          {mapMode === 'draw' ? 'Exit Drawing' : 'Draw Room'}
                        </button>
                      )}
                      {selectedRoomId && (
                        <button onClick={() => setSelectedRoomId(null)} className="flex items-center gap-2 bg-[#1d1d1f] dark:bg-[#f5f5f7] px-4 py-2 rounded-full text-white dark:text-[#1d1d1f] text-[10px] font-black uppercase tracking-widest shadow-lg">
                          Zone: {currentFloor?.rooms.find(r => r.id === selectedRoomId)?.name} <X size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-h-[350px] bg-white/50 dark:bg-black/20 rounded-[40px] border border-[#d2d2d7] dark:border-[#303030] overflow-hidden backdrop-blur-sm relative mb-4">
                    {floors.length === 0 ? (
                      <div className="w-full h-full flex items-center justify-center flex-col gap-3">
                        <AlertCircle size={40} className="text-[#86868b] opacity-40" />
                        <div className="text-center space-y-2">
                          <p className="text-[11px] font-black uppercase tracking-widest text-[#86868b]">Drawing Unavailable</p>
                          <p className="text-[9px] text-[#86868b]">Create at least one floor to start drawing zones</p>
                        </div>
                      </div>
                    ) : (
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
                    )}
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
            ${isMobileMenuOpen ? 'w-[320px] translate-x-0 opacity-100' : 'w-[320px] translate-x-full lg:translate-x-0 opacity-0 lg:opacity-100 pointer-events-none lg:pointer-events-auto'}
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
                  <div className="flex flex-col gap-2 pt-6 border-t border-[#f5f5f7] dark:border-[#303030]">
                    <button
                      onClick={() => setIsScannerOpen(true)}
                      className="w-full h-12 flex items-center gap-3 px-4 rounded-2xl bg-gradient-to-br from-[#1d1d1f] to-[#3a3a3c] dark:from-[#0066cc] dark:to-[#004e9c] text-white hover:shadow-xl hover:shadow-blue-500/10 transition-all font-bold text-[10px] uppercase tracking-widest active:scale-95"
                    >
                      <div className="p-1.5 bg-white/10 rounded-lg">
                        <ScanLine size={16} />
                      </div>
                      <span>Scan Barcode</span>
                    </button>

                    <button
                      onClick={onSignOut}
                      className="w-full h-12 flex items-center gap-3 px-4 rounded-2xl text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all font-black text-[10px] uppercase tracking-widest border border-rose-100 dark:border-rose-900/30 shadow-sm active:scale-95"
                    >
                      <LogOut size={18} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isSidebarCollapsed && !isMobileMenuOpen && (
              <div className="flex flex-col items-center py-12 gap-8 h-full">
                <div className="w-8 h-8 rounded-full bg-[#0066cc] flex items-center justify-center text-white text-[10px] font-black">{user?.username[0].toUpperCase()}</div>
                <div className="flex-1 flex flex-col gap-6 items-center">
                  <button onClick={() => { setIsSidebarCollapsed(false); setMgmtTab('spatial'); }} className={`p-2 rounded-xl transition-colors ${mgmtTab === 'spatial' ? 'text-[#0066cc] bg-blue-50 dark:bg-blue-900/20' : 'text-[#86868b] hover:bg-slate-50 dark:hover:bg-slate-800'}`}><Building size={20} /></button>
                  <button onClick={() => { setIsSidebarCollapsed(false); setMgmtTab('approvals'); }} className={`p-2 rounded-xl transition-colors ${mgmtTab === 'approvals' ? 'text-[#0066cc] bg-blue-50 dark:bg-blue-100/10' : 'text-[#86868b] hover:bg-slate-50 dark:hover:bg-slate-800'}`}><ListTodo size={20} /></button>
                  <button onClick={() => { setIsSidebarCollapsed(false); setMgmtTab('storage'); }} className={`p-2 rounded-xl transition-colors ${mgmtTab === 'storage' ? 'text-[#0066cc] bg-blue-50 dark:bg-blue-100/10' : 'text-[#86868b] hover:bg-slate-50 dark:hover:bg-slate-800'}`}><Archive size={20} /></button>
                  <button onClick={() => { setIsSidebarCollapsed(false); setMgmtTab('reports'); }} className={`p-2 rounded-xl transition-colors ${mgmtTab === 'reports' ? 'text-[#0066cc] bg-blue-50 dark:bg-blue-100/10' : 'text-[#86868b] hover:bg-slate-50 dark:hover:bg-slate-800'}`}><BarChart3 className="w-5 h-5" /></button>
                  <button onClick={() => { setIsSidebarCollapsed(false); setMgmtTab('notifications'); }} className={`p-2 rounded-xl transition-colors ${mgmtTab === 'notifications' ? 'text-[#0066cc] bg-blue-50 dark:bg-blue-100/10' : 'text-[#86868b] hover:bg-slate-50 dark:hover:bg-slate-800'}`}><Bell size={20} /></button>
                  {isAdmin && <button onClick={() => { setIsSidebarCollapsed(false); setMgmtTab('system'); }} className="p-2 rounded-xl text-[#86868b] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"><Square size={20} /></button>}
                  
                  {/* Icon version of Scanner for collapsed view */}
                  <button
                    onClick={() => setIsScannerOpen(true)}
                    className="p-2 rounded-xl bg-[#0066cc] text-white shadow-lg shadow-blue-500/20 hover:bg-[#005bb8] transition-all"
                  >
                    <ScanLine size={20} />
                  </button>
                </div>
                <button onClick={onSignOut} className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"><LogOut size={20} /></button>
              </div>
            )}
          </div>
        </aside>

        <AnimatePresence>
          {selectedItem && (
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-8 lg:p-20">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedItem(null)} className="fixed inset-0 bg-black/80 backdrop-blur-xl" />
              <motion.div layoutId={`card-${selectedItem.id}`} initial={{ scale: 0.9, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 40 }} className="relative w-full max-w-5xl bg-white dark:bg-[#1d1d1f] sm:rounded-[32px] rounded-t-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-[#d2d2d7] dark:border-[#303030] max-h-[95vh] sm:max-h-[90vh]">
                <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={24} /></button>
                <div className="hidden md:flex w-full md:w-1/2 bg-[#f5f5f7] dark:bg-black p-12 items-center justify-center"><Virtual3DModel type={selectedItem.type} quantity={selectedItem.totalQuantity || 1} isExpanded /></div>
                <div className="w-full md:w-1/2 p-6 sm:p-10 md:p-12 flex flex-col overflow-y-auto max-h-[90vh] md:max-h-full">
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#86868b] mb-4">Specifications</p>
                  <h2 className="text-4xl font-bold mb-4">{selectedItem.name}</h2>

                  {/* Real Photo Gallery */}
                  <div className="mb-8">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#86868b] mb-3">Real Photos</p>
                    <div className="flex flex-wrap gap-3">
                      {parsePhotos(selectedItem.photo_url).map((url, i) => (
                        <div key={i} className="relative group w-20 h-20 rounded-2xl overflow-hidden border border-[#d2d2d7] dark:border-[#303030] shadow-sm">
                          <DocumentPreview url={url} isThumbnail className="w-full h-full" onClick={() => window.open(url, '_blank')} />
                          {(isAdmin || isTeacher) && (
                            <button
                              onClick={async () => {
                                if (!token) return;
                                const currentPhotos = parsePhotos(selectedItem.photo_url);
                                const nextPhotos = currentPhotos.filter((_, idx) => idx !== i);
                                const res = await updateEquipmentAsAdmin(token, selectedItem.id, {
                                  photo_url: JSON.stringify(nextPhotos)
                                });
                                if (res.success) {
                                  setSelectedItem({ ...selectedItem, photo_url: JSON.stringify(nextPhotos) });
                                  fetchData();
                                }
                              }}
                              className="absolute inset-0 bg-rose-500/90 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-110 group-hover:scale-100"
                            >
                              <Trash2 size={16} />
                              <span className="text-[7px] font-black uppercase mt-1">Delete</span>
                            </button>
                          )}
                        </div>
                      ))}
                      {parsePhotos(selectedItem.photo_url).length === 0 && (
                        <div className="w-full p-6 rounded-2xl border-2 border-dashed border-[#d2d2d7] dark:border-[#303030] flex flex-col items-center justify-center opacity-30">
                          <History size={20} className="mb-1" />
                          <p className="text-[8px] font-black uppercase">No real photos attached</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 mb-8">
                    <div><p className="text-[9px] uppercase font-bold text-[#86868b] mb-1">Asset ID</p><p className="font-mono text-sm">{selectedItem.serial_number || 'N/A'}</p></div>
                    <div><p className="text-[9px] uppercase font-bold text-[#86868b] mb-1">Real Location</p><p className="text-sm font-black text-[#0066cc] uppercase tracking-wider">{(selectedItem as any).rooms?.length > 0 ? (selectedItem as any).rooms.join(', ') : selectedItem.room?.name || 'Unassigned Lobby'}</p></div>
                    <div><p className="text-[9px] uppercase font-bold text-[#86868b] mb-1">Status</p><p className="text-sm uppercase font-black">{selectedItem.status}</p></div>
                    <div><p className="text-[9px] uppercase font-bold text-[#86868b] mb-1">Availability</p><p className="text-sm font-bold">{selectedItemAvailability ? `${selectedItemAvailability.available} / ${selectedItemAvailability.total}` : `${selectedItem.availableQuantity} / ${selectedItem.totalQuantity}`}</p></div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 mb-6">
                    <button
                      onClick={() => setConditionHistoryOpen({ id: selectedItem.id, name: selectedItem.name })}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#f5f5f7] dark:bg-[#2c2c2e] border border-[#d2d2d7] dark:border-[#303030] text-[10px] font-black uppercase tracking-widest hover:border-emerald-500 hover:text-emerald-600 transition-all"
                    >
                      <Clock size={14} /> History
                    </button>
                  </div>

                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => setBarcodeModal({ name: selectedItem.name, serial: selectedItem.serial_number || 'N/A' })}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#1d1d1f] dark:bg-[#f5f5f7] text-white dark:text-[#1d1d1f] text-[10px] font-black uppercase tracking-widest hover:opacity-90 hover:shadow-xl hover:-translate-y-0.5 transition-all shadow-lg active:scale-95"
                      >
                        <LayoutPanelLeft size={14} /> Barcode
                      </button>
                      <button
                        onClick={() => setIsQRModalOpen(true)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white dark:bg-[#323235] border border-[#d2d2d7] dark:border-[#424245] text-[#1d1d1f] dark:text-[#f5f5f7] text-[10px] font-black uppercase tracking-widest hover:bg-[#f5f5f7] dark:hover:bg-[#3a3a3c] transition-all shadow-sm hover:shadow-md active:scale-95"
                      >
                        <QrCode size={14} /> View QR
                      </button>
                    </div>

                    {showClaimPreview ? (
                      <div className="mt-auto space-y-4 p-5 rounded-[25px] bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-xl text-blue-600 dark:text-blue-300">
                             <ClipboardCheck size={18} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#0066cc]">Confirm Borrow Request</p>
                            <p className="text-xs font-bold mt-1">You are requesting 1 unit of "{selectedItem.name}" for 7 days.</p>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                           <Button 
                             variant="secondary"
                             className="flex-1 py-4"
                             onClick={() => setShowClaimPreview(false)}
                           >
                             Cancel
                           </Button>
                           <Button
                             className="flex-[2] py-4 bg-gradient-to-r from-[#0066cc] to-[#004e9c] text-white hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] transition-all"
                             isLoading={isSubmittingClaim}
                             onClick={async () => {
                               if (!selectedItem) return;
                               const submitted = await onQuickBorrow(selectedItem.id);
                               if (submitted) {
                                  setSelectedItem(null);
                                  setShowClaimPreview(false);
                               }
                             }}
                           >
                             Confirm & Submit
                           </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        className="mt-auto w-full py-8 rounded-[25px] text-xs font-black uppercase tracking-[0.2em] bg-gradient-to-br from-[#1d1d1f] to-[#3a3a3c] dark:from-[#0066cc] dark:to-[#004e9c] text-white hover:shadow-2xl hover:shadow-blue-500/10 active:scale-[0.98] transition-all"
                        isLoading={isSubmittingClaim}
                        onClick={() => setShowClaimPreview(true)}
                        disabled={
                          isSubmittingClaim ||
                          selectedItem.status !== 'available' ||
                          (selectedItem.availableQuantity || 0) <= 0
                        }
                      >
                        Process Claim
                      </Button>
                    )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Condition History Modal */}
        {conditionHistoryOpen && token && (
          <ConditionHistoryModal
            isOpen={!!conditionHistoryOpen}
            onClose={() => setConditionHistoryOpen(null)}
            equipmentId={conditionHistoryOpen.id}
            equipmentName={conditionHistoryOpen.name}
            token={token}
          />
        )}

        {/* Barcode Modal */}
        {barcodeModal && (
          <BarcodeModal
            isOpen={!!barcodeModal}
            onClose={() => setBarcodeModal(null)}
            equipmentName={barcodeModal.name}
            serialNumber={barcodeModal.serial}
          />
        )}
      </div>

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onDetected={(code) => {
          setSearchTerm(code);
          showMessage(`Scanned: ${code}`);
          const match = groupedEquipment.find(e =>  e.serial_number === code || e.all_items.some(i => i.serial_number === code));
          if (match) {
            setSelectedItem(match);
          }
        }}
      />

      {/* QR Code Viewer Modal */}
      {isQRModalOpen && selectedItem && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4" onClick={() => setIsQRModalOpen(false)}>
           <motion.div 
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="bg-white dark:bg-[#1d1d1f] rounded-[32px] p-8 max-w-sm w-full border border-[#d2d2d7] dark:border-[#303030] shadow-2xl flex flex-col items-center"
             onClick={e => e.stopPropagation()}
           >
              <div className="w-full flex justify-between items-center mb-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#86868b]">Asset QR Code</p>
                <button onClick={() => setIsQRModalOpen(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><X size={16} /></button>
              </div>
              <div className="p-4 bg-white rounded-2xl border-2 border-[#f5f5f7] mb-6 shadow-inner">
                 <QRCode value={buildItemQrValue(selectedItem as any)} size={200} />
              </div>
              <h4 className="font-bold text-center mb-1">{selectedItem.name}</h4>
              <p className="text-[10px] font-mono text-[#86868b] mb-6 uppercase">{selectedItem.serial_number || 'NO_SERIAL'}</p>
              <Button className="w-full py-4 bg-[#1d1d1f] dark:bg-[#f5f5f7] text-white dark:text-[#1d1d1f] rounded-xl font-black text-[9px] uppercase tracking-widest" onClick={() => window.print()}>Print Label</Button>
           </motion.div>
        </div>
      )}

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

              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-[#86868b] tracking-widest ml-1">UI Model</p>
                <div className="grid grid-cols-4 gap-2">
                  {VECTOR_UI_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setEditEquipmentModal({ ...editEquipmentModal, type: opt.id })}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${editEquipmentModal.type === opt.id ? 'bg-[#0066cc] border-[#0066cc] text-white shadow-lg' : 'bg-white dark:bg-[#2c2c2e] border-[#d2d2d7] dark:border-[#303030] text-[#1d1d1f] dark:text-[#f5f5f7] hover:border-[#86868b]'}`}
                    >
                      <span className="text-lg mb-1">{opt.icon}</span>
                      <span className="text-[7px] font-black uppercase">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between ml-1 mb-2">
                  <p className="text-[10px] font-black uppercase text-[#86868b] tracking-widest">Real Photos</p>
                </div>
                <FileUploader
                  token={useAuthStore.getState().token || ''}
                  onUploadSuccess={(url) => setEditPhotoUrls(p => [...p, url])}
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  hintText="Supports Images Only (JPG, PNG)"
                />
                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-100 dark:border-slate-800">
                  {editPhotoUrls.map((url, i) => (
                    <div key={i} className="relative group w-14 h-14 rounded-lg overflow-hidden border border-[#d2d2d7] dark:border-[#303030]">
                      <DocumentPreview url={url} isThumbnail className="w-full h-full" />
                      <button onClick={() => setEditPhotoUrls(p => p.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-rose-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  {editPhotoUrls.length === 0 && <p className="text-[8px] italic text-[#86868b] w-full text-center py-2">No photos attached</p>}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-[#86868b] tracking-widest ml-1 flex items-center gap-1">
                  <Building size={10} /> Spatial Assignment
                </p>
                <select
                  value={editEquipmentModal.room_id || ''}
                  onChange={e => setEditEquipmentModal({ ...editEquipmentModal, room_id: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full h-12 px-4 rounded-[10px] bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-900/30 text-[#0066cc] text-[10px] font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                >
                  <option value="">Unassigned (No Room)</option>
                  {roomLocationOptions.map((room) => (
                    <option key={room.id} value={room.id}>{room.label}</option>
                  ))}
                </select>
              </div>
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
                  disabled={editUserModal.id === user?.id}
                  className="w-full h-12 px-4 rounded-[10px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Administrator</option>
                </select>
                {editUserModal.id === user?.id && (
                  <p className="text-[9px] text-amber-500 mt-1 italic">You cannot change your own role during an active session.</p>
                )}
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

      {conditionHistoryModal && token && (
        <ConditionHistoryModal
          isOpen={!!conditionHistoryModal}
          onClose={() => setConditionHistoryModal(null)}
          equipmentId={conditionHistoryModal.id}
          equipmentName={conditionHistoryModal.name}
          token={token}
        />
      )}

      <DashboardActionModal
        open={!!confirmDialog}
        title={confirmDialog?.title || ''}
        message={confirmDialog?.message || ''}
        confirmText={confirmDialog?.confirmText || 'Confirm'}
        cancelText={confirmDialog?.cancelText || 'Cancel'}
        variant={confirmDialog?.variant || 'danger'}
        onCancel={() => setConfirmDialog(null)}
        onConfirm={async () => {
          if (!confirmDialog) return;
          const action = confirmDialog.onConfirm;
          setConfirmDialog(null);
          await action();
        }}
      />

      <DashboardActionModal
        open={!!rejectDialog}
        title="Reject Request"
        message="Provide a reason for rejection (optional)."
        confirmText="Reject"
        cancelText="Cancel"
        variant="danger"
        input={{
          value: rejectDialog?.reason || '',
          onChange: (value) => setRejectDialog((prev) => (prev ? { ...prev, reason: value } : prev)),
          placeholder: 'Reason (optional)',
        }}
        onCancel={() => setRejectDialog(null)}
        onConfirm={handleRejectSubmit}
      />


      {userRoomModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4" onClick={() => setUserRoomModal(null)}>
          <div className="w-full max-w-lg rounded-[2rem] border border-[#d2d2d7] dark:border-[#303030] bg-[#f5f5f7] dark:bg-[#1d1d1f] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-8 space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black uppercase tracking-[0.2em] text-2xl text-[#1d1d1f] dark:text-white">Room Clearance</h3>
                  <p className="text-[10px] text-[#86868b] font-black uppercase tracking-widest mt-1">Teacher: {userRoomModal.user.username}</p>
                </div>
                <button onClick={() => setUserRoomModal(null)} className="p-3 rounded-2xl bg-white dark:bg-[#2c2c2e] text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white transition-all shadow-sm">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#86868b] ml-1">Current Assignments</p>
                <div className="flex flex-wrap gap-2">
                  {userRoomModal.rooms.length === 0 ? (
                    <p className="text-[10px] italic text-[#86868b] py-4 w-full text-center bg-white/50 dark:bg-black/20 rounded-2xl">No rooms assigned.</p>
                  ) : (
                    userRoomModal.rooms.map((room: any) => (
                      <div key={room.id} className="flex items-center gap-2 px-3 py-2 bg-[#0066cc] text-white rounded-xl shadow-lg animate-in fade-in zoom-in duration-300">
                        <span className="text-[10px] font-black uppercase tracking-wider">{room.name} ({room.type === 'storage' ? 'Storage' : 'Regular'})</span>
                        <button
                          onClick={async () => {
                            if (!token) return;
                            const res = await unassignUserFromRoom(token, userRoomModal.user.id, room.id);
                            if (res.success) {
                              const updated = await getUserRooms(token, userRoomModal.user.id);
                              if (updated.success && updated.data) setUserRoomModal({ ...userRoomModal, rooms: updated.data.assignedRooms });
                            }
                          }}
                          className="p-1 hover:bg-white/20 rounded-md transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-[#d2d2d7] dark:border-[#303030]">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#86868b] ml-1">All Campus Rooms</p>
                <div className="grid grid-cols-1 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {floors.map(floor => (
                    <div key={floor.id} className="space-y-2">
                      <p className="text-[9px] font-black text-[#0066cc] uppercase tracking-widest ml-1">{floor.name}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {floor.rooms.filter(room => room.type !== 'inactive').map(room => {
                          const isAssigned = userRoomModal.rooms.some(r => r.id === room.id);
                          return (
                            <button
                              key={room.id}
                              disabled={isAssigned}
                              onClick={async () => {
                                if (!token) return;
                                const res = await assignUserToRoom(token, userRoomModal.user.id, room.id);
                                if (res.success) {
                                  const updated = await getUserRooms(token, userRoomModal.user.id);
                                  if (updated.success && updated.data) setUserRoomModal({ ...userRoomModal, rooms: updated.data.assignedRooms });
                                }
                              }}
                              className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-left ${isAssigned
                                  ? 'bg-[#d2d2d7] dark:bg-[#303030] text-[#86868b] border-transparent opacity-50'
                                  : 'bg-white dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-white border border-[#d2d2d7] dark:border-[#303030] hover:border-[#0066cc] shadow-sm'
                                }`}
                            >
                              {room.name} ({room.type === 'storage' ? 'Storage' : 'Regular'})
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button className="w-full py-6 !rounded-[1.5rem] bg-[#1d1d1f] text-white dark:bg-[#f5f5f7] dark:text-[#1d1d1f] !font-black !uppercase !tracking-[0.2em]" onClick={() => setUserRoomModal(null)}>Finish Setup</Button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #86868b; border-radius: 10px; }` }} />
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
