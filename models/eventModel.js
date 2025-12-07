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
        // 'participation' could be 'individual', 'group', 'combined'
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
        // House Limit: Max entries a House can send (e.g., Essay: 15)
        maxRegistrations: {
            type: Number,
            required: true,
            default: 100 // Default to high number if no limit
        },
        // House Limit: Min entries a House must send (e.g., Essay: 10)
        minRegistrations: {
            type: Number,
            required: true,
            default: 0
        },
        // Team Limit: Max students in one team (e.g., Group Dance: 10)
        maxTeamSize: {
            type: Number,
            required: true,
            default: 1
        },
        // Team Limit: Min students in one team (e.g., Group Dance: 7)
        minTeamSize: {
            type: Number,
            required: true,
            default: 1
        },
        // Flags if this is a Pre-event (affects logic)
        isPreEvent: {
            type: Boolean,
            default: false,
            required: true
        },
        // Flags if this counts towards the 5 Individual / 3 Group limit
        // Set to false for Short film, Adzap, Making of bharatham
        countsTowardsLimit: {
            type: Boolean,
            default: true,
            required: true
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

// import mongoose from "mongoose";

// const eventSchema = mongoose.Schema(
//     {
//         name: {
//             type: String,
//             required: true,
//         },
//         image: {
//             type: String,
//         },
//         participation: {
//             type: String,
//             required: true,
//         },
//         type: {
//             type: String,
//             required: true,
//         },
//         category: {
//             type: String,
//             required: true,
//         },
//         date: {
//             type: String,
//             required: true,
//         },
//         venue: {
//             type: String,
//         },
//         maxIndividualLimit: {
//             type: Number,
//             required: true,
//             default: 1
//         },
//         minIndividualLimit: {
//             type: Number,
//             required: true,
//             default: 1
//         },
//         teamLimit: {
//             type: Number,
//             required: true,
//             default: 1
//         },
//         registrationEnabled: {
//             type: Boolean,
//             default: true,
//             required: true
//         }
//     },
//     {
//         timestamps: true,
//     }
// )

// export const Event = mongoose.model('Event', eventSchema);