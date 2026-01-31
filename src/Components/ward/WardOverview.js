import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { 
  Bed,
  Users,
  AlertTriangle,
  Activity,
  Stethoscope
} from 'lucide-react';

const wardTypeColors = {
  general: 'from-blue-500 to-blue-600',
  icu: 'from-red-500 to-red-600',
  pediatric: 'from-pink-500 to-pink-600',
  maternity: 'from-purple-500 to-purple-600',
  surgical: 'from-emerald-500 to-emerald-600',
  cardiac: 'from-rose-500 to-rose-600',
  oncology: 'from-amber-500 to-amber-600',
  emergency: 'from-orange-500 to-orange-600',
  psychiatric: 'from-indigo-500 to-indigo-600'
};

export default function WardOverview({ ward, patients, alerts }) {
  const occupancyRate = ward.total_beds > 0 
    ? Math.round((ward.occupied_beds / ward.total_beds) * 100) 
    : 0;

  const criticalPatients = patients?.filter(p => p.status === 'critical').length || 0;
  const activeAlerts = alerts?.filter(a => a.status === 'active').length || 0;

  return (
    <Card className="overflow-hidden">
      <div className={`h-2 bg-gradient-to-r ${wardTypeColors[ward.ward_type] || wardTypeColors.general}`} />
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{ward.name}</CardTitle>
            <p className="text-sm text-slate-500">{ward.code} • Floor {ward.floor}</p>
          </div>
          <Badge variant="secondary" className="capitalize">
            {ward.ward_type?.replace(/_/g, ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-slate-600">Bed Occupancy</span>
              <span className="text-sm font-medium">{ward.occupied_beds}/{ward.total_beds}</span>
            </div>
            <Progress value={occupancyRate} className="h-2" />
            <span className="text-xs text-slate-400">{occupancyRate}% occupied</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-slate-500">Patients</span>
              </div>
              <span className="text-xl font-bold">{patients?.length || 0}</span>
            </div>
            
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Stethoscope className="h-4 w-4 text-green-500" />
                <span className="text-xs text-slate-500">Staff</span>
              </div>
              <span className="text-xl font-bold">
                {(ward.assigned_doctors?.length || 0) + (ward.assigned_nurses?.length || 0)}
              </span>
            </div>
            
            <div className={`p-3 rounded-lg ${criticalPatients > 0 ? 'bg-red-50' : 'bg-slate-50'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Activity className={`h-4 w-4 ${criticalPatients > 0 ? 'text-red-500' : 'text-slate-400'}`} />
                <span className="text-xs text-slate-500">Critical</span>
              </div>
              <span className={`text-xl font-bold ${criticalPatients > 0 ? 'text-red-600' : ''}`}>
                {criticalPatients}
              </span>
            </div>
            
            <div className={`p-3 rounded-lg ${activeAlerts > 0 ? 'bg-amber-50' : 'bg-slate-50'}`}>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className={`h-4 w-4 ${activeAlerts > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
                <span className="text-xs text-slate-500">Alerts</span>
              </div>
              <span className={`text-xl font-bold ${activeAlerts > 0 ? 'text-amber-600' : ''}`}>
                {activeAlerts}
              </span>
            </div>
          </div>

          {ward.status !== 'active' && (
            <Badge 
              variant={ward.status === 'maintenance' ? 'secondary' : 'destructive'}
              className="w-full justify-center"
            >
              {ward.status}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}