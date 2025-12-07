import mongoose from "mongoose";
import { House } from "../models/houseModel.js"; // Ensure path is correct
import { mongodbURL } from "../config.js";       // Ensure path is correct

// --- CONFIGURATION ---
// Add all the Auth0 nicknames you want to be Admins here
const ADMIN_LIST = [
  "abhishikthsmattam",
  "arunvijo2004",
]; 

async function makeAdmins() {
  try {
    await mongoose.connect(mongodbURL);
    console.log("🔌 Connected to DB");

    for (const username of ADMIN_LIST) {
      // We search by 'captain' (user) instead of 'name' (house).
      // This ensures we create/update the record specific to THIS user,
      // without overwriting other admins.
      const adminHouse = await House.findOneAndUpdate(
        { captain: username }, 
        { 
          name: "Admin",
          captain: username,
          viceCaptain: "System",
          points: 0 
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`✅ SUCCESS: '${username}' is now an Admin.`);
    }

    console.log("🎉 All admins processed.");
    process.exit();
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

makeAdmins();