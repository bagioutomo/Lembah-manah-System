import React, { useState, useMemo } from 'react';
import { 
  ClipboardList, 
  CheckCircle2, 
  Circle, 
  Check,
  ShieldCheck, 
  Plus,
  X,
  User,
  AlignLeft,
  ChevronDown,
  ChevronUp,
  Save,
  Calendar,
  AlertCircle,
  Briefcase,
  ArrowRight,
  FileText,
  MessageSquare,
  Users,
  ImageIcon,
  Loader2,
  PenTool,
  Trash2,
  Printer,
  Download,
  LayoutGrid,
  Building2,
  MapPin,
  Clock,
  Target,
  Gavel,
  History,
  Sparkles,
  Zap,
  Wand2,
  UserPlus,
  Search,
  ZapOff,
  AlertTriangle,
  Hourglass,
  CheckCircle,
  Edit3,
  BookOpen,
  CornerDownRight,
  BadgeCheck,
  FileCheck,
  Sigma
} from 'lucide-react';
import { UserRole, MeetingMinute, DashboardTask, Employee } from '../types';
import { storage } from '../services/storageService';
import { generateTaskPoints, generateMeetingActionItems } from '../services/geminiService';
import html2canvas from 'html2canvas';

interface Props {
  userRole: UserRole;
  selectedMonth: number;
  selectedYear: number;
  tasks: DashboardTask[];
  setTasks: React.Dispatch<React.SetStateAction<DashboardTask[]>>;
  meetings: MeetingMinute[];
  setMeetings: React.Dispatch<React.SetStateAction<MeetingMinute[]>>;
  employees?: Employee[];
}

const JobdeskChecklist: React.FC<Props> = ({ userRole, selectedMonth, selectedYear, tasks, setTasks, meetings, setMeetings, employees = [] }) => {
  const isOwner = userRole === 'OWNER';
  const businessInfo = useMemo(() => storage.getBusinessInfo(), []);
  
  const [activeTab, setActiveTab] = useState<'TASKS' | 'MEETINGS'>('TASKS');
  
  const realToday = new Date();
  const realTodayStr = `${realToday.getFullYear()}-${String(realToday.getMonth() + 1).padStart(2, '0')}-${String(realToday.getDate()).padStart(2, '0')}`;

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [showTaskReport, setShowTaskReport] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [viewingMeeting, setViewingMeeting] = useState<MeetingMinute | null>(null);
  const [isGeneratingTask, setIsGeneratingTask] = useState(false);
  const [isSummarizingAction, setIsSummarizingAction] = useState(false);

  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);

  const [taskFormData, setTaskFormData] = useState({
    text: '',
    description: '',
    pic: 'MANAGER',
    startDate: realTodayStr,
    endDate: realTodayStr
  });

  const [meetingFormData, setMeetingFormData] = useState({
    title: '',
    date: realTodayStr,
    startTime: '10:00',
    endTime: '11:30',
    location: 'Office Lembah Manah',
    attendants: '',
    discussion: '',
    decisions: '',
    actionItems: ''
  });

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleAiGenerateTask = async () => {
    if (!taskFormData.text) return alert('Masukkan judul tugas singkat dulu, Pak!');
    setIsGeneratingTask(true);
    try {
      const result = await generateTaskPoints(taskFormData.text, taskFormData.pic);
      if (result) {
        setTaskFormData(prev => ({ ...prev, description: result }));
      }
    } finally {
      setIsGeneratingTask(false);
    }
  };

  const handleAiSummarizeActionItems = async () => {
    if (!meetingFormData.discussion) return alert('Bapak isi dulu narasi pembahasannya di atas agar AI bisa merangkum!');
    setIsSummarizingAction(true);
    try {
      const result = await generateMeetingActionItems(meetingFormData.discussion);
      if (result) {
        setMeetingFormData(prev => ({ ...prev, actionItems: result }));
      }
    } finally {
      setIsSummarizingAction(false);
    }
  };

  const toggleJob = (id: string) => {
    setTasks(prev => prev.map(j => {
      if (j.id === id && (isOwner || j.pic === userRole)) {
        return { ...j, completed: !j.completed };
      }
      return j;
    }));
  };

  const handleAddJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner || !taskFormData.text.trim()) return;

    const newJob: DashboardTask = {
      id: `task-${Date.now()}`,
      text: taskFormData.text.toUpperCase(),
      description: taskFormData.description,
      pic: taskFormData.pic,
      startDate: taskFormData.startDate,
      endDate: taskFormData.endDate,
      completed: false,
      month: selectedMonth, 
      year: selectedYear
    };

    setTasks(prev => [newJob, ...prev]);
    setShowTaskForm(false);
    setTaskFormData({ text: '', description: '', pic: 'MANAGER', startDate: realTodayStr, endDate: realTodayStr });
  };

  const handleSaveMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner || !meetingFormData.title.trim()) return;

    const meetingData: MeetingMinute = {
      id: editingMeetingId || `mtg-${Date.now()}`,
      title: meetingFormData.title.toUpperCase(),
      date: meetingFormData.date,
      startTime: meetingFormData.startTime,
      endTime: meetingFormData.endTime,
      location: meetingFormData.location,
      attendants: meetingFormData.attendants,
      discussion: meetingFormData.discussion,
      decisions: meetingFormData.decisions,
      actionItems: meetingFormData.actionItems,
      timestamp: new Date().toISOString()
    };

    if (editingMeetingId) {
      setMeetings(prev => prev.map(m => m.id === editingMeetingId ? meetingData : m));
      alert('Notulensi berhasil diperbarui!');
    } else {
      setMeetings(prev => [meetingData, ...prev]);
      alert('Notulensi baru berhasil disimpan!');
    }

    handleCloseMeetingForm();
  };

  const handleEditMeeting = (meeting: MeetingMinute) => {
    setEditingMeetingId(meeting.id);
    setMeetingFormData({
      title: meeting.title,
      date: meeting.date,
      startTime: meeting.startTime || '10:00',
      endTime: meeting.endTime || '11:30',
      location: meeting.location || 'Office Lembah Manah',
      attendants: meeting.attendants,
      discussion: meeting.discussion,
      decisions: meeting.decisions || '',
      actionItems: meeting.actionItems
    });
    setShowMeetingForm(true);
  };

  const handleCloseMeetingForm = () => {
    setShowMeetingForm(false);
    setEditingMeetingId(null);
    setMeetingFormData({ title: '', date: realTodayStr, startTime: '10:00', endTime: '11:30', location: 'Office Lembah Manah', attendants: '', discussion: '', decisions: '', actionItems: '' });
  };

  const deleteMeeting = (id: string) => {
    if (confirm('Bapak yakin ingin menghapus arsip notulensi ini secara permanen?')) {
      setMeetings(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleExportPaper = async (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    try {
      setIsCapturing(true);
      await new Promise(r => setTimeout(r, 1000));
      const canvas = await html2canvas(element, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.download = `${filename}_${new Date().getTime()}.jpg`;
      link.click();
    } finally {
      setIsCapturing(false);
    }
  };

  const displayedJobs = useMemo(() => {
    const periodFiltered = tasks.filter(t => t.month === selectedMonth && t.year === selectedYear);
    if (isOwner) return periodFiltered;
    return periodFiltered.filter(j => j.pic === userRole);
  }, [tasks, userRole, isOwner, selectedMonth, selectedYear]);

  const displayedMeetings = useMemo(() => {
    return meetings.filter(m => {
       const d = new Date(m.date);
       return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [meetings, selectedMonth, selectedYear]);

  const stats = useMemo(() => {
    const total = displayedJobs.length;
    const completed = displayedJobs.filter(j => j.completed).length;
    const pending = total - completed;
    const overdue = displayedJobs.filter(j => !j.completed && j.endDate && j.endDate < realTodayStr).length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, overdue, progress };
  }, [displayedJobs, realTodayStr]);

  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  const periodLabel = `${months[selectedMonth]} ${selectedYear}`;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 no-print">
        <div className="flex items-center gap-6">
           <div className="w-20 h-20 bg-indigo-600 text-white rounded-[2rem] shadow-2xl flex items-center justify-center">
              {activeTab === 'TASKS' ? <ClipboardList size={36} /> : <MessageSquare size={36} />}
           </div>
           <div>
              <div className="flex items-center gap-3 mb-1">
                 <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">
                   {activeTab === 'TASKS' ? 'Agenda & Tugas' : 'Notulensi Rapat'}
                 </h2>
                 <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-800">
                    {months[selectedMonth]} {selectedYear}
                 </span>
              </div>
              <p className="text-sm text-gray-500 font-medium italic flex items-center gap-2">
                <Briefcase size={14}/> {isOwner ? 'Delegasi instruksi & arsip meeting periode aktif.' : `Daftar prioritas departemen ${userRole}.`}
              </p>
           </div>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
           <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl border dark:border-gray-700 w-fit">
              <button onClick={() => setActiveTab('TASKS')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'TASKS' ? 'bg-white dark:bg-gray-900 text-indigo-600 shadow-md' : 'text-gray-400'}`}>Daftar Tugas</button>
              <button onClick={() => setActiveTab('MEETINGS')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'MEETINGS' ? 'bg-white dark:bg-gray-900 text-indigo-600 shadow-md' : 'text-gray-400'}`}>Notulensi</button>
           </div>
           {activeTab === 'TASKS' && (
             <button onClick={() => setShowTaskReport(true)} className="p-4 bg-white dark:bg-gray-800 text-emerald-600 rounded-2xl border border-emerald-100 dark:border-emerald-800 hover:bg-emerald-50 transition-all shadow-sm cursor-pointer" title="Cetak Daftar Tugas"><Printer size={20}/></button>
           )}
           {isOwner && (
             <button onClick={() => activeTab === 'TASKS' ? setShowTaskForm(true) : setShowMeetingForm(true)} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 cursor-pointer"><Plus size={18} /> {activeTab === 'TASKS' ? 'Tugas Baru' : 'Catat Meeting'}</button>
           )}
        </div>
      </div>

      {activeTab === 'TASKS' ? (
        <div className="space-y-8 animate-fade-in no-print">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border shadow-xl flex items-center gap-6"><div className="relative w-16 h-16"><svg className="w-full h-full" viewBox="0 0 36 36"><path className="text-gray-100 dark:text-gray-800 stroke-current" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" /><path className="text-indigo-600 stroke-current transition-all duration-1000" strokeWidth="3" strokeDasharray={`${stats.progress}, 100`} strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" /></svg><div className="absolute inset-0 flex items-center justify-center"><span className="text-[12px] font-black">{stats.progress}%</span></div></div><div><p className="text-[9px] font-black text-gray-400 uppercase">Penyelesaian</p><h4 className="text-lg font-black">{isOwner ? 'Global' : 'Divisi'}</h4></div></div>
              <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border shadow-xl flex items-center gap-5"><div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner"><Check size={20} /></div><div><p className="text-[9px] font-black text-gray-400 uppercase">Selesai</p><h4 className="text-lg font-black">{stats.completed} Item</h4></div></div>
              <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border shadow-xl flex items-center gap-5"><div className="w-10 h-10 bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner"><Clock size={20} /></div><div><p className="text-[9px] font-black text-gray-400 uppercase">Proses</p><h4 className="text-lg font-black">{stats.pending} Item</h4></div></div>
              <div className={`p-8 rounded-[3rem] border shadow-xl flex items-center gap-5 ${stats.overdue > 0 ? 'bg-red-50 dark:bg-red-950/20 border-red-200' : 'bg-white dark:bg-gray-900'}`}><div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stats.overdue > 0 ? 'bg-red-600 text-white' : 'bg-gray-50 text-gray-300'}`}><AlertCircle size={20} /></div><div><p className="text-[9px] font-black uppercase text-gray-400">Terlambat</p><h4 className={`text-lg font-black ${stats.overdue > 0 ? 'text-red-600' : ''}`}>{stats.overdue} Item</h4></div></div>
           </div>
           
           <div className="space-y-4">
              {displayedJobs.length === 0 ? (
                <div className="py-32 text-center bg-white dark:bg-gray-900 border-2 border-dashed rounded-[4rem] opacity-40"><ClipboardList className="mx-auto mb-6 text-gray-300" size={64} /><p className="text-sm font-black uppercase tracking-[0.4em] text-gray-400">Belum ada tugas periode ini</p></div>
              ) : (
                displayedJobs.map((job) => (
                  <div key={job.id} className={`group flex flex-col p-8 rounded-[2.5rem] border-2 transition-all duration-500 hover:shadow-2xl relative overflow-hidden ${job.completed ? 'bg-gray-50/50 dark:bg-gray-900/50 border-transparent opacity-60 scale-[0.98]' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'}`}>
                    <div className="flex items-center gap-6">
                       <button onClick={() => toggleJob(job.id)} disabled={!isOwner && job.pic !== userRole} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 flex-shrink-0 ${job.completed ? `bg-emerald-600 text-white shadow-lg` : 'bg-gray-50 dark:bg-gray-800 text-gray-300 hover:scale-110'} ${(!isOwner && job.pic !== userRole) ? 'opacity-30 cursor-not-allowed' : ''}`}>{job.completed ? <Check size={32} strokeWidth={4} /> : <Circle size={24} />}</button>
                       <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedId(expandedId === job.id ? null : job.id)}><h3 className={`text-xl font-black uppercase tracking-tight transition-all duration-500 truncate ${job.completed ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white group-hover:text-indigo-600'}`}>{job.text}</h3><div className="flex flex-wrap items-center gap-3 mt-1"><div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase border border-gray-200 text-gray-400"><Calendar size={12}/> {job.endDate ? new Date(job.endDate).toLocaleDateString('id-ID', {day:'2-digit', month:'short'}) : '-'}</div><div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase border border-indigo-100 text-indigo-600 bg-indigo-50/50"><User size={12}/> {job.pic}</div></div></div>
                       <button onClick={() => setExpandedId(expandedId === job.id ? null : job.id)} className="p-3 text-gray-300 hover:text-gray-600 transition-colors cursor-pointer">{expandedId === job.id ? <ChevronUp size={28} /> : <ChevronDown size={28} />}</button>
                    </div>
                    {expandedId === job.id && job.description && (
                      <div className="mt-8 pt-8 border-t border-dashed dark:border-gray-800 animate-slide-up">
                         <div className="flex items-center gap-3 mb-4 text-indigo-600"><Wand2 size={18}/><h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Instruksi Detail (AI Generated)</h4></div>
                         <div className="bg-gray-50 dark:bg-gray-950 p-6 rounded-3xl text-sm font-medium leading-relaxed italic text-gray-600 dark:text-gray-400 whitespace-pre-line border border-gray-100 dark:border-gray-800">"{job.description}"</div>
                      </div>
                    )}
                  </div>
                ))
              )}
           </div>
        </div>
      ) : (
        <div className="space-y-8 animate-fade-in no-print">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {displayedMeetings.length === 0 ? (
                 <div className="col-span-full py-32 text-center bg-white dark:bg-gray-900 border-2 border-dashed rounded-[4rem] opacity-40"><MessageSquare className="mx-auto mb-6 text-gray-300" size={64} /><p className="text-sm font-black uppercase tracking-[0.4em] text-gray-400">Belum ada notulensi periode ini</p></div>
              ) : (
                 displayedMeetings.map(m => (
                    <div key={m.id} className="bg-white dark:bg-gray-900 p-10 rounded-[3.5rem] border border-gray-100 dark:border-gray-800 shadow-xl hover:shadow-2xl transition-all relative overflow-hidden group">
                       <div className="flex justify-between items-start mb-8 relative z-10">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner"><FileText size={24}/></div>
                             <div>
                                <h3 className="text-xl font-black uppercase tracking-tight text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">{m.title}</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1.5 mt-1"><Calendar size={10}/> {new Date(m.date).toLocaleDateString('id-ID', {day:'2-digit', month:'long', year:'numeric'})}</p>
                             </div>
                          </div>
                          {isOwner && (
                            <div className="flex items-center gap-1">
                               <button onClick={() => handleEditMeeting(m)} className="p-2.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer"><Edit3 size={18}/></button>
                               <button onClick={() => deleteMeeting(m.id)} className="p-2.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"><Trash2 size={18}/></button>
                            </div>
                          )}
                       </div>
                       <div className="space-y-4 mb-10 relative z-10"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-[10px] font-black uppercase text-gray-500 truncate">Hadir: {m.attendants}</span></div><p className="text-xs font-medium text-gray-600 dark:text-gray-400 line-clamp-3 italic">"{m.discussion.slice(0, 150)}..."</p></div>
                       <button onClick={() => setViewingMeeting(m)} className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg hover:scale-[1.02] transition-all active:scale-95 cursor-pointer">Buka Dokumen Notulensi <ArrowRight size={16}/></button>
                    </div>
                 ))
              )}
           </div>
        </div>
      )}

      {/* PRATINJAU NOTULENSI (LONG PAGE PDF LOGIC) */}
      {viewingMeeting && (
        <div className="fixed inset-0 z-[200] flex justify-center items-start px-4 animate-fade-in no-print overflow-y-auto py-10">
           <div className="fixed inset-0 bg-black/90 backdrop-blur-md" onClick={() => setViewingMeeting(null)} />
           <div className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl p-6 sm:p-12 animate-scale-in">
              <div className="flex items-center justify-between mb-8 border-b pb-4 no-print">
                 <div className="flex items-center gap-3 text-indigo-600"><BookOpen size={24}/><h3 className="text-xl font-black uppercase tracking-tighter">Official Document Explorer</h3></div>
                 <button onClick={() => setViewingMeeting(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-all cursor-pointer text-gray-400"><X size={28}/></button>
              </div>

              {/* AREA CETAK: LONG PAGE OPTIMIZED */}
              <div id="meeting-minute-capture" className="bg-white p-[25mm] text-left text-black relative mx-auto shadow-none border border-gray-100 print-view-optimized" style={{ width: '210mm', minHeight: 'auto' }}>
                 
                 {/* WATERMARK */}
                 <div className="absolute inset-0 pointer-events-none opacity-[0.02] flex items-center justify-center z-0 rotate-[-35deg] select-none">
                    <p className="text-[120px] font-black uppercase tracking-[0.3em]">OFFICIAL RECORD</p>
                 </div>

                 {/* HEADER */}
                 <div className="relative z-10 flex flex-col items-center text-center mb-16 pb-12 border-b-[6px] border-black gap-6">
                    {businessInfo.logoUrl ? (
                       <img src={businessInfo.logoUrl} className="h-16 mb-1 object-contain" alt="Logo" />
                    ) : (
                       <div className="w-16 h-16 bg-black text-white rounded-[2rem] flex items-center justify-center font-black text-xl shadow-lg">LM</div>
                    )}
                    <div className="space-y-1">
                       <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">MINUTES OF MEETING</h1>
                       <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.5em] mt-3">{businessInfo.name.toUpperCase()} • DIGITAL ARCHIVE</p>
                    </div>
                 </div>

                 {/* METADATA */}
                 <div className="relative z-10 grid grid-cols-2 gap-10 mb-16 p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 break-inside-avoid">
                    <div className="space-y-4">
                       <div><p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest border-b pb-1 mb-2">JUDUL PERTEMUAN:</p><p className="text-xl font-black uppercase leading-tight tracking-tight">{viewingMeeting.title}</p></div>
                       <div><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b pb-1 mb-2">LOKASI:</p><p className="text-xs font-black uppercase flex items-center gap-1"><MapPin size={12}/> {viewingMeeting.location || '-'}</p></div>
                    </div>
                    <div className="text-right space-y-4 border-l pl-8 border-gray-200">
                       <div><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b pb-1 mb-2 text-right">WAKTU:</p><p className="text-xs font-black uppercase">{new Date(viewingMeeting.date).toLocaleDateString('id-ID', {day:'2-digit', month:'long', year:'numeric'})}</p><p className="text-2xl font-black text-rose-600 mt-1">{viewingMeeting.startTime} - {viewingMeeting.endTime} WIB</p></div>
                       <div><p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest border-b pb-1 mb-2 text-right">ID DOKUMEN:</p><p className="text-[10px] font-mono font-bold text-gray-400">REF#{viewingMeeting.id.toUpperCase()}</p></div>
                    </div>
                 </div>

                 {/* SECTIONS: WITH break-inside-avoid TO PREVENT SPLITTING */}
                 <div className="relative z-10 space-y-12">
                    <div className="space-y-4 break-inside-avoid">
                       <h4 className="text-[11px] font-black uppercase tracking-[0.2em] border-b-2 border-black pb-2">I. DAFTAR HADIR</h4>
                       <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 text-[10pt] font-bold uppercase leading-relaxed text-gray-700">{viewingMeeting.attendants}</div>
                    </div>

                    <div className="space-y-4">
                       <h4 className="text-[11px] font-black uppercase tracking-[0.2em] border-b-2 border-black pb-2">II. NARASI PEMBAHASAN</h4>
                       <div className="text-[11pt] leading-[1.8] whitespace-pre-line text-gray-800 font-medium pl-4 border-l-4 border-gray-100">{viewingMeeting.discussion}</div>
                    </div>

                    <div className="space-y-4 break-inside-avoid">
                       <h4 className="text-[11px] font-black uppercase tracking-[0.2em] border-b-2 border-black pb-2 text-indigo-600">III. HASIL KEPUTUSAN FINAL</h4>
                       <div className="p-8 bg-indigo-50/40 rounded-[2.5rem] border-2 border-indigo-100 shadow-inner"><p className="text-[11pt] font-black leading-relaxed whitespace-pre-line text-indigo-900 uppercase italic">"{viewingMeeting.decisions || '-'}"</p></div>
                    </div>

                    <div className="space-y-4 break-inside-avoid">
                       <h4 className="text-[11px] font-black uppercase tracking-[0.2em] border-b-2 border-black pb-2 text-emerald-600">IV. PENUGASAN (ACTION ITEMS)</h4>
                       <div className="p-8 bg-emerald-50/30 rounded-[2.5rem] border-2 border-emerald-100 space-y-4">
                          {viewingMeeting.actionItems.split('\n').map((item, i) => (
                             <div key={i} className="flex gap-4 items-start group">
                                <div className="w-5 h-5 rounded border-2 border-emerald-400 shrink-0 mt-0.5"></div>
                                <p className="text-[11pt] font-black uppercase text-emerald-900 leading-tight">{item || '-'}</p>
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>

                 {/* SIGNATURE: break-inside-avoid TO ENSURE BOTH APPEAR TOGETHER */}
                 <div className="relative z-10 mt-32 pt-12 border-t border-dashed border-gray-200 text-center uppercase break-inside-avoid">
                    <div className="flex justify-between px-10">
                       <div className="w-64"><p className="text-[9px] font-black text-gray-400 mb-20 tracking-widest uppercase">NOTULIS (VERIFIER)</p><div className="border-b-2 border-black w-full mb-1"></div><p className="text-[10px] font-black text-gray-400 tracking-widest mt-2">VERIFIED RECORD</p></div>
                       <div className="w-64"><p className="text-[9px] font-black text-gray-400 mb-20 tracking-widest uppercase">EXECUTIVE OWNER</p><div className="border-b-2 border-black w-full mb-1"></div><p className="text-[11pt] font-black text-black">{businessInfo.ownerName || 'DEDY SASMITO'}</p></div>
                    </div>
                 </div>
              </div>

              <div className="mt-12 flex flex-col sm:flex-row gap-4 max-w-[800px] mx-auto pb-10 no-print">
                 <button onClick={() => handleExportPaper('meeting-minute-capture', `NOTULENSI_${viewingMeeting?.title.replace(/\s+/g, '_')}`)} disabled={isCapturing} className="flex-1 py-7 bg-emerald-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-4 active:scale-95 cursor-pointer">
                    {isCapturing ? <Loader2 size={24} className="animate-spin" /> : <ImageIcon size={24} />} SIMPAN JPG
                 </button>
                 <button onClick={() => window.print()} className="flex-1 py-7 bg-black text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-4 active:scale-95 cursor-pointer">
                    <Printer size={24} /> CETAK PDF (LONG PAGE)
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* MEETING FORM MODAL (ADD & EDIT) */}
      {showMeetingForm && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center px-4 animate-fade-in no-print">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={handleCloseMeetingForm} />
           <div className="relative w-full max-w-5xl bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl p-10 lg:p-14 animate-scale-in border-t-8 border-indigo-600 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-10">
                 <div className="flex items-center gap-4">
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-3xl"><PenTool size={32}/></div>
                    <h3 className="text-3xl font-black uppercase tracking-tighter">{editingMeetingId ? 'Update Notulensi Rapat' : 'Pencatatan Hasil Rapat'}</h3>
                 </div>
                 <button onClick={handleCloseMeetingForm} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all cursor-pointer"><X size={32}/></button>
              </div>
              <form onSubmit={handleSaveMeeting} className="space-y-12">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50 dark:bg-gray-800/40 p-8 rounded-[2rem]">
                    <div className="space-y-4">
                       <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-widest">Informasi Dasar</h4>
                       <div className="space-y-4">
                          <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase ml-2">Judul Rapat</label><input required type="text" value={meetingFormData.title} onChange={e => setMeetingFormData({...meetingFormData, title: e.target.value.toUpperCase()})} placeholder="EVALUASI OPERASIONAL BAR" className="w-full bg-white dark:bg-gray-950 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-6 py-4 outline-none font-black text-sm uppercase transition-all shadow-sm" /></div>
                          <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase ml-2">Lokasi / Tempat</label><input type="text" value={meetingFormData.location} onChange={e => setMeetingFormData({...meetingFormData, location: e.target.value})} className="w-full bg-white dark:bg-gray-950 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-6 py-4 outline-none font-bold text-sm shadow-sm" /></div>
                       </div>
                    </div>
                    <div className="space-y-4">
                       <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-widest">Waktu & Tanggal</h4>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5 col-span-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-2">Tanggal Pelaksanaan</label><input required type="date" value={meetingFormData.date} onChange={e => setMeetingFormData({...meetingFormData, date: e.target.value})} className="w-full bg-white dark:bg-gray-950 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-6 py-4 outline-none font-black text-sm" /></div>
                          <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase ml-2">Jam Mulai</label><input type="time" value={meetingFormData.startTime} onChange={e => setMeetingFormData({...meetingFormData, startTime: e.target.value})} className="w-full bg-white dark:bg-gray-950 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-6 py-4 outline-none font-black text-sm" /></div>
                          <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase ml-2">Jam Selesai</label><input type="time" value={meetingFormData.endTime} onChange={e => setMeetingFormData({...meetingFormData, endTime: e.target.value})} className="w-full bg-white dark:bg-gray-950 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-6 py-4 outline-none font-black text-sm" /></div>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Staff Selection Hub (Daftar Hadir)</label><input type="text" value={meetingFormData.attendants} onChange={e => setMeetingFormData({...meetingFormData, attendants: e.target.value.toUpperCase()})} placeholder="NAMA PETUGAS YANG HADIR..." className="w-full bg-gray-50 dark:bg-gray-950 rounded-[1.5rem] px-8 py-5 outline-none font-black text-xs uppercase shadow-inner" /></div>

                 <div className="space-y-4"><h4 className="text-sm font-black uppercase tracking-tighter">Narasi Pembahasan Detail</h4><textarea required value={meetingFormData.discussion} onChange={e => setMeetingFormData({...meetingFormData, discussion: e.target.value})} placeholder="Tuliskan poin-poin diskusi di sini..." className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-[2rem] px-8 py-8 outline-none font-medium text-base h-64 leading-[1.8] shadow-inner" /></div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <div className="flex items-center gap-3"><div className="p-2 bg-black dark:bg-white text-white dark:text-black rounded-xl"><Gavel size={18}/></div><h4 className="text-sm font-black uppercase tracking-tighter">Hasil Keputusan (Final)</h4></div>
                       <textarea required value={meetingFormData.decisions} onChange={e => setMeetingFormData({...meetingFormData, decisions: e.target.value.toUpperCase()})} placeholder="HASIL AKHIR YANG DISETUJUI BERSAMA..." className="w-full bg-gray-900 text-white dark:bg-gray-100 dark:text-black rounded-[2rem] px-8 py-8 outline-none font-black text-xs h-64 leading-relaxed resize-none shadow-xl border-t-8 border-indigo-600" />
                    </div>
                    <div className="space-y-4">
                       <div className="flex items-center justify-between px-2">
                          <div className="flex items-center gap-3"><div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><Target size={18}/></div><h4 className="text-sm font-black uppercase tracking-tighter">Penugasan (Action Items)</h4></div>
                          <button type="button" onClick={handleAiSummarizeActionItems} disabled={isSummarizingAction || !meetingFormData.discussion} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed group transition-all">{isSummarizingAction ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} className="group-hover:animate-pulse" />}{isSummarizingAction ? 'Menganalisis...' : 'Rangkum Tugas via AI'}</button>
                       </div>
                       <textarea required value={meetingFormData.actionItems} onChange={e => setMeetingFormData({...meetingFormData, actionItems: e.target.value.toUpperCase()})} placeholder="1. [TUGAS] __________________ (PIC: ... )" className="w-full bg-emerald-50/30 dark:bg-emerald-950/20 border-2 border-emerald-100 dark:border-emerald-900 focus:border-emerald-500 rounded-[2rem] px-8 py-8 outline-none font-black text-xs h-64 leading-relaxed resize-none shadow-inner" />
                    </div>
                 </div>

                 <button type="submit" className="w-full py-8 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-[13px] shadow-2xl hover:bg-indigo-700 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-4 cursor-pointer"><Save size={28}/> {editingMeetingId ? 'Perbarui Arsip Digital' : 'Publikasikan Notulensi Digital'}</button>
              </form>
           </div>
        </div>
      )}

      {/* TASK FORM MODAL */}
      {showTaskForm && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center px-4 animate-fade-in no-print">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowTaskForm(false)} />
           <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl p-10 animate-scale-in border-t-8 border-indigo-600">
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-8">Delegasi Tugas Baru</h3>
              <form onSubmit={handleAddJob} className="space-y-6">
                 <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase ml-2">Judul Tugas</label><input required type="text" value={taskFormData.text} onChange={e => setTaskFormData({...taskFormData, text: e.target.value.toUpperCase()})} className="w-full bg-gray-50 dark:bg-gray-950 rounded-2xl px-6 py-4 outline-none font-black text-sm uppercase" /></div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase ml-2">PIC (Penanggung Jawab)</label><select value={taskFormData.pic} onChange={e => setTaskFormData({...taskFormData, pic: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-950 rounded-2xl px-6 py-4 outline-none font-black text-xs uppercase cursor-pointer"><option value="MANAGER">MANAGER</option><option value="ADMIN">ADMIN</option><option value="SUPERVISOR">SUPERVISOR</option><option value="PURCHASING">PURCHASING</option></select></div>
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase ml-2">Batas Waktu</label><input type="date" value={taskFormData.endDate} onChange={e => setTaskFormData({...taskFormData, endDate: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-950 rounded-2xl px-6 py-4 outline-none font-black text-xs" /></div>
                 </div>
                 <div className="space-y-2">
                    <div className="flex justify-between items-center px-2"><label className="text-[10px] font-black text-gray-400 uppercase">Instruksi Kerja (Jobdesk)</label><button type="button" onClick={handleAiGenerateTask} disabled={isGeneratingTask} className="text-[9px] font-black text-indigo-600 flex items-center gap-1 hover:underline">{isGeneratingTask ? 'Generating...' : 'Gunakan AI'}</button></div>
                    <textarea value={taskFormData.description} onChange={e => setTaskFormData({...taskFormData, description: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-950 rounded-2xl p-6 text-sm h-40 outline-none resize-none shadow-inner" />
                 </div>
                 <button type="submit" className="w-full py-6 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all cursor-pointer">Terbitkan Instruksi</button>
              </form>
           </div>
        </div>
      )}

      <style>{`
        .print-view-optimized {
          height: auto !important;
          min-height: 297mm !important;
          page-break-after: always;
        }
        @media print {
          body * { visibility: hidden; }
          #task-report-capture, #meeting-minute-capture,
          #task-report-capture *, #meeting-minute-capture * { visibility: visible; }
          #task-report-capture, #meeting-minute-capture {
            position: absolute; left: 0; top: 0;
            width: 100% !important; height: auto !important;
            min-height: auto !important; margin: 0 !important;
            padding: 15mm !important; box-shadow: none !important;
            border: none !important;
          }
          tr { page-break-inside: avoid !important; }
          .break-inside-avoid { 
            page-break-inside: avoid !important; 
            break-inside: avoid !important; 
          }
          @page { size: auto; margin: 10mm; }
        }
      `}</style>
    </div>
  );
};

export default JobdeskChecklist;