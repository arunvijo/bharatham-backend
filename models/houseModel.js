import mongoose from "mongoose";

const houseSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        captain: {
            type: String,
            required: true,
        },
        totalPoints: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true,
    }
)

export const House = mongoose.model('House', houseSchema);