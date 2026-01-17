import mongoose from "mongoose";
import { Participant } from "../models/participantModel.js";
import { Registration } from "../models/registrationModel.js";
import { Event } from "../models/eventModel.js";
import { mongodbURL } from "../config.js";

async function sync() {
  try {
    console.log("🔌 Connecting to DB...");
    await mongoose.connect(mongodbURL);

    console.log("🔄 Fetching Data...");
    const allParticipants = await Participant.find({});
    const allEvents = await Event.find({});
    
    // Create a map of EventName -> countsTowardsLimit (boolean)
    const eventRules = {};
    allEvents.forEach(e => {
        eventRules[e.name] = e.countsTowardsLimit;
    });

    console.log(`📊 Found ${allParticipants.length} participants. Recalculating...`);

    for (const p of allParticipants) {
        // Find all registrations for this student
        // We look for registrations where this student's ID is in the participants list
        const regs = await Registration.find({ "participants.uid": p.uid });

        let newIndCount = 0;
        let newGroupCount = 0;

        for (const reg of regs) {
            const eventName = reg.event;
            const counts = eventRules[eventName]; // True or False

            // Only increment if the event currently counts towards limit
            if (counts) {
                // Find event type from the event object (or query it if needed, but we have allEvents)
                const eventObj = allEvents.find(e => e.name === eventName);
                if (eventObj) {
                    if (eventObj.participation === "Individual") newIndCount++;
                    if (eventObj.participation === "Group") newGroupCount++;
                }
            }
        }

        // Update if different
        if (p.individual !== newIndCount || p.group !== newGroupCount) {
            await Participant.findByIdAndUpdate(p._id, {
                individual: newIndCount,
                group: newGroupCount
            });
            console.log(`✅ Fixed ${p.fullName}: Ind ${p.individual}->${newIndCount} | Grp ${p.group}->${newGroupCount}`);
        }
    }

    console.log("🎉 Sync Complete!");
    process.exit();

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

sync();