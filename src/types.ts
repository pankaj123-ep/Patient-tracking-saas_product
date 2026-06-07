export interface VitalRecord {
  id: string;
  timestamp: string;
  heartRate: number; // bpm
  systolic: number;  // mmHg
  diastolic: number; // mmHg
  temperature: number; // °C
  respiratoryRate: number; // breaths/min
  spo2: number; // %
  loggedBy: string;
}

export interface ClinicalEntry {
  id: string;
  timestamp: string;
  reason: string;
  assessment: string;
  treatment: string;
  doctor: string;
}

export interface Appointment {
  id: string;
  date: string;
  time: string;
  reason: string;
  status: "Scheduled" | "Completed" | "Cancelled";
  doctor: string;
}

export interface Doctor {
  id: string;
  clinicId: string;
  name: string;
  specialization: string;
  joinedDate: string;
}

export interface RecordedConversation {
  id: string;
  timestamp: string;
  recordedBy: "Patient" | "Doctor";
  audioDurationSeconds?: number;
  transcript: string;
  doctorName: string;
}

export interface Clinic {
  id: string;
  name: string;
  tagline: string;
  address: string;
  joinedDate: string;
}

export interface Patient {
  id: string;
  clinicId: string;
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  bloodType: string;
  contact: string;
  email: string;
  diagnoses: string;
  status: "Admitted" | "Outpatient" | "Discharged" | "Observation";
  primaryDoctor: string;
  admissionDate: string;
  allergies: string;
  notes: string;
  // Demographics
  dateOfBirth: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  
  vitals: VitalRecord[];
  clinicalEntries: ClinicalEntry[];
  appointments: Appointment[];
  registrationFee?: number;
  paymentMethod?: "UPI" | "Cash" | "Razorpay";
  recordedConversations?: RecordedConversation[];
}

export interface AIInsights {
  status: "stable" | "observation" | "warning";
  summary: string;
  warnings: string[];
  recommendations: string[];
  questions: string[];
  plan: string[];
}
