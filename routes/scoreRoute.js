import express from "express";
import { Score } from "../models/scoreModel.js";
import { Participant } from "../models/participantModel.js"; 

const router = express.Router();

// ==========================================================================
// SPECIFIC GET ROUTES (MUST BE DEFINED FIRST)
// ==========================================================================

/**
 * @route   GET /score/leaderboard
 * @desc    Get Live House Points (Aggregated)
 * @note    CRITICAL: This must be before /:id to prevent "leaderboard" being treated as an ID
 */
router.get("/leaderboard", async (request, response) => {
  try {
    const leaderboard = await Score.aggregate([
      {
        $group: {
          _id: "$house",                   // Group by House Name
          totalPoints: { $sum: "$points" } // Sum all points
        }
      },
      { $sort: { totalPoints: -1 } }       // Sort: Highest points first
    ]);
    
    return response.status(200).json(leaderboard);
  } catch (error) {
    console.error(`[SCORE-LEADERBOARD] Error: ${error.message}`);
    response.status(500).send({ message: error.message });
  }
});

/**
 * @route   GET /score/by-event/:event
 * @desc    Get scores for a specific event ID
 */
router.get("/by-event/:event", async (request, response) => {
  try {
    const { event } = request.params;
    const scores = await Score.find({ "event.id": event }); 
    return response.status(200).json(scores);
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
});

/**
 * @route   GET /score/by-participant/:id
 * @desc    Get scores for a specific participant (Optimized)
 */
router.get("/by-participant/:id", async (request, response) => {
  try {
    const { id } = request.params;
    
    // Checks if the participant ID exists in the new 'participant' field OR legacy 'registration' field
    const scores = await Score.find({
        $or: [
            { "participant.uid": id },             // Direct link (New logic)
            { "registration.participants._id": id } // Legacy link (Old logic)
        ]
    });

    return response.status(200).json({
      count: scores.length,
      data: scores
    });
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
});

/**
 * @route   GET /score
 * @desc    Get all scores (History)
 */
router.get("/", async (request, response) => {
  try {
    // Sort by newest first
    const scores = await Score.find({}).sort({ createdAt: -1 });
    return response.status(200).json({
      count: scores.length,
      data: scores,
    });
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
});

// ==========================================================================
// WRITE ROUTES (POST, PUT, DELETE)
// ==========================================================================

/**
 * @route   POST /score
 * @desc    Add a score (Winner) for an event
 */
router.post("/", async (request, response) => {
  try {
    const { event, house, position, points, participant, registrationId, registration, reason } = request.body;

    // 1. Basic Validation
    if (!event || !house || !position || points === undefined) {
      return response.status(400).send({
        message: "Missing required fields: event, house, position, points",
      });
    }

    // 2. Validate: Check if this Position is already taken for this Event
    const positionTaken = await Score.findOne({
      "event.name": event.name,
      position: position
    });

    if (positionTaken) {
      return response.status(400).send({
        message: `Conflict: ${position} Place is already assigned to ${positionTaken.house}. Please delete the existing score first.`
      });
    }

    // 3. Validate: Check if this Student/Team has already won a prize in this event
    if (participant && participant.uid) {
        const studentAlreadyWon = await Score.findOne({
            "event.name": event.name,
            "participant.uid": participant.uid
        });
        
        if (studentAlreadyWon) {
            return response.status(400).send({
                message: `Duplicate: ${participant.name || "Student"} already has a prize (${studentAlreadyWon.position}).`
            });
        }
    }

    // 4. Create the Score Entry
    const newScore = {
      event,       
      house,       
      position,    
      points,      
      participant, 
      registrationId,
      registration, // <--- This was missing!
      reason
    };

    const score = await Score.create(newScore);
    console.log(`[SCORE] Added: ${event.name} - ${position} (${house})`);
    
    return response.status(201).send(score);

  } catch (error) {
    console.error(`[SCORE-POST] Error: ${error.message}`);
    response.status(500).send({ message: error.message });
  }
});

/**
 * @route   PUT /score/:id
 * @desc    Update a score
 */
router.put("/:id", async (request, response) => {
  try {
    const { id } = request.params;

    if (!request.body.event || !request.body.house || !request.body.position || request.body.points === undefined) {
      return response.status(400).send({ message: "Send all required fields" });
    }

    // Check for duplicates (excluding self)
    const existingScore = await Score.findOne({
      _id: { $ne: id },
      "event.name": request.body.event.name,
      position: request.body.position
    });

    if (existingScore) {
       return response.status(400).send({ message: `Conflict: Position ${request.body.position} already exists.` });
    }

    const result = await Score.findByIdAndUpdate(id, request.body, { new: true });
    
    if (!result) return response.status(404).send({ message: "Score not found" });

    return response.status(200).json({ message: "Score updated successfully", data: result });
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
});

/**
 * @route   DELETE /score/:id
 * @desc    Delete a score
 */
router.delete("/:id", async (request, response) => {
  try {
    const { id } = request.params;
    const result = await Score.findByIdAndDelete(id);

    if (!result) return response.status(404).send({ message: "Score not found" });

    return response.status(200).json({ message: "Score deleted successfully" });
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
});

// ==========================================================================
// GENERIC GET ROUTE (MUST BE LAST)
// ==========================================================================

/**
 * @route   GET /score/:id
 * @desc    Get single score by ID
 * @note    This captures ANY string. If placed at the top, it breaks /leaderboard.
 */
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

export default router;