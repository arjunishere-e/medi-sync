import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '../api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "../Components/ui/card";
import { Button } from "../Components/ui/button";
import { useAuth } from '../context/AuthContext';
import { 
  Bed, 
  Plus, 
  Edit2, 
  Trash2, 
  X,
  RefreshCw,
  Users,
  AlertCircle
} from 'lucide-react';

export default function WardManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingWard, setEditingWard] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    total_beds: 20,
    occupied_beds: 0,
    available_beds: 20,
    staff_count: 5,
    head_of_department: ''
  });

  // Fetch wards from database
  const { data: wards = [], isLoading, error } = useQuery({
    queryKey: ['wards'],
    queryFn: () => base44.entities.Ward.list(),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5
  });

  // Create ward mutation
  const createWardMutation = useMutation({
    mutationFn: (wardData) => base44.entities.Ward.create(wardData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wards'] });
      resetForm();
      alert('Ward created successfully!');
    },
    onError: (error) => alert('Error creating ward: ' + error.message)
  });

  // Update ward mutation
  const updateWardMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Ward.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wards'] });
      resetForm();
      alert('Ward updated successfully!');
    },
    onError: (error) => alert('Error updating ward: ' + error.message)
  });

  // Delete ward mutation
  const deleteWardMutation = useMutation({
    mutationFn: (id) => base44.entities.Ward.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wards'] });
      alert('Ward deleted successfully!');
    },
    onError: (error) => alert('Error deleting ward: ' + error.message)
  });

  const resetForm = () => {
    setFormData({
      name: '',
      department: '',
      total_beds: 20,
      occupied_beds: 0,
      available_beds: 20,
      staff_count: 5,
      head_of_department: ''
    });
    setEditingWard(null);
    setShowForm(false);
  };

  const handleEdit = (ward) => {
    setEditingWard(ward);
    setFormData(ward);
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const wardData = {
      ...formData,
      total_beds: parseInt(formData.total_beds),
      occupied_beds: parseInt(formData.occupied_beds),
      available_beds: parseInt(formData.total_beds) - parseInt(formData.occupied_beds),
      staff_count: parseInt(formData.staff_count),
      updated_date: new Date().toISOString()
    };

    if (editingWard) {
      updateWardMutation.mutate({ id: editingWard.id, data: wardData });
    } else {
      createWardMutation.mutate({
        ...wardData,
        created_date: new Date().toISOString()
      });
    }
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Ward Management</h1>
            <p className="text-slate-600 mt-1">Manage hospital wards and bed allocations</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['wards'] })}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              onClick={() => setShowForm(true)}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Ward
            </Button>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <Card className="mb-8 border-2 border-blue-300">
            <CardHeader className="bg-blue-50 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">
                  {editingWard ? 'Edit Ward' : 'Add New Ward'}
                </CardTitle>
                <button
                  onClick={resetForm}
                  className="p-1 hover:bg-slate-200 rounded"
                >
                  <X className="h-5 w-5 text-slate-600" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Ward Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      placeholder="e.g., ICU, General Ward"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Department *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      placeholder="e.g., Intensive Care"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Total Beds *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.total_beds}
                      onChange={(e) => setFormData({...formData, total_beds: e.target.value})}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Occupied Beds
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.occupied_beds}
                      onChange={(e) => setFormData({...formData, occupied_beds: e.target.value})}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Staff Count
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.staff_count}
                      onChange={(e) => setFormData({...formData, staff_count: e.target.value})}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Head of Department
                    </label>
                    <input
                      type="text"
                      value={formData.head_of_department}
                      onChange={(e) => setFormData({...formData, head_of_department: e.target.value})}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      placeholder="e.g., Dr. Smith"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={createWardMutation.isPending || updateWardMutation.isPending}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {editingWard ? 'Update Ward' : 'Create Ward'}
                  </Button>
                  <Button
                    type="button"
                    onClick={resetForm}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Wards List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-slate-300" />
          </div>
        ) : error ? (
          <Card className="border-2 border-red-300 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-red-600" />
                <div>
                  <p className="font-semibold text-red-900">Error loading wards</p>
                  <p className="text-red-700 text-sm">{error.message}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : wards.length === 0 ? (
          <Card className="border-2 border-slate-300">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Bed className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                <h3 className="text-lg font-medium text-slate-900 mb-1">No wards yet</h3>
                <p className="text-slate-500 mb-4">Create your first ward to get started</p>
                <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
                  Add Ward
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wards.map(ward => (
              <Card key={ward.id} className="border-2 border-slate-300 hover:border-blue-400 transition">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-slate-900">{ward.name}</CardTitle>
                      <p className="text-sm text-slate-600 mt-1">{ward.department}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(ward)}
                        className="p-2 hover:bg-blue-100 rounded text-blue-600"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this ward?')) {
                            deleteWardMutation.mutate(ward.id);
                          }
                        }}
                        className="p-2 hover:bg-red-100 rounded text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3 rounded">
                      <p className="text-xs text-slate-600 mb-1">Total Beds</p>
                      <p className="text-2xl font-bold text-slate-900">{ward.total_beds || 0}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded">
                      <p className="text-xs text-slate-600 mb-1">Occupied</p>
                      <p className="text-2xl font-bold text-red-600">{ward.occupied_beds || 0}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded">
                      <p className="text-xs text-slate-600 mb-1">Available</p>
                      <p className="text-2xl font-bold text-green-600">{ward.available_beds || 0}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded">
                      <p className="text-xs text-slate-600 mb-1">Staff</p>
                      <p className="text-2xl font-bold text-blue-600">{ward.staff_count || 0}</p>
                    </div>
                  </div>

                  {ward.head_of_department && (
                    <div className="pt-3 border-t border-slate-200 flex items-center gap-2">
                      <Users className="h-4 w-4 text-slate-600" />
                      <span className="text-sm text-slate-700">{ward.head_of_department}</span>
                    </div>
                  )}

                  {/* Occupancy Progress Bar */}
                  <div className="pt-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-semibold text-slate-700">Occupancy</span>
                      <span className="text-xs font-bold text-slate-900">
                        {ward.total_beds > 0 ? Math.round((ward.occupied_beds / ward.total_beds) * 100) : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition ${
                          ward.occupied_beds >= ward.total_beds * 0.8
                            ? 'bg-red-500'
                            : ward.occupied_beds >= ward.total_beds * 0.5
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{
                          width: `${ward.total_beds > 0 ? (ward.occupied_beds / ward.total_beds) * 100 : 0}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
