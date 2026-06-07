import React, { useState, useEffect } from "react";
import { X, UserPlus, Mic, MicOff, Sparkles, Loader2, RefreshCw, AlertCircle, Check, Play, Trash2, ShieldAlert, CreditCard, QrCode, Building, CheckCircle2, XCircle, Wallet } from "lucide-react";
import { motion } from "motion/react";
import { Patient, ClinicalEntry, Doctor } from "../types";

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (patient: Omit<Patient, "vitals" | "clinicalEntries" | "appointments"> & { initialClinicalEntries?: ClinicalEntry[] }) => void;
  doctors: Doctor[];
}

const PRESETS = [
  {
    title: "🫁 Asthma Preset",
    text: "Doctor: Welcome back candidate. How is your breathing today?\nPatient: Honestly, doctor, my chest has been feeling very tight and I have been having a severe dry cough, specifically at night. I can barely sleep and I am using my auxiliary rescue inhaler triple times a day now.\nDoctor: Understood. I can hear some faint wheezing in both lower lungs. I want you to start Albuterol treatment twice a day, keep hydrated, and avoid allergens."
  },
  {
    title: "❤️ Hypertension Preset",
    text: "Doctor: Hello Mr. John. Let's look at your cardiovascular and pressure readings.\nPatient: I have been experiencing some mild morning tension headaches. My blood pressure monitor at home shows systolic around one hundred and forty and diastolic around ninety-five.\nDoctor: That is definitely high. Your vascular tension is elevated. Let's start Lisinopril ten milligrams once daily in the mornings and keep a daily pressure log."
  },
  {
    title: "🩹 Post-Op Joint Evaluation",
    text: "Doctor: Good afternoon. Let's look at your post-operative joint healing.\nPatient: The surgical incision on my left knee is healing nicely, but the pain is still quite sharp, around five out of ten when I attempt weight-bearing activities.\nDoctor: The wound looks clean with minimal inflammation. Let's do Acetaminophen 500mg as needed and start physical rehabilitation sessions next week."
  }
];

export default function RegisterModal({ isOpen, onClose, onRegister, doctors }: RegisterModalProps) {
  const [name, setName] = useState("");
  const [age, setAge] = useState<number>(35);
  const [gender, setGender] = useState<"Male" | "Female" | "Other">("Male");
  const [bloodType, setBloodType] = useState("O+");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [diagnoses, setDiagnoses] = useState("");
  const [status, setStatus] = useState<"Admitted" | "Outpatient" | "Discharged" | "Observation">("Outpatient");
  const [primaryDoctor, setPrimaryDoctor] = useState(doctors[0]?.name || "Dr. Sarah Jenkins");
  const [allergies, setAllergies] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (doctors && doctors.length > 0 && !doctors.some(d => d.name === primaryDoctor)) {
      setPrimaryDoctor(doctors[0].name);
    }
  }, [doctors]);

  const [dateOfBirth, setDateOfBirth] = useState("1990-01-01");
  const [address, setAddress] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [emergencyContactRelationship, setEmergencyContactRelationship] = useState("Spouse");

  const [registrationFee, setRegistrationFee] = useState("500");
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "Cash" | "Razorpay">("Razorpay");

  // Razorpay secure dynamic payment states
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [showSimulatedPortal, setShowSimulatedPortal] = useState(false);
  const [simulatedStep, setSimulatedStep] = useState<"select" | "processing" | "success" | "failed">("select");
  const [simulatedMethod, setSimulatedMethod] = useState<"card" | "upi" | "netbanking">("card");
  const [razorpayOrderId, setRazorpayOrderId] = useState("");
  const [razorpayKey, setRazorpayKey] = useState("");
  const [razorpayConfigIsMock, setRazorpayConfigIsMock] = useState(true);

  // Voice Scribe Consultation Scribe states
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognitionObj, setRecognitionObj] = useState<any>(null);
  
  // Extracted voice result properties
  const [hasScribeData, setHasScribeData] = useState(false);
  const [extractedReason, setExtractedReason] = useState("");
  const [extractedAssessment, setExtractedAssessment] = useState("");
  const [extractedTreatment, setExtractedTreatment] = useState("");
  const [isProcessingScribe, setIsProcessingScribe] = useState(false);
  const [scribeError, setScribeError] = useState("");

  if (!isOpen) return null;

  // Real Mic Recording Initiation
  const startRecording = () => {
    setScribeError("");
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setScribeError("Browser compatibility error: Web Speech API is not supported in this browser. Please use the direct Presets to simulate conversation.");
      return;
    }
    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";
      
      rec.onstart = () => {
        setIsRecording(true);
      };
      
      rec.onresult = (event: any) => {
        let currentResult = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentResult += event.results[i][0].transcript;
        }
        setTranscript(currentResult);
      };
      
      rec.onerror = (err: any) => {
        console.error("Speech recognition error:", err);
        if (err.error === "not-allowed") {
          setScribeError("Camera/Microphone permission was denied. Try simulating with direct presets.");
        } else {
          setScribeError(`Audio capture problem: ${err.error}`);
        }
        setIsRecording(false);
      };
      
      rec.onend = () => {
        setIsRecording(false);
      };
      
      rec.start();
      setRecognitionObj(rec);
    } catch (e) {
      console.error(e);
      setScribeError("Failed to initialize system microphone hardware.");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionObj) {
      try {
        recognitionObj.stop();
      } catch (err) {
        console.error(err);
      }
    }
    setIsRecording(false);
  };

  // Run the transcribe API model call
  const parseClinicalTranscript = async () => {
    if (!transcript.trim()) {
      setScribeError("Please record conversation or select an encounter preset first.");
      return;
    }

    setIsProcessingScribe(true);
    setScribeError("");
    try {
      const res = await fetch("/api/transcribe-clinical", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript })
      });

      if (!res.ok) {
        throw new Error("HTTP error with diagnosis transcriber. Review server.");
      }

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // We have extracted details!
      setExtractedReason(data.reason || "Clinical Consultation");
      setExtractedAssessment(data.assessment || "Assessment transcribed via live recording.");
      setExtractedTreatment(data.treatment || "General monitoring guidelines provided.");
      setHasScribeData(true);

      // Auto populate normal registration input boxes automatically!
      setDiagnoses(data.reason || "");
      
      let prefilledNotes = `[Extracted Physician Assessment]: ${data.assessment || "N/A"}\n[Extracted Care Plan & Treatment]: ${data.treatment || "N/A"}`;
      setNotes(prefilledNotes);

    } catch (err) {
      console.error(err);
      setScribeError(err instanceof Error ? err.message : "Failed to interpret acoustic records.");
    } finally {
      setIsProcessingScribe(false);
    }
  };

  const handleApplyPreset = (presetText: string) => {
    setTranscript(presetText);
    setScribeError("");
  };

  const handleClearScribe = () => {
    setTranscript("");
    setExtractedReason("");
    setExtractedAssessment("");
    setExtractedTreatment("");
    setHasScribeData(false);
    setScribeError("");
  };

  // Dynamic loading helper for the client-side Razorpay Javascript Checkout frame
  const loadRazorpayScript = () => {
    return new Promise<boolean>((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayAndRegister = async () => {
    setIsPaying(true);
    setPaymentError("");
    try {
      // Step 1: Create Order ID securely on Express server
      const res = await fetch("/api/payment/razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(registrationFee) || 0,
          currency: "INR",
          patientName: name
        })
      });

      if (!res.ok) {
        throw new Error("Could not construct Razorpay order ledger record on server.");
      }

      const orderData = await res.json();
      setRazorpayOrderId(orderData.id);

      // Step 2: Fetch Keys Config
      const configRes = await fetch("/api/payment/razorpay-config");
      const configData = await configRes.json();
      setRazorpayKey(configData.keyId);
      setRazorpayConfigIsMock(configData.isMock);

      // If keys are mock or missing, invoke our interactive in-app portal simulator
      if (configData.isMock) {
        setShowSimulatedPortal(true);
        setSimulatedStep("select");
        setIsPaying(false);
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        // Fallback to simulator if standard CDN file is blocked by browser policies
        setShowSimulatedPortal(true);
        setSimulatedStep("select");
        setIsPaying(false);
        return;
      }

      // Step 3: Launch authentic standard Razorpay Checkout window
      const options = {
        key: configData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Clinical Informatics Suite",
        description: `Patient Registration Fee: ${name}`,
        order_id: orderData.id,
        handler: async function (response: any) {
          try {
            setIsPaying(true);
            const verifyRes = await fetch("/api/payment/razorpay-verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            if (!verifyRes.ok) {
              throw new Error("Signature verification failed.");
            }

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              executeFinalRegistration(response.razorpay_payment_id || "pay_rzp_unknown");
            } else {
              setPaymentError("Gateway signature authenticity check rejected by server.");
            }
          } catch (err) {
            setPaymentError("Ledger secure callback check connection failure.");
          } finally {
            setIsPaying(false);
          }
        },
        prefill: {
          name: name,
          email: email || "patient@yourclinic.com",
          contact: contact || "9199999999"
        },
        notes: {
          patientName: name
        },
        theme: {
          color: "#4f46e5"
        },
        modal: {
          ondismiss: function () {
            setIsPaying(false);
          }
        }
      };

      const rzpInstance = new (window as any).Razorpay(options);
      rzpInstance.on("payment.failed", function (resp: any) {
        setPaymentError(`Transaction was not processed: ${resp.error.description}`);
        setIsPaying(false);
      });
      rzpInstance.open();
    } catch (err) {
      console.error(err);
      setPaymentError(err instanceof Error ? err.message : "Error initializing Razorpay Gateway payment flow.");
      setIsPaying(false);
    }
  };

  const executeFinalRegistration = (authorizedPaymentId: string) => {
    // Append transaction stamp details in notes
    const finalInvoiceStamp = `\n--- SECURE RAZORPAY BILLING LEDGER ---\n- Status: CAPTURED SUCCESSFUL\n- Merchant Key ID: ${razorpayKey || "Simulated Sandbox Key ID"}\n- Order Reference ID: ${razorpayOrderId}\n- Transaction Payment Reference ID: ${authorizedPaymentId}\n- Currency Unit Value: INR equivalent\n--------------------------------------\n`;
    
    const initialClinicalEntriesList: ClinicalEntry[] = hasScribeData ? [
      {
        id: "CLI-" + Math.floor(100 + Math.random() * 900),
        timestamp: new Date().toISOString(),
        reason: extractedReason,
        assessment: extractedAssessment,
        treatment: extractedTreatment,
        doctor: primaryDoctor
      }
    ] : [];

    onRegister({
      id: "PAT-" + Math.floor(100 + Math.random() * 900),
      name,
      age: Number(age),
      gender,
      bloodType,
      contact: contact || "N/A",
      email: email || "N/A",
      diagnoses: diagnoses || "Initial Admission",
      status,
      primaryDoctor,
      admissionDate: new Date().toISOString().split("T")[0],
      allergies: allergies || "None declared",
      notes: (notes ? notes + "\n" : "") + finalInvoiceStamp,
      dateOfBirth: dateOfBirth || "1990-01-01",
      address: address || "None declared",
      emergencyContactName: emergencyContactName || "None declared",
      emergencyContactPhone: emergencyContactPhone || "None declared",
      emergencyContactRelationship: emergencyContactRelationship || "N/A",
      registrationFee: Number(registrationFee) || 0,
      paymentMethod,
      initialClinicalEntries: initialClinicalEntriesList
    } as any);

    // Reset Form
    setName("");
    setAge(35);
    setGender("Male");
    setContact("");
    setEmail("");
    setDiagnoses("");
    setAllergies("");
    setNotes("");
    setDateOfBirth("1990-01-01");
    setAddress("");
    setEmergencyContactName("");
    setEmergencyContactPhone("");
    setEmergencyContactRelationship("Spouse");
    setRegistrationFee("500");
    setPaymentMethod("UPI");
    handleClearScribe();
    setShowSimulatedPortal(false);
    setIsPaying(false);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (paymentMethod === "Razorpay") {
      handlePayAndRegister();
    } else {
      // Normal Immediate registration without online gateway intercept
      const initialClinicalEntriesList: ClinicalEntry[] = hasScribeData ? [
        {
          id: "CLI-" + Math.floor(100 + Math.random() * 900),
          timestamp: new Date().toISOString(),
          reason: extractedReason,
          assessment: extractedAssessment,
          treatment: extractedTreatment,
          doctor: primaryDoctor
        }
      ] : [];

      onRegister({
        id: "PAT-" + Math.floor(100 + Math.random() * 900),
        name,
        age: Number(age),
        gender,
        bloodType,
        contact: contact || "N/A",
        email: email || "N/A",
        diagnoses: diagnoses || "Initial Admission",
        status,
        primaryDoctor,
        admissionDate: new Date().toISOString().split("T")[0],
        allergies: allergies || "None declared",
        notes: notes || "",
        dateOfBirth: dateOfBirth || "1990-01-01",
        address: address || "None declared",
        emergencyContactName: emergencyContactName || "None declared",
        emergencyContactPhone: emergencyContactPhone || "None declared",
        emergencyContactRelationship: emergencyContactRelationship || "N/A",
        registrationFee: Number(registrationFee) || 0,
        paymentMethod,
        initialClinicalEntries: initialClinicalEntriesList
      } as any);

      // Reset Form
      setName("");
      setAge(35);
      setGender("Male");
      setContact("");
      setEmail("");
      setDiagnoses("");
      setAllergies("");
      setNotes("");
      setDateOfBirth("1990-01-01");
      setAddress("");
      setEmergencyContactName("");
      setEmergencyContactPhone("");
      setEmergencyContactRelationship("Spouse");
      setRegistrationFee("500");
      setPaymentMethod("UPI");
      handleClearScribe();
      onClose();
    }
  };

  return (
    <div id="register-modal-backdrop" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <motion.div
        id="register-modal-content"
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", duration: 0.3 }}
      >
        {/* Header */}
        <div id="modal-header-section" className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2 text-indigo-700">
            <UserPlus className="h-5 w-5" />
            <h3 className="font-sans font-semibold text-lg text-slate-800">Register New Patient File</h3>
          </div>
          <button
            id="close-modal-button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} id="register-patient-form" className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div id="form-grid" className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
            
            {/* Integrated Doctor Voice Consultation Scribe & AI Automation Banner */}
            <div className="md:col-span-2 bg-gradient-to-br from-indigo-50 to-slate-50 border border-indigo-100 hover:border-indigo-150 p-4 rounded-xl space-y-3 shadow-2xs transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px]">
                    <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans">Voice Consultation Dictation & Scribe Tool</h4>
                    <p className="text-[10px] text-slate-500 font-medium">Record live patient encounters via mic or select preset logs to auto-fill diagnoses & clinical entry logs.</p>
                  </div>
                </div>
                {hasScribeData && (
                  <button
                    type="button"
                    onClick={handleClearScribe}
                    className="text-[10px] uppercase font-bold tracking-wider text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded transition-colors flex items-center space-x-1 border border-rose-100 cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Reset Voice</span>
                  </button>
                )}
              </div>

              {/* Presets Grid */}
              <div className="space-y-1.5">
                <span className="block text-[9px] uppercase font-medium text-slate-500 tracking-wider">Quick Intake Conversation Presets (Click to Simulate Voice Scribe)</span>
                <div className="grid grid-cols-3 gap-2">
                  {PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(p.text)}
                      className="px-2.5 py-2 text-left bg-white hover:bg-slate-50 active:scale-97 border border-slate-200 hover:border-slate-300 rounded-lg text-[10px] font-sans font-medium text-slate-700 cursor-pointer transition-all flex flex-col justify-between truncate"
                    >
                      <span className="font-bold text-slate-800 mb-0.5 truncate">{p.title}</span>
                      <span className="text-[9px] text-slate-400 truncate">{p.text.slice(0, 45)}...</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Microphone Capturing Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                <div className="md:col-span-2 space-y-1">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase">Consultation Transcript Textarea</label>
                  <textarea
                    rows={3}
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Transcribed system dictation lines or manually pasted physician observations from consult..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  />
                </div>

                <div className="flex flex-col justify-center space-y-2">
                  {isRecording ? (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="w-full h-10 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm animate-pulse"
                    >
                      <MicOff className="h-4 w-4" />
                      <span>Stop Scribing</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="w-full h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm shadow-indigo-150 active:scale-95"
                    >
                      <Mic className="h-4 w-4 text-indigo-200 animate-pulse" />
                      <span>Live Audio Rec Mic</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={parseClinicalTranscript}
                    disabled={isProcessingScribe || !transcript.trim()}
                    className="w-full h-10 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    {isProcessingScribe ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 text-emerald-250 animate-pulse" />
                    )}
                    <span>{isProcessingScribe ? "Analyzing Dictation..." : "Process Voice Details"}</span>
                  </button>
                </div>
              </div>

              {/* Live soundwave activity indicator */}
              {isRecording && (
                <div className="flex items-center space-x-2.5 bg-rose-50/75 border border-rose-100 p-2 rounded-lg animate-fade-in">
                  <div className="flex items-center space-x-1.5 shrink-0">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-rose-700">Microphone Recording Active</span>
                  </div>
                  {/* CSS-only responsive beautiful audio wave anim */}
                  <div className="flex items-end space-x-1 h-3.5 flex-1 justify-end pr-2 overflow-hidden select-none select-none">
                    <div className="h-2 w-0.5 bg-rose-500 animate-bounce" style={{ animationDelay: "0.1s" }} />
                    <div className="h-3 w-0.5 bg-rose-500 animate-bounce" style={{ animationDelay: "0.3s" }} />
                    <div className="h-1.5 w-0.5 bg-rose-500 animate-bounce" style={{ animationDelay: "0.5s" }} />
                    <div className="h-3.5 w-0.5 bg-rose-500 animate-bounce" style={{ animationDelay: "0.2s" }} />
                    <div className="h-2.5 w-0.5 bg-rose-500 animate-bounce" style={{ animationDelay: "0.4s" }} />
                    <div className="h-1.5 w-0.5 bg-rose-500 animate-bounce" style={{ animationDelay: "0.3s" }} />
                    <div className="h-3 w-0.5 bg-rose-500 animate-bounce" style={{ animationDelay: "0.1s" }} />
                  </div>
                </div>
              )}

              {/* Status Alerts or Error Reports */}
              {scribeError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700/90 rounded-lg flex items-start space-x-2 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p className="font-medium leading-relaxed font-sans">{scribeError}</p>
                </div>
              )}

              {hasScribeData && (
                <div className="p-3 bg-emerald-50/80 border border-emerald-150 text-emerald-850 rounded-xl space-y-2 text-xs divide-y divide-emerald-200/50">
                  <div className="flex items-center space-x-1 text-emerald-800 font-bold uppercase tracking-wider text-[10px]">
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span>Diagnostic Scribe Completed Successfully!</span>
                  </div>
                  <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[10.5px]">
                    <div>
                      <span className="block font-bold text-emerald-900 uppercase text-[9px] tracking-wider mb-0.5">Clinical Classification</span>
                      <p className="font-medium bg-white/70 px-2 py-1 rounded border border-emerald-100 italic">“{extractedReason}”</p>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="block font-bold text-emerald-900 uppercase text-[9px] tracking-wider mb-0.5">Extracted Scribe Assessment Summary</span>
                      <p className="font-sans leading-relaxed text-slate-700 bg-white/70 px-2 py-1 rounded border border-emerald-100">{extractedAssessment}</p>
                    </div>
                  </div>
                  <div className="pt-2 text-[10.5px]">
                    <span className="block font-bold text-emerald-900 uppercase text-[9px] tracking-wider mb-0.5">Clinical Care Guidelines & Prescribed Therapeutics</span>
                    <p className="font-sans leading-relaxed text-slate-700 bg-white/70 px-2.5 py-1.5 rounded border border-emerald-100 font-medium">💊 {extractedTreatment}</p>
                  </div>
                  <div className="pt-2 text-[9px] text-emerald-700 italic flex items-center space-x-1.5 leading-none">
                    <span>* The diagnosed indices above have been copied to inputs beneath and will publish to the Clinical Ledger upon submission.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Full Name */}
            <div id="form-field-name">
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Jane Shepard"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 bg-white"
              />
            </div>

            {/* Date of Birth, Age & Gender */}
            <div id="form-field-dob-age-gender" className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:col-span-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Date of Birth *</label>
                <input
                  type="date"
                  required
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Age *</label>
                <input
                  type="number"
                  required
                  min={0}
                  max={130}
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Gender *</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Blood Type & Attending Physician */}
            <div id="form-field-blood-doc" className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Blood Group</label>
                <select
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 bg-white"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Physician *</label>
                <select
                  value={primaryDoctor}
                  onChange={(e) => setPrimaryDoctor(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 bg-white"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name} ({d.specialization})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Ingress Clinic Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Clinic Status *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 bg-white"
              >
                <option value="Outpatient">Outpatient (Clinic Visit)</option>
                <option value="Observation">Observation Ward</option>
                <option value="Admitted">Inpatient Admission</option>
                <option value="Discharged">Discharged</option>
              </select>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Contact Phone</label>
              <input
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 bg-white"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Email Address</label>
              <input
                type="email"
                placeholder="patient@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 bg-white"
              />
            </div>

            {/* Residential Address */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Residential Address *</label>
              <input
                type="text"
                required
                placeholder="e.g. 123 Main St, Boston, MA 02115"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 bg-white"
              />
            </div>

            {/* Registration Fee & Payment */}
            <div className="md:col-span-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200/60 mt-1">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Registration Payment Details</h4>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Collected Registration Fee ($) *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm font-semibold select-none">
                  $
                </span>
                <input
                  type="number"
                  required
                  min={0}
                  placeholder="500"
                  value={registrationFee}
                  onChange={(e) => setRegistrationFee(e.target.value)}
                  className="w-full pl-7 pr-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Payment Method *</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 bg-white"
              >
                <option value="Razorpay">Razorpay Checkout (UPI/Card/Netbanking)</option>
                <option value="UPI">UPI Payment Gateway</option>
                <option value="Cash">Cash Handover</option>
              </select>
              {paymentMethod === "Razorpay" && (
                <div id="razorpay-notice-container" className="mt-1.5 text-[11px] text-indigo-600 leading-snug font-medium flex items-start gap-1.5 bg-indigo-50/70 p-2 rounded-lg border border-indigo-100">
                  <span className="inline-block w-2 h-2 rounded-full bg-indigo-600 animate-pulse mt-1 shrink-0"></span>
                  <span>Will compile inside secure Razorpay checkout gateway. Auto-converts to standard INR metric (₹{Math.round((parseFloat(registrationFee) || 0) * 83).toLocaleString()}). Sandbox mode fallback if key secrets are unconfigured.</span>
                </div>
              )}
            </div>

            {/* Emergency Contact Section Header */}
            <div className="md:col-span-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200/60 mt-1">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Emergency Contact Information</h4>
            </div>

            {/* Emergency Contact Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Contact Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Gordon Vance"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 bg-white"
              />
            </div>

            {/* Emergency Contact Phone & Relationship */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Contact Phone *</label>
                <input
                  type="tel"
                  required
                  placeholder="+1 (555) 000-0000"
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Relationship *</label>
                <select
                  value={emergencyContactRelationship}
                  onChange={(e) => setEmergencyContactRelationship(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 bg-white"
                >
                  <option value="Spouse">Spouse</option>
                  <option value="Parent">Parent</option>
                  <option value="Child">Child</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Friend">Friend</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Active Diagnoses / Symptoms */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Attending Symptoms & Diagnoses</label>
              <input
                type="text"
                placeholder="e.g. Type II Diabetes, persistent fever, mild asthma"
                value={diagnoses}
                onChange={(e) => setDiagnoses(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 bg-white"
              />
            </div>

            {/* Drug / Food Allergies */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1 text-rose-600">Allergies (Critical Indicator)</label>
              <textarea
                rows={2}
                placeholder="e.g. Penicillin, peanut anaphylaxis, latex, or state 'None'"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500/25 focus:border-rose-500 bg-white"
              />
            </div>

            {/* Medical Notes */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Clinical Background Notes</label>
              <textarea
                rows={2}
                placeholder="Any historical surgeries, lifestyle markers, or specialized telemetry requests..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 bg-white"
              />
            </div>

          </div>

          {/* Payment Error Toast Inline */}
          {paymentError && (
            <div id="payment-error-toast" className="mt-4 p-3.5 bg-rose-50 text-rose-700 rounded-xl text-xs font-semibold border border-rose-100 flex items-center justify-between shadow-xs">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 animate-pulse" />
                <span>{paymentError}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setPaymentError("")} 
                className="text-rose-400 hover:text-rose-600 font-bold px-1 py-0.5 rounded-md hover:bg-rose-100 transition-colors"
                id="close-payment-error"
              >
                ✕
              </button>
            </div>
          )}

          {/* Form Actions */}
          <div id="form-actions-section" className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              id="cancel-registration-button"
              type="button"
              disabled={isPaying}
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              id="submit-registration-button"
              type="submit"
              disabled={isPaying}
              className="px-4.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors flex items-center space-x-2 disabled:opacity-85"
            >
              {isPaying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Securing Order Gateway...</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 text-white/90" />
                  <span>{paymentMethod === "Razorpay" ? "Pay Fee & Register" : "Create Patient Dossier"}</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* SECURE IN-APP RAZORPAY SANDBOX SIMULATOR OVERLAY PORTAL */}
        {showSimulatedPortal && (
          <div id="razorpay-sandbox-full-portal" className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 min-h-[450px]">
            <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col text-slate-100 font-sans">
              
              {/* Portal Header */}
              <div className="bg-[#0b1220] px-4.5 py-3 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold tracking-tight text-white flex items-center">
                    razorpay<span className="text-emerald-400 font-extrabold ml-0.5">●</span>
                  </span>
                  <div className="text-[10px] bg-amber-500/15 border border-amber-500/25 text-amber-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider scale-90">
                    Sandbox Mode
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowSimulatedPortal(false);
                    setIsPaying(false);
                  }}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Order Amount Ledger Summary */}
              <div className="bg-slate-900 px-4.5 py-3.5 border-b border-slate-800/80 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400 font-medium">Merchant Ledger ID</span>
                  <span className="text-[11px] font-mono text-indigo-300 truncate max-w-[150px]" title={razorpayOrderId}>{razorpayOrderId}</span>
                </div>
                <div className="text-right flex flex-col justify-end">
                  <span className="text-xs text-slate-400 font-medium">Fee Total</span>
                  <span className="text-lg font-bold text-white tracking-tight">₹{Math.round((parseFloat(registrationFee) || 0) * 83).toLocaleString()}</span>
                  <span className="text-[10px] text-slate-400 font-medium">Converted from ${parseFloat(registrationFee) || 0}</span>
                </div>
              </div>

              {/* Steps Management Container */}
              <div className="p-4.5 flex-1 min-h-[190px] flex flex-col justify-center">

                {/* STEP 1: SELECT SIMULATED PORTAL PAYMENT METHOD */}
                {simulatedStep === "select" && (
                  <div className="space-y-3.5">
                    <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mb-2">Select Simulated Payment Channel</p>
                    
                    <button
                      type="button"
                      onClick={() => setSimulatedMethod("card")}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${simulatedMethod === "card" ? "bg-indigo-600/10 border-indigo-500 text-indigo-200" : "bg-slate-800/40 border-slate-750 hover:bg-slate-800 text-slate-300"}`}
                    >
                      <div className="flex items-center space-x-3">
                        <CreditCard className="h-4 w-4 text-indigo-400" />
                        <div>
                          <div className="text-xs font-semibold">Simulate Visa Card Transaction</div>
                          <div className="text-[10px] opacity-80 text-slate-400">Charge via testing card ending in 1111</div>
                        </div>
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSimulatedMethod("upi")}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${simulatedMethod === "upi" ? "bg-indigo-600/10 border-indigo-500 text-indigo-200" : "bg-slate-800/40 border-slate-750 hover:bg-slate-800 text-slate-300"}`}
                    >
                      <div className="flex items-center space-x-3">
                        <QrCode className="h-4 w-4 text-emerald-400" />
                        <div>
                          <div className="text-xs font-semibold">Simulate UPI QR Processing</div>
                          <div className="text-[10px] opacity-80 text-slate-400">Instant test wallet callback</div>
                        </div>
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSimulatedMethod("netbanking")}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${simulatedMethod === "netbanking" ? "bg-indigo-600/10 border-indigo-500 text-indigo-200" : "bg-slate-800/40 border-slate-750 hover:bg-slate-800 text-slate-300"}`}
                    >
                      <div className="flex items-center space-x-3">
                        <Building className="h-4 w-4 text-amber-400" />
                        <div>
                          <div className="text-xs font-semibold">Simulate NetBanking Authorization</div>
                          <div className="text-[10px] opacity-80 text-slate-400">Mock HDFC & SBI authentication</div>
                        </div>
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
                    </button>

                    <div className="pt-3 flex space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSimulatedStep("processing");
                          setTimeout(() => {
                            setSimulatedStep("success");
                            setTimeout(() => {
                              executeFinalRegistration(`pay_mock_${Math.floor(10000000 + Math.random() * 90000000)}`);
                            }, 1200);
                          }, 1500);
                        }}
                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5 group"
                      >
                        <Wallet className="h-3.5 w-3.5 group-hover:scale-110 transition-transform text-white/95" />
                        <span>Simulate Approval</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSimulatedStep("processing");
                          setTimeout(() => {
                            setSimulatedStep("failed");
                          }, 1500);
                        }}
                        className="py-2 px-3 border border-slate-700 hover:bg-slate-850 hover:text-rose-400 text-slate-400 rounded-lg text-xs font-medium transition-colors font-sans"
                      >
                        Fail Payment
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: PROCESSING TIMER AND PROGRESS RINGS */}
                {simulatedStep === "processing" && (
                  <div className="flex flex-col items-center justify-center p-6 space-y-4">
                    <div className="relative w-12 h-12 flex items-center justify-center">
                      <div className="absolute inset-0 border-[3px] border-indigo-500/15 rounded-full"></div>
                      <div className="absolute inset-0 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-white tracking-wide">Processing Secure Sandbox Payment...</p>
                      <p className="text-[10px] text-slate-400 mt-1">Connecting to clinical invoice ledger database</p>
                    </div>
                  </div>
                )}

                {/* STEP 3: TRANSACTION APPROVED STATE */}
                {simulatedStep === "success" && (
                  <div className="flex flex-col items-center justify-center p-6 text-center space-y-3.5 animate-fade-in animate-pulse">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center">
                      <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-emerald-400">Payment Capturing Succeeded</p>
                      <p className="text-[10px] text-slate-400 mt-1">Updating medical dossier states. Redirecting...</p>
                    </div>
                  </div>
                )}

                {/* STEP 4: TRANSACTION DECLINED STATE */}
                {simulatedStep === "failed" && (
                  <div className="flex flex-col items-center justify-center p-6 text-center space-y-3.5 animate-fade-in">
                    <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/25 flex items-center justify-center">
                      <XCircle className="h-7 w-7 text-rose-400" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-rose-400">Payment Rejected</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Declined: Insufficient checkout credentials or simulation error.</p>
                    </div>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setSimulatedStep("select")}
                        className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[11px] font-medium transition-colors font-sans"
                      >
                        Return to Options
                      </button>
                    </div>
                  </div>
                )}

              </div>

              {/* Portal Footer banner */}
              <div className="bg-[#0b1220] px-4.5 py-2.5 border-t border-slate-800 text-[9px] text-slate-400 flex justify-between items-center select-none font-mono">
                <span>🔒 SECURE 256-BIT SSL GATEWAY</span>
                <span className="text-indigo-400">ID: RZP-PORTAL-V1</span>
              </div>

            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
