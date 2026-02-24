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
    // Check if there's a pending login in progress
    const pendingLogin = sessionStorage.getItem('medisync_pending_login');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user profile from Firestore
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            // Use the pending login role if available, otherwise use Firestore role
            const role = pendingLogin ? JSON.parse(pendingLogin).role : userData.role;
            const userObj = {
              id: firebaseUser.uid,
              email: firebaseUser.email,
              ...userData,
              role: role, // Ensure role is set correctly
            };
            setUser(userObj);
            localStorage.setItem('medisync_user', JSON.stringify(userObj));
            sessionStorage.removeItem('medisync_pending_login');

            // If patient, ensure patient record exists
            if (role === 'patient') {
              await ensurePatientRecordExists(firebaseUser.uid, firebaseUser.email, userData.name);
            }
          } else {
            // User authenticated but no profile - should not happen after login
            if (pendingLogin) {
              const loginInfo = JSON.parse(pendingLogin);
              const userObj = {
                id: firebaseUser.uid,
                email: firebaseUser.email,
                name: firebaseUser.displayName || 'User',
                role: loginInfo.role,
              };
              setUser(userObj);
              localStorage.setItem('medisync_user', JSON.stringify(userObj));
              sessionStorage.removeItem('medisync_pending_login');
            } else {
              const userObj = {
                id: firebaseUser.uid,
                email: firebaseUser.email,
                name: firebaseUser.displayName || 'User',
                role: 'patient',
              };
              setUser(userObj);
              localStorage.setItem('medisync_user', JSON.stringify(userObj));
            }
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Fallback to localStorage if available
          const stored = localStorage.getItem('medisync_user');
          if (stored) {
            try {
              const userObj = JSON.parse(stored);
              setUser(userObj);
            } catch {
              setUser({
                id: firebaseUser.uid,
                email: firebaseUser.email,
                name: firebaseUser.displayName || 'User',
                role: 'patient',
              });
            }
          }
        }
      } else {
        // If not authenticated, check localStorage for any saved session
        const stored = localStorage.getItem('medisync_user');
        if (stored) {
          try {
            const userObj = JSON.parse(stored);
            setUser(userObj);
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password, role) => {
    try {
      // Store pending login info so onAuthStateChanged can use it
      sessionStorage.setItem('medisync_pending_login', JSON.stringify({ email, role }));
      
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Try to verify the user's role, but don't fail if we can't read the doc
      try {
        const userDocRef = doc(db, 'users', result.user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          if (userData.role !== role) {
            await signOut(auth);
            sessionStorage.removeItem('medisync_pending_login');
            throw new Error(`This account is registered as a ${userData.role}, not a ${role}`);
          }
          
          // Immediately set the user with the correct role
          const userObj = {
            id: result.user.uid,
            email: result.user.email,
            ...userData,
            role: role,
          };
          setUser(userObj);
          localStorage.setItem('medisync_user', JSON.stringify(userObj));
        } else {
          // User doc not found, use the selected role
          const userObj = {
            id: result.user.uid,
            email: result.user.email,
            name: result.user.displayName || 'User',
            role: role,
          };
          setUser(userObj);
          localStorage.setItem('medisync_user', JSON.stringify(userObj));
        }
      } catch (docError) {
        // If we can't read the user doc (permissions issue), still allow login with the selected role
        console.warn('Could not verify user role from Firestore:', docError);
        const userObj = {
          id: result.user.uid,
          email: result.user.email,
          name: result.user.displayName || 'User',
          role: role,
        };
        setUser(userObj);
        localStorage.setItem('medisync_user', JSON.stringify(userObj));
      }
      
      sessionStorage.removeItem('medisync_pending_login');
      return result.user;
    } catch (error) {
      sessionStorage.removeItem('medisync_pending_login');
      throw new Error(error.message);
    }
  };

  const signup = async (name, email, password, role, additionalData = {}) => {
    try {
      // Store pending signup info
      sessionStorage.setItem('medisync_pending_login', JSON.stringify({ email, role }));
      
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = result.user;

      // Create user profile in Firestore
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(userDocRef, {
        name: name,
        email: email,
        role: role,
        specialization: role === 'doctor' ? (additionalData.specialization || '') : undefined,
        created_date: new Date(),
      });

      // If patient, also create patient record
      if (role === 'patient') {
        await addDoc(collection(db, 'patients'), {
          full_name: name,
          email: email,
          user_id: firebaseUser.uid,
          age: parseInt(additionalData.age) || 0,
          contact_number: additionalData.mobile || '',
          address: '',
          bed_number: 0,
          status: 'stable',
          gender: '',
          created_date: new Date().toISOString()
        });
      }

      const userObj = {
        id: firebaseUser.uid,
        email: email,
        name: name,
        role: role,
        specialization: role === 'doctor' ? (additionalData.specialization || '') : undefined,
      };

      setUser(userObj);
      localStorage.setItem('medisync_user', JSON.stringify(userObj));
      sessionStorage.removeItem('medisync_pending_login');

      return firebaseUser;
    } catch (error) {
      sessionStorage.removeItem('medisync_pending_login');
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
