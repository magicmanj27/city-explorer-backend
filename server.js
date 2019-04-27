'use strict';

// demo for lab 8 also did weather, see demo in class repo

// Load Environment Variables from the .env file
require('dotenv').config();

// Application Dependencies
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');

// Application Setup
const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;

// MAC: DATABASE_URL=postgres://localhost:5432/city_explorer
// WINDOWS: DATABASE_URL=postres://<user-name>:<password>/@localhost:5432/city_explorer

//connect to database
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.log(err));

// Incoming API Routes
app.get('/location', searchToLatLong);
app.get('/weather', getWeather);
app.get('/events', getEvent);

// Make sure the server is listening for requests
app.listen(PORT, () => console.log(`City Explorer is up on ${PORT}`));

// Helper Functions

// What we need to do to refactor for sql storage

// 1. We need to check the dtatbase to see if the location exists
//   a. If it exists => get the location from the database
//   b. Return the location info to the front-end

// 2. If the location is not in the database
//   a. Gte teh location from the API
//   b. Run the data through the constructor
//   c. Save it to the database
//   d. Add the newly added location id to the location object
//   e. Return teh location to the front-end.

// function searchToLatLong(request, response) {
//   // Define the URL for the GEOCODE  API
//   const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${request.query.data}&key=${process.env.GEOCODE_API_KEY}`;
//   // console.log(url);

//   superagent.get(url)
//     .then(result => {
//       // console.log(result.body.results[0]);
//       console.log('=======================');
//       console.log(request.query.data);
//       console.log('-----------------------------');
//       console.log(result);
//       const location = new Location(request.query.data, result);
//       response.send(location);
//     })
//     .catch(err => handleError(err, response));
// }

function searchToLatLong(request, response) {
  let query = request.guery.data // The city we ask for

  //Define the search query
  let sql = `SELECT * FROM locations WHERE search_query=$1;`; // $1 allows us to avoid random stuff being able to be put in on accident
  let values = [query];
  // sql will always be a string that you create. Values will always be an array of what you make.

  // Make the query of the database
  client.query(sql, values)
    .then (result => {
      console.log('result from database', results.row[0]);
    // Did the database return any info?
      if (results.rowCount > 0) {
        response.send(result.rows[0]);

      } else {
        // otherwise go get the data from the API
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${request.query.data}&key=${process.env.GEOCODE_API_KEY}`;
  // console.log(url);

  superagent.get(url)
    .then(result => {
      if (!result.body.results.length) {throw 'NO DATA'}
      else {
        let location = new Location(query, result.body.results[0])


        let newSQL = `INSERT INTO locations (search_query, formatted_address. latitude, longitude) VALUES ($1, $2, $3, $4) RETURNING ID;`;
        let newValues = Object.values(location);

        client.query(newSQL, newValues)
        .then(data => {
          // attach returning id to the location object
          location.id = reult.rows[0].id;
          response.send(location);
        });
      }
    })
    .catch(err => handleError(err, response));
  }
});

function Location(query, res) {
  this.search_query = query;
  this.formatted_query = res.body.results[0].formatted_address;
  this.latitude = res.body.results[0].geometry.location.lat;
  this.longitude = res.body.results[0].geometry.location.lng;
}

function getWeather(request, response) {
  // Define the URL for the DARKSKY API
  const url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${request.query.data.latitude},${request.query.data.longitude}`;
  // console.log(url);

  superagent.get(url)
    .then(result => {
      // console.log(result.body);
      const weatherSummaries = result.body.daily.data.map(day => new Weather(day));
      response.send(weatherSummaries);
    })
    .catch(err => handleError(err, response));
}

function Weather(day) {
  this.forecast = day.summary;
  this.time = new Date(day.time * 1000).toString().slice(0, 15);
}

function getEvent(request, response) {

  const url = `https://www.eventbriteapi.com/v3/events/search/?token=${process.env.EVENTBRITE_API_KEY}&location.latitude=${request.query.data.latitude}&location.longitude=${request.query.data.longitude}`;

  // console.log(url);

  superagent.get(url)
    .then(result => {
      // console.log(result.body.events);
      const eventSummeries = result.body.events.map(event => new Event(event));
      response.send(eventSummeries);
    })
    .catch(err => handleError(err, response));
}

function Event(event) {
  this.link = event.url;
  this.name = event.name.text;
  this.event_date = event.start.local;
  this.summary = event.summary;
}

// Error Handler
function handleError(err, response) {
  console.error(err);
  if (response) response.status(500).send('Sorry something went wrong');
}
