import mongoose from "mongoose";
import { Event } from "../models/eventModel.js";
import { House } from "../models/houseModel.js";
import { Participant } from "../models/participantModel.js";
import { Registration } from "../models/registrationModel.js";
import { mongodbURL } from "../config.js";

// --- CONFIGURATION ---
const HOUSE_NAMES = ["Rajputs", "Spartans", "Vikings", "Mughals", "Aryans"];
const STUDENTS_PER_HOUSE = 20;

// Events derived from PDF Rules in 'website bharatham.pdf' and 'Copy of List Of Deadlines.pdf'
// The structure uses: minTeamSize/maxTeamSize (for single entry size) and maxRegistrations (for house limit)
const EVENT_DATA = [
  // --- PRE-EVENTS (House Reg: 1, Student Limits: No) - isPreEvent: true, countsTowardsLimit: false ---
  // Min 10, Max 15, Lang Rule
  { name: "Essay Writing", type: "Literary", category: "Pre-Event", participation: "Individual", minTeamSize: 10, maxTeamSize: 15, maxRegistrations: 1, isPreEvent: true, countsTowardsLimit: false },
  { name: "Short Story", type: "Literary", category: "Pre-Event", participation: "Individual", minTeamSize: 10, maxTeamSize: 15, maxRegistrations: 1, isPreEvent: true, countsTowardsLimit: false },
  { name: "Poetry", type: "Literary", category: "Pre-Event", participation: "Individual", minTeamSize: 10, maxTeamSize: 15, maxRegistrations: 1, isPreEvent: true, countsTowardsLimit: false },
  // Min 2, Max 5
  { name: "Caricature", type: "Art", category: "Pre-Event", participation: "Individual", minTeamSize: 2, maxTeamSize: 5, maxRegistrations: 1, isPreEvent: true, countsTowardsLimit: false },
  { name: "Book Review", type: "Literary", category: "Pre-Event", participation: "Individual", minTeamSize: 2, maxTeamSize: 5, maxRegistrations: 1, isPreEvent: true, countsTowardsLimit: false },
  { name: "Pencil Drawing", type: "Art", category: "Pre-Event", participation: "Individual", minTeamSize: 2, maxTeamSize: 5, maxRegistrations: 1, isPreEvent: true, countsTowardsLimit: false },
  { name: "Mock Press", type: "Literary", category: "Pre-Event", participation: "Individual", minTeamSize: 2, maxTeamSize: 5, maxRegistrations: 1, isPreEvent: true, countsTowardsLimit: false },
  { name: "Turn Around", type: "General", category: "Pre-Event", participation: "Individual", minTeamSize: 2, maxTeamSize: 5, maxRegistrations: 1, isPreEvent: true, countsTowardsLimit: false },
  // Min 1, Max 3
  { name: "Paper Collage", type: "Art", category: "Pre-Event", participation: "Group", minTeamSize: 1, maxTeamSize: 3, maxRegistrations: 1, isPreEvent: true, countsTowardsLimit: false },
  { name: "Open Mic", type: "General", category: "Pre-Event", participation: "Individual", minTeamSize: 1, maxTeamSize: 3, maxRegistrations: 1, isPreEvent: true, countsTowardsLimit: false },

  // --- ON-STAGE INDIVIDUAL (House Reg: 5, Team Size: 1-1 by default) - countsTowardsLimit: true ---
  // PDF (Source 45): Individual House Min 2, Max 5. Team Size is 1-1 unless stated.
  { name: "Recitation", type: "Literary", category: "On-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 1, minRegistrations: 2, maxRegistrations: 5, countsTowardsLimit: true },
  { name: "Extempore", type: "Literary", category: "On-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 1, minRegistrations: 2, maxRegistrations: 5, countsTowardsLimit: true },
  { name: "Light Music", type: "Music", category: "On-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 1, minRegistrations: 2, maxRegistrations: 5, countsTowardsLimit: true },
  { name: "Western Vocal", type: "Music", category: "On-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 1, minRegistrations: 2, maxRegistrations: 5, countsTowardsLimit: true },
  { name: "Classical Music", type: "Music", category: "On-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 1, minRegistrations: 2, maxRegistrations: 5, countsTowardsLimit: true },
  { name: "Rap", type: "Music", category: "On-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 1, minRegistrations: 2, maxRegistrations: 5, countsTowardsLimit: true },
  { name: "Face Painting", type: "Art", category: "On-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 1, minRegistrations: 2, maxRegistrations: 5, countsTowardsLimit: true },
  
  // --- ON-STAGE INDIVIDUAL (Custom Limits) ---
  { name: "Adaptune", type: "Dance", category: "On-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 2, minRegistrations: 1, maxRegistrations: 2, countsTowardsLimit: true }, // PDF: Max 2 team size
  { name: "Ambassador of RSET", type: "General", category: "On-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 2, minRegistrations: 1, maxRegistrations: 2, countsTowardsLimit: true }, // PDF: Max 2 team size
  { name: "Classical Dance forms", type: "Dance", category: "On-Stage", participation: "Individual", minTeamSize: 2, maxTeamSize: 3, minRegistrations: 1, maxRegistrations: 3, countsTowardsLimit: true }, // PDF: Min 2, Max 3 team size
  { name: "Instruments", type: "Music", category: "On-Stage", participation: "Individual", minTeamSize: 2, maxTeamSize: 3, minRegistrations: 1, maxRegistrations: 3, countsTowardsLimit: true }, // PDF: Min 2, Max 3 team size
  { name: "Freestyle", type: "Dance", category: "On-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 2, minRegistrations: 1, maxRegistrations: 5, countsTowardsLimit: true }, // PDF: Max 2 team size
  { name: "Duet", type: "General", category: "On-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 2, minRegistrations: 1, maxRegistrations: 5, countsTowardsLimit: true }, // PDF: Max 2 team size
  
  // --- ON-STAGE GROUP (House Reg: 1, Team Size: 7-10 default) - countsTowardsLimit: true ---
  // PDF (Source 45): Group Team Min 7, Max 10. House Limit is 1 unless stated.
  { name: "Theme Show", type: "General", category: "On-Stage", participation: "Group", minTeamSize: 7, maxTeamSize: 10, maxRegistrations: 1, countsTowardsLimit: true },
  { name: "Nostalgia", type: "General", category: "On-Stage", participation: "Group", minTeamSize: 7, maxTeamSize: 10, maxRegistrations: 1, countsTowardsLimit: true },
  { name: "Thiruvathira", type: "Dance", category: "On-Stage", participation: "Group", minTeamSize: 7, maxTeamSize: 10, maxRegistrations: 1, countsTowardsLimit: true },
  { name: "Unplugged Eastern/western", type: "Music", category: "On-Stage", participation: "Group", minTeamSize: 7, maxTeamSize: 7, maxRegistrations: 1, countsTowardsLimit: true },
  { name: "Duff muttu", type: "Dance", category: "On-Stage", participation: "Group", minTeamSize: 8, maxTeamSize: 10, maxRegistrations: 1, countsTowardsLimit: true },
  { name: "Drama", type: "Theatre", category: "On-Stage", participation: "Group", minTeamSize: 9, maxTeamSize: 12, maxRegistrations: 1, countsTowardsLimit: true },
  { name: "Synchronisation", type: "Dance", category: "On-Stage", participation: "Group", minTeamSize: 2, maxTeamSize: 2, maxRegistrations: 1, countsTowardsLimit: true },
  { name: "Battle of bands", type: "Music", category: "On-Stage", participation: "Group", minTeamSize: 7, maxTeamSize: 10, maxRegistrations: 1, countsTowardsLimit: true },
  { name: "Battle of brahmas", type: "Music", category: "On-Stage", participation: "Group", minTeamSize: 7, maxTeamSize: 10, maxRegistrations: 1, countsTowardsLimit: true },
  { name: "Margam Kali", type: "Dance", category: "On-Stage", participation: "Group", minTeamSize: 7, maxTeamSize: 10, maxRegistrations: 1, countsTowardsLimit: true },
  { name: "Oppana", type: "Dance", category: "On-Stage", participation: "Group", minTeamSize: 7, maxTeamSize: 9, maxRegistrations: 1, countsTowardsLimit: true },
  { name: "Naadan Pattu", type: "Music", category: "On-Stage", participation: "Group", minTeamSize: 5, maxTeamSize: 9, maxRegistrations: 1, countsTowardsLimit: true },
  { name: "Eastern", type: "Music", category: "On-Stage", participation: "Group", minTeamSize: 5, maxTeamSize: 9, maxRegistrations: 1, countsTowardsLimit: true },
  { name: "Group song", type: "Music", category: "On-Stage", participation: "Group", minTeamSize: 5, maxTeamSize: 10, maxRegistrations: 1, countsTowardsLimit: true },
  { name: "Mappila Pattu", type: "Music", category: "On-Stage", participation: "Group", minTeamSize: 5, maxTeamSize: 9, maxRegistrations: 1, countsTowardsLimit: true },
  { name: "Prop Dance", type: "Dance", category: "On-Stage", participation: "Group", minTeamSize: 7, maxTeamSize: 12, maxRegistrations: 1, countsTowardsLimit: true },
  { name: "Thematic Dance", type: "Dance", category: "On-Stage", participation: "Group", minTeamSize: 7, maxTeamSize: 12, maxRegistrations: 1, countsTowardsLimit: true },
  { name: "Quiz", type: "Literary", category: "On-Stage", participation: "Group", minTeamSize: 2, maxTeamSize: 2, maxRegistrations: 1, countsTowardsLimit: true },
  { name: "Mime", type: "Theatre", category: "On-Stage", participation: "Group", minTeamSize: 6, maxTeamSize: 6, maxRegistrations: 1, countsTowardsLimit: true },
  { name: "Group Folk Dance", type: "Dance", category: "On-Stage", participation: "Group", minTeamSize: 7, maxTeamSize: 12, maxRegistrations: 1, countsTowardsLimit: true },
  { name: "Debate", type: "Literary", category: "On-Stage", participation: "Group", minTeamSize: 2, maxTeamSize: 2, maxRegistrations: 1, countsTowardsLimit: true },
  
  // --- OFF-STAGE GROUP/INDIVIDUAL (Mostly Exceptions or House Name Reg.) - countsTowardsLimit: false / high maxRegistrations ---
  // PDF Rule 4 exceptions, plus other single-house entries.
  { name: "Jam Sketch", type: "Art", category: "Off-Stage", participation: "Group", minTeamSize: 1, maxTeamSize: 3, maxRegistrations: 1, countsTowardsLimit: true }, // Team of 3, keeping original rule
  { name: "Movie scene dubbing", type: "Theatre", category: "Off-Stage", participation: "Group", minTeamSize: 1, maxTeamSize: 10, maxRegistrations: 1, countsTowardsLimit: true },
  
  // **EXCEPTIONS (countsTowardsLimit: false)**
  { name: "Short Film", type: "General", category: "Off-Stage", participation: "Group", minTeamSize: 1, maxTeamSize: 10, maxRegistrations: 100, countsTowardsLimit: false }, // Rule 4 exception
  { name: "Adzap", type: "General", category: "On-Stage", participation: "Group", minTeamSize: 4, maxTeamSize: 8, maxRegistrations: 100, countsTowardsLimit: false }, // Rule 4 exception
  { name: "Making of Bharatham", type: "General", category: "Off-Stage", participation: "Group", minTeamSize: 1, maxTeamSize: 10, maxRegistrations: 100, countsTowardsLimit: false }, // Rule 4 exception

  // **HOUSE NAME REGISTRATIONS (countsTowardsLimit: false, Max Reg: 100 is a high default)**
  { name: "Photography", type: "Media", category: "Off-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 1, maxRegistrations: 100, countsTowardsLimit: false }, // Max 1, House Name Logic implies multiple individuals register for the House.
  { name: "Graffiti", type: "Art", category: "Off-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 5, maxRegistrations: 100, countsTowardsLimit: false }, // Max 5, House Name Logic
  { name: "Vogue", type: "General", category: "Off-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 1, maxRegistrations: 100, countsTowardsLimit: false }, // Max 1, House Name Logic
];

async function seed() {
  try {
    console.log("Connecting to DB...");
    await mongoose.connect(mongodbURL);
    console.log("Connected!");

    console.log("🗑️ Clearing old data (Events Only)...");
    // Only clear Event collection to avoid wiping participants/houses
    await Event.deleteMany({}); 

    console.log("📅 Seeding Events...");
    // Add default values to events
    const processedEvents = EVENT_DATA.map(e => ({
      ...e,
      date: e.date || "TBD",
      venue: "Main Stage",
      registrationEnabled: true,
      minRegistrations: e.minRegistrations ?? 0, // Ensure minRegistrations is present
      isPreEvent: e.isPreEvent ?? false,
      countsTowardsLimit: e.countsTowardsLimit ?? true,
    }));
    await Event.insertMany(processedEvents);

    console.log("✅ Seeding Complete!");
    console.log(`- ${processedEvents.length} Events added/updated.`);
    
    process.exit();
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

seed();