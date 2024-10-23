/*
Project Title : StraySpotter
Project Description : A web service that utilizes Wasabi cloud, for people to share stray cat pictures.
  The data will be analysed to provide the insight of the stray cats.
Member : KIM JOWOON, ..
Date Started : 21.10.2024
Current version : 1.0
Version date : 23.10.2024
*/

// Create the connection to database
const mysql = require('mysql2');
require('dotenv').config();

// Extracted data from the picture
let data = {
  latitude : null,
  longitude : null,
  date : null,
  postcode : 123,
  district_no : 12,
  district_name : 'TEST',
  cat_status : 1,
};

const exifr = require('exifr');
let filename = 'resources/sample_image1.jpg';
extractMetadata(filename).then(metadata => {
  data.latitude = metadata.latitude;
  data.longitude = metadata.longitude;
  data.date = metadata.GPSDateStamp.replaceAll(':','-');
  insert_data(data);
});


/////////////////////////////////////////////////////////////////////////////////////////////////
// Fuctions 
/////////////////////////////////////////////////////////////////////////////////////////////////

 // Extract Metadata from the picture
async function extractMetadata(file) {
    try {
        // Extract all data
        // let output = await exifr.parse(file, true);
        let output = await exifr.parse(file, ['GPSLatitude', 'GPSLongitude', 'GPSDateStamp']);
        if (output === undefined) {
            console.log("Metadata undefined");
        } else {
            console.log("Data retrieved!: ");
        }
        return output;
    } catch (error) {
        console.error('Error reading metadata:', error);
        return null;
    }
}

function insert_data(data) {
  const connection = createDBConnection()
  // A query to insert data into table
  connection.query(
    `INSERT INTO pictures (latitude, longitude, date_taken, postcode, district_no, district_name, cat_status) 
    VALUES (` + data.latitude + `, ` + data.longitude + `,'` + data.date + `' ,` 
              + data.postcode + `,` + data.district_no + `, '` + data.district_name + `' ,` 
              + data.cat_status + `);`
    ,function (err, results) {
      if (err) { console.log(err) }
      console.log(results);
    }
  );
  // Ends the connection
  connection.end();
}

function select_data() {
  const connection = createDBConnection()
  // A query to insert data into table
  connection.query(
    `SELECT * FROM pictures`
    ,function (err, results) {
      if (err) { console.log(err) }
      console.log(results);
    }
  );
  // Ends the connection
  connection.end();
}

function createDBConnection() {
  const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'strayspotter_database',
    password: process.env.DB_PASSWORD,
  });
  return connection;
}