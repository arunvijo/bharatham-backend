import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { createRequire } from "module";
import { Participant } from "../models/participantModel.js";
import { mongodbURL } from "../config.js";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx"); 

const DATA_DIR = path.join(process.cwd(), "student_data"); 
const CURRENT_YEAR = 2025;
const HOUSE_ORDER = ["Spartans", "Mughals", "Vikings", "Aryans", "Rajputs"];

async function importExcel() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(mongodbURL);
    console.log("✅ Connected!");

    if (!fs.existsSync(DATA_DIR)) {
        console.error(`❌ Error: Folder not found: ${DATA_DIR}`);
        process.exit(1);
    }

    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith(".xlsx"));
    console.log(`📂 Found ${files.length} Excel files.`);

    let grandTotal = 0;

    for (const file of files) {
      console.log(`\n==================================================`);
      console.log(`📄 FILE: ${file}`);

      // 1. Guess Metadata from Filename (Default)
      let batchYear = 2025;
      let semester = "S1";
      
      const yearMatch = file.match(/20(\d{2})/);
      if (yearMatch) {
        const startYear = parseInt(`20${yearMatch[1]}`);
        batchYear = startYear;
        const yearDiff = CURRENT_YEAR - startYear;
        semester = `S${Math.max(1, (yearDiff * 2) + 1)}`;
      }

      // 2. Read Workbook
      const workbook = XLSX.readFile(path.join(DATA_DIR, file));
      
      // 3. Loop Through ALL Sheets
      for (const sheetName of workbook.SheetNames) {
        console.log(`   -----------------------------------------------`);
        console.log(`   📑 Sheet: ${sheetName}`);

        // Determine Branch from Sheet Name (e.g., "CS A", "ME B")
        let branch = "General";
        const upperSheet = sheetName.toUpperCase();
        if (upperSheet.includes("CS") || upperSheet.includes("CSE")) branch = "CSE";
        else if (upperSheet.includes("AD") || upperSheet.includes("ADS")) branch = "ADS";
        else if (upperSheet.includes("AE") || upperSheet.includes("AEI")) branch = "AEI";
        else if (upperSheet.includes("EC") || upperSheet.includes("ECE")) branch = "ECE";
        else if (upperSheet.includes("EE") || upperSheet.includes("EEE")) branch = "EEE";
        else if (upperSheet.includes("ME") || upperSheet.includes("ME")) branch = "ME";
        else if (upperSheet.includes("CE") || upperSheet.includes("CIVIL")) branch = "CE";
        else if (upperSheet.includes("IT")) branch = "IT";
        
        console.log(`      -> Metadata: Batch ${batchYear} | ${semester} | ${branch}`);

        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
        
        const bulkOps = [];
        let headerFound = false;

        for (let r = 0; r < rows.length; r++) {
          const row = rows[r];
          
          // Find Header
          if (!headerFound) {
            if (row.some(cell => cell && cell.toString().toLowerCase().includes("userid"))) {
              headerFound = true;
            }
            continue;
          }

          // Process Columns
          for (let i = 0; i < HOUSE_ORDER.length; i++) {
            const uidIdx = i * 2;
            const nameIdx = uidIdx + 1;

            if (row[uidIdx] && row[nameIdx]) {
              const uid = row[uidIdx].toString().trim();
              const name = row[nameIdx].toString().trim();

              if (uid.startsWith("U") && uid.length > 5 && name.length > 2) {
                 bulkOps.push({
                  updateOne: {
                    filter: { uid: uid },
                    update: {
                      $set: {
                        fullName: name,
                        uid: uid,
                        house: HOUSE_ORDER[i],
                        branch: branch,
                        semester: semester,
                      },
                      $setOnInsert: { individual: 0, group: 0, literary: 0 }
                    },
                    upsert: true
                  }
                });
              }
            }
          }
        }

        if (bulkOps.length > 0) {
          await Participant.bulkWrite(bulkOps);
          console.log(`      ✅ Added/Updated ${bulkOps.length} students.`);
          grandTotal += bulkOps.length;
        } else {
          console.log(`      ⚠️ No students found in this sheet.`);
        }
      }
    }

    console.log(`\n🎉 DONE! Grand Total Students: ${grandTotal}`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

importExcel();