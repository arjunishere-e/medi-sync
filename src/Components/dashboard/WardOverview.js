import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '../../api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { RefreshCw, Bed, AlertCircle, Users } from 'lucide-react';
import { Button } from "../ui/button";
import { useQueryClient } from '@tanstack/react-query';

/**
 * Ward Status Overview - Read-only view for nurses
 * Shows ward occupancy and status without edit/delete/add functionality
 * Calculates occupancy dynamically from actual patient assignments
 */
export default function WardOverview() {
  const queryClient = useQueryClient();
  
  // Fetch wards from database
  const { data: wards = [], isLoading: wardsLoading, error: wardsError } = useQuery({
    queryKey: ['wards'],
    queryFn: () => base44.entities.Ward.list(),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5
  });

  // Fetch patients to calculate actual occupancy
  const { data: patients = [], isLoading: patientsLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: () => base44.entities.Patient.list('-created_date', 50),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10
  });

  // Calculate ward occupancy dynamically from patients (excluding discharged)
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

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Ward Status Overview</h1>
            <p className="text-slate-600 mt-1">View ward occupancy and bed allocations</p>
          </div>
          <Button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['wards'] }) ||
                             queryClient.invalidateQueries({ queryKey: ['patients'] })}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Wards List */}
        {wardsLoading || patientsLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-slate-300" />
          </div>
        ) : wardsError ? (
          <Card className="border-2 border-red-300 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-red-600" />
                <div>
                  <p className="font-semibold text-red-900">Error loading wards</p>
                  <p className="text-red-700 text-sm">{wardsError.message}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : wards.length === 0 ? (
          <Card className="border-2 border-slate-300">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Bed className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                <h3 className="text-lg font-medium text-slate-900 mb-1">No wards available</h3>
                <p className="text-slate-500 mb-4">No wards have been created yet</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wards.map(ward => {
              const occupiedBeds = wardOccupancy.get(ward.id) || 0;
              const totalBeds = ward.total_beds || 0;
              const availableBeds = totalBeds - occupiedBeds;
              const occupancyPercent = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

              return (
                <Card key={ward.id} className="border-2 border-slate-300 hover:border-blue-400 transition">
                  <CardHeader className="pb-3">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-slate-900">{ward.name}</CardTitle>
                      <p className="text-sm text-slate-600 mt-1">{ward.department}</p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Occupancy Display */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-slate-700">Occupancy</span>
                        <span className="text-sm font-bold text-slate-900">
                          {occupiedBeds}/{totalBeds}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition ${
                            occupiedBeds >= totalBeds * 0.8
                              ? 'bg-red-500'
                              : occupiedBeds >= totalBeds * 0.5
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{
                            width: `${totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0}%`
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Bed Stats */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="bg-green-50 p-3 rounded">
                        <p className="text-xs text-slate-600 mb-1">Available</p>
                        <p className="text-2xl font-bold text-green-600">{availableBeds}</p>
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
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
