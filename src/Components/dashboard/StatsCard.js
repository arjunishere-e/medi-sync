import React from 'react';
import { Card, CardContent } from "../ui/card";
import { motion } from 'framer-motion';

export default function StatsCard({ title, value, subtitle, icon: Icon, color, trend, trendUp }) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-emerald-600',
    amber: 'from-amber-500 to-amber-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
    slate: 'from-slate-500 to-slate-600'
  };

  // Fallback for missing icon
  const SafeIcon = Icon || (() => <div className="h-6 w-6 bg-gray-400 rounded"></div>);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex">
            <div className={`w-2 bg-gradient-to-b ${colorClasses[color] || colorClasses.blue}`} />
            <div className="flex-1 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{title || 'Statistic'}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{value || '0'}</p>
                  {subtitle && (
                    <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
                  )}
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color] || colorClasses.blue} bg-opacity-10`}>
                  <SafeIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              {trend && (
                <div className="flex items-center gap-1 mt-2">
                  <span className={`text-xs font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
                    {trendUp ? '↑' : '↓'} {trend}
                  </span>
                  <span className="text-xs text-slate-400">vs last hour</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}