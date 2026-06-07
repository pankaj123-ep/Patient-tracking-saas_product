import React, { useState } from "react";
import {
  Search,
  Plus,
  Activity,
  Heart,
  Thermometer,
  ShieldAlert,
  Calendar,
  FileText,
  User,
  Users,
  BriefcaseMedical,
  Filter,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Wallet,
  ChevronDown,
  ChevronUp,
  Lock,
  Unlock,
  Settings,
  Shield,
  Key,
  GraduationCap
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Patient, VitalRecord, ClinicalEntry, Appointment, Doctor, Clinic } from "./types";
import { INITIAL_PATIENTS, INITIAL_DOCTORS, INITIAL_CLINICS } from "./data";
import MedicalDossier from "./components/MedicalDossier";
import RegisterModal from "./components/RegisterModal";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid } from "recharts";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: {
      dateStr: string;
      labelStr: string;
      revenue: number;
    };
  }>;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-indigo-500/30 p-2 rounded-lg text-left shadow-lg">
        <p className="text-[9px] font-mono font-bold text-indigo-300 tracking-wider">
          {payload[0].payload.dateStr}
        </p>
        <p className="text-xs font-black text-emerald-400 mt-0.5">
          Revenue: ${payload[0].payload.revenue}
        </p>
      </div>
    );
  }
  return null;
};

export default function App() {
  const [clinics, setClinics] = useState<Clinic[]>(INITIAL_CLINICS);
  const [activeClinicId, setActiveClinicId] = useState<string>("CLI-001");
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [doctors, setDoctors] = useState<Doctor[]>(INITIAL_DOCTORS);
  const [userRole, setUserRole] = useState<"Owner" | "Doctor" | "Patient">("Owner"); // Admin/Clinic Owner, Doctor staff, or Patient view
  const [activeDoctorId, setActiveDoctorId] = useState<string>("DOC-001"); // Selected Doctor
  const [activePatientId, setActivePatientId] = useState<string>("PAT-001"); // Selected Patient
  const [leftTab, setLeftTab] = useState<"patients" | "doctors">("patients");
  
  // New Clinic Form state
  const [isNewClinicOpen, setIsNewClinicOpen] = useState(false);
  const [newClinicName, setNewClinicName] = useState("");
  const [newClinicTagline, setNewClinicTagline] = useState("");
  const [newClinicAddress, setNewClinicAddress] = useState("");
  const [clinicFeedback, setClinicFeedback] = useState("");

  // Register doctor form states
  const [newDocName, setNewDocName] = useState("");
  const [newDocSpec, setNewDocSpec] = useState("");
  const [docFeedback, setDocFeedback] = useState("");

  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Admitted" | "Outpatient" | "Observation" | "Discharged">("All");
  const [doctorFilter, setDoctorFilter] = useState("All");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [showRevenueLedger, setShowRevenueLedger] = useState(false);

  // Sync selected patient on role switch to protect role-based access rules, filtered by active tenant clinic
  React.useEffect(() => {
    const clinicDocs = doctors.filter((d) => d.clinicId === activeClinicId);
    const clinicPats = patients.filter((p) => p.clinicId === activeClinicId);

    // 1. Sync active doctor
    if (clinicDocs.length > 0) {
      const isDocValid = clinicDocs.some((d) => d.id === activeDoctorId);
      if (!isDocValid) {
        setActiveDoctorId(clinicDocs[0].id);
      }
    } else {
      setActiveDoctorId("");
    }

    // 2. Sync active patient login selection
    if (clinicPats.length > 0) {
      const isPatValid = clinicPats.some((p) => p.id === activePatientId);
      if (!isPatValid) {
        setActivePatientId(clinicPats[0].id);
      }
    } else {
      setActivePatientId("");
    }

    // 3. Sync selectedPatientId based on active role rules
    if (userRole === "Patient") {
      const currentPatId = activePatientId || (clinicPats[0] ? clinicPats[0].id : "");
      setSelectedPatientId(currentPatId);
    } else if (userRole === "Doctor") {
      const activeDocName = doctors.find((d) => d.id === activeDoctorId)?.name || "";
      const docPatients = clinicPats.filter((p) => p.primaryDoctor === activeDocName);
      if (docPatients.length > 0) {
        const currentIsDocPatient = docPatients.some((p) => p.id === selectedPatientId);
        if (!currentIsDocPatient) {
          setSelectedPatientId(docPatients[0].id);
        }
      } else {
        setSelectedPatientId("");
      }
    } else {
      // Owner (Admin)
      const currentIsClinicPatient = clinicPats.some((p) => p.id === selectedPatientId);
      if (!currentIsClinicPatient) {
        setSelectedPatientId(clinicPats[0]?.id || "");
      }
    }
  }, [userRole, activeDoctorId, activePatientId, activeClinicId, doctors, patients, selectedPatientId]);

  // Group and compile collected patient registration fee values by calendar day (only for patients in active clinic)
  const getDailyRevenue = () => {
    const revenueMap: { [date: string]: { total: number; upi: number; cash: number; count: number } } = {};
    
    patients.filter(p => p.clinicId === activeClinicId).forEach((p) => {
      const date = p.admissionDate || new Date().toISOString().split("T")[0];
      const fee = p.registrationFee || 0;
      const method = p.paymentMethod || "UPI";
      
      if (!revenueMap[date]) {
        revenueMap[date] = { total: 0, upi: 0, cash: 0, count: 0 };
      }
      
      if (fee > 0) {
        revenueMap[date].total += fee;
        if (method === "UPI") {
          revenueMap[date].upi += fee;
        } else {
          revenueMap[date].cash += fee;
        }
        revenueMap[date].count += 1;
      }
    });

    return Object.entries(revenueMap)
      .map(([date, data]) => ({
        date,
        ...data
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  };

  const dailyRevenueList = getDailyRevenue();
  const todayDateStr = new Date().toISOString().split("T")[0];
  const todayRevenue = dailyRevenueList.find(item => item.date === todayDateStr)?.total || 0;
  const totalRevenueAllDays = dailyRevenueList.reduce((sum, item) => sum + item.total, 0);

  const getLast30DaysRevenue = () => {
    const data = [];
    const clinicPatients = patients.filter(p => p.clinicId === activeClinicId);
    
    // Create a map of date -> total revenue for quick lookup
    const revenueByDate: { [date: string]: number } = {};
    clinicPatients.forEach(p => {
      const dStr = p.admissionDate || new Date().toISOString().split("T")[0];
      const fee = p.registrationFee || 0;
      if (fee > 0) {
        revenueByDate[dStr] = (revenueByDate[dStr] || 0) + fee;
      }
    });

    // Find the max date amongst [2026-06-07, new Date(), any patient record date] to anchor the 30-day timeline
    let baseDate = new Date("2026-06-07");
    const today = new Date();
    if (today > baseDate) {
      baseDate = today;
    }
    
    clinicPatients.forEach(p => {
      if (p.admissionDate) {
        const pDate = new Date(p.admissionDate);
        if (pDate > baseDate) {
          baseDate = pDate;
        }
      }
    });
    
    for (let i = 29; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() - i);
      const dateQueryStr = d.toISOString().split("T")[0];
      
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const label = `${month}/${day}`;
      
      data.push({
        dateStr: dateQueryStr,
        labelStr: label,
        revenue: revenueByDate[dateQueryStr] || 0,
      });
    }
    return data;
  };

  const last30DaysRevenueData = getLast30DaysRevenue();

  const currentDoctorName = doctors.find((d) => d.id === activeDoctorId)?.name || "";

  // Filter logic
  const filteredPatients = patients.filter((p) => {
    // 0. Ensure patient belongs to active tenant clinic
    if (p.clinicId !== activeClinicId) {
      return false;
    }

    // 1. Registered Patient can ONLY inspect their own file
    if (userRole === "Patient") {
      return p.id === activePatientId;
    }
    
    // 2. Clinician Doctors can ONLY see patients assigned directly to them
    if (userRole === "Doctor") {
      if (p.primaryDoctor !== currentDoctorName) {
        return false;
      }
    }

    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.diagnoses.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || p.status === statusFilter;
    const matchesDoc = doctorFilter === "All" || p.primaryDoctor === doctorFilter;
    return matchesSearch && matchesStatus && matchesDoc;
  });

  // Selected Patient computed lookup
  const selectedPatient = patients.find((p) => p.id === selectedPatientId && p.clinicId === activeClinicId) || filteredPatients[0] || null;

  // Statistics counters
  const totalCount = filteredPatients.length;
  const admittedCount = filteredPatients.filter((p) => p.status === "Admitted").length;
  const observationCount = filteredPatients.filter((p) => p.status === "Observation").length;
  const scheduledCount = filteredPatients.reduce((acc, p) => acc + p.appointments.filter(a => a.status === "Scheduled").length, 0);

  // Registered doctors for filtering
  const doctorsList = doctors.filter((d) => d.clinicId === activeClinicId).map((d) => d.name);

  // Action: Register
  const handleRegisterPatient = (newPatient: Omit<Patient, "vitals" | "clinicalEntries" | "appointments"> & { initialClinicalEntries?: ClinicalEntry[] }) => {
    const completePatient: Patient = {
      ...newPatient,
      clinicId: activeClinicId,
      vitals: [],
      clinicalEntries: newPatient.initialClinicalEntries || [],
      appointments: []
    };
    setPatients((prev) => [completePatient, ...prev]);
    setSelectedPatientId(completePatient.id);
  };

  // Action: Add Vital
  const handleAddVital = (patientId: string, vital: Omit<VitalRecord, "id" | "timestamp">) => {
    const newRecord: VitalRecord = {
      ...vital,
      id: "VIT-" + Math.floor(100 + Math.random() * 900),
      timestamp: new Date().toISOString()
    };
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          return {
            ...p,
            vitals: [newRecord, ...p.vitals]
          };
        }
        return p;
      })
    );
  };

  // Action: Add Clinical Log entry
  const handleAddClinicalEntry = (patientId: string, entry: Omit<ClinicalEntry, "id" | "timestamp">) => {
    const newEntry: ClinicalEntry = {
      ...entry,
      id: "CLN-" + Math.floor(100 + Math.random() * 900),
      timestamp: new Date().toISOString()
    };
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          return {
            ...p,
            clinicalEntries: [newEntry, ...p.clinicalEntries]
          };
        }
        return p;
      })
    );
  };

  // Action: Book Appointment
  const handleAddAppointment = (patientId: string, appointment: Omit<Appointment, "id">) => {
    const newApp: Appointment = {
      ...appointment,
      id: "APP-" + Math.floor(100 + Math.random() * 900)
    };
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          return {
            ...p,
            appointments: [newApp, ...p.appointments]
          };
        }
        return p;
      })
    );
  };

  // Action: Log Recorded Conversation Consultation
  const handleAddRecordedConversation = (patientId: string, conversation: { recordedBy: "Patient" | "Doctor"; transcript: string; doctorName: string; audioDurationSeconds?: number }) => {
    const newConv = {
      ...conversation,
      id: "REC-" + Math.floor(100 + Math.random() * 900),
      timestamp: new Date().toISOString()
    };
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          const currentConvs = p.recordedConversations || [];
          return {
            ...p,
            recordedConversations: [newConv, ...currentConvs]
          };
        }
        return p;
      })
    );
  };

  // Action: Register Doctor (Admin console tool only available to Clinic Owner)
  const handleRegisterDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim() || !newDocSpec.trim()) return;
    
    let formattedName = newDocName.trim();
    if (!formattedName.toLowerCase().startsWith("dr.")) {
      formattedName = "Dr. " + formattedName;
    }

    const newDoctor: Doctor = {
      id: "DOC-" + Math.floor(100 + Math.random() * 900),
      clinicId: activeClinicId,
      name: formattedName,
      specialization: newDocSpec.trim(),
      joinedDate: new Date().toISOString().split("T")[0]
    };

    setDoctors((prev) => [...prev, newDoctor]);
    setNewDocName("");
    setNewDocSpec("");
    setDocFeedback(`Successfully registered ${formattedName} as ${newDoctor.specialization}!`);
    setTimeout(() => setDocFeedback(""), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans select-none antialiased">
      
      {clinicFeedback && (
        <div className="bg-emerald-600 text-white text-[11px] font-bold px-6 py-2 flex items-center justify-between border-b border-emerald-700 animate-slide-down shadow-inner shrink-0 leading-normal">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 animate-bounce" />
            {clinicFeedback}
          </span>
          <button onClick={() => setClinicFeedback("")} className="text-white hover:text-emerald-100 font-bold text-sm select-none px-2">&times;</button>
        </div>
      )}

      {/* Top Professional Header Bar */}
      <header id="main-header" className="bg-white border-b border-slate-200/85 sticky top-0 z-40 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center space-x-3 flex-wrap gap-y-2">
          <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0">
            <Activity className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-black tracking-tight text-slate-900 uppercase flex items-center gap-1.5">
              <span>{clinics.find(c => c.id === activeClinicId)?.name || "Patient Tracker"}</span>
              <span className="text-[9px] font-mono tracking-normal font-medium text-indigo-750 bg-indigo-50 border border-indigo-150 rounded px-1 py-0.5 lowercase">
                SaaS tenant
              </span>
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              🏥 {clinics.find(c => c.id === activeClinicId)?.tagline || "Clinical Informatics Console"} &bull; {clinics.find(c => c.id === activeClinicId)?.address || "Secure Medical Office"}
            </p>
          </div>

          {/* SaaS Tenant Clinic Dropdown Selector */}
          <div className="flex items-center space-x-1.5 pl-3 md:border-l border-slate-200">
            <BriefcaseMedical className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <select
              id="active-clinic-tenant-selector"
              value={activeClinicId}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "__ADD_NEW_CLINIC__") {
                  setIsNewClinicOpen(true);
                } else {
                  setActiveClinicId(val);
                }
              }}
              className="bg-slate-900 hover:bg-slate-950 text-white text-[11px] font-bold rounded-lg px-2.5 py-1.5 focus:outline-hidden cursor-pointer shadow-3xs transition-all border-none"
            >
              {clinics.map((c) => (
                <option key={c.id} value={c.id} className="text-slate-800 font-semibold font-sans">
                  🏟️ {c.name}
                </option>
              ))}
              <option value="__ADD_NEW_CLINIC__" className="text-indigo-600 font-semibold">➕ Launch Clinic Tenant...</option>
            </select>
          </div>

          {/* Access Control Role Switcher */}
          <div className="flex flex-wrap items-center gap-2 pl-3 md:border-l border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider hidden sm:inline ml-1" id="role-label">Portal Login:</span>
            
            {/* Primary Role Selector */}
            <select
              id="role-identity-select"
              value={userRole}
              onChange={(e) => {
                const role = e.target.value as "Owner" | "Doctor" | "Patient";
                setUserRole(role);
                if (role !== "Owner") {
                  setShowRevenueLedger(false);
                }
              }}
              className="bg-indigo-50/50 hover:bg-slate-100 border border-indigo-100/80 text-indigo-950 text-[11px] font-bold rounded-lg px-2.5 py-1.5 focus:outline-hidden cursor-pointer shadow-2xs transition-all"
            >
              <option value="Owner">👑 Clinic Owner (Full Access)</option>
              <option value="Doctor">🩺 Registered Doctor Logins</option>
              <option value="Patient">👤 Patient Quick Logins</option>
            </select>

            {/* Contextual Selector 1: Doctor Choice */}
            {userRole === "Doctor" && (
              <div className="flex items-center space-x-1.5 animate-fade-in">
                <span className="text-[10px] text-slate-400 font-mono font-bold">PHY:</span>
                <select
                  id="active-doctor-selector"
                  value={activeDoctorId}
                  onChange={(e) => {
                    setActiveDoctorId(e.target.value);
                  }}
                  className="bg-indigo-600 border border-indigo-750 text-white text-[11px] font-semibold rounded-lg px-2 py-1 cursor-pointer shadow-3xs transition-all focus:outline-hidden"
                >
                  {doctors.filter((d) => d.clinicId === activeClinicId).map((d) => (
                    <option key={d.id} value={d.id} className="text-slate-800">
                      {d.name} ({d.specialization})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Contextual Selector 2: Patient Choice */}
            {userRole === "Patient" && (
              <div className="flex items-center space-x-1.5 animate-fade-in">
                <span className="text-[10px] text-slate-400 font-mono font-bold">PAT:</span>
                <select
                  id="active-patient-selector"
                  value={activePatientId}
                  onChange={(e) => {
                    setActivePatientId(e.target.value);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 border-none text-white text-[11px] font-semibold rounded-lg px-2 py-1 cursor-pointer shadow-3xs transition-all focus:outline-hidden"
                >
                  {patients.filter((p) => p.clinicId === activeClinicId).map((p) => (
                    <option key={p.id} value={p.id} className="text-slate-800">
                      {p.name} (Assigned to: {p.primaryDoctor})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Global Counters */}
        <div id="stats-ribbon" className="hidden lg:flex items-center space-x-6 bg-slate-50 border border-slate-100 px-4 py-2 rounded-2xl">
          <div className="text-center border-r border-slate-200/50 pr-4 flex items-center space-x-2">
            <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600"><Users className="h-4 w-4" /></div>
            <div className="text-left">
              <span className="block text-sm font-black text-slate-800 leading-none">{totalCount}</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase">Total Patient Files</span>
            </div>
          </div>
          <div className="text-center border-r border-slate-200/50 pr-4 flex items-center space-x-2">
            <div className="p-1.5 bg-rose-50 rounded-lg text-rose-600"><BriefcaseMedical className="h-4 w-4" /></div>
            <div className="text-left">
              <span className="block text-sm font-black text-slate-800 leading-none">{admittedCount}</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase">Inpatients</span>
            </div>
          </div>
          <div className="text-center border-r border-slate-200/50 pr-4 flex items-center space-x-2">
            <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600"><ShieldAlert className="h-4 w-4" /></div>
            <div className="text-left">
              <span className="block text-sm font-black text-slate-800 leading-none">{observationCount}</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase">Observation</span>
            </div>
          </div>
          <div className="text-center border-r border-slate-200/50 pr-4 flex items-center space-x-2">
            <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600"><Calendar className="h-4 w-4" /></div>
            <div className="text-left">
              <span className="block text-sm font-black text-slate-800 leading-none">{scheduledCount}</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase">Today Visits</span>
            </div>
          </div>
          
          {userRole === "Owner" && (
            <button
              id="header-revenue-btn"
              onClick={() => setShowRevenueLedger(!showRevenueLedger)}
              className="text-left flex items-center space-x-2 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-xl transition-all cursor-pointer active:scale-95"
              title="Inspect Daily Collected Fees ledger (Clinic Owner only)"
            >
              <div className="p-1 bg-indigo-600 rounded-lg text-white"><Wallet className="h-3.5 w-3.5" /></div>
              <div>
                <span className="block text-xs font-black text-slate-850 leading-tight">${todayRevenue}</span>
                <span className="text-[8px] text-indigo-600 font-bold uppercase tracking-wider flex items-center gap-0.5 leading-none">
                  Today Revenue
                  <ChevronDown className={`h-2.5 w-2.5 transition-transform ${showRevenueLedger ? "rotate-180" : ""}`} />
                </span>
              </div>
            </button>
          )}
        </div>

        {/* Global actions */}
        <div className="flex items-center space-x-2">
          {/* Revenue Ledger toggle button for clinic owner only */}
          {userRole === "Owner" && (
            <button
              onClick={() => setShowRevenueLedger(!showRevenueLedger)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer active:scale-95 duration-100 flex items-center space-x-1.5 text-xs font-semibold
                ${showRevenueLedger 
                  ? "bg-slate-900 border-slate-950 text-indigo-300 shadow-inner" 
                  : "bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs"
                }`}
              title="Toggle Daily Revenue Ledger Balance"
            >
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Daily Revenue</span>
            </button>
          )}

          <button
            id="open-register-modal-btn"
            onClick={() => setIsRegisterOpen(true)}
            className="px-4.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm flex items-center space-x-2 transition-colors active:scale-95 duration-100 cursor-pointer text-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Register Patient</span>
          </button>
        </div>
      </header>

      {/* Main Split-Screen Workspace */}
      <main id="dashboard-split-workspace" className="flex-1 grid grid-cols-1 xl:grid-cols-4 overflow-hidden h-[calc(100vh-73px)]">
        
        {/* Left Panel: Search, directory logs, and directory filter */}
        <div id="left-directory-sidebar" className="xl:col-span-1 border-r border-slate-200/70 bg-white flex flex-col h-full overflow-hidden">
          
          {/* Collapsible Daily Revenue Ledger Panel */}
          <AnimatePresence>
            {showRevenueLedger && (
              <motion.div
                id="revenue-ledger-panel"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-indigo-950 text-indigo-100 p-4 border-b border-indigo-900 space-y-3 shrink-0 overflow-hidden"
              >
                {/* Header inside Panel */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Wallet className="h-4 w-4 text-indigo-400" />
                    <span className="text-xs font-bold uppercase tracking-wider font-mono text-indigo-300">Clinic Revenue Balance</span>
                  </div>
                  <button
                    onClick={() => setShowRevenueLedger(false)}
                    className="text-[10px] text-indigo-300 hover:text-white uppercase font-bold tracking-wider cursor-pointer border border-indigo-800/40 rounded px-1.5 py-0.5 bg-indigo-900/40"
                  >
                    Close
                  </button>
                </div>

                {/* Balances summary */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-900/40 border border-indigo-900/40 p-2.5 rounded-xl text-left">
                    <span className="block text-[8px] uppercase tracking-widest text-indigo-300 font-bold font-mono">Today Revenue</span>
                    <div className="flex items-baseline space-x-1 mt-0.5">
                      <span className="text-base font-black text-emerald-400">${todayRevenue}</span>
                      <span className="text-[9px] text-slate-400 font-mono font-bold">({dailyRevenueList.find(d => d.date === todayDateStr)?.count || 0} Registered)</span>
                    </div>
                  </div>
                  <div className="bg-slate-900/40 border border-indigo-900/40 p-2.5 rounded-xl text-left">
                    <span className="block text-[8px] uppercase tracking-widest text-indigo-300 font-bold font-mono">Total Revenue</span>
                    <div className="flex items-baseline space-x-1 mt-0.5">
                      <span className="text-base font-black text-indigo-100">${totalRevenueAllDays}</span>
                      <span className="text-[9px] text-slate-400 font-mono">All periods</span>
                    </div>
                  </div>
                </div>

                {/* Past 30 Days Recharts Bar Chart */}
                <div className="bg-slate-900/40 border border-indigo-900/40 p-2.5 rounded-xl text-left space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="block text-[8px] uppercase tracking-widest text-indigo-300 font-bold font-mono">30-Day Revenue Trend</span>
                    <span className="text-[8px] font-mono font-bold text-slate-450">Amt vs Date</span>
                  </div>
                  <div className="w-full h-[120px] pr-1 mt-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={last30DaysRevenueData}
                        margin={{ top: 5, right: 2, left: -25, bottom: 2 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(99, 102, 241, 0.08)" vertical={false} />
                        <XAxis 
                          dataKey="labelStr" 
                          tickLine={false} 
                          axisLine={false}
                          tick={{ fill: "#818cf8", fontSize: 7, fontWeight: 500 }}
                          interval={4} 
                        />
                        <YAxis 
                          tickLine={false} 
                          axisLine={false}
                          tick={{ fill: "#818cf8", fontSize: 7, fontWeight: 500 }}
                          tickFormatter={(val) => `$${val}`}
                        />
                        <RechartsTooltip 
                          content={<CustomTooltip />}
                          cursor={{ fill: "rgba(99, 102, 241, 0.1)" }}
                        />
                        <Bar 
                          dataKey="revenue" 
                          fill="#10b981" 
                          radius={[1.5, 1.5, 0, 0]} 
                          maxBarSize={6}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Day-by-Day Revenue generated ledger details */}
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
                  <span className="block text-[8px] uppercase tracking-widest text-indigo-400 font-bold font-mono pb-1 border-b border-indigo-900/45">Ledger Entries / Day</span>
                  {dailyRevenueList.length === 0 ? (
                    <p className="text-[10px] text-indigo-400 italic font-mono py-1">No payment entries compiled yet.</p>
                  ) : (
                    dailyRevenueList.map((item) => {
                      const isToday = item.date === todayDateStr;
                      return (
                        <div key={item.date} className={`flex items-center justify-between text-[11px] font-mono leading-relaxed p-1.5 rounded-lg border ${isToday ? "bg-slate-900 border-indigo-500/35" : "bg-indigo-900/15 border-transparent hover:bg-slate-900/10"}`}>
                          <div className="text-left">
                            <span className={`block font-bold ${isToday ? "text-emerald-400 font-sans uppercase text-[10px] tracking-wide" : "text-slate-300"}`}>
                              {isToday ? "★ Today, " : ""}{item.date}
                            </span>
                            <span className="block text-[9px] text-indigo-300 font-sans mt-0.5">
                              {item.count} {item.count === 1 ? "Registration entry" : "Registration entries"}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="block font-black text-white">${item.total}</span>
                            <span className="block text-[9px] text-indigo-300 mt-0.5">
                              UPI: <span className="text-indigo-200">${item.upi}</span> • Cash: <span className="text-indigo-200">${item.cash}</span>
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Left Sidebar Category Tabs */}
          <div className="flex border-b border-indigo-100 bg-slate-50/55 p-1 gap-1 shrink-0">
            <button
              onClick={() => setLeftTab("patients")}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold leading-none flex items-center justify-center space-x-1.5 transition-all cursor-pointer select-none py-2.5
                ${leftTab === "patients"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-650 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Patients Directory</span>
              <span className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded-full ${leftTab === "patients" ? "bg-indigo-800 text-white" : "bg-slate-200 text-slate-700"}`}>
                {filteredPatients.length}
              </span>
            </button>
            <button
              onClick={() => setLeftTab("doctors")}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold leading-none flex items-center justify-center space-x-1.5 transition-all cursor-pointer select-none py-2.5
                ${leftTab === "doctors"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-650 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              <span>Doctor Registry</span>
              <span className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded-full ${leftTab === "doctors" ? "bg-indigo-800 text-white" : "bg-slate-200 text-slate-700"}`}>
                {doctors.length}
              </span>
            </button>
          </div>

          {leftTab === "patients" ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Quick Find Search Field */}
              <div id="search-container" className="p-4 border-b border-slate-100 space-y-3 shrink-0">
                <div className="relative">
                  <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="patient-search-field"
                    type="text"
                    placeholder="Search patient, ID, or prognosis..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-800 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans"
                  />
                </div>

                {/* Attendance Staff Doctor Dropdown Filter */}
                <div id="physician-filter" className="flex items-center space-x-2">
                  <Filter className="h-3 w-3 text-slate-400" />
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Physician:</span>
                  <select
                    id="doc-filter-menu"
                    value={doctorFilter}
                    onChange={(e) => setDoctorFilter(e.target.value)}
                    className="text-xs bg-slate-100 hover:bg-slate-200 rounded-lg px-2 py-1 text-slate-600 border-none focus:ring-0 focus:outline-hidden font-medium cursor-pointer"
                  >
                    <option value="All">All Staff Doctors</option>
                    {doctorsList.map((doc) => (
                      <option key={doc} value={doc}>{doc}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Ward & Status Filter Tabs */}
              <div id="status-filtration-ribbon" className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center overflow-x-auto gap-1 text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 shrink-0">
                <span className="shrink-0 mr-1.5">Ward:</span>
                {["All", "Admitted", "Outpatient", "Observation", "Discharged"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status as any)}
                    className={`px-2 py-1 rounded-lg shrink-0 transition-colors ${
                      statusFilter === status 
                        ? "bg-indigo-600 text-white font-black" 
                        : "hover:bg-slate-200/60 text-slate-500"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {/* Interactive Scroll Patient Listings */}
              <div id="patients-scrollcard-list" className="flex-1 overflow-y-auto divide-y divide-slate-150 p-3 space-y-2">
                {filteredPatients.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs shadow-2xs bg-slate-50/50 rounded-xl my-2">
                    No active patients match the filter settings.
                  </div>
                ) : (
                  filteredPatients.map((p) => {
                    const isSelected = p.id === selectedPatientId;
                    const latestVital = p.vitals[0] || null;

                    return (
                      <motion.div
                        id={`p-card-${p.id}`}
                        key={p.id}
                        onClick={() => setSelectedPatientId(p.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none space-y-2 ${
                          isSelected
                            ? "bg-slate-900 border-slate-900 text-white shadow-md active:scale-[0.99]"
                            : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/70 shadow-2xs"
                        }`}
                        whileHover={{ scale: isSelected ? 1 : 1.01 }}
                        transition={{ duration: 0.1 }}
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-sm font-bold truncate max-w-[140px]">{p.name}</h4>
                            <p className="text-[10px] font-mono mt-0.5 text-slate-400">
                              ID: {p.id} • {p.age} {p.gender[0]}
                            </p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider
                            ${isSelected ? "bg-slate-850 text-slate-100 border border-slate-700" : ""}
                            ${!isSelected && p.status === "Admitted" ? "bg-rose-50 text-rose-700" : ""}
                            ${!isSelected && p.status === "Observation" ? "bg-amber-50 text-amber-700" : ""}
                            ${!isSelected && p.status === "Outpatient" ? "bg-indigo-50 text-indigo-700" : ""}
                            ${!isSelected && p.status === "Discharged" ? "bg-emerald-50 text-emerald-700" : ""}
                          `}>
                            {p.status}
                          </span>
                        </div>

                        {/* Vitals summary if active */}
                        {latestVital ? (
                          <div className="flex items-center space-x-3 text-[10px] border-t border-dashed pt-2 border-slate-200/10">
                            <span className="flex items-center">
                              <Heart className="h-3 w-3 mr-1 text-rose-500" />
                              <span className={`font-mono font-bold ${isSelected ? "text-slate-200" : "text-slate-600"}`}>
                                {latestVital.heartRate}
                              </span>
                            </span>
                            <span className="flex items-center">
                              <Activity className="h-3 w-3 mr-0.5 text-blue-500" />
                              <span className={`font-mono font-bold ${isSelected ? "text-slate-200" : "text-slate-600"}`}>
                                {latestVital.systolic}/{latestVital.diastolic}
                              </span>
                            </span>
                            <span className="flex items-center">
                              <Thermometer className="h-3 w-3 mr-0.5 text-orange-500" />
                              <span className={`font-mono font-bold ${isSelected ? "text-slate-200" : "text-slate-600"}`}>
                                {latestVital.temperature}°C
                              </span>
                            </span>
                          </div>
                        ) : (
                          <p className="text-[9px] text-slate-400 pt-1.5 italic font-medium font-sans">No vitals logged yet</p>
                        )}

                        {/* Attending physician indicator */}
                        <div className="text-[10px] truncate text-slate-400 border-t border-dashed pt-1.5 border-slate-200/10">
                          Attendant: <span className="font-semibold text-slate-500">{p.primaryDoctor}</span>
                        </div>

                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            /* DOCTOR REGISTRY & ADMIN PANEL */
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
              
              {/* ADMIN PANEL - NEW DOCTOR REGISTRATION FORM */}
              <div className="p-4 border-b border-slate-200 bg-white space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Settings className="h-4 w-4 text-indigo-650" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800 font-sans">Admin Specialist Section</span>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${userRole === "Owner" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                    {userRole === "Owner" ? "Owner Access" : "Locked for Staff"}
                  </span>
                </div>

                {userRole !== "Owner" ? (
                  <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-2xl space-y-2 text-center animate-fade-in">
                    <Lock className="h-5 w-5 text-amber-600 mx-auto" />
                    <div>
                      <h4 className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">Doctor Registration Restricted</h4>
                      <p className="text-[10px] text-amber-600 font-medium leading-relaxed mt-1">To add/register new doctors and their corresponding specializations, please switch your Access Identity role to <strong>Clinic Owner</strong>.</p>
                    </div>
                    <button
                      onClick={() => setUserRole("Owner")}
                      className="text-[10px] bg-amber-600 hover:bg-amber-700 text-white font-bold tracking-wide uppercase px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer w-full"
                    >
                      👑 Become Clinic Owner
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleRegisterDoctor} className="space-y-3 animate-fade-in">
                    <div className="flex items-center space-x-1.5 border-b border-indigo-50/50 pb-1.5">
                      <Plus className="h-3.5 w-3.5 text-indigo-501 animate-pulse" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Register New Doctor</span>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Doctor Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Dr. Arthur Pendelton"
                          value={newDocName}
                          onChange={(e) => setNewDocName(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Corresponding Specialization *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Neurologist, Dermatologist"
                          value={newDocSpec}
                          onChange={(e) => setNewDocSpec(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold uppercase tracking-wider text-[10px] py-2 rounded-lg transition-all shadow-2xs cursor-pointer flex items-center justify-center space-x-1"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Post Registration Link</span>
                    </button>

                    {docFeedback && (
                      <p className="text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100 font-medium animate-fade-in text-center">
                        {docFeedback}
                      </p>
                    )}
                  </form>
                )}
              </div>

              {/* REGISTERED CLINICIANS LIST */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400 tracking-widest pl-1 mb-1">
                  <span>Registered Staff Doctors ({doctors.filter((d) => d.clinicId === activeClinicId).length})</span>
                  <span>Active Ledger</span>
                </div>

                {doctors.filter((d) => d.clinicId === activeClinicId).map((d) => {
                  // Count patients assigned to this doctor as primary doc in active clinic
                  const assignedCount = patients.filter(p => p.primaryDoctor === d.name && p.clinicId === activeClinicId).length;
                  const initials = d.name.replace("Dr. ", "").split(" ").map(w => w[0]).join("").slice(0, 2);

                  return (
                    <div
                      key={d.id}
                      className="p-3 bg-white hover:bg-slate-50/60 border border-slate-100 rounded-xl transition-all shadow-3xs flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        {/* Beautiful Initials Avatar badge */}
                        <div className="h-9 w-9 shrink-0 bg-gradient-to-br from-indigo-500 to-indigo-650 text-white font-extrabold text-[11px] rounded-xl flex items-center justify-center shadow-3xs uppercase border border-indigo-200">
                          {initials || "MD"}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-800 truncate leading-tight">{d.name}</h4>
                          <span className="inline-block text-[9.5px] font-bold text-indigo-650 bg-indigo-50/80 px-1.5 py-0.5 border border-indigo-100/50 rounded mt-0.5 truncate max-w-[150px]">
                            {d.specialization}
                          </span>
                          <span className="block text-[8px] text-slate-400 font-mono mt-1">ID: {d.id} • Joined: {d.joinedDate}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 border
                          ${assignedCount > 0 
                            ? "bg-slate-50 text-slate-700 border-slate-200" 
                            : "bg-slate-50/40 text-slate-400 border-slate-100"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${assignedCount > 0 ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`}></span>
                          {assignedCount} {assignedCount === 1 ? "Patient" : "Patients"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Detailed Dossier Area */}
        <div id="right-details-stage" className="xl:col-span-3 p-6 overflow-y-auto h-full flex flex-col justify-stretch bg-slate-100">
          {selectedPatient ? (
            <MedicalDossier
              patient={selectedPatient}
              currentUserRole={userRole}
              currentDoctorName={currentDoctorName}
              onAddVital={handleAddVital}
              onAddClinicalEntry={handleAddClinicalEntry}
              onAddAppointment={handleAddAppointment}
              onAddRecordedConversation={handleAddRecordedConversation}
            />
          ) : (
            <div id="empty-workspace-state" className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white border border-slate-150 rounded-2xl h-full space-y-4">
              <BriefcaseMedical className="h-10 w-10 text-slate-300" />
              <div>
                <h3 className="text-base font-bold text-slate-700">Clinical Dossier Workspace</h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1">Select a registered patient file from the left-side directory sequence to inspect active telemetry records, diagnostic files, and AI Insights.</p>
              </div>
            </div>
          )}
        </div>

      </main>

      {/* Register Dialog overlay */}
      <AnimatePresence>
        {isRegisterOpen && (
          <RegisterModal
            isOpen={isRegisterOpen}
            onClose={() => setIsRegisterOpen(false)}
            onRegister={handleRegisterPatient}
            doctors={doctors.filter((d) => d.clinicId === activeClinicId)}
          />
        )}
      </AnimatePresence>

      {/* Launch Clinic SaaS Tenant Modal */}
      <AnimatePresence>
        {isNewClinicOpen && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-55 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden p-6 space-y-4 font-sans text-left"
            >
              <div className="flex items-center justify-between border-b border-slate-105 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <BriefcaseMedical className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Launch Clinic Tenant</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Independent SaaS Partition</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsNewClinicOpen(false)}
                  className="text-slate-450 hover:text-slate-700 font-semibold text-xl select-none px-2 cursor-pointer leading-none"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                if (!newClinicName.trim()) return;
                const newId = "CLI-" + Math.floor(100 + Math.random() * 900);
                const newClinic: Clinic = {
                  id: newId,
                  name: newClinicName.trim(),
                  tagline: newClinicTagline.trim() || "Multi-Speciality Healthcare",
                  address: newClinicAddress.trim() || "Virtual Digital Center",
                  joinedDate: new Date().toISOString().split("T")[0]
                };
                setClinics(prev => [...prev, newClinic]);
                setActiveClinicId(newId);
                
                setNewClinicName("");
                setNewClinicTagline("");
                setNewClinicAddress("");
                setIsNewClinicOpen(false);

                setClinicFeedback(`Successfully launched ${newClinic.name} clinic workspace! Registered doctors and patients inside this workspace will remain strictly isolated.`);
                setTimeout(() => setClinicFeedback(""), 7000);
              }} className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Company / Clinic Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Summit Orthopedics, Pacific Pediatric Care"
                      value={newClinicName}
                      onChange={(e) => setNewClinicName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tagline / Speciality Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Family Diagnostics & Pulmonary Rehab"
                      value={newClinicTagline}
                      onChange={(e) => setNewClinicTagline(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Clinic Physical Address</label>
                    <input
                      type="text"
                      placeholder="e.g. Ward 4B, Apex Medical Towers, Austin, TX"
                      value={newClinicAddress}
                      onChange={(e) => setNewClinicAddress(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsNewClinicOpen(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider py-2.5 rounded-xl transition-all cursor-pointer font-sans"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider py-2.5 rounded-xl transition-all shadow-sm cursor-pointer font-sans"
                  >
                    Launch Clinic
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
