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

let vehiclesCollection;
let bookingsCollection;

async function connectDB() {
    try {
        if (!client.topology?.isConnected()) {
            await client.connect();
            console.log("✅ MongoDB Connected Successfully!");
        }
        const db = client.db("travelEaseDB");
        vehiclesCollection = db.collection("vehicles");
        bookingsCollection = db.collection("bookings");
    } catch (err) {
        console.error("❌ MongoDB Connection Error:", err);
    }
}

connectDB();


// Get All Vehicles
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

// Single Vehicle Details
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

// Add a Vehicle
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

// My Vehicles
app.get("/my-vehicles/:email", async (req, res) => {
    try {
        const email = req.params.email;
        const myVehicles = await vehiclesCollection
            .find({ userEmail: new RegExp(`^${email}$`, "i") })
            .toArray();

        res.json(myVehicles);
    } catch (error) {
        res.status(500).json({ message: "Error fetching user's vehicles" });
    }
});

// Update Vehicle
app.put("/update-vehicle/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const updatedData = req.body;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = { $set: updatedData };

        await vehiclesCollection.updateOne(filter, updateDoc);

        res.json({
            success: true,
            message: "Vehicle Updated Successfully",
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to update vehicle" });
    }
});

// Delete Vehicle
app.delete("/delete-vehicle/:id", async (req, res) => {
    try {
        const id = req.params.id;
        await vehiclesCollection.deleteOne({ _id: new ObjectId(id) });

        res.json({
            success: true,
            message: "Vehicle Deleted Successfully",
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete vehicle" });
    }
});

// Book Vehicle
app.post("/book", async (req, res) => {
    try {
        const data = req.body;
        data.bookingDate = new Date();

        const result = await bookingsCollection.insertOne(data);

        res.json({
            success: true,
            message: "Booking Successful",
            insertedId: result.insertedId,
        });
    } catch (error) {
        res.status(500).json({ message: "Booking failed" });
    }
});

// Get My Bookings
app.get("/my-bookings/:email", async (req, res) => {
    try {
        const email = req.params.email;
        const bookings = await bookingsCollection
            .find({ userEmail: email })
            .toArray();

        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch bookings" });
    }
});


app.get("/", (req, res) => {
    res.send("🔥 TravelEase Backend Server Running...");
});

if (process.env.NODE_ENV !== "production") {
    app.listen(port, () => {
        console.log(`🚀 Server running on port ${port}`);
    });
}

module.exports = app;
