import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Activity, Heart, Thermometer, Wind } from 'lucide-react';
import { format } from 'date-fns';

const vitalConfigs = {
  heart_rate: {
    label: 'Heart Rate',
    unit: 'BPM',
    color: '#ef4444',
    icon: Heart,
    normalRange: [60, 100],
    criticalLow: 50,
    criticalHigh: 120
  },
  blood_pressure_systolic: {
    label: 'Systolic BP',
    unit: 'mmHg',
    color: '#3b82f6',
    icon: Activity,
    normalRange: [90, 140],
    criticalLow: 80,
    criticalHigh: 180
  },
  temperature: {
    label: 'Temperature',
    unit: '°C',
    color: '#f59e0b',
    icon: Thermometer,
    normalRange: [36.1, 37.2],
    criticalLow: 35,
    criticalHigh: 39
  },
  spo2: {
    label: 'SpO2',
    unit: '%',
    color: '#10b981',
    icon: Wind,
    normalRange: [95, 100],
    criticalLow: 90,
    criticalHigh: 101
  }
};

export default function VitalsChart({ readings, vitalType, compact = false }) {
  const config = vitalConfigs[vitalType];
  const Icon = config.icon;
  
  const chartData = readings.map(r => ({
    time: format(new Date(r.timestamp), 'HH:mm'),
    value: r[vitalType],
    anomaly: r.anomaly_detected
  })).reverse();

  const latestValue = readings[0]?.[vitalType];
  const isNormal = latestValue >= config.normalRange[0] && latestValue <= config.normalRange[1];
  const isCritical = latestValue < config.criticalLow || latestValue > config.criticalHigh;

  return (
    <Card className={`overflow-hidden ${isCritical ? 'ring-2 ring-red-500' : ''}`}>
      <CardHeader className={`pb-2 ${compact ? 'p-3' : 'p-4'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg bg-opacity-10`} style={{ backgroundColor: `${config.color}20` }}>
              <Icon className="h-4 w-4" style={{ color: config.color }} />
            </div>
            <CardTitle className={`${compact ? 'text-sm' : 'text-base'} font-medium`}>
              {config.label}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className={`${compact ? 'text-xl' : 'text-2xl'} font-bold`} style={{ color: config.color }}>
              {latestValue?.toFixed(1) || '--'}
            </span>
            <span className="text-xs text-slate-500">{config.unit}</span>
            <Badge variant={isCritical ? 'destructive' : isNormal ? 'secondary' : 'outline'} className="text-xs">
              {isCritical ? 'Critical' : isNormal ? 'Normal' : 'Warning'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className={compact ? 'p-2' : 'p-4 pt-0'}>
        <div className={compact ? 'h-24' : 'h-40'}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 10, fill: '#94a3b8' }} 
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                domain={['dataMin - 5', 'dataMax + 5']} 
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                formatter={(value) => [`${value} ${config.unit}`, config.label]}
              />
              <ReferenceLine y={config.normalRange[0]} stroke="#94a3b8" strokeDasharray="5 5" />
              <ReferenceLine y={config.normalRange[1]} stroke="#94a3b8" strokeDasharray="5 5" />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={config.color}
                strokeWidth={2}
                dot={{ fill: config.color, strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, fill: config.color }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
          <span>Normal: {config.normalRange[0]}-{config.normalRange[1]} {config.unit}</span>
          <span>Last {chartData.length} readings</span>
        </div>
      </CardContent>
    </Card>
  );
}