import express from "express";
import { Score } from "../models/scoreModel.js";
import { Participant } from "../models/participantModel.js";

const router = express.Router();

// Route for save new score
router.post("/", async (request, response) => {
  try {
    if (
      !request.body.event ||
      !request.body.house ||
      !request.body.registration ||
      !request.body.position ||
      !request.body.points
    ) {
      return response.status(400).send({
        message:
          "Send all required fields: event, registration, position, points",
      });
    }

    const newScore = {
      event: request.body.event,
      house: request.body.house,
      registration: request.body.registration,
      position: request.body.position,
      points: request.body.points,
      reason: request.body.reason,
    };

    // const duplicates = await Score.find({
    //   event: newScore.event,
    //   house: newScore.house,
    //   position: newScore.position,
    // });

    // console.log(duplicates);

    // if (duplicates.length != 0) {
    //   return response.status(400).send({
    //     message: "Duplicate score",
    //   });
    // }

    const score = await Score.create(newScore);

    return response.status(201).send(score);
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
});

//Route for getting All scores from database
router.get("/", async (request, response) => {
  try {
    const scores = await Score.find({});

    return response.status(200).json({
      count: scores.length,
      data: scores,
    });
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
});

//Route for getting one score from database by id
router.get("/:id", async (request, response) => {
  try {
    const { id } = request.params;

    const score = await Score.findById(id);

    return response.status(200).json(score);
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
});

//Route for getting one score from database by captain
router.get("/by-event/:event", async (request, response) => {
  try {
    const { event } = request.params;

    const score = await Score.find({ event: { _id: event } });

    return response.status(200).json(score);
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
});

//Route for getting scores by participant from database
router.get("/by-participant/:id", async (request, response) => {
  try {
    const { id } = request.params;
    const scores = await Score.find();
    console.log(id, scores);
    return response.status(200).json({
      count: scores.length,
      data: scores.filter(
        (s) =>
          s.registration.participants.filter((p) => p._id === id)
            .length > 0
      ),
    });
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
});

//Route for updating a score
router.put("/:id", async (request, response) => {
  try {
    if (
      !request.body.event ||
      !request.body.house ||
      !request.body.registration ||
      !request.body.position ||
      !request.body.points
    ) {
      return response.status(400).send({
        message:
          "Send all required fields: event, house, registration, position, points",
      });
    }

    const { id } = request.params;

    // const duplicates = await Score.find({
    //   _id: { $ne: id },
    //   event: request.body.event,
    //   house: request.body.house,
    //   position: request.body.position,
    // });

    // console.log(duplicates);

    // if (duplicates.length != 0) {
    //   return response.status(400).send({
    //     message: "Duplicate score",
    //   });
    // }

    const result = await Score.findByIdAndUpdate(id, request.body);
    console.log(result);
    if (!result) {
      response.status(404).send({ message: "Score not found" });
    }

    return response.status(200).json({ message: "Score updated successfully" });
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
});

//Route for getting one score from database by id
router.delete("/:id", async (request, response) => {
  try {
    const { id } = request.params;

    const result = await Score.findByIdAndDelete(id);

    if (!result) {
      response.status(404).send({ message: "Score not found" });
    }

    return response.status(200).json({ message: "Score deleted successfully" });
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
});

export default router;
