import React from 'react';
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { 
  AlertTriangle, 
  Heart, 
  Pill, 
  FileText, 
  Bell, 
  CheckCircle, 
  Clock,
  User,
  ChevronRight
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

const alertTypeConfig = {
  vital_anomaly: { icon: Heart, color: 'text-red-500', bg: 'bg-red-50' },
  fall_detected: { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50' },
  medicine_due: { icon: Pill, color: 'text-blue-500', bg: 'bg-blue-50' },
  medicine_missed: { icon: Pill, color: 'text-amber-500', bg: 'bg-amber-50' },
  lab_critical: { icon: FileText, color: 'text-purple-500', bg: 'bg-purple-50' },
  patient_call: { icon: Bell, color: 'text-green-500', bg: 'bg-green-50' },
  equipment_alarm: { icon: AlertTriangle, color: 'text-gray-500', bg: 'bg-gray-50' },
  discharge_ready: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  allergy_warning: { icon: AlertTriangle, color: 'text-pink-500', bg: 'bg-pink-50' },
  interaction_warning: { icon: Pill, color: 'text-rose-500', bg: 'bg-rose-50' }
};

const severityConfig = {
  info: { color: 'bg-slate-100 text-slate-700', pulse: false },
  low: { color: 'bg-blue-100 text-blue-700', pulse: false },
  medium: { color: 'bg-amber-100 text-amber-700', pulse: false },
  high: { color: 'bg-orange-100 text-orange-700', pulse: true },
  critical: { color: 'bg-red-100 text-red-700', pulse: true }
};

export default function AlertCard({ alert, onAcknowledge, compact = false, className = '' }) {
  const typeConfig = alertTypeConfig[alert.alert_type] || alertTypeConfig.vital_anomaly;
  const severity = severityConfig[alert.severity] || severityConfig.medium;
  const Icon = typeConfig.icon;

  const safeToDate = (value) => {
    try {
      if (!value) return new Date();
      if (typeof value?.toDate === 'function') return value.toDate();
      if (typeof value === 'number') return new Date(value);
      if (typeof value === 'string') {
        const d = new Date(value);
        return isNaN(d) ? new Date() : d;
      }
      const d = new Date(value);
      return isNaN(d) ? new Date() : d;
    } catch {
      return new Date();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Card className={`overflow-hidden border-l-4 ${
        alert.severity === 'critical' ? 'border-l-red-500' :
        alert.severity === 'high' ? 'border-l-orange-500' :
        alert.severity === 'medium' ? 'border-l-amber-500' :
        'border-l-slate-300'
      } ${severity.pulse ? 'animate-pulse' : ''} ${className}`}>
        <CardContent className={(compact ? 'p-2.5' : 'p-4') + ' pr-4'}>
          <div className={`flex items-start ${compact ? 'gap-2' : 'gap-3'}`}>
            <div className={`${compact ? 'p-1.5' : 'p-2'} rounded-lg ${typeConfig.bg}`}>
              <Icon className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} ${typeConfig.color}`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className={`flex items-center gap-2 ${compact ? 'mb-0.5' : 'mb-1'}`}>
                <h4 className={`font-semibold text-slate-900 break-words whitespace-normal ${compact ? 'text-sm' : 'text-base'}`}>{alert.title}</h4>
                <Badge className={`${severity.color} ${compact ? 'text-[10px] px-1.5 py-0.5' : ''}`} variant="secondary">
                  {alert.severity}
                </Badge>
              </div>
              
              <p className={`${compact ? 'text-xs' : 'text-sm'} text-slate-600 ${compact ? 'mb-1' : 'mb-2'} break-words whitespace-pre-line leading-snug`}>{alert.message}</p>
              
              {alert.patient_name && (
                <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
                  <User className="h-3 w-3" />
                  <span>{alert.patient_name}</span>
                  {alert.bed_number && (
                    <>
                      <span className="mx-1">•</span>
                      <span>Bed {alert.bed_number}</span>
                    </>
                  )}
                </div>
              )}

              {alert.ai_recommendation && (
                <div className="bg-slate-50 rounded-lg p-2 text-xs text-slate-600 mb-2">
                  <span className="font-medium">AI Suggestion: </span>
                  {alert.ai_recommendation}
                </div>
              )}

              <div className="flex items-center justify-between gap-2">
                <div className={`flex items-center gap-1 ${compact ? 'text-[11px]' : 'text-xs'} text-slate-400`}>
                  <Clock className={`${compact ? 'h-3 w-3' : 'h-3 w-3'}`} />
                  {formatDistanceToNow(safeToDate(alert.created_date), { addSuffix: true })}
                </div>
                
                {alert.status === 'active' && (
                  <div className="flex gap-2 shrink-0">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-7 text-xs whitespace-nowrap shrink-0"
                      onClick={() => onAcknowledge(alert)}
                    >
                      Acknowledge
                    </Button>
                  </div>
                )}
                
                {alert.status === 'acknowledged' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`${compact ? 'text-[11px]' : 'text-xs'} text-amber-600 whitespace-nowrap`}>Acknowledged by {alert.acknowledged_by || 'staff'}</span>
                  </div>
                )}
                
                {alert.status === 'resolved' && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Resolved
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}