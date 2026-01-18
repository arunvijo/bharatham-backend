import mongoose from "mongoose";
import { Event } from "../models/eventModel.js";
import { mongodbURL } from "../config.js";

const openMainEvents = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(mongodbURL);
    console.log("✅ Connected.");

    console.log("🔓 Unlocking Main Events...");

    // 1. Enable registration for all events that are NOT "Pre-Event"
    const result = await Event.updateMany(
      { 
        // Condition: Category is NOT "Pre-Event" (adjust string if your category name differs, e.g. "Pre Event")
        category: { $ne: "Pre-Event" } 
      }, 
      { $set: { registrationEnabled: true } }  // Action: Set enabled to TRUE
    );

    console.log(`✅ OPERATION COMPLETE.`);
    console.log(`   - Opened ${result.modifiedCount} Main Events.`);
    console.log(`   - (Pre-Events remain unchanged/closed)`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

openMainEvents();