// Mock API client for MediSync - with Firebase integration
import { firebaseClient } from './firebaseClient';

class Base44Client {
  constructor() {
    // Try to use Firebase if available, fallback to mock data
    this.useFirebase = this.checkFirebaseAvailable();
    
    this.entities = {
      Patient: {
        list: (order = '-created_date', limit = 50) => 
          this.useFirebase ? firebaseClient.patients.list(order, limit) : this.mockList('patients', limit),
        get: (id) => this.mockGet('patient', id),
        create: (data) => 
          this.useFirebase ? firebaseClient.patients.create(data) : this.mockCreate('patient', data),
        update: (id, data) => 
          this.useFirebase ? firebaseClient.patients.update(id, data) : this.mockUpdate('patient', id, data),
        delete: (id) => this.mockDelete('patient', id)
      },
      Alert: {
        list: (order = '-created_date', limit = 100) => 
          this.useFirebase ? firebaseClient.alerts.list(order, limit) : this.mockList('alerts', limit),
        get: (id) => this.mockGet('alert', id),
        create: (data) => 
          this.useFirebase ? firebaseClient.alerts.create(data) : this.mockCreate('alert', data)
      },
      VitalReading: {
        list: (order = '-timestamp', limit = 200) => 
          this.useFirebase ? firebaseClient.vitals.list(order, limit) : this.mockList('vitals', limit)
      },
      Medicine: {
        list: (order = '-created_date', limit = 50) => 
          this.useFirebase ? firebaseClient.medicines.list(order, limit) : this.mockList('medicines', limit)
      },
      MedicineSchedule: {
        list: (order = '-created_date', limit = 50) => this.mockList('schedules', limit)
      },
      StaffSchedule: {
        list: (order = '-created_date', limit = 50) => 
          this.useFirebase ? firebaseClient.staffSchedules.list(order, limit) : this.mockList('staff_schedules', limit),
        create: (data) => 
          this.useFirebase ? firebaseClient.staffSchedules.create(data) : this.mockCreate('staff_schedule', data),
        update: (id, data) => 
          this.useFirebase ? firebaseClient.staffSchedules.update(id, data) : this.mockUpdate('staff_schedule', id, data)
      },
      Ward: {
        list: (order = '-created_date', limit = 50) => 
          this.useFirebase ? firebaseClient.wards.list(order, limit) : this.mockList('wards', limit),
        create: (data) => 
          this.useFirebase ? firebaseClient.wards.create(data) : this.mockCreate('ward', data),
        update: (id, data) => 
          this.useFirebase ? firebaseClient.wards.update(id, data) : this.mockUpdate('ward', id, data),
        delete: (id) => 
          this.useFirebase ? firebaseClient.wards.delete(id) : this.mockDelete('ward', id)
      },
      LabReport: {
        list: (order = '-created_date', limit = 20) => 
          this.useFirebase ? firebaseClient.labReports.list(order, limit) : this.mockList('labReports', limit)
      }
    };

    this.auth = {
      me: () => Promise.resolve({ id: 1, name: 'Dr. Smith', role: 'doctor' })
    };

    this.integrations = {
      Core: {
        InvokeLLM: (params) => this.mockInvokeLLM(params)
      }
    };
  }

  checkFirebaseAvailable() {
    try {
      // Firebase is available if environment variables are set
      return !!process.env.REACT_APP_FIREBASE_API_KEY;
    } catch {
      return false;
    }
  }

  mockList(entity, limit) {
    // Return mock data based on entity type
    const mockData = {
      patients: Array.from({ length: Math.min(limit, 10) }, (_, i) => ({
        id: i + 1,
        full_name: `Patient ${i + 1}`,
        name: `Patient ${i + 1}`,
        age: 30 + i,
        gender: i % 2 === 0 ? 'Male' : 'Female',
        email: `patient${i + 1}@medisync.com`,
        phone: `555-000${i + 1}`,
        medical_history: ['Hypertension', 'Diabetes'][i % 2],
        status: i % 3 === 0 ? 'critical' : i % 2 === 0 ? 'stable' : 'recovering',
        condition: i % 3 === 0 ? 'Critical' : i % 2 === 0 ? 'Stable' : 'Recovering',
        ward_id: (i % 5) + 1,
        bed_number: `${Math.floor(i / 2) + 1}A`,
        admission_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_date: new Date().toISOString()
      })),
      alerts: Array.from({ length: Math.min(limit, 8) }, (_, i) => ({
        id: i + 1,
        type: i % 3 === 0 ? 'critical' : i % 2 === 0 ? 'warning' : 'info',
        severity: i % 3 === 0 ? 'critical' : i % 2 === 0 ? 'high' : 'medium',
        message: `${['High Temperature', 'Low Blood Pressure', 'Irregular Heart Rate', 'Medication Due', 'Test Results Ready'][i % 5]} for Patient ${(i % 10) + 1}`,
        patient_id: (i % 10) + 1,
        status: i % 2 === 0 ? 'active' : 'acknowledged',
        created_date: new Date(Date.now() - Math.random() * 2 * 60 * 60 * 1000).toISOString()
      })),
      vitals: Array.from({ length: Math.min(limit, 20) }, (_, i) => ({
        id: i + 1,
        patient_id: (i % 10) + 1,
        temperature: 36.5 + (Math.random() - 0.5) * 2,
        heart_rate: 60 + Math.floor(Math.random() * 40),
        blood_pressure_systolic: 110 + Math.floor(Math.random() * 40),
        blood_pressure_diastolic: 70 + Math.floor(Math.random() * 20),
        spo2: 95 + Math.floor(Math.random() * 5),
        respiratory_rate: 12 + Math.floor(Math.random() * 10),
        timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
      })),
      medicines: Array.from({ length: Math.min(limit, 10) }, (_, i) => ({
        id: i + 1,
        name: ['Aspirin', 'Metformin', 'Lisinopril', 'Atorvastatin', 'Omeprazole', 'Amoxicillin', 'Ibuprofen', 'Paracetamol', 'Vitamin D', 'Insulin'][i],
        dosage: ['100mg', '500mg', '10mg', '20mg', '20mg', '500mg', '400mg', '500mg', '1000IU', '10 units'][i],
        description: `Medicine ${i + 1} for treatment`
      })),
      schedules: Array.from({ length: Math.min(limit, 10) }, (_, i) => ({
        id: i + 1,
        patient_id: (i % 10) + 1,
        medicine_id: (i % 10) + 1,
        medicine_name: ['Aspirin', 'Metformin', 'Lisinopril', 'Atorvastatin', 'Omeprazole', 'Amoxicillin', 'Ibuprofen', 'Paracetamol', 'Vitamin D', 'Insulin'][i],
        schedule_time: `${8 + (i % 4) * 6}:00`,
        frequency: ['daily', 'twice daily', 'three times daily', 'as needed'][i % 4],
        duration: '30 days'
      })),
      staff_schedules: Array.from({ length: Math.min(limit, 10) }, (_, i) => ({
        id: i + 1,
        staff_name: `${['Dr.', 'Nurse'][i % 2]} ${['Smith', 'Johnson', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas'][i % 10]}`,
        staff_role: i % 2 === 0 ? 'doctor' : 'nurse',
        staff_id: `STAFF${String(i + 1).padStart(4, '0')}`,
        ward_id: (i % 5) + 1,
        shift_type: ['morning', 'afternoon', 'night'][i % 3],
        start_time: `${6 + (i % 3) * 8}:00`,
        end_time: `${14 + (i % 3) * 8}:00`,
        date: new Date(Date.now() + (i - 5) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      })),
      wards: Array.from({ length: Math.min(limit, 5) }, (_, i) => ({
        id: i + 1,
        name: ['ICU', 'General Ward', 'Pediatrics', 'Cardiology', 'Orthopedics'][i],
        department: ['Intensive Care', 'General Medicine', 'Pediatrics', 'Cardiology', 'Orthopedic Surgery'][i],
        capacity: 20,
        total_beds: 20,
        occupied_beds: 15 + Math.floor(Math.random() * 5),
        available_beds: 5 + Math.floor(Math.random() * 5),
        staff_count: 8 + i,
        head_of_department: `Dr. ${['Smith', 'Johnson', 'Brown', 'Davis', 'Miller'][i]}`
      }))
    };

    return Promise.resolve(mockData[entity] || []);
  }

  mockGet(entity, id) {
    return Promise.resolve({
      id,
      name: `${entity} ${id}`,
      created_date: new Date().toISOString()
    });
  }

  mockCreate(entity, data) {
    return Promise.resolve({
      id: Date.now(),
      ...data,
      created_date: new Date().toISOString()
    });
  }

  mockUpdate(entity, id, data) {
    return Promise.resolve({
      id,
      ...data,
      updated_date: new Date().toISOString()
    });
  }

  mockDelete(entity, id) {
    return Promise.resolve({ success: true });
  }

  mockInvokeLLM(params) {
    // Mock AI response for lab report analysis
    return Promise.resolve({
      summary: "Lab results show normal ranges for most parameters. Glucose is slightly elevated, suggesting possible pre-diabetic state. Recommend follow-up testing and lifestyle modifications.",
      recommendations: [
        "Schedule follow-up glucose test in 3 months",
        "Consider dietary consultation for blood sugar management",
        "Monitor blood pressure regularly"
      ],
      confidence: 0.85
    });
  }
}

export const base44 = new Base44Client();