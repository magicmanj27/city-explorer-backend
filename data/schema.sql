-- Schema for city-exployer

DROP TABLE IF EXISTS weathers;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS yelps;
DROP TABLE IF EXISTS movies;
DROP TABLE IF EXISTS trails;
DROP TABLE IF EXISTS locations;

CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    search_query VARCHAR(255),
    formatted_address VARCHAR(255),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7)
);

CREATE TABLE weathers (
    ide SERIAL PRIMARY KEY,
    forecast VARCHAR(255), 
    time VARCHAR(255),
    location_id INTEGER NOT NULL,
    FOREIGN KEY (location_id) REFERENCES...(see demo)
)