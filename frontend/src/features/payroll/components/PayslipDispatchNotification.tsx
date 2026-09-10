import React, { useState, useEffect, useRef } from 'react';
import { Mail, Check, X, ChevronDown, ChevronUp } from 'lucide-react';

type PayslipDispatchNotificationProps = {
  isOpen: boolean;
  onClose: () => void;
  payrunName?: string;
};

// 75 Realistic recipients for dummy log simulation
const RECIPIENTS: { name: string; email: string; isReal?: boolean }[] = [
  { name: 'Aarav Sharma', email: 'devanshnair.05@gmail.com', isReal: true },
  { name: 'Priya Patel', email: 'priya.patel@peoplepay.internal' },
  { name: 'Rohan Mehta', email: 'rohan.mehta@peoplepay.internal' },
  { name: 'Sneha Nair', email: 'sneha.nair@peoplepay.internal' },
  { name: 'Vikram Malhotra', email: 'vikram.m@peoplepay.internal' },
  { name: 'Ananya Gupta', email: 'ananya.g@peoplepay.internal' },
  { name: 'Rajesh Kumar', email: 'rajesh.k@peoplepay.internal' },
  { name: 'Pooja Singh', email: 'pooja.s@peoplepay.internal' },
  { name: 'Arjun Reddy', email: 'arjun.r@peoplepay.internal' },
  { name: 'Deepika Joshi', email: 'deepika.j@peoplepay.internal' },
  { name: 'Kavita Desai', email: 'kavita.d@peoplepay.internal' },
  { name: 'Aditya Verma', email: 'aditya.v@peoplepay.internal' },
  { name: 'Meera Iyer', email: 'meera.i@peoplepay.internal' },
  { name: 'Siddharth Rao', email: 'siddharth.r@peoplepay.internal' },
  { name: 'Divya Nambiar', email: 'divya.n@peoplepay.internal' },
  { name: 'Harsh Vardhan', email: 'harsh.v@peoplepay.internal' },
  { name: 'Neha Kulkarni', email: 'neha.k@peoplepay.internal' },
  { name: 'Gaurav Bhatia', email: 'gaurav.b@peoplepay.internal' },
  { name: 'Tanvi Saxena', email: 'tanvi.s@peoplepay.internal' },
  { name: 'Kunal Kapoor', email: 'kunal.k@peoplepay.internal' },
  { name: 'Ishita Roy', email: 'ishita.r@peoplepay.internal' },
  { name: 'Manish Pandey', email: 'manish.p@peoplepay.internal' },
  { name: 'Swati Pillai', email: 'swati.p@peoplepay.internal' },
  { name: 'Naveen Chawla', email: 'naveen.c@peoplepay.internal' },
  { name: 'Shruti Menon', email: 'shruti.m@peoplepay.internal' },
  { name: 'Vivek Sengupta', email: 'vivek.s@peoplepay.internal' },
  { name: 'Ritu Agarwal', email: 'ritu.a@peoplepay.internal' },
  { name: 'Abhishek Tiwari', email: 'abhishek.t@peoplepay.internal' },
  { name: 'Poonam Yadav', email: 'poonam.y@peoplepay.internal' },
  { name: 'Tarun Bhatt', email: 'tarun.b@peoplepay.internal' },
  { name: 'Komal Chauhan', email: 'komal.c@peoplepay.internal' },
  { name: 'Sanjay Mishra', email: 'sanjay.m@peoplepay.internal' },
  { name: 'Bhavna Goswami', email: 'bhavna.g@peoplepay.internal' },
  { name: 'Mohit Rawat', email: 'mohit.r@peoplepay.internal' },
  { name: 'Ankita Bose', email: 'ankita.b@peoplepay.internal' },
  { name: 'Alok Trivedi', email: 'alok.t@peoplepay.internal' },
  { name: 'Geeta Mathur', email: 'geeta.m@peoplepay.internal' },
  { name: 'Pradeep Jha', email: 'pradeep.j@peoplepay.internal' },
  { name: 'Pallavi Hegde', email: 'pallavi.h@peoplepay.internal' },
  { name: 'Chetan Somani', email: 'chetan.s@peoplepay.internal' },
  { name: 'Rupal Shah', email: 'rupal.s@peoplepay.internal' },
  { name: 'Akash Bajpai', email: 'akash.b@peoplepay.internal' },
  { name: 'Rashmi Das', email: 'rashmi.d@peoplepay.internal' },
  { name: 'Himanshu Goel', email: 'himanshu.g@peoplepay.internal' },
  { name: 'Simran Walia', email: 'simran.w@peoplepay.internal' },
  { name: 'Karan Singhal', email: 'karan.s@peoplepay.internal' },
  { name: 'Shalini Murthy', email: 'shalini.m@peoplepay.internal' },
  { name: 'Deepak Sethi', email: 'deepak.s@peoplepay.internal' },
  { name: 'Garima Bansal', email: 'garima.b@peoplepay.internal' },
  { name: 'Nitin Kaushik', email: 'nitin.k@peoplepay.internal' },
  { name: 'Aastha Poddar', email: 'aastha.p@peoplepay.internal' },
  { name: 'Varun Grover', email: 'varun.g@peoplepay.internal' },
  { name: 'Reema Solanki', email: 'reema.s@peoplepay.internal' },
  { name: 'Sunil Prasad', email: 'sunil.p@peoplepay.internal' },
  { name: 'Juhi Khanna', email: 'juhi.k@peoplepay.internal' },
  { name: 'Rahul Bajaj', email: 'rahul.b@peoplepay.internal' },
  { name: 'Monika Dutta', email: 'monika.d@peoplepay.internal' },
  { name: 'Akhil Saxena', email: 'akhil.s@peoplepay.internal' },
  { name: 'Payal Kothari', email: 'payal.k@peoplepay.internal' },
  { name: 'Dinesh Oberoi', email: 'dinesh.o@peoplepay.internal' },
  { name: 'Kiran Thapar', email: 'kiran.t@peoplepay.internal' },
  { name: 'Sachin Narang', email: 'sachin.n@peoplepay.internal' },
  { name: 'Vandana Shenoy', email: 'vandana.s@peoplepay.internal' },
  { name: 'Rajiv Kaul', email: 'rajiv.k@peoplepay.internal' },
  { name: 'Smita Mahajan', email: 'smita.m@peoplepay.internal' },
  { name: 'Pankaj Lal', email: 'pankaj.l@peoplepay.internal' },
  { name: 'Shilpa Nayak', email: 'shilpa.n@peoplepay.internal' },
  { name: 'Girish Kamath', email: 'girish.k@peoplepay.internal' },
  { name: 'Aparna Biswas', email: 'aparna.b@peoplepay.internal' },
  { name: 'Suraj Soni', email: 'suraj.s@peoplepay.internal' },
  { name: 'Megha Rastogi', email: 'megha.r@peoplepay.internal' },
  { name: 'Umesh Chauhan', email: 'umesh.c@peoplepay.internal' },
  { name: 'Preeti Deshmukh', email: 'preeti.d@peoplepay.internal' },
  { name: 'Anand Varma', email: 'anand.v@peoplepay.internal' },
  { name: 'Roshni Chopra', email: 'roshni.c@peoplepay.internal' },
];

export const PayslipDispatchNotification: React.FC<PayslipDispatchNotificationProps> = ({
  isOpen,
  onClose,
  payrunName = 'August 2026 Regular Payrun',
}) => {
  const [currentCount, setCurrentCount] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setCurrentCount(0);
      setLogs([]);
      setIsCompleted(false);
      setIsMinimized(false);
      return;
    }

    // Reset and start progression
    setCurrentCount(0);
    setLogs([`[00:00] Initialized SMTP batch worker for "${payrunName}" (75 recipients)`]);
    setIsCompleted(false);

    let count = 0;
    const interval = setInterval(() => {
      count++;
      if (count <= RECIPIENTS.length) {
        const item = RECIPIENTS[count - 1];
        const now = new Date();
        const timeStr = now.toTimeString().split(' ')[0];
        const statusNote = item.isReal ? 'Delivered via SMTP' : 'Sent';
        
        setCurrentCount(count);
        setLogs((prev) => [
          ...prev,
          `[${timeStr}] #${String(count).padStart(2, '0')} ${item.name} <${item.email}> — ${statusNote}`,
        ]);
      }

      if (count >= RECIPIENTS.length) {
        clearInterval(interval);
        setIsCompleted(true);
        setLogs((prev) => [
          ...prev,
          `[SUCCESS] All 75 payslip PDF attachments generated and dispatched.`,
        ]);
      }
    }, 65);

    return () => clearInterval(interval);
  }, [isOpen, payrunName]);

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  if (!isOpen) return null;

  const percentage = Math.min(100, Math.round((currentCount / RECIPIENTS.length) * 100));

  return (
    <div className="fixed bottom-5 right-5 z-50 w-88 sm:w-96 max-w-[calc(100vw-2.5rem)] bg-bg border border-line rounded-xl shadow-2xl font-sans overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
      {/* Top Header */}
      <div className="p-3 bg-bg-raised/70 border-b border-line flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-md bg-bg border border-line flex items-center justify-center shrink-0">
            {isCompleted ? (
              <Check className="w-3.5 h-3.5 text-accent" />
            ) : (
              <Mail className="w-3.5 h-3.5 text-accent animate-pulse" />
            )}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-ink m-0 truncate">
              {isCompleted ? 'All 75 Payslips Sent' : 'Sending Payslips...'}
            </h4>
            <span className="text-[10px] text-ink-soft block font-mono">
              {currentCount} of {RECIPIENTS.length} dispatched ({percentage}%)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 rounded hover:bg-bg-raised text-ink-soft hover:text-ink cursor-pointer transition-colors"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-bg-raised text-ink-soft hover:text-ink cursor-pointer transition-colors"
            title="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-bg-raised h-1.5 overflow-hidden">
        <div
          className="h-full bg-accent transition-all duration-75 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Expandable Logs Section */}
      {!isMinimized && (
        <div className="p-3 space-y-2.5">
          {/* Scrollable Dummy Logs Console */}
          <div
            ref={logContainerRef}
            className="h-32 overflow-y-auto font-mono text-[10px] leading-relaxed bg-bg-raised/40 border border-line rounded-lg p-2.5 space-y-1 select-text text-ink-soft"
          >
            {logs.map((log, idx) => (
              <div
                key={idx}
                className={`truncate ${
                  log.includes('devanshnair.05@gmail.com')
                    ? 'text-ink font-semibold'
                    : log.includes('[SUCCESS]')
                    ? 'text-ink font-semibold'
                    : 'text-ink-soft'
                }`}
              >
                {log}
              </div>
            ))}
          </div>

          {/* Footer Bar */}
          <div className="flex items-center justify-between text-[11px] text-ink-soft pt-1">
            <span className="truncate">
              {isCompleted ? '✓ Completed batch' : 'Live email stream'}
            </span>
            {isCompleted && (
              <button
                type="button"
                onClick={onClose}
                className="px-2.5 py-1 rounded bg-bg-raised hover:bg-bg text-ink border border-line text-[11px] font-medium transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
