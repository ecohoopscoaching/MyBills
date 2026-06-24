import { Bill } from '../types';

export function ProgressBar({ bills }: { bills: Bill[] }) {
  const totalAmount = bills.reduce((sum, bill) => sum + bill.amount, 0);
  const paidAmount = bills.filter(b => b.isPaid).reduce((sum, bill) => sum + bill.amount, 0);
  
  const percentage = totalAmount === 0 ? 0 : Math.round((paidAmount / totalAmount) * 100);
  const isComplete = percentage === 100 && totalAmount > 0;

  return (
    <div className="bg-white p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Settlement Progress</p>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black tracking-tighter leading-none text-black">${paidAmount.toFixed(2)}</span>
            <span className="text-lg font-bold uppercase text-slate-400 italic">/ ${totalAmount.toFixed(2)} PAID</span>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <span className={`text-4xl font-black tracking-tighter ${isComplete ? 'text-emerald-500' : 'text-black'}`}>
            {percentage}%
          </span>
        </div>
      </div>
      
      <div className="h-8 w-full bg-slate-100 border-2 border-black p-1 relative">
        <div 
          className={`h-full absolute left-1 top-1 bottom-1 transition-all duration-1000 ease-out ${isComplete ? 'bg-emerald-400' : 'bg-black'}`}
          style={{ width: `calc(${percentage}% - 0.5rem)` }}
        />
      </div>
      
      {isComplete && (
        <p className="text-sm font-black uppercase tracking-widest text-emerald-700 mt-6 flex items-center justify-center bg-emerald-100 border-2 border-emerald-400 py-3">
          All bills paid for this month
        </p>
      )}
    </div>
  );
}
