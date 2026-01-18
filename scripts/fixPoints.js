import mongoose from "mongoose";
import { Score } from "../models/scoreModel.js";
import { mongodbURL } from "../config.js";

const fixPoints = async () => {
  try {
    await mongoose.connect(mongodbURL);
    console.log("🔌 DB Connected. Fixing Points...");

    const scores = await Score.find({});
    let fixedCount = 0;

    for (const s of scores) {
      // Check if points is a string or invalid type
      if (typeof s.points !== 'number') {
        const num = Number(s.points);
        if (!isNaN(num)) {
          s.points = num;
          await s.save();
          fixedCount++;
          console.log(`✅ Fixed score for ${s.house} (${s.event.name}): ${num} pts`);
        }
      }
    }

    console.log(`🎉 Done. Fixed ${fixedCount} records.`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

fixPoints();