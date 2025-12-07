import axios from "axios";
import mongoose from "mongoose";
import { Participant } from "../models/participantModel.js";
import { mongodbURL } from "../config.js";

const API_URL = "http://localhost:5555";
const HOUSES = ["Rajputs", "Spartans", "Vikings", "Mughals", "Aryans"];

async function seed() {
  console.log("🚀 Starting Mass Registration...");
  await mongoose.connect(mongodbURL);

  for (const house of HOUSES) {
    console.log(`\n--- Processing House: ${house} ---`);
    
    // 1. Get Students
    const students = await Participant.find({ house });
    if (students.length < 15) continue;

    // SCENARIO A: Individual Event (Light Music)
    // Register 3 students
    try {
      for(let i=0; i<3; i++) {
        await axios.post(`${API_URL}/registration`, {
          event: "Light Music",
          house: house,
          participants: [{ _id: students[i]._id }]
        });
        process.stdout.write("🎵 ");
      }
    } catch(e) { process.stdout.write("x"); }

    // SCENARIO B: Group Event (Group Folk Dance)
    // Register 1 Team of 8 students
    try {
      const team = students.slice(3, 11).map(s => ({ _id: s._id }));
      await axios.post(`${API_URL}/registration`, {
        event: "Group Folk Dance",
        house: house,
        participants: team
      });
      process.stdout.write("💃 ");
    } catch(e) { process.stdout.write("x"); }

    // SCENARIO C: Literary Event (Essay Writing) - Mixed Languages
    // Register 10 students (5 English, 5 Malayalam)
    try {
      const essayTeam = students.slice(5, 15).map((s, idx) => ({
        _id: s._id,
        language: idx < 5 ? "English" : "Malayalam"
      }));
      
      await axios.post(`${API_URL}/registration`, {
        event: "Essay Writing",
        house: house,
        participants: essayTeam
      });
      process.stdout.write("✍️ ");
    } catch(e) { process.stdout.write("x"); }
  }

  console.log("\n\n✅ Population Complete!");
  process.exit();
}

seed();