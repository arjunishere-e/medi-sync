import React from 'react';
import { Badge } from "./badge";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Activity, Wifi, WifiOff, Server, Database, Zap } from 'lucide-react';

export default function SystemStatus() {
  const [systemStatus] = React.useState({
    api: 'online',
    database: 'online',
    ai: 'online',
    notifications: 'online'
  });

  const getStatusDot = (status) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-slate-400';
    }
  };

  const getStatusIcon = (type) => {
    const iconClass = "h-4 w-4";
    switch (type) {
      case 'api': return <Server className={iconClass} />;
      case 'database': return <Database className={iconClass} />;
      case 'ai': return <Zap className={iconClass} />;
      case 'notifications': return <Wifi className={iconClass} />;
      default: return <Server className={iconClass} />;
    }
  };

  const statusItems = [
    { label: 'API Services', key: 'api' },
    { label: 'Database', key: 'database' },
    { label: 'AI Services', key: 'ai' },
    { label: 'Notifications', key: 'notifications' }
  ];

  return (
    <Card className="border-2 border-slate-300">
      <CardHeader className="pb-3 bg-slate-50 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
          <Activity className="h-5 w-5 text-blue-600" />
          System Status
        </CardTitle>
        <p className="text-xs font-semibold text-green-600">● All Online</p>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-2">
          {statusItems.map((item) => (
            <div key={item.key} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition">
              <div className="flex items-center gap-2 flex-1">
                <div className="text-slate-600 flex-shrink-0">
                  {getStatusIcon(item.key)}
                </div>
                <span className="text-sm font-medium text-slate-700">{item.label}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className={`h-2 w-2 rounded-full ${getStatusDot(systemStatus[item.key])} animate-pulse`}></div>
                <span className="text-xs font-semibold text-green-600">
                  {systemStatus[item.key]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}