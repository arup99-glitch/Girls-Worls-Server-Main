const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const { MongoClient,ServerApiVersion} = require('mongodb');
const port = process.env.PORT || 5000;

const admin = require("firebase-admin");

const serviceAccount = require('./girlsWorld.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

app.use(cors());
app.use(express.json());

const uri =  "mongodb+srv://girlsWorld:0zR9fqcGejVAhyUf@cluster0.nksio.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function verifyToken(req,res,next){
  if (req.headers?.authorization?.startsWith('Bearer ')){
    const token = req.headers.authorization.split(' ')[1];

    try{
         const decodedUser = await admin.auth().verifyIdToken(token);
         req.decodedEmail = decodedUser.email;

    }
    catch{

    }
  }
  next();
}

async function run(){
   
    try{
            await client.connect();
            const database = client.db('girlsworld');
            const servicesCollection = database.collection('blogs');
            const usersCollection = database.collection('users');
            const bestsellerCollection = database.collection('bestseller');
            const trendingCollection = database.collection('trending');
            const bookingCollection = database.collection('booking');

            //Get API

            app.get('/blogs', async(req,res) =>{
              const cursor = servicesCollection.find({});
              const blogs = await cursor.toArray();
              res.send(blogs);
            });

            app.get('/bestseller', async(req,res) =>{
              const cursor = bestsellerCollection.find({});
              const bestseller = await cursor.toArray();
              bestseller.forEach(sd=> sd.id=sd._id.toString());
              res.send(bestseller);
            });

            app.get('/trending', async(req,res) =>{
              const cursor = trendingCollection.find({});
              const trending = await cursor.toArray();
              res.send(trending);
            })
            

            //POSR API
            app.post('/blogs', async(req,res) => {
                const blog = req.body;
                try {
                  const result = await servicesCollection.insertOne(blog);
                  // console.log(result)
                  if(result.acknowledged){
                      console.log('inert here')
                      res.send({error:false,data:result,message:'Inserted Successfully!'})
                  }
              } catch (error) {
                  console.log(error)
                  res.status(502).send({error:true,data:null,message:error})
              }

            });


            app.post('/bestseller', async(req,res) => {
                const bestseller = req.body;
                try {
                  const result = await bestsellerCollection.insertOne(bestseller);
                  // console.log(result)
                  if(result.acknowledged){
                      console.log('inert here')
                      res.send({error:false,data:result,message:'Inserted Successfully!'})
                  }
              } catch (error) {
                  console.log(error)
                  res.status(502).send({error:true,data:null,message:error})
              }

            });
            app.post('/trending', async(req,res) => {
                const trending = req.body;
                try {
                  const result = await trendingCollection.insertOne(trending);
                  // console.log(result)
                  if(result.acknowledged){
                      console.log('inert here')
                      res.send({error:false,data:result,message:'Inserted Successfully!'})
                  }
              } catch (error) {
                  console.log(error)
                  res.status(502).send({error:true,data:null,message:error})
              }

            });
            
            app.get('/users/:email', async (req,res) => {
              const email = req.params.email;
              const query = {email: email};
              const user = await usersCollection.findOne(query);
              let isAdmin = false;
              if(user?.role === 'admin'){
                isAdmin = true;
              }
              res.json({admin: isAdmin})
            });


            app.post('/users', async(req,res) => {
              const user = req.body;
                const result = await usersCollection.insertOne(user);
                res.json(result);
            });

            app.put('/users',async (req,res) => {
              const user = req.body;
              const filter= {email: user.email };
              const options = {upsert: true};
              const updateDoc = {$set: user};
              const result = await usersCollection.updateOne(filter, updateDoc,options);
              res.json(result);


            });

            app.put('/users/admin',verifyToken, async(req,res) => {
              const user = req.body;
              const requester = req.decodedEmail;
              if(requester){
                const requesterAccount = await usersCollection.findOne({email:requester});
                 if(requesterAccount.role === 'admin'){

                  const filter = {email: user.email};
                  const updateDoc={$set: {role: 'admin'}};
                  const result = await usersCollection.updateOne(filter,updateDoc);
                  res.json(result);
                 }
              }
              else{
                res.status(403).json({message: 'You do not have to Acces'});
              }
             
            });
            

            //booking post

            app.get('/booking',async(req,res) => {
              const email=req.query.email;
              const query = {email: email}
              const cursor = bookingCollection.find(query);
              const booking = await cursor.toArray();
              res.json(booking);
            });
            app.post('/booking',async(req,res) => {
             const booking = req.body;
             const result = await bookingCollection.insertOne(booking);
             console.log(result);
             res.json(result);
            });

          
    }
    finally{
           // await client.close();
    }
}
run();


app.use(cors());

app.get('/', (req, res) => {
  res.send('Hello Girls World!')
})

app.listen(port, () => {
  console.log(`listening at port ${port}`)
})

// DB_USER=girlsWorld
// DB_PASS=0zR9fqcGejVAhyUf