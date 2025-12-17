import mongoose from "mongoose";
import { Event } from "../models/eventModel.js";
import { House } from "../models/houseModel.js";
import { Participant } from "../models/participantModel.js";
import { Registration } from "../models/registrationModel.js";
import { mongodbURL } from "../config.js";

// --- CONFIGURATION ---
const HOUSE_NAMES = ["Rajputs", "Spartans", "Vikings", "Mughals", "Aryans"];

const EVENT_DATA = [
  // --- PRE-EVENTS (registrationEnabled: true) ---
  { name: "Essay Writing", type: "Literary", category: "Pre-Event", participation: "Individual", minTeamSize: 10, maxTeamSize: 15, maxRegistrations: 1, isPreEvent: true, countsTowardsLimit: false },
  { name: "Short Story", type: "Literary", category: "Pre-Event", participation: "Individual", minTeamSize: 10, maxTeamSize: 15, maxRegistrations: 1, isPreEvent: true, countsTowardsLimit: false },
  { name: "Poetry", type: "Literary", category: "Pre-Event", participation: "Individual", minTeamSize: 10, maxTeamSize: 15, maxRegistrations: 1, isPreEvent: true, countsTowardsLimit: false },
  { name: "Caricature", type: "Art", category: "Pre-Event", participation: "Individual", minTeamSize: 2, maxTeamSize: 5, maxRegistrations: 1, isPreEvent: true, countsTowardsLimit: false },
  { name: "Book Review", type: "Literary", category: "Pre-Event", participation: "Individual", minTeamSize: 2, maxTeamSize: 5, maxRegistrations: 1, isPreEvent: true, countsTowardsLimit: false },
  { name: "Pencil Drawing", type: "Art", category: "Pre-Event", participation: "Individual", minTeamSize: 2, maxTeamSize: 5, maxRegistrations: 1, isPreEvent: true, countsTowardsLimit: false },
  { name: "Mock Press", type: "Literary", category: "Pre-Event", participation: "Individual", minTeamSize: 2, maxTeamSize: 5, maxRegistrations: 1, isPreEvent: true, countsTowardsLimit: false },
  { name: "Turn Around", type: "General", category: "Pre-Event", participation: "Individual", minTeamSize: 2, maxTeamSize: 5, maxRegistrations: 1, isPreEvent: true, countsTowardsLimit: false },
  { name: "Paper Collage", type: "Art", category: "Pre-Event", participation: "Group", minTeamSize: 1, maxTeamSize: 3, maxRegistrations: 1, isPreEvent: true, countsTowardsLimit: false },
  { name: "Open Mic", type: "General", category: "Pre-Event", participation: "Individual", minTeamSize: 1, maxTeamSize: 3, maxRegistrations: 1, isPreEvent: true, countsTowardsLimit: false },

  // --- ON-STAGE INDIVIDUAL (registrationEnabled: false) ---
  { name: "Recitation", type: "Literary", category: "On-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 1, minRegistrations: 2, maxRegistrations: 5, countsTowardsLimit: true },
  { name: "Extempore", type: "Literary", category: "On-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 1, minRegistrations: 2, maxRegistrations: 5, countsTowardsLimit: true },
  { name: "Light Music", type: "Music", category: "On-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 1, minRegistrations: 2, maxRegistrations: 5, countsTowardsLimit: true },
  { name: "Western Vocal", type: "Music", category: "On-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 1, minRegistrations: 2, maxRegistrations: 5, countsTowardsLimit: true },
  { name: "Classical Music", type: "Music", category: "On-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 1, minRegistrations: 2, maxRegistrations: 5, countsTowardsLimit: true },
  { name: "Rap", type: "Music", category: "On-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 1, minRegistrations: 2, maxRegistrations: 5, countsTowardsLimit: true },
  { name: "Face Painting", type: "Art", category: "On-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 1, minRegistrations: 2, maxRegistrations: 5, countsTowardsLimit: true },
  { name: "Adaptune", type: "Dance", category: "On-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 2, minRegistrations: 1, maxRegistrations: 2, countsTowardsLimit: true },
  { name: "Ambassador of RSET", type: "General", category: "On-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 2, minRegistrations: 1, maxRegistrations: 2, countsTowardsLimit: true },
  { name: "Classical Dance forms", type: "Dance", category: "On-Stage", participation: "Individual", minTeamSize: 2, maxTeamSize: 3, minRegistrations: 1, maxRegistrations: 3, countsTowardsLimit: true },
  { name: "Instruments", type: "Music", category: "On-Stage", participation: "Individual", minTeamSize: 2, maxTeamSize: 3, minRegistrations: 1, maxRegistrations: 3, countsTowardsLimit: true },
  { name: "Freestyle", type: "Dance", category: "On-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 2, minRegistrations: 1, maxRegistrations: 5, countsTowardsLimit: true },
  { name: "Duet", type: "General", category: "On-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 2, minRegistrations: 1, maxRegistrations: 5, countsTowardsLimit: true },
  
  // --- ON-STAGE GROUP (registrationEnabled: false) ---
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
  
  // --- OFF-STAGE (registrationEnabled: false) ---
  { name: "Jam Sketch", type: "Art", category: "Off-Stage", participation: "Group", minTeamSize: 1, maxTeamSize: 3, maxRegistrations: 1, countsTowardsLimit: true },
  { name: "Movie scene dubbing", type: "Theatre", category: "Off-Stage", participation: "Group", minTeamSize: 1, maxTeamSize: 10, maxRegistrations: 1, countsTowardsLimit: true },
  { name: "Short Film", type: "General", category: "Off-Stage", participation: "Group", minTeamSize: 1, maxTeamSize: 10, maxRegistrations: 100, countsTowardsLimit: false },
  { name: "Adzap", type: "General", category: "On-Stage", participation: "Group", minTeamSize: 4, maxTeamSize: 8, maxRegistrations: 100, countsTowardsLimit: false },
  { name: "Making of Bharatham", type: "General", category: "Off-Stage", participation: "Group", minTeamSize: 1, maxTeamSize: 10, maxRegistrations: 100, countsTowardsLimit: false },
  { name: "Photography", type: "Media", category: "Off-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 1, maxRegistrations: 100, countsTowardsLimit: false },
  { name: "Graffiti", type: "Art", category: "Off-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 5, maxRegistrations: 100, countsTowardsLimit: false },
  { name: "Vogue", type: "General", category: "Off-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 1, maxRegistrations: 100, countsTowardsLimit: false },
];

async function seed() {
  try {
    console.log("Connecting to DB...");
    await mongoose.connect(mongodbURL);
    console.log("Connected!");

    console.log("🗑️ Clearing old data (Events Only)...");
    await Event.deleteMany({}); 

    console.log("📅 Seeding Events...");
    const processedEvents = EVENT_DATA.map(e => ({
      ...e,
      date: e.date || "TBD",
      venue: "Main Stage",
      // Only Pre-Events can be registered for tomorrow
      registrationEnabled: e.isPreEvent === true, 
      minRegistrations: e.minRegistrations ?? 0,
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