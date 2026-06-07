import { Patient, Doctor, Clinic } from "./types";

export const INITIAL_CLINICS: Clinic[] = [
  {
    id: "CLI-001",
    name: "Metro Health General Clinic",
    tagline: "Comprehensive Multi-specialty Outpatient & Urgent Care",
    address: "710 Commonwealth Ave, Boston, MA 02215",
    joinedDate: "2022-01-10"
  },
  {
    id: "CLI-002",
    name: "Summit Orthopedics & Cardiology",
    tagline: "Leading Cardiovascular Wellness & Musculoskeletal Surgery",
    address: "512 Beacon St, Seattle, WA 98104",
    joinedDate: "2023-04-15"
  },
  {
    id: "CLI-003",
    name: "Apex Pediatric Center",
    tagline: "Dedicated Pediatric Care & Infant Endocrinology",
    address: "88 Pine Rd, Philadelphia, PA 19103",
    joinedDate: "2024-02-01"
  }
];

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: "PAT-001",
    clinicId: "CLI-001",
    name: "Clara Vance",
    age: 42,
    gender: "Female",
    bloodType: "A+",
    contact: "+1 (555) 234-5678",
    email: "clara.vance@email.com",
    diagnoses: "Hypertension Stage I, Chronic Migraine",
    status: "Observation",
    primaryDoctor: "Dr. Sarah Jenkins",
    admissionDate: "2026-05-15",
    registrationFee: 500,
    paymentMethod: "Cash",
    allergies: "Sulfonamides (Severe Exception)",
    notes: "Patient experiences recurring ocular migraines. Monitored for reaction to betablockers.",
    dateOfBirth: "1984-03-12",
    address: "452 Sentinel Way, Apt 3B, Boston, MA 02115",
    emergencyContactName: "Gordon Vance",
    emergencyContactPhone: "+1 (555) 321-9876",
    emergencyContactRelationship: "Spouse",
    vitals: [
      {
        id: "VIT-101",
        timestamp: "2026-06-07T14:30:00Z",
        heartRate: 82,
        systolic: 138,
        diastolic: 88,
        temperature: 36.8,
        respiratoryRate: 16,
        spo2: 98,
        loggedBy: "Nurse Kelly R."
      },
      {
        id: "VIT-102",
        timestamp: "2026-06-06T10:15:00Z",
        heartRate: 88,
        systolic: 142,
        diastolic: 92,
        temperature: 36.9,
        respiratoryRate: 18,
        spo2: 97,
        loggedBy: "Nurse Kelly R."
      },
      {
        id: "VIT-103",
        timestamp: "2026-06-05T09:00:00Z",
        heartRate: 76,
        systolic: 135,
        diastolic: 85,
        temperature: 36.6,
        respiratoryRate: 15,
        spo2: 99,
        loggedBy: "Nurse Alan S."
      },
      {
        id: "VIT-104",
        timestamp: "2026-06-04T16:00:00Z",
        heartRate: 74,
        systolic: 144,
        diastolic: 94,
        temperature: 37.1,
        respiratoryRate: 19,
        spo2: 98,
        loggedBy: "Nurse Kelly R."
      },
      {
        id: "VIT-105",
        timestamp: "2026-06-03T11:20:00Z",
        heartRate: 80,
        systolic: 140,
        diastolic: 90,
        temperature: 36.7,
        respiratoryRate: 17,
        spo2: 99,
        loggedBy: "Nurse Alan S."
      }
    ],
    clinicalEntries: [
      {
        id: "CLN-201",
        timestamp: "2026-06-07T14:45:00Z",
        reason: "Routine outpatient checkup",
        assessment: "Blood pressure remains elevated despite baseline lisinopril 10mg regimen. Patient indicates compliant administration.",
        treatment: "Increase Lisinopril to 20mg daily. Educated on absolute avoidance of sodium-rich dietary items.",
        doctor: "Dr. Sarah Jenkins"
      },
      {
        id: "CLN-202",
        timestamp: "2026-05-15T11:00:00Z",
        reason: "Initial cardiovascular evaluation",
        assessment: "Patient presents with persistent headaches and recurring ocular floaters. Systolic ranges consistently in the low 140s.",
        treatment: "Prescribe baseline Lisinopril 10mg daily. Recommend blood pressure recording at home.",
        doctor: "Dr. Sarah Jenkins"
      }
    ],
    appointments: [
      {
        id: "APP-301",
        date: "2026-06-15",
        time: "10:30 AM",
        reason: "Lisinopril Dosage Review & Renal Panel",
        status: "Scheduled",
        doctor: "Dr. Sarah Jenkins"
      }
    ]
  },
  {
    id: "PAT-002",
    clinicId: "CLI-001",
    name: "Marcus Aurelius Diaz",
    age: 29,
    gender: "Male",
    bloodType: "O-",
    contact: "+1 (555) 765-4321",
    email: "marcus.diaz@email.com",
    diagnoses: "Acute Bronchitis, Asthma",
    status: "Outpatient",
    primaryDoctor: "Dr. Elena Rostova",
    admissionDate: "2026-06-05",
    registrationFee: 350,
    paymentMethod: "UPI",
    allergies: "Penicillin (Moderate rash), Aspirin",
    notes: "Requires frequent inhaler review. Prefers non-steroidal anti-inflammatories if alternatives available.",
    dateOfBirth: "1997-07-22",
    address: "888 Stoic Circle, Dallas, TX 75201",
    emergencyContactName: "Lucilla Diaz",
    emergencyContactPhone: "+1 (555) 765-8888",
    emergencyContactRelationship: "Sister",
    vitals: [
      {
        id: "VIT-201",
        timestamp: "2026-06-07T09:15:00Z",
        heartRate: 92,
        systolic: 118,
        diastolic: 76,
        temperature: 37.4,
        respiratoryRate: 22,
        spo2: 95,
        loggedBy: "Nurse Alan S."
      },
      {
        id: "VIT-202",
        timestamp: "2026-06-05T14:00:00Z",
        heartRate: 98,
        systolic: 122,
        diastolic: 80,
        temperature: 38.3,
        respiratoryRate: 24,
        spo2: 93,
        loggedBy: "Nurse Kelly R."
      }
    ],
    clinicalEntries: [
      {
        id: "CLN-301",
        timestamp: "2026-06-05T14:30:00Z",
        reason: "Persistent productive cough and dyspnea",
        assessment: "Wheezing detected bilaterally upon auscultation. Temperature 38.3C indicating low-grade inflammatory infectious process.",
        treatment: "Initiated brief oral steroid burst (Prednisone 40mg for 5 days) + Albuterol HFA rescue inhaler as needed every 4 hours.",
        doctor: "Dr. Elena Rostova"
      }
    ],
    appointments: [
      {
        id: "APP-302",
        date: "2026-06-12",
        time: "02:00 PM",
        reason: "Spirometry Review & Pulmonary Follow-up",
        status: "Scheduled",
        doctor: "Dr. Elena Rostova"
      }
    ]
  },
  {
    id: "PAT-003",
    clinicId: "CLI-002",
    name: "Arthur Pendragon",
    age: 71,
    gender: "Male",
    bloodType: "B-",
    contact: "+1 (555) 987-6543",
    email: "arthur.king@email.com",
    diagnoses: "Post-op Left Total Knee Arthroplasty (Day 3)",
    status: "Admitted",
    primaryDoctor: "Dr. Robert Chen (Ortho)",
    admissionDate: "2026-06-04",
    registrationFee: 500,
    paymentMethod: "UPI",
    allergies: "Codeine (Nausea), Latex (Severe contact dermatitis)",
    notes: "Requires telemetry tracking and strict non-weight bearing on left leg. Post-operative epidural removed yesterday.",
    dateOfBirth: "1955-01-05",
    address: "1 Camelot Lane, Ward 4, Seattle, WA 98101",
    emergencyContactName: "Guinevere Pendragon",
    emergencyContactPhone: "+1 (555) 987-1234",
    emergencyContactRelationship: "Spouse",
    vitals: [
      {
        id: "VIT-301",
        timestamp: "2026-06-07T16:00:00Z",
        heartRate: 68,
        systolic: 125,
        diastolic: 78,
        temperature: 36.5,
        respiratoryRate: 14,
        spo2: 99,
        loggedBy: "Nurse Kelly R."
      },
      {
        id: "VIT-302",
        timestamp: "2026-06-07T08:00:00Z",
        heartRate: 72,
        systolic: 120,
        diastolic: 80,
        temperature: 36.4,
        respiratoryRate: 14,
        spo2: 99,
        loggedBy: "Nurse Alan S."
      },
      {
        id: "VIT-303",
        timestamp: "2026-06-06T18:00:00Z",
        heartRate: 75,
        systolic: 118,
        diastolic: 75,
        temperature: 36.7,
        respiratoryRate: 16,
        spo2: 98,
        loggedBy: "Nurse Kelly R."
      },
      {
        id: "VIT-304",
        timestamp: "2026-06-05T08:00:00Z",
        heartRate: 85,
        systolic: 130,
        diastolic: 82,
        temperature: 37.2,
        respiratoryRate: 18,
        spo2: 96,
        loggedBy: "Nurse Alan S."
      }
    ],
    clinicalEntries: [
      {
        id: "CLN-401",
        timestamp: "2026-06-06T10:00:00Z",
        reason: "Post-operative Day 2 Rounded Visit",
        assessment: "Dressings are dry and intact. No signs of deep vein thrombosis in bilateral lower limbs. Range of motion matches targets.",
        treatment: "Administered low-molecular-weight heparin prophylaxis. Patient cleared for bedside active physical therapy exercises.",
        doctor: "Dr. Robert Chen"
      }
    ],
    appointments: [
      {
        id: "APP-303",
        date: "2026-06-10",
        time: "09:00 AM",
        reason: "Expected discharge planning review",
        status: "Scheduled",
        doctor: "Dr. Robert Chen"
      }
    ]
  },
  {
    id: "PAT-004",
    clinicId: "CLI-003",
    name: "Aisha Jenkins",
    age: 9,
    gender: "Female",
    bloodType: "O+",
    contact: "+1 (555) 456-1234",
    email: "guard.jenkins@email.com",
    diagnoses: "Type 1 Diabetes Mellitus, Mild Asthma",
    status: "Observation",
    primaryDoctor: "Dr. Alicia Patel",
    admissionDate: "2026-06-06",
    registrationFee: 300,
    paymentMethod: "Cash",
    allergies: "Peanuts (Anaphylaxis, carries Epipen)",
    notes: "Pediatric patient. Insulin pump protocol in place. Accompanied by guardian.",
    dateOfBirth: "2017-11-30",
    address: "22 Cherry Street, Philadelphia, PA 19106",
    emergencyContactName: "Robert Jenkins",
    emergencyContactPhone: "+1 (555) 456-5555",
    emergencyContactRelationship: "Father",
    vitals: [
      {
        id: "VIT-401",
        timestamp: "2026-06-07T15:30:00Z",
        heartRate: 96,
        systolic: 104,
        diastolic: 68,
        temperature: 36.7,
        respiratoryRate: 20,
        spo2: 98,
        loggedBy: "Nurse Kelly R."
      }
    ],
    clinicalEntries: [
      {
        id: "CLN-501",
        timestamp: "2026-06-06T16:00:00Z",
        reason: "Blood glucose management protocol review",
        assessment: "Guardian requests instruction on pump configuration following recurring bedtime hypos. Continuous CGM active.",
        treatment: "Adjusted basal infusion settings for bedtime period (2200 to 0400 from 0.4U/hr down to 0.3U/hr). Retrain on carb estimation.",
        doctor: "Dr. Alicia Patel"
      }
    ],
    appointments: [
      {
        id: "APP-304",
        date: "2026-06-08",
        time: "11:00 AM",
        reason: "Continuous Glucose Monitor checkup",
        status: "Scheduled",
        doctor: "Dr. Alicia Patel"
      }
    ]
  }
];

export const INITIAL_DOCTORS: Doctor[] = [
  {
    id: "DOC-001",
    clinicId: "CLI-001",
    name: "Dr. Sarah Jenkins",
    specialization: "Pediatrics & Family Medicine",
    joinedDate: "2022-04-12"
  },
  {
    id: "DOC-002",
    clinicId: "CLI-001",
    name: "Dr. Elena Rostova",
    specialization: "Pulmonology & Respiratory Care",
    joinedDate: "2023-09-01"
  },
  {
    id: "DOC-003",
    clinicId: "CLI-002",
    name: "Dr. Robert Chen",
    specialization: "Orthopedic Surgery",
    joinedDate: "2021-02-15"
  },
  {
    id: "DOC-004",
    clinicId: "CLI-002",
    name: "Dr. Marcus Vance",
    specialization: "Cardiology",
    joinedDate: "2024-01-10"
  },
  {
    id: "DOC-005",
    clinicId: "CLI-003",
    name: "Dr. Alicia Patel",
    specialization: "Internal Medicine & Endocrinology",
    joinedDate: "2023-11-20"
  }
];

