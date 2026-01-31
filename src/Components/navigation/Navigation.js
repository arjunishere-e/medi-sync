import React, { useState } from 'react';
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
              // Restrict nurse strictly to Dashboard and Patients
              const nurseAllowed = new Set(['/', '/patients']);
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
            <Link to="/">
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

            {/* User Menu */}
            <div className="relative">
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
            // Restrict nurse strictly to Dashboard and Patients
            const nurseAllowed = new Set(['/', '/patients']);
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