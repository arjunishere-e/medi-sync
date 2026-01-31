import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { firebaseClient } from '../api/firebaseClient';
import { base44 } from '../api/base44Client';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "../Components/ui/card";
import { Button } from "../Components/ui/button";
import { UserPlus } from 'lucide-react';

export default function PatientRegistration() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    file_number: '',
    full_name: '',
    age: '',
    gender: 'male',
    contact_number: '',
    address: '',
    bed_number: '',
    ward_id: '',
    status: 'stable'
  });

  // Fetch wards and available beds
  const { data: wards = [] } = useQuery({
    queryKey: ['wards'],
    queryFn: () => base44.entities.Ward.list(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10
  });

  // Fetch next auto-generated file number
  const { data: nextFileNumber, isLoading: fileNumberLoading } = useQuery({
    queryKey: ['next-file-number'],
    queryFn: async () => {
      try {
        const fileNum = await firebaseClient.getNextPatientFileNumber();
        return fileNum;
      } catch (error) {
        console.error('Error fetching file number:', error);
        return 'PAT-' + Date.now();
      }
    }
  });

  // Auto-fill file number when it's loaded
  useEffect(() => {
    if (nextFileNumber && !formData.file_number) {
      setFormData(prev => ({
        ...prev,
        file_number: nextFileNumber
      }));
    }
  }, [nextFileNumber]);

  const registerPatientMutation = useMutation({
    mutationFn: async (patientData) => {
      const patient = {
        ...patientData,
        doctor_id: user?.id,
        nurse_id: user?.role === 'nurse' ? user.id : null,
        created_date: new Date().toISOString(),
        age: parseInt(patientData.age),
        bed_number: patientData.bed_number ? parseInt(patientData.bed_number) : null,
        bed_allocated_by: user?.role === 'nurse' ? user.id : null,
        bed_allocation_date: patientData.bed_number ? new Date().toISOString() : null
      };
      console.log('📝 Registering patient to Firestore:', patient);
      return firebaseClient.patients.create(patient);
    },
    onSuccess: (result) => {
      // Invalidate all related queries to sync across all dashboards
      console.log('✅ Patient registered successfully! Document ID:', result.id);
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['all-patients'] });
      queryClient.invalidateQueries({ queryKey: ['wards'] });
      alert('Patient registered successfully!');
      setTimeout(() => navigate('/'), 500);
    },
    onError: (error) => {
      console.error('Registration error:', error);
      alert('Error registering patient');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.age || !formData.contact_number) {
      alert('Please fill all required fields');
      return;
    }

    if (!formData.file_number) {
      alert('File number is still being generated. Please wait...');
      return;
    }

    registerPatientMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-2xl mx-auto">
        <Card className="border-2 border-slate-300">
          <CardHeader className="bg-blue-600 text-white pb-4">
            <div className="flex items-center gap-3">
              <UserPlus className="h-6 w-6" />
              <CardTitle className="text-2xl">Register New Patient</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    File Number (Auto-Generated) *
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      disabled
                      value={fileNumberLoading ? 'Generating...' : formData.file_number}
                      className="flex-1 p-3 border border-slate-300 rounded-lg bg-slate-100 text-slate-700 font-mono font-semibold cursor-not-allowed"
                      placeholder="Auto-generating..."
                    />
                    <div className="text-xs text-slate-600 whitespace-nowrap">🔄 Auto</div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">System generates unique file number automatically</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="Enter patient name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Age *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.age}
                    onChange={(e) => setFormData({...formData, age: e.target.value})}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="Enter age"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Contact Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.contact_number}
                    onChange={(e) => setFormData({...formData, contact_number: e.target.value})}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Ward (Bed Allocation)
                  </label>
                  <select
                    value={formData.ward_id}
                    onChange={(e) => setFormData({...formData, ward_id: e.target.value})}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">-- Select Ward --</option>
                    {wards.map(ward => (
                      <option key={ward.id} value={ward.id}>
                        {ward.name} ({ward.available_beds || 0} available beds)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Bed Number
                  </label>
                  <input
                    type="text"
                    value={formData.bed_number}
                    onChange={(e) => setFormData({...formData, bed_number: e.target.value})}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="Enter bed number (e.g., 1A, 2B)"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="Enter address"
                    rows="3"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="stable">Stable</option>
                    <option value="critical">Critical</option>
                    <option value="recovering">Recovering</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <Button
                  type="submit"
                  disabled={registerPatientMutation.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
                >
                  {registerPatientMutation.isPending ? 'Registering...' : 'Register Patient'}
                </Button>
                <Button
                  type="button"
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="flex-1 py-3"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
