import express from "express";
import { Registration } from "../models/registrationModel.js";
import { Event } from "../models/eventModel.js";
import { Participant } from "../models/participantModel.js";

const router = express.Router();

/**
 * @route   POST /registration
 * @desc    Register a team or individual for an event
 */
router.post("/", async (request, response) => {
  try {
    const { event: eventName, house, participants } = request.body;
    console.log(`[REG-POST] Request: ${eventName} (${house}) - ${participants?.length} participants`);

    // --- 1. Basic Validation ---
    if (!eventName || !house || !participants || participants.length === 0) {
      return response.status(400).send({
        message: "Missing required fields: event, house, and participants.",
      });
    }

    // --- 2. Fetch Event Rules ---
    const eventObj = await Event.findOne({ name: eventName });
    if (!eventObj) {
      return response.status(404).send({ message: `Event '${eventName}' not found` });
    }
    
    // Check if this is a "House Entry" (Managed by Captains, usually unlimited/special)
    const isHouseEntry = participants.some(p => p.isHouseEntry === true);

    // --- 3. Check Team Size Limits ---
    // (Skip for House Entries as they may be placeholders)
    if (!isHouseEntry) {
        const minSize = eventObj.minTeamSize || 1;
        const maxSize = eventObj.maxTeamSize || 100;
        
        if (participants.length < minSize || participants.length > maxSize) {
            return response.status(400).send({
                message: `Invalid Team Size. ${eventName} requires between ${minSize} and ${maxSize} participants.`,
            });
        }
    }

    // --- 4. Check House Registration Limit ---
    // (Applies to everyone to prevent spamming entries)
    const existingHouseRegs = await Registration.countDocuments({
      event: eventName,
      house: house,
    });
    const maxRegs = eventObj.maxRegistrations || 1;

    if (existingHouseRegs >= maxRegs) {
      return response.status(400).send({
        message: `House Limit Reached: ${house} has already reached the limit of ${maxRegs} entries for ${eventName}.`,
      });
    }

    // --- 5. Check for Duplicate Student Registration ---
    // (Ensure a student isn't joining the same event twice in different teams)
    if (!isHouseEntry) {
        // Extract UIDs (University IDs)
        const uids = participants.map(p => p.uid).filter(Boolean);
        
        // Find if any of these UIDs exist in another registration for this SAME event
        const duplicateCheck = await Registration.findOne({
            event: eventName,
            "participants.uid": { $in: uids }
        });

        if (duplicateCheck) {
            // Identify who is the duplicate for the error message
            const dupeStudent = duplicateCheck.participants.find(p => uids.includes(p.uid));
            return response.status(400).send({
                message: `Duplicate Entry: ${dupeStudent?.fullName || "Student"} is already registered for ${eventName}.`,
            });
        }
    }

    // --- 6. Check Student Participation Limits (5/3 Rule) ---
    // (Skip if event doesn't count towards limit OR if it's a House Entry)
    if (eventObj.countsTowardsLimit && !isHouseEntry) {
      const updateField = eventObj.participation === "Individual" ? "individual" : "group";
      const limit = eventObj.participation === "Individual" ? 5 : 3;

      for (const p of participants) {
        // Find student in DB to check current count
        const participantDb = await Participant.findOne({ _id: p._id || p.uid });
        
        if (participantDb) {
            const currentCount = participantDb[updateField] || 0;
            if (currentCount >= limit) {
                return response.status(400).send({
                    message: `Limit Reached: ${participantDb.fullName} has already registered for ${limit} ${eventObj.participation} events.`,
                });
            }
        }
      }
    } 

    // --- 7. Check Literary Diversity Rule ---
    // (Essay/Story/Poetry needs 2+ languages)
    const diversityRuleEvents = ["Essay Writing", "Short Story", "Poetry"];
    if (diversityRuleEvents.includes(eventName) && !isHouseEntry) {
      const languages = new Set(participants.map((p) => p.language).filter(Boolean));
      if (languages.size < 2) {
        return response.status(400).send({
          message: `${eventName} requires participants from at least 2 different languages.`,
        });
      }
    }

    // --- 8. Create Registration ---
    const newRegistration = {
      event: eventName,
      house: house,
      participants: participants, 
    };

    const registration = await Registration.create(newRegistration);
    console.log(`[REG-POST] Created Registration ID: ${registration._id}`);

    // --- 9. Increment Student Counters ---
    if (eventObj.countsTowardsLimit && !isHouseEntry) {
      const updateField =
        eventObj.participation === "Individual"
          ? { individual: 1 }
          : eventObj.participation === "Group"
          ? { group: 1 }
          : null;

      if (updateField) {
        for (const p of participants) {
          // Update only valid linked students
          if (p._id) { 
             await Participant.findByIdAndUpdate(p._id, { $inc: updateField });
          }
        }
      }
    }

    return response.status(201).send(registration);

  } catch (error) {
    console.error(`[REG-POST] Error: ${error.message}`);
    response.status(500).send({ message: error.message });
  }
});

/**
 * @route   GET /registration
 * @desc    Get all registrations
 */
router.get("/", async (request, response) => {
  try {
    const registrations = await Registration.find({});
    return response.status(200).json({ count: registrations.length, data: registrations });
  } catch (error) {
    response.status(500).send({ message: error.message });
  }
});

/**
 * @route   GET /registration/by-house/:house
 * @desc    Get registrations for a specific house
 */
router.get("/by-house/:house", async (request, response) => {
  try {
    const { house } = request.params;
    const registrations = await Registration.find({ house: house });
    return response.status(200).json({ count: registrations.length, data: registrations });
  } catch (error) {
    response.status(500).send({ message: error.message });
  }
});

/**
 * @route   GET /registration/by-event/:id
 * @desc    Get registrations for a specific event
 */
router.get("/by-event/:id", async (request, response) => {
  try {
    const { id } = request.params;
    const event = await Event.findOne({ _id: id });
    if (!event) return response.status(404).send({ message: "Event not found" });

    const registrations = await Registration.find({ event: event.name });
    return response.status(200).json({ count: registrations.length, data: registrations });
  } catch (error) {
    response.status(500).send({ message: error.message });
  }
});

/**
 * @route   GET /registration/by-participant/:id
 * @desc    Get registrations where a specific student is involved
 */
router.get("/by-participant/:id", async (request, response) => {
  try {
    const { id } = request.params;
    const registrations = await Registration.find({ "participants._id": id });
    return response.status(200).json({ count: registrations.length, data: registrations });
  } catch (error) {
    response.status(500).send({ message: error.message });
  }
});

/**
 * @route   GET /registration/by-house-event/:id/:house
 * @desc    Get specific registration for House X in Event Y
 */
router.get("/by-house-event/:id/:house", async (request, response) => {
  try {
    const { house, id } = request.params;
    const event = await Event.findById(id);
    if (!event) return response.status(404).send({ message: "Event not found" });

    const registrations = await Registration.find({ house: house, event: event.name });
    return response.status(200).json({ count: registrations.length, data: registrations });
  } catch (error) {
    response.status(500).send({ message: error.message });
  }
});

/**
 * @route   GET /registration/:id
 * @desc    Get single registration by ID
 */
router.get("/:id", async (request, response) => {
  try {
    const { id } = request.params;
    const registration = await Registration.findById(id);
    return response.status(200).json(registration);
  } catch (error) {
    response.status(500).send({ message: error.message });
  }
});

/**
 * @route   PUT /registration/:id
 * @desc    Update a registration
 */
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

/**
 * @route   DELETE /registration/:id
 * @desc    Delete registration AND Decrement Student Counters
 */
router.delete("/:id", async (request, response) => {
  try {
    const { id } = request.params;

    // 1. Find the registration first (so we know who was in it)
    const registration = await Registration.findById(id);
    if (!registration) {
      return response.status(404).send({ message: "Registration not found" });
    }

    // 2. Find the Event (to know if it was Individual/Group and if it counted)
    const eventObj = await Event.findOne({ name: registration.event });
    
    // Check if it was a House Entry (these didn't increment, so shouldn't decrement)
    const isHouseEntry = registration.participants.some(p => p.isHouseEntry === true);

    // 3. Decrement Counters Logic
    if (eventObj && eventObj.countsTowardsLimit && !isHouseEntry) {
        const updateField = eventObj.participation === "Individual" ? "individual" : "group";
        
        console.log(`[REG-DELETE] Decrementing '${updateField}' count for ${registration.participants.length} students.`);

        // Loop through students and subtract 1 from their count
        for (const p of registration.participants) {
            if (p._id) {
                await Participant.findByIdAndUpdate(p._id, { 
                    $inc: { [updateField]: -1 } // The Fix: Decrement by 1
                });
            }
        }
    }

    // 4. Permanently Delete the Registration
    await Registration.findByIdAndDelete(id);

    return response.status(200).json({ message: "Registration deleted and counters updated successfully" });

  } catch (error) {
    console.error(`[REG-DELETE] Error: ${error.message}`);
    response.status(500).send({ message: error.message });
  }
});

export default router;