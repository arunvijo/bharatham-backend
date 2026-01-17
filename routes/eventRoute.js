import express from "express";
import { Event } from "../models/eventModel.js";

const router = express.Router();

/**
 * @route   POST /
 * @desc    Create a new event with DEBUGGING enabled
 */
router.post("/", async (request, response) => {
  try {
    // --- DEBUGGING START ---
    console.log("\n🛑 [DEBUG: POST /event] Incoming Request Body:");
    console.log(JSON.stringify(request.body, null, 2)); 
    // --- DEBUGGING END ---

    const { 
      name, participation, type, category, date, venue,
      minTeamSize, maxTeamSize, maxRegistrations,
      minIndividualLimit, maxIndividualLimit, teamLimit 
    } = request.body;

    // Resolve Limits (New vs Old)
    const finalMinSize = minTeamSize !== undefined ? minTeamSize : minIndividualLimit;
    const finalMaxSize = maxTeamSize !== undefined ? maxTeamSize : maxIndividualLimit;
    const finalMaxRegs = maxRegistrations !== undefined ? maxRegistrations : teamLimit;

    console.log(`[DEBUG] Resolved Limits -> Min: ${finalMinSize}, Max: ${finalMaxSize}, HouseLimit: ${finalMaxRegs}`);

    // VALIDATION
    if (
      !name || !participation || !type || !category || !date || !venue ||
      finalMinSize === undefined || 
      finalMaxSize === undefined || 
      finalMaxRegs === undefined
    ) {
      console.error("❌ [DEBUG] Validation Failed. Missing required fields.");
      return response.status(400).send({
        message: "Missing required fields. Please ensure name, details, and all 3 limits are provided.",
      });
    }

    const newEventData = {
      name,
      image: request.body.image || null,
      participation,
      type,
      category,
      date,
      venue,
      // Ensure Numbers
      minTeamSize: Number(finalMinSize),
      maxTeamSize: Number(finalMaxSize),
      maxRegistrations: Number(finalMaxRegs),
      minRegistrations: Number(request.body.minRegistrations ?? 0),
      isPreEvent: Boolean(request.body.isPreEvent ?? false),
      countsTowardsLimit: Boolean(request.body.countsTowardsLimit ?? true),
      registrationEnabled: Boolean(request.body.registrationEnabled ?? true)
    };

    const event = await Event.create(newEventData);
    console.log(`✅ [DEBUG] Event Created: ${event.name} (${event._id})`);
    
    return response.status(201).send(event);
  } catch (error) {
    console.error(`❌ [DEBUG] Server Error: ${error.message}`);
    response.status(500).send({ message: error.message });
  }
});

/**
 * @route   GET /
 * @desc    Get all events
 */
router.get("/", async (request, response) => {
  try {
    const events = await Event.find({});
    return response.status(200).json({
      count: events.length,
      data: events,
    });
  } catch (error) {
    console.error(error.message);
    response.status(500).send({ message: error.message });
  }
});

/**
 * @route   GET /:id
 * @desc    Get one event
 */
router.get("/:id", async (request, response) => {
  try {
    const { id } = request.params;
    const event = await Event.findById(id);
    if (!event) return response.status(404).send({ message: "Event not found" });
    return response.status(200).json(event);
  } catch (error) {
    console.error(error.message);
    response.status(500).send({ message: error.message });
  }
});

/**
 * @route   PUT /:id
 * @desc    Update an event with DEBUGGING enabled
 */
router.put("/:id", async (request, response) => {
  try {
    // --- DEBUGGING START ---
    console.log(`\n🛑 [DEBUG: PUT /event/${request.params.id}] Incoming Payload:`);
    console.log(JSON.stringify(request.body, null, 2));
    // --- DEBUGGING END ---

    const { 
      name, participation, type, category, date, venue,
      minTeamSize, maxTeamSize, maxRegistrations,
      minIndividualLimit, maxIndividualLimit, teamLimit 
    } = request.body;

    // Resolve Limits
    const finalMinSize = minTeamSize !== undefined ? minTeamSize : minIndividualLimit;
    const finalMaxSize = maxTeamSize !== undefined ? maxTeamSize : maxIndividualLimit;
    const finalMaxRegs = maxRegistrations !== undefined ? maxRegistrations : teamLimit;

    // Validation
    if (
      !name || !participation || !type || !category || !date || !venue ||
      finalMinSize === undefined || 
      finalMaxSize === undefined || 
      finalMaxRegs === undefined
    ) {
      console.error("❌ [DEBUG] Validation Failed. Missing required fields.");
      return response.status(400).send({
        message: "Missing required fields for update.",
      });
    }

    const { id } = request.params;

    const updateData = {
      name,
      image: request.body.image || null,
      participation,
      type,
      category,
      date: date || "TBD",
      venue,
      minTeamSize: Number(finalMinSize),
      maxTeamSize: Number(finalMaxSize),
      maxRegistrations: Number(finalMaxRegs),
      minRegistrations: Number(request.body.minRegistrations ?? 0),
      isPreEvent: Boolean(request.body.isPreEvent ?? false),
      countsTowardsLimit: Boolean(request.body.countsTowardsLimit ?? true),
      registrationEnabled: Boolean(request.body.registrationEnabled ?? true)
    };

    const result = await Event.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!result) {
      console.error("❌ [DEBUG] Event ID not found in DB.");
      return response.status(404).send({ message: "Event not found" });
    }

    console.log(`✅ [DEBUG] Update Successful for: ${result.name}`);
    return response.status(200).json({ message: "Event updated successfully", data: result });
  } catch (error) {
    console.error(`❌ [DEBUG] Error: ${error.message}`);
    response.status(500).send({ message: error.message });
  }
});

// ... (Keep Toggle and Delete routes as is) ...
// Route for toggling registration status
router.patch("/:id/toggle-registration", async (request, response) => {
  try {
    const { id } = request.params;
    const event = await Event.findById(id);

    if (!event) {
      return response.status(404).send({ message: "Event not found" });
    }

    event.registrationEnabled = !event.registrationEnabled;
    await event.save();

    return response.status(200).json({ 
      message: `Registration ${event.registrationEnabled ? 'enabled' : 'disabled'} successfully`,
      registrationEnabled: event.registrationEnabled
    });
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
});

//Route for getting one event from database by id
router.delete("/:id", async (request, response) => {
  try {
    const { id } = request.params;

    const result = await Event.findByIdAndDelete(id);

    if (!result) {
      return response.status(404).send({ message: "Event not found" });
    }

    return response.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
});

export default router;