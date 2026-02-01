import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '../api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "../Components/ui/card";
import { Button } from "../Components/ui/button";
import { Badge } from "../Components/ui/badge";
import { ScrollArea } from "../Components/ui/scroll-area";
import AlertCard from '../Components/dashboard/AlertCard.js';
import { AlertTriangle, Bell, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AlertsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('active');
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading, error } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const list = await base44.entities.Alert.list('-created_date', 200);
      return list.map(a => ({
        ...a,
        status: a.status || 'active',
        severity: a.severity || 'medium',
        created_date: a.created_date || new Date().toISOString()
      }));
    },
    refetchInterval: 1000 * 30
  });

  const updateAlert = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Alert.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] })
  });

  const handleAcknowledge = (alert) => {
    updateAlert.mutate({
      id: alert.id,
      data: {
        status: 'acknowledged',
        acknowledged_by: user?.name,
        acknowledged_at: new Date().toISOString()
      }
    });
  };

  // Patient status alerts only; nurses and office see critical/high severity patient status alerts
  const patientStatusAlerts = useMemo(() => {
    const base = alerts.filter(a => !!a.patient_id);
    if (user?.role === 'nurse' || user?.role === 'office') {
      return base.filter(a => {
        const type = (a.alert_type || '').toString().toLowerCase();
        const text = `${a.title || ''} ${a.message || ''}`.toLowerCase();
        const isAppointmentType = ['appointment', 'appointment_confirmed', 'booking', 'appointment_booked'].includes(type);
        const mentionsAppointment = text.includes('appointment');
        const severity = (a.severity || '').toLowerCase();
        const isCritical = severity === 'critical' || severity === 'high';
        return !(isAppointmentType || mentionsAppointment) && isCritical;
      });
    }
    return base;
  }, [alerts, user]);

  const activeAlerts = patientStatusAlerts.filter(a => a.status === 'active');
  const acknowledgedAlerts = patientStatusAlerts.filter(a => a.status === 'acknowledged');
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical' || a.severity === 'high');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-slate-700">Loading Alerts...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Unable to Load Alerts</h2>
          <Button onClick={() => queryClient.invalidateQueries()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Alerts</h1>
            <p className="text-slate-500 mt-1">Active and acknowledged alerts</p>
          </div>
          <Link to="/">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Alerts
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="rounded-md border border-slate-200 p-1 bg-white">
                  <button className={`px-2 py-1 text-xs rounded ${tab==='active' ? 'bg-slate-900 text-white' : 'text-slate-700'}`} onClick={() => setTab('active')}>
                    Active ({activeAlerts.length})
                  </button>
                  <button className={`px-2 py-1 text-xs rounded ${tab==='ack' ? 'bg-slate-900 text-white' : 'text-slate-700'}`} onClick={() => setTab('ack')}>
                    Acknowledged ({acknowledgedAlerts.length})
                  </button>
                </div>
                {criticalAlerts.length > 0 && (
                  <Badge variant="destructive" className="animate-pulse">{criticalAlerts.length} Critical</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {(tab === 'active' ? activeAlerts : acknowledgedAlerts).length === 0 ? (
              <div className="text-center py-12">
                <AlertTriangle className="h-10 w-10 text-slate-300 mb-2" />
                <p className="text-slate-500">No {(tab==='active') ? 'active' : 'acknowledged'} alerts</p>
              </div>
            ) : (
              <ScrollArea className="h-[70vh] pr-4">
                <div className="space-y-2">
                  {(tab === 'active' ? activeAlerts : acknowledgedAlerts).map(alert => (
                    <AlertCard key={alert.id} alert={alert} onAcknowledge={handleAcknowledge} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
