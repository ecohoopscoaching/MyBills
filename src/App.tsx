/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { Dashboard } from './components/Dashboard';
import { LogIn, Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans text-slate-900">
        <div className="max-w-md w-full bg-white p-8 border-4 border-black text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="w-16 h-16 bg-slate-100 border-2 border-black flex items-center justify-center mx-auto mb-6">
            <LogIn className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">ClearTrack</h1>
          <p className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-8">A bold way to manage your monthly bills.</p>
          <button
            onClick={handleLogin}
            className="w-full bg-black hover:bg-slate-800 text-white font-black uppercase tracking-widest py-4 px-4 border-2 border-black transition-all hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none"
          >
            Continue with Google
          </button>
        </div>
      </div>
    );
  }

  return <Dashboard user={user} />;
}

