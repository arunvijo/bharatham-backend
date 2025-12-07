import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import { PORT, mongodbURL } from "./config.js";
import participantRoute from "./routes/participantRoute.js";
import eventRoute from "./routes/eventRoute.js";
import registrationRoute from "./routes/registrationRoute.js";
import houseRoute from "./routes/houseRoute.js";
import scoreRoute from "./routes/scoreRoute.js";

const app = express();

// Middleware for parsing request body
app.use(express.json());

// Middleware for handling CORS POLICY
// ----------------------------------------------------
// OPTION 1: Allow All Origins (ENABLED FOR DEBUGGING)
// This fixes the issue where the frontend request is blocked.
app.use(cors()); 
// ----------------------------------------------------

// OPTION 2: Allow Custom Origins (Disabled for now)
// Once everything works perfect locally, you can switch back to this.
/*
app.use(
  cors({
    origin: [
      "http://localhost:5173", 
      "https://bharatham25.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);
*/

app.get("/", (request, response) => {
  console.log("Root route hit! Server is running.");
  return response.status(234).send("Welcome to Bharatham 2026 Backend");
});

app.use("/score", scoreRoute);
app.use("/house", houseRoute);
app.use("/participant", participantRoute);
app.use("/event", eventRoute);
app.use("/registration", registrationRoute);

mongoose
  .connect(mongodbURL)
  .then(() => {
    console.log("App connected to database");
    app.listen(PORT, () => {
      console.log(`App is listening to port : ${PORT}`);
    });
  })
  .catch((error) => {
    console.log(error);
  });


// import express, { response } from "express";
// import mongoose from "mongoose";
// import cors from "cors";

// import { PORT, mongodbURL } from "./config.js";
// import participantRoute from "./routes/participantRoute.js";
// import eventRoute from "./routes/eventRoute.js";
// import registrationRoute from "./routes/registrationRoute.js";
// import houseRoute from "./routes/houseRoute.js";
// import scoreRoute from "./routes/scoreRoute.js";

// const app = express();

// // Middleware for parsing request body
// app.use(express.json());

// // Middleware for handling CORS POLICY'
// //Option 1: Allow All Origins with default of cors(*)
// // app.use(cors()); // <-- This line should be commented out or deleted.

// //Option 2: Allow Custom Origins
// app.use(
//   cors({
//     origin: [
//       "http://localhost:5173", // For local testing
//       "httpss://bharatham-frontend.onrender.com", // Old senior's frontend (can be removed later)
//       "https://bharatham25.vercel.app", // <-- YOUR NEW FRONTEND IS NOW ALLOWED
//     ],
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     allowedHeaders: ["Content-Type"],
//   })
// );

// app.get("/", (request, response) => {
//   console.log(request);
//   return response.status(234).send("Welcome to MERN Stack Tutorial");
// });

// app.use("/score", scoreRoute);
// app.use("/house", houseRoute);
// app.use("/participant", participantRoute);
// app.use("/event", eventRoute);
// app.use("/registration", registrationRoute);

// mongoose
//   .connect(mongodbURL)
//   .then(() => {
//     console.log("App connected to database");
//     app.listen(PORT, () => {
//       console.log(`App is listening to port : ${PORT}`);
//     });
//   })
//   .catch((error) => {
//     console.log(error);
//   });

