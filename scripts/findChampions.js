import mongoose from 'mongoose';
import { Score } from "../models/scoreModel.js";
import { mongodbURL } from "../config.js";

const findTopScorers = async () => {
  try {
    console.log("🔌 Connecting to DB...");
    await mongoose.connect(mongodbURL);
    console.log("✅ Connected. Calculating Top Individual Scorers...\n");

    const candidates = await Score.aggregate([
      // -------------------------------------------------------------
      // 1. FILTER: Individual Events Only & Valid Positions
      // Excludes "B Grade", "Participation", "Negative"
      // -------------------------------------------------------------
      {
        $match: {
          // Case-insensitive match for 'Individual'
          "event.participation": { $regex: /^individual$/i },
          "position": { 
             $in: ["First", "Second", "Third", "A Grade", "1st", "2nd", "3rd"] 
          }
        }
      },

      // -------------------------------------------------------------
      // 2. GROUP BY STUDENT
      // -------------------------------------------------------------
      {
        $group: {
          // Use UID from registration if available, otherwise grouping might be tricky
          // We use the first participant in the array (Individual events usually have 1)
          _id: { $arrayElemAt: ["$registration.participants.uid", 0] },
          
          name: { $first: { $arrayElemAt: ["$registration.participants.fullName", 0] } },
          house: { $first: "$house" },
          
          // Collect all unique domains (e.g., "Literary", "Music", "Dance")
          domains: { $addToSet: "$event.category" },
          
          // Sum the points
          totalPoints: { $sum: "$points" }
        }
      },

      // -------------------------------------------------------------
      // 3. SORT & LIMIT
      // -------------------------------------------------------------
      { $sort: { totalPoints: -1 } },
      { $limit: 20 }
    ]);

    // -------------------------------------------------------------
    // 4. DISPLAY RESULTS
    // -------------------------------------------------------------
    console.log("🏆 TOP 20 INDIVIDUAL SCORERS");
    console.log("==========================================================================================");
    console.log(
      String("NAME").padEnd(30) + 
      String("HOUSE").padEnd(15) + 
      String("PTS").padEnd(8) + 
      String("DOMAINS (Need 2+ to Qualify)")
    );
    console.log("------------------------------------------------------------------------------------------");

    if (candidates.length === 0) {
        console.log("⚠️ No candidates found. Ensure scores are marked as 'Individual' in the database.");
    }

    candidates.forEach(c => {
      const name = c.name || "Unknown";
      const house = c.house || "Unknown";
      const points = c.totalPoints || 0;
      const domains = c.domains.length > 0 ? c.domains.join(", ") : "None";
      
      console.log(
        String(name).substring(0, 29).padEnd(30) + 
        String(house).padEnd(15) + 
        String(points).padEnd(8) + 
        domains
      );
    });

    console.log("==========================================================================================");
    console.log("👉 ACTION: Identify the Top Male (Kalaprathiba) and Top Female (Kalathilakam).");
    console.log("   Note: Strictly speaking, they should have points in at least 2 distinct domains.");
    console.log("==========================================================================================\n");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
};

findTopScorers();