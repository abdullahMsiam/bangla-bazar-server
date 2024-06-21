const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gtc9ihn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization

    if (!authorization) {
        return res.status(401).send({ error: true, message: 'unauthorized access' });
    }

    const token = authorization.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
        if (error) {
            return res.status(403).send({ error: true, message: 'unauthorized access' });
        }
        req.decoded = decoded;
        next();
    })


}

async function run() {
    try {
        await client.connect();

        const userDB = client.db("userDB");
        const productDB = client.db("productDB");
        const userCollection = userDB.collection("userCollection");
        const productsCollection = productDB.collection("productsCollection");

        //jwt
        app.post("/jwt", (req, res) => {
            const loggedUser = req.body;

            const token = jwt.sign(loggedUser, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1h'
            });

            res.send({ token })
        })

        // post a user
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
        app.get('/user/:email', verifyJWT, async (req, res) => {
            const decoded = req.decoded;

            const email = req.params.email;

            if (decoded.email !== email) {
                return res.status(402).send({ error: true, message: 'you can not get data' })
            }

            const result = await userCollection.findOne({ email });
            res.send(result);
        });

        //get edit profile by id
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


        // PRODUCTS

        app.get('/products', async (req, res) => {
            const result = await productsCollection.find().toArray();

            res.send(result);
        })

        // Post a product
        app.post('/products', async (req, res) => {
            const product = req.body;

            const result = await productsCollection.insertOne(product);
            res.send(result);
        })

        // get product by id
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;

            const result = await productsCollection.findOne({ _id: new ObjectId(id) });
            res.send(result);
        })

        // update a product data
        app.patch('/products/:id', async (req, res) => {
            const id = req.params.id;
            const productData = req.body;


            const result = await productsCollection.updateOne({ _id: new ObjectId(id) }, { $set: productData });
            res.send(result);
        })


        // DELETE A PRODUCT
        app.delete("/products/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };

            const result = await productsCollection.deleteOne(query);
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

