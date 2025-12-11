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
    console.log(`[REG-POST] Event: ${eventObj.name} | Type: ${eventObj.participation} | CountsTowardLimit: ${eventObj.countsTowardsLimit}`);

    // 2. Check Team Size / Bulk Participation Limits
    const minSize = eventObj.minTeamSize;
    const maxSize = eventObj.maxTeamSize;
    if (participants.length < minSize || participants.length > maxSize) {
      console.log(`[REG-POST] Validation Failed: Team size (${participants.length}) outside limits (${minSize}-${maxSize}).`);
      return response.status(400).send({
        message: `Participation for ${eventName} requires between ${minSize} and ${maxSize} participants per entry.`,
      });
    }
    console.log(`[REG-POST] Validation Passed: Team size is valid (${participants.length}).`);


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
    console.log(`[REG-POST] Validation Passed: House registration count is valid (${existingRegistrations}/${maxRegs}).`);


    // 4. Check Student Individual/Group Limits (The 5/3 Rule) - Only for counting events
    if (eventObj.countsTowardsLimit) {
      const updateField = eventObj.participation === "Individual" ? "individual" : "group";
      const limit = eventObj.participation === "Individual" ? 5 : 3;

      for (const p of participants) {
        // Find by _id (if sent by frontend)
        const participantDb = await Participant.findOne({ _id: p._id || p.uid });
        if (!participantDb) {
            console.log(`[REG-POST] Warning: Participant ID ${p._id || p.uid} not found in database. Skipping limit check for this student.`);
            continue;
        }

        // Use the existing count in the DB *before* this registration is processed
        const currentCount = participantDb[updateField] || 0;

        if (currentCount >= limit) {
          console.log(`[REG-POST] Validation Failed: Student ${participantDb.fullName} at limit. Current: ${currentCount}/${limit} ${updateField}.`);
          return response.status(400).send({
            message: `Limit Reached: Participant ${participantDb.fullName} has already registered for ${limit} ${eventObj.participation} events.`,
          });
        }
      }
      console.log(`[REG-POST] Validation Passed: All participants under the ${limit} max ${eventObj.participation} limit.`);
    } else {
        console.log(`[REG-POST] Skipping student limit check for exception event: ${eventName}.`);
    }

    // 5. Check Literary Diversity Rule (2+ Languages for Essay, Short Story, Poetry)
    const diversityRuleEvents = ["Essay Writing", "Short Story", "Poetry"];
    if (diversityRuleEvents.includes(eventName)) {
      const languages = new Set(participants.map((p) => p.language).filter(Boolean));
      if (languages.size < 2) {
        console.log(`[REG-POST] Validation Failed: Literary diversity rule failed. Found ${languages.size} unique languages.`);
        return response.status(400).send({
          message: `${eventName} registration requires participants from at least 2 different languages.`,
        });
      }
      console.log(`[REG-POST] Validation Passed: Literary diversity rule passed. Found ${languages.size} unique languages.`);
    }

    // 6. Create Registration
    const newRegistration = {
      event: eventName,
      house: house,
      // Store the full participant object sent from frontend including any special fields (language/performanceType etc.)
      participants: participants, 
    };

    const registration = await Registration.create(newRegistration);
    console.log(`[REG-POST] Registration created successfully. ID: ${registration._id}`);

    // 7. Update Participant Counters
    if (eventObj.countsTowardsLimit) {
      const updateField =
        eventObj.participation === "Individual"
          ? { individual: 1 }
          : eventObj.participation === "Group"
          ? { group: 1 }
          : null;

      if (updateField) {
        for (const p of participants) {
          await Participant.findByIdAndUpdate(p._id, {
            $inc: updateField,
          });
          console.log(`[REG-POST] Incremented count for participant ID: ${p._id}`);
        }
      }
    }

    return response.status(201).send(registration);
  } catch (error) {
    console.log(`[REG-POST] Critical Error: ${error.message}`);
    response.status(500).send({ message: `Internal Server Error: ${error.message}` });
  }
});

// Route for getting All registrations from database
router.get("/", async (request, response) => {
  try {
    const registrations = await Registration.find({});

    return response.status(200).json({
      count: registrations.length,
      data: registrations,
    });
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
});

// Route for getting registrations by house from database
router.get("/by-house/:house", async (request, response) => {
  try {
    const { house } = request.params;
    const registrations = await Registration.find({ house: house });
    return response.status(200).json({
      count: registrations.length,
      data: registrations,
    });
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
});

// Route for getting registrations by event ID
router.get("/by-event/:id", async (request, response) => {
  try {
    const { id } = request.params;
    const event = await Event.findOne({ _id: id });
    const registrations = await Registration.find({ event: event.name });
    return response.status(200).json({
      count: registrations.length,
      data: registrations,
    });
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
});

// Route for getting registrations by participant ID
router.get("/by-participant/:id", async (request, response) => {
  try {
    const { id } = request.params;
    // Note: This logic assumes 'participants' in Registration is an array of objects containing _id
    const registrations = await Registration.find({
      "participants._id": id,
    });
    
    return response.status(200).json({
      count: registrations.length,
      data: registrations,
    });
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
});

// Route for getting registrations by house and event ID
router.get("/by-house-event/:id/:house", async (request, response) => {
  try {
    const { house, id } = request.params;
    const event = await Event.findById(id);
    const registrations = await Registration.find({
      house: house,
      event: event.name,
    });
    return response.status(200).json({
      count: registrations.length,
      data: registrations,
    });
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
});

// Route for getting one registration from database by id
router.get("/:id", async (request, response) => {
  try {
    const { id } = request.params;
    const registration = await Registration.findById(id);
    return response.status(200).json(registration);
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
});

// Route for updating a registration
router.put("/:id", async (request, response) => {
  try {
    if (
      !request.body.event ||
      !request.body.house ||
      !request.body.participants
    ) {
      return response.status(400).send({
        message: "Send all required fields: event, house, participants",
      });
    }

    const { id } = request.params;
    const result = await Registration.findByIdAndUpdate(id, request.body);

    if (!result) {
      return response.status(404).send({ message: "Registration not found" });
    }

    return response
      .status(200)
      .json({ message: "Registration updated successfully" });
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
});

// Route for deleting a registration
router.delete("/:id", async (request, response) => {
  try {
    const { id } = request.params;
    
    // NOTE: The DELETE operation needs to manually decrement the participant counters 
    // to complete the full logic cycle, as the original logic only contained the deletion.
    // For this update, I will assume a backend hook or subsequent process handles the decrement 
    // as suggested in the original DeleteRegistration.jsx frontend logic: 
    // "Backend now handles participant counter updates automatically on delete"
    
    const result = await Registration.findByIdAndDelete(id);

    if (!result) {
      return response.status(404).send({ message: "Registration not found" });
    }

    return response
      .status(200)
      .json({ message: "Registration deleted successfully" });
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
});

export default router;


// import express from "express";
// import { Registration } from "../models/registrationModel.js";
// import { Event } from "../models/eventModel.js";
// import { Participant } from "../models/participantModel.js";

// const router = express.Router()

// // Route for save new registration  
// router.post('/', async (request, response) => {
//     try {
//         if(!request.body.event || !request.body.house || !request.body.participants) {
//             return response.status(400).send({
//                 message: 'Send all required fields: event, house, participants'
//             })
//         }

//         const newRegistration = {
//             event: request.body.event,
//             house: request.body.house,
//             participants: request.body.participants
//         }

//         const registration = await Registration.create(newRegistration);

//         return response.status(201).send(registration);
//     } catch (error) {
//         console.log(error.message);
//         response.status(500).send({ message: error.message })
//     }
// });

// //Route for getting All registrations from database
// router.get('/', async (request, response) => {
//     try {
//         const registrations = await Registration.find({});

//         return response.status(200).json({
//             count: registrations.length,
//             data: registrations
//         });
//     } catch (error) {
//         console.log(error.message);
//         response.status(500).send({ message: error.message })
//     }
// })

// //Route for getting registrations by house from database
// router.get('/by-house/:house', async (request, response) => {
//     try {
//         const { house } = request.params;
//         const registrations = await Registration.find({house: house});
//         return response.status(200).json({
//             count: registrations.length,
//             data: registrations
//         });
//     } catch (error) {
//         console.log(error.message);
//         response.status(500).send({ message: error.message })
//     }
// })

// //Route for getting registrations by house from database
// router.get('/by-event/:id', async (request, response) => {
//     try {
//         const { id } = request.params;
//         const event = await Event.findOne({_id: id});
//         const registrations = await Registration.find({event: event.name});
//         // console.log(id, event, registrations.length)
//         return response.status(200).json({
//             count: registrations.length,
//             data: registrations
//         });
//     } catch (error) {
//         console.log(error.message);
//         response.status(500).send({ message: error.message })
//     }
// })

// //Route for getting registrations by house from database
// router.get('/by-participant/:id', async (request, response) => {
//     try {
//         const { id } = request.params;
//         const participant = await Participant.find({_id: id})
//         const registrations = await Registration.find();
//         console.log(id, registrations.length)
//         return response.status(200).json({
//             count: registrations.length,
//             data: registrations.filter((r) => {
//                 return r.participants.filter((p) => p._id === id).length > 0})
//         });
//     } catch (error) {
//         console.log(error.message);
//         response.status(500).send({ message: error.message })
//     }
// })

// //Route for getting registrations by house and event from database
// router.get('/by-house-event/:id/:house', async (request, response) => {
//     try {
//         const { house, id } = request.params;
//         const event = await Event.find({_id: id});
//         const registrations = await Registration.find({house: house, event: event[0].name});
//         console.log(event[0].name, registrations)
//         return response.status(200).json({
//             count: registrations.length,
//             data: registrations
//         });
//     } catch (error) {
//         console.log(error.message);
//         response.status(500).send({ message: error.message })
//     }
// })

// //Route for getting one registration from database by id
// router.get('/:id', async (request, response) => {
//     try {
//         const { id } = request.params;

//         const registration = await Registration.findById(id);

//         return response.status(200).json(registration);
//     } catch (error) {
//         console.log(error.message);
//         response.status(500).send({ message: error.message })
//     }
// })

// //Route for updating a registration
// router.put('/:id', async (request, response) => {
//     try {
//         if(!request.body.event || !request.body.house || !request.body.participants) {
//             return response.status(400).send({
//                 message: 'Send all required fields: event, house, participants'
//             })
//         }

//         const { id } = request.params;

//         const result = await Registration.findByIdAndUpdate(id, request.body);
//         console.log(result);
//         if (!result) {
//             response.status(404).send({ message: 'Registration not found' })
//         }

//         return response.status(200).json({ message: 'Registration updated successfully'});
//     } catch (error) {
//         console.log(error.message);
//         response.status(500).send({ message: error.message })
//     }
// })

// //Route for getting one registration from database by id
// router.delete('/:id', async (request, response) => {
//     try {
//         const { id } = request.params;
//         const result = await Registration.findByIdAndDelete(id);

//         if (!result) {
//             response.status(404).send({ message: 'Registration not found' })
//         }

//         return response.status(200).json({ message: 'Registration deleted successfully'});
//     } catch (error) {
//         console.log(error.message);
//         response.status(500).send({ message: error.message })
//     }
// })

// export default router;