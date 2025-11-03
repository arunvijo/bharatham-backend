import mongoose from 'mongoose';
import { Event } from '../models/eventModel.js';

const addRegistrationEnabled = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect("mongodb+srv://rsetbharatham24:ZTM8M6UsQJYgyr3T@cluster0.3krckg1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
        console.log('Connected to MongoDB');

        // Get all events
        const events = await Event.find({});
        console.log(`Found ${events.length} events to update`);

        // Update each event
        for (const event of events) {
            // Check if registrationEnabled field exists
            if (event.registrationEnabled === undefined) {
                // Add registrationEnabled field with default value true
                await Event.updateOne(
                    { _id: event._id },
                    {
                        $set: {
                            registrationEnabled: true
                        }
                    }
                );
                console.log(`Updated event: ${event.name}`);
            }
        }

        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

// Run the migration
addRegistrationEnabled(); 