///////////////////////////////////////////////////////////////////////////////////////
// FUNCTIONS
///////////////////////////////////////////////////////////////////////////////////////
async function convertHeicToJpg(inputBuffer) {
  const jpgBuffer = await heicConvert({
      buffer: inputBuffer,
      format: 'JPEG', // Output format
      quality: 1, // Quality from 0 to 1
  });

  return jpgBuffer; // Return the JPG buffer
}

//Upload data to Wasabi
function uploadData(fileData, res, unique_id) {
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
// APP CONFIGURATION
///////////////////////////////////////////////////////////////////////////////////////

const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand, CreatePresignedUrlCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const path = require('path');
const exifr = require('exifr');
const heicConvert = require('heic-convert');
const { insertDataToDB, fetchRecentPhotoID, createDBConnection, countPicturesToday, fetchGPSByID, GPStoAddress, reverseGeocoding, countPicturesLocation, createReport } = require('./db.js');
require('dotenv').config();

const access_key_id = process.env.ACCESS_KEY_ID;
const secret_access_key_id = process.env.SECRET_ACCESS_KEY_ID;
const bucket_name = "catphotos"
const HOST = process.env.HOST;
const DEFAULT_PORT = 3000;
const app = express();
const storage = multer.memoryStorage(); // Store file in memory
const upload = multer({ storage: storage }).single('image'); // Name of the input field
const client_folder_name = "public";

const s3Client = new S3Client({
  region: 'ap-southeast-1', // Region, adjust as needed
  endpoint: 'https://s3.ap-southeast-1.wasabisys.com', // Wasabi endpoint
  credentials: {
    accessKeyId: access_key_id, // Your Wasabi access key
    secretAccessKey: secret_access_key_id, // Your Wasabi secret key
  },
});

var fileData;
app.use(express.static(path.join(__dirname, client_folder_name)));

///////////////////////////////////////////////////////////////////////////////////////
// API ENDPOINTS
///////////////////////////////////////////////////////////////////////////////////////

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, client_folder_name, 'index.html'),); //(__dirname, client_folder_name, 'index.html'),);
});

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

// Generate a pre-signed URL for accessing an image
app.get('/image-url', async (req, res) => {
  const { key } = req.query;
  fetchGPSByID(key.slice(1)).then(data => {
    // Process the returned data here
    if (!data[0]){
      data_latitude = "";
      data_longitude = "";
    } else {
      data_latitude = data[0].latitude 
      data_longitude = data[0].longitude
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
    // Handle any errors from select_data
    console.error('Error fetching data:', error);
  });
});

app.get('/report', async (req, res) => {
  const { method } = req.query;
    if (!method) {
      return res.status(400).send('Key is required');
    }
    try {
      createReport(method).then(reportData => {
        res.json(reportData);
      });
    } catch (err) {
      return res.status(500).send(err.message);
    }
});

app.post('/upload', async (req, res) => {
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
    if (exifData === undefined || exifData === null)
      {
        var extractedData = {latitude:"0",longitude:"0"}

        result = "Null"

        insertDataToDB(extractedData, result).then(picture_id => {
          console.log(picture_id); 
  
          if (req.file.mimetype == 'image/heic') {
            fileData = convertHeicToJpg(req.file.buffer).then(fileData => { 
                uploadData(fileData, res, 'k' + picture_id)  
            })
          } else if (req.file.mimetype.startsWith('image/')) { 
            fileData = req.file.buffer
            uploadData(fileData, res, 'k' + picture_id)  
          } else {
            console.log("IT IS NOT AN IMAGE")
          }
        }).catch(err => {
          console.error("Error inserting data:", err);
        });
      } 
    
    else {
      extractedData = {
        latitude: exifData.latitude, longitude: exifData.longitude
      }
    
      GPStoAddress(extractedData.latitude, extractedData.longitude).then(result => {
        insertDataToDB(extractedData, result).then(picture_id => {
          console.log(picture_id); 
  
          if (req.file.mimetype == 'image/heic') {
            fileData = convertHeicToJpg(req.file.buffer).then(fileData => { 
                uploadData(fileData, res, 'k' + picture_id)  
            })
          } else if (req.file.mimetype.startsWith('image/')) { 
            fileData = req.file.buffer
            uploadData(fileData, res, 'k' + picture_id)  
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