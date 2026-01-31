import React, { useState } from 'react';
import { base44 } from '../api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from "../Components/ui/card";
import { Button } from "../Components/ui/button";
import { Input } from "../Components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../Components/ui/select";
import { 
  Search, 
  Plus, 
  Users,
  Grid,
  List,
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import PatientCard from '../Components/dashboard/PatientCard.js';

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'admitted', label: 'Admitted' },
  { value: 'critical', label: 'Critical' },
  { value: 'stable', label: 'Stable' },
  { value: 'recovering', label: 'Recovering' },
  { value: 'discharged', label: 'Discharged' }
];

export default function Patients() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [wardFilter, setWardFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: () => base44.entities.Patient.list('-created_date', 100)
  });

  const { data: vitals = [] } = useQuery({
    queryKey: ['allVitals'],
    queryFn: () => base44.entities.VitalReading.list('-timestamp', 500)
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['allAlerts'],
    queryFn: () => base44.entities.Alert.filter({ status: 'active' })
  });

  const { data: wards = [] } = useQuery({
    queryKey: ['wards'],
    queryFn: () => base44.entities.Ward.list()
  });

  const getLatestVitals = (patientId) => {
    return vitals.find(v => v.patient_id === patientId);
  };

  const getAlertCount = (patientId) => {
    return alerts.filter(a => a.patient_id === patientId).length;
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = !searchQuery || 
      patient.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.bed_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.primary_diagnosis?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || patient.status === statusFilter;
    const matchesWard = wardFilter === 'all' || patient.ward_id === wardFilter;
    
    return matchesSearch && matchesStatus && matchesWard;
  });

  const stats = {
    total: patients.length,
    critical: patients.filter(p => p.status === 'critical').length,
    stable: patients.filter(p => p.status === 'stable').length,
    admitted: patients.filter(p => p.status === 'admitted').length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Patients</h1>
            <p className="text-slate-500 mt-1">Manage and monitor all patients</p>
          </div>
          <Link to="/patient-registration">
            <Button className="gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
              <Plus className="h-4 w-4" />
              Add Patient
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Total Patients</p>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-sm text-red-600">Critical</p>
              <p className="text-2xl font-bold text-red-700">{stats.critical}</p>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <p className="text-sm text-green-600">Stable</p>
              <p className="text-2xl font-bold text-green-700">{stats.stable}</p>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <p className="text-sm text-blue-600">Newly Admitted</p>
              <p className="text-2xl font-bold text-blue-700">{stats.admitted}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by name, bed, or diagnosis..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={wardFilter} onValueChange={setWardFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Ward" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Wards</SelectItem>
                  {wards.map(ward => (
                    <SelectItem key={ward.id} value={ward.id}>{ward.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Patient List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : filteredPatients.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <h3 className="text-lg font-medium text-slate-900 mb-1">No Patients Found</h3>
              <p className="text-slate-500 mb-4">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your filters'
                  : 'Get started by adding your first patient'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Link to="/patient-registration">
                  <Button>Add Patient</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {filteredPatients.map(patient => (
              <Link key={patient.id} to={`/patients/${patient.id}`}>
                <PatientCard
                  patient={patient}
                  latestVitals={getLatestVitals(patient.id)}
                  alertCount={getAlertCount(patient.id)}
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
