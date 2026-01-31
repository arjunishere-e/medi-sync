import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { 
  Pill, 
  Clock, 
  AlertTriangle, 
  CheckCircle2,
  XCircle,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';

const statusConfig = {
  pending: { color: 'bg-amber-100 text-amber-700', icon: Clock },
  administered: { color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  missed: { color: 'bg-red-100 text-red-700', icon: XCircle },
  skipped: { color: 'bg-slate-100 text-slate-700', icon: XCircle },
  refused: { color: 'bg-orange-100 text-orange-700', icon: XCircle }
};

export default function MedicineScheduleCard({ schedule, onAdminister, showPatientInfo = true }) {
  const config = statusConfig[schedule.status] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <Card className={`overflow-hidden ${schedule.interaction_warning || schedule.allergy_warning ? 'ring-2 ring-amber-400' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-50">
            <Pill className="h-5 w-5 text-blue-500" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-slate-900">{schedule.medicine_name}</h4>
              <Badge className={config.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {schedule.status}
              </Badge>
            </div>
            
            <p className="text-sm text-slate-600 mb-2">
              {schedule.dosage} • {schedule.frequency?.replace(/_/g, ' ')}
            </p>

            {schedule.scheduled_times && (
              <div className="flex flex-wrap gap-1 mb-2">
                {schedule.scheduled_times.map((time, idx) => (
                  <span key={idx} className="text-xs bg-slate-100 px-2 py-0.5 rounded">
                    {time}
                  </span>
                ))}
              </div>
            )}

            {(schedule.interaction_warning || schedule.allergy_warning) && (
              <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="text-xs text-amber-700">
                  {schedule.allergy_warning && 'Allergy warning! '}
                  {schedule.interaction_warning && 'Drug interaction warning!'}
                </span>
              </div>
            )}

            {schedule.instructions && (
              <p className="text-xs text-slate-500 mb-2">{schedule.instructions}</p>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Prescribed by {schedule.prescribed_by || 'Unknown'}
              </span>
              
              {schedule.status === 'pending' && onAdminister && (
                <Button 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={() => onAdminister(schedule)}
                >
                  Administer
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}