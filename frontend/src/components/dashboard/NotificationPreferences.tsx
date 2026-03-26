import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Package, Clock, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface NotifPrefs {
  requestStatusEmails: boolean;
  lowStockAlerts: boolean;
  overdueReminders: boolean;
}

const STORAGE_KEY = 'sims_notif_prefs';

const defaultPrefs: NotifPrefs = {
  requestStatusEmails: true,
  lowStockAlerts: true,
  overdueReminders: true,
};

interface Props {
  role: 'student' | 'teacher' | 'admin';
}

const Toggle: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}> = ({ checked, onChange, id }) => (
  <button
    id={id}
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#0066cc]/50 shrink-0 ${
      checked ? 'bg-[#0066cc]' : 'bg-[#d2d2d7] dark:bg-[#3a3a3c]'
    }`}
  >
    <motion.span
      layout
      className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md"
      animate={{ x: checked ? 20 : 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    />
  </button>
);

export const NotificationPreferences: React.FC<Props> = ({ role }) => {
  const [prefs, setPrefs] = useState<NotifPrefs>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...defaultPrefs, ...JSON.parse(saved) } : defaultPrefs;
    } catch {
      return defaultPrefs;
    }
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    setSaved(true);
    const t = setTimeout(() => setSaved(false), 1500);
    return () => clearTimeout(t);
  }, [prefs]);

  const set = (key: keyof NotifPrefs, val: boolean) =>
    setPrefs(prev => ({ ...prev, [key]: val }));

  const notifs = [
    {
      id: 'requestStatusEmails',
      label: 'Request Status Alerts',
      desc: 'Get notified when your borrow requests are approved or rejected.',
      icon: Bell,
      roles: ['student', 'teacher', 'admin'],
    },
    {
      id: 'lowStockAlerts',
      label: 'Low Stock Warnings',
      desc: 'Alert when any equipment type falls below the critical threshold.',
      icon: AlertTriangle,
      roles: ['teacher', 'admin'],
    },
    {
      id: 'overdueReminders',
      label: 'Overdue Return Reminders',
      desc: 'Reminder notifications for unreturned equipment past due dates.',
      icon: Clock,
      roles: ['admin'],
    },
  ].filter(n => n.roles.includes(role));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] uppercase font-black tracking-widest text-[#86868b]">
          Notification Settings
        </p>
        {saved && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-[8px] uppercase font-black tracking-widest text-emerald-500"
          >
            Saved ✓
          </motion.span>
        )}
      </div>

      {notifs.map(({ id, label, desc, icon: Icon }) => (
        <div
          key={id}
          className="p-4 bg-white dark:bg-[#1d1d1f] rounded-2xl border border-[#d2d2d7] dark:border-[#303030] flex items-start gap-4 transition-all"
        >
          <div className="w-9 h-9 rounded-xl bg-[#f5f5f7] dark:bg-[#2c2c2e] flex items-center justify-center shrink-0 mt-0.5">
            <Icon size={16} className="text-[#1d1d1f] dark:text-[#f5f5f7] opacity-60" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-black uppercase tracking-wide text-[#1d1d1f] dark:text-[#f5f5f7] leading-tight">
              {label}
            </p>
            <p className="text-[9px] text-[#86868b] leading-relaxed mt-0.5">{desc}</p>
          </div>
          <Toggle
            id={`toggle-${id}`}
            checked={prefs[id as keyof NotifPrefs]}
            onChange={val => set(id as keyof NotifPrefs, val)}
          />
        </div>
      ))}

      <div className="p-4 rounded-2xl bg-[#f5f5f7] dark:bg-[#1d1d1f] border border-dashed border-[#d2d2d7] dark:border-[#303030]">
        <div className="flex items-center gap-2 mb-1">
          <Package size={12} className="text-[#86868b]" />
          <p className="text-[9px] font-black uppercase tracking-widest text-[#86868b]">About Notifications</p>
        </div>
        <p className="text-[9px] text-[#86868b] leading-relaxed">
          These settings control in-app notification banners. Email delivery is managed by your school administrator. Preferences are saved locally on this device.
        </p>
      </div>

      <div className="flex items-center gap-2 pt-2">
        {prefs.requestStatusEmails || prefs.lowStockAlerts || prefs.overdueReminders ? (
          <Bell size={12} className="text-[#0066cc]" />
        ) : (
          <BellOff size={12} className="text-[#86868b]" />
        )}
        <p className="text-[9px] text-[#86868b] font-medium">
          {[prefs.requestStatusEmails, prefs.lowStockAlerts, prefs.overdueReminders].filter(Boolean).length} of{' '}
          {notifs.length} notification{notifs.length !== 1 ? 's' : ''} enabled
        </p>
      </div>
    </div>
  );
};

export default NotificationPreferences;
