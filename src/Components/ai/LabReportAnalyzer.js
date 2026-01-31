import React, { useState } from 'react';
import { base44 } from '../../api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Loader2, Sparkles, FileText, AlertTriangle } from 'lucide-react';

// Reference ranges for common lab tests
const referenceRanges = {
  // Blood Count
  'hemoglobin': { unit: 'g/dL', male: [13.5, 17.5], female: [12.0, 15.5] },
  'wbc': { unit: 'cells/mcL', range: [4500, 11000] },
  'rbc': { unit: 'million/mcL', male: [4.5, 5.5], female: [4.0, 5.0] },
  'platelets': { unit: 'cells/mcL', range: [150000, 400000] },
  'hematocrit': { unit: '%', male: [38.8, 50], female: [34.9, 44.5] },
  
  // Metabolic Panel
  'glucose': { unit: 'mg/dL', range: [70, 100], fastingRange: [70, 100] },
  'creatinine': { unit: 'mg/dL', male: [0.7, 1.3], female: [0.6, 1.1] },
  'bun': { unit: 'mg/dL', range: [7, 20] },
  'sodium': { unit: 'mEq/L', range: [136, 145] },
  'potassium': { unit: 'mEq/L', range: [3.5, 5.0] },
  'chloride': { unit: 'mEq/L', range: [98, 106] },
  'co2': { unit: 'mEq/L', range: [23, 29] },
  
  // Liver Function
  'alt': { unit: 'U/L', range: [7, 56] },
  'ast': { unit: 'U/L', range: [10, 40] },
  'alp': { unit: 'U/L', range: [44, 147] },
  'bilirubin': { unit: 'mg/dL', range: [0.1, 1.2] },
  'albumin': { unit: 'g/dL', range: [3.5, 5.0] },
  
  // Lipid Panel
  'cholesterol': { unit: 'mg/dL', range: [0, 200] },
  'ldl': { unit: 'mg/dL', range: [0, 100] },
  'hdl': { unit: 'mg/dL', range: [40, 1000] },
  'triglycerides': { unit: 'mg/dL', range: [0, 150] },
  
  // Thyroid
  'tsh': { unit: 'mIU/L', range: [0.4, 4.0] },
  't4': { unit: 'mcg/dL', range: [4.5, 12.0] },
  't3': { unit: 'ng/dL', range: [80, 200] }
};

function interpretValue(parameter, value, gender = 'unknown') {
  const paramKey = parameter.toLowerCase().replace(/\s+/g, '');
  const ref = referenceRanges[paramKey];
  
  if (!ref) return { status: 'unknown', message: 'Reference not available' };
  
  let range = ref.range;
  if (ref.male && ref.female) {
    range = gender === 'male' ? ref.male : ref.female;
  }
  
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return { status: 'unknown', message: 'Invalid value' };
  
  if (numValue < range[0]) {
    const severity = numValue < range[0] * 0.7 ? 'critical' : 'low';
    return { status: severity, message: `Below normal (${range[0]}-${range[1]} ${ref.unit})` };
  }
  if (numValue > range[1]) {
    const severity = numValue > range[1] * 1.5 ? 'critical' : 'high';
    return { status: severity, message: `Above normal (${range[0]}-${range[1]} ${ref.unit})` };
  }
  
  return { status: 'normal', message: `Within normal range` };
}

export async function analyzeLabReport(report, patient) {
  const analysisResults = {
    interpretedResults: [],
    criticalFindings: [],
    summary: '',
    recommendations: []
  };
  
  // Interpret each result
  if (report.results && report.results.length > 0) {
    analysisResults.interpretedResults = report.results.map(result => {
      const interpretation = interpretValue(result.parameter, result.value, patient?.gender);
      if (interpretation.status === 'critical') {
        analysisResults.criticalFindings.push({
          parameter: result.parameter,
          value: result.value,
          unit: result.unit,
          interpretation
        });
      }
      return {
        ...result,
        interpretation
      };
    });
  }
  
  // Generate AI summary and recommendations
  try {
    const aiResult = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze these lab results and provide a clinical summary:

Patient: ${patient?.full_name || 'Unknown'}
Gender: ${patient?.gender || 'Unknown'}
Primary Diagnosis: ${patient?.primary_diagnosis || 'Unknown'}
Test Type: ${report.test_type?.replace(/_/g, ' ')}
Test Name: ${report.test_name}

Results:
${report.results?.map(r => `${r.parameter}: ${r.value} ${r.unit || ''}`).join('\n') || 'No results available'}

Critical Findings: ${analysisResults.criticalFindings.length > 0 
  ? analysisResults.criticalFindings.map(f => f.parameter).join(', ') 
  : 'None'}

Provide:
1. A brief clinical summary (2-3 sentences)
2. Key findings to highlight
3. Recommendations for the care team`,
      response_json_schema: {
        type: "object",
        properties: {
          summary: { type: "string" },
          keyFindings: { type: "array", items: { type: "string" } },
          recommendations: { type: "array", items: { type: "string" } },
          urgencyLevel: { type: "string", enum: ["routine", "monitor", "urgent", "critical"] }
        }
      }
    });
    
    analysisResults.summary = aiResult.summary;
    analysisResults.keyFindings = aiResult.keyFindings;
    analysisResults.recommendations = aiResult.recommendations;
    analysisResults.urgencyLevel = aiResult.urgencyLevel;
  } catch (error) {
    console.error('AI analysis error:', error);
    analysisResults.summary = 'Unable to generate AI summary. Please review results manually.';
  }
  
  return analysisResults;
}

export function LabAnalysisDisplay({ analysis, isLoading }) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-sm text-slate-500">Analyzing lab results with AI...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!analysis) return null;
  
  const urgencyColors = {
    routine: 'bg-green-100 text-green-700',
    monitor: 'bg-blue-100 text-blue-700',
    urgent: 'bg-amber-100 text-amber-700',
    critical: 'bg-red-100 text-red-700'
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            AI Analysis
          </CardTitle>
          {analysis.urgencyLevel && (
            <Badge className={urgencyColors[analysis.urgencyLevel]}>
              {analysis.urgencyLevel}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {analysis.criticalFindings?.length > 0 && (
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="font-semibold text-red-700">Critical Findings</span>
            </div>
            <ul className="text-sm text-red-600 space-y-1">
              {analysis.criticalFindings.map((finding, idx) => (
                <li key={idx}>
                  {finding.parameter}: {finding.value} {finding.unit} - {finding.interpretation.message}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div>
          <h4 className="font-medium mb-2">Summary</h4>
          <p className="text-sm text-slate-600">{analysis.summary}</p>
        </div>
        
        {analysis.keyFindings?.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Key Findings</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              {analysis.keyFindings.map((finding, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  {finding}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {analysis.recommendations?.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Recommendations</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              {analysis.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-green-500">→</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Interpreted Results */}
        {analysis.interpretedResults?.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Detailed Results</h4>
            <div className="space-y-2">
              {analysis.interpretedResults.map((result, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                  <span className="text-sm">{result.parameter}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{result.value} {result.unit}</span>
                    <Badge variant={
                      result.interpretation.status === 'normal' ? 'secondary' :
                      result.interpretation.status === 'critical' ? 'destructive' : 'outline'
                    }>
                      {result.interpretation.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}