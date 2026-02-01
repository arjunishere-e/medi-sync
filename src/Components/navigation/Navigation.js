import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { firebaseClient } from '../../api/firebaseClient';
import { base44 } from '../../api/base44Client';
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Building2,
  Stethoscope,
  Bell,
  LogOut,
  ChevronDown
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['doctor', 'patient', 'nurse', 'office'] },
  { name: 'Patients', href: '/patients', icon: Users, roles: ['doctor', 'nurse', 'office'] },
  { name: 'Staff Scheduling', href: '/staff-scheduling', icon: Calendar, roles: ['office'] },
  { name: 'Ward Management', href: '/ward-management', icon: Building2, roles: ['office'] },
];

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAppointments, setShowAppointments] = useState(false);
  const userMenuRef = useRef(null);
  const appointmentsRef = useRef(null);

  // Close popups on outside click or Escape
  useEffect(() => {
    const handleGlobalClick = (e) => {
      // Close user menu if clicking outside
      if (showUserMenu && userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
      // Close appointments popup if clicking outside
      if (showAppointments && appointmentsRef.current && !appointmentsRef.current.contains(e.target)) {
        setShowAppointments(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showUserMenu) setShowUserMenu(false);
        if (showAppointments) setShowAppointments(false);
      }
    };
    document.addEventListener('mousedown', handleGlobalClick);
    document.addEventListener('touchstart', handleGlobalClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleGlobalClick);
      document.removeEventListener('touchstart', handleGlobalClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showUserMenu, showAppointments]);

  // Close any open popups on route change (applies across dashboards)
  useEffect(() => {
    setShowUserMenu(false);
    setShowAppointments(false);
  }, [location.pathname]);

  // Fetch critical alerts - real-time updates every 30 seconds
  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const alertsData = await base44.entities.Alert.list('-created_date', 100);
      // Ensure alerts have required fields and valid timestamps
      return alertsData.map(alert => ({
        ...alert,
        status: alert.status || 'active',
        severity: alert.severity || 'medium',
        created_date: alert.created_date && !isNaN(new Date(alert.created_date)) 
          ? alert.created_date 
          : new Date().toISOString()
      }));
    },
    staleTime: 1000 * 30, // 30 seconds for live updates
    refetchInterval: 1000 * 30 // Poll every 30 seconds for real-time critical alerts
  });

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical' || a.severity === 'high');
  
  // Count unique critical patients (not alerts)
  const criticalPatientIds = new Set(criticalAlerts.map(a => a.patient_id));
  const criticalCount = criticalPatientIds.size;

  // Office notifications: appointments grouped by doctor
  const { data: appointments = [] } = useQuery({
    queryKey: ['nav-appointments'],
    queryFn: async () => {
      try {
        const list = await firebaseClient.appointments.list();
        return Array.isArray(list) ? list : [];
      } catch (e) {
        console.error('Error loading appointments for nav:', e);
        return [];
      }
    },
    enabled: user?.role === 'office',
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  const upcomingAppointments = useMemo(() => {
    const today = new Date();
    return appointments.filter(a => {
      if (a.status && a.status !== 'booked') return false;
      if (!a.appointment_date) return false;
      const dt = new Date(`${a.appointment_date}T${a.appointment_time || '00:00'}`);
      // Show today and future
      return dt >= new Date(today.getFullYear(), today.getMonth(), today.getDate());
    });
  }, [appointments]);

  const appointmentsByDoctor = useMemo(() => {
    const map = new Map();
    for (const apt of upcomingAppointments) {
      const key = apt.doctor_id || apt.doctor_name || 'Unknown Doctor';
      if (!map.has(key)) map.set(key, { doctorName: apt.doctor_name || 'Unknown Doctor', items: [] });
      map.get(key).items.push(apt);
    }
    // Sort each doctor's items by date/time ascending
    for (const entry of map.values()) {
      entry.items.sort((a, b) => {
        const da = new Date(`${a.appointment_date}T${a.appointment_time || '00:00'}`);
        const db = new Date(`${b.appointment_date}T${b.appointment_time || '00:00'}`);
        return da - db;
      });
    }
    return Array.from(map.values()).sort((a, b) => a.doctorName.localeCompare(b.doctorName));
  }, [upcomingAppointments]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          <div className="flex items-center flex-shrink-0">
            <Stethoscope className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">MediSync</span>
          </div>
          <div className="hidden md:flex md:space-x-2 lg:space-x-6 flex-1 justify-center">
            {navigation.map((item) => {
              // Restrict nurse strictly to Dashboard, Patients and Alerts
              const nurseAllowed = new Set(['/', '/patients', '/alerts']);
              if (user?.role === 'nurse' && !nurseAllowed.has(item.href)) return null;

              // Only show items for current user's role
              if (!item.roles.includes(user?.role)) return null;

              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`inline-flex items-center px-2 py-1 border-b-2 text-sm font-medium whitespace-nowrap ${
                    isActive
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-1" />
                  <span className="hidden lg:inline">{item.name}</span>
                </Link>
              );
            })}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            {user?.role !== 'patient' && (
              <Link to="/alerts">
                <Button variant="outline" size="sm" className="gap-2 whitespace-nowrap">
                  <Bell className="h-4 w-4" />
                  <span className="hidden sm:inline">Alerts</span>
                  {criticalCount > 0 && (
                    <Badge variant="destructive" className="ml-0 sm:ml-1 animate-pulse">
                      {criticalCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            )}

            {/* Office: Appointments Notification */}
            {user?.role === 'office' && (
              <div className="relative" ref={appointmentsRef}>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 whitespace-nowrap"
                  onClick={() => setShowAppointments(!showAppointments)}
                >
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Appointments</span>
                  {upcomingAppointments.length > 0 && (
                    <Badge className="ml-0 sm:ml-1">{upcomingAppointments.length}</Badge>
                  )}
                </Button>
                {showAppointments && (
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">Upcoming Appointments</p>
                      <p className="text-xs text-gray-500 mt-1">Grouped by doctor</p>
                    </div>
                    <div className="max-h-96 overflow-auto">
                      {appointmentsByDoctor.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500">No upcoming appointments</div>
                      ) : (
                        appointmentsByDoctor.map(group => (
                          <div key={group.doctorName} className="border-b border-gray-100">
                            <div className="px-4 py-2 bg-gray-50 flex items-center justify-between">
                              <div className="text-sm font-semibold text-gray-800">{group.doctorName}</div>
                              <Badge variant="outline">{group.items.length}</Badge>
                            </div>
                            <ul className="divide-y divide-gray-100">
                              {group.items.map(item => (
                                <li key={item.id} className="px-4 py-2 text-sm">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-gray-900">{item.patient_name}</span>
                                    <span className="text-gray-700">
                                      {item.appointment_time || '—'}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {item.appointment_date}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 whitespace-nowrap"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500 mt-1 capitalize">{user?.role}</p>
                    <p className="text-xs text-gray-400 mt-1">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden border-t border-gray-100">
        <div className="pt-2 pb-3 space-y-1 px-2">
          {navigation.map((item) => {
            // Restrict nurse strictly to Dashboard, Patients and Alerts
            const nurseAllowed = new Set(['/', '/patients', '/alerts']);
            if (user?.role === 'nurse' && !nurseAllowed.has(item.href)) return null;

            // Only show items for current user's role
            if (!item.roles.includes(user?.role)) return null;

            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <div className="flex items-center">
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}