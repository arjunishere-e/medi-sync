import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { Heart, Activity, Thermometer, Syringe, ChevronRight } from 'lucide-react';

/**
 * Nurse-specific Patients Overview
 * Table-style rounds list that’s clearly different from card grid.
 * Shows bedside essentials with quick actions.
 */
export default function NursePatientsOverview({ patients = [], getLatestVitals, getAlertCount, wards = [] }) {
  const wardName = (wardId) => wards.find(w => w.id === wardId)?.name || 'Ward';

  const statusBadge = (status) => {
    const map = {
      critical: 'destructive',
      recovering: 'secondary',
      stable: 'default'
    };
    const variant = map[status] || 'outline';
    return (
      <Badge variant={variant} className="capitalize">
        {status || 'unknown'}
      </Badge>
    );
  };

  return (
    <Card>
      <CardContent className="pt-4">
        {patients.length === 0 ? (
          <div className="text-center py-8 text-slate-500">No patients to display</div>
        ) : (
          <ScrollArea className="h-[480px] pr-4">
            <div className="min-w-full">
              <div className="grid grid-cols-12 px-3 py-2 text-xs font-semibold text-slate-600">
                <div className="col-span-4">Patient • Bed • Ward</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-3">Last Vitals</div>
                <div className="col-span-1">Alerts</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              <div className="divide-y divide-slate-200">
                {patients.map((p) => {
                  const v = getLatestVitals?.(p.id);
                  const alerts = getAlertCount?.(p.id) || 0;
                  return (
                    <div key={p.id} className="grid grid-cols-12 items-center px-3 py-3">
                      <div className="col-span-4">
                        <div className="font-medium text-slate-900">{p.full_name || p.name}</div>
                        <div className="text-xs text-slate-600 mt-0.5">
                          Bed {p.bed_number || p.bed || '—'} • {wardName(p.ward_id)}
                        </div>
                      </div>
                      <div className="col-span-2">
                        {statusBadge(p.status)}
                      </div>
                      <div className="col-span-3">
                        {v ? (
                          <div className="flex items-center gap-3 text-sm">
                            <span className="inline-flex items-center gap-1 text-slate-700"><Heart className="h-4 w-4 text-rose-500" />{v.heart_rate || '—'}</span>
                            <span className="inline-flex items-center gap-1 text-slate-700"><Activity className="h-4 w-4 text-indigo-500" />{v.blood_pressure || '—/—'}</span>
                            <span className="inline-flex items-center gap-1 text-slate-700"><Thermometer className="h-4 w-4 text-orange-500" />{v.temperature ? `${v.temperature}°` : '—'}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">No vitals recorded</span>
                        )}
                      </div>
                      <div className="col-span-1">
                        {alerts > 0 ? (
                          <Badge variant="destructive">{alerts}</Badge>
                        ) : (
                          <Badge variant="outline">0</Badge>
                        )}
                      </div>
                      <div className="col-span-2 flex items-center justify-end gap-2">
                        <Link to={`/patients/${p.id}`} className="inline-flex">
                          <Button variant="ghost" size="sm" className="gap-1">
                            View <ChevronRight className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm" className="gap-1">
                          <Syringe className="h-4 w-4" /> Meds
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
