const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// mongodb connect and all api

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mjrrjle.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
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
    const moviesCollection = client.db("oyebeauty").collection("movies");

    // save movie into database
    app.post("/add-movie", async (req, res) => {
      const movie = req.body;

      try {
        const result = await moviesCollection.insertOne(movie);
        res.status(201).json(result);
      } catch (error) {
        res.status(500).json({ error: "Failed to add" });
      }
    });

    // get all movie from database
    app.get("/get-all", async (req, res) => {
      try {
        const result = await moviesCollection.find().toArray();
        res.send(result);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch" });
      }
    });

    // get single movie
    app.get("/get-single/:id", async (req, res) => {
      const movieId = req.params.id;

      try {
        const result = await moviesCollection.findOne({
          _id: new ObjectId(movieId),
        });
        if (result) {
          res.send(result);
        } else {
          res.status(404).json({ error: "Movie not found" });
        }
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch" });
      }
    });

    // get movies using pagination
    app.get("/get-paginated", async (req, res) => {
      const page = Number(req.query.page);
      const size = Number(req.query.size);

      try {
        const count = await moviesCollection.countDocuments();
        const totalPages = Math.ceil(count / size);

        if (page > totalPages || page < 1) {
          return res.status(400).json({ error: "Invalid page number" });
        }

        const skip = (page - 1) * size;

        const movies = await moviesCollection
          .find()
          .skip(skip)
          .limit(size)
          .toArray();

        res.json({
          movies,
          totalPages,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch" });
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running");
});
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
