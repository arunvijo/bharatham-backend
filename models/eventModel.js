import mongoose from "mongoose";

const eventSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        image: {
            type: String,
        },
        participation: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            required: true,
        },
        date: {
            type: String,
            required: true,
        },
        venue: {
            type: String,
        },
        maxIndividualLimit: {
            type: Number,
            required: true,
            default: 1
        },
        minIndividualLimit: {
            type: Number,
            required: true,
            default: 1
        },
        teamLimit: {
            type: Number,
            required: true,
            default: 1
        },
        registrationEnabled: {
            type: Boolean,
            default: true,
            required: true
        }
    },
    {
        timestamps: true,
    }
)

export const Event = mongoose.model('Event', eventSchema);