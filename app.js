const express = require('express');
const bodyParser = require('body-parser');

const feedRoutes = require('./routes/feed');

const app = express();

// app.use(bodyParser.urlencoded()); // x-www-form-urlencoded default way for data to be exported using <form>
app.use(bodyParser.json()); // parses application/json data

// Bypass CORS Error
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // second parameter allows which domains you want allow to access * allows access to all
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');   // allows content-type changes
    next();
});

app.use('/feed', feedRoutes);

app.listen(8080);