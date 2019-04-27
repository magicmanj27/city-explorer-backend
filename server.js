'use strict';

// Load Environment Variables from the .env file
require('dotenv').config();

// Application Dependencies
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');

// Application Setup
const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;

// Incoming API Routes
app.get('/location', searchToLatLong);
app.get('/weather', getWeather);
app.get('/events', getEvent);

// Make sure the server is listening for requests
app.listen(PORT, () => console.log(`City Explorer is up on ${PORT}`));

// Helper Functions

function searchToLatLong(request, response) {
  // Define the URL for the GEOCODE  API
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${request.query.data}&key=${process.env.GEOCODE_API_KEY}`;
  // console.log(url);

  superagent.get(url)
    .then(result => {
      // console.log(result.body.results[0]);
      console.log('=======================');
      console.log(request.query.data);
      console.log('-----------------------------');
      console.log(result);
      const location = new Location(request.query.data, result);
      response.send(location);
    })
    .catch(err => handleError(err, response));
}

function Location(query, res) {
  this.search_query = query;
  this.formatted_query = res.body.results[0].formatted_address;
  this.latitude = res.body.results[0].geometry.location.lat;
  this.longitude = res.body.results[0].geometry.location.lng;
  console.log('this is formatted address.........', this.formatted_query);
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

