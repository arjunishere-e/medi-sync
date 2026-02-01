import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '../api/base44Client';
import { firebaseClient } from '../api/firebaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "../Components/ui/card";
import { Button } from "../Components/ui/button";
import { Badge } from "../Components/ui/badge";
import { ScrollArea } from "../Components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../Components/ui/dialog";
import SystemStatus from "../Components/ui/SystemStatus";
import { 
  Users, 
  Activity, 
  AlertTriangle, 
  Bed,
  Bell,
  RefreshCw,
  Plus,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import StatsCard from '../Components/dashboard/StatsCard.js';
import PatientCard from '../Components/dashboard/PatientCard.js';
import AlertCard from '../Components/dashboard/AlertCard.js';
import VoiceAssistant from '../Components/voice/VoiceAssistant.js';

export default function OfficeDashboard() {
  console.log('OfficeDashboard component rendering...');
  const { user } = useAuth();
  const [showActiveStaff, setShowActiveStaff] = useState(false);
  const queryClient = useQueryClient();

  const { data: patientsData = [], isLoading: patientsLoading, error: patientsError } = useQuery({
    queryKey: ['patients'],
    queryFn: () => base44.entities.Patient.list('-created_date', 50),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
    onError: (error) => console.error('Error loading patients:', error)
  });

  // Deduplicate patients by email (or full_name as fallback)
  const patients = useMemo(() => {
    const seen = new Set();
    return patientsData.filter(patient => {
      const uniqueKey = patient.email || patient.full_name;
      if (seen.has(uniqueKey)) {
        console.log('Filtering duplicate patient:', patient.full_name);
        return false;
      }
      seen.add(uniqueKey);
      return true;
    });
  }, [patientsData]);

  const { data: alerts = [], isLoading: alertsLoading, error: alertsError } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const alertsData = await base44.entities.Alert.list('-created_date', 100); // Fetch alerts
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
    onError: (error) => console.error('Error loading alerts:', error),
    staleTime: 1000 * 30, // 30 seconds for live updates
    refetchInterval: 1000 * 30 // Poll every 30 seconds for real-time critical alerts
  });

  const { data: vitals = [] } = useQuery({
    queryKey: ['vitals'],
    queryFn: () => base44.entities.VitalReading.list('-timestamp', 200),
    onError: (error) => console.error('Error loading vitals:', error)
  });

  const { data: wards = [] } = useQuery({
    queryKey: ['wards'],
    queryFn: () => base44.entities.Ward.list(),
    onError: (error) => console.error('Error loading wards:', error)
  });

  const { data: staffSchedules = [] } = useQuery({
    queryKey: ['staff-schedules'],
    queryFn: () => base44.entities.StaffSchedule.list('-shift_date', 100),
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 20,
    onError: (error) => console.error('Error loading staff schedules:', error)
  });

  const updateAlertMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Alert.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] })
  });

  const handleAcknowledge = (alert) => {
    updateAlertMutation.mutate({
      id: alert.id,
      data: {
        status: 'acknowledged',
        acknowledged_by: user?.email,
        acknowledged_at: new Date().toISOString()
      }
    });
  };

  const handleResolve = (alert) => {
    updateAlertMutation.mutate({
      id: alert.id,
      data: {
        status: 'resolved',
        resolved_by: user?.email,
        resolved_at: new Date().toISOString()
      }
    });
  };

  // Get latest vitals for each patient
  const getLatestVitals = (patientId) => {
    return vitals.find(v => v.patient_id === patientId);
  };

  // Get alert count for patient
  const getAlertCount = (patientId) => {
    return alerts.filter(a => a.patient_id === patientId && a.status === 'active').length;
  };

  const [alertsTab, setAlertsTab] = useState('active');
  // Patient status alerts only; office sees critical/high severity patient status alerts
  const patientStatusAlerts = useMemo(() => {
    const base = alerts.filter(a => !!a.patient_id);
    // Filter for critical/high severity only, exclude appointments
    return base.filter(a => {
      const type = (a.alert_type || '').toString().toLowerCase();
      const text = `${a.title || ''} ${a.message || ''}`.toLowerCase();
      const isAppointmentType = ['appointment', 'appointment_confirmed', 'booking', 'appointment_booked'].includes(type);
      const mentionsAppointment = text.includes('appointment');
      const severity = (a.severity || '').toLowerCase();
      const isCritical = severity === 'critical' || severity === 'high';
      return !(isAppointmentType || mentionsAppointment) && isCritical;
    });
  }, [alerts, user]);
  const activeAlerts = patientStatusAlerts.filter(a => a.status === 'active');
  const acknowledgedAlerts = patientStatusAlerts.filter(a => a.status === 'acknowledged');
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical' || a.severity === 'high');
  
  // Count unique critical patients (not alerts)
  const criticalPatientIds = new Set(criticalAlerts.map(a => a.patient_id));
  const criticalPatientCount = criticalPatientIds.size;
  
  console.log('🚨 Active alerts count:', activeAlerts.length);
  console.log('🚨 Critical alerts count:', criticalAlerts.length);
  console.log('🚨 Critical patient count:', criticalPatientCount);
  console.log('🚨 Critical alerts:', criticalAlerts);
  const criticalPatients = patients.filter(p => p.status === 'critical');
  const totalBeds = wards.reduce((sum, w) => sum + (w.total_beds || 0), 0);

  // Compute ward occupancy from current patients (exclude discharged)
  const wardOccupancy = useMemo(() => {
    const map = new Map();
    wards.forEach(w => map.set(w.id, 0));
    patients.forEach(p => {
      if (p.ward_id && p.status !== 'discharged') {
        map.set(p.ward_id, (map.get(p.ward_id) || 0) + 1);
      }
    });
    return map;
  }, [patients, wards]);
  
  // Count active staff from today's schedule
  const today = new Date().toISOString().split('T')[0];
  const activeStaff = staffSchedules.filter(s => s.shift_date?.includes(today) || s.date?.includes(today));
  const activeNurses = activeStaff.filter(s => s.staff_role === 'nurse').length;
  const activeDoctors = activeStaff.filter(s => s.staff_role === 'doctor').length;

  const handleVoiceCommand = (action, patientName) => {
    console.log('Voice command:', action, patientName);
    // Handle voice commands here
  };

  // Show loading state
  if (patientsLoading && alertsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-slate-700">Loading Office Dashboard...</h2>
          <p className="text-slate-500 mt-2">Please wait while we load your data</p>
        </div>
      </div>
    );
  }

  // Show error state if critical data failed to load
  if (patientsError && alertsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Unable to Load Dashboard</h2>
          <p className="text-slate-500 mb-4">There was an error loading the dashboard data. Please check your connection and try again.</p>
          <Button onClick={() => window.location.reload()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-8">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900">
              Office Dashboard
            </h1>
            <p className="text-slate-500 mt-1">
              Welcome back, {user?.full_name || 'Office Staff'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 lg:gap-4">
            <Button 
              variant="outline" 
              onClick={() => queryClient.invalidateQueries()}
              className="gap-2 w-full sm:w-auto"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Link to="/patient-registration" className="w-full sm:w-auto">
              <Button className="gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 w-full">
                <Plus className="h-4 w-4" />
                Add Patient
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Link to="/patients" className="block focus:outline-none focus:ring-2 focus:ring-blue-400 rounded">
            <StatsCard
              title="Total Patients"
              value={patients.length}
              subtitle={`${criticalPatients.length} critical`}
              icon={Users}
              color="blue"
            />
          </Link>
          <Link to="/alerts" className="block focus:outline-none focus:ring-2 focus:ring-blue-400 rounded">
            <StatsCard
              title="Active Alerts"
              value={activeAlerts.length}
              subtitle={`${criticalAlerts.length} critical`}
              icon={AlertTriangle}
              color="red"
            />
          </Link>
          <Link to="/ward-management" className="block focus:outline-none focus:ring-2 focus:ring-blue-400 rounded">
            <StatsCard
              title="Bed Occupancy"
              value={`${Array.from(wardOccupancy.values()).reduce((a,b)=>a+b,0)}/${totalBeds}`}
              subtitle={`${Math.round(((Array.from(wardOccupancy.values()).reduce((a,b)=>a+b,0))/ (totalBeds || 1))*100) || 0}% occupied`}
              icon={Bed}
              color="green"
            />
          </Link>
          <button
            type="button"
            onClick={() => setShowActiveStaff(true)}
            className="block w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
          >
            <StatsCard
              title="Active Staff"
              value={activeStaff.length}
              subtitle={`${activeDoctors} doctors, ${activeNurses} nurses`}
              icon={Activity}
              color="purple"
            />
          </button>
        </div>

        {/* Active Staff Widget */}
        <Dialog open={showActiveStaff} onOpenChange={setShowActiveStaff}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Active Staff Today</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">Doctors ({activeStaff.filter(s => s.staff_role === 'doctor').length})</h4>
                {activeStaff.filter(s => s.staff_role === 'doctor').length === 0 ? (
                  <p className="text-xs text-slate-500">No doctors on duty</p>
                ) : (
                  <ul className="divide-y divide-slate-200">
                    {activeStaff
                      .filter(s => s.staff_role === 'doctor')
                      .map((s, idx) => (
                        <li key={`${s.id || idx}` } className="py-2 flex items-center justify-between">
                          <div>
                            <p className="font-medium text-slate-900">{s.staff_name}</p>
                            <p className="text-xs text-slate-500">{(wards.find(w => w.id === s.ward_id)?.name) || 'Unassigned'} • {s.shift_type?.replace('_',' ') || 'shift'} </p>
                          </div>
                          <Badge variant="secondary">{s.start_time} - {s.end_time}</Badge>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2">Nurses ({activeStaff.filter(s => s.staff_role === 'nurse').length})</h4>
                {activeStaff.filter(s => s.staff_role === 'nurse').length === 0 ? (
                  <p className="text-xs text-slate-500">No nurses on duty</p>
                ) : (
                  <ul className="divide-y divide-slate-200">
                    {activeStaff
                      .filter(s => s.staff_role === 'nurse')
                      .map((s, idx) => (
                        <li key={`${s.id || idx}` } className="py-2 flex items-center justify-between">
                          <div>
                            <p className="font-medium text-slate-900">{s.staff_name}</p>
                            <p className="text-xs text-slate-500">{(wards.find(w => w.id === s.ward_id)?.name) || 'Unassigned'} • {s.shift_type?.replace('_',' ') || 'shift'}</p>
                          </div>
                          <Badge variant="secondary">{s.start_time} - {s.end_time}</Badge>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Link to="/staff-scheduling"><Button variant="outline">Manage Scheduling</Button></Link>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patients Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Patients Overview</CardTitle>
                  <Link to="/patients">
                    <Button variant="ghost" size="sm" className="gap-1">
                      View All <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {patientsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin text-slate-300" />
                  </div>
                ) : patients.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                    <h3 className="text-lg font-medium text-slate-900 mb-1">No patients yet</h3>
                    <p className="text-slate-500 mb-4">Get started by adding your first patient</p>
                    <Link to="/patient-registration">
                      <Button>Add Patient</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {patients.slice(0, 6).map(patient => (
                      <Link 
                        key={patient.id} 
                        to={`/patients/${patient.id}`}
                      >
                        <PatientCard
                          patient={patient}
                          latestVitals={getLatestVitals(patient.id)}
                          alertCount={getAlertCount(patient.id)}
                          ctaAsButton
                          wards={wards}
                        />
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Alerts Section */}
          <div className="lg:col-span-1 flex flex-col gap-6" id="alerts">
            <Card className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Alerts
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="rounded-md border border-slate-200 p-1 bg-white">
                      <button
                        className={`px-2 py-1 text-xs rounded ${alertsTab==='active' ? 'bg-slate-900 text-white' : 'text-slate-700'}`}
                        onClick={() => setAlertsTab('active')}
                      >Active ({activeAlerts.length})</button>
                      <button
                        className={`px-2 py-1 text-xs rounded ${alertsTab==='ack' ? 'bg-slate-900 text-white' : 'text-slate-700'}`}
                        onClick={() => setAlertsTab('ack')}
                      >Acknowledged ({acknowledgedAlerts.length})</button>
                    </div>
                    {criticalAlerts.length > 0 && (
                      <Badge variant="destructive" className="animate-pulse">
                        {criticalPatientCount} Critical
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {alertsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-slate-300" />
                  </div>
                ) : (alertsTab === 'active' ? activeAlerts : acknowledgedAlerts).length === 0 ? (
                  <div className="text-center py-8 flex flex-col items-center justify-center flex-1">
                    <AlertTriangle className="h-10 w-10 text-slate-300 mb-2" />
                    <p className="text-slate-500">No {(alertsTab==='active') ? 'active' : 'acknowledged'} alerts</p>
                    <p className="text-xs text-slate-400 mt-1">All systems healthy</p>
                  </div>
                ) : (
                  <ScrollArea className="pr-4 flex-1">
                    <div className="space-y-2">
                      {/* Critical Alerts First for Active tab */}
                      {alertsTab==='active' && criticalAlerts.length > 0 && (
                        <div className="mb-3">
                          <div className="text-xs font-bold text-red-600 uppercase mb-2 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Critical ({criticalPatientCount} patient{criticalPatientCount !== 1 ? 's' : ''})
                          </div>
                          <div className="space-y-2">
                            {Array.from(criticalPatientIds).map(patientId => {
                              // Get the most recent alert for this patient
                              const patientAlerts = criticalAlerts.filter(a => a.patient_id === patientId);
                              const mostRecentAlert = patientAlerts.sort((a, b) => 
                                new Date(b.created_date) - new Date(a.created_date)
                              )[0];
                              
                              return (
                                <AlertCard
                                  key={mostRecentAlert.id}
                                  alert={mostRecentAlert}
                                  onAcknowledge={handleAcknowledge}
                                  compact
                                  className="mr-2"
                                />
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      {/* Other Alerts list (Active or Acknowledged) */}
                      {(alertsTab==='active' 
                        ? activeAlerts.filter(a => a.severity !== 'critical' && a.severity !== 'high')
                        : acknowledgedAlerts).length > 0 && (
                        <div>
                          {alertsTab==='active' && criticalAlerts.length > 0 && (
                            <div className="text-xs font-bold text-slate-500 uppercase mb-2">
                              Other Alerts
                            </div>
                          )}
                          <div className="space-y-2">
                            {(alertsTab==='active' 
                              ? activeAlerts.filter(a => a.severity !== 'critical' && a.severity !== 'high')
                              : acknowledgedAlerts).map(alert => (
                              <AlertCard
                                key={alert.id}
                                alert={alert}
                                onAcknowledge={handleAcknowledge}
                                compact
                                className="mr-2"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* System Status Card */}
            <Card>
              <SystemStatus />
            </Card>
          </div>
        </div>

        {/* Ward Overview Section */}
        <div className="mt-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bed className="h-5 w-5" />
                  Ward Status Overview
                </CardTitle>
                <Link to="/ward-management">
                  <Button variant="ghost" size="sm" className="gap-1">
                    Manage Wards <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {wards.length === 0 ? (
                <div className="text-center py-8">
                  <Bed className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500">No wards configured</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {wards.map(ward => {
                    const occ = wardOccupancy.get(ward.id) || 0;
                    const total = ward.total_beds || 0;
                    const available = Math.max(total - occ, 0);
                    const ratio = total > 0 ? (occ / total) : 0;
                    return (
                    <div key={ward.id} className="p-4 border border-slate-200 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-slate-900">{ward.name}</h3>
                          <p className="text-xs text-slate-600 mt-1">{ward.department}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Occupancy</span>
                          <span className="font-semibold text-slate-900">
                            {occ}/{total}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition ${
                              ratio >= 0.8 ? 'bg-red-500' : ratio >= 0.5 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${ratio * 100}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-slate-600 pt-1">
                          <span>Available: {available}</span>
                          <span>Staff: {ward.staff_count || 0}</span>
                        </div>
                      </div>
                    </div>
                  );})}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <VoiceAssistant onCommand={handleVoiceCommand} userRole={user?.role || 'staff'} />
    </div>
  );
}
