/**
 * db.js - Database interaction functions for StraySpotter
 * Database functions for interacting with the StraySpotter database.
 */

///////////////////////////////////////////////////////////////////////////////////////
// External Modules and Dependencies
///////////////////////////////////////////////////////////////////////////////////////
const mysql = require('mysql2');
const axios = require('axios');
const { postalData, NumbertoName } = require('./postal_data.js');
require('dotenv').config();

///////////////////////////////////////////////////////////////////////////////////////
// Ineternal Function
///////////////////////////////////////////////////////////////////////////////////////

/**
 * Counts the number of pictures taken in a specific district within a given time period.
 * 
 * @param {number} districtNo - The district number to filter the pictures.
 * @param {"day" | "week" | "month"} type - The time range for counting pictures. 
 *      - "day": Counts pictures taken today.
 *      - "week": Counts pictures taken in the current week.
 *      - "month": Counts pictures taken in the current month.
 * @returns {Promise<number>} A promise that resolves to the count of pictures matching the criteria.
 */
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
/**
 * API Error Codes 
 * 400 - Please send the access token in the request header as a bearer token.
 * 400 - Your provided location is empty.
 * 400 - Your provided location is invalid.
 * 401 - Token has expired: Session expired. Please refresh your token (if still within refresh window) or re-login.
 * 401 - Invalid token: Could not decode token: The token xxx; is an invalid JWS.
 * 403 - Access Forbidden. GET access to component 'xxx' of service 'xxx' is not allowed by this user's role.
 * 429 - API limit(s) exceeded.
*/
/**
 * Performs reverse geocoding using OneMap API to retrieve the postal code for a given latitude and longitude.
 *
 * @param {number} latitude - The latitude coordinate.
 * @param {number} longitude - The longitude coordinate.
 * @returns {Promise<string|null>} The postal code if found, otherwise null.
 * @throws Will log an error if the request fails or if latitude/longitude is null.
 * 
 */
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
    console.log(response);
    return response.data.GeocodeInfo[0].POSTALCODE; // Return the postal code    
  } catch (error) {
    console.error('Error reverseGeocoding:\n', error);
    return null;
  }
}

///////////////////////////////////////////////////////////////////////////////////////
// Exported function
///////////////////////////////////////////////////////////////////////////////////////

/**
 * TODO: Create Connection only one time during the server startup
 */

/**
 * Creates a connection to the MySQL database.
 * 
 * This function establishes a connection to the MySQL database with the given configuration details,
 * such as host, user, database name, and password, which are used to connect to the 'strayspotter_database'.
 * 
 * @returns {object} The MySQL connection object used for interacting with the database.
 */
function createDBConnection() {
  const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'strayspotter_database',
    password: process.env.DB_PASSWORD,
  });
  return connection;
}

/**
 * TODO: THE ADDRESS AND CAT STAUTS TO BE UPDATED
 */
/**
 * Inserts picture metadata and location data into the database.
 * If no result is provided, defaults to 'none' for district information and '0' for postcode and district number.
 * If result is provided, updates with the appropriate postal information and sets cat status to 1.
 * 
 * @param {Object} metadata - Metadata of the picture, containing latitude, longitude, and date.
 * @param {Object|null} otherData - Address result, status (can be null).
 * @returns {Promise} Resolves with the inserted record ID or rejects with an error.
 */
function insertDataToDB(metadata, otherData) {
    const connection = createDBConnection()
    let data = {
      latitude : metadata.latitude,
      longitude : metadata.longitude,
      date : metadata.date_taken ?? "9999-12-30"
    }
    if (!otherData) {
      data.postcode = "0";
      data.district_no = "0";
      data.district_name = "none";
      data.cat_status = "good";
    } else {
      data.postcode = otherData[1].postcode;
      data.district_no = otherData[1].districtNo;
      data.district_name = otherData[1].districtName;
      data.cat_status = otherData[0];
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
        }
      )
    })
}

/**
 * Fetches the GPS coordinates (latitude and longitude) of a picture based on the provided ID.
 * 
 * @param {number} id - The ID of the picture whose GPS coordinates are to be fetched.
 * @returns {Promise} Resolves with the fetched coordinates or rejects with an error.
 */
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

/**
 * Creates a report based on the total number of pictures and the count per district for a given request type.
 * 
 * @param {"day" | "week" | "month"} request_type - The time range for counting pictures.
 * @returns {Promise<string>} Resolves with the generated HTML report.
 */
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

/**
 * Converts GPS coordinates (latitude and longitude) to postal code and district information.
 * 
 * @async
 * @param {number} latitude - The latitude of the location.
 * @param {number} longitude - The longitude of the location.
 * @returns {Object|null} An object in the format {postcode, districtNo, districtName} or null if an error occurs.
 */
async function GPSToAddress(latitude, longitude) {
  try {
      const postcode = await reverseGeocoding(latitude, longitude);
      const districtData = postalData[postcode.substring(0,2)];
      return {
        postcode: postcode, districtNo: districtData.districtNo, districtName: districtData.districtName
      };
  } catch (error) {
      console.log("Error GPStoAddress: ", error);
      return null;
  }
}

function fetchDB(connection) {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM pictures;`;

    connection.query(query, (err, results) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
}

///////////////////////////////////////////////////////////////////////////////////////
// Unused Function
///////////////////////////////////////////////////////////////////////////////////////

/**
 * Fetches the most recent photo IDs from the database.
 * 
 * @param {number} [number=4] - The number of recent photo IDs to retrieve (default is 4).
 * @returns {Promise<Object[]>} - A promise that resolves with an array of results, each containing a photo ID.
 */
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
      }
    );
    connection.end();
  });
}

/**
 * Count the number of pictures taken today in the database.
 *  
 * @returns {Promise<number>} A promise that resolves to the count of pictures taken today.
 */
function countPicturesToday() {
  const connection = createDBConnection();
  
  return new Promise((resolve, reject) => {
    const query = `SELECT COUNT(id) as count FROM pictures WHERE date_taken = CURDATE();`;
    connection.query(query, (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        reject(err);
      } else { 
        resolve(results[0].count); 
      }
    });
    connection.end();
  });
}


module.exports = {
  insertDataToDB,
  fetchGPSByID,
  GPSToAddress,
  createReport,
  createDBConnection,
  fetchDB
};