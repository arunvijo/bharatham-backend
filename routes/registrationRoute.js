import express from "express";
import { Registration } from "../models/registrationModel.js";
import { Event } from "../models/eventModel.js";
import { Participant } from "../models/participantModel.js";

const router = express.Router();

// Route for save new registration
router.post("/", async (request, response) => {
  try {
    const { event: eventName, house, participants } = request.body;
    console.log(`[REG-POST] Starting registration for: ${eventName} (${house}) with ${participants.length} participants.`);

    if (!eventName || !house || !participants || participants.length === 0) {
      console.log("[REG-POST] Validation Failed: Missing fields or empty participant list.");
      return response.status(400).send({
        message: "Send all required fields: event, house, and at least one participant.",
      });
    }

    // 1. Fetch Event Details to get Limits
    const eventObj = await Event.findOne({ name: eventName });

    if (!eventObj) {
      console.log(`[REG-POST] Validation Failed: Event '${eventName}' not found.`);
      return response.status(404).send({ message: `Event '${eventName}' not found` });
    }
    
    // --- FIX: Check for House Entry Flag ---
    const isHouseEntry = participants.some(p => p.isHouseEntry === true);

    // 2. Check Team Size / Bulk Participation Limits
    const minSize = eventObj.minTeamSize;
    const maxSize = eventObj.maxTeamSize;
    
    // Logic: If it is a House Entry, we ignore the MINIMUM limit (because 1 < 4 is expected).
    // We still respect MAX limit check if needed, but usually House Entry is just 1 dummy item.
    if (!isHouseEntry) {
        if (participants.length < minSize || participants.length > maxSize) {
            console.log(`[REG-POST] Validation Failed: Team size (${participants.length}) outside limits (${minSize}-${maxSize}).`);
            return response.status(400).send({
                message: `Participation for ${eventName} requires between ${minSize} and ${maxSize} participants per entry.`,
            });
        }
    }
    console.log(`[REG-POST] Validation Passed: Team size is valid.`);


    // 3. Check House Registration Limit
    const existingRegistrations = await Registration.countDocuments({
      event: eventName,
      house: house,
    });
    const maxRegs = eventObj.maxRegistrations;

    if (existingRegistrations >= maxRegs) {
      console.log(`[REG-POST] Validation Failed: House limit (${existingRegistrations}/${maxRegs}) reached.`);
      return response.status(400).send({
        message: `Limit reached: ${house} has already registered the maximum number of times (${maxRegs}) for ${eventName}.`,
      });
    }


    // 4. Check Student Individual/Group Limits (The 5/3 Rule)
    // SKIP THIS CHECK FOR HOUSE ENTRIES (Dummy participants don't have database records to check)
    if (eventObj.countsTowardsLimit && !isHouseEntry) {
      const updateField = eventObj.participation === "Individual" ? "individual" : "group";
      const limit = eventObj.participation === "Individual" ? 5 : 3;

      for (const p of participants) {
        // Find by _id (if sent by frontend)
        const participantDb = await Participant.findOne({ _id: p._id || p.uid });
        if (!participantDb) {
            console.log(`[REG-POST] Warning: Participant ID ${p._id || p.uid} not found in database. Skipping limit check.`);
            continue;
        }

        const currentCount = participantDb[updateField] || 0;

        if (currentCount >= limit) {
          console.log(`[REG-POST] Validation Failed: Student ${participantDb.fullName} at limit.`);
          return response.status(400).send({
            message: `Limit Reached: Participant ${participantDb.fullName} has already registered for ${limit} ${eventObj.participation} events.`,
          });
        }
      }
    } 

    // 5. Check Literary Diversity Rule
    // SKIP FOR HOUSE ENTRY (No language data usually)
    const diversityRuleEvents = ["Essay Writing", "Short Story", "Poetry"];
    if (diversityRuleEvents.includes(eventName) && !isHouseEntry) {
      const languages = new Set(participants.map((p) => p.language).filter(Boolean));
      if (languages.size < 2) {
        return response.status(400).send({
          message: `${eventName} registration requires participants from at least 2 different languages.`,
        });
      }
    }

    // 6. Create Registration
    const newRegistration = {
      event: eventName,
      house: house,
      participants: participants, 
    };

    const registration = await Registration.create(newRegistration);
    console.log(`[REG-POST] Registration created successfully. ID: ${registration._id}`);

    // 7. Update Participant Counters
    // SKIP FOR HOUSE ENTRY
    if (eventObj.countsTowardsLimit && !isHouseEntry) {
      const updateField =
        eventObj.participation === "Individual"
          ? { individual: 1 }
          : eventObj.participation === "Group"
          ? { group: 1 }
          : null;

      if (updateField) {
        for (const p of participants) {
          // Only update if it's a real mongo ID
          if (p._id && p._id.length === 24) { 
             await Participant.findByIdAndUpdate(p._id, { $inc: updateField });
          }
        }
      }
    }

    return response.status(201).send(registration);
  } catch (error) {
    console.log(`[REG-POST] Critical Error: ${error.message}`);
    response.status(500).send({ message: `Internal Server Error: ${error.message}` });
  }
});

// ... (Rest of the file remains unchanged: GET, PUT, DELETE routes) ...
// Route for getting All registrations from database
router.get("/", async (request, response) => {
  try {
    const registrations = await Registration.find({});
    return response.status(200).json({ count: registrations.length, data: registrations });
  } catch (error) {
    response.status(500).send({ message: error.message });
  }
});

router.get("/by-house/:house", async (request, response) => {
  try {
    const { house } = request.params;
    const registrations = await Registration.find({ house: house });
    return response.status(200).json({ count: registrations.length, data: registrations });
  } catch (error) {
    response.status(500).send({ message: error.message });
  }
});

router.get("/by-event/:id", async (request, response) => {
  try {
    const { id } = request.params;
    const event = await Event.findOne({ _id: id });
    const registrations = await Registration.find({ event: event.name });
    return response.status(200).json({ count: registrations.length, data: registrations });
  } catch (error) {
    response.status(500).send({ message: error.message });
  }
});

router.get("/by-participant/:id", async (request, response) => {
  try {
    const { id } = request.params;
    const registrations = await Registration.find({ "participants._id": id });
    return response.status(200).json({ count: registrations.length, data: registrations });
  } catch (error) {
    response.status(500).send({ message: error.message });
  }
});

router.get("/by-house-event/:id/:house", async (request, response) => {
  try {
    const { house, id } = request.params;
    const event = await Event.findById(id);
    const registrations = await Registration.find({ house: house, event: event.name });
    return response.status(200).json({ count: registrations.length, data: registrations });
  } catch (error) {
    response.status(500).send({ message: error.message });
  }
});

router.get("/:id", async (request, response) => {
  try {
    const { id } = request.params;
    const registration = await Registration.findById(id);
    return response.status(200).json(registration);
  } catch (error) {
    response.status(500).send({ message: error.message });
  }
});

router.put("/:id", async (request, response) => {
  try {
    if (!request.body.event || !request.body.house || !request.body.participants) {
      return response.status(400).send({ message: "Send all required fields" });
    }
    const { id } = request.params;
    const result = await Registration.findByIdAndUpdate(id, request.body);
    if (!result) return response.status(404).send({ message: "Registration not found" });
    return response.status(200).json({ message: "Registration updated successfully" });
  } catch (error) {
    response.status(500).send({ message: error.message });
  }
});

router.delete("/:id", async (request, response) => {
  try {
    const { id } = request.params;
    const result = await Registration.findByIdAndDelete(id);
    if (!result) return response.status(404).send({ message: "Registration not found" });
    return response.status(200).json({ message: "Registration deleted successfully" });
  } catch (error) {
    response.status(500).send({ message: error.message });
  }
});

export default router;