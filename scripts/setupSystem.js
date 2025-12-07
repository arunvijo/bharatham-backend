import mongoose from "mongoose";
import { Event } from "../models/eventModel.js";
import { House } from "../models/houseModel.js";
import { Participant } from "../models/participantModel.js";
import { Registration } from "../models/registrationModel.js";
import { Score } from "../models/scoreModel.js"; // Ensure this path is correct
import { mongodbURL } from "../config.js";

const HOUSE_NAMES = ["Rajputs", "Spartans", "Vikings", "Mughals", "Aryans"];

// EVENT DATA (Same as before)
const EVENT_DATA = [
  // --- PRE-EVENTS ---
  { name: "Essay Writing", type: "Literary", category: "Pre-Event", participation: "Individual", minTeamSize: 10, maxTeamSize: 15, maxRegistrations: 1, isPreEvent: true, countsTowardsLimit: false },
  { name: "Short Story", type: "Literary", category: "Pre-Event", participation: "Individual", minTeamSize: 10, maxTeamSize: 15, maxRegistrations: 1, isPreEvent: true, countsTowardsLimit: false },
  { name: "Poetry", type: "Literary", category: "Pre-Event", participation: "Individual", minTeamSize: 10, maxTeamSize: 15, maxRegistrations: 1, isPreEvent: true, countsTowardsLimit: false },
  { name: "Caricature", type: "Art", category: "Pre-Event", participation: "Individual", minTeamSize: 2, maxTeamSize: 5, maxRegistrations: 1, isPreEvent: true, countsTowardsLimit: false },
  { name: "Book Review", type: "Literary", category: "Pre-Event", participation: "Individual", minTeamSize: 2, maxTeamSize: 5, maxRegistrations: 1, isPreEvent: true, countsTowardsLimit: false },
  { name: "Pencil Drawing", type: "Art", category: "Pre-Event", participation: "Individual", minTeamSize: 2, maxTeamSize: 5, maxRegistrations: 1, isPreEvent: true, countsTowardsLimit: false },
  { name: "Turn Around", type: "General", category: "Pre-Event", participation: "Individual", minTeamSize: 2, maxTeamSize: 5, maxRegistrations: 1, isPreEvent: true, countsTowardsLimit: false },
  { name: "Paper Collage", type: "Art", category: "Pre-Event", participation: "Individual", minTeamSize: 1, maxTeamSize: 3, maxRegistrations: 1, isPreEvent: true, countsTowardsLimit: false },
  { name: "Open Mic", type: "General", category: "Pre-Event", participation: "Individual", minTeamSize: 1, maxTeamSize: 3, maxRegistrations: 1, isPreEvent: true, countsTowardsLimit: false },

  // --- ON-STAGE INDIVIDUAL ---
  { name: "Recitation", type: "Literary", category: "On-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 1, minRegistrations: 2, maxRegistrations: 5, countsTowardsLimit: true },
  { name: "Extempore", type: "Literary", category: "On-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 1, minRegistrations: 2, maxRegistrations: 5, countsTowardsLimit: true },
  { name: "Light Music", type: "Music", category: "On-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 1, minRegistrations: 2, maxRegistrations: 5, countsTowardsLimit: true },
  { name: "Western Vocal", type: "Music", category: "On-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 1, minRegistrations: 2, maxRegistrations: 5, countsTowardsLimit: true },
  { name: "Classical Music", type: "Music", category: "On-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 1, minRegistrations: 2, maxRegistrations: 5, countsTowardsLimit: true },
  { name: "Rap", type: "Music", category: "On-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 1, minRegistrations: 2, maxRegistrations: 5, countsTowardsLimit: true },
  { name: "Face Painting", type: "Art", category: "On-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 1, minRegistrations: 2, maxRegistrations: 5, countsTowardsLimit: true },
  { name: "Adaptune", type: "Dance", category: "On-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 1, minRegistrations: 1, maxRegistrations: 2, countsTowardsLimit: true },

  // --- COMBINED ---
  { name: "Classical Dance", type: "Dance", category: "On-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 1, minRegistrations: 2, maxRegistrations: 3, countsTowardsLimit: true },
  { name: "Instruments", type: "Music", category: "On-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 1, minRegistrations: 2, maxRegistrations: 3, countsTowardsLimit: true },

  // --- GROUP EVENTS ---
  { name: "Battle of Bands", type: "Music", category: "On-Stage", participation: "Group", minTeamSize: 7, maxTeamSize: 10, maxRegistrations: 1, countsTowardsLimit: true },
  { name: "Battle of Brahmas", type: "Music", category: "On-Stage", participation: "Group", minTeamSize: 7, maxTeamSize: 10, maxRegistrations: 1, countsTowardsLimit: true },
  { name: "Nostalgia", type: "General", category: "On-Stage", participation: "Group", minTeamSize: 7, maxTeamSize: 10, maxRegistrations: 1, countsTowardsLimit: true },
  { name: "Group Folk Dance", type: "Dance", category: "On-Stage", participation: "Group", minTeamSize: 7, maxTeamSize: 10, maxRegistrations: 1, countsTowardsLimit: true },
  { name: "Prop Dance", type: "Dance", category: "On-Stage", participation: "Group", minTeamSize: 7, maxTeamSize: 10, maxRegistrations: 1, countsTowardsLimit: true },
  { name: "Thematic Dance", type: "Dance", category: "On-Stage", participation: "Group", minTeamSize: 7, maxTeamSize: 10, maxRegistrations: 1, countsTowardsLimit: true },
  { name: "Duffumuttu", type: "Dance", category: "On-Stage", participation: "Group", minTeamSize: 7, maxTeamSize: 10, maxRegistrations: 1, countsTowardsLimit: true },
  { name: "Theme Show", type: "General", category: "On-Stage", participation: "Group", minTeamSize: 7, maxTeamSize: 10, maxRegistrations: 1, countsTowardsLimit: true },
  { name: "Drama", type: "General", category: "On-Stage", participation: "Group", minTeamSize: 9, maxTeamSize: 12, maxRegistrations: 1, countsTowardsLimit: true },
  { name: "Mime", type: "General", category: "On-Stage", participation: "Group", minTeamSize: 6, maxTeamSize: 6, maxRegistrations: 1, countsTowardsLimit: true },
  { name: "Quiz", type: "Literary", category: "On-Stage", participation: "Group", minTeamSize: 2, maxTeamSize: 2, maxRegistrations: 1, countsTowardsLimit: true },

  // --- EXCEPTIONS ---
  { name: "Short Film", type: "General", category: "Off-Stage", participation: "Group", minTeamSize: 1, maxTeamSize: 10, maxRegistrations: 100, countsTowardsLimit: false },
  { name: "Adzap", type: "General", category: "On-Stage", participation: "Group", minTeamSize: 4, maxTeamSize: 8, maxRegistrations: 100, countsTowardsLimit: false },
  { name: "Making of Bharatham", type: "General", category: "Off-Stage", participation: "Group", minTeamSize: 1, maxTeamSize: 10, maxRegistrations: 100, countsTowardsLimit: false },
];

async function setup() {
  try {
    console.log("🔌 Connecting to DB...");
    await mongoose.connect(mongodbURL);
    
    console.log("🗑️ Clearing OLD Database...");
    // This wipes everything so you start fresh
    await Event.deleteMany({});
    await House.deleteMany({});
    await Participant.deleteMany({});
    await Registration.deleteMany({});
    await Score.deleteMany({});

    console.log("🏰 Creating Houses...");
    await House.insertMany(
      HOUSE_NAMES.map(name => ({ 
        name, 
        captain: "TBD", 
        viceCaptain: "TBD",
        points: 0
      }))
    );

    console.log("📅 Creating Events...");
    await Event.insertMany(
      EVENT_DATA.map(e => ({
        ...e,
        date: e.date || "TBD",
        venue: "Main Stage",
        registrationEnabled: true
      }))
    );

    console.log("✅ System Setup Complete!");
    console.log("👉 NOW RUN: 'node importCSVs.js' to add real students.");
    
    process.exit();
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

setup();