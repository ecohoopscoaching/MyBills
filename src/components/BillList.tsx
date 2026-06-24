import { Bill } from '../types';
import { format, parseISO, differenceInDays, isPast, isToday } from 'date-fns';
import { CheckCircle2, Circle, AlertCircle, Clock, MoreVertical, Trash2 } from 'lucide-react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useState } from 'react';

export function BillList({ bills, currentMonth }: { bills: Bill[], currentMonth: Date }) {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const togglePaid = async (bill: Bill) => {
    try {
      const currentMonthStr = format(currentMonth, 'yyyy-MM');
      const paidMonths = bill.paidMonths || [];
      
      let isCurrentlyPaid = paidMonths.includes(currentMonthStr);
      if (bill.paidMonths === undefined && bill.isPaid) {
         isCurrentlyPaid = true;
      }

      let newPaidMonths;
      if (isCurrentlyPaid) {
        newPaidMonths = paidMonths.filter(m => m !== currentMonthStr);
      } else {
        newPaidMonths = [...paidMonths, currentMonthStr];
      }

      await updateDoc(doc(db, 'bills', bill.id), {
        paidMonths: newPaidMonths,
        isPaid: newPaidMonths.length > 0
      });
    } catch (e) {
      console.error(e);
    }
  };

  const deleteBill = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bill?')) return;
    try {
      await deleteDoc(doc(db, 'bills', id));
      setMenuOpenId(null);
    } catch (e) {
      console.error(e);
    }
  };

  // Sort: unpaid first, then by date, then paid
  const sortedBills = [...bills].sort((a, b) => {
    if (a.isPaid === b.isPaid) {
      return a.dueDate.localeCompare(b.dueDate);
    }
    return a.isPaid ? 1 : -1;
  });

  return (
    <div className="space-y-6">
      {sortedBills.map(bill => {
        const dueDate = parseISO(bill.dueDate);
        const daysUntilDue = differenceInDays(dueDate, new Date());
        
        let statusColor = "bg-white border-black border-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]";
        let urgencyIcon = null;
        let urgencyText = "";

        if (bill.isPaid) {
          statusColor = "bg-slate-50 border-emerald-400 border-4 opacity-70 grayscale shadow-none";
        } else {
          if (daysUntilDue < 0 && !isToday(dueDate)) {
            statusColor = "bg-rose-100 border-black border-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]";
            urgencyIcon = <AlertCircle className="w-5 h-5 text-rose-600" />;
            urgencyText = <span className="text-rose-600 font-black text-xs uppercase tracking-widest">Overdue</span>;
          } else if (daysUntilDue <= 3) {
            statusColor = "bg-amber-100 border-black border-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]";
            urgencyIcon = <Clock className="w-5 h-5 text-amber-700" />;
            urgencyText = <span className="text-amber-700 font-black text-xs uppercase tracking-widest">Near</span>;
          }
        }

        return (
          <div 
            key={bill.id} 
            className={`group relative flex flex-col sm:flex-row sm:items-center p-6 transition-all ${statusColor}`}
          >
            <button 
              onClick={() => togglePaid(bill)}
              className="flex-shrink-0 mb-4 sm:mb-0 sm:mr-6 focus:outline-none transition-transform active:scale-95"
            >
              {bill.isPaid ? (
                <div className="w-12 h-12 bg-emerald-400 border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <CheckCircle2 className="w-8 h-8 text-black" />
                </div>
              ) : (
                <div className="w-12 h-12 bg-white border-2 border-black hover:bg-slate-100 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors">
                  <Circle className="w-8 h-8 text-black opacity-20" />
                </div>
              )}
            </button>
            
            <div className="flex-1 min-w-0 mb-4 sm:mb-0">
              <div className="flex items-center gap-3 mb-2">
                <h3 className={`font-black text-2xl uppercase tracking-tighter truncate ${bill.isPaid ? 'text-slate-500 line-through' : 'text-black'}`}>
                  {bill.name}
                </h3>
                {urgencyIcon && <div className="flex items-center gap-1.5 bg-white px-3 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">{urgencyIcon} {urgencyText}</div>}
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 flex flex-wrap items-center gap-2">
                <CalendarIcon className="w-4 h-4 shrink-0" />
                <span>{format(dueDate, 'MMM d, yyyy')}</span>
                {bill.isPaid && (
                  <span className="ml-2 inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 border-2 border-emerald-400 px-2 py-1 shadow-[2px_2px_0px_0px_rgba(16,185,129,0.5)]">
                    <CheckCircle2 className="w-3 h-3 shrink-0" /> PAID
                  </span>
                )}
              </p>
            </div>
            
            <div className="text-left sm:text-right flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6">
              <span className={`text-4xl font-black tracking-tighter tabular-nums ${bill.isPaid ? 'text-slate-400' : 'text-black'}`}>
                ${bill.amount.toFixed(2)}
              </span>
              
              <div className="relative">
                <button 
                  onClick={() => setMenuOpenId(menuOpenId === bill.id ? null : bill.id)}
                  className="p-2 border-2 border-transparent hover:border-black text-slate-400 hover:text-black transition-colors"
                >
                  <MoreVertical className="w-6 h-6" />
                </button>
                
                {menuOpenId === bill.id && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] py-2 z-20">
                    <button
                      onClick={() => deleteBill(bill.id)}
                      className="w-full text-left px-4 py-3 text-sm font-black uppercase tracking-widest text-rose-600 hover:bg-rose-100 flex items-center gap-3 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CalendarIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  )
}
