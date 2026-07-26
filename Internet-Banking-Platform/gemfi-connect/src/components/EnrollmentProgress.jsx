import React from 'react';
import { Check } from 'lucide-react';
const steps = ['Verify Account', 'Verify OTP', 'Create Credentials'];
export default function EnrollmentProgress({ current = 0 }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((label, i) => {
        const done = i < current, active = i === current;
        return (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center gap-2">
              <div className={`w-9 h-9 rounded-full grid place-items-center text-sm font-semibold border ${done ? 'bg-[#006f51] text-white border-[#006f51]' : active ? 'bg-[#ff832e] text-white border-[#ff832e]' : 'bg-white text-slate-400 border-slate-300'}`}>
                {done ? <Check size={16}/> : i + 1}
              </div>
              <span className={`text-xs ${active || done ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>{label}</span>
            </div>
            {i < steps.length - 1 && <div className={`flex-1 h-[2px] mx-2 mb-5 rounded ${i < current ? 'bg-[#006f51]' : 'bg-slate-200'}`}/>}
          </React.Fragment>
        );
      })}
    </div>
  );
}