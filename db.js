// Functions interacting with the database
module.exports = {
  insertDataToDB, fetchRecentPhotoID, createDBConnection, countPicturesToday, fetchGPSByID, GPStoAddress, reverseGeocoding, countPicturesLocation, createReport
}
const mysql = require('mysql2');
const { postalData, NumbertoName } = require('./postal_data.js');
const axios = require('axios');
require('dotenv').config();

// THE ADDRESS AND CAT STAUTS TO BE UPDATED
function insertDataToDB(metadata, result) {
  console.log(metadata);
  console.log(result);

    const connection = createDBConnection()
    let data = {
      latitude : metadata.latitude,
      longitude : metadata.longitude,
      date : metadata.CreateDate ?? "9999-12-30"
    }

    if (!result){
      data.postcode = "0";
      data.district_no = "0";
      data.district_name = "none";
    } else {
      data.postcode = result.postcode;
      data.district_no = result.districtNo;
      data.district_name = result.districtName;
      data.cat_status = 1;
    }

    return new Promise((resolve, reject) => {
      connection.query(
        `INSERT INTO pictures (latitude, longitude, date_taken, postcode, 
        district_no, district_name, cat_status) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [data.latitude, data.longitude, data.date, data.postcode, data.district_no, data.district_name, data.cat_status],
        (err, results) => {
          if (err) { reject(err);} 
          else { resolve(results.insertId); }
          connection.end();
        })
    })
}


function fetchRecentPhotoID(number = 4) {
  const connection = createDBConnection();
  
  return new Promise((resolve, reject) => {
    // A query to fetch recent photo ids from the DB
    connection.query(
      `SELECT id FROM pictures ORDER BY id DESC LIMIT ?`, [number],
      (err, results) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          resolve(results);
        }
        connection.end();
      }
    );
  });
}


function fetchGPSByID(id) {
  return new Promise((resolve, reject) => {
    const connection = createDBConnection();

    // A query to select data from the table
    connection.query(
      `SELECT latitude, longitude FROM pictures WHERE id = ?`, 
      [id], // Pass `id` as an array for parameter binding
      function (err, results) {
        // Ends the connection
        connection.end();
        if (err) {
          return reject(err); // Reject the promise with the error
        }
        resolve(results); // Resolve the promise with the results
      }
    );
  });
}

  
function countPicturesToday() {
  const connection = createDBConnection();
  
  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT COUNT(id) as count FROM pictures WHERE date_taken = CURDATE();`,
      (err, results) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          const count = results[0].count;
          resolve(count);
        }
        connection.end();
      }
    );
  })
}

//TODO: Instead of reconnecting everytime, cConnect once the app starts
function createDBConnection() {
  const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'strayspotter_database',
    password: process.env.DB_PASSWORD,
  });
  return connection;
}

// day month week
async function createReport(request_type) {
  let report = "";

  let total = await countPicturesLocation(0, request_type);
  report = report.concat(`TOTAL NUMBER: ${total}<br><br>`);

  for (let district_i = 1; district_i <= 28; district_i++) {
    const district_name = NumbertoName[district_i];
    const count = await countPicturesLocation(district_i, request_type);
    report = report.concat(`${district_name}: ${count}<br>`);
  }
  return report;
}
  
function countPicturesLocation(districtNo, type) {
  const connection = createDBConnection();
  let query = `SELECT COUNT(id) as count FROM pictures WHERE date_taken = CURDATE()`;
  let add_query = `AND district_no = ${districtNo};`;

  if (type === "week") {
    query = `SELECT COUNT(id) as count FROM pictures 
    WHERE WEEK(date_taken) = WEEK(CURDATE())  
    AND YEAR(date_taken) = YEAR(CURDATE())`;
  } else if (type === "month") {
    query = `SELECT COUNT(id) as count FROM pictures 
    WHERE MONTH(date_taken) = MONTH(CURDATE()) 
    AND YEAR(date_taken) = YEAR(CURDATE())`;
  } 
  if(districtNo == 0) {
    query = query.concat(';');
  }
  else {
    query = query.concat(add_query)
  }
}

async function createReport(request_type) {
    let report = "";
  
    for (let district_i = 1; district_i <= 28; district_i++) {
      const district_name = NumbertoName[district_i];
      const count = await countPicturesLocation(district_i, request_type);
      report = report.concat(`${district_name}: ${count} <br>`);
    }
    return report;
}
    
function countPicturesLocation(districtNo, type) {
const connection = createDBConnection();
let query = "";

if (type === "day") {
  query = `SELECT COUNT(id) as count FROM pictures WHERE date_taken = CURDATE() AND district_no = ${districtNo};`; //DEFAULT DAY
}
if (type === "week") {

    query = `SELECT COUNT(id) as count FROM pictures 
    WHERE WEEK(date_taken) = WEEK(CURDATE())  
    AND YEAR(date_taken) = YEAR(CURDATE()) 
    AND district_no = ${districtNo};`;
} else if (type === "month") {
    query = `SELECT COUNT(id) as count FROM pictures 
    WHERE MONTH(date_taken) = MONTH(CURDATE()) 
    AND YEAR(date_taken) = YEAR(CURDATE()) 
    AND district_no = ${districtNo};`;
} 

return new Promise((resolve, reject) => {
    connection.query(query, (err, results) => {
    if (err) {
        console.error(err);
        reject(err);
    } else {
        const count = results[0].count;
        resolve(count);
    }
    connection.end();
    });
});
}

// returns in a format {postcode, districtNo, districtName}
async function GPStoAddress(latitude, longitude) {
  try { 
        const postcode = await reverseGeocoding(latitude, longitude);
        const districtData = postalData[postcode.substring(0,2)];
        return {postcode: postcode, districtNo: districtData.districtNo, districtName: districtData.districtName};
      

  } catch (error) {
      console.log("Error GPStoAddress: ", error);
      return null;
  }
}

async function reverseGeocoding(latitude, longitude) {
  const requestURL = `https://www.onemap.gov.sg/api/public/revgeocode?location=${latitude},${longitude}&buffer=100&addressType=All&otherFeatures=N`;

  if (!latitude || !longitude) {
      console.error('Error reverseGeocoding: Null value');
      return null;
  }
  try {
      const response = await axios.get(requestURL, {
          headers: {
              'Authorization': process.env.KEY_ONEMAP_API
          }
      });
          return response.data.GeocodeInfo[0].POSTALCODE; // Return the postal code    
  } catch (error) {
      console.error('Error reverseGeocoding:\n', error);
      return null;
  }
}