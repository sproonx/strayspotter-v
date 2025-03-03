///////////////////////////////////////////////////////////////////////////////////////
// APP CONFIGURATION
///////////////////////////////////////////////////////////////////////////////////////
// Express setup
const express = require('express');
const app = express();
const path = require('path');
const client_folder_name = "public";
app.use(express.static(path.join(__dirname, client_folder_name)));

require('dotenv').config();
const HOST = process.env.HOST;
const DEFAULT_PORT = 3000;

// Wasabi S3 setup
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).single('image');
const { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const bucket_name = "catphotos"
// Initialize S3 client for Wasabi
const s3Client = new S3Client({
  region: 'ap-southeast-1', // Region, adjust as needed
  endpoint: 'https://s3.ap-southeast-1.wasabisys.com', // Wasabi endpoint
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID, // Your Wasabi access key
    secretAccessKey: process.env.SECRET_ACCESS_KEY_ID, // Your Wasabi secret key
  },
});

// Database and other services
const db = require('./db.js');
const exifr = require('exifr');
const heicConvert = require('heic-convert');

///////////////////////////////////////////////////////////////////////////////////////
// FUNCTIONS
///////////////////////////////////////////////////////////////////////////////////////

/**
 * Converts a HEIC image buffer to a JPEG image buffer.
 * 
 * @param {Buffer} inputBuffer The buffer of the HEIC image to convert.
 * @returns {Buffer} The resulting JPEG image buffer after conversion.
 */
async function convertHeicToJpg(inputBuffer) {
  const jpgBuffer = await heicConvert({
      buffer: inputBuffer,
      format: 'JPEG', // Output format
      quality: 1, // Quality from 0 to 1
  });

  return jpgBuffer; // Return the JPG buffer
}

/**
 * Uploads data to Wasabi cloud storage.
 * 
 * @param {Buffer} fileData The file data (image or other content) to upload.
 * @param {object} res The response object to send the result back to the client.
 * @param {string} unique_id A unique identifier for the file being uploaded.
 * @throws {Error} Throws an error if there is an issue during the upload process.
 */
function uploadPicture(fileData, res, unique_id) {
    const params = {
      Bucket: bucket_name, // Your Wasabi bucket name
      Key: unique_id, // File name in S3
      Body: fileData,
    };
    try {
      const command = new PutObjectCommand(params);
      const data = s3Client.send(command);
      res.send(`File uploaded successfully at https://${bucket_name}.s3.wasabisys.com/${params.Key}`);
    } catch (s3Err) {
      return res.status(500).send(s3Err.message);
    }
}

///////////////////////////////////////////////////////////////////////////////////////
// API ENDPOINTS
///////////////////////////////////////////////////////////////////////////////////////

// Send the 'index.html' file when the root directory ('/') is accessed
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, client_folder_name, 'index.html'),);
});

/**
 * Retrieves a list of image keys from the cloud, sorted in descending numerical order.
 * Returns up to a specified number of image keys based on the client's query parameter.
 * 
 * @param {number} maxKeys The number of image keys to return, specified by the client in the query string.
 * @returns {object} A JSON object containing the sorted list of image keys.
 * @throws {Error} Throws an error if there is an issue with fetching the image keys from the cloud.
 */
app.get('/images', async (req, res) => {
  const params = {
    Bucket: bucket_name,
  };
  const maxKeys = req.query.maxKeys;

  try {
    const command = new ListObjectsV2Command(params);
    const data = await s3Client.send(command);
    const imageKeys = (data.Contents || []).map(item => item.Key);

    imageKeys.sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10); // Extract number from key name
      const numB = parseInt(b.replace(/\D/g, ''), 10);
      return numB - numA; // Compare in descending order
    });
    res.json(imageKeys.slice(0,maxKeys));
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

/**
 * Generates a pre-signed URL for accessing an image and retrieves GPS data from the database.
 * 
 * @param {string} key The key of the image in the cloud (provided as a query parameter).
 * @returns {object} A JSON object containing the pre-signed URL and GPS coordinates (latitude and longitude).
 * @throws {Error} Throws an error if there is an issue with fetching data or generating the pre-signed URL.
 */
app.get('/image-url', async (req, res) => {
  const { key } = req.query;
  db.fetchGPSByID(key.slice(1)).then(data => {
    // Process the returned data here
    if (!data[0]){
      data_latitude = "";
      data_longitude = "";
    } else {
      data_latitude = data[0].latitude ;
      data_longitude = data[0].longitude;
    }

    if (!key) {
      return res.status(400).send('Key is required');
    }
    const params = {
      Bucket: bucket_name,
      Key: key,
      Expires: 60 * 5, // URL expiration time in seconds
    };
    try {
      getSignedUrl(s3Client, new GetObjectCommand(params)).then(url => {
        res.json({
          url: url,
          latitude: data_latitude,
          longitude: data_longitude
      })
    });
    } catch (err) {
      return res.status(500).send(err.message);
    }
  }).catch(error => {
    console.error('Error fetching data:', error);
  });
});

/**
 * Generates a report based on the provided method and returns the result.
 * 
 * @param {string} method Time Frame, 'day', 'week', or 'month'(provided as a query parameter).
 * @returns {object} The report data generated by the specified method.
 * @throws {Error} Throws an error if there is an issue with report generation or database interaction.
 */
app.get('/report', async (req, res) => {
  const { method } = req.query;
    if (!method) {
      return res.status(400).send('Key is required');
    }
    try {
      const reportData = await db.createReport(method);
      res.json(reportData);
    } catch (err) {
      return res.status(500).send(err.message);
    }
});

/**
 * Handles file upload, processes EXIF data, and stores image metadata in the database.
 * 
 * @param {object} req.file The uploaded file object, containing the image file data.
 * @param {string} req.body.category The category representing the cat's condition (e.g., "happy", "normal", "sad").
 * @throws {Error} Throws an error if there is an issue during file upload, EXIF data parsing, or database insertion.
 */
app.post('/upload', async (req, res) => {
  var fileData;
  
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    if (!req.file) {
      return res.status(400).send('No file selected!');
    }

    // Converting heic to jpg with metadata
    let exifData = await exifr.parse(req.file.buffer);
    console.log(exifData);
    // If there are no metadata, default values for latitude and longitude are used.
    if (exifData === undefined || exifData === null) {
      var extractedData = {latitude:"0",longitude:"0"}

      result = "Null"
      db.insertDataToDB(extractedData, result).then(picture_id => {
        console.log(picture_id); 
        if (req.file.mimetype == 'image/heic') {
          fileData = convertHeicToJpg(req.file.buffer).then(fileData => { 
              uploadPicture(fileData, res, 'k' + picture_id)  
          })
        } else if (req.file.mimetype.startsWith('image/')) { 
          fileData = req.file.buffer
          uploadPicture(fileData, res, 'k' + picture_id)  
        } else {
          console.log("IT IS NOT AN IMAGE")
        }
      }).catch(err => {
        console.error("Error inserting data:", err);
      });
    }
    // If there are metadata, the latitude and longitude are extracted 
    // and used to convert the GPS coordinates into an address.
    else {
      extractedData = {
        latitude: exifData.latitude, longitude: exifData.longitude
      }
      db.GPStoAddress(extractedData.latitude, extractedData.longitude).then(result => {
        db.insertDataToDB(extractedData, result).then(picture_id => {
          console.log(picture_id); 
  
          if (req.file.mimetype == 'image/heic') {
            fileData = convertHeicToJpg(req.file.buffer).then(fileData => { 
                uploadPicture(fileData, res, 'k' + picture_id)  
            })
          } else if (req.file.mimetype.startsWith('image/')) { 
            fileData = req.file.buffer
            uploadPicture(fileData, res, 'k' + picture_id)  
          } else {
            console.log("IT IS NOT AN IMAGE")
          }
        }).catch(err => {
          console.error("Error inserting data:", err);
        });
      });
    }
  });
});

///////////////////////////////////////////////////////////////////////////////////////
// SERVER STARTUP
///////////////////////////////////////////////////////////////////////////////////////

const PORT = process.env.PORT || DEFAULT_PORT;
app.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
});