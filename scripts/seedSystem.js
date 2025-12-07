import mongoose from "mongoose";
import { Event } from "../models/eventModel.js";
import { House } from "../models/houseModel.js";
import { Participant } from "../models/participantModel.js";
import { Registration } from "../models/registrationModel.js";
import { mongodbURL } from "../config.js";

// --- CONFIGURATION ---
const HOUSE_NAMES = ["Rajputs", "Spartans", "Vikings", "Mughals", "Aryans"];
const STUDENTS_PER_HOUSE = 20;

// Events derived from your CSV & PDF Rules
const EVENT_DATA = [
  // --- LITERARY PRE-EVENTS (Min 10, Max 15, Lang Rule) ---
  { name: "Essay Writing", type: "Literary", category: "Pre-Event", participation: "Individual", minTeamSize: 10, maxTeamSize: 15, maxRegistrations: 1, isPreEvent: true, countsTowardsLimit: false },
  { name: "Short Story", type: "Literary", category: "Pre-Event", participation: "Individual", minTeamSize: 10, maxTeamSize: 15, maxRegistrations: 1, isPreEvent: true, countsTowardsLimit: false },
  { name: "Poetry", type: "Literary", category: "Pre-Event", participation: "Individual", minTeamSize: 10, maxTeamSize: 15, maxRegistrations: 1, isPreEvent: true, countsTowardsLimit: false },

  // --- ART PRE-EVENTS (Min 2, Max 5) ---
  { name: "Caricature", type: "Art", category: "Pre-Event", participation: "Individual", minTeamSize: 2, maxTeamSize: 5, maxRegistrations: 1, isPreEvent: true, countsTowardsLimit: false },
  { name: "Book Review", type: "Literary", category: "Pre-Event", participation: "Individual", minTeamSize: 2, maxTeamSize: 5, maxRegistrations: 1, isPreEvent: true, countsTowardsLimit: false },
  { name: "Pencil Drawing", type: "Art", category: "Pre-Event", participation: "Individual", minTeamSize: 2, maxTeamSize: 5, maxRegistrations: 1, isPreEvent: true, countsTowardsLimit: false },
  { name: "Turn Around", type: "General", category: "Pre-Event", participation: "Individual", minTeamSize: 2, maxTeamSize: 5, maxRegistrations: 1, isPreEvent: true, countsTowardsLimit: false },

  // --- SMALL PRE-EVENTS (Min 1, Max 3) ---
  { name: "Paper Collage", type: "Art", category: "Pre-Event", participation: "Individual", minTeamSize: 1, maxTeamSize: 3, maxRegistrations: 1, isPreEvent: true, countsTowardsLimit: false },
  { name: "Open Mic", type: "General", category: "Pre-Event", participation: "Individual", minTeamSize: 1, maxTeamSize: 3, maxRegistrations: 1, isPreEvent: true, countsTowardsLimit: false },

  // --- ON-STAGE INDIVIDUAL (House Limit: 5 Entries, Student Limit: Yes) ---
  { name: "Recitation", type: "Literary", category: "On-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 1, minRegistrations: 2, maxRegistrations: 5, countsTowardsLimit: true },
  { name: "Extempore", type: "Literary", category: "On-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 1, minRegistrations: 2, maxRegistrations: 5, countsTowardsLimit: true },
  { name: "Light Music", type: "Music", category: "On-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 1, minRegistrations: 2, maxRegistrations: 5, countsTowardsLimit: true },
  { name: "Western Vocal", type: "Music", category: "On-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 1, minRegistrations: 2, maxRegistrations: 5, countsTowardsLimit: true },
  { name: "Classical Music", type: "Music", category: "On-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 1, minRegistrations: 2, maxRegistrations: 5, countsTowardsLimit: true },
  { name: "Rap", type: "Music", category: "On-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 1, minRegistrations: 2, maxRegistrations: 5, countsTowardsLimit: true },
  { name: "Face Painting", type: "Art", category: "On-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 1, minRegistrations: 2, maxRegistrations: 5, countsTowardsLimit: true },
  { name: "Adaptune", type: "Dance", category: "On-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 1, minRegistrations: 1, maxRegistrations: 2, countsTowardsLimit: true }, // Special Rule: Max 2

  // --- COMBINED (House Limit: 3 Entries) ---
  { name: "Classical Dance", type: "Dance", category: "On-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 1, minRegistrations: 2, maxRegistrations: 3, countsTowardsLimit: true },
  { name: "Instruments", type: "Music", category: "On-Stage", participation: "Individual", minTeamSize: 1, maxTeamSize: 1, minRegistrations: 2, maxRegistrations: 3, countsTowardsLimit: true },

  // --- GROUP EVENTS (House Limit: 1 Team, Team Size: 7-10 usually) ---
  { name: "Battle of Bands", type: "Music", category: "On-Stage", participation: "Group", minTeamSize: 7, maxTeamSize: 10, maxRegistrations: 1, countsTowardsLimit: true },
  { name: "Battle of Brahmas", type: "Music", category: "On-Stage", participation: "Group", minTeamSize: 7, maxTeamSize: 10, maxRegistrations: 1, countsTowardsLimit: true },
  { name: "Nostalgia", type: "General", category: "On-Stage", participation: "Group", minTeamSize: 7, maxTeamSize: 10, maxRegistrations: 1, countsTowardsLimit: true },
  { name: "Group Folk Dance", type: "Dance", category: "On-Stage", participation: "Group", minTeamSize: 7, maxTeamSize: 10, maxRegistrations: 1, countsTowardsLimit: true },
  { name: "Prop Dance", type: "Dance", category: "On-Stage", participation: "Group", minTeamSize: 7, maxTeamSize: 10, maxRegistrations: 1, countsTowardsLimit: true },
  { name: "Thematic Dance", type: "Dance", category: "On-Stage", participation: "Group", minTeamSize: 7, maxTeamSize: 10, maxRegistrations: 1, countsTowardsLimit: true },
  { name: "Duffumuttu", type: "Dance", category: "On-Stage", participation: "Group", minTeamSize: 7, maxTeamSize: 10, maxRegistrations: 1, countsTowardsLimit: true },
  { name: "Theme Show", type: "General", category: "On-Stage", participation: "Group", minTeamSize: 7, maxTeamSize: 10, maxRegistrations: 1, countsTowardsLimit: true },
  { name: "Drama", type: "General", category: "On-Stage", participation: "Group", minTeamSize: 9, maxTeamSize: 12, maxRegistrations: 1, countsTowardsLimit: true }, // 9+3 = 12
  { name: "Mime", type: "General", category: "On-Stage", participation: "Group", minTeamSize: 6, maxTeamSize: 6, maxRegistrations: 1, countsTowardsLimit: true },
  { name: "Quiz", type: "Literary", category: "On-Stage", participation: "Group", minTeamSize: 2, maxTeamSize: 2, maxRegistrations: 1, countsTowardsLimit: true },

  // --- EXCEPTIONS (No Limits) ---
  { name: "Short Film", type: "General", category: "Off-Stage", participation: "Group", minTeamSize: 1, maxTeamSize: 10, maxRegistrations: 100, countsTowardsLimit: false },
  { name: "Adzap", type: "General", category: "On-Stage", participation: "Group", minTeamSize: 4, maxTeamSize: 8, maxRegistrations: 100, countsTowardsLimit: false },
  { name: "Making of Bharatham", type: "General", category: "Off-Stage", participation: "Group", minTeamSize: 1, maxTeamSize: 10, maxRegistrations: 100, countsTowardsLimit: false },
];

async function seed() {
  try {
    console.log("Connecting to DB...");
    await mongoose.connect(mongodbURL);
    console.log("Connected!");

    console.log("🗑️ Clearing old data...");
    await Event.deleteMany({});
    await House.deleteMany({});
    await Participant.deleteMany({});
    await Registration.deleteMany({});

    console.log("🏰 Seeding Houses...");
    const houses = await House.insertMany(
      HOUSE_NAMES.map(name => ({ name, captain: "TBD", viceCaptain: "TBD" }))
    );

    console.log("📅 Seeding Events...");
    // Add default values to events
    const processedEvents = EVENT_DATA.map(e => ({
      ...e,
      date: e.date || "TBD",
      venue: "Main Stage",
      registrationEnabled: true
    }));
    await Event.insertMany(processedEvents);

    console.log("🎓 Seeding Participants...");
    const participants = [];
    let uidCounter = 1;

    for (const house of HOUSE_NAMES) {
      for (let i = 0; i < STUDENTS_PER_HOUSE; i++) {
        const uid = `U2025${String(uidCounter).padStart(3, '0')}`;
        participants.push({
          fullName: `${house} Student ${i + 1}`,
          uid: uid,
          branch: "CSE",
          semester: "S6",
          house: house,
          individual: 0,
          group: 0,
          literary: 0
        });
        uidCounter++;
      }
    }
    await Participant.insertMany(participants);

    console.log("✅ Seeding Complete!");
    console.log(`- ${HOUSE_NAMES.length} Houses`);
    console.log(`- ${processedEvents.length} Events`);
    console.log(`- ${participants.length} Participants`);
    
    process.exit();
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

seed();