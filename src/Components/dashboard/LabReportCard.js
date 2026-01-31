import React from 'react';
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { 
  FileText, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Download,
  Eye,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';

const statusConfig = {
  ordered: { color: 'bg-slate-100 text-slate-700', icon: Clock },
  sample_collected: { color: 'bg-blue-100 text-blue-700', icon: Clock },
  processing: { color: 'bg-amber-100 text-amber-700', icon: Loader2 },
  completed: { color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  cancelled: { color: 'bg-red-100 text-red-700', icon: AlertCircle }
};

const testTypeIcons = {
  blood_test: '🩸',
  urine_test: '🧪',
  xray: '📷',
  mri: '🔬',
  ct_scan: '🔬',
  ecg: '💓',
  ultrasound: '📊',
  biopsy: '🔬',
  culture: '🧫',
  other: '📋'
};

export default function LabReportCard({ report, onView }) {
  const config = statusConfig[report.status] || statusConfig.ordered;
  const StatusIcon = config.icon;

  return (
    <Card className={`overflow-hidden ${report.critical_findings ? 'ring-2 ring-red-400' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">
            {testTypeIcons[report.test_type] || '📋'}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-slate-900">{report.test_name}</h4>
              <Badge className={config.color}>
                <StatusIcon className={`h-3 w-3 mr-1 ${report.status === 'processing' ? 'animate-spin' : ''}`} />
                {report.status?.replace(/_/g, ' ')}
              </Badge>
              {report.critical_findings && (
                <Badge variant="destructive">Critical</Badge>
              )}
            </div>
            
            <p className="text-sm text-slate-600 mb-2">
              {report.test_type?.replace(/_/g, ' ')}
            </p>

            {report.ai_summary && (
              <div className="p-2 bg-slate-50 rounded-lg mb-2">
                <p className="text-xs text-slate-600">{report.ai_summary}</p>
              </div>
            )}

            {report.results && report.results.length > 0 && (
              <div className="space-y-1 mb-2">
                {report.results.slice(0, 3).map((result, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">{result.parameter}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{result.value} {result.unit}</span>
                      <Badge 
                        variant={result.status === 'normal' ? 'secondary' : 'destructive'}
                        className="text-[10px] px-1 py-0"
                      >
                        {result.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {report.results.length > 3 && (
                  <span className="text-xs text-slate-400">+{report.results.length - 3} more results</span>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {report.completed_date 
                  ? format(new Date(report.completed_date), 'MMM d, yyyy HH:mm')
                  : format(new Date(report.ordered_date || report.created_date), 'MMM d, yyyy')}
              </span>
              
              <div className="flex gap-2">
                {report.file_url && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => window.open(report.file_url, '_blank')}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                )}
                <Button 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={() => onView(report)}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}