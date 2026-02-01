import { db } from '../config/firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';

// Firestore API Client
export const firebaseClient = {
  // Patient operations
  patients: {
    async create(data) {
      try {
        const docRef = await addDoc(collection(db, 'patients'), {
          ...data,
          created_date: serverTimestamp(),
        });
        return { id: docRef.id, ...data };
      } catch (error) {
        console.error('Error creating patient:', error);
        throw error;
      }
    },

    async list(orderByField = '-created_date', limitCount = 50) {
      try {
        let q;
        const field = orderByField.startsWith('-') ? orderByField.slice(1) : orderByField;
        const direction = orderByField.startsWith('-') ? 'desc' : 'asc';
        
        q = query(
          collection(db, 'patients'),
          orderBy(field, direction),
          limit(limitCount)
        );
        
        const snapshot = await getDocs(q);
        const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('✅ Fetched from Firestore - patients:', results);
        return results;
      } catch (error) {
        console.error('❌ Error fetching patients from Firestore:', error.message);
        // Return empty array on error - never fall back to mock data
        return [];
      }
    },

    async getById(id) {
      try {
        const docRef = doc(db, 'patients', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
      } catch (error) {
        console.error('Error fetching patient:', error);
        throw error;
      }
    },

    async update(id, data) {
      try {
        const docRef = doc(db, 'patients', id);
        await updateDoc(docRef, {
          ...data,
          updated_date: serverTimestamp(),
        });
        return { id, ...data };
      } catch (error) {
        console.error('Error updating patient:', error);
        throw error;
      }
    },

    async delete(id) {
      try {
        const docRef = doc(db, 'patients', id);
        await deleteDoc(docRef);
        return id;
      } catch (error) {
        console.error('Error deleting patient:', error);
        throw error;
      }
    },

    async deleteAll() {
      try {
        // DELETE ALL PATIENTS - for clearing dummy data
        const q = query(collection(db, 'patients'));
        const snapshot = await getDocs(q);
        let deletedCount = 0;
        
        for (const doc of snapshot.docs) {
          await deleteDoc(doc.ref);
          deletedCount++;
        }
        console.log(`✅ Deleted ALL ${deletedCount} patients from Firestore`);
        return deletedCount;
      } catch (error) {
        console.error('Error deleting all patients:', error);
        throw error;
      }
    }
  },

  // Alerts operations
  alerts: {
    async create(data) {
      try {
        const docRef = await addDoc(collection(db, 'alerts'), {
          ...data,
          created_date: serverTimestamp(),
        });
        return { id: docRef.id, ...data };
      } catch (error) {
        console.error('Error creating alert:', error);
        throw error;
      }
    },

    async list(orderByField = '-created_date', limitCount = 100) {
      try {
        let q;
        if (orderByField.startsWith('-')) {
          const field = orderByField.slice(1);
          q = query(
            collection(db, 'alerts'),
            orderBy(field, 'desc'),
            limit(limitCount)
          );
        } else {
          q = query(
            collection(db, 'alerts'),
            orderBy(orderByField, 'asc'),
            limit(limitCount)
          );
        }
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.error('Error fetching alerts:', error);
        throw error;
      }
    },

    async getByPatientId(patientId) {
      try {
        const q = query(
          collection(db, 'alerts'),
          where('patient_id', '==', patientId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.error('Error fetching patient alerts:', error);
        throw error;
      }
    },
    async update(alertId, data) {
      try {
        const docRef = doc(db, 'alerts', alertId);
        await updateDoc(docRef, data);
        return { id: alertId, ...data };
      } catch (error) {
        console.error('Error updating alert:', error);
        throw error;
      }
    },
  },

  // Vital Readings operations
  vitals: {
    async create(data) {
      try {
        const docRef = await addDoc(collection(db, 'vitals'), {
          ...data,
          timestamp: serverTimestamp(),
        });
        return { id: docRef.id, ...data };
      } catch (error) {
        console.error('Error creating vital reading:', error);
        throw error;
      }
    },

    async list(orderByField = '-timestamp', limitCount = 200) {
      try {
        let q;
        if (orderByField.startsWith('-')) {
          const field = orderByField.slice(1);
          q = query(
            collection(db, 'vitals'),
            orderBy(field, 'desc'),
            limit(limitCount)
          );
        } else {
          q = query(
            collection(db, 'vitals'),
            orderBy(orderByField, 'asc'),
            limit(limitCount)
          );
        }
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.error('Error fetching vitals:', error);
        throw error;
      }
    },

    async getByPatientId(patientId, limitCount = 50) {
      try {
        const q = query(
          collection(db, 'vitals'),
          where('patient_id', '==', patientId),
          orderBy('timestamp', 'desc'),
          limit(limitCount)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.error('Error fetching patient vitals:', error);
        throw error;
      }
    },

    async update(id, data) {
      try {
        const docRef = doc(db, 'vitals', id);
        await updateDoc(docRef, {
          ...data,
          updated_date: serverTimestamp(),
        });
        return { id, ...data };
      } catch (error) {
        console.error('Error updating vital:', error);
        throw error;
      }
    },

    async delete(id) {
      try {
        const docRef = doc(db, 'vitals', id);
        await deleteDoc(docRef);
        return id;
      } catch (error) {
        console.error('Error deleting vital:', error);
        throw error;
      }
    },
  },

  // Medicines operations
  medicines: {
    async create(data) {
      try {
        console.log('💊 Creating medicine:', data);
        const docRef = await addDoc(collection(db, 'medicines'), {
          ...data,
          prescribed_date: serverTimestamp(),
        });
        console.log('✅ Medicine created with ID:', docRef.id);
        return { id: docRef.id, ...data };
      } catch (error) {
        console.error('❌ Error creating medicine:', error);
        throw error;
      }
    },

    async list(orderByField = '-prescribed_date', limitCount = 100) {
      try {
        let q;
        if (orderByField.startsWith('-')) {
          const field = orderByField.slice(1);
          q = query(
            collection(db, 'medicines'),
            orderBy(field, 'desc'),
            limit(limitCount)
          );
        } else {
          q = query(
            collection(db, 'medicines'),
            orderBy(orderByField, 'asc'),
            limit(limitCount)
          );
        }
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.error('Error fetching medicines:', error);
        throw error;
      }
    },

    async update(id, data) {
      try {
        const docRef = doc(db, 'medicines', id);
        await updateDoc(docRef, {
          ...data,
          updated_date: serverTimestamp(),
        });
        return { id, ...data };
      } catch (error) {
        console.error('Error updating medicine:', error);
        throw error;
      }
    },

    async delete(id) {
      try {
        const docRef = doc(db, 'medicines', id);
        await deleteDoc(docRef);
        return id;
      } catch (error) {
        console.error('Error deleting medicine:', error);
        throw error;
      }
    },
  },

  // Lab Reports operations
  labReports: {
    async create(data) {
      try {
        const docRef = await addDoc(collection(db, 'lab_reports'), {
          ...data,
          created_date: serverTimestamp(),
        });
        return { id: docRef.id, ...data };
      } catch (error) {
        console.error('Error creating lab report:', error);
        throw error;
      }
    },

    async list(orderByField = '-created_date', limitCount = 20) {
      try {
        let q;
        if (orderByField.startsWith('-')) {
          const field = orderByField.slice(1);
          q = query(
            collection(db, 'lab_reports'),
            orderBy(field, 'desc'),
            limit(limitCount)
          );
        } else {
          q = query(
            collection(db, 'lab_reports'),
            orderBy(orderByField, 'asc'),
            limit(limitCount)
          );
        }
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.error('Error fetching lab reports:', error);
        throw error;
      }
    },
  },

  // Wards operations
  wards: {
    async create(data) {
      try {
        const docRef = await addDoc(collection(db, 'wards'), {
          ...data,
          created_date: serverTimestamp(),
        });
        return { id: docRef.id, ...data };
      } catch (error) {
        console.error('Error creating ward:', error);
        throw error;
      }
    },

    async list(orderByField = '-created_date', limitCount = 10) {
      try {
        let q;
        if (orderByField.startsWith('-')) {
          const field = orderByField.slice(1);
          q = query(
            collection(db, 'wards'),
            orderBy(field, 'desc'),
            limit(limitCount)
          );
        } else {
          q = query(
            collection(db, 'wards'),
            orderBy(orderByField, 'asc'),
            limit(limitCount)
          );
        }
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.error('Error fetching wards:', error);
        throw error;
      }
    },

    async update(id, data) {
      try {
        const docRef = doc(db, 'wards', id);
        await updateDoc(docRef, {
          ...data,
          updated_date: serverTimestamp(),
        });
        return { id, ...data };
      } catch (error) {
        console.error('Error updating ward:', error);
        throw error;
      }
    },

    async delete(id) {
      try {
        const docRef = doc(db, 'wards', id);
        await deleteDoc(docRef);
        return id;
      } catch (error) {
        console.error('Error deleting ward:', error);
        throw error;
      }
    },
  },

  // Staff Schedule operations
  staffSchedules: {
    async create(data) {
      try {
        const docRef = await addDoc(collection(db, 'staff_schedules'), {
          ...data,
          created_date: serverTimestamp(),
        });
        return { id: docRef.id, ...data };
      } catch (error) {
        console.error('Error creating staff schedule:', error);
        throw error;
      }
    },

    async list(orderByField = '-created_date', limitCount = 10) {
      try {
        let q;
        if (orderByField.startsWith('-')) {
          const field = orderByField.slice(1);
          q = query(
            collection(db, 'staff_schedules'),
            orderBy(field, 'desc'),
            limit(limitCount)
          );
        } else {
          q = query(
            collection(db, 'staff_schedules'),
            orderBy(orderByField, 'asc'),
            limit(limitCount)
          );
        }
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.error('Error fetching staff schedules:', error);
        throw error;
      }
    },
  },

  // Get next patient file number
  async getNextPatientFileNumber() {
    try {
      const allPatients = await this.patients.list('-created_date', 1000);
      if (allPatients.length === 0) {
        return 'PAT-00001';
      }
      // Extract numeric part from file numbers and find the max
      const fileNumbers = allPatients
        .map(p => p.file_number)
        .filter(fn => fn && fn.startsWith('PAT-'))
        .map(fn => parseInt(fn.replace('PAT-', '')))
        .filter(num => !isNaN(num));
      
      const maxNum = fileNumbers.length > 0 ? Math.max(...fileNumbers) : 0;
      const nextNum = maxNum + 1;
      return `PAT-${String(nextNum).padStart(5, '0')}`;
    } catch (error) {
      console.error('Error generating file number:', error);
      // Fallback: use timestamp
      return `PAT-${Date.now()}`;
    }
  },

  // Appointment operations
  appointments: {
    async create(data) {
      try {
        const docRef = await addDoc(collection(db, 'appointments'), {
          ...data,
          booking_date: serverTimestamp(),
          status: 'booked',
        });
        return { id: docRef.id, ...data };
      } catch (error) {
        console.error('Error creating appointment:', error);
        throw error;
      }
    },

    async list() {
      try {
        // Avoid composite index requirement by fetching without orderBy
        const q = query(collection(db, 'appointments'));
        const snapshot = await getDocs(q);
        const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort client-side by date then time ascending
        return results.sort((a, b) => {
          const da = new Date(`${a.appointment_date}T${a.appointment_time || '00:00'}`);
          const db_ = new Date(`${b.appointment_date}T${b.appointment_time || '00:00'}`);
          return da - db_;
        });
      } catch (error) {
        console.error('Error fetching appointments:', error);
        return [];
      }
    },

    async getByDoctor(doctorId) {
      try {
        const q = query(
          collection(db, 'appointments'),
          where('doctor_id', '==', doctorId)
        );
        const snapshot = await getDocs(q);
        const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort client-side by date and time ascending
        return results.sort((a, b) => {
          const da = new Date(`${a.appointment_date}T${a.appointment_time || '00:00'}`);
          const db_ = new Date(`${b.appointment_date}T${b.appointment_time || '00:00'}`);
          return da - db_;
        });
      } catch (error) {
        console.error('Error fetching doctor appointments:', error);
        return [];
      }
    },

    async getByPatient(patientId) {
      try {
        // Avoid Firestore composite index requirement by not ordering in query
        const q = query(
          collection(db, 'appointments'),
          where('patient_id', '==', patientId)
        );
        const snapshot = await getDocs(q);
        const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort client-side by date (desc) then time (desc)
        return results.sort((a, b) => {
          const da = new Date(`${a.appointment_date}T${a.appointment_time || '00:00'}`);
          const db_ = new Date(`${b.appointment_date}T${b.appointment_time || '00:00'}`);
          return db_ - da;
        });
      } catch (error) {
        console.error('Error fetching patient appointments:', error);
        throw error;
      }
    },

    async getByPatientFileNumber(fileNumber) {
      try {
        // Avoid Firestore composite index requirement by not ordering in query
        const q = query(
          collection(db, 'appointments'),
          where('patient_file_number', '==', fileNumber)
        );
        const snapshot = await getDocs(q);
        const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort client-side by date (desc) then time (desc)
        return results.sort((a, b) => {
          const da = new Date(`${a.appointment_date}T${a.appointment_time || '00:00'}`);
          const db_ = new Date(`${b.appointment_date}T${b.appointment_time || '00:00'}`);
          return db_ - da;
        });
      } catch (error) {
        console.error('Error fetching appointments by file number:', error);
        return [];
      }
    },

    async update(appointmentId, data) {
      try {
        const docRef = doc(db, 'appointments', appointmentId);
        await updateDoc(docRef, data);
        return { id: appointmentId, ...data };
      } catch (error) {
        console.error('Error updating appointment:', error);
        throw error;
      }
    },

    async delete(appointmentId) {
      try {
        await deleteDoc(doc(db, 'appointments', appointmentId));
        return { success: true };
      } catch (error) {
        console.error('Error deleting appointment:', error);
        throw error;
      }
    },
  },

  // User operations
  users: {
    async list(orderByField = '-created_date', limitCount = 50) {
      try {
        const field = orderByField.startsWith('-') ? orderByField.slice(1) : orderByField;
        const direction = orderByField.startsWith('-') ? 'desc' : 'asc';
        
        const q = query(
          collection(db, 'users'),
          orderBy(field, direction),
          limit(limitCount)
        );
        
        const snapshot = await getDocs(q);
        const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('✅ Fetched from Firestore - users:', results);
        return results;
      } catch (error) {
        console.error('❌ Error fetching users from Firestore:', error.message);
        return [];
      }
    },

    async getByRole(role) {
      try {
        const q = query(
          collection(db, 'users'),
          where('role', '==', role)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.error('Error fetching users by role:', error);
        return [];
      }
    },

    async create(data) {
      try {
        const docRef = await addDoc(collection(db, 'users'), {
          ...data,
          created_date: serverTimestamp(),
        });
        return { id: docRef.id, ...data };
      } catch (error) {
        console.error('Error creating user:', error);
        throw error;
      }
    },

    async update(userId, data) {
      try {
        const docRef = doc(db, 'users', userId);
        await updateDoc(docRef, data);
        return { id: userId, ...data };
      } catch (error) {
        console.error('Error updating user:', error);
        throw error;
      }
    },
  },
};

export default firebaseClient;
