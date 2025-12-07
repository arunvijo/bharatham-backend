import mongoose from "mongoose";
import { House } from "../models/houseModel.js";
import { mongodbURL } from "../config.js";

// --- REPLACE THIS WITH YOUR AUTH0 NICKNAME ---
// Check your frontend console log(user.nickname) if unsure.
// Usually it's your email prefix (e.g., 'arunvijo' from arunvijo@gmail.com)
const MY_USERNAME = "u2203052"; 
const HOUSE_TO_LEAD = "Mughals"; // Change this to your house name

async function assign() {
  try {
    await mongoose.connect(mongodbURL);
    console.log("🔌 Connected to DB");

    const updated = await House.findOneAndUpdate(
      { name: HOUSE_TO_LEAD },
      { captain: MY_USERNAME },
      { new: true }
    );

    if (updated) {
      console.log(`✅ SUCCESS! User '${MY_USERNAME}' is now Captain of ${HOUSE_TO_LEAD}.`);
    } else {
      console.log(`❌ Failed. House '${HOUSE_TO_LEAD}' not found.`);
    }

    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

assign();