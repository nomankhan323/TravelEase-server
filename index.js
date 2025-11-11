const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

async function run() {
    try {
        await client.connect();

        const db = client.db("travelEaseDB");
        const vehiclesCollection = db.collection("vehicles");
        const bookingsCollection = db.collection("bookings");

        console.log("✅ MongoDB Connected Successfully!");

        //  Get All Vehicles
        app.get("/vehicles", async (req, res) => {
            try {
                const { category, location, sort } = req.query;

                let query = {};
                let sortOption = {};

                if (category) query.category = category;
                if (location) query.location = location;

                if (sort === "lowToHigh") sortOption.price = 1;
                if (sort === "highToLow") sortOption.price = -1;

                const vehicles = await vehiclesCollection
                    .find(query)
                    .sort(sortOption)
                    .toArray();

                res.json(vehicles);
            } catch (error) {
                console.error("Error:", error);
                res.status(500).json({ message: "Error fetching vehicles" });
            }
        });

        //  Single Vehicle Details
        app.get("/vehicle/:id", async (req, res) => {
            try {
                const id = req.params.id;
                const vehicle = await vehiclesCollection.findOne({
                    _id: new ObjectId(id),
                });

                res.json(vehicle);
            } catch (error) {
                res.status(500).json({ message: "Error fetching vehicle" });
            }
        });

        //  Add a Vehicle
        app.post("/add-vehicle", async (req, res) => {
            try {
                const data = req.body;

                data.createdAt = new Date();

                const result = await vehiclesCollection.insertOne(data);

                res.json({
                    success: true,
                    message: "Vehicle Added Successfully",
                    insertedId: result.insertedId,
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: "Failed to add vehicle",
                });
            }
        });
