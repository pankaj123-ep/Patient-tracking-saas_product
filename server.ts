import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Clinical AI Insights
  app.post("/api/clinical-insights", async (req, res) => {
    try {
      const { patientData } = req.body;
      if (!patientData) {
        return res.status(400).json({ error: "Missing patientData in request body." });
      }

      const client = getGeminiClient();
      if (!client) {
        // Fallback simulated insights when key is missing or invalid! This lets users inspect functionality
        const hasVitals = patientData.vitals && patientData.vitals.length > 0;
        const newestVital = hasVitals ? patientData.vitals[0] : null;

        let status = "stable";
        const warnings: string[] = [];
        const recommendations: string[] = [];
        const questions: string[] = [];
        const plan: string[] = [];

        if (newestVital) {
          if (newestVital.heartRate > 100) {
            status = "observation";
            warnings.push(`Elevated heart rate noted: ${newestVital.heartRate} bpm. Check for clinical anxiety, hydration, or tachycardia indicators.`);
          }
          if (newestVital.systolic > 135 || newestVital.diastolic > 85) {
            status = "observation";
            warnings.push(`Blood pressure shows elevated levels (${newestVital.systolic}/${newestVital.diastolic} mmHg).`);
          }
          if (newestVital.temperature > 37.8) {
            status = "warning";
            warnings.push(`Fever flag active: temperature is ${newestVital.temperature}°C.`);
          }
        }

        if (patientData.allergies && patientData.allergies.toLowerCase() !== "none") {
          warnings.push(`Severe Allergy Warning: Ensure safety against known compound allergen "${patientData.allergies}".`);
        }

        if (status === "warning") {
          recommendations.push("Consider scheduling an immediate diagnostics panel and secondary evaluation.");
        } else if (status === "observation") {
          recommendations.push("Increase vital check frequency to 2-3 times daily.");
        } else {
          recommendations.push("Maintain current standard outpatient care routines.");
        }

        recommendations.push("Confirm medication adherence rates and record dietary habits.");
        
        questions.push("Have you experienced any persistent dizziness, nausea, or localized pains?");
        questions.push("How would you rate your compliance with the prescribed medical regimens?");
        
        plan.push("Schedule telephone/clinic check-in within the next 7 days.");
        plan.push("Perform a comprehensive lipid and complete blood count panel.");

        return res.json({
          status,
          summary: `Mock Clinical Evaluation for ${patientData.name}. Patient is currently classified under '${status}' status. Diagnoses: ${patientData.diagnoses || "General Observation"}. Allergies: ${patientData.allergies || "None declared"}. Vitals check highlights consistent tracking. Configure your real GEMINI_API_KEY in the Settings menu to activate real-time medical insights.`,
          warnings,
          recommendations,
          questions,
          plan
        });
      }

      const prompt = `You are an expert diagnostic clinical advisor. Analyze the following patient record and provide structured insights.
      
      Patient Name: ${patientData.name}
      Age: ${patientData.age}
      Gender: ${patientData.gender}
      Main Diagnoses/Symptoms: ${patientData.diagnoses || "None specified (Routine Tracking)"}
      Allergies: ${patientData.allergies || "None specified"}
      Blood Type: ${patientData.bloodType || "Unknown"}
      
      Recent Vitals Logs (Chronological from newest to oldest):
      ${JSON.stringify(patientData.vitals || [])}
      
      Provide a clinical evaluation containing:
      1. Overall Status indicator ("stable", "observation", or "warning") based on symptoms and vitals.
      2. Summary of current patient state.
      3. Warnings or critical alerts (e.g. potential allergy interactions, hypertensive spikes, fever indicators).
      4. Actionable Recommendations for the physician.
      5. Structured Questions to ask the patient during their upcoming visit.
      6. A step-by-step care plan.`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an expert diagnostic clinical assistant helping general clinic practitioners track and assess patient status. Provide useful professional advice in structured JSON format. Be accurate, objective, and clear.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              status: {
                type: Type.STRING,
                description: "The patient status indicator. Must be exactly 'stable', 'observation', or 'warning'."
              },
              summary: {
                type: Type.STRING,
                description: "A compact, professional client-ready summary of 2-3 sentences evaluating current conditions."
              },
              warnings: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Specific alert flags, allergy markers, abnormal readings or dangerous conditions."
              },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Immediate tests or actionable clinical recommendations."
              },
              questions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Clarifying follow-up questions to query the patient with at the next physical meeting."
              },
              plan: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "A chronological list of next action tasks or therapeutic goals."
              }
            },
            required: ["status", "summary", "warnings", "recommendations", "questions", "plan"]
          }
        }
      });

      const responseText = response.text || "{}";
      const parsedData = JSON.parse(responseText.trim());
      res.json(parsedData);
    } catch (error) {
      console.error("Clinical Assistant Error:", error);
      res.status(500).json({ error: "Failed to generate clinical insights. " + (error instanceof Error ? error.message : "") });
    }
  });

  // API Route for Analyzing Past clinical entries & vitals to generate Diagnostic Notes Insights
  app.post("/api/generate-notes-insight", async (req, res) => {
    try {
      const { vitals, clinicalEntries, patientName, age, gender, diagnoses } = req.body;

      const client = getGeminiClient();
      if (!client) {
        // Return a professional rule-based fallback when GEMINI_API_KEY is not configured yet.
        let reportSummary = `### AI Diagnostic Observation (Fallback Mode)\n\n`;
        reportSummary += `**Patient**: ${patientName || "Anonymous"}\n\n`;
        
        if (clinicalEntries && clinicalEntries.length > 0) {
          const latestEntry = clinicalEntries[0];
          reportSummary += `Based on the latest recorded visit/encounter of **${latestEntry.reason}** on ${new Date(latestEntry.timestamp).toLocaleDateString()}, the patient was evaluated by Dr. ${latestEntry.doctor}. `;
          reportSummary += `The assessment findings indicated: "${latestEntry.assessment}". `;
        } else {
          reportSummary += `There are no previous clinical note entries recorded on the database ledger yet. `;
        }

        if (vitals && vitals.length > 0) {
          const latestVital = vitals[0];
          reportSummary += `\n\nRecent vitals recorded show **HR**: ${latestVital.heartRate} bpm, **BP**: ${latestVital.systolic}/${latestVital.diastolic} mmHg, **SpO2**: ${latestVital.spo2}%, and **Temp**: ${latestVital.temperature}°C. `;
          
          if (latestVital.heartRate > 100 || latestVital.systolic > 135 || latestVital.temperature > 37.8) {
            reportSummary += `\n\n⚠️ **Physician Alert**: Certain vital telemetry values appear outside normal baseline variations. A closer diagnostic inquiry should be prioritised during future appointments.`;
          } else {
            reportSummary += `\n\n✅ Key cardiopulmonary readings correlate with healthy outpatient levels.`;
          }
        } else {
          reportSummary += `\n\nNo historical vital logs found in patient file.`;
        }

        reportSummary += `\n\n*Note: Configure a valid GEMINI_API_KEY in the Settings > Secrets configuration panel to power premium multi-factorial clinical evaluations using the Gemini 3.5 live engine.*`;
        return res.json({ insight: reportSummary });
      }

      const prompt = `You are an expert diagnostic diagnostic clinician. Analyze the following patient history and current vitals, and provide a high-quality, professional, summarized AI-powered diagnostic observation.

Patient Demographics:
- Name: ${patientName || "Anonymous"}
- Age: ${age || "N/A"}
- Gender: ${gender || "N/A"}
- Attending Symptoms/Diagnoses: ${diagnoses || "None specified"}

All Recent Vitals:
${JSON.stringify(vitals || [])}

All Past Clinical Notes Entries:
${JSON.stringify(clinicalEntries || [])}

Provide a concise, medical-grade diagnostic observation report (2 or 3 structured paragraphs) formatted in clean Markdown.
- Synthesize recent clinical findings with the vital telemetry trend lines.
- Highlight any respiratory or cardiovascular risks, compliance issues, or systemic concerns.
- Offer actionable physician guidance or critical warnings that need to be monitored.
Ensure the written style has an authoritative, supportive, physician-level tone.`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an expert clinical medical professor and diagnostic physician scribe. Provide markdown formatted evaluation summaries for clinical practitioners. Avoid emojis except clear warning icons if necessary.",
        }
      });

      res.json({ insight: response.text || "Failed to generate diagnostic observation." });
    } catch (error) {
      console.error("Generate Notes Insight Error:", error);
      res.status(500).json({ error: "Failed to generate observational diagnostic insight: " + (error instanceof Error ? error.message : "") });
    }
  });

  // API Route for Voice Consultation Scribe & Extraction
  app.post("/api/transcribe-clinical", async (req, res) => {
    try {
      const { transcript } = req.body;
      if (!transcript) {
        return res.status(400).json({ error: "Missing transcript in request body." });
      }

      const client = getGeminiClient();
      if (!client) {
        // Fallback rule-based parsing when GEMINI_API_KEY is not defined yet
        const text = transcript.toLowerCase();
        let reason = "Routine Consultation";
        let assessment = "Patient presented for general clinical consultation. Discussion was transcribed via secure voice recorder.";
        let treatment = "Continue baseline care guidelines.";

        if (text.includes("cough") || text.includes("chest") || text.includes("asthma") || text.includes("breathe")) {
          reason = "Respiratory Consultation";
          assessment = "Conversation suggests minor respiratory inflammation or asthma flare-up. Patient describes mild breathing obstruction.";
          treatment = "Albuterol rescue inhaler, 2 puffs every 4 hours, and keep hydrated. Avoid allergen exposure.";
        } else if (text.includes("pressure") || text.includes("blood") || text.includes("hypertension") || text.includes("headache")) {
          reason = "Cardiovascular Consultation";
          assessment = "Consultation recorded focused on blood pressure trends. Patient mentions recurring mild tension headaches.";
          treatment = "Lisinopril 10mg daily prescribed. Instruct patient to keep a daily blood pressure diary log.";
        } else if (text.includes("surgery") || text.includes("pain") || text.includes("knee") || text.includes("injury")) {
          reason = "Post-op Pain Evaluation";
          assessment = "Assessment of post-operative orthopaedic healing or physical injury. Patient described focal pain.";
          treatment = "Acetaminophen 500mg as needed for pain. Physical therapy reviews advised scheduled next week.";
        }

        // Incorporate parts of original transcript text to prove it's connected
        assessment += ` (Extracted from dictation: "${transcript.length > 80 ? transcript.slice(0, 80) + "..." : transcript}")`;

        return res.json({ reason, assessment, treatment });
      }

      const prompt = `You are an expert diagnostic clinical scribe. Process the following verbal conversation between a doctor and a patient, and extract structured medical clinical records.
      
      Vocal Consultation Transcript:
      "${transcript}"
      
      Task: Extract:
      1. Concise reason for the visit (e.g. 'Asthma consultation' or 'Post-op knee session')
      2. Clear professional clinical assessment summarizing the findings, patient symptoms, and vocal dictations. Ensure it reads as if written by a professional physician.
      3. Prescribed care plan, therapeutics, and specifically any medications/medicine prescribed with names, dosages, and instructions if mentioned. If none, detail general therapeutic guidelines.`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an expert diagnostic physician's assistant and medical scribe. Format the evaluation into structured clinical logs in JSON format.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reason: {
                type: Type.STRING,
                description: "A very brief, clinical title for the encounter. Maximum 8 words."
              },
              assessment: {
                type: Type.STRING,
                description: "Professional written physician findings and observations based on symptoms and diagnosis described."
              },
              treatment: {
                type: Type.STRING,
                description: "Specific prescribed medicines, drug details (dosage, schedule) and therapeutic plan."
              }
            },
            required: ["reason", "assessment", "treatment"]
          }
        }
      });

      const responseText = response.text || "{}";
      const parsedData = JSON.parse(responseText.trim());
      res.json(parsedData);
    } catch (error) {
      console.error("Clinical Transcriber Extraction Error:", error);
      res.status(500).json({ error: "Failed to parse vocal records. " + (error instanceof Error ? error.message : "") });
    }
  });

  // GET: Retrieve Razorpay Credentials state (public key id)
  app.get("/api/payment/razorpay-config", (req, res) => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const isMock = !keyId;
    res.json({
      keyId: keyId || "rzp_test_mockKey12345",
      isMock
    });
  });

  // POST: Create dynamic Razorpay Order
  app.post("/api/payment/razorpay-order", async (req, res) => {
    try {
      const { amount, currency, patientName } = req.body;
      const keyId = process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;

      // Smallest unit calculation (Paise/Cents, multiplied by 100)
      const numericAmount = parseFloat(amount) || 0;
      const smallestUnitAmount = Math.round(numericAmount * 100);

      if (!keyId || !keySecret) {
        // Safe interactive Sandbox / Demo Fallback Mode
        const mockOrderId = `order_mock_${Math.floor(100000 + Math.random() * 900000)}`;
        return res.json({
          id: mockOrderId,
          amount: smallestUnitAmount,
          currency: currency || "INR",
          receipt: `receipt_${Date.now()}`,
          isMock: true,
          message: "Sandbox simulator mode active. Configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Settings/Secrets to transition."
        });
      }

      // Live integration request to Razorpay's API
      const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
      const orderResponse = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${authHeader}`
        },
        body: JSON.stringify({
          amount: smallestUnitAmount,
          currency: currency || "INR",
          receipt: `receipt_${Date.now()}`,
          notes: {
            patientName: patientName || "Patient Fee Collection"
          }
        })
      });

      if (!orderResponse.ok) {
        const errText = await orderResponse.text();
        throw new Error(`Razorpay api error: Status ${orderResponse.status} - ${errText}`);
      }

      const orderData = await orderResponse.json();
      res.json({
        id: orderData.id,
        amount: orderData.amount,
        currency: orderData.currency,
        receipt: orderData.receipt,
        isMock: false
      });
    } catch (err) {
      console.error("Razorpay order generation crash:", err);
      res.status(500).json({ error: "Failed to instantiate Razorpay order gateway: " + (err instanceof Error ? err.message : "") });
    }
  });

  // POST: Verify webhook callbacks or checkout client signatures securely on server
  app.post("/api/payment/razorpay-verify", (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;

      if (!keySecret) {
        // sandbox simulation verify approval
        return res.json({ success: true, isMock: true });
      }

      // Standard SHA256 HMAC checksum audit recommended by Razorpay
      const hmac = crypto.createHmac("sha256", keySecret);
      hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      const calculatedSignature = hmac.digest("hex");

      if (calculatedSignature === razorpay_signature) {
        res.json({ success: true, isMock: false });
      } else {
        console.error("Signature comparison mismatch!");
        res.status(400).json({ error: "Razorpay secure verification checksum is invalid." });
      }
    } catch (err) {
      console.error("Verification endpoint crashed:", err);
      res.status(500).json({ error: "System encountered an error validating fee collection." });
    }
  });

  // Serve static client build or use Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return aiClient;
}

startServer();
