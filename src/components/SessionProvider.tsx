'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, getIdToken } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

export interface AuthContextType {
  user: User | null;
  userData: any | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, userData: null, loading: true });

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isDemoActive = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || (typeof window !== 'undefined' && localStorage.getItem('demo_mode') === 'true');

    if (isDemoActive) {
      setUser({
        uid: 'demo-user',
        email: 'demo@floodrakshak.ai',
        displayName: 'Demo Citizen',
        getIdToken: async () => 'demo_token'
      } as any);
      setUserData({
        name: 'Demo Citizen',
        email: 'demo@floodrakshak.ai',
        role: 'citizen',
        district: 'Chennai',
        language: 'english',
        phoneNumber: '+919999999999',
        telegramChatId: ''
      });
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Automatically inject token in fetch calls for API routes if needed, 
        // or we can fetch user profile from Firestore.
        try {
          const db = getFirestore();
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        } catch (error) {
          console.error('Error fetching user data', error);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
