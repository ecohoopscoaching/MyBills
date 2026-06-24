import { useState, useEffect } from 'react';
import { User, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Bill, OperationType } from '../types';
import { handleFirestoreError } from '../lib/firebase-utils';
import { Bell, BellOff, LogOut, Plus, Calendar as CalendarIcon, List as ListIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, isSameMonth, parseISO, endOfMonth, addMonths, subMonths } from 'date-fns';
import { BillList } from './BillList';
import { CalendarView } from './CalendarView';
import { ProgressBar } from './ProgressBar';
import { AddBillModal } from './AddBillModal';

interface DashboardProps {
  user: User;
}

export function Dashboard({ user }: DashboardProps) {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    'Notification' in window && Notification.permission === 'granted'
  );

  const requestNotifications = async () => {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === 'granted');
  };

  useEffect(() => {
    const q = query(
      collection(db, 'bills'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const billsData: Bill[] = [];
      snapshot.forEach((doc) => {
        billsData.push({ id: doc.id, ...doc.data() } as Bill);
      });
      const currentMonthBills = billsData
        .filter(bill => {
          if (!bill.dueDate) return false;
          const [y, m, d] = bill.dueDate.split('-').map(Number);
          const originalDateLocal = new Date(y, m - 1, d);
          return originalDateLocal <= endOfMonth(currentMonth);
        })
        .map(bill => {
          const [y, m, d] = bill.dueDate.split('-').map(Number);
          let projectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
          
          if (projectedDate.getMonth() !== currentMonth.getMonth()) {
             projectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
          }
  
          const currentMonthStr = format(currentMonth, 'yyyy-MM');
          
          let isPaidForMonth = false;
          if (bill.paidMonths) {
            isPaidForMonth = bill.paidMonths.includes(currentMonthStr);
          } else if (bill.isPaid && isSameMonth(new Date(y, m - 1, d), currentMonth)) {
            isPaidForMonth = true;
          }
  
          return {
            ...bill,
            dueDate: format(projectedDate, 'yyyy-MM-dd'),
            isPaid: isPaidForMonth
          };
        });
        
      setBills(currentMonthBills);
      setLoading(false);

      // Check for notifications
      if ('Notification' in window && Notification.permission === 'granted') {
        currentMonthBills.forEach(bill => {
          if (!bill.isPaid) {
            const dueDate = parseISO(bill.dueDate);
            const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            if (daysUntilDue >= 0 && daysUntilDue <= 3) {
              // Create a notification for bills due in 3 days or less
              // Only if we haven't notified recently (e.g. basic session storage check to avoid spamming)
              const notifyKey = `notified-${bill.id}-${new Date().toDateString()}`;
              if (!sessionStorage.getItem(notifyKey)) {
                new Notification('Bill Due Soon', {
                  body: `${bill.name} for $${bill.amount} is due in ${daysUntilDue} days!`,
                  icon: '/favicon.ico'
                });
                sessionStorage.setItem(notifyKey, 'true');
              }
            }
          }
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'bills');
    });

    return () => unsubscribe();
  }, [user.uid, currentMonth]);

  const handleSignOut = () => {
    signOut(auth);
  };

  const currentMonthName = format(currentMonth, 'MMMM yyyy');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-100 flex flex-col">
      <header className="bg-white border-b-4 border-black sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
              <CalendarIcon className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter uppercase">ClearTrack</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex bg-slate-100 border-2 border-black p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
              <button
                onClick={() => setView('list')}
                className={`p-2 transition-all ${view === 'list' ? 'bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'text-slate-500 hover:text-black border-2 border-transparent'}`}
                aria-label="List View"
              >
                <ListIcon className="w-6 h-6" />
              </button>
              <button
                onClick={() => setView('calendar')}
                className={`p-2 transition-all ${view === 'calendar' ? 'bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'text-slate-500 hover:text-black border-2 border-transparent'}`}
                aria-label="Calendar View"
              >
                <CalendarIcon className="w-6 h-6" />
              </button>
            </div>
            
            {'Notification' in window && (
              <button
                onClick={requestNotifications}
                className={`p-3 border-2 transition-all ${notificationsEnabled ? 'border-black text-black bg-emerald-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'border-transparent text-slate-400 hover:text-black hover:border-black'}`}
                title={notificationsEnabled ? "Notifications enabled" : "Enable notifications"}
              >
                {notificationsEnabled ? <Bell className="w-6 h-6" /> : <BellOff className="w-6 h-6" />}
              </button>
            )}

            <button
              onClick={handleSignOut}
              className="text-slate-500 hover:text-black p-3 border-2 border-transparent hover:border-black transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 w-full flex-1">
        <div className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Current Period</p>
            <div className="flex items-center gap-2 sm:gap-4">
              <button onClick={prevMonth} className="p-1 sm:p-2 border-2 border-black bg-white hover:bg-slate-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none">
                <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8 text-black" />
              </button>
              <h2 className="text-4xl sm:text-7xl font-black leading-none tracking-tighter uppercase text-black w-[200px] sm:w-[320px] text-center">{format(currentMonth, 'MMMM')}</h2>
              <button onClick={nextMonth} className="p-1 sm:p-2 border-2 border-black bg-white hover:bg-slate-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none">
                <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 text-black" />
              </button>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-3 bg-black hover:bg-slate-800 text-white px-8 py-4 font-black uppercase tracking-widest transition-all border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] hover:translate-y-[4px] hover:translate-x-[4px]"
          >
            <Plus className="w-6 h-6" />
            Add Bill
          </button>
        </div>

        <ProgressBar bills={bills} />

        <div className="mt-12">
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-slate-200 border-4 border-black w-full"></div>
              ))}
            </div>
          ) : bills.length === 0 ? (
            <div className="text-center py-24 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-20 h-20 bg-slate-100 border-2 border-black text-black flex items-center justify-center mx-auto mb-6">
                <CalendarIcon className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tighter text-black mb-2">No bills yet</h3>
              <p className="text-sm font-bold uppercase tracking-widest text-slate-500 max-w-sm mx-auto mb-8">You don't have any bills tracked for {currentMonthName}.</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-black border-b-2 border-black font-black uppercase tracking-widest hover:text-emerald-600 hover:border-emerald-600 transition-colors pb-1"
              >
                + Add your first bill
              </button>
            </div>
          ) : view === 'list' ? (
            <BillList bills={bills} currentMonth={currentMonth} />
          ) : (
            <CalendarView bills={bills} currentMonth={currentMonth} />
          )}
        </div>
      </main>

      <AddBillModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        userId={user.uid} 
      />
    </div>
  );
}
