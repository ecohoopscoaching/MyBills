import { Bill } from '../types';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday, 
  parseISO, 
  isSameDay 
} from 'date-fns';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export function CalendarView({ bills, currentMonth }: { bills: Bill[], currentMonth: Date }) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  
  // Get days to display (we could pad with empty days for full weeks, but a simple grid works too)
  // Let's do a proper calendar grid padding
  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - startDate.getDay()); // go back to Sunday
  
  const endDate = new Date(monthEnd);
  if (endDate.getDay() !== 6) {
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay())); // go forward to Saturday
  }

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white border-4 border-black mb-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <div className="grid grid-cols-7 border-b-4 border-black bg-slate-100">
        {weekDays.map(day => (
          <div key={day} className="py-4 text-center text-xs font-black text-slate-500 uppercase tracking-widest">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 auto-rows-[minmax(120px,auto)]">
        {calendarDays.map((day, i) => {
          const isCurrentMonth = isSameMonth(day, monthStart);
          const dayBills = bills.filter(bill => {
            if (!bill.dueDate) return false;
            return isSameDay(parseISO(bill.dueDate), day);
          });
          const isCurrentDay = isToday(day);

          return (
            <div 
              key={day.toISOString()} 
              className={`border-b-2 border-r-2 border-black p-3 relative ${isCurrentMonth ? 'bg-white' : 'bg-slate-50 opacity-60'} ${i % 7 === 6 ? 'border-r-0' : ''} ${i >= calendarDays.length - 7 ? 'border-b-0' : ''}`}
            >
              <div className="mb-2">
                <span className={`text-xl font-black ${
                  isCurrentDay 
                    ? 'bg-black text-white px-2 py-1' 
                    : isCurrentMonth ? 'text-black' : 'text-slate-400'
                }`}>
                  {format(day, 'dd')}
                </span>
              </div>
              
              <div className="space-y-2 absolute bottom-2 left-2 right-2">
                {dayBills.map(bill => (
                  <div 
                    key={bill.id} 
                    className={`text-[10px] sm:text-xs font-black uppercase p-1.5 truncate border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                      bill.isPaid 
                        ? 'bg-emerald-400 border-black text-black grayscale opacity-70' 
                        : 'bg-rose-500 border-black text-white'
                    }`}
                    title={`${bill.name} - $${bill.amount}`}
                  >
                    <div className="flex items-center gap-1.5">
                      {bill.isPaid ? <CheckCircle2 className="w-3 h-3 shrink-0" /> : <AlertCircle className="w-3 h-3 shrink-0" />}
                      <span className="truncate leading-none">{bill.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
