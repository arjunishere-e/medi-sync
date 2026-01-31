import React from 'react';
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { 
  Heart, 
  Activity, 
  Thermometer, 
  Wind,
  AlertTriangle,
  ChevronRight,
  Bed,
  Calendar
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

const statusColors = {
  admitted: 'bg-blue-100 text-blue-700',
  critical: 'bg-red-100 text-red-700',
  stable: 'bg-green-100 text-green-700',
  recovering: 'bg-emerald-100 text-emerald-700',
  discharged: 'bg-slate-100 text-slate-700'
};

export default function PatientCard({ patient, latestVitals, alertCount = 0, onClick }) {
  const daysAdmitted = patient.admission_date 
    ? differenceInDays(new Date(), new Date(patient.admission_date)) 
    : 0;

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'P';
  };

  const hasAnomalies = latestVitals?.anomaly_detected;

  return (
    <Card 
      className={`overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 ${
        hasAnomalies ? 'ring-2 ring-red-400' : ''
      } ${patient.status === 'critical' ? 'border-red-200' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-white shadow">
              <AvatarImage src={patient.photo_url} />
              <AvatarFallback className="bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600">
                {getInitials(patient.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-slate-900">{patient.full_name}</h3>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Bed className="h-3 w-3" />
                <span>Bed {patient.bed_number || 'N/A'}</span>
              </div>
              {patient.file_number && (
                <div className="text-xs text-slate-600 font-mono mt-1">
                  File #: {patient.file_number}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge className={statusColors[patient.status]}>
              {patient.status}
            </Badge>
            {alertCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {alertCount} alerts
              </Badge>
            )}
          </div>
        </div>

        <div className="text-sm text-slate-600 mb-3">
          <p className="truncate">{patient.primary_diagnosis || 'No diagnosis'}</p>
        </div>

        {latestVitals && (
          <div className="grid grid-cols-4 gap-2 mb-3">
            <div className="text-center p-2 bg-slate-50 rounded-lg">
              <Heart className="h-3 w-3 mx-auto mb-1 text-red-500" />
              <span className="text-xs font-medium">{latestVitals.heart_rate || '--'}</span>
            </div>
            <div className="text-center p-2 bg-slate-50 rounded-lg">
              <Activity className="h-3 w-3 mx-auto mb-1 text-blue-500" />
              <span className="text-xs font-medium">
                {latestVitals.blood_pressure_systolic || '--'}/{latestVitals.blood_pressure_diastolic || '--'}
              </span>
            </div>
            <div className="text-center p-2 bg-slate-50 rounded-lg">
              <Thermometer className="h-3 w-3 mx-auto mb-1 text-amber-500" />
              <span className="text-xs font-medium">{latestVitals.temperature?.toFixed(1) || '--'}°</span>
            </div>
            <div className="text-center p-2 bg-slate-50 rounded-lg">
              <Wind className="h-3 w-3 mx-auto mb-1 text-green-500" />
              <span className="text-xs font-medium">{latestVitals.spo2 || '--'}%</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Day {daysAdmitted + 1}</span>
          </div>
          <div className="flex items-center text-slate-600 font-medium">
            View Details
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}