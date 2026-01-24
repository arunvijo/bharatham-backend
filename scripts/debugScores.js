import mongoose from 'mongoose';
import { Score } from "../models/scoreModel.js"; 
import { Event } from "../models/eventModel.js"; 
import { mongodbURL } from "../config.js"; 

const masterFix = async () => {
    try {
        console.log("🔌 Connecting to DB...");
        if (!mongodbURL) {
            throw new Error("❌ mongodbURL is undefined. Check ../config.js");
        }
        await mongoose.connect(mongodbURL);
        console.log("✅ Connected. Starting Master Fix...");

        const scores = await Score.find({});
        console.log(`🔍 Found ${scores.length} scores to process.`);

        let updatedCount = 0;
        let groupCount = 0;

        for (const score of scores) {
            // 1. Determine Event Name (Try multiple places)
            let eventName = "";
            
            // Check A: event.name exists?
            if (score.event && score.event.name) {
                eventName = score.event.name;
            } 
            // Check B: event is just a string?
            else if (typeof score.event === 'string') {
                eventName = score.event;
            }
            // Check C: Fallback to registration.event (Reliable based on your screenshot)
            else if (score.registration && score.registration.event) {
                eventName = score.registration.event;
            }

            if (!eventName) {
                console.log(`⚠️ Skipping Score ID ${score._id}: Could not find Event Name.`);
                continue;
            }

            // 2. Find Master Event Details
            const eventDetails = await Event.findOne({ 
                name: { $regex: new RegExp(`^${eventName}$`, 'i') } 
            });

            if (eventDetails) {
                // 3. Construct Complete Event Object
                const completeEventData = {
                    name: eventDetails.name, // Use canonical name from Master
                    participation: eventDetails.participation, // e.g., "Individual"
                    category: eventDetails.category,         // e.g., "Literary"
                    type: eventDetails.type,
                    id: eventDetails._id
                };

                // 4. Update the Score
                score.event = completeEventData;
                score.markModified('event'); // Force Mongoose to recognize the change
                await score.save();
                
                updatedCount++;
                if (eventDetails.participation === 'Group') groupCount++;
                // process.stdout.write("."); // Un-comment for progress dots
            } else {
                console.log(`❌ Master Event not found for: "${eventName}" (Score ID: ${score._id})`);
            }
        }

        console.log("\n\n==================================================");
        console.log(`✅ COMPLETE! Processed ${updatedCount} scores.`);
        console.log(`   - Identified ${groupCount} Group scores.`);
        console.log(`   - Identified ${updatedCount - groupCount} Individual scores.`);
        console.log("==================================================");
        console.log("👉 NOW run 'node scripts/findChampions.js' to see the winners.");

    } catch (error) {
        console.error("❌ Critical Error:", error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

masterFix();