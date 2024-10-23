/*
Project Title : StraySpotter
Project Description : A web service that utilizes Wasabi cloud, for people to share stray cat pictures.
                      The data will be analysed to provide the insight of the stray cats.
Member : KIM JOWOON, ..
Date Started : 21.10.2024
Current version : 1.0
Version date : 21.10.2024
*/

const exifr = require('exifr');


// Get the client
const mysql = require('mysql2');

// Create the connection to database
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'strayspotter_database',
  password: 'SQL_2410_strayspotter' // Hide the Password!
});

// A simple SELECT query
connection.query(
  'SELECT * FROM pictures WHERE id = 10',
  function (err, results, fields) {
    if (err) {
      console.log(err)
    }
    console.log(results[0].id); // results contains rows returned by server
    // console.log(fields); // fields contains extra meta data about results, if available
  }
);
// Ends the connection
connection.end();

/// Fuctions////////////////////////////////////////////////////

 // Function to Extract Meta data
async function extractMetadata() {
    try {
        // Only GPS metadata
        let {latitude, longitude} = await exifr.gps('resources/sample_image1.jpg');
        console.log('GPS Coordinates:', latitude, longitude);
        

        // Only three specific tags
        let file = 'resources/sample_image2.HEIC';  // Example file path
        // let output = await exifr.parse(file, ['ISO', 'Orientation', 'LensModel']);
        let output = await exifr.parse(file,  ['DateTimeOriginal']);
        console.log('Selected Tags:', output);
        // let output = await exifr.parse(file, true);
        
        file = 'resources/sample_image3.jpg'; 
        output = await exifr.parse(file,  ['DateTimeOriginal']);
        if (output === undefined) {
            console.log("Metadata not found or DateTimeOriginal tag is missing.");
        } else {
            console.log("Metadata:", output.DateTimeOriginal);
        }
        
    } catch (error) {
        console.error('Error reading metadata:', error);
    }
}