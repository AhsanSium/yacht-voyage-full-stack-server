const express = require('express');
const cors = require('cors');
const MongoClient = require('mongodb').MongoClient;
const fileUpload = require('express-fileupload');
const fs = require('fs-extra');
const ObjectId = require('mongodb').ObjectID;

const app = express();

app.use(express.json());
app.use(cors());

app.use(express.static('yachts'));
app.use(express.static('customer'));
app.use(fileUpload());
require('dotenv').config()

const port = 5000;


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.afifr.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
    const yachtsCollection = client.db(`${process.env.DB_NAME}`).collection("yachts");

    const bookingCollection = client.db(`${process.env.DB_NAME}`).collection("bookings");

    const reviewCollection = client.db(`${process.env.DB_NAME}`).collection("customer-review");

    const adminCollection = client.db(`${process.env.DB_NAME}`).collection("admins");

    console.log('MongoDB Connected');

    app.get('/yachts', (req, res) => {
        yachtsCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    })

    app.get('/customer-reviews', (req, res) => {
        reviewCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    })

    app.get('/yachtById/:id', (req, res) => {
        const id = req.params.id;
        console.log(id);
        yachtsCollection.find({ _id: ObjectId(id) })
            .toArray((err, document) => {
                console.log(document);
                res.send(document[0]);
            })
    })

    app.post('/bookYacht', (req, res) => {
        const book = req.body;
        console.log(book);
        bookingCollection.insertOne(book)
            .then(result => {
                res.send(result.insertedCount > 0);
            })
    })

    app.post('/addYacht', (req, res) => {
        // const newYacht = req.files.image;
        const file = req.files.file;
        const name = req.body.name;
        const location = req.body.location;
        const price = req.body.price;
        const speed = req.body.speed;
        const people = req.body.people;
        const bed = req.body.bed;

        console.log('adding Product', file, name, location, price, speed, people, bed);

        let newImg = file.data;
        const encImg = newImg.toString('base64');
        let image = {
            contentType: file.mimetype,
            size: file.size,
            img: Buffer.form(encImg, 'base64')
        };
        yachtsCollection.insertOne({ name, location, price, speed, people, bed, image })
            .then(result => {
                res.send(result.insertedCount > 0)
            })



    })

    app.post('/addReview', (req, res) => {
        // const newYacht = req.files.image;
        const file = req.files.file;
        const name = req.body.name;
        const description = req.body.description;
        const rating = req.body.rating;

        const filePath = `${__dirname}/customer/${file.name}`;

        console.log('adding Review', file, name, description, rating);

        file.mv(filePath, err => {
            if (err) {
                console.log(err);
                return res.status(500).send({ msg: 'Failed to upload Image' })
            }

            let newImg = fs.readFileSync(filePath);
            const encImg = newImg.toString('base64');
            let image = {
                contentType: req.files.file.mimetype,
                size: req.files.file.size,
                img: Buffer(encImg, 'base64')
            };
            reviewCollection.insertOne({ name, description, rating, image })
                .then(result => {
                    console.log('Inserted Count', result.insertedCount)

                    fs.remove(filePath, err => {
                        if (err) {
                            console.log(err);
                        }
                        res.send(result.insertedCount > 0)
                    })
                })
        })


    })

    app.get('/bookings', (req, res) => {

        console.log(req.query.email);

        bookingCollection.find({ email: req.query.email })
            .toArray((err, documents) => {
                res.status(200).send(documents);
                console.log(documents);
            })

    })

    app.get('/allBookings', (req, res) => {

        bookingCollection.find()
            .toArray((err, documents) => {
                res.status(200).send(documents);
                console.log(documents);
            })

    })

    app.delete('/delete/:id', (req, res) => {
        yachtsCollection.deleteOne({ _id: ObjectId(req.params.id) })
            .then(result => {
                console.log(result);
                res.send(res.deletedCount > 0);
            })
    })

    app.post('/addAdmin', (req, res) => {
        const email = req.body;
        console.log(email);
        adminCollection.insertOne(email)
            .then(result => {
                res.send(result.insertedCount > 0);
            })
    })

    app.get('/admins', (req, res) => {
        adminCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    })

});



app.get('/', (req, res) => {
    res.send('Db Working');
})

app.listen(process.env.PORT || port);