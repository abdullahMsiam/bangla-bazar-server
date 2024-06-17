const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = 3000

app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gtc9ihn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri);

async function run() {
    try {
        await client.connect();

        const userDB = client.db("userDB");
        const userCollection = userDB.collection("userCollection");

        app.post("/user", async (req, res) => {
            const user = req.body;
            const isUserExist = await userCollection.findOne({ email: user?.email });
            if (isUserExist?._id) {
                return res.send({ status: "login success" });
            }
            const result = await userCollection.insertOne(user);
            res.send(result);
        });

        // get user by email
        app.get('/user/:email', async (req, res) => {
            const email = req.params.email;

            const result = await userCollection.findOne({ email });
            res.send(result);
        });

        //get edit profile
        app.get('/user/get/:id', async (req, res) => {
            const id = req.params.id;

            const result = await userCollection.findOne({ _id: new ObjectId(id) });
            res.send(result);
        });

        // update a profile data 
        app.patch('/user/:email', async (req, res) => {
            const email = req.params.email;
            const userData = req.body;

            const result = await userCollection.updateOne({ email }, { $set: userData }, { upsert: true });
            res.send(result);
        })





        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    }

    finally {
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

