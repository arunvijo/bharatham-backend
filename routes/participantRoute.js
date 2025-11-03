import express from "express";
import { Participant } from "../models/participantModel.js";

const router = express.Router()

// Route for save new participant
router.post('/', async (request, response) => {
    try {
        if(!request.body.fullName || !request.body.uid || !request.body.branch || !request.body.semester || !request.body.house) {
            return response.status(400).send({
                message: 'Send all required fields: fullName, uid, branch, semester, house'
            })
        }

        const newParticipant = {
            fullName: request.body.fullName,
            uid: request.body.uid,
            branch: request.body.branch,
            semester: request.body.semester,
            house: request.body.house,
            individual: request.body.individual || 0,
            group: request.body.group || 0,
            literary: request.body.literary || 0
        }

        const participant = await Participant.create(newParticipant);

        return response.status(201).send(participant);
    } catch (error) {
        console.log(error.message);
        response.status(500).send({ message: error.message })
    }
});

//Route for getting All participants from database
router.get('/', async (request, response) => {
    try {
        const participants = await Participant.find({});

        return response.status(200).json({
            count: participants.length,
            data: participants
        });
    } catch (error) {
        console.log(error.message);
        response.status(500).send({ message: error.message })
    }
})

//Route for getting participants by house from database
router.get('/by-house/:house', async (request, response) => {
    try {
        const { house } = request.params;
        console.log(house)
        const participants = await Participant.find({house: house});
        
        return response.status(200).json({
            count: participants.length,
            data: participants
        });
    } catch (error) {
        console.log(error.message);
        response.status(500).send({ message: error.message })
    }
})

//Route for getting one participant from database by id
router.get('/:id', async (request, response) => {
    try {
        const { id } = request.params;

        const participant = await Participant.findById(id);

        return response.status(200).json(participant);
    } catch (error) {
        console.log(error.message);
        response.status(500).send({ message: error.message })
    }
})

//Route for updating a participant
router.put('/:id', async (request, response) => {
    try {
        if(!request.body.fullName || !request.body.uid || !request.body.branch || !request.body.semester || !request.body.house) {
            return response.status(400).send({
                message: 'Send all required fields: fullName, uid, branch, semester, house'
            })
        }

        const { id } = request.params;

        const result = await Participant.findByIdAndUpdate(id, {
            fullName: request.body.fullName,
            uid: request.body.uid,
            branch: request.body.branch,
            semester: request.body.semester,
            house: request.body.house,
            individual: request.body.individual || 0,
            group: request.body.group || 0,
            literary: request.body.literary || 0
        });

        if (!result) {
            return response.status(404).send({ message: 'Participant not found' });
        }

        return response.status(200).json({ message: 'Participant updated successfully'});
    } catch (error) {
        console.log(error.message);
        response.status(500).send({ message: error.message })
    }
})

//Route for getting one participant from database by id
router.delete('/:id', async (request, response) => {
    try {
        const { id } = request.params;

        const result = await Participant.findByIdAndDelete(id);

        if (!result) {
            return response.status(404).send({ message: 'Participant not found' });
        }

        return response.status(200).json({ message: 'Participant deleted successfully'});
    } catch (error) {
        console.log(error.message);
        response.status(500).send({ message: error.message })
    }
})

export default router;