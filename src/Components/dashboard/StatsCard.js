import React, { useState } from 'react';
import { Card, CardContent } from "../ui/card";
import { motion } from 'framer-motion';

export default function StatsCard({ title, value, subtitle, icon: Icon, color, trend, trendUp, onClick }) {
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

  // Click ripple effect
  const [ripple, setRipple] = useState(null);
  const handleMouseDown = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRipple({ x, y, id: Date.now() });
    // Clear ripple after animation
    setTimeout(() => setRipple(null), 600);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
    >
      <Card className="overflow-hidden relative transition-all duration-300 shadow-sm hover:shadow-xl rounded-xl" onMouseDown={handleMouseDown}>
        {/* Luxury shimmer on hover */}
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-0 hover:opacity-100"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          style={{
            background: 'linear-gradient(120deg, rgba(255,255,255,0) 20%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0) 80%)'
          }}
        />
        {/* Ripple effect */}
        {ripple && (
          <motion.span
            key={ripple.id}
            className="pointer-events-none absolute rounded-full"
            initial={{ scale: 0, opacity: 0.4 }}
            animate={{ scale: 2.2, opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              top: ripple.y - 150,
              left: ripple.x - 150,
              width: 300,
              height: 300,
              background: 'radial-gradient(circle, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 60%)'
            }}
          />
        )}
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
                <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color] || colorClasses.blue} bg-opacity-10 shadow-inner`}> 
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