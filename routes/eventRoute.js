import express from "express";
import { Event } from "../models/eventModel.js";

const router = express.Router();

// Route for save new event
router.post("/", async (request, response) => {
  try {
    if (
      !request.body.name ||
      !request.body.participation ||
      !request.body.type ||
      !request.body.category ||
      !request.body.date ||
      !request.body.venue ||
      !request.body.maxIndividualLimit ||
      !request.body.minIndividualLimit ||
      !request.body.teamLimit
    ) {
      return response.status(400).send({
        message:
          "Send all required fields: name, participation, type, category, date, venue, maxIndividualLimit, minIndividualLimit, teamLimit",
      });
    }

    const newEvent = {
      name: request.body.name,
      image: request.body.image || null,
      participation: request.body.participation,
      type: request.body.type,
      category: request.body.category,
      date: request.body.date,
      venue: request.body.venue,
      maxIndividualLimit: request.body.maxIndividualLimit,
      minIndividualLimit: request.body.minIndividualLimit,
      teamLimit: request.body.teamLimit,
      registrationEnabled: request.body.registrationEnabled ?? true // Default to true if not provided
    };

    const event = await Event.create(newEvent);

    return response.status(201).send(event);
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
});

//Route for getting All events from database
router.get("/", async (request, response) => {
  try {
    const events = await Event.find({});

    return response.status(200).json({
      count: events.length,
      data: events,
    });
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
});

//Route for getting one event from database by id
router.get("/:id", async (request, response) => {
  try {
    const { id } = request.params;

    const event = await Event.findById(id);

    return response.status(200).json(event);
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
});

//Route for updating a event
router.put("/:id", async (request, response) => {
  try {
    if (
      !request.body.name ||
      !request.body.participation ||
      !request.body.type ||
      !request.body.category ||
      !request.body.date ||
      !request.body.venue ||
      !request.body.maxIndividualLimit ||
      !request.body.minIndividualLimit ||
      !request.body.teamLimit
    ) {
      return response.status(400).send({
        message:
          "Send all required fields: name, participation, type, category, date, venue, maxIndividualLimit, minIndividualLimit, teamLimit",
      });
    }

    const { id } = request.params;

    const updateData = {
      ...request.body,
      registrationEnabled: request.body.registrationEnabled ?? true // Default to true if not provided
    };

    const result = await Event.findByIdAndUpdate(id, updateData);
    if (!result) {
      return response.status(404).send({ message: "Event not found" });
    }

    return response.status(200).json({ message: "Event updated successfully" });
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
});

//Route for toggling registration status
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
