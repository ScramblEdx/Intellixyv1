import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, db, googleProvider } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup, 
  signOut, 
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, limit, query } from 'firebase/firestore';

type UserRole = 'student' | 'teacher';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isAdmin: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, pass: string, role: UserRole) => Promise<void>;
  loginWithGoogle: (role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAdmin = async (email: string): Promise<boolean> => {
    try {
      const normalizedEmail = email.toLowerCase();
      const defaultAdmin = 'patinpola123ez@gmail.com'.toLowerCase();

      // 1. Check if admins collection is empty
      const adminsRef = collection(db, 'admins');
      const q = query(adminsRef, limit(1));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        // Add default admin if collection is empty
        await setDoc(doc(db, 'admins', defaultAdmin), { email: defaultAdmin });
      }

      // 2. Check if the current user is an admin
      const adminDoc = await getDoc(doc(db, 'admins', normalizedEmail));
      let isAdmin = adminDoc.exists();

      if (!isAdmin && normalizedEmail === defaultAdmin) {
        await setDoc(doc(db, 'admins', normalizedEmail), { email: normalizedEmail });
        isAdmin = true;
      }
      
      if (isAdmin) {
        console.log("Admin detectado");
        return true;
      } else {
        console.log("Usuário comum");
        return false;
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      // Fallback
      if (email.toLowerCase() === 'patinpola123ez@gmail.com'.toLowerCase()) {
         return true;
      }
      return false;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const email = firebaseUser.email || '';
          const normalizedEmail = email.toLowerCase();
          const isAdmin = await checkAdmin(normalizedEmail);
          
          let role: UserRole = 'student';
          let name = firebaseUser.displayName || email.split('@')[0] || 'Usuário';
          let approvalStatus: 'pending' | 'approved' | 'rejected' = 'approved';

          try {
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              if (data.role) role = data.role as UserRole;
              if (data.name) name = data.name;
              if (data.approvalStatus) approvalStatus = data.approvalStatus;
            }
          } catch (e) {
            console.error("Error fetching user role from firestore, defaulting to student:", e);
          }
          
          if (isAdmin) {
            approvalStatus = 'approved';
          }

          setUser({
            id: firebaseUser.uid,
            name,
            email: normalizedEmail,
            role,
            isAdmin,
            approvalStatus,
          });
        } catch (error) {
          console.error("Error setting user state:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const registerWithEmail = async (name: string, email: string, pass: string, role: UserRole) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const approvalStatus = role === 'teacher' ? 'pending' : 'approved';
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      name,
      email,
      role,
      approvalStatus
    });
  };

  const loginWithGoogle = async (role: UserRole) => {
    const userCredential = await signInWithPopup(auth, googleProvider);
    const userDocRef = doc(db, 'users', userCredential.user.uid);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      const approvalStatus = role === 'teacher' ? 'pending' : 'approved';
      await setDoc(userDocRef, {
        name: userCredential.user.displayName || userCredential.user.email?.split('@')[0],
        email: userCredential.user.email,
        role,
        approvalStatus
      });
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithEmail, registerWithEmail, loginWithGoogle, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
