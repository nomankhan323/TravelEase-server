const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

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


        //  All Vehicles 
        app.get('/vehicles', async (req, res) => {
            try {
                const { category, location, sort } = req.query;

                let query = {};
                let sortOption = {};

                if (category) query.category = category;
                if (location) query.location = location;

                if (sort === "lowToHigh") sortOption.pricePerDay = 1;
                if (sort === "highToLow") sortOption.pricePerDay = -1;

                const vehicles = await vehiclesCollection
                    .find(query)
                    .sort(sortOption)
                    .toArray();

                res.json(vehicles);

            } catch (error) {
                res.status(500).json({ message: "Error fetching vehicles" });
            }
        });


        // Single Vehicle Details
        app.get('/vehicle/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const vehicle = await vehiclesCollection.findOne({ _id: new ObjectId(id) });
                res.json(vehicle);
            } catch (error) {
                res.status(500).json({ message: "Error fetching vehicle" });
            }
        });


        //  Add Vehicle
        app.post('/add-vehicle', async (req, res) => {
            try {
                const vehicleData = req.body;
                vehicleData.createdAt = new Date();

                const result = await vehiclesCollection.insertOne(vehicleData);

                res.status(200).json({
                    success: true,
                    message: "Vehicle Added Successfully!",
                    insertedId: result.insertedId
                });

            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: "Failed to add vehicle"
                });
            }
        });


        //  My Vehicles 
        app.get('/my-vehicles/:email', async (req, res) => {
            try {
                const email = req.params.email;
                const myVehicles = await vehiclesCollection
                    .find({ userEmail: email })
                    .toArray();

                res.json(myVehicles);

            } catch (error) {
                res.status(500).json({ message: "Error fetching user's vehicles" });
            }
        });


        //  Update Vehicle
        app.put('/update-vehicle/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const updatedData = req.body;

                const filter = { _id: new ObjectId(id) };
                const updateDoc = { $set: updatedData };

                const result = await vehiclesCollection.updateOne(filter, updateDoc);

                res.json({
                    success: true,
                    message: "Vehicle updated successfully"
                });

            } catch (error) {
                res.status(500).json({ message: "Failed to update vehicle" });
            }
        });


        //  Delete Vehicle
        app.delete('/delete-vehicle/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const filter = { _id: new ObjectId(id) };

                const result = await vehiclesCollection.deleteOne(filter);

                res.json({
                    success: true,
                    message: "Vehicle deleted successfully"
                });

            } catch (error) {
                res.status(500).json({ message: "Failed to delete vehicle" });
            }
        });


        //  Book Vehicle
        app.post('/book', async (req, res) => {
            try {
                const bookingData = req.body;
                bookingData.bookingDate = new Date();

                const result = await bookingsCollection.insertOne(bookingData);

                res.json({
                    success: true,
                    message: "Booking added successfully",
                    insertedId: result.insertedId
                });

            } catch (error) {
                res.status(500).json({ message: "Booking failed" });
            }
        });


        //  My Bookings
        app.get('/my-bookings/:email', async (req, res) => {
            try {
                const email = req.params.email;

                const bookings = await bookingsCollection
                    .find({ userEmail: email })
                    .toArray();

                res.json(bookings);

            } catch (error) {
                res.status(500).json({ message: "Error fetching bookings" });
            }
        });


    } catch (err) {
        console.error("❌ Connection Error:", err);
    }
}

run().catch(console.dir);


//  Default Route
app.get('/', (req, res) => {
    res.send("🔥 TravelEase Backend Server Running...");
});


// Start Server
app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});
