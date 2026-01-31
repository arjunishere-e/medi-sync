import React from 'react';
import { base44 } from '../../api/base44Client';
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Badge } from "../ui/badge";
import { AlertTriangle, XCircle, CheckCircle } from 'lucide-react';

// Known drug interaction database (simplified rule-based system)
const knownInteractions = {
  'warfarin': ['aspirin', 'ibuprofen', 'naproxen', 'vitamin_k', 'st_johns_wort'],
  'aspirin': ['warfarin', 'ibuprofen', 'blood_thinners', 'methotrexate'],
  'metformin': ['contrast_dye', 'alcohol', 'cimetidine'],
  'lisinopril': ['potassium', 'spironolactone', 'nsaids'],
  'simvastatin': ['grapefruit', 'erythromycin', 'gemfibrozil'],
  'amlodipine': ['simvastatin', 'cyclosporine'],
  'omeprazole': ['clopidogrel', 'methotrexate'],
  'metoprolol': ['verapamil', 'clonidine', 'digoxin'],
  'prednisone': ['nsaids', 'warfarin', 'diabetes_medications'],
  'furosemide': ['digoxin', 'lithium', 'aminoglycosides']
};

// Severity classification rules (Decision Tree-like)
const classifyInteractionSeverity = (drug1, drug2, patientConditions = []) => {
  const highRiskPairs = [
    ['warfarin', 'aspirin'],
    ['metformin', 'contrast_dye'],
    ['clopidogrel', 'omeprazole'],
    ['lithium', 'furosemide']
  ];
  
  const isHighRisk = highRiskPairs.some(
    pair => (pair[0].includes(drug1.toLowerCase()) && pair[1].includes(drug2.toLowerCase())) ||
            (pair[1].includes(drug1.toLowerCase()) && pair[0].includes(drug2.toLowerCase()))
  );
  
  if (isHighRisk) return 'critical';
  
  // Check if patient has conditions that increase risk
  const riskConditions = ['kidney_disease', 'liver_disease', 'elderly', 'heart_failure'];
  const hasRiskCondition = patientConditions.some(c => 
    riskConditions.some(rc => c.toLowerCase().includes(rc))
  );
  
  return hasRiskCondition ? 'high' : 'moderate';
};

export async function checkDrugInteractions(newMedicine, currentMedicines, patient) {
  const interactions = [];
  const newDrugName = newMedicine.name?.toLowerCase() || newMedicine.medicine_name?.toLowerCase();
  
  // Rule-based interaction check
  currentMedicines.forEach(medicine => {
    const currentDrugName = medicine.name?.toLowerCase() || medicine.medicine_name?.toLowerCase();
    
    // Check in our known interactions database
    const newDrugInteractions = knownInteractions[newDrugName] || [];
    const currentDrugInteractions = knownInteractions[currentDrugName] || [];
    
    if (newDrugInteractions.some(i => currentDrugName.includes(i)) ||
        currentDrugInteractions.some(i => newDrugName.includes(i))) {
      const severity = classifyInteractionSeverity(
        newDrugName, 
        currentDrugName, 
        patient?.secondary_diagnoses || []
      );
      
      interactions.push({
        drug1: newMedicine.name || newMedicine.medicine_name,
        drug2: medicine.name || medicine.medicine_name,
        severity,
        type: 'known_interaction'
      });
    }
  });
  
  // Check for allergy conflicts
  const patientAllergies = patient?.allergies || [];
  patientAllergies.forEach(allergy => {
    if (newDrugName.includes(allergy.toLowerCase()) ||
        newMedicine.allergy_triggers?.some(t => t.toLowerCase().includes(allergy.toLowerCase()))) {
      interactions.push({
        drug1: newMedicine.name || newMedicine.medicine_name,
        drug2: allergy,
        severity: 'critical',
        type: 'allergy'
      });
    }
  });
  
  // Use AI for additional analysis if interactions found
  if (interactions.length > 0) {
    try {
      const aiAnalysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze these potential drug interactions for clinical significance:

Patient: ${patient?.full_name || 'Unknown'}
Primary Diagnosis: ${patient?.primary_diagnosis || 'Unknown'}
Known Allergies: ${patientAllergies.join(', ') || 'None'}

New Medication: ${newMedicine.name || newMedicine.medicine_name} (${newMedicine.dosage || ''})

Potential Interactions Found:
${interactions.map(i => `- ${i.drug1} + ${i.drug2}: ${i.severity} (${i.type})`).join('\n')}

Provide clinical guidance:`,
        response_json_schema: {
          type: "object",
          properties: {
            clinicalSignificance: { type: "string" },
            recommendation: { type: "string" },
            alternativeSuggestion: { type: "string" },
            monitoringRequired: { type: "boolean" },
            proceedWithCaution: { type: "boolean" }
          }
        }
      });
      
      return {
        interactions,
        aiAnalysis
      };
    } catch (error) {
      console.error('AI analysis error:', error);
      return { interactions, aiAnalysis: null };
    }
  }
  
  return { interactions, aiAnalysis: null };
}

export function DrugInteractionAlert({ result }) {
  if (!result || result.interactions.length === 0) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle>No Interactions Detected</AlertTitle>
        <AlertDescription>
          This medication appears safe to administer with current prescriptions.
        </AlertDescription>
      </Alert>
    );
  }
  
  const hasCritical = result.interactions.some(i => i.severity === 'critical');
  const hasAllergy = result.interactions.some(i => i.type === 'allergy');
  
  return (
    <div className="space-y-3">
      <Alert variant="destructive" className={hasCritical ? 'bg-red-50 border-red-300' : 'bg-amber-50 border-amber-300'}>
        {hasCritical ? (
          <XCircle className="h-4 w-4" />
        ) : (
          <AlertTriangle className="h-4 w-4" />
        )}
        <AlertTitle>
          {hasAllergy ? 'Allergy Warning!' : 'Drug Interaction Detected'}
        </AlertTitle>
        <AlertDescription>
          <div className="space-y-2 mt-2">
            {result.interactions.map((interaction, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Badge variant={interaction.severity === 'critical' ? 'destructive' : 'secondary'}>
                  {interaction.severity}
                </Badge>
                <span className="text-sm">
                  {interaction.type === 'allergy' 
                    ? `Patient allergic to: ${interaction.drug2}`
                    : `${interaction.drug1} ↔ ${interaction.drug2}`}
                </span>
              </div>
            ))}
          </div>
          
          {result.aiAnalysis && (
            <div className="mt-4 p-3 bg-white rounded-lg">
              <p className="text-sm font-medium mb-1">Clinical Guidance:</p>
              <p className="text-sm text-slate-600">{result.aiAnalysis.recommendation}</p>
              {result.aiAnalysis.alternativeSuggestion && (
                <p className="text-sm text-blue-600 mt-1">
                  <strong>Alternative:</strong> {result.aiAnalysis.alternativeSuggestion}
                </p>
              )}
            </div>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}