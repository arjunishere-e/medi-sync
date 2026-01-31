import React, { useEffect } from 'react';
import { base44 } from '../../api/base44Client';

// Threshold-based anomaly detection rules
const thresholdRules = {
  heart_rate: { low: 50, high: 120, criticalLow: 40, criticalHigh: 150 },
  blood_pressure_systolic: { low: 90, high: 140, criticalLow: 70, criticalHigh: 180 },
  blood_pressure_diastolic: { low: 60, high: 90, criticalLow: 50, criticalHigh: 120 },
  temperature: { low: 36, high: 37.5, criticalLow: 35, criticalHigh: 39.5 },
  spo2: { low: 95, high: 100, criticalLow: 90, criticalHigh: 101 },
  respiratory_rate: { low: 12, high: 20, criticalLow: 8, criticalHigh: 30 }
};

// Simple statistical anomaly detection (Z-score based)
const calculateZScore = (value, mean, stdDev) => {
  if (stdDev === 0) return 0;
  return Math.abs((value - mean) / stdDev);
};

// Isolation Forest-like scoring (simplified)
const calculateIsolationScore = (readings, currentReading) => {
  let anomalyScore = 0;
  const metrics = ['heart_rate', 'blood_pressure_systolic', 'temperature', 'spo2'];
  
  metrics.forEach(metric => {
    const values = readings.map(r => r[metric]).filter(v => v !== null && v !== undefined);
    if (values.length < 2) return;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length);
    
    const zScore = calculateZScore(currentReading[metric], mean, stdDev);
    if (zScore > 2) anomalyScore += zScore - 2;
  });
  
  return anomalyScore;
};

// Rate of change detection (ARIMA-like trend analysis)
const detectRateOfChange = (readings, metric, threshold = 20) => {
  if (readings.length < 3) return false;
  
  const recentValues = readings.slice(0, 3).map(r => r[metric]).filter(v => v != null);
  if (recentValues.length < 2) return false;
  
  const changes = [];
  for (let i = 0; i < recentValues.length - 1; i++) {
    changes.push(Math.abs(recentValues[i] - recentValues[i + 1]));
  }
  
  const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
  return avgChange > threshold;
};

export async function detectAnomalies(currentReading, historicalReadings) {
  const anomalies = [];
  
  // 1. Threshold-based detection
  Object.entries(thresholdRules).forEach(([metric, rules]) => {
    const value = currentReading[metric];
    if (value === null || value === undefined) return;
    
    if (value <= rules.criticalLow || value >= rules.criticalHigh) {
      anomalies.push({
        type: 'threshold_critical',
        metric,
        value,
        severity: 'critical',
        message: `Critical ${metric.replace(/_/g, ' ')}: ${value}`
      });
    } else if (value < rules.low || value > rules.high) {
      anomalies.push({
        type: 'threshold_warning',
        metric,
        value,
        severity: value < rules.low - 5 || value > rules.high + 5 ? 'high' : 'medium',
        message: `Abnormal ${metric.replace(/_/g, ' ')}: ${value}`
      });
    }
  });
  
  // 2. Statistical anomaly detection (Isolation Forest-like)
  if (historicalReadings.length >= 5) {
    const isolationScore = calculateIsolationScore(historicalReadings, currentReading);
    if (isolationScore > 3) {
      anomalies.push({
        type: 'statistical_outlier',
        severity: isolationScore > 5 ? 'high' : 'medium',
        message: 'Unusual combination of vital signs detected'
      });
    }
  }
  
  // 3. Rate of change detection (ARIMA-like)
  ['heart_rate', 'blood_pressure_systolic', 'temperature'].forEach(metric => {
    const rapidChange = detectRateOfChange(
      [currentReading, ...historicalReadings], 
      metric,
      metric === 'temperature' ? 0.5 : 15
    );
    if (rapidChange) {
      anomalies.push({
        type: 'rapid_change',
        metric,
        severity: 'medium',
        message: `Rapid change in ${metric.replace(/_/g, ' ')} detected`
      });
    }
  });
  
  // 4. Motion + vital correlation (fall detection)
  if (currentReading.motion_detected === false && historicalReadings[0]?.motion_detected === true) {
    const heartRateSpike = currentReading.heart_rate > historicalReadings[0]?.heart_rate * 1.3;
    if (heartRateSpike) {
      anomalies.push({
        type: 'fall_suspected',
        severity: 'high',
        message: 'Possible fall detected - sudden movement stop with heart rate spike'
      });
    }
  }
  
  return anomalies;
}

export async function generateAIRecommendation(anomalies, patient) {
  if (anomalies.length === 0) return null;
  
  try {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a clinical decision support AI. A patient has the following anomalies detected:

Patient: ${patient?.full_name || 'Unknown'}
Primary Diagnosis: ${patient?.primary_diagnosis || 'Unknown'}
Allergies: ${patient?.allergies?.join(', ') || 'None listed'}

Detected Anomalies:
${anomalies.map(a => `- ${a.severity.toUpperCase()}: ${a.message}`).join('\n')}

Provide a brief, actionable recommendation (max 2 sentences) for the medical staff. Focus on immediate actions if critical.`,
      response_json_schema: {
        type: "object",
        properties: {
          recommendation: { type: "string" },
          urgency: { type: "string", enum: ["routine", "urgent", "immediate"] },
          notify_doctor: { type: "boolean" }
        }
      }
    });
    
    return result;
  } catch (error) {
    console.error('Error generating AI recommendation:', error);
    return {
      recommendation: 'Please review the detected anomalies and assess the patient.',
      urgency: anomalies.some(a => a.severity === 'critical') ? 'immediate' : 'urgent',
      notify_doctor: anomalies.some(a => a.severity === 'critical' || a.severity === 'high')
    };
  }
}

// This module provides anomaly detection functions
// No default component needed - functions are exported directly