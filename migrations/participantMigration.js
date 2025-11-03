import mongoose from 'mongoose';
import { Participant } from '../models/participantModel.js';

const migrateParticipants = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect("mongodb+srv://rsetbharatham24:ZTM8M6UsQJYgyr3T@cluster0.3krckg1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
        console.log('Connected to MongoDB');

        // Get all participants
        const participants = await Participant.find({});
        console.log(`Found ${participants.length} participants to migrate`);

        // Update each participant
        for (const participant of participants) {
            // Calculate new participation counts
            const individualCount = (participant.individualParticipation?.offstage || 0) + 
                                 (participant.individualParticipation?.onstage || 0);
            
            const groupCount = (participant.groupParticipation?.offstage || 0) + 
                             (participant.groupParticipation?.onstage || 0);
            
            const literaryCount = (participant.individualParticipation?.onstageLiterary || 0) + 
                                (participant.individualParticipation?.offstageLiterary || 0) +
                                (participant.groupParticipation?.onstageLiterary || 0) +
                                (participant.groupParticipation?.offstageLiterary || 0);

            // First, remove the old structure completely
            await Participant.updateOne(
                { _id: participant._id },
                {
                    $unset: {
                        individualParticipation: "",
                        groupParticipation: "",
                        literaryParticipation: ""
                    }
                }
            );

            // Then, set the new structure
            await Participant.updateOne(
                { _id: participant._id },
                {
                    $set: {
                        individual: individualCount,
                        group: groupCount,
                        literary: literaryCount
                    }
                }
            );

            console.log(`Migrated participant: ${participant.fullName}`);
        }

        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

// Run the migration
migrateParticipants(); 