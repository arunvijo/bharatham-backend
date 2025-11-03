import mongoose from 'mongoose';
import { Participant } from '../models/participantModel.js';

const removeOldParticipationFields = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect("mongodb+srv://rsetbharatham24:ZTM8M6UsQJYgyr3T@cluster0.3krckg1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
        console.log('Connected to MongoDB');

        // Get all participants
        const participants = await Participant.find({});
        console.log(`Found ${participants.length} participants to update`);

        // Update each participant
        for (const participant of participants) {
            // Remove old participation fields
            await Participant.updateOne(
                { _id: participant._id },
                {
                    $unset: {
                        individualParticipation: "",
                        groupParticipation: "",
                        teamParticipation: ""
                    }
                }
            );

            console.log(`Updated participant: ${participant.fullName}`);
        }

        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

// Run the migration
removeOldParticipationFields(); 