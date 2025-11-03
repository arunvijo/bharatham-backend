import express from "express";
import { House } from "../models/houseModel.js";

const router = express.Router()

// Route for save new house
router.post('/', async (request, response) => {
    try {
        if(!request.body.name || !request.body.captain) {
            return response.status(400).send({
                message: 'Send all required fields: name, captain'
            })
        }

        const newHouse = {
            name: request.body.name,
            captain: request.body.captain
        }

        const house = await House.create(newHouse);

        return response.status(201).send(house);
    } catch (error) {
        console.log(error.message);
        response.status(500).send({ message: error.message })
    }
});

//Route for getting All houses from database
router.get('/', async (request, response) => {
    try {
        const houses = await House.find({});

        return response.status(200).json({
            count: houses.length,
            data: houses
        });
    } catch (error) {
        console.log(error.message);
        response.status(500).send({ message: error.message })
    }
})

//Route for getting one house from database by id
router.get('/:id', async (request, response) => {
    try {
        const { id } = request.params;

        const house = await House.findById(id);

        return response.status(200).json(house);
    } catch (error) {
        console.log(error.message);
        response.status(500).send({ message: error.message })
    }
})

//Route for getting one house from database by captain
router.get('/by-captain/:captain', async (request, response) => {
    try {
        const { captain } = request.params;

        const house = await House.find({captain: captain});

        return response.status(200).json(house);
    } catch (error) {
        console.log(error.message);
        response.status(500).send({ message: error.message })
    }
})

//Route for updating a house
router.put('/:id', async (request, response) => {
    try {
        if(!request.body.name || !request.body.captain) {
            return response.status(400).send({
                message: 'Send all required fields: name, captain'
            })
        }

        const { id } = request.params;

        const result = await House.findByIdAndUpdate(id, request.body);
        console.log(result);
        if (!result) {
            response.status(404).send({ message: 'House not found' })
        }

        return response.status(200).json({ message: 'House updated successfully'});
    } catch (error) {
        console.log(error.message);
        response.status(500).send({ message: error.message })
    }
})

//Route for getting one house from database by id
router.delete('/:id', async (request, response) => {
    try {
        const { id } = request.params;

        const result = await House.findByIdAndDelete(id);

        if (!result) {
            response.status(404).send({ message: 'House not found' })
        }

        return response.status(200).json({ message: 'House deleted successfully'});
    } catch (error) {
        console.log(error.message);
        response.status(500).send({ message: error.message })
    }
})

export default router;