import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import pdf from "pdf-extraction"; // New library
import { Participant } from "../models/participantModel.js";
import { mongodbURL } from "../config.js";

const DATA_DIR = path.join(process.cwd(), "../student_data"); 

async function importPDF() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(mongodbURL);
    
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith(".pdf"));
    if (files.length === 0) {
      console.log("⚠️ No PDF files found.");
      process.exit(0);
    }

    let totalAdded = 0;

    for (const file of files) {
      console.log(`\n--------------------------------------------------`);
      console.log(`📄 Processing PDF: ${file}`);
      
      // Metadata Guessing
      let semester = "S3"; // 2024 batch -> S3
      let branch = "AEI";  // Default for this specific file
      
      const dataBuffer = fs.readFileSync(path.join(DATA_DIR, file));
      
      console.log("   ...Extracting text...");
      const data = await pdf(dataBuffer);
      const text = data.text;

      // Logic: Split by lines -> Find House Header -> Find Students
      const lines = text.split(/\n/);
      let currentHouse = null;
      const houseKeywords = ["Spartans", "Mughals", "Vikings", "Aryans", "Rajputs"];
      const bulkOps = [];

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // 1. Detect House Header
        const foundHouse = houseKeywords.find(h => trimmed.includes(h));
        if (foundHouse) currentHouse = foundHouse;

        // 2. Detect Student (UID + Name)
        // Regex: U followed by 7 digits, space, Name
        const studentMatch = trimmed.match(/(U\d{7})\s+([A-Z\s\.]+)/i);
        
        if (studentMatch && currentHouse) {
           const uid = studentMatch[1];
           let name = studentMatch[2].replace(/[^a-zA-Z\s\.]/g, "").trim();

           if (name.length > 2) {
               bulkOps.push({
                  updateOne: {
                    filter: { uid: uid },
                    update: {
                      $set: { 
                          fullName: name, 
                          uid: uid, 
                          house: currentHouse, 
                          branch: branch, 
                          semester: semester 
                      },
                      $setOnInsert: { individual: 0, group: 0, literary: 0 }
                    },
                    upsert: true
                  }
               });
           }
        }
      }

      if (bulkOps.length > 0) {
        await Participant.bulkWrite(bulkOps);
        console.log(`   ✅ Imported ${bulkOps.length} students.`);
        totalAdded += bulkOps.length;
      } else {
        console.log(`   ⚠️ No students extracted. Try Solution 1 (Excel Conversion).`);
      }
    }

    console.log(`\n🎉 DONE! Total Added: ${totalAdded}`);
    process.exit(0);

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

importPDF();