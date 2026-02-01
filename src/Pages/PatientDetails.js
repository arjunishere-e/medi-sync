import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { firebaseClient } from '../api/firebaseClient';
import { base44 } from '../api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "../Components/ui/card";
import { Button } from "../Components/ui/button";
import { Badge } from "../Components/ui/badge";
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Plus,
  X,
  Save,
  AlertCircle,
  Heart,
  Pill,
  FileText,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Stethoscope,
  TrendingUp,
  RefreshCw
} from 'lucide-react';

export default function PatientDetails() {
  const { id: patientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [editingPatient, setEditingPatient] = useState(false);
  const [editingVitals, setEditingVitals] = useState(null);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [showVitalForm, setShowVitalForm] = useState(false);
  const [showMedicineForm, setShowMedicineForm] = useState(false);

  const [patientData, setPatientData] = useState({});
  const [vitalData, setVitalData] = useState({
    blood_pressure: '',
    heart_rate: '',
    temperature: '',
    spo2: '',
    respiratory_rate: ''
  });
  const [medicineData, setMedicineData] = useState({
    name: '',
    dosage: '',
    frequency: '',
    duration: ''
  });

  // Fetch patient details
  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ['patient-detail', patientId],
    queryFn: async () => {
      if (!patientId) return null;
      try {
        const allPatients = await firebaseClient.patients.list('-created_date', 100);
        return allPatients.find(p => p.id === patientId);
      } catch (error) {
        console.error('Error fetching patient:', error);
        return null;
      }
    },
    enabled: !!patientId
  });

  // Fetch patient vitals
  const { data: vitals = [] } = useQuery({
    queryKey: ['patient-vitals', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      try {
        const allVitals = await firebaseClient.vitals.list('-timestamp', 100);
        return allVitals.filter(v => v.patient_id === patientId);
      } catch (error) {
        console.error('Error fetching vitals:', error);
        return [];
      }
    },
    enabled: !!patientId
  });

  // Fetch patient medicines
  const { data: medicines = [] } = useQuery({
    queryKey: ['patient-medicines', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      try {
        const allMedicines = await firebaseClient.medicines.list('-prescribed_date', 100);
        return allMedicines.filter(m => m.patient_id === patientId);
      } catch (error) {
        console.error('Error fetching medicines:', error);
        return [];
      }
    },
    enabled: !!patientId
  });

  // Update patient mutation
  const updatePatientMutation = useMutation({
    mutationFn: (updatedData) =>
      firebaseClient.patients.update(patientId, updatedData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-detail', patientId] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setEditingPatient(false);
      alert('Patient updated successfully!');
    },
    onError: (error) => alert('Error updating patient: ' + error.message)
  });

  // Delete patient mutation
  const deletePatientMutation = useMutation({
    mutationFn: () => firebaseClient.patients.delete(patientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      alert('Patient deleted successfully!');
      navigate('/');
    },
    onError: (error) => alert('Error deleting patient: ' + error.message)
  });

  // Add/Update vital mutation
  const saveVitalMutation = useMutation({
    mutationFn: (vital) => {
      if (editingVitals) {
        return firebaseClient.vitals.update(editingVitals.id, vital);
      }
      return firebaseClient.vitals.create(vital);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-vitals', patientId] });
      resetVitalForm();
      alert(editingVitals ? 'Vital updated!' : 'Vital recorded!');
    },
    onError: (error) => alert('Error saving vital: ' + error.message)
  });

  // Delete vital mutation
  const deleteVitalMutation = useMutation({
    mutationFn: (vitalId) => firebaseClient.vitals.delete(vitalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-vitals', patientId] });
      alert('Vital deleted!');
    },
    onError: (error) => alert('Error deleting vital: ' + error.message)
  });

  // Add/Update medicine mutation
  const saveMedicineMutation = useMutation({
    mutationFn: (medicine) => {
      if (editingMedicine) {
        return firebaseClient.medicines.update(editingMedicine.id, medicine);
      }
      return firebaseClient.medicines.create(medicine);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-medicines', patientId] });
      resetMedicineForm();
      alert(editingMedicine ? 'Medicine updated!' : 'Medicine prescribed!');
    },
    onError: (error) => alert('Error saving medicine: ' + error.message)
  });

  // Delete medicine mutation
  const deleteMedicineMutation = useMutation({
    mutationFn: (medicineId) => firebaseClient.medicines.delete(medicineId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-medicines', patientId] });
      alert('Medicine deleted!');
    },
    onError: (error) => alert('Error deleting medicine: ' + error.message)
  });

  const resetVitalForm = () => {
    setVitalData({
      blood_pressure: '',
      heart_rate: '',
      temperature: '',
      spo2: '',
      respiratory_rate: ''
    });
    setEditingVitals(null);
    setShowVitalForm(false);
  };

  const resetMedicineForm = () => {
    setMedicineData({
      name: '',
      dosage: '',
      frequency: '',
      duration: ''
    });
    setEditingMedicine(null);
    setShowMedicineForm(false);
  };

  const handleEditPatient = () => {
    if (patient) {
      setPatientData(patient);
      setEditingPatient(true);
    }
  };

  const handleSavePatient = () => {
    updatePatientMutation.mutate(patientData);
  };

  const handleEditVital = (vital) => {
    setVitalData(vital);
    setEditingVitals(vital);
    setShowVitalForm(true);
  };

  const handleSaveVital = () => {
    const vital = {
      ...vitalData,
      patient_id: patientId,
      doctor_id: user?.id,
      timestamp: new Date().toISOString(),
      blood_pressure: vitalData.blood_pressure,
      heart_rate: parseInt(vitalData.heart_rate || 0),
      temperature: parseFloat(vitalData.temperature || 0),
      spo2: parseInt(vitalData.spo2 || 0),
      respiratory_rate: parseInt(vitalData.respiratory_rate || 0)
    };
    saveVitalMutation.mutate(vital);
  };

  const handleEditMedicine = (medicine) => {
    setMedicineData(medicine);
    setEditingMedicine(medicine);
    setShowMedicineForm(true);
  };

  const handleSaveMedicine = () => {
    const medicine = {
      ...medicineData,
      patient_id: patientId,
      doctor_id: user?.id,
      prescribed_date: new Date().toISOString(),
      status: 'active'
    };
    saveMedicineMutation.mutate(medicine);
  };

  if (patientLoading) {
    return (
      <div className="min-h-screen bg-white p-6 flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-slate-300" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-4xl mx-auto">
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="gap-2 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <Card className="border-2 border-red-300 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-red-600" />
                <p className="text-red-900 font-semibold">Patient not found</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <div className="flex gap-2">
            {!editingPatient && (
              <>
                <Button
                  onClick={handleEditPatient}
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit Patient
                </Button>
                <Button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this patient?')) {
                      deletePatientMutation.mutate();
                    }
                  }}
                  variant="destructive"
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Patient Information */}
        <Card className="mb-6 border-2 border-slate-300">
          <CardHeader className="bg-blue-50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Patient Information
              </CardTitle>
              {editingPatient && (
                <Button
                  onClick={() => setEditingPatient(false)}
                  variant="ghost"
                  size="sm"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {editingPatient ? (
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      File Number (Patient ID)
                    </label>
                    <input
                      type="text"
                      value={patientData.file_number || ''}
                      onChange={(e) => setPatientData({...patientData, file_number: e.target.value})}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none font-mono bg-slate-100"
                      disabled
                    />
                    <p className="text-xs text-slate-500 mt-1">File number cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={patientData.full_name || ''}
                      onChange={(e) => setPatientData({...patientData, full_name: e.target.value})}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Age
                    </label>
                    <input
                      type="number"
                      value={patientData.age || ''}
                      onChange={(e) => setPatientData({...patientData, age: e.target.value})}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Gender
                    </label>
                    <select
                      value={patientData.gender || ''}
                      onChange={(e) => setPatientData({...patientData, gender: e.target.value})}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      value={patientData.contact_number || ''}
                      onChange={(e) => setPatientData({...patientData, contact_number: e.target.value})}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={patientData.email || ''}
                      onChange={(e) => setPatientData({...patientData, email: e.target.value})}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Status
                    </label>
                    <select
                      value={patientData.status || ''}
                      onChange={(e) => setPatientData({...patientData, status: e.target.value})}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    >
                      <option value="admitted">Admitted</option>
                      <option value="critical">Critical</option>
                      <option value="stable">Stable</option>
                      <option value="recovering">Recovering</option>
                      <option value="discharged">Discharged</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Address
                    </label>
                    <textarea
                      value={patientData.address || ''}
                      onChange={(e) => setPatientData({...patientData, address: e.target.value})}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      rows="3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Bed Number
                    </label>
                    <input
                      type="text"
                      value={patientData.bed_number || ''}
                      onChange={(e) => setPatientData({...patientData, bed_number: e.target.value})}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={handleSavePatient}
                    disabled={updatePatientMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setEditingPatient(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3 md:col-span-2 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-slate-600">Patient File Number (ID)</p>
                    <p className="font-bold text-lg text-blue-700">{patient.file_number || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-slate-600" />
                  <div>
                    <p className="text-sm text-slate-600">Name</p>
                    <p className="font-semibold text-slate-900">{patient.full_name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-slate-600" />
                  <div>
                    <p className="text-sm text-slate-600">Age</p>
                    <p className="font-semibold text-slate-900">{patient.age} years</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-slate-600" />
                  <div>
                    <p className="text-sm text-slate-600">Contact</p>
                    <p className="font-semibold text-slate-900">{patient.contact_number}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-slate-600" />
                  <div>
                    <p className="text-sm text-slate-600">Email</p>
                    <p className="font-semibold text-slate-900">{patient.email || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Stethoscope className="h-5 w-5 text-slate-600" />
                  <div>
                    <p className="text-sm text-slate-600">Status</p>
                    <Badge className={`mt-1 ${
                      patient.status === 'critical' ? 'bg-red-500' :
                      patient.status === 'recovering' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}>
                      {patient.status}
                    </Badge>
                  </div>
                </div>

                {patient.bed_number && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-slate-600" />
                    <div>
                      <p className="text-sm text-slate-600">Bed Number</p>
                      <p className="font-semibold text-slate-900">{patient.bed_number}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vitals Section */}
        <Card className="mb-6 border-2 border-slate-300">
          <CardHeader className="bg-red-50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Vitals
              </CardTitle>
              {user?.role === 'doctor' && !showVitalForm && (
                <Button
                  onClick={() => setShowVitalForm(true)}
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                  Add Vital
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {user?.role === 'doctor' && showVitalForm && (
              <form className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Blood Pressure (e.g., 120/80)
                    </label>
                    <input
                      type="text"
                      value={vitalData.blood_pressure || ''}
                      onChange={(e) => setVitalData({...vitalData, blood_pressure: e.target.value})}
                      className="w-full p-2 border border-slate-300 rounded"
                      placeholder="120/80"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Heart Rate (bpm)
                    </label>
                    <input
                      type="number"
                      value={vitalData.heart_rate || ''}
                      onChange={(e) => setVitalData({...vitalData, heart_rate: e.target.value})}
                      className="w-full p-2 border border-slate-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Temperature (°C)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={vitalData.temperature || ''}
                      onChange={(e) => setVitalData({...vitalData, temperature: e.target.value})}
                      className="w-full p-2 border border-slate-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      SpO2 (%)
                    </label>
                    <input
                      type="number"
                      value={vitalData.spo2 || ''}
                      onChange={(e) => setVitalData({...vitalData, spo2: e.target.value})}
                      className="w-full p-2 border border-slate-300 rounded"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleSaveVital}
                    disabled={saveVitalMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Save Vital
                  </Button>
                  <Button
                    type="button"
                    onClick={resetVitalForm}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {vitals.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No vitals recorded yet</p>
            ) : (
              <div className="space-y-3">
                {vitals.map((vital, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="text-xs text-slate-600">
                          {vital.timestamp ? new Date(vital.timestamp).toLocaleString() : 'Recently'}
                        </p>
                      </div>
                      {user?.role === 'doctor' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditVital(vital)}
                            className="p-1 hover:bg-blue-100 rounded text-blue-600"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Delete this vital reading?')) {
                                deleteVitalMutation.mutate(vital.id);
                              }
                            }}
                            className="p-1 hover:bg-red-100 rounded text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <p className="text-slate-600">BP</p>
                        <p className="font-semibold text-slate-900">{vital.blood_pressure || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">HR</p>
                        <p className="font-semibold text-slate-900">{vital.heart_rate || 'N/A'} bpm</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Temp</p>
                        <p className="font-semibold text-slate-900">{vital.temperature || 'N/A'}°C</p>
                      </div>
                      <div>
                        <p className="text-slate-600">SpO2</p>
                        <p className="font-semibold text-slate-900">{vital.spo2 || 'N/A'}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Medicines Section */}
        <Card className="mb-6 border-2 border-slate-300">
          <CardHeader className="bg-green-50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Medications
              </CardTitle>
              {user?.role === 'doctor' && !showMedicineForm && (
                <Button
                  onClick={() => setShowMedicineForm(true)}
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                  Prescribe Medicine
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {user?.role === 'doctor' && showMedicineForm && (
              <form className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Medicine Name
                    </label>
                    <input
                      type="text"
                      value={medicineData.name || ''}
                      onChange={(e) => setMedicineData({...medicineData, name: e.target.value})}
                      className="w-full p-2 border border-slate-300 rounded"
                      placeholder="e.g., Aspirin"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Dosage
                    </label>
                    <input
                      type="text"
                      value={medicineData.dosage || ''}
                      onChange={(e) => setMedicineData({...medicineData, dosage: e.target.value})}
                      className="w-full p-2 border border-slate-300 rounded"
                      placeholder="e.g., 500mg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Frequency
                    </label>
                    <select
                      value={medicineData.frequency || ''}
                      onChange={(e) => setMedicineData({...medicineData, frequency: e.target.value})}
                      className="w-full p-2 border border-slate-300 rounded"
                    >
                      <option value="">Select frequency</option>
                      <option value="Once daily">Once daily</option>
                      <option value="Twice daily">Twice daily</option>
                      <option value="Three times daily">Three times daily</option>
                      <option value="As needed">As needed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Duration (days)
                    </label>
                    <input
                      type="number"
                      value={medicineData.duration || ''}
                      onChange={(e) => setMedicineData({...medicineData, duration: e.target.value})}
                      className="w-full p-2 border border-slate-300 rounded"
                      placeholder="e.g., 30"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleSaveMedicine}
                    disabled={saveMedicineMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Save Prescription
                  </Button>
                  <Button
                    type="button"
                    onClick={resetMedicineForm}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {medicines.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No medicines prescribed yet</p>
            ) : (
              <div className="space-y-3">
                {medicines.map((medicine, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{medicine.name}</p>
                        <p className="text-xs text-slate-600 mt-1">
                          Prescribed: {medicine.prescribed_date ? new Date(medicine.prescribed_date).toLocaleDateString() : 'Recently'}
                        </p>
                      </div>
                      {user?.role === 'doctor' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditMedicine(medicine)}
                            className="p-1 hover:bg-blue-100 rounded text-blue-600"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Delete this medicine?')) {
                                deleteMedicineMutation.mutate(medicine.id);
                              }
                            }}
                            className="p-1 hover:bg-red-100 rounded text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm mt-2">
                      <div>
                        <p className="text-slate-600">Dosage</p>
                        <p className="font-semibold text-slate-900">{medicine.dosage}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Frequency</p>
                        <p className="font-semibold text-slate-900">{medicine.frequency}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Duration</p>
                        <p className="font-semibold text-slate-900">{medicine.duration} days</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
