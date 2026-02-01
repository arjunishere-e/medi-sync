import React from 'react';
import { firebaseClient } from '../api/firebaseClient';
import { base44 } from '../api/base44Client';
import { useAuth } from '../context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "../Components/ui/card";
import { Button } from "../Components/ui/button";
import { Badge } from "../Components/ui/badge";
import { ScrollArea } from "../Components/ui/scroll-area";
import SystemStatus from "../Components/ui/SystemStatus";
import { 
  Heart, 
  FileText,
  Pill,
  Calendar,
  TrendingUp,
  RefreshCw,
  Download,
  AlertCircle,
  CheckCircle,
  Thermometer,
  Wind,
  Zap,
  Activity,
  Target,
  Bed
} from 'lucide-react';

export default function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // For file-number based patients, use patient_doc_id directly
  // For legacy patients, try to find by user_id
  const { data: patientRecord } = useQuery({
    queryKey: ['patient-record', user?.id, user?.patient_doc_id],
    queryFn: async () => {
      if (!user?.id) {
        console.warn('⚠️ No user ID found');
        return null;
      }
      
      try {
        // If user has patient_doc_id (file-number based login), use it directly
        if (user?.patient_doc_id) {
          console.log(`🔍 Using patient_doc_id for file-number patient: ${user.patient_doc_id}`);
          const patient = await firebaseClient.patients.read(user.patient_doc_id);
          console.log(`✅ Found patient record:`, patient);
          return patient;
        }
        
        // Fall back to looking up by user_id for legacy patients
        console.log(`🔍 Looking for patient record with user_id = ${user.id}`);
        const allPatients = await firebaseClient.patients.list('-created_date', 100);
        console.log(`📋 All patients in database:`, allPatients);
        const myRecord = allPatients.find(p => {
          console.log(`  Comparing ${p.user_id} === ${user.id} ?`, p.user_id === user.id);
          return p.user_id === user.id;
        });
        if (myRecord) {
          console.log(`✅ Found patient record:`, myRecord);
        } else {
          console.warn(`❌ No patient record found for user ${user.id}`);
        }
        return myRecord;
      } catch (error) {
        console.error('❌ Error fetching patient record:', error);
        return null;
      }
    },
    enabled: !!user?.id
  });

  // Fetch vitals for THIS patient only (using patient_doc_id directly)
  const { data: vitals = [], isLoading: vitalsLoading, isFetching: vitalsFetching } = useQuery({
    queryKey: ['patient-vitals', user?.patient_doc_id],
    queryFn: async () => {
      if (!user?.patient_doc_id) {
        console.warn(`⚠️ No patient_doc_id, skipping vitals fetch`);
        return [];
      }
      try {
        console.log(`📊 Fetching vitals for patient_doc_id: ${user.patient_doc_id}`);
        // Fetch ALL vitals and filter by patient_doc_id
        const allVitals = await firebaseClient.vitals.list('-timestamp', 200);
        console.log(`📋 All vitals in database (${allVitals.length} total):`, allVitals);
        const filtered = allVitals.filter(v => {
          const match = v.patient_id === user.patient_doc_id;
          if (!match) {
            console.log(`  ❌ Vital ${v.id}: patient_id=${v.patient_id} does NOT match patient_doc_id=${user.patient_doc_id}`);
          } else {
            console.log(`  ✅ Vital ${v.id}: patient_id=${v.patient_id} MATCHES patient_doc_id=${user.patient_doc_id}`);
          }
          return match;
        });
        console.log(`✅ Filtered vitals for this patient (${filtered.length}):`, filtered);
        return filtered;
      } catch (error) {
        console.error('❌ Error fetching vitals:', error);
        return [];
      }
    },
    enabled: !!user?.patient_doc_id,
    staleTime: 0, // Always fresh
    gcTime: 1000 * 60 * 5
  });

  // Fetch medicines prescribed to THIS patient only (using patient_doc_id directly)
  const { data: medicines = [], isLoading: medicinesLoading, isFetching: medicinesFetching } = useQuery({
    queryKey: ['medicines', user?.patient_doc_id],
    queryFn: async () => {
      if (!user?.patient_doc_id) {
        console.warn(`⚠️ No patient_doc_id, skipping medicines fetch`);
        return [];
      }
      try {
        console.log(`💊 Fetching medicines for patient_doc_id: ${user.patient_doc_id}`);
        // Fetch ALL medicines and filter by patient_doc_id
        const allMedicines = await firebaseClient.medicines.list('-prescribed_date', 100);
        console.log(`📋 All medicines in database (${allMedicines.length} total):`, allMedicines);
        const filtered = allMedicines.filter(m => {
          const match = m.patient_id === user.patient_doc_id;
          if (!match) {
            console.log(`  ❌ Medicine ${m.id}: patient_id=${m.patient_id} does NOT match patient_doc_id=${user.patient_doc_id}`);
          } else {
            console.log(`  ✅ Medicine ${m.id}: patient_id=${m.patient_id} MATCHES patient_doc_id=${user.patient_doc_id}`);
          }
          return match;
        });
        console.log(`✅ Filtered medicines for this patient (${filtered.length}):`, filtered);
        return filtered;
      } catch (error) {
        console.error('❌ Error fetching medicines:', error);
        return [];
      }
    },
    enabled: !!user?.patient_doc_id,
    staleTime: 0, // Always fresh
    gcTime: 1000 * 60 * 5
  });

  const { data: labReports = [] } = useQuery({
    queryKey: ['lab-reports', user?.patient_doc_id],
    queryFn: async () => {
      if (!user?.patient_doc_id) return [];
      try {
        const allReports = await firebaseClient.labReports.list('-created_date', 50);
        return allReports.filter(r => r.patient_id === user.patient_doc_id);
      } catch (error) {
        console.error('Error fetching lab reports:', error);
        return [];
      }
    },
    enabled: !!user?.patient_doc_id
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts', user?.patient_doc_id],
    queryFn: async () => {
      if (!user?.patient_doc_id) return [];
      try {
        const allAlerts = await firebaseClient.alerts.list('-created_date', 100);
        return allAlerts.filter(a => a.patient_id === user.patient_doc_id);
      } catch (error) {
        console.error('Error fetching alerts:', error);
        return [];
      }
    },
    enabled: !!user?.patient_doc_id
  });

  const { data: wards = [] } = useQuery({
    queryKey: ['wards'],
    queryFn: () => base44.entities.Ward.list(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10
  });

  const latestVitals = vitals[0] || {};
  const recentReports = labReports.slice(0, 5);
  const activeMedicines = medicines.filter(m => m.status !== 'completed').slice(0, 5);
  const myAlerts = alerts.slice(0, 5);

  // Appointment history for this patient
  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ['my-appointments', user?.patient_doc_id, user?.file_number],
    queryFn: async () => {
      try {
        if (user?.patient_doc_id) {
          const byId = await firebaseClient.appointments.getByPatient(user.patient_doc_id);
          if (Array.isArray(byId) && byId.length > 0) return byId;
        }
        if (user?.file_number) {
          const byFile = await firebaseClient.appointments.getByPatientFileNumber(user.file_number);
          if (Array.isArray(byFile)) return byFile;
        }
        return [];
      } catch (e) {
        console.error('Error fetching appointments:', e);
        return [];
      }
    },
    enabled: !!(user?.patient_doc_id || user?.file_number),
    staleTime: 0,
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

  if (vitalsLoading && medicinesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-slate-700">Loading Your Health Dashboard...</h2>
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
              My Health Dashboard
            </h1>
            <p className="text-slate-500 mt-1">
              Welcome, {user?.name || 'Patient'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => queryClient.invalidateQueries()}
              className="gap-2 w-full sm:w-auto"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button 
              onClick={() => navigate('/book-appointment')}
              className="gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 w-full sm:w-auto"
            >
              <Calendar className="h-4 w-4" />
              Book Appointment
            </Button>
          </div>
        </div>

        {/* Medications - FIRST PRIORITY */}
        <Card className="mb-8 border-2 border-blue-200 shadow-lg">
          <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-cyan-50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Pill className="h-6 w-6 text-blue-500" />
                Your Medications (Doctor Prescribed)
              </CardTitle>
              <Badge className="bg-blue-600 text-lg px-3 py-1">{activeMedicines.length} Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {medicinesLoading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : activeMedicines.length === 0 ? (
              <div className="text-center py-8">
                <Pill className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                <p className="text-slate-500">No active prescriptions yet</p>
                <p className="text-sm text-slate-400 mt-1">Your doctor will add medicines when needed</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeMedicines.map((medicine) => (
                  <div key={medicine.id} className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border-l-4 border-l-blue-500">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-bold text-lg text-slate-900">{medicine.name}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Prescribed: {
                            (() => {
                              const d = medicine?.prescribed_date;
                              if (!d) return 'Recently';
                              try {
                                const dt = typeof d?.toDate === 'function' ? d.toDate() : new Date(d);
                                return isNaN(dt) ? 'Recently' : dt.toLocaleDateString();
                              } catch {
                                return 'Recently';
                              }
                            })()
                          }
                        </p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <div className="p-3 bg-white rounded border border-blue-100">
                        <p className="text-xs text-slate-600 font-semibold">Dosage</p>
                        <p className="font-semibold text-slate-900 text-sm mt-1">{medicine.dosage}</p>
                      </div>
                      <div className="p-3 bg-white rounded border border-blue-100">
                        <p className="text-xs text-slate-600 font-semibold">Frequency</p>
                        <p className="font-semibold text-slate-900 text-sm mt-1">{medicine.frequency}</p>
                      </div>
                      <div className="col-span-2 p-3 bg-white rounded border border-blue-100">
                        <p className="text-xs text-slate-600 font-semibold">Duration</p>
                        <p className="font-semibold text-slate-900 text-sm mt-1">{medicine.duration}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vital Signs - Compact Version */}
        {latestVitals.id && (
          <Card className="mb-8 border border-slate-200">
            <CardHeader className="pb-3 bg-slate-50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Latest Vital Signs
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Blood Pressure */}
                <div className="p-3 bg-gradient-to-br from-red-50 to-pink-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-1 mb-1">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span className="text-xs font-semibold text-red-600">BP</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{latestVitals.blood_pressure || '--'}</p>
                  <p className="text-xs text-slate-600">mmHg</p>
                </div>

                {/* Heart Rate */}
                <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-1 mb-1">
                    <Zap className="h-4 w-4 text-purple-500" />
                    <span className="text-xs font-semibold text-purple-600">HR</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{latestVitals.heart_rate || '--'}</p>
                  <p className="text-xs text-slate-600">bpm</p>
                </div>

                {/* Temperature */}
                <div className="p-3 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-1 mb-1">
                    <Thermometer className="h-4 w-4 text-orange-500" />
                    <span className="text-xs font-semibold text-orange-600">Temp</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{latestVitals.temperature ? `${latestVitals.temperature}°` : '--'}</p>
                  <p className="text-xs text-slate-600">°C</p>
                </div>

                {/* Oxygen */}
                <div className="p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-1 mb-1">
                    <Wind className="h-4 w-4 text-blue-500" />
                    <span className="text-xs font-semibold text-blue-600">SpO2</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{latestVitals.spo2 || '--'}%</p>
                  <p className="text-xs text-slate-600">O₂</p>
                </div>
              </div>
              {latestVitals.notes && (
                <div className="mt-3 p-3 bg-indigo-50 rounded border border-indigo-200">
                  <p className="text-sm font-semibold text-indigo-900">📝 Notes: {latestVitals.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Appointment History */}
            <Card>
              <CardHeader className="pb-3 bg-gradient-to-r from-indigo-50 to-blue-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Appointment History
                  </CardTitle>
                  <Badge>{appointments.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {appointmentsLoading ? (
                  <div className="flex justify-center py-6">
                    <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-slate-500">No appointments booked yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {appointments.map((apt) => (
                      <div key={apt.id} className="py-3 flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">
                            {apt.doctor_name} • {apt.doctor_specialty}
                          </p>
                          <p className="text-xs text-slate-600 mt-1">
                            {apt.appointment_date} • {apt.appointment_time} (Token #{getTokenNumberForAppointment(apt)})
                          </p>
                        </div>
                        <Badge className={`${apt.status === 'booked' ? 'bg-blue-600' : apt.status === 'completed' ? 'bg-green-600' : 'bg-slate-400'} text-white`}>
                          {apt.status || 'booked'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Lab Reports */}
            <Card>
              <CardHeader className="pb-3 bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-500" />
                    Lab Reports
                  </CardTitle>
                  {recentReports.length > 0 && <Badge>{recentReports.length}</Badge>}
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {recentReports.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-slate-500">No lab reports yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentReports.map((report, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200 hover:shadow-md transition">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">Lab Test Report</p>
                          <p className="text-sm text-slate-500 mt-1">
                            {report.created_date ? new Date(report.created_date).toLocaleDateString() : 'Recent'}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" className="gap-1 text-green-600 hover:text-green-700">
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Health Alerts & Warnings */}
            <Card>
              <CardHeader className="pb-3 bg-gradient-to-r from-amber-50 to-red-50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  Health Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <ScrollArea className="h-[250px] pr-4">
                  {myAlerts.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-10 w-10 mx-auto text-green-500 mb-2" />
                      <p className="text-sm text-slate-500 font-semibold">All Clear! ✓</p>
                      <p className="text-xs text-slate-500 mt-1">No health alerts</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myAlerts.map((alert, idx) => (
                        <div 
                          key={idx} 
                          className={`p-3 rounded-lg border-l-4 ${
                            alert.severity === 'critical' 
                              ? 'bg-red-50 border-l-red-500' 
                              : alert.severity === 'high'
                              ? 'bg-orange-50 border-l-orange-500'
                              : 'bg-yellow-50 border-l-yellow-500'
                          }`}
                        >
                          <p className="text-sm font-semibold text-slate-900">
                            {alert.severity === 'critical' ? '🚨' : alert.severity === 'high' ? '⚠️' : '❗'} {alert.title || 'Alert'}
                          </p>
                          <p className="text-xs text-slate-700 mt-1">
                            {alert.message || 'Monitor your health'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Health Goals */}
            <Card>
              <CardHeader className="pb-3 bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-500" />
                  My Health Goals
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-sm font-semibold text-purple-900">🏃 Exercise</p>
                    <p className="text-xs text-purple-700 mt-1">30 min daily</p>
                    <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{width: '70%'}}></div>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-semibold text-blue-900">💧 Hydration</p>
                    <p className="text-xs text-blue-700 mt-1">8 glasses daily</p>
                    <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{width: '85%'}}></div>
                    </div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-semibold text-green-900">😴 Sleep</p>
                    <p className="text-xs text-green-700 mt-1">7-8 hours nightly</p>
                    <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{width: '60%'}}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <SystemStatus />
            </Card>

            {/* Bed Allocation Card */}
            {patientRecord?.bed_number && (
              <Card className="border-2 border-blue-300">
                <CardHeader className="bg-blue-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bed className="h-5 w-5 text-blue-600" />
                    Your Bed Assignment
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-600 mb-1">Bed Number</p>
                      <p className="text-2xl font-bold text-slate-900">{patientRecord.bed_number}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-600 mb-1">Ward</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {wards.find(w => w.id === patientRecord.ward_id)?.name || 'Not assigned'}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg col-span-2">
                      <p className="text-sm text-slate-600 mb-1">Department</p>
                      <p className="text-sm text-slate-900">
                        {wards.find(w => w.id === patientRecord.ward_id)?.department || 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Vitals History Chart */}
        <Card className="mt-8">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Your Vital Signs Trend (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {vitals.slice(0, 3).map((vital, idx) => (
                <div key={idx} className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border-2 border-blue-200">
                  <p className="text-sm font-semibold text-slate-700 mb-3">
                    {vital.timestamp ? new Date(vital.timestamp).toLocaleDateString() : 'Date'}
                  </p>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold text-slate-600">Blood Pressure</span>
                        <span className="text-sm font-bold text-slate-900">{vital.blood_pressure || '--'}</span>
                      </div>
                      <div className="w-full bg-red-200 rounded-full h-2">
                        <div className="bg-red-500 h-2 rounded-full" style={{width: '70%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold text-slate-600">❤️ Heart Rate</span>
                        <span className="text-sm font-bold text-slate-900">{vital.heart_rate || '--'} bpm</span>
                      </div>
                      <div className="w-full bg-purple-200 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{width: '75%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold text-slate-600">🌡️ Temperature</span>
                        <span className="text-sm font-bold text-slate-900">{vital.temperature ? `${vital.temperature}°C` : '--'}</span>
                      </div>
                      <div className="w-full bg-orange-200 rounded-full h-2">
                        <div className="bg-orange-500 h-2 rounded-full" style={{width: '60%'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Wellness Tips & Resources */}
        <Card className="mt-6">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-500" />
              Wellness Resources & Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <p className="font-semibold text-emerald-900 mb-2">💪 Physical Activity</p>
                <p className="text-sm text-emerald-800">Aim for 30 minutes of moderate activity daily. Even a 10-minute walk helps!</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="font-semibold text-blue-900 mb-2">🥗 Nutrition</p>
                <p className="text-sm text-blue-800">Eat a balanced diet with plenty of fruits, vegetables, and whole grains.</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="font-semibold text-purple-900 mb-2">😴 Sleep Quality</p>
                <p className="text-sm text-purple-800">Maintain a consistent sleep schedule. Aim for 7-8 hours each night.</p>
              </div>
              <div className="p-4 bg-pink-50 rounded-lg border border-pink-200">
                <p className="font-semibold text-pink-900 mb-2">🧘 Stress Management</p>
                <p className="text-sm text-pink-800">Try meditation, yoga, or breathing exercises to reduce stress.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
