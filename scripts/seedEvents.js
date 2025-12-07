import mongoose from "mongoose";
import { Event } from "../models/eventModel.js"; // Adjust path if needed
import { mongodbURL } from "../config.js"; // Adjust path if needed

// EVENT DATA BASED ON PDF & CSV
const events = [
  // --- PRE EVENTS (House Limit: 1 bulk entry per house) ---
  {
    name: "Essay Writing",
    participation: "Individual", // Counted as individual for student stats
    type: "Literary",
    category: "Pre-Event",
    date: "TBD",
    minTeamSize: 10,  // PDF: Min 10
    maxTeamSize: 15,  // PDF: Max 15
    maxRegistrations: 1, // House submits 1 list
    isPreEvent: true,
    countsTowardsLimit: false, // Pre-events don't count to 5/3 limit
  },
  {
    name: "Short Story",
    participation: "Individual",
    type: "Literary",
    category: "Pre-Event",
    date: "TBD",
    minTeamSize: 10,
    maxTeamSize: 15,
    maxRegistrations: 1,
    isPreEvent: true,
    countsTowardsLimit: false,
  },
  {
    name: "Poetry",
    participation: "Individual",
    type: "Literary",
    category: "Pre-Event",
    date: "TBD",
    minTeamSize: 10,
    maxTeamSize: 15,
    maxRegistrations: 1,
    isPreEvent: true,
    countsTowardsLimit: false,
  },
  {
    name: "Caricature",
    participation: "Individual",
    type: "Art",
    category: "Pre-Event",
    date: "TBD",
    minTeamSize: 2, // PDF: Min 2
    maxTeamSize: 5, // PDF: Max 5
    maxRegistrations: 1, 
    isPreEvent: true,
    countsTowardsLimit: false,
  },
  
  // --- ON DAY INDIVIDUAL (House Limit: Multiple entries allowed) ---
  // PDF: Individual Min 2, Max 5 (Means House must send 2-5 students)
  {
    name: "Recitation",
    participation: "Individual",
    type: "Literary",
    category: "On-Stage",
    date: "Day 1",
    minTeamSize: 1,
    maxTeamSize: 1,
    minRegistrations: 2, // House limit
    maxRegistrations: 5, // House limit
    countsTowardsLimit: true, // Counts to 5 limit
  },
  {
    name: "Extempore",
    participation: "Individual",
    type: "Literary",
    category: "On-Stage",
    date: "Day 1",
    minTeamSize: 1,
    maxTeamSize: 1,
    minRegistrations: 2,
    maxRegistrations: 5,
    countsTowardsLimit: true,
  },
   {
    name: "Light Music",
    participation: "Individual",
    type: "Music",
    category: "On-Stage",
    date: "Day 1",
    minTeamSize: 1,
    maxTeamSize: 1,
    minRegistrations: 2,
    maxRegistrations: 5,
    countsTowardsLimit: true,
  },
  
  // --- ON DAY GROUP (House Limit: Usually 1 team) ---
  // PDF: Group Min 7, Max 10
  {
    name: "Battle of Bands",
    participation: "Group",
    type: "Music",
    category: "On-Stage",
    date: "Day 2",
    minTeamSize: 7,
    maxTeamSize: 10,
    maxRegistrations: 1,
    countsTowardsLimit: true, // Counts to 3 limit
  },
  {
    name: "Group Folk Dance",
    participation: "Group",
    type: "Dance",
    category: "On-Stage",
    date: "Day 2",
    minTeamSize: 7,
    maxTeamSize: 10,
    maxRegistrations: 1,
    countsTowardsLimit: true,
  },
  
  // --- EXCEPTIONS (Do not count to limit) ---
  {
    name: "Short Film",
    participation: "Group",
    type: "General",
    category: "Off-Stage",
    date: "Pre",
    minTeamSize: 1,
    maxTeamSize: 10,
    countsTowardsLimit: false, // PDF Rule 4
  },
  {
    name: "Adzap",
    participation: "Group",
    type: "General",
    category: "On-Stage",
    date: "Day 1",
    minTeamSize: 4, 
    maxTeamSize: 8,
    countsTowardsLimit: false, // PDF Rule 4
  }
];

mongoose
  .connect(mongodbURL)
  .then(async () => {
    console.log("App connected to database");
    
    // Clear existing events (Optional: Be careful!)
    // await Event.deleteMany({}); 

    for (const event of events) {
      // Update if exists, Create if not
      await Event.findOneAndUpdate({ name: event.name }, event, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      });
      console.log(`Processed: ${event.name}`);
    }
    
    console.log("Seeding Complete!");
    process.exit();
  })
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });