import mongoose from "mongoose";

const participantSchema = mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    uid: {
      type: String,
      required: true,
    },
    branch: {
      type: String,
      required: true,
    },
    semester: {
      type: String,
      required: true,
    },
    house: {
      type: String,
      required: true,
    },
    individual: {
      type: Number,
      default: 0,
    },
    group: {
      type: Number,
      default: 0,
    },
    literary: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Participant = mongoose.model("Participant", participantSchema);
