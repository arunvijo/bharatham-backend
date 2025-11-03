import express from "express";
import { Registration } from "../models/registrationModel.js";
import { Event } from "../models/eventModel.js";
import { Participant } from "../models/participantModel.js";

const router = express.Router()

// Route for save new registration  
router.post('/', async (request, response) => {
    try {
        if(!request.body.event || !request.body.house || !request.body.participants) {
            return response.status(400).send({
                message: 'Send all required fields: event, house, participants'
            })
        }

        const newRegistration = {
            event: request.body.event,
            house: request.body.house,
            participants: request.body.participants
        }

        const registration = await Registration.create(newRegistration);

        return response.status(201).send(registration);
    } catch (error) {
        console.log(error.message);
        response.status(500).send({ message: error.message })
    }
});

//Route for getting All registrations from database
router.get('/', async (request, response) => {
    try {
        const registrations = await Registration.find({});

        return response.status(200).json({
            count: registrations.length,
            data: registrations
        });
    } catch (error) {
        console.log(error.message);
        response.status(500).send({ message: error.message })
    }
})

//Route for getting registrations by house from database
router.get('/by-house/:house', async (request, response) => {
    try {
        const { house } = request.params;
        const registrations = await Registration.find({house: house});
        return response.status(200).json({
            count: registrations.length,
            data: registrations
        });
    } catch (error) {
        console.log(error.message);
        response.status(500).send({ message: error.message })
    }
})

//Route for getting registrations by house from database
router.get('/by-event/:id', async (request, response) => {
    try {
        const { id } = request.params;
        const event = await Event.findOne({_id: id});
        const registrations = await Registration.find({event: event.name});
        // console.log(id, event, registrations.length)
        return response.status(200).json({
            count: registrations.length,
            data: registrations
        });
    } catch (error) {
        console.log(error.message);
        response.status(500).send({ message: error.message })
    }
})

//Route for getting registrations by house from database
router.get('/by-participant/:id', async (request, response) => {
    try {
        const { id } = request.params;
        const participant = await Participant.find({_id: id})
        const registrations = await Registration.find();
        console.log(id, registrations.length)
        return response.status(200).json({
            count: registrations.length,
            data: registrations.filter((r) => {
                return r.participants.filter((p) => p._id === id).length > 0})
        });
    } catch (error) {
        console.log(error.message);
        response.status(500).send({ message: error.message })
    }
})

//Route for getting registrations by house and event from database
router.get('/by-house-event/:id/:house', async (request, response) => {
    try {
        const { house, id } = request.params;
        const event = await Event.find({_id: id});
        const registrations = await Registration.find({house: house, event: event[0].name});
        console.log(event[0].name, registrations)
        return response.status(200).json({
            count: registrations.length,
            data: registrations
        });
    } catch (error) {
        console.log(error.message);
        response.status(500).send({ message: error.message })
    }
})

//Route for getting one registration from database by id
router.get('/:id', async (request, response) => {
    try {
        const { id } = request.params;

        const registration = await Registration.findById(id);

        return response.status(200).json(registration);
    } catch (error) {
        console.log(error.message);
        response.status(500).send({ message: error.message })
    }
})

//Route for updating a registration
router.put('/:id', async (request, response) => {
    try {
        if(!request.body.event || !request.body.house || !request.body.participants) {
            return response.status(400).send({
                message: 'Send all required fields: event, house, participants'
            })
        }

        const { id } = request.params;

        const result = await Registration.findByIdAndUpdate(id, request.body);
        console.log(result);
        if (!result) {
            response.status(404).send({ message: 'Registration not found' })
        }

        return response.status(200).json({ message: 'Registration updated successfully'});
    } catch (error) {
        console.log(error.message);
        response.status(500).send({ message: error.message })
    }
})

//Route for getting one registration from database by id
router.delete('/:id', async (request, response) => {
    try {
        const { id } = request.params;
        const result = await Registration.findByIdAndDelete(id);

        if (!result) {
            response.status(404).send({ message: 'Registration not found' })
        }

        return response.status(200).json({ message: 'Registration deleted successfully'});
    } catch (error) {
        console.log(error.message);
        response.status(500).send({ message: error.message })
    }
})

export default router;