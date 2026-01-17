import mongoose from "mongoose";
import { Event } from "../models/eventModel.js";
import { mongodbURL } from "../config.js";

const closeRegistrations = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(mongodbURL);
    console.log("✅ Connected.");

    console.log("🔒 Locking registrations (except Movie scene dubbing)...");

    // 1. Disable registration for EVERYONE except "Movie scene dubbing"
    const result = await Event.updateMany(
      { name: { $ne: "Movie scene dubbing" } }, // Condition: Name is NOT "Movie scene dubbing"
      { $set: { registrationEnabled: false } }  // Action: Set enabled to FALSE
    );

    // 2. Explicitly ensure "Movie scene dubbing" is OPEN (Optional safety step)
    await Event.updateOne(
      { name: "Movie scene dubbing" },
      { $set: { registrationEnabled: true } }
    );

    console.log(`✅ OPERATION COMPLETE.`);
    console.log(`   - Closed ${result.modifiedCount} events.`);
    console.log(`   - "Movie scene dubbing" remains OPEN.`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

closeRegistrations();