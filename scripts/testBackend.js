import axios from "axios";
import mongoose from "mongoose";
import { mongodbURL } from "../config.js";
import { Participant } from "../models/participantModel.js";

const API_URL = "http://localhost:5555"; // Make sure your server is running here!

const color = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  reset: "\x1b[0m",
  yellow: "\x1b[33m"
};

async function runTests() {
  console.log("🚀 Starting Chaos Test on Backend Rules...\n");

  // 1. Get a Test Student
  await mongoose.connect(mongodbURL);
  const student = await Participant.findOne({ house: "Rajputs" });
  if (!student) {
    console.log("❌ No students found. Run seedSystem.js first!");
    process.exit(1);
  }
  console.log(`Testing with Student: ${student.fullName} (${student.uid})`);
  
  // --- TEST 1: INDIVIDUAL LIMIT (MAX 5) ---
  console.log(`\n${color.yellow}--- Test 1: Individual Limit (Max 5) ---${color.reset}`);
  const indEvents = ["Recitation", "Extempore", "Light Music", "Western Vocal", "Classical Music", "Rap"];
  
  for (let i = 0; i < indEvents.length; i++) {
    const eventName = indEvents[i];
    try {
      await axios.post(`${API_URL}/registration`, {
        event: eventName,
        house: "Rajputs",
        participants: [{ _id: student._id }]
      });
      console.log(`${color.green}✔ Registered for ${eventName} (${i + 1}/5)${color.reset}`);
    } catch (err) {
      if (i === 5) {
        console.log(`${color.green}✔ CORRECTLY BLOCKED 6th Event: ${err.response?.data?.message}${color.reset}`);
      } else {
        console.log(`${color.red}❌ Failed unexpected: ${err.response?.data?.message}${color.reset}`);
      }
    }
  }

  // --- TEST 2: HOUSE LIMIT (MAX 1 TEAM) ---
  console.log(`\n${color.yellow}--- Test 2: House Limit (Max 1 Team per Group Event) ---${color.reset}`);
  // Get 7 students for a group dance
  const teamMembers = await Participant.find({ house: "Rajputs" }).limit(7);
  const team = teamMembers.map(p => ({ _id: p._id }));

  try {
    // First Registration
    await axios.post(`${API_URL}/registration`, {
      event: "Group Folk Dance",
      house: "Rajputs",
      participants: team
    });
    console.log(`${color.green}✔ Team 1 Registered for Group Folk Dance${color.reset}`);

    // Second Registration (Should Fail)
    await axios.post(`${API_URL}/registration`, {
      event: "Group Folk Dance",
      house: "Rajputs",
      participants: team
    });
    console.log(`${color.red}❌ Error: Backend allowed 2nd team!${color.reset}`);
  } catch (err) {
    console.log(`${color.green}✔ CORRECTLY BLOCKED 2nd Team: ${err.response?.data?.message}${color.reset}`);
  }

  // --- TEST 3: LANGUAGE RULE (LITERARY) ---
  console.log(`\n${color.yellow}--- Test 3: Language Diversity (Essay Writing) ---${color.reset}`);
  const essayStudents = await Participant.find({ house: "Spartans" }).limit(10);
  const essayTeamSingleLang = essayStudents.map(p => ({ _id: p._id, language: "English" }));
  const essayTeamMultiLang = essayStudents.map((p, idx) => ({ 
    _id: p._id, 
    language: idx === 0 ? "Malayalam" : "English" // Mixed
  }));

  // Attempt 1: All English (Should Fail)
  try {
    await axios.post(`${API_URL}/registration`, {
      event: "Essay Writing",
      house: "Spartans",
      participants: essayTeamSingleLang
    });
    console.log(`${color.red}❌ Error: Backend allowed single language!${color.reset}`);
  } catch (err) {
    console.log(`${color.green}✔ CORRECTLY BLOCKED Single Language: ${err.response?.data?.message}${color.reset}`);
  }

  // Attempt 2: Mixed (Should Pass)
  try {
    await axios.post(`${API_URL}/registration`, {
      event: "Essay Writing",
      house: "Spartans",
      participants: essayTeamMultiLang
    });
    console.log(`${color.green}✔ Mixed Languages Registered successfully${color.reset}`);
  } catch (err) {
    console.log(`${color.red}❌ Failed mixed language: ${err.response?.data?.message}${color.reset}`);
  }

  console.log("\n------------------------------------------------");
  console.log("Test Run Complete. Check console for any red flags.");
  process.exit();
}

runTests();