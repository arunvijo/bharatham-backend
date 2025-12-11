// New file: scripts/clearRegistrations.js
import mongoose from "mongoose";
import { Registration } from "../models/registrationModel.js";
import { Score } from "../models/scoreModel.js"; 
import { Participant } from "../models/participantModel.js"; // To reset counters
import { mongodbURL } from "../config.js";

async function clearRegsAndCounters() {
  try {
    await mongoose.connect(mongodbURL);
    console.log("🔌 Connected to DB. Clearing data...");

    // 1. Clear Registrations
    await Registration.deleteMany({});
    console.log("✅ Cleared all Registrations.");

    // 2. Clear Scores (Crucial, as scores depend on registrations)
    await Score.deleteMany({});
    console.log("✅ Cleared all Scores.");

    // 3. Reset Participant Counters (Crucial for test integrity)
    await Participant.updateMany({}, { individual: 0, group: 0, literary: 0 });
    console.log("✅ Reset all Participant counters (individual, group, literary) to 0.");

    process.exit();
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

clearRegsAndCounters();