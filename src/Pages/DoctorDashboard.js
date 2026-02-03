import React, { useState, useMemo } from 'react';
import { firebaseClient } from '../api/firebaseClient';
import { base44 } from '../api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "../Components/ui/card";
import { Button } from "../Components/ui/button";
import { Badge } from "../Components/ui/badge";
import { ScrollArea } from "../Components/ui/scroll-area";
import SystemStatus from "../Components/ui/SystemStatus";
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  Activity, 
  AlertTriangle, 
  Stethoscope,
  RefreshCw,
  CheckCircle,
  Clock,
  FileText,
  Pill,
  Bed,
  ChevronRight,
  Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import StatsCard from '../Components/dashboard/StatsCard.js';
import PatientCard from '../Components/dashboard/PatientCard.js';
import AlertCard from '../Components/dashboard/AlertCard.js';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [medicineForm, setMedicineForm] = useState({ name: '', dosage: '', frequency: '', duration: '' });
  const [vitalForm, setVitalForm] = useState({ blood_pressure: '', heart_rate: '', temperature: '', spo2: '', notes: '' });
  const [showMedicineForm, setShowMedicineForm] = useState(false);
  const [showVitalForm, setShowVitalForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: patientsData = [], isLoading: patientsLoading } = useQuery({
    queryKey: ['all-patients', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      // Fetch only patients referred to this specific doctor
      const result = await firebaseClient.patients.list('-created_date', 100);
      console.log('DoctorDashboard - Fetched all patients:', result);
      console.log('DoctorDashboard - Current doctor ID:', user.id);
      
      // Filter to show only patients referred to this doctor
      const myPatients = result.filter(patient => {
        const referredId = patient.referred_doctor_id || patient.doctor_id;
        const isReferred = referredId === user.id;
        console.log(`Patient ${patient.full_name}: referred_doctor_id=${patient.referred_doctor_id}, doctor_id=${patient.doctor_id}, user.id=${user.id}, matches=${isReferred}`);
        return isReferred;
      });
      
      console.log('DoctorDashboard - My referred patients count:', myPatients.length);
      console.log('DoctorDashboard - My referred patients:', myPatients);
      return myPatients;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    onError: (error) => {
      console.error('Error fetching patients in DoctorDashboard:', error);
    }
  });

  // Deduplicate patients by ID (each patient should have unique ID from Firestore)
  const patients = useMemo(() => {
    const seen = new Set();
    return patientsData.filter(patient => {
      if (!patient.id) return false; // Skip if no ID
      if (seen.has(patient.id)) {
        console.log('Filtering duplicate patient ID:', patient.id, patient.full_name);
        return false;
      }
      seen.add(patient.id);
      return true;
    });
  }, [patientsData]);

  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => firebaseClient.alerts.list('-created_date', 100)
  });

  const { data: vitals = [] } = useQuery({
    queryKey: ['vitals'],
    queryFn: () => firebaseClient.vitals.list('-timestamp', 200)
  });

  const { data: staffSchedules = [] } = useQuery({
    queryKey: ['staff-schedules'],
    queryFn: () => base44.entities.StaffSchedule.list('-shift_date', 100),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 20,
    onError: (error) => console.error('Error loading staff schedules:', error)
  });

  const { data: wards = [] } = useQuery({
    queryKey: ['wards'],
    queryFn: () => base44.entities.Ward.list(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    onError: (error) => console.error('Error loading wards:', error)
  });

  // Fetch doctor's appointments
  const { data: appointments = [] } = useQuery({
    queryKey: ['my-appointments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        return await firebaseClient.appointments.getByDoctor(user.id);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        return [];
      }
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // Refresh every 30 seconds
  });

  // Calculate correct token number for each appointment based on date and doctor
  const getTokenNumberForAppointment = (appointment) => {
    if (!appointment) return 0;
    // Filter appointments for the same date and doctor, excluding cancelled ones
    const appointmentsOnSameDate = appointments.filter(apt => 
      apt.appointment_date === appointment.appointment_date && 
      apt.doctor_id === appointment.doctor_id &&
      apt.status !== 'cancelled'
    );
    // Sort by time to assign sequential token numbers
    const sortedAppointments = appointmentsOnSameDate.sort((a, b) => {
      const timeA = a.appointment_time || '00:00';
      const timeB = b.appointment_time || '00:00';
      return timeA.localeCompare(timeB);
    });
    // Find the index of the current appointment
    const index = sortedAppointments.findIndex(apt => 
      apt.id === appointment.id || 
      (apt.appointment_time === appointment.appointment_time && apt.patient_id === appointment.patient_id)
    );
    return index + 1;
  };

  // Mutation to prescribe medicine
  const prescribeMedicineMutation = useMutation({
    mutationFn: async (medicineData) => {
      console.log('🔥 Doctor prescribing medicine for patient:', selectedPatient.id);
      const medicine = {
        patient_id: selectedPatient.id,
        doctor_id: user?.id,
        name: medicineData.name,
        dosage: medicineData.dosage,
        frequency: medicineData.frequency,
        duration: medicineData.duration,
        prescribed_date: new Date().toISOString(),
        status: 'active'
      };
      console.log('📤 Medicine data being sent:', medicine);
      return firebaseClient.medicines.create(medicine);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicines'] });
      setMedicineForm({ name: '', dosage: '', frequency: '', duration: '' });
      setShowMedicineForm(false);
    }
  });

  // Mutation to enter vitals
  const enterVitalsMutation = useMutation({
    mutationFn: async (vitalData) => {
      console.log('📊 Doctor recording vitals for patient:', selectedPatient.id);
      const vital = {
        patient_id: selectedPatient.id,
        doctor_id: user?.id,
        blood_pressure: vitalData.blood_pressure,
        heart_rate: parseInt(vitalData.heart_rate),
        temperature: parseFloat(vitalData.temperature),
        spo2: parseInt(vitalData.spo2),
        notes: vitalData.notes,
        timestamp: new Date().toISOString()
      };
      console.log('📤 Vital data being sent:', vital);
      return firebaseClient.vitals.create(vital);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vitals', 'patient-vitals'] });
      setVitalForm({ blood_pressure: '', heart_rate: '', temperature: '', spo2: '', notes: '' });
      setShowVitalForm(false);
    }
  });

  const handlePrescribeMedicine = () => {
    if (!selectedPatient) {
      alert('Please select a patient first');
      return;
    }
    if (!medicineForm.name || !medicineForm.dosage || !medicineForm.frequency) {
      alert('Please fill all medicine fields');
      return;
    }
    prescribeMedicineMutation.mutate(medicineForm);
  };

  const handleEnterVitals = () => {
    if (!selectedPatient) {
      alert('Please select a patient first');
      return;
    }
    if (!vitalForm.blood_pressure || !vitalForm.heart_rate || !vitalForm.temperature || !vitalForm.spo2) {
      alert('Please fill all vital fields');
      return;
    }
    enterVitalsMutation.mutate(vitalForm);
  };

  const getLatestVitals = (patientId) => {
    return vitals.find(v => v.patient_id === patientId);
  };

  const getAlertCount = (patientId) => {
    return alerts.filter(a => a.patient_id === patientId && a.status === 'active').length;
  };

  const criticalPatients = patients.filter(p => p.status === 'critical');
  // Patient status alerts only
  const patientStatusAlerts = useMemo(
    () => alerts.filter(a => !!a.patient_id),
    [alerts]
  );
  const [alertsTab, setAlertsTab] = useState('active');
  const activeAlerts = patientStatusAlerts.filter(a => a.status === 'active');
  const acknowledgedAlerts = patientStatusAlerts.filter(a => a.status === 'acknowledged');
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical' || a.severity === 'high');
  
  // Count unique critical patients (not alerts)
  const criticalPatientIds = new Set(criticalAlerts.map(a => a.patient_id));
  const criticalPatientCount = criticalPatientIds.size;
  
  const pendingReports = Math.floor(Math.random() * 5) + 3;

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

  if (patientsLoading && alertsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-slate-700">Loading Doctor Dashboard...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 bg-white rounded-lg shadow p-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900">Doctor Dashboard</h1>
            <p className="text-slate-600 mt-1">
              Welcome, Dr. {user?.name} • {patients.length} patients
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => queryClient.invalidateQueries()}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <button
            type="button"
            onClick={() => document.getElementById('patients')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="bg-white rounded-lg p-4 shadow text-left w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <p className="text-sm text-slate-600 font-semibold">Total Patients</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{patients.length}</p>
          </button>
          <button
            type="button"
            onClick={() => document.getElementById('critical')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="bg-white rounded-lg p-4 shadow text-left w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <p className="text-sm text-slate-600 font-semibold">Critical</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{criticalPatients.length}</p>
          </button>
          <button
            type="button"
            onClick={() => document.getElementById('alerts')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="bg-white rounded-lg p-4 shadow text-left w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <p className="text-sm text-slate-600 font-semibold">Alerts</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">{activeAlerts.length}</p>
          </button>
          <button
            type="button"
            onClick={() => document.getElementById('patients')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="bg-white rounded-lg p-4 shadow text-left w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <p className="text-sm text-slate-600 font-semibold">Reports</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">{pendingReports}</p>
          </button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Select Patient */}
          <Card className="shadow" id="patients">
            <CardHeader className="bg-blue-50 pb-3">
              <CardTitle className="text-base">Select Patient</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <select
                value={selectedPatient?.id || ''}
                onChange={(e) => {
                  const patient = patients.find(p => p.id === e.target.value);
                  setSelectedPatient(patient);
                }}
                className="w-full p-2 border border-slate-300 rounded text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">-- Select Patient --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.status})
                  </option>
                ))}
              </select>
              
              {selectedPatient && (
                <div className="mt-4 p-3 bg-slate-50 rounded border border-slate-200">
                  <p className="text-sm font-semibold text-slate-900">{selectedPatient.full_name}</p>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-slate-600">
                    <div>Age: {selectedPatient.age}</div>
                    <div>Bed: {selectedPatient.bed_number}</div>
                    <div>Status: <span className={selectedPatient.status === 'critical' ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>{selectedPatient.status}</span></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Prescribe Medicine */}
          <Card className="shadow" id="critical">
            <CardHeader className="bg-green-50 pb-3">
              <CardTitle className="text-base">Prescribe Medicine</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {!showMedicineForm ? (
                <Button
                  onClick={() => setShowMedicineForm(true)}
                  disabled={!selectedPatient}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Add Medicine
                </Button>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Medicine name"
                    value={medicineForm.name}
                    onChange={(e) => setMedicineForm({...medicineForm, name: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Dosage"
                    value={medicineForm.dosage}
                    onChange={(e) => setMedicineForm({...medicineForm, dosage: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Frequency"
                    value={medicineForm.frequency}
                    onChange={(e) => setMedicineForm({...medicineForm, frequency: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Duration"
                    value={medicineForm.duration}
                    onChange={(e) => setMedicineForm({...medicineForm, duration: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded text-sm"
                  />
                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={handlePrescribeMedicine}
                      disabled={prescribeMedicineMutation.isPending}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {prescribeMedicineMutation.isPending ? 'Saving...' : 'Add'}
                    </Button>
                    <Button 
                      onClick={() => setShowMedicineForm(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Record Vitals */}
          <Card className="shadow">
            <CardHeader className="bg-red-50 pb-3">
              <CardTitle className="text-base">Record Vitals</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {!showVitalForm ? (
                <Button
                  onClick={() => setShowVitalForm(true)}
                  disabled={!selectedPatient}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  Add Vitals
                </Button>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="BP (120/80)"
                    value={vitalForm.blood_pressure}
                    onChange={(e) => setVitalForm({...vitalForm, blood_pressure: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded text-sm"
                  />
                  <input
                    type="number"
                    placeholder="HR (bpm)"
                    value={vitalForm.heart_rate}
                    onChange={(e) => setVitalForm({...vitalForm, heart_rate: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Temp (°C)"
                    step="0.1"
                    value={vitalForm.temperature}
                    onChange={(e) => setVitalForm({...vitalForm, temperature: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded text-sm"
                  />
                  <input
                    type="number"
                    placeholder="SpO2 (%)"
                    value={vitalForm.spo2}
                    onChange={(e) => setVitalForm({...vitalForm, spo2: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded text-sm"
                  />
                  <textarea
                    placeholder="Notes"
                    value={vitalForm.notes}
                    onChange={(e) => setVitalForm({...vitalForm, notes: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded text-sm"
                    rows="2"
                  />
                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={handleEnterVitals}
                      disabled={enterVitalsMutation.isPending}
                      className="flex-1 bg-red-600 hover:bg-red-700"
                    >
                      {enterVitalsMutation.isPending ? 'Saving...' : 'Save'}
                    </Button>
                    <Button 
                      onClick={() => setShowVitalForm(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Critical Cases */}
          <Card className="shadow">
            <CardHeader className="bg-red-50 pb-3">
              <CardTitle className="text-base">Critical Cases</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {criticalPatients.length === 0 ? (
                <div className="text-center py-4 text-sm text-slate-600">
                  All patients stable ✓
                </div>
              ) : (
                <div className="space-y-2">
                  {criticalPatients.slice(0, 3).map(patient => (
                    <div key={patient.id} className="p-2 bg-red-50 rounded border border-red-200 text-sm">
                      <p className="font-semibold text-slate-900">{patient.full_name}</p>
                      <p className="text-xs text-slate-600">Bed #{patient.bed_number}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Patient List Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="shadow">
              <CardHeader className="bg-slate-50 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">My Patients</CardTitle>
                  <Badge>{patients.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {patientsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
                  </div>
                ) : patients.length === 0 ? (
                  <div className="text-center py-8 text-slate-600">
                    <Users className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                    <p>No patients registered yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {patients.map(patient => {
                      const patientVitals = vitals.find(v => v.patient_id === patient.id);
                      return (
                        <div key={patient.id} className={`p-3 rounded border-l-4 ${
                          patient.status === 'critical' 
                            ? 'bg-red-50 border-l-red-500' 
                            : 'bg-slate-50 border-l-slate-500'
                        }`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-slate-900">{patient.full_name}</p>
                              <p className="text-sm text-slate-600 mt-1">Age: {patient.age} | Bed: {patient.bed_number}</p>
                              {patientVitals && (
                                <p className="text-xs text-slate-600 mt-1">Last: BP {patientVitals.blood_pressure} | HR {patientVitals.heart_rate}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={patient.status === 'critical' ? 'bg-red-600' : 'bg-green-600'}>
                                {patient.status}
                              </Badge>
                              <Link to={`/patients/${patient.id}`}>
                                <Button size="sm" variant="outline" className="h-7 text-xs">View Details</Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6" id="alerts">
            <Card className="shadow">
              <CardHeader className="bg-slate-50 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Alerts</CardTitle>
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
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {(alertsTab==='active' ? activeAlerts : acknowledgedAlerts).length === 0 ? (
                  <div className="text-center py-4 text-sm text-slate-600">
                    No {(alertsTab==='active') ? 'active' : 'acknowledged'} alerts ✓
                  </div>
                ) : (
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2 pr-4">
                      {(alertsTab==='active' ? activeAlerts : acknowledgedAlerts).slice(0, 10).map((alert, idx) => (
                        <div key={idx} className="p-2 bg-orange-50 rounded border-l-2 border-l-orange-500 text-xs">
                          <p className="font-semibold text-slate-900">{alert.type || 'Alert'}</p>
                          <p className="text-slate-600">{alert.message}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            <Card className="shadow">
              <SystemStatus />
            </Card>
          </div>
        </div>

        {/* Appointments Section */}
        <div className="mt-8 mb-8">
          <Card className="shadow border-2 border-cyan-200">
            <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 pb-3 border-b-2 border-cyan-200">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-cyan-600" />
                  My Appointments
                </CardTitle>
                <Badge variant="outline" className="text-sm">
                  {appointments.filter(apt => apt.status === 'booked').length} Booked
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {appointments.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500">No appointments yet</p>
                </div>
              ) : (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3 pr-4">
                    {appointments
                      .filter(apt => apt.status !== 'cancelled')
                      .sort((a, b) => new Date(`${a.appointment_date}T${a.appointment_time}`) - new Date(`${b.appointment_date}T${b.appointment_time}`))
                      .map((appointment, idx) => (
                        <div 
                          key={idx} 
                          className={`p-3 rounded-lg border-2 ${
                            appointment.status === 'completed' 
                              ? 'bg-green-50 border-green-200' 
                              : appointment.status === 'booked'
                              ? 'bg-blue-50 border-blue-200'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-slate-900">{appointment.patient_name}</p>
                                <Badge className={`text-xs font-bold ${
                                  appointment.status === 'completed' ? 'bg-green-600' : 'bg-blue-600'
                                }`}>
                                  #{getTokenNumberForAppointment(appointment)}
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-600 mt-1">File: {appointment.patient_file_number}</p>
                              <p className="text-sm text-slate-700 mt-1 flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {format(new Date(`${appointment.appointment_date}T${appointment.appointment_time}`), 'MMM dd, h:mm a')}
                              </p>
                            </div>
                            <div className="flex flex-col gap-1">
                              <Badge className={`text-xs ${
                                appointment.status === 'booked' ? 'bg-yellow-500' : 
                                appointment.status === 'completed' ? 'bg-green-500' : 'bg-red-500'
                              }`}>
                                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Ward Overview Section */}
        <div className="mt-8">
          <Card className="shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bed className="h-5 w-5" />
                  Ward Status Overview
                </CardTitle>
                {/* Manage Wards is restricted to Office dashboard */}
              </div>
            </CardHeader>
            <CardContent>
              {!wards || wards.length === 0 ? (
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
    </div>
  );
}
