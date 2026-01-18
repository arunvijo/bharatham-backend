import mongoose from "mongoose";
import { Registration } from "../models/registrationModel.js";
import { Event } from "../models/eventModel.js";
import { mongodbURL } from "../config.js";

const unpackRegistrations = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(mongodbURL);
    console.log("✅ Connected.");

    // 1. Find all events that are meant to be "Individual"
    const individualEvents = await Event.find({ participation: "Individual" });
    const individualEventNames = individualEvents.map(e => e.name);

    console.log(`🔍 Found ${individualEvents.length} Individual Events. Checking for bulk entries...`);

    let unpackedCount = 0;
    let deletedCount = 0;

    // 2. Loop through each Individual Event
    for (const eventName of individualEventNames) {
      
      // Find registrations for this event that have MORE than 1 participant
      const bulkRegistrations = await Registration.find({
        event: eventName,
        $expr: { $gt: [{ $size: "$participants" }, 1] } 
      });

      if (bulkRegistrations.length > 0) {
        console.log(`   -> Found ${bulkRegistrations.length} bulk entries in '${eventName}'`);

        for (const reg of bulkRegistrations) {
          const students = reg.participants;
          const house = reg.house;

          console.log(`      📦 Unpacking ${house} entry (${students.length} students)...`);

          // 3. Create a NEW separate registration for each student
          const newRegistrations = students.map(student => ({
            event: eventName,
            house: house,
            participants: [student] // Array of 1
          }));

          // Bulk Insert the new single entries
          if (newRegistrations.length > 0) {
            await Registration.insertMany(newRegistrations);
            unpackedCount += newRegistrations.length;
          }

          // 4. Delete the old "Bulk" registration
          await Registration.findByIdAndDelete(reg._id);
          deletedCount++;
        }
      }
    }

    console.log("------------------------------------------------");
    console.log(`🎉 MIGRATION COMPLETE`);
    console.log(`   - Deleted ${deletedCount} bulk groups.`);
    console.log(`   - Created ${unpackedCount} individual registrations.`);
    console.log("------------------------------------------------");
    
    // NOTE: We do NOT update Student Counters (Participant Model) 
    // because the student is still registered for the same 1 event. 
    // Their "3/5" count remains valid.

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

unpackRegistrations();