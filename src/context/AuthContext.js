import React, { createContext, useState, useContext, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, setDoc, getDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';

const AuthContext = createContext();

// Helper function to ensure patient record exists
const ensurePatientRecordExists = async (userId, email, name) => {
  try {
    // Check if patient record already exists
    const q = query(collection(db, 'patients'), where('user_id', '==', userId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      // Patient record doesn't exist, create it
      console.log(`🆕 Creating patient record for user ${userId}`);
      await addDoc(collection(db, 'patients'), {
        full_name: name || email,
        email: email,
        user_id: userId,
        age: 0,
        contact_number: '',
        address: '',
        bed_number: 0,
        status: 'stable',
        gender: '',
        created_date: new Date().toISOString()
      });
      console.log(`✅ Patient record created successfully`);
    } else {
      console.log(`✅ Patient record already exists for user ${userId}`);
    }
  } catch (error) {
    console.error('❌ Error ensuring patient record:', error);
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user profile from Firestore
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email,
              ...userData,
            });

            // If patient, ensure patient record exists
            if (userData.role === 'patient') {
              await ensurePatientRecordExists(firebaseUser.uid, firebaseUser.email, userData.name);
            }
          } else {
            // User authenticated but no profile - set basic info
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || 'User',
              role: 'patient',
            });
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || 'User',
            role: 'patient',
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (emailOrFileNumber, password, role) => {
    try {
      // If patient role, look up patient by file number
      if (role === 'patient') {
        const q = query(collection(db, 'patients'), where('file_number', '==', emailOrFileNumber));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          throw new Error('Patient not found. Please verify your file number.');
        }
        
        const patientDoc = snapshot.docs[0];
        const patientData = patientDoc.data();
        
        // For patients, file_number is the login identifier - no password check needed
        // Set the user based on the patient record
        setUser({
          id: patientDoc.id,
          email: patientData.email || '',
          name: patientData.full_name || 'Patient',
          role: 'patient',
          file_number: patientData.file_number,
          patient_doc_id: patientDoc.id
        });
        
        return { user: { uid: patientDoc.id } };
      } else {
        // For doctors and nurses, use email/password authentication
        const result = await signInWithEmailAndPassword(auth, emailOrFileNumber, password);
        
        // Verify the user's role matches the selected role
        const userDocRef = doc(db, 'users', result.user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          if (userData.role !== role) {
            await signOut(auth);
            throw new Error(`This account is registered as a ${userData.role}, not a ${role}`);
          }
        }
        
        return result.user;
      }
    } catch (error) {
      throw new Error(error.message);
    }
  };

  const signup = async (name, email, password, role, additionalData = {}) => {
    try {
      // If patient role, just create a patient record with file number (no Firebase auth)
      if (role === 'patient') {
        const fileNumber = additionalData.file_number;
        
        // Check if file number already exists
        const q = query(collection(db, 'patients'), where('file_number', '==', fileNumber));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          throw new Error('File number already registered. Please use a different file number.');
        }
        
        // Create patient record
        const patientRef = await addDoc(collection(db, 'patients'), {
          file_number: fileNumber,
          full_name: name,
          email: email,
          age: parseInt(additionalData.age) || 0,
          contact_number: additionalData.mobile || '',
          address: '',
          bed_number: 0,
          status: 'stable',
          gender: '',
          created_date: new Date().toISOString()
        });
        
        setUser({
          id: patientRef.id,
          email: email,
          name: name,
          role: 'patient',
          file_number: fileNumber,
          patient_doc_id: patientRef.id
        });
        
        return { user: { uid: patientRef.id } };
      } else {
        // For doctors and nurses, create Firebase auth account
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = result.user;

        // Create user profile in Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        await setDoc(userDocRef, {
          name: name,
          email: email,
          role: role,
          specialization: role === 'doctor' ? (additionalData.specialization || 'General') : undefined,
          created_date: new Date(),
        });

        setUser({
          id: firebaseUser.uid,
          email: email,
          name: name,
          role: role,
          specialization: role === 'doctor' ? (additionalData.specialization || 'General') : undefined,
        });

        return firebaseUser;
      }
    } catch (error) {
      throw new Error(error.message);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      throw new Error(error.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
