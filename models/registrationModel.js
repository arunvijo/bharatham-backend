import mongoose from "mongoose";

const registrationSchema = mongoose.Schema(
  {
    event: {
      type: String,
      required: true,
    },
    house: {
      type: String,
      required: true,
    },
    participants: [
      {
        type: Object,
        required: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Registration = mongoose.model("Registration", registrationSchema);
