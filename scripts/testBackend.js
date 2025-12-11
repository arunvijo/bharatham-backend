import axios from "axios";
import mongoose from "mongoose";
import { mongodbURL } from "../config.js";
import { Participant } from "../models/participantModel.js";
import { Event } from "../models/eventModel.js";
import { Registration } from "../models/registrationModel.js";

const API_URL = "http://localhost:5555"; // Make sure your server is running here!

const color = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  reset: "\x1b[0m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m"
};

// Helper function to extract and check error message
const checkError = (err, expectedMsgPart, testName) => {
    const msg = err.response?.data?.message || err.message;
    if (msg.includes(expectedMsgPart)) {
        console.log(`${color.green}✔ ${testName} - CORRECTLY BLOCKED: ${msg}${color.reset}`);
        return true;
    }
    console.log(`${color.red}❌ ${testName} - FAILED UNEXPECTEDLY: ${msg}${color.reset}`);
    return false;
};

async function runTests() {
  console.log("🚀 Starting Comprehensive Test on Backend Rules...\n");

  // 1. Setup & Get Test Data
  await mongoose.connect(mongodbURL);
  
  // Clean up registrations before test to ensure clear slate
  await Registration.deleteMany({});
  
  // Find test students
  const testHouse = "Rajputs";
  const allStudents = await Participant.find({ house: testHouse }).limit(15);
  const studentInd = allStudents[0];
  
  const studentIndID = studentInd ? studentInd._id : null;
  const teamMembersIndIDs = allStudents.map(p => ({ _id: p._id, uid: p.uid }));
  
  if (!studentInd || allStudents.length < 15) {
    console.log("❌ Insufficient student data. Run seedSystem.js and importCSVs.js first!");
    process.exit(1);
  }
  console.log(`${color.cyan}Testing with Base Student: ${studentInd.fullName} (${studentInd.uid})${color.reset}`);
  
  // Reset Individual & Group counters for the test students (Initial clean)
  await Participant.updateMany({ house: testHouse }, { individual: 0, group: 0, literary: 0 });

  // Define test teams with correct minimum sizes
  const largeGroupTeam = teamMembersIndIDs.slice(0, 7); // Min 7 for many Group events
  const smallCombinedTeam = teamMembersIndIDs.slice(0, 2); // Min 2 for Classical Dance
  const exceptionTeam = teamMembersIndIDs.slice(0, 4); // Min 4 for Adzap


  // --- TEST 1: INDIVIDUAL LIMIT (MAX 5) ---
  console.log(`\n${color.yellow}--- Test 1: Individual Limit (Max 5) ---${color.reset}`);
  const indEvents = ["Recitation", "Extempore", "Light Music", "Western Vocal", "Classical Music"]; // 5 events
  
  // a) Register 5 events (Should Pass)
  for (let i = 0; i < indEvents.length; i++) {
    const eventName = indEvents[i];
    try {
      await axios.post(`${API_URL}/registration`, {
        event: eventName,
        house: testHouse,
        participants: [{ _id: studentIndID }]
      });
      console.log(`${color.green}✔ Registered for ${eventName} (${i + 1}/5)${color.reset}`);
    } catch (err) {
      console.log(`${color.red}❌ Failed unexpectedly: ${eventName} - ${err.response?.data?.message}${color.reset}`);
    }
  }

  // b) Register 6th event (Should Fail)
  try {
      await axios.post(`${API_URL}/registration`, {
        event: "Rap", // 6th event
        house: testHouse,
        participants: [{ _id: studentIndID }]
      });
      console.log(`${color.red}❌ Error: Backend allowed 6th individual event!${color.reset}`);
  } catch (err) {
      checkError(err, "Limit Reached: Participant", "Ind. Limit Block");
  }

  // --- TEST 2: GROUP LIMIT (MAX 3) & EXCEPTIONS ---
  console.log(`\n${color.yellow}--- Test 2: Group Limit (Max 3) & Exceptions ---${color.reset}`);
  // Reset individual counters to avoid carrying over, but preserve group data for the next test part
  await Participant.findByIdAndUpdate(studentIndID, { individual: 0, literary: 0 });
  
  const groupEvents = ["Battle of bands", "Prop Dance", "Thematic Dance", "Group Folk Dance"];
  
  // a) Register 3 group events (Should Pass)
  for (let i = 0; i < 3; i++) {
    const eventName = groupEvents[i];
    try {
      await axios.post(`${API_URL}/registration`, {
        event: eventName,
        house: testHouse,
        participants: largeGroupTeam
      });
      console.log(`${color.green}✔ Registered for ${eventName} (${i + 1}/3)${color.reset}`);
    } catch (err) {
      console.log(`${color.red}❌ Failed unexpectedly: ${eventName} - ${err.response?.data?.message}${color.reset}`);
    }
  }

  // b) Register 4th event (Should Fail, as studentIndID is in largeGroupTeam and should be at limit)
  try {
      await axios.post(`${API_URL}/registration`, {
        event: groupEvents[3], // 4th event
        house: testHouse,
        participants: largeGroupTeam
      });
      console.log(`${color.red}❌ Error: Backend allowed 4th group event!${color.reset}`);
  } catch (err) {
      checkError(err, "Limit Reached: Participant", "Group Limit Block");
  }
  
  // c) Register Exception Event (Should always Pass, even if student is maxed out on Group count)
  const exceptionEvent = "Adzap";
  try {
      await axios.post(`${API_URL}/registration`, {
          event: exceptionEvent,
          house: testHouse,
          participants: exceptionTeam 
      });
      console.log(`${color.green}✔ Passed: Registered for ${exceptionEvent} (Exception Event).${color.reset}`);
  } catch (err) {
      console.log(`${color.red}❌ Failed: Blocked exception event ${exceptionEvent} - ${err.response?.data?.message}${color.reset}`);
  }
  
  // --- TEST 3: TEAM SIZE LIMITS (Drama: Min 9, Max 12) ---
  console.log(`\n${color.yellow}--- Test 3: Team Size Limits (Drama: Min 9, Max 12) ---${color.reset}`);
  
  // *** FIX: RESET GROUP COUNTERS FOR ALL TESTED STUDENTS BEFORE RUNNING THIS TEST ***
  // This ensures the 5/3 limits from Test 1 & 2 don't interfere with this Team Size test.
  await Participant.updateMany({ house: testHouse }, { individual: 0, group: 0, literary: 0 });

  const dramaEvent = "Drama";

  // a) Too Small (8 members)
  try {
      const teamTooSmall = teamMembersIndIDs.slice(0, 8);
      await axios.post(`${API_URL}/registration`, {
          event: dramaEvent,
          house: testHouse,
          participants: teamTooSmall
      });
      console.log(`${color.red}❌ Error: Allowed team too small (8)!${color.reset}`);
  } catch (err) {
      checkError(err, "between 9 and 12 participants", "Team Size Min Block");
  }

  // b) Too Large (13 members)
  try {
      const teamTooLarge = teamMembersIndIDs.slice(0, 13);
      await axios.post(`${API_URL}/registration`, {
          event: dramaEvent,
          house: testHouse,
          participants: teamTooLarge
      });
      console.log(`${color.red}❌ Error: Allowed team too large (13)!${color.reset}`);
  } catch (err) {
      checkError(err, "between 9 and 12 participants", "Team Size Max Block");
  }

  // c) Valid Size (10 members)
  try {
      const teamValid = teamMembersIndIDs.slice(0, 10);
      await axios.post(`${API_URL}/registration`, {
          event: dramaEvent,
          house: testHouse,
          participants: teamValid
      });
      console.log(`${color.green}✔ Passed: Registered valid team size (10).${color.reset}`);
  } catch (err) {
      console.log(`${color.red}❌ Failed unexpectedly: Valid team blocked - ${err.response?.data?.message}${color.reset}`);
  }
  
  // --- TEST 4: LITERARY DIVERSITY RULE (Essay Writing) ---
  console.log(`\n${color.yellow}--- Test 4: Literary Diversity (2+ Languages) ---${color.reset}`);
  // Reset counters/registrations again to ensure fresh test environment
  await Registration.deleteMany({});
  await Participant.updateMany({ house: testHouse }, { individual: 0, group: 0, literary: 0 });

  const literaryEvent = "Essay Writing"; // Min 10, Max 15
  
  // a) Single Language (Min 10 students, all English - Should Fail)
  try {
    const teamSingleLang = teamMembersIndIDs.slice(0, 10).map(p => ({ ...p, language: "English" }));
    await axios.post(`${API_URL}/registration`, {
      event: literaryEvent,
      house: testHouse,
      participants: teamSingleLang
    });
    console.log(`${color.red}❌ Error: Allowed single language team!${color.reset}`);
  } catch (err) {
    checkError(err, "at least 2 different languages", "Literary Language Block");
  }

  // b) Multiple Languages (Min 10 students, English + Malayalam - Should Pass)
  try {
    const teamMultiLang = teamMembersIndIDs.slice(5, 15).map((p, idx) => ({ 
      ...p, 
      language: idx < 5 ? "English" : "Malayalam" // 5 English, 5 Malayalam
    }));
    await axios.post(`${API_URL}/registration`, {
      event: literaryEvent,
      house: testHouse,
      participants: teamMultiLang
    });
    console.log(`${color.green}✔ Passed: Registered multi-language team (10 members).${color.reset}`);
  } catch (err) {
    console.log(`${color.red}❌ Failed unexpectedly: Multi-language team blocked - ${err.response?.data?.message}${color.reset}`);
  }

  // --- TEST 5: HOUSE MAX REGISTRATION LIMIT (Classical Dance: Max 3) ---
  console.log(`\n${color.yellow}--- Test 5: House Max Reg Limit (Classical Dance: Max 3) ---${color.reset}`);
  // Reset counters/registrations again to ensure fresh test environment
  await Registration.deleteMany({});
  await Participant.updateMany({ house: testHouse }, { individual: 0, group: 0, literary: 0 });

  const houseLimitEvent = "Classical Dance forms"; // MaxRegs = 3, MinTeam=2, MaxTeam=3
  
  // a) Register 3 times (Should Pass)
  for (let i = 0; i < 3; i++) {
      try {
          await axios.post(`${API_URL}/registration`, {
              event: houseLimitEvent,
              house: testHouse,
              participants: smallCombinedTeam
          });
          console.log(`${color.green}✔ Registered for ${houseLimitEvent} (${i + 1}/3)${color.reset}`);
      } catch (err) {
          console.log(`${color.red}❌ Failed unexpectedly: ${houseLimitEvent} - ${err.response?.data?.message}${color.reset}`);
      }
  }

  // b) Register 4th time (Should Fail)
  try {
      await axios.post(`${API_URL}/registration`, {
          event: houseLimitEvent,
          house: testHouse,
          participants: smallCombinedTeam
      });
      console.log(`${color.red}❌ Error: Backend allowed 4th registration!${color.reset}`);
  } catch (err) {
      checkError(err, "registered the maximum number of times (3)", "House Max Reg Block");
  }

  console.log("\n------------------------------------------------");
  console.log("Test Run Complete. Check console for any red flags.");
  process.exit(0);
}

runTests();