import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface AddBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export function AddBillModal({ isOpen, onClose, userId }: AddBillModalProps) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !dueDate) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'bills'), {
        userId,
        name,
        amount: parseFloat(amount),
        dueDate,
        isPaid: false,
        paidAt: null,
        paidMonths: []
      });
      setName('');
      setAmount('');
      setDueDate(format(new Date(), 'yyyy-MM-dd'));
      onClose();
    } catch (error) {
      console.error('Error adding bill:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white border-4 border-black w-full max-w-lg shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] animate-in fade-in zoom-in-95 duration-200">
        <div className="px-8 py-6 border-b-4 border-black flex items-center justify-between bg-slate-100">
          <h2 className="text-3xl font-black uppercase tracking-tighter text-black">Add New Bill</h2>
          <button 
            onClick={onClose}
            className="p-2 border-2 border-transparent hover:border-black hover:bg-white text-slate-500 hover:text-black transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Bill Name</label>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="E.G. ELECTRICITY, RENT"
              className="w-full px-5 py-4 border-2 border-black focus:border-black focus:ring-4 focus:ring-emerald-400/50 outline-none transition-all text-lg font-bold uppercase"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Amount ($)</label>
            <input 
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-5 py-4 border-2 border-black focus:border-black focus:ring-4 focus:ring-emerald-400/50 outline-none transition-all text-lg font-bold font-mono"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Due Date</label>
            <input 
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-5 py-4 border-2 border-black focus:border-black focus:ring-4 focus:ring-emerald-400/50 outline-none transition-all text-lg font-bold"
              required
            />
          </div>
          
          <div className="pt-6 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 font-black uppercase tracking-widest text-black bg-slate-100 hover:bg-slate-200 border-2 border-black transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-4 font-black uppercase tracking-widest text-white bg-black hover:bg-slate-800 disabled:opacity-70 flex items-center justify-center border-2 border-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px]"
            >
              {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Save Bill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
