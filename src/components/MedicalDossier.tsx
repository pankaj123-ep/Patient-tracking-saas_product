import React, { useState } from "react";
import {
  Heart,
  Thermometer,
  Wind,
  ShieldAlert,
  Calendar,
  FileText,
  Plus,
  Sparkles,
  AlertCircle,
  Activity,
  User,
  Activity as LogActivityIcon,
  ChevronsRight,
  Clock,
  BriefcaseMedical,
  MessageSquare,
  AlertTriangle,
  Mic,
  MicOff,
  Wand2,
  Phone,
  Home,
  ShieldCheck,
  Building,
  HeartPulse,
  Info,
  Lock,
  Volume2,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Patient, VitalRecord, ClinicalEntry, Appointment, AIInsights } from "../types";
import VitalCharts from "./VitalCharts";

interface MedicalDossierProps {
  patient: Patient;
  onAddVital: (patientId: string, vital: Omit<VitalRecord, "id" | "timestamp">) => void;
  onAddClinicalEntry: (patientId: string, entry: Omit<ClinicalEntry, "id" | "timestamp">) => void;
  onAddAppointment: (patientId: string, appointment: Omit<Appointment, "id">) => void;
  onAddRecordedConversation: (patientId: string, conversation: { recordedBy: "Patient" | "Doctor"; transcript: string; doctorName: string; audioDurationSeconds?: number }) => void;
  currentUserRole: "Owner" | "Doctor" | "Patient";
  currentDoctorName: string;
}

export default function MedicalDossier({
  patient,
  onAddVital,
  onAddClinicalEntry,
  onAddAppointment,
  onAddRecordedConversation,
  currentUserRole,
  currentDoctorName
}: MedicalDossierProps) {
  // Tabs: "vitals" | "demographics" | "notes" | "appointments" | "ai" | "recordings"
  const [activeTab, setActiveTab] = useState<"vitals" | "demographics" | "notes" | "appointments" | "ai" | "recordings">("vitals");

  // Custom Consultation Scribe States
  const [consultTranscript, setConsultTranscript] = useState("");
  const [isConsultRecording, setIsConsultRecording] = useState(false);
  const [consultMessage, setConsultMessage] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [consultRecognition, setConsultRecognition] = useState<any>(null);

  // Vitals form state

  // Vitals form state
  const [hr, setHr] = useState("80");
  const [sys, setSys] = useState("120");
  const [dia, setDia] = useState("80");
  const [temp, setTemp] = useState("36.7");
  const [resp, setResp] = useState("16");
  const [spo2, setSpo2] = useState("98");
  const [showVitalForm, setShowVitalForm] = useState(false);

  // Clinical encounter form state
  const [visitReason, setVisitReason] = useState("");
  const [assessment, setAssessment] = useState("");
  const [treatment, setTreatment] = useState("");
  const [attendingDoc, setAttendingDoc] = useState(patient.primaryDoctor);
  const [showLogForm, setShowLogForm] = useState(false);

  // Voice transcription & extraction states
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [isTranscribeExtracting, setIsTranscribeExtracting] = useState(false);
  const [transcribeMessage, setTranscribeMessage] = useState("");
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

  // Appointment form state
  const [appDate, setAppDate] = useState("");
  const [appTime, setAppTime] = useState("");
  const [appReason, setAppReason] = useState("");
  const [appDoc, setAppDoc] = useState(patient.primaryDoctor);
  const [showAppForm, setShowAppForm] = useState(false);

  // AI analysis state
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  // Notes clinical-experience Insight states
  const [notesInsight, setNotesInsight] = useState<string>("");
  const [isGeneratingNotesInsight, setIsGeneratingNotesInsight] = useState(false);
  const [notesInsightError, setNotesInsightError] = useState("");

  const handleDownloadSummary = () => {
    const divider = "================================================================================\n";
    const subDivider = "--------------------------------------------------------------------------------\n";
    
    let report = "";
    report += divider;
    report += "                      CLINICAL MEDICAL FILE DIRECTORY RECORD                     \n";
    report += `                     REPORT GENERATION DATE: ${new Date().toLocaleString()}      \n`;
    report += divider;
    report += "\n";
    
    report += "## 1. PATIENT DEMOGRAPHICS & CLINICAL IDENTITY IDENTIFIERS\n";
    report += subDivider;
    report += `Full Legal Name:             ${patient.name}\n`;
    report += `Patient ID Identifier:      ${patient.id}\n`;
    report += `Date of Birth:               ${patient.dateOfBirth || "N/A"}\n`;
    report += `Evaluated Age:               ${patient.age} years old\n`;
    report += `Target Gender Identity:      ${patient.gender}\n`;
    report += `Clinical Blood Group:        ${patient.bloodType || "N/A"}\n`;
    report += `Direct Contact Phone:        ${patient.contact}\n`;
    report += `Registered Email:            ${patient.email}\n`;
    report += `Residential Home Address:    ${patient.address || "N/A"}\n`;
    report += "\n";
    
    report += "## 2. EMERGENCY CONTACT INFORMATION FILE\n";
    report += subDivider;
    report += `Primary Emergency Contact:   ${patient.emergencyContactName || "N/A"}\n`;
    report += `Contact Phone Number:        ${patient.emergencyContactPhone || "N/A"}\n`;
    report += `Relationship to Patient:     ${patient.emergencyContactRelationship || "N/A"}\n`;
    report += "\n";

    report += "## 3. CLINICAL STATUS & WARNING IDENTIFIERS\n";
    report += subDivider;
    report += `Current Hospital Ward:       ${patient.status}\n`;
    report += `Attending Lead Physician:    ${patient.primaryDoctor}\n`;
    report += `Registration Fee Collected:  ${patient.registrationFee !== undefined ? `$${patient.registrationFee} (${patient.paymentMethod})` : "N/A"}\n`;
    report += `Allergies / Contraindication: ${patient.allergies || "No Known Drug Allergies (NKDA)"}\n`;
    report += `Internal Clinical Notes:     ${patient.notes || "None recorded"}\n`;
    report += "\n";
    
    report += "## 4. HISTORICAL VITAL TRANSCRIPTS MEASUREMENTS\n";
    report += subDivider;
    if (patient.vitals && patient.vitals.length > 0) {
      report += `${"Date / Time Recorded".padEnd(25)} | ${"HR".padEnd(5)} | ${"BP".padEnd(9)} | ${"Temp (°C)".padEnd(10)} | ${"Resp".padEnd(5)} | ${"SpO2".padEnd(6)} | ${"Logged By".padEnd(15)}\n`;
      report += "-".repeat(84) + "\n";
      patient.vitals.forEach((v) => {
        const dStr = new Date(v.timestamp).toLocaleString();
        const bpStr = `${v.systolic}/${v.diastolic}`;
        const spo2Str = `${v.spo2}%`;
        const hrStr = String(v.heartRate);
        const tempStr = String(v.temperature);
        const respStr = String(v.respiratoryRate);
        const loggedByStr = v.loggedBy.slice(0, 15);

        report += `${dStr.padEnd(25)} | ${hrStr.padEnd(5)} | ${bpStr.padEnd(9)} | ${tempStr.padEnd(10)} | ${respStr.padEnd(5)} | ${spo2Str.padEnd(6)} | ${loggedByStr.padEnd(15)}\n`;
      });
    } else {
      report += "No historical vital telemetry measurements found inside memory database.\n";
    }
    report += "\n";
    
    report += "## 5. RECENT CLINICAL ENCOUNTER LOGS & ADMISSION OBSERVATIONS\n";
    report += subDivider;
    if (patient.clinicalEntries && patient.clinicalEntries.length > 0) {
      patient.clinicalEntries.forEach((entry, idx) => {
        const eStr = new Date(entry.timestamp).toLocaleString();
        report += `Encounter File #${patient.clinicalEntries.length - idx}\n`;
        report += `Recorded At:       ${eStr}\n`;
        report += `Attendant Doctor:  Dr. ${entry.doctor}\n`;
        report += `Reason for Visit:  ${entry.reason}\n`;
        report += `Physician Clinician Findings:\n  ${entry.assessment.replace(/\ng/, "\n  ")}\n`;
        report += `Therapeutic prescribed Care medicines & clinical plans:\n  ${entry.treatment.replace(/\ng/, "\n  ")}\n`;
        report += "-".repeat(50) + "\n";
      });
    } else {
      report += "No historical clinician consultation notes logged.\n";
    }
    report += "\n";

    report += "## 6. SCHEDULED UPCOMING VISITS & APPOINTMENTS RECORD\n";
    report += subDivider;
    if (patient.appointments && patient.appointments.length > 0) {
      patient.appointments.forEach((app, idx) => {
        report += `Appointment #${idx+1} | Date: ${app.date} at ${app.time} | Dr. ${app.doctor}\n`;
        report += `Status: ${app.status} | Consultation Goal: ${app.reason}\n`;
        report += "-".repeat(50) + "\n";
      });
    } else {
      report += "No upcoming consultations scheduled.\n";
    }
    report += "\n";
    
    report += divider;
    report += "                 CONFIDENTIAL CLINICAL MEDICAL DIRECTORY SUMMARY               \n";
    report += divider;

    // Trigger formatted text download
    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Medical_Record_Summary_${patient.name.trim().replace(/\s+/g, "_")}_${patient.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleStartRecording = () => {
    setTranscribeMessage("");
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setTranscribeMessage("Web Speech API is not supported in this browser iframe. Try Chrome or Safari, or click 'Simulate Consultation Speech'.");
        return;
      }
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsRecording(true);
      };

      let finalTranscript = "";
      rec.onresult = (event: any) => {
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += trans + " ";
          } else {
            interimTranscript += trans;
          }
        }
        setVoiceTranscript((finalTranscript + interimTranscript).trim());
      };

      rec.onerror = (event: any) => {
        console.error("Speech error", event.error);
        if (event.error === "not-allowed") {
          setTranscribeMessage("Speech feedback or permission denied relative to browser settings. Try clicking 'Simulate Consultation Speech' below!");
        } else {
          setTranscribeMessage(`Speech status error: ${event.error}`);
        }
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      rec.start();
      setRecognitionInstance(rec);
    } catch (err) {
      console.error(err);
      setTranscribeMessage("Failed to initialize physical microphone channel.");
    }
  };

  const handleStopRecording = () => {
    if (recognitionInstance) {
      recognitionInstance.stop();
    }
    setIsRecording(false);
  };

  const handleSimulateSpeech = () => {
    setTranscribeMessage("");
    const samples = [
      `Doctor: "Hello ${patient.name}. Let me check your symptoms." Patient: "Doctor, I have had a severe productive cough and mild chest tightness for two days, particularly in the morning when I go jogging." Doctor: "Okay, your lungs show brief bronchoconstriction and mild bilateral wheezing. I am diagnosing you with sub-acute asthma exacerbation. I will prescribe Albuterol HFA rescue inhaler, 2 puffs every 4 to 6 hours as needed, and add a medication of Montelukast 10mg once daily before sleep for asthma prevention."`,
      `Doctor: "Hi ${patient.name}. How are those headaches?" Patient: "Hey doc, I still get throbbing headaches in the temples, especially when work gets stressful. It has been happening almost daily." Doctor: "No symptoms of cranial neuropathy are present, and your blood pressure is mildly elevated today. This is tension-type cephalalgia due to stress fatigue. I will prescribe Ibuprofen 400mg oral tablets, 1 tablet twice a day as needed for headaches, and urge you to record a blood pressure diary."`,
      `Doctor: "Hello ${patient.name}, what brings you in today?" Patient: "Doctor, I've had a sore throat, painful swallowing, and low-grade fatigue since yesterday evening." Doctor: "Tonsils show moderate congestion and bilateral enlargement with minor exudate. Diagnosis is acute streptococcal pharyngitis. I will prescribe Amoxicillin 500mg capsules, to be taken as one capsule three times a day for a full course of seven days."`
    ];
    const randomSample = samples[Math.floor(Math.random() * samples.length)];
    setVoiceTranscript(randomSample);
    setTranscribeMessage("Simulated live doctor-patient voice recording loaded! You can now click '⚡ Fill Form Details via AI' to parse.");
  };

  const handleExtractTranscript = async () => {
    if (!voiceTranscript.trim()) return;
    setIsTranscribeExtracting(true);
    setTranscribeMessage("");
    try {
      const response = await fetch("/api/transcribe-clinical", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: voiceTranscript })
      });
      if (!response.ok) {
        throw new Error("Transcription extraction failed");
      }
      const data = await response.json();
      if (data.reason) setVisitReason(data.reason);
      if (data.assessment) setAssessment(data.assessment);
      if (data.treatment) setTreatment(data.treatment);
      setTranscribeMessage("⚡ Successfully extracted clinical details and populated form below! Please review findings.");
    } catch (err) {
      console.error(err);
      setTranscribeMessage("Transcription processing failed. Please check network logs.");
    } finally {
      setIsTranscribeExtracting(false);
    }
  };

  // Sync AI clinical insights
  const fetchAiInsights = async () => {
    setIsAiLoading(true);
    setAiError("");
    try {
      const response = await fetch("/api/clinical-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientData: patient })
      });
      if (!response.ok) {
        throw new Error("Clinical endpoint returned an error status.");
      }
      const data = await response.json();
      setAiInsights(data);
    } catch (err) {
      console.error(err);
      setAiError("Could not retrieve AI assessment from backend. Verify configuration in Server logs.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Generate AI Diagnostic Observation based on past clinical entries & vitals
  const fetchNotesInsight = async () => {
    setIsGeneratingNotesInsight(true);
    setNotesInsightError("");
    setNotesInsight("");
    try {
      const response = await fetch("/api/generate-notes-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vitals: patient.vitals,
          clinicalEntries: patient.clinicalEntries,
          patientName: patient.name,
          age: patient.age,
          gender: patient.gender,
          diagnoses: patient.diagnoses
        })
      });
      if (!response.ok) {
        throw new Error("Failed to receive diagnostic observation. Check server details.");
      }
      const data = await response.json();
      if (data.insight) {
        setNotesInsight(data.insight);
      } else {
        throw new Error("No diagnostic insight text returned by backend.");
      }
    } catch (err) {
      console.error(err);
      setNotesInsightError(err instanceof Error ? err.message : "Failed to generate diagnostic observation.");
    } finally {
      setIsGeneratingNotesInsight(false);
    }
  };

  // Simple inline bolding parser helper
  const parseInlineBold = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="text-slate-950 font-bold">{part}</strong>;
      }
      return part;
    });
  };

  // Custom renderer for Markdown-formatted clinical observations
  const renderInsightMarkdown = (text: string) => {
    if (!text) return null;
    const lines = text.split("\n");
    return (
      <div className="space-y-3 text-xs text-slate-700 leading-relaxed font-sans">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1" />;
          
          if (trimmed.startsWith("###")) {
            return (
              <h4 key={idx} className="text-xs font-bold text-indigo-700 uppercase tracking-wide border-b border-indigo-100/50 pb-1 pt-2 flex items-center">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-600 mr-2"></span>
                {trimmed.replace(/^###\s*/, "")}
              </h4>
            );
          }
          
          if (trimmed.startsWith("**") && trimmed.includes("**")) {
            const match = trimmed.match(/^\*\*(.*?)\*\*([\s\S]*)$/);
            if (match) {
              return (
                <p key={idx} className="text-slate-700">
                  <strong className="text-slate-900 font-bold">{match[1]}</strong>
                  {parseInlineBold(match[2])}
                </p>
              );
            }
          }
          
          if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
            const content = trimmed.replace(/^[-*]\s+/, "");
            return (
              <li key={idx} className="list-disc pl-1 ml-4 text-slate-600 font-medium leading-relaxed">
                {parseInlineBold(content)}
              </li>
            );
          }
          
          return <p key={idx} className="text-slate-650">{parseInlineBold(trimmed)}</p>;
        })}
      </div>
    );
  };

  const currentVitals = patient.vitals[0] || null;

  // Form submits
  const handleVitalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddVital(patient.id, {
      heartRate: Number(hr),
      systolic: Number(sys),
      diastolic: Number(dia),
      temperature: Number(temp),
      respiratoryRate: Number(resp),
      spo2: Number(spo2),
      loggedBy: "Admitting Physician"
    });
    setShowVitalForm(false);
    // Trigger reset or keep template
  };

  const handleClinicalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitReason || !assessment) return;
    onAddClinicalEntry(patient.id, {
      reason: visitReason,
      assessment,
      treatment: treatment || "Observation / Routine tracking",
      doctor: attendingDoc
    });
    setVisitReason("");
    setAssessment("");
    setTreatment("");
    setShowLogForm(false);
  };

  const handleAppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appDate || !appReason) return;
    onAddAppointment(patient.id, {
      date: appDate,
      time: appTime || "09:00 AM",
      reason: appReason,
      status: "Scheduled",
      doctor: appDoc
    });
    setAppDate("");
    setAppTime("");
    setAppReason("");
    setShowAppForm(false);
  };

  const handleSimulateConsultationSpeech = () => {
    setConsultMessage("");
    const samples = [
      `Doctor: "Hello ${patient.name}. Let us review your respiratory congestion today." Patient: "Hello doc, I feel much better since yesterday, but I still have a mild dry cough and slight shortness of breath at night." Doctor: "Your respiratory cycle rate is 16 and blood oxygen is 98%, which is reassuring. I will keep you on the daily asthma log records. Resume your warm water inhalations twice daily."`,
      `Doctor: "Good day ${patient.name}. Your latest vitals are logged on your chart." Patient: "Hi Doctor! Yes, I was quite worried about my blood pressure earlier when I had a headache." Doctor: "Your blood pressure is currently 120/80 which is excellent. Continue taking your prescribed therapeutic care course with plenty of fluid intake."`,
      `Doctor: "Hello ${patient.name}. How are you tolerating the new treatment regimen?" Patient: "Doctor, I've had a sore throat, painful swallowing, but no fever since last night." Doctor: "Tonsillar nodes look clear. Let's record this consultation to your file so we can monitor progress next week."`
    ];
    const randomSample = samples[Math.floor(Math.random() * samples.length)];
    setConsultTranscript(randomSample);
    setConsultMessage("Simulated conversation tape loaded! Click 'Save Dialogue Record' below to permanently save it to this patient file.");
  };

  const handleStartConsultRecording = () => {
    setConsultMessage("");
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setConsultMessage("Web Speech API is not supported in this browser iframe. Please click 'Simulate Conversation Tape' below to test!");
        return;
      }
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsConsultRecording(true);
      };

      let finalTranscript = "";
      rec.onresult = (event: any) => {
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += trans + " ";
          } else {
            interimTranscript += trans;
          }
        }
        setConsultTranscript((finalTranscript + interimTranscript).trim());
      };

      rec.onerror = (event: any) => {
        console.error("Consult Speech Error", event.error);
        if (event.error === "not-allowed") {
          setConsultMessage("Microphone permission denied. Click 'Simulate Conversation Tape' below to instantly load a realistic exchange!");
        } else {
          setConsultMessage(`Speech error status: ${event.error}`);
        }
        setIsConsultRecording(false);
      };

      rec.onend = () => {
        setIsConsultRecording(false);
      };

      rec.start();
      setConsultRecognition(rec);
    } catch (e) {
      console.error(e);
      setConsultMessage("Failed to connect to browser microphone hardware.");
    }
  };

  const handleStopConsultRecording = () => {
    if (consultRecognition) {
      consultRecognition.stop();
    }
    setIsConsultRecording(false);
  };

  const handleSaveConsultation = () => {
    if (!consultTranscript.trim()) return;
    onAddRecordedConversation(patient.id, {
      recordedBy: currentUserRole === "Patient" ? "Patient" : "Doctor",
      transcript: consultTranscript,
      doctorName: patient.primaryDoctor,
      audioDurationSeconds: Math.floor(Math.random() * 80) + 15
    });
    setConsultTranscript("");
    setConsultMessage("✅ Consultation recorded successfully and saved to patient's clinical file!");
    setTimeout(() => setConsultMessage(""), 4000);
  };

  const formatDialogue = (text: string) => {
    if (!text) return null;
    
    const matches = text.match(/(Doctor|Patient|Clinician|Staff|User):\s*"?[^"]+"?/gi);
    if (matches && matches.length > 0) {
      return (
        <div className="space-y-3.5 pt-1">
          {matches.map((msg, index) => {
            const isDoc = msg.toLowerCase().startsWith("doctor:") || msg.toLowerCase().startsWith("clinician:");
            const speaker = isDoc ? `Attendant: ${patient.primaryDoctor}` : `Patient: ${patient.name}`;
            const messageBody = msg.replace(/^(Doctor|Patient|Clinician|Staff|User):\s*/i, "").replace(/^"|"/g, "");
            return (
              <div key={index} className={`flex flex-col ${isDoc ? "items-start" : "items-end"} space-y-1`}>
                <span className={`text-[9px] font-extrabold uppercase tracking-widest px-1.5 ${isDoc ? "text-indigo-600" : "text-emerald-600"}`}>
                  {speaker}
                </span>
                <div className={`p-3 rounded-2xl max-w-[85%] text-xs font-sans leading-relaxed shadow-3xs border
                  ${isDoc 
                    ? "bg-indigo-50/70 border-indigo-100 text-indigo-950 rounded-tl-none" 
                    : "bg-emerald-50/70 border-emerald-100 text-emerald-950 rounded-tr-none"
                  }`}
                >
                  {messageBody}
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    
    return (
      <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs font-sans leading-relaxed text-slate-600 italic">
        "{text}"
      </div>
    );
  };

  return (
    <div id={`dossier-${patient.id}`} className="bg-slate-50 border border-slate-100/80 rounded-2xl p-6 h-full flex flex-col space-y-6">
      
      {/* Patient Header Card */}
      <div id="dossier-patient-badge" className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center space-x-4">
          <div className="h-14 w-14 rounded-full bg-indigo-50 flex items-center justify-center border-2 border-indigo-100/50">
            <User className="h-7 w-7 text-indigo-600" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold font-sans text-slate-800">{patient.name}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider
                ${patient.status === "Admitted" ? "bg-rose-50 text-rose-700 border border-rose-100" : ""}
                ${patient.status === "Observation" ? "bg-amber-50 text-amber-700 border border-amber-100" : ""}
                ${patient.status === "Outpatient" ? "bg-indigo-50 text-indigo-700 border border-indigo-100" : ""}
                ${patient.status === "Discharged" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : ""}
              `}>
                {patient.status}
              </span>
            </div>
            <p className="text-sm font-sans font-medium text-slate-500 mt-0.5">
              ID: <span className="font-mono text-xs">{patient.id}</span> • {patient.age} yrs • {patient.gender} • Blood type: {patient.bloodType}
            </p>
            {patient.registrationFee !== undefined ? (
              <div className="mt-2 flex items-center space-x-1.5 text-xs">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-150 font-medium font-sans">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                  Collected Registration Fee: ${patient.registrationFee} ({patient.paymentMethod})
                </span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-slate-600 border-l-0 md:border-l border-slate-150 pl-0 md:pl-6">
            <div><span className="font-semibold text-slate-400">EMAIL:</span> {patient.email}</div>
            <div><span className="font-semibold text-slate-400">PHONE:</span> {patient.contact}</div>
            <div><span className="font-semibold text-slate-400">PHYSICIAN:</span> {patient.primaryDoctor}</div>
            <div><span className="font-semibold text-rose-400">ALLERGIES:</span> <span className="text-rose-600 font-medium">{patient.allergies}</span></div>
          </div>
          
          <button
            id="download-patient-summary-report-btn"
            onClick={handleDownloadSummary}
            className="flex items-center justify-center space-x-1.5 px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer border border-indigo-500 hover:border-indigo-650 active:scale-95 duration-100"
          >
            <Download className="h-4 w-4" />
            <span>Download Summary</span>
          </button>
        </div>
      </div>

      {/* Vitals Quick Glancers */}
      {currentVitals && (
        <div id="vitals-dashboard-glance" className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          {/* BP */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-2xs flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Blood Pressure</p>
              <p className="text-sm font-bold text-slate-700">{currentVitals.systolic}/{currentVitals.diastolic}</p>
              <p className="text-[9px] text-slate-400 whitespace-nowrap label">mmHg</p>
            </div>
          </div>
          {/* Pulse */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-2xs flex items-center space-x-3">
            <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
              <Heart className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Heart Rate</p>
              <p className="text-sm font-bold text-slate-700">{currentVitals.heartRate}</p>
              <p className="text-[9px] text-slate-400 label">BPM</p>
            </div>
          </div>
          {/* SpO2 */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-2xs flex items-center space-x-3">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <Wind className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">O₂ Oxygen SpO₂</p>
              <p className="text-sm font-bold text-slate-700">{currentVitals.spo2}%</p>
              <p className="text-[9px] text-slate-400 label">Normal</p>
            </div>
          </div>
          {/* Temperature */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-2xs flex items-center space-x-3">
            <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
              <Thermometer className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Temperature</p>
              <p className="text-sm font-bold text-slate-700">{currentVitals.temperature}°C</p>
              <p className="text-[9px] text-slate-400 label">Standard</p>
            </div>
          </div>
          {/* Respiration */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-2xs flex items-center space-x-3 col-span-2 md:col-span-1">
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Respiration</p>
              <p className="text-sm font-bold text-slate-700">{currentVitals.respiratoryRate}</p>
              <p className="text-[9px] text-slate-400 label">Breaths/Min</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs list */}
      <div id="medical-menu-tabs" className="border-b border-slate-200/60 pb-px flex items-center space-x-1 sm:space-x-4 bg-white p-1 rounded-xl self-start flex-wrap gap-y-1">
        <button
          onClick={() => setActiveTab("vitals")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center space-x-2 ${
            activeTab === "vitals" ? "bg-indigo-600 text-white shadow-2xs" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <Activity className="h-3.5 w-3.5" />
          <span>Vitals Indicators</span>
        </button>

        <button
          onClick={() => setActiveTab("demographics")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center space-x-2 ${
            activeTab === "demographics" ? "bg-indigo-600 text-white shadow-2xs" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <User className="h-3.5 w-3.5" />
          <span>Demographics File</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("notes");
            setAiInsights(null); // Reset to ensure fresh evaluation
          }}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center space-x-2 ${
            activeTab === "notes" ? "bg-indigo-600 text-white shadow-2xs" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Clinical Logs ({patient.clinicalEntries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("appointments")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center space-x-2 ${
            activeTab === "appointments" ? "bg-indigo-600 text-white shadow-2xs" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>Appointments ({patient.appointments.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("ai");
            if (!aiInsights) fetchAiInsights();
          }}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center space-x-2 ${
            activeTab === "ai" ? "bg-slate-900 text-indigo-300 border border-slate-800 shadow-md" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
          <span>Clinical AI Assistant</span>
        </button>

        <button
          id="tab-btn-recordings"
          onClick={() => setActiveTab("recordings")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center space-x-2 ${
            activeTab === "recordings" ? "bg-indigo-600 text-white shadow-2xs" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <Mic className="h-3.5 w-3.5" />
          <span>Consultations ({ (patient.recordedConversations || []).length })</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div id="tab-panels-viewport" className="flex-1">
        <AnimatePresence mode="wait">
          {/* Active Panel: Vitals */}
          {activeTab === "vitals" && (
            <motion.div
              key="vitals-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Physical Vital Logs</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Chronological record of cardiac, pulmonary, and temperature baselines.</p>
                </div>
                <button
                  id="open-vitals-form-btn"
                  onClick={() => setShowVitalForm(!showVitalForm)}
                  className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-150 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Record Vitals</span>
                </button>
              </div>

              {/* Record Vitals Panel/Form */}
              {showVitalForm && (
                <motion.form
                  onSubmit={handleVitalSubmit}
                  id="log-vitals-inline-form"
                  className="bg-indigo-50/40 p-5 rounded-2xl border border-indigo-100 grid grid-cols-2 md:grid-cols-6 gap-4"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="col-span-2 md:col-span-6 font-semibold text-slate-700 text-xs uppercase tracking-wider border-b border-indigo-100/50 pb-2">
                    Enter physical check-up metrics
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Heart Pulse (bpm)</label>
                    <input
                      type="number"
                      required
                      value={hr}
                      onChange={(e) => setHr(e.target.value)}
                      className="w-full bg-white border border-indigo-100 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-700 text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">BP Systolic</label>
                    <input
                      type="number"
                      required
                      value={sys}
                      onChange={(e) => setSys(e.target.value)}
                      className="w-full bg-white border border-indigo-100 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-700 text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">BP Diastolic</label>
                    <input
                      type="number"
                      required
                      value={dia}
                      onChange={(e) => setDia(e.target.value)}
                      className="w-full bg-white border border-indigo-100 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-700 text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Temp (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={temp}
                      onChange={(e) => setTemp(e.target.value)}
                      className="w-full bg-white border border-indigo-100 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-700 text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Resp. Rate</label>
                    <input
                      type="number"
                      required
                      value={resp}
                      onChange={(e) => setResp(e.target.value)}
                      className="w-full bg-white border border-indigo-100 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-700 text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">SpO₂ (%)</label>
                    <input
                      type="number"
                      required
                      value={spo2}
                      onChange={(e) => setSpo2(e.target.value)}
                      className="w-full bg-white border border-indigo-100 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-700 text-center"
                    />
                  </div>
                  <div className="col-span-2 md:col-span-6 flex items-center justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowVitalForm(false)}
                      className="px-3.5 py-1.5 hover:bg-slate-100 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 bg-white"
                    >
                      Cancel
                    </button>
                    <button
                      id="save-vitals"
                      type="submit"
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 font-semibold text-white text-xs rounded-lg shadow-sm"
                    >
                      Log Indicators
                    </button>
                  </div>
                </motion.form>
              )}

              {/* Vital charts and table listings */}
              <VitalCharts vitals={patient.vitals} />

              <div id="vitals-table-log" className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-100">
                      <th className="p-3.5">Logged Time</th>
                      <th className="p-3.5 text-center">BP (mmHg)</th>
                      <th className="p-3.5 text-center">Heart Rate</th>
                      <th className="p-3.5 text-center">Temp (°C)</th>
                      <th className="p-3.5 text-center">SpO₂</th>
                      <th className="p-3.5 text-center">Respiration</th>
                      <th className="p-3.5 text-right">Nurse / Log</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-sans">
                    {patient.vitals.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/50">
                        <td className="p-3.5 font-medium">{new Date(v.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                        <td className="p-3.5 text-center font-bold text-indigo-700">{v.systolic}/{v.diastolic}</td>
                        <td className="p-3.5 text-center font-medium">{v.heartRate} bpm</td>
                        <td className="p-3.5 text-center">{v.temperature}°C</td>
                        <td className="p-3.5 text-center"><span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">{v.spo2}%</span></td>
                        <td className="p-3.5 text-center">{v.respiratoryRate}/min</td>
                        <td className="p-3.5 text-right text-slate-400 font-medium">{v.loggedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Active Panel: Demographics */}
          {activeTab === "demographics" && (
            <motion.div
              key="demographics-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-6 animate-fade-in"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                    <User className="h-5 w-5 text-indigo-600" />
                    <span>Patient Profile & Demographic Identity Records</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Verified state-stored documentation for clinical admissions and emergency contact registry.</p>
                </div>
                <div className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-200">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Secure Local Database</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. Personal Identity */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-4">
                  <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                    <div className="h-6 w-6 rounded-md bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <User className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Personal Identity Information</span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Full Legal Name</span>
                      <span className="text-sm font-bold text-slate-800">{patient.name}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Date of Birth</span>
                        <span className="text-xs font-semibold text-slate-700">{patient.dateOfBirth || "1988-10-24"}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Evaluated Age</span>
                        <span className="text-xs font-semibold text-slate-700">{patient.age} years old</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Gender Identity</span>
                        <span className="text-xs font-semibold text-slate-700">{patient.gender}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Blood Group type</span>
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50/60 px-2 py-0.5 rounded-md border border-indigo-100/50 inline-block">{patient.bloodType}</span>
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Patient Email</span>
                      <span className="text-xs font-semibold text-slate-700 break-all">{patient.email}</span>
                    </div>

                    <div className="pt-2">
                      <div className="p-3 bg-indigo-50/30 rounded-xl border border-indigo-100/40 flex items-start space-x-2.5">
                        <Lock className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-slate-400 leading-normal">
                          Protected Health Information (PHI) compliant under standard secure memory sandbox guidelines. Access logs recorded.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Contact & Administrative Details */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-4">
                  <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                    <div className="h-6 w-6 rounded-md bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Home className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Contact & Home Coordinates</span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Residential Home Address</span>
                      <span className="text-xs font-medium text-slate-700 block leading-relaxed">
                        {patient.address || "120 Commonwealth Ave, Boston, MA 02116"}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Direct Direct Phone</span>
                      <span className="text-xs font-semibold text-slate-700 flex items-center mt-0.5">
                        <Phone className="h-3 w-3 mr-1.5 text-slate-400" />
                        {patient.contact}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Attending Clinic Doctor</span>
                      <span className="text-xs font-semibold text-slate-700 block mt-0.5">{patient.primaryDoctor}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Clinic Status</span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full inline-block mt-1 border
                          ${patient.status === "Admitted" ? "bg-rose-50 text-rose-700 border-rose-100" : ""}
                          ${patient.status === "Observation" ? "bg-amber-50 text-amber-700 border-amber-100" : ""}
                          ${patient.status === "Outpatient" ? "bg-indigo-50 text-indigo-700 border-indigo-100" : ""}
                          ${patient.status === "Discharged" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : ""}
                        `}>
                          {patient.status}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Medical File ID</span>
                        <span className="text-xs font-mono font-medium text-slate-500 block mt-1">{patient.id}</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="p-3 bg-indigo-50/20 rounded-xl border border-indigo-100/30">
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Administrative Alert</span>
                        <p className="text-[10px] text-slate-500 leading-normal">
                          For address updates or location change requests, please launch the register/update modifier panel on the patient registry.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Emergency Contact File */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-4">
                  <div className="flex items-center space-x-2 border-b border-rose-100 pb-2">
                    <div className="h-6 w-6 rounded-md bg-rose-50 flex items-center justify-center text-rose-600">
                      <HeartPulse className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Emergency Contacts</span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-rose-400 tracking-wider">Designated Emergency Contact</span>
                      <span className="text-sm font-bold text-slate-800 block mt-0.5">
                        {patient.emergencyContactName || "Gordon Vance"}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Emergency Contact Phone</span>
                      <span className="text-xs font-bold text-rose-600 flex items-center mt-1">
                        <Phone className="h-3 w-3 mr-1.5 text-rose-400" />
                        {patient.emergencyContactPhone || "+1 (555) 723-9092"}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Relationship to Patient</span>
                      <span className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded-md inline-block mt-1">
                        {patient.emergencyContactRelationship || "Spouse"}
                      </span>
                    </div>

                    <hr className="border-slate-100" />

                    <div className="bg-rose-50/20 border border-rose-100 p-3 rounded-xl">
                      <span className="block text-[9px] font-bold text-rose-700 uppercase tracking-widest mb-1">Anaphylaxis & Allergies</span>
                      <p className="text-xs font-bold text-rose-600 leading-relaxed">
                        {patient.allergies || "No Known Drug Allergies (NKDA)"}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150 flex items-center space-x-2">
                      <Info className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <p className="text-[9px] text-slate-400">
                        Always check secondary emergency files prior to surgery or systemic infusion.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* Active Panel: Clinical Logs */}
          {activeTab === "notes" && (
            <motion.div
              key="notes-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Clinical Logs & Diagnostic Records</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Historical logs on symptoms, care plans, and drug regimens recorded by clinical personnel.</p>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    id="generate-notes-insight-btn"
                    onClick={fetchNotesInsight}
                    disabled={isGeneratingNotesInsight}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer border border-indigo-550 shadow-2xs hover:shadow-xs active:scale-95 text-nowrap"
                  >
                    <Sparkles className={`h-3.5 w-3.5 ${isGeneratingNotesInsight ? "animate-spin" : "animate-pulse"}`} />
                    <span>{isGeneratingNotesInsight ? "Synthesizing Insight..." : "Generate Diagnostic Insight"}</span>
                  </button>
                  <button
                    id="open-clinical-form-btn"
                    onClick={() => setShowLogForm(!showLogForm)}
                    className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-150 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer text-nowrap"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>New Visit Entry</span>
                  </button>
                </div>
              </div>

              {/* AI diagnostic notes insight box */}
              {(notesInsight || isGeneratingNotesInsight || notesInsightError) && (
                <div id="notes-ai-insight-box" className="bg-gradient-to-br from-slate-900 to-indigo-950 text-slate-100 p-5 rounded-2xl border border-indigo-900/40 shadow-xs space-y-3.5 animate-fade-in relative overflow-hidden">
                  {/* Glowing ambient background circle inside card */}
                  <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
                  
                  <div className="flex items-center justify-between border-b border-indigo-900/60 pb-2.5 relative z-10">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="h-4 w-4 text-indigo-400 animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-wider font-mono text-indigo-200">AI Diagnostic Observation</span>
                    </div>
                    {notesInsight && (
                      <button
                        onClick={() => {
                          setNotesInsight("");
                          setNotesInsightError("");
                        }}
                        className="text-[10px] uppercase font-bold tracking-wider text-slate-400 hover:text-slate-200 transition-colors cursor-pointer px-2 py-0.5 rounded bg-slate-800 border border-slate-700"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>

                  {isGeneratingNotesInsight ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-3">
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full border-2 border-indigo-800 animate-pulse"></div>
                        <Activity className="h-5 w-5 text-indigo-400 absolute inset-0 m-auto animate-bounce" />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold font-mono tracking-wide text-indigo-300">Evaluating clinical timeline...</p>
                        <p className="text-[10px] text-slate-400 max-w-xs mt-0.5">Analysing historical clinical encounters, trends in symptoms, and vital sign correlations...</p>
                      </div>
                    </div>
                  ) : notesInsightError ? (
                    <div className="p-3.5 bg-rose-950/40 border border-rose-900/60 rounded-xl flex items-start space-x-2.5">
                      <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-rose-300 tracking-wider">Analysis Failure</span>
                        <p className="text-xs text-slate-300 mt-0.5 leading-normal">{notesInsightError}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative z-15 bg-slate-950/45 p-4 rounded-xl border border-indigo-950/40 max-h-[400px] overflow-y-auto custom-scrollbar">
                      {renderInsightMarkdown(notesInsight)}
                    </div>
                  )}

                  {!isGeneratingNotesInsight && !notesInsightError && (
                    <div className="flex items-center space-x-1.5 text-[9px] text-indigo-300 font-mono font-medium">
                      <ShieldCheck className="h-3.5 w-3.5 text-indigo-400 shrink-0 animate-pulse" />
                      <span>Confidential diagnostic observation. Intended for healthcare practitioner evaluation.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Visit Entry Form */}
              {showLogForm && (
                <motion.form
                  onSubmit={handleClinicalSubmit}
                  id="clinical-inline-form"
                  className="bg-indigo-50/40 p-5 rounded-2xl border border-indigo-100 space-y-4"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="font-semibold text-slate-700 text-xs uppercase tracking-wider border-b border-indigo-100/50 pb-2 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <BriefcaseMedical className="h-4 w-4 text-indigo-600" />
                      <span>Create new clinical visit record</span>
                    </div>
                    <div className="flex items-center space-x-1 text-indigo-600 text-[10px] font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                      <Mic className="h-3 w-3 animate-pulse" />
                      <span>Speech Scribe Enabled</span>
                    </div>
                  </div>

                  {/* Voice Transcription Scribe Assistant Component */}
                  <div id="vocal-scribe-console" className="bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Mic className="h-4 w-4 text-indigo-400" />
                        <span className="text-xs font-bold uppercase tracking-wider font-mono">Voice Consultation Scribe</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {isRecording && (
                          <span className="flex items-center space-x-1 text-xs text-rose-400 bg-rose-950/40 px-2.5 py-0.5 rounded-full font-mono font-bold animate-pulse">
                            <span className="h-2 w-2 rounded-full bg-rose-500 mr-1 shrink-0 animate-ping"></span>
                            <span>MIC RECORDING ACTIVE...</span>
                          </span>
                        )}
                        {!isRecording && voiceTranscript && (
                          <span className="text-[10px] text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded-full font-mono font-bold">
                            SPEECH RECORDED
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 leading-normal font-sans">
                      Doctors can record live conversation during the consultation. Alternatively, click <strong className="text-indigo-300">Simulate Consultation Speech</strong> to load simulated dialogues, then hit <strong className="text-indigo-300">⚡ Fill Form Details via AI</strong> to populate the medical records automatically using Gemini.
                    </p>

                    {/* Interactive Voice Scribe control buttons */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {isRecording ? (
                        <button
                          type="button"
                          onClick={handleStopRecording}
                          className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl flex items-center space-x-1.5 transition-all shadow-xs shrink-0 cursor-pointer"
                        >
                          <MicOff className="h-3.5 w-3.5" />
                          <span>Stop Recording</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleStartRecording}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl flex items-center space-x-1.5 transition-all shadow-xs shrink-0 cursor-pointer"
                        >
                          <Mic className="h-3.5 w-3.5" />
                          <span>Start consultation Voice Recording</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleSimulateSpeech}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-750 font-semibold text-xs rounded-xl flex items-center space-x-1.5 transition-all shrink-0 cursor-pointer"
                      >
                        <Volume2 className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Simulate Consultation Speech</span>
                      </button>

                      <button
                        type="button"
                        disabled={!voiceTranscript || isTranscribeExtracting}
                        onClick={handleExtractTranscript}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl flex items-center space-x-1.5 transition-all shrink-0 cursor-pointer ml-auto shadow-sm tracking-wide"
                      >
                        {isTranscribeExtracting ? (
                          <Wand2 className="h-3.5 w-3.5 animate-spin text-slate-100" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5 text-white animate-pulse" />
                        )}
                        <span>{isTranscribeExtracting ? "Extracting Clinical Data..." : "⚡ Fill Form Details via AI"}</span>
                      </button>
                    </div>

                    {/* Live Transcription box */}
                    <div className="bg-slate-950 p-4.5 rounded-xl border border-slate-850 space-y-2">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider pb-1 border-b border-slate-900">
                        <span>Verbal Dictation Transcript Logs</span>
                        <span>{voiceTranscript.split(/\s+/).filter(Boolean).length} words</span>
                      </div>
                      <textarea
                        rows={3}
                        value={voiceTranscript}
                        onChange={(e) => setVoiceTranscript(e.target.value)}
                        placeholder="Live vocal transcription will generate here as you speak. You can also edit this text manually before invoking the AI parsing..."
                        className="w-full bg-transparent text-xs text-slate-200 resize-none focus:outline-hidden leading-relaxed font-sans"
                      />
                    </div>

                    {/* Dynamic message logs */}
                    {transcribeMessage && (
                      <div className={`p-3 rounded-lg text-xs leading-normal font-sans font-medium flex items-start space-x-2 border
                        ${transcribeMessage.includes("Successfully") || transcribeMessage.includes("simulated")
                          ? "bg-emerald-950/30 text-emerald-400 border-emerald-900/40"
                          : "bg-amber-950/30 text-amber-400 border-amber-950"
                        }
                      `}>
                        <Info className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{transcribeMessage}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Reason for Visit / Main Symptom *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Hypertension review, asthma acute follow-up"
                        value={visitReason}
                        onChange={(e) => setVisitReason(e.target.value)}
                        className="w-full bg-white border border-indigo-100 rounded-lg px-3 py-2 text-sm text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Attending Clinician</label>
                      <input
                        type="text"
                        value={attendingDoc}
                        onChange={(e) => setAttendingDoc(e.target.value)}
                        className="w-full bg-white border border-indigo-100 rounded-lg px-3 py-2 text-sm text-slate-800 font-medium"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Physician Assessment Findings & Observations *</label>
                      <textarea
                        rows={3}
                        required
                        placeholder="Detail cardiopulmonary sounds, patient description, and physical evaluation..."
                        value={assessment}
                        onChange={(e) => setAssessment(e.target.value)}
                        className="w-full bg-white border border-indigo-100 rounded-lg px-3 py-2 text-sm text-slate-800"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Prescribed Care Plan & Treatments</label>
                      <textarea
                        rows={2}
                        placeholder="Detail medicinal dosing adjustments, secondary tests, referrals or self-monitoring targets..."
                        value={treatment}
                        onChange={(e) => setTreatment(e.target.value)}
                        className="w-full bg-white border border-indigo-100 rounded-lg px-3 py-2 text-sm text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-2 border-t border-indigo-100/40">
                    <button
                      type="button"
                      onClick={() => setShowLogForm(false)}
                      className="px-3.5 py-1.5 hover:bg-slate-100 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 bg-white"
                    >
                      Cancel
                    </button>
                    <button
                      id="save-clinical-log"
                      type="submit"
                      className="px-4.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 font-semibold text-white text-xs rounded-lg shadow-sm"
                    >
                      Save Clinical Log
                    </button>
                  </div>
                </motion.form>
              )}

              {/* Timeline list */}
              <div id="clinical-records-timeline" className="space-y-4">
                {patient.clinicalEntries.length === 0 ? (
                  <div className="text-center p-10 bg-white rounded-xl border border-slate-100 text-slate-400 text-xs">
                    No clinical evaluation records logged on patient file.
                  </div>
                ) : (
                  patient.clinicalEntries.map((entry, index) => (
                    <div key={entry.id} className="bg-white p-5 rounded-xl border border-slate-100 shadow-3xs hover:border-slate-200 transition-all flex items-start space-x-4">
                      <div className="p-2.5 bg-slate-50 border border-slate-150 rounded-xl text-slate-500 hidden sm:block">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                          <h4 className="text-sm font-bold text-slate-850">{entry.reason}</h4>
                          <span className="text-[10px] font-mono text-slate-400 font-medium">
                            {new Date(entry.timestamp).toLocaleString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                          <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100/50">
                            <span className="block font-bold text-slate-500 uppercase tracking-widest text-[9px] mb-1">Assessment</span>
                            <p className="text-slate-750 font-medium leading-relaxed">{entry.assessment}</p>
                          </div>
                          <div className="bg-green-50/20 p-3 rounded-lg border border-green-100/30">
                            <span className="block font-bold text-emerald-600 uppercase tracking-widest text-[9px] mb-1">Treatment & Rx Regimen</span>
                            <p className="text-slate-750 font-medium leading-relaxed">{entry.treatment}</p>
                          </div>
                        </div>

                        <div className="flex items-center text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-400 mr-1.5"></span>
                          <span>Attending: {entry.doctor}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* Active Panel: Appointments list */}
          {activeTab === "appointments" && (
            <motion.div
              key="appointments-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Clinic Visitation Schedules</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Schedule post-discharge reviews, dialysis, or diagnostic checks.</p>
                </div>
                <button
                  id="open-app-form-btn"
                  onClick={() => setShowAppForm(!showAppForm)}
                  className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-150 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Book Visit</span>
                </button>
              </div>

              {/* Book Appointment Inline Form */}
              {showAppForm && (
                <motion.form
                  onSubmit={handleAppSubmit}
                  id="appointment-inline-form"
                  className="bg-indigo-50/40 p-5 rounded-2xl border border-indigo-100 grid grid-cols-1 md:grid-cols-4 gap-4"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="md:col-span-4 font-semibold text-slate-700 text-xs uppercase tracking-wider border-b border-indigo-100/50 pb-2">
                    Schedule Physician Consultation
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-605 mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      value={appDate}
                      onChange={(e) => setAppDate(e.target.value)}
                      className="w-full bg-white border border-indigo-100 rounded-lg px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-605 mb-1">Time *</label>
                    <input
                      type="text"
                      placeholder="e.g. 10:15 AM"
                      required
                      value={appTime}
                      onChange={(e) => setAppTime(e.target.value)}
                      className="w-full bg-white border border-indigo-100 rounded-lg px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-605 mb-1">Consultant Physician</label>
                    <input
                      type="text"
                      value={appDoc}
                      onChange={(e) => setAppDoc(e.target.value)}
                      className="w-full bg-white border border-indigo-100 rounded-lg px-3 py-2 text-sm text-slate-800 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-605 mb-1">Reason for consultation *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Diabetes check, dosage adjustment"
                      value={appReason}
                      onChange={(e) => setAppReason(e.target.value)}
                      className="w-full bg-white border border-indigo-100 rounded-lg px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                  <div className="md:col-span-4 flex items-center justify-end space-x-2 pt-2 border-t border-indigo-100/40">
                    <button
                      type="button"
                      onClick={() => setShowAppForm(false)}
                      className="px-3.5 py-1.5 hover:bg-slate-100 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 bg-white"
                    >
                      Cancel
                    </button>
                    <button
                      id="save-appointment"
                      type="submit"
                      className="px-4.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 font-semibold text-white text-xs rounded-lg shadow-sm"
                    >
                      Confirm Booking
                    </button>
                  </div>
                </motion.form>
              )}

              {/* Consultation Agenda */}
              <div id="visiting-agenda-grid" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {patient.appointments.length === 0 ? (
                  <div className="col-span-2 text-center p-10 bg-white rounded-xl border border-slate-100 text-slate-400 text-xs">
                    No active clinic visations programmed on schedule.
                  </div>
                ) : (
                  patient.appointments.map((app) => (
                    <div id={`app-card-${app.id}`} key={app.id} className="bg-white p-4.5 rounded-xl border border-slate-100 hover:border-slate-200 shadow-2xs flex justify-between items-center">
                      <div className="flex items-center space-x-3.5">
                        <div className="p-3 bg-indigo-50/50 text-indigo-600 rounded-lg">
                          <Calendar className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">{app.reason}</h4>
                          <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5 font-medium">
                            <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> {app.date} • {app.time}</span>
                            <span>•</span>
                            <span className="text-slate-500">{app.doctor}</span>
                          </div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-semibold text-[10px] rounded-full uppercase tracking-wider">
                        {app.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* Active Panel: AI Assitant Insights */}
          {activeTab === "ai" && (
            <motion.div
              key="ai-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <div className="flex items-flex-start sm:items-center justify-between flex-col sm:flex-row gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-5 w-5 text-indigo-600 animate-pulse" />
                    <h3 className="text-base font-bold text-slate-800">Attendant Clinic AI Engine</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Analytic summary from patient diagnostics and real-time physical logs.</p>
                </div>
                <button
                  id="reanalyze-ai-btn"
                  disabled={isAiLoading}
                  onClick={fetchAiInsights}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 text-indigo-200 rounded-xl text-xs font-semibold flex items-center space-x-2 hover:bg-slate-800 active:scale-95 disabled:opacity-50 transition-all font-mono"
                >
                  <Sparkles className={`h-3.5 w-3.5 text-indigo-400 ${isAiLoading ? "animate-spin" : "animate-pulse"}`} />
                  <span>{isAiLoading ? "Processing Records..." : "Re-Analyze Ledger"}</span>
                </button>
              </div>

              {isAiLoading ? (
                <div id="ai-loading-screen" className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-slate-100/50 space-y-4">
                  <div className="relative flex items-center justify-center">
                    <div className="h-12 w-12 rounded-full border-4 border-indigo-100 animate-pulse"></div>
                    <Activity className="h-6 w-6 text-indigo-600 absolute animate-bounce" />
                  </div>
                  <div className="text-center">
                    <h4 className="text-sm font-bold text-slate-800 font-sans">Synthesizing clinical variables...</h4>
                    <p className="text-xs text-slate-400 max-w-sm mt-1 mx-auto leading-relaxed">
                      Gemini is auditing telemetry data, cross-checking symptoms, previous allergies, and recent blood pressure trends.
                    </p>
                  </div>
                </div>
              ) : aiInsights ? (
                <div id="ai-insights-rendered" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Visual Status Indicator & Summary */}
                  <div className="lg:col-span-3 bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-lg flex flex-col md:flex-row gap-6 items-start">
                    
                    {/* Status Rounder Badge */}
                    <div className="flex flex-col items-center self-stretch justify-center px-6 py-4 rounded-xl border border-slate-800 bg-slate-950/40 text-center min-w-[150px]">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">Status Factor</span>
                      <span className={`text-2xl font-black uppercase mt-1 tracking-wider font-mono
                        ${aiInsights.status === "stable" ? "text-emerald-400" : ""}
                        ${aiInsights.status === "observation" ? "text-amber-400 animate-pulse" : ""}
                        ${aiInsights.status === "warning" ? "text-rose-400 animate-bounce" : ""}
                      `}>
                        {aiInsights.status}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono mt-1">AI Evaluated</span>
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2 text-indigo-400 text-xs font-mono font-bold uppercase tracking-widest">
                        <MessageSquare className="h-4 w-4" />
                        <span>Executive Summary Dossier</span>
                      </div>
                      <p className="font-sans text-sm font-medium leading-relaxed text-slate-300">
                        {aiInsights.summary}
                      </p>
                    </div>
                  </div>

                  {/* Left: Critical Warnings & Clinical Care Plan */}
                  <div className="lg:col-span-2 space-y-6">
                    
                    {/* Warnings List */}
                    {aiInsights.warnings && aiInsights.warnings.length > 0 && (
                      <div id="ai-warnings" className="bg-rose-50/10 border border-rose-100 p-5 rounded-2xl space-y-3">
                        <div className="flex items-center space-x-2 text-rose-600">
                          <AlertTriangle className="h-4 w-4" />
                          <h4 className="text-xs font-bold uppercase tracking-wider font-mono">Systemic Warning Signs</h4>
                        </div>
                        <ul className="space-y-2 text-xs font-sans text-slate-700 font-medium">
                          {aiInsights.warnings.map((warn, i) => (
                            <li key={i} className="flex items-start space-x-2">
                              <span className="text-rose-500 mt-0.5">•</span>
                              <span className="leading-normal">{warn}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Sequential Treatment Plan */}
                    <div id="ai-treatment-plan" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-4">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono border-b border-slate-100 pb-2">Targeted Action Plan</h4>
                      <div className="space-y-3">
                        {aiInsights.plan && aiInsights.plan.map((item, i) => (
                          <div key={i} className="flex items-start space-x-3 text-xs font-sans">
                            <span className="h-5 w-5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold font-mono text-[10px] shrink-0">
                              {i + 1}
                            </span>
                            <p className="text-slate-750 font-medium pt-0.5 leading-relaxed">{item}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Recommendations & Clarification Questions */}
                  <div className="space-y-6">
                    
                    {/* Recommended Actions */}
                    <div id="ai-recommendations" className="bg-indigo-50/20 border border-slate-100 p-5 rounded-2xl space-y-4">
                      <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-widest font-mono border-b border-indigo-100 pb-2">Physician Directives</h4>
                      <ul className="space-y-3 font-sans text-xs text-slate-700 font-medium">
                        {aiInsights.recommendations && aiInsights.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start space-x-2.5">
                            <ChevronsRight className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Patient Questions */}
                    <div id="ai-questions-to-ask" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-4">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono border-b border-slate-100 pb-2">Clarification Questions</h4>
                      <div className="space-y-3 text-xs font-sans text-slate-700 font-medium">
                        {aiInsights.questions && aiInsights.questions.map((q, i) => (
                          <div key={i} className="flex items-start space-x-2">
                            <span className="text-slate-400 font-mono">Q:</span>
                            <p className="italic leading-normal text-slate-700 font-medium">{q}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                </div>
              ) : (
                <div id="ai-empty-trigger" className="text-center p-12 bg-white rounded-2xl border border-slate-100 space-y-3">
                  <Sparkles className="h-8 w-8 text-indigo-500 mx-auto animate-bounce" />
                  <h4 className="text-sm font-bold text-slate-800">Active AI Assessment Available</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Trigger a Gemini clinical evaluation to consolidate vitals data, previous allergy exceptions, and suggest next care routines instantly.
                  </p>
                  <button
                    onClick={fetchAiInsights}
                    className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-colors inline-block"
                  >
                    Analyze Now
                  </button>
                </div>
              )}

              {/* Status Note */}
              <div id="ai-key-advice" className="flex items-center space-x-2.5 p-3.5 bg-slate-100/50 rounded-xl border border-slate-200/50">
                <AlertCircle className="h-4 w-4 text-slate-400 shrink-0" />
                <p className="text-[10px] text-slate-400 leading-normal font-sans font-semibold uppercase tracking-wider">
                  Clinic assistant telemetry notice: AI summaries offer helpful supporting guidelines. Attending staff must execute final clinical diagnostics and peer review.
                </p>
              </div>
            </motion.div>
          )}

          {/* Active Panel: Recorded Conversations & Consultations */}
          {activeTab === "recordings" && (
            <motion.div
              key="recordings-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <Mic className="h-5 w-5 text-indigo-600" />
                    <h3 className="text-base font-bold text-slate-800">Recorded Consultation Logbook</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live consultation audio scribing and running chronologically recorded verbal records with {patient.primaryDoctor}.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] bg-indigo-50 border border-indigo-100/60 px-2.5 py-1 rounded-full text-indigo-700 font-bold uppercase tracking-wider">
                    Assigned Physician: {patient.primaryDoctor}
                  </span>
                </div>
              </div>

              {/* Consultation Scribe Input Panel */}
              <div id="recording-voice-scribe-container" className="bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></div>
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">Consultation Dictation Scribe</span>
                  </div>
                  {isConsultRecording && (
                    <span className="flex items-center space-x-1.5 text-[10px] text-rose-400 bg-rose-950/50 px-2.5 py-0.5 rounded-full font-mono font-bold animate-pulse">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0"></span>
                      <span>RECORDING CLINICAL INTERACTION...</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Use the microphone to record live patient-physician dialogue, or select <span className="text-indigo-300 font-semibold cursor-pointer underline decoration-dotted" onClick={handleSimulateConsultationSpeech}>Simulate Conversation Tape</span> to load a highly accurate structured dialogue conversation with {patient.primaryDoctor}.
                </p>

                {/* Buttons controls */}
                <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-800 pt-3">
                  {isConsultRecording ? (
                    <button
                      type="button"
                      onClick={handleStopConsultRecording}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl flex items-center space-x-1.5 transition-all shadow-xs shrink-0 cursor-pointer"
                    >
                      <MicOff className="h-3.5 w-3.5" />
                      <span>Stop Recorder</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStartConsultRecording}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl flex items-center space-x-1.5 transition-all shadow-xs shrink-0 cursor-pointer"
                    >
                      <Mic className="h-3.5 w-3.5" />
                      <span>Start Voice Recorder</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleSimulateConsultationSpeech}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-750 font-semibold text-xs rounded-xl flex items-center space-x-1.5 transition-all shrink-0 cursor-pointer"
                  >
                    <Volume2 className="h-3.5 w-3.5 text-indigo-400 font-bold" />
                    <span>Simulate Conversation Tape</span>
                  </button>

                  <button
                    type="button"
                    disabled={!consultTranscript.trim()}
                    onClick={handleSaveConsultation}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl flex items-center space-x-1.5 transition-all shrink-0 cursor-pointer ml-auto shadow-sm tracking-wide"
                  >
                    <span>💾 Save Dialogue Record</span>
                  </button>
                </div>

                {/* Current live translation window */}
                <div className="bg-slate-950 p-4.5 rounded-xl border border-slate-850 space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider pb-1 border-b border-slate-900">
                    <span>Encounter Dialect Transcript Scribe</span>
                    <span>{consultTranscript.split(/\s+/).filter(Boolean).length} words</span>
                  </div>
                  <textarea
                    rows={3}
                    value={consultTranscript}
                    onChange={(e) => setConsultTranscript(e.target.value)}
                    placeholder="Physical dictation feeds or simulated text dialogue will occupy this container. You can also edit these dialog notes manually before submitting to the patient history..."
                    className="w-full bg-transparent text-xs text-slate-200 resize-none focus:outline-hidden leading-relaxed font-sans"
                  />
                </div>

                {/* Alert/Status messaging */}
                {consultMessage && (
                  <div className={`p-3 rounded-lg text-xs leading-normal font-sans font-medium flex items-start space-x-2 border
                    ${consultMessage.includes("✅") || consultMessage.includes("loaded")
                      ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/60"
                      : "bg-amber-950/40 text-amber-400 border-amber-900/40"
                    }
                  `}>
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{consultMessage}</span>
                  </div>
                )}
              </div>

              {/* Consultation Timeline List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 pl-1 border-b border-slate-200 pb-2">
                  <span>Recorded Consultation Archives ({ (patient.recordedConversations || []).length })</span>
                  <span>Audio Playback Status</span>
                </div>

                {(!patient.recordedConversations || patient.recordedConversations.length === 0) ? (
                  <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 text-slate-400 text-xs shadow-3xs space-y-2.5">
                    <Mic className="h-8 w-8 text-slate-300 mx-auto opacity-70" />
                    <div>
                      <h4 className="font-bold text-slate-700">No Dialogue Conversational Records Found</h4>
                      <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-1">Please start the recorder above or trigger a simulated chat log to document live clinical interactions with this patient.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {patient.recordedConversations.map((conv) => {
                      const isPlaying = playingId === conv.id;
                      return (
                        <div
                          key={conv.id}
                          className={`p-5 bg-white border rounded-2xl shadow-3xs hover:shadow-2xs transition-all space-y-4 border-l-4
                            ${conv.recordedBy === "Patient" ? "border-l-indigo-500" : "border-l-rose-500"}`}
                        >
                          {/* Recording Card Header */}
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full
                                  ${conv.recordedBy === "Patient" 
                                    ? "bg-indigo-50 text-indigo-700 border border-indigo-150" 
                                    : "bg-rose-50 text-rose-700 border border-rose-150"}`}
                                >
                                  Logged By: {conv.recordedBy === "Patient" ? "Patient Portal" : "Clinical Staff"}
                                </span>
                                <span className="text-[11px] text-slate-400">•</span>
                                <span className="text-[11px] text-slate-400 font-mono font-bold uppercase tracking-wider">{conv.id}</span>
                              </div>
                              <div className="text-xs text-slate-500 flex items-center space-x-2 font-medium">
                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                <span>{new Date(conv.timestamp).toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" })}</span>
                                <span>•</span>
                                <span>Attendant Doc: {conv.doctorName}</span>
                              </div>
                            </div>

                            {/* Playback controls & Animated Equalizer Waves */}
                            <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200/80 p-2 rounded-xl shrink-0">
                              {isPlaying && (
                                <div className="flex items-end gap-[1.5px] h-4.5 px-2.5">
                                  {/* Beautiful pulse active waveform waves */}
                                  {[1, 2, 3, 4, 5, 4, 3, 2].map((val, idx) => (
                                    <div
                                      key={idx}
                                      className="w-[2.5px] bg-indigo-600 rounded-full shrink-0"
                                      style={{
                                        height: isPlaying ? "100%" : "20%",
                                        animation: isPlaying ? `pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite` : undefined,
                                        animationDelay: `${idx * 0.15}s`
                                      }}
                                    ></div>
                                  ))}
                                </div>
                              )}
                              
                              <button
                                onClick={() => setPlayingId(isPlaying ? null : conv.id)}
                                className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center space-x-1.5
                                  ${isPlaying 
                                    ? "bg-rose-100 text-rose-700 hover:bg-rose-200" 
                                    : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700"}`}
                              >
                                {isPlaying ? (
                                  <>
                                    <MicOff className="h-3 w-3" />
                                    <span>Stop Play</span>
                                  </>
                                ) : (
                                  <>
                                    <Volume2 className="h-3 w-3 animate-pulse" />
                                    <span>Play Call Tape ({conv.audioDurationSeconds || 32}s)</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Render dialog bubbles */}
                          <div className="pt-2 border-t border-slate-100 space-y-2">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono block">Encounter Dialect Transcript:</span>
                            {formatDialogue(conv.transcript)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
}
