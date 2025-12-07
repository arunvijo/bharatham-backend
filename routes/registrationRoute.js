import express from "express";
import { Registration } from "../models/registrationModel.js";
import { Event } from "../models/eventModel.js";
import { Participant } from "../models/participantModel.js";

const router = express.Router();

// Route for save new registration
router.post("/", async (request, response) => {
  try {
    const { event: eventName, house, participants } = request.body;

    if (!eventName || !house || !participants) {
      return response.status(400).send({
        message: "Send all required fields: event, house, participants",
      });
    }

    // 1. Fetch Event Details to get Limits
    // We assume the frontend sends the Event Name. If it sends ID, change this to findById.
    const eventObj = await Event.findOne({ name: eventName });

    if (!eventObj) {
      return response.status(404).send({ message: "Event not found" });
    }

    // 2. Check Team Size / Bulk Participation Limits
    // (e.g., Group Dance: 7-10 people, Essay Writing: 10-15 people)
    if (
      participants.length < eventObj.minTeamSize ||
      participants.length > eventObj.maxTeamSize
    ) {
      return response.status(400).send({
        message: `Participation for ${eventName} requires between ${eventObj.minTeamSize} and ${eventObj.maxTeamSize} participants per entry.`,
      });
    }

    const literaryEvents = ["Essay Writing", "Short Story", "Poetry"];
    if (literaryEvents.includes(eventName)) {
      // We expect the frontend to send participants like: [{_id: "...", language: "Malayalam"}, ...]
      const languages = new Set(participants.map((p) => p.language).filter(Boolean));
      if (languages.size < 2) {
        return response.status(400).send({
          message: `${eventName} registration requires participants from at least 2 different languages.`,
        });
      }
    }

    // 3. Check House Registration Limit
    // (e.g., A house can only have 1 entry for Group Dance, or 5 entries for Recitation)
    const existingRegistrations = await Registration.countDocuments({
      event: eventName,
      house: house,
    });

    if (existingRegistrations >= eventObj.maxRegistrations) {
      return response.status(400).send({
        message: `Limit reached: ${house} has already registered the maximum number of times (${eventObj.maxRegistrations}) for ${eventName}.`,
      });
    }

    // 4. Check Student Individual/Group Limits (The 5/3 Rule)
    // Only perform this check if the event counts towards the limit (Short film, Adzap, etc. do not)
    if (eventObj.countsTowardsLimit) {
      for (const p of participants) {
        // We assume 'p' contains the participant's DB ID or UID.
        // Adjust '_id: p._id' or 'uid: p.uid' based on what your frontend sends.
        const participantDb = await Participant.findOne({ _id: p._id });

        if (participantDb) {
          // Check Individual Limit (Max 5)
          if (
            eventObj.participation === "Individual" &&
            participantDb.individual >= 5
          ) {
            return response.status(400).send({
              message: `Limit Reached: Participant ${participantDb.fullName} has already registered for 5 Individual events.`,
            });
          }

          // Check Group Limit (Max 3)
          if (
            eventObj.participation === "Group" &&
            participantDb.group >= 3
          ) {
            return response.status(400).send({
              message: `Limit Reached: Participant ${participantDb.fullName} has already registered for 3 Group events.`,
            });
          }
        }
      }
    }

    // 5. Create Registration
    const newRegistration = {
      event: eventName,
      house: house,
      participants: participants,
    };

    const registration = await Registration.create(newRegistration);

    // 6. Update Participant Counters
    // If registration is successful, increment the counts for the students involved
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
        }
      }
    }

    return response.status(201).send(registration);
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
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
    
    // Optional: Logic to decrement participant counts upon deletion could be added here
    
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