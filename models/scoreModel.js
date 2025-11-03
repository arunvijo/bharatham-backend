import mongoose from "mongoose";

const scoreSchema = mongoose.Schema(
    {
        event: {
            type: Object,
            required: true,
        },
        house: {
            type: String,
            required: true,
        },
        registration: {
            type: Object,
            required: true,
        },
        position: {
            type: String,
            required: true,
        },
        points: {
            type: Number,
            default: 0,
            required: true,
        },
        reason: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
)

export const Score = mongoose.model('Score', scoreSchema);