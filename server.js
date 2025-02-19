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
  db.fetchGPSByID(key.slice(1)).then(data => {
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
      db.createReport(method).then(reportData => {
        res.json(reportData);
      });
    } catch (err) {
      return res.status(500).send(err.message);
    }
});

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
    if (exifData === undefined || exifData === null) {
      var extractedData = {latitude:"0",longitude:"0"}

      result = "Null"

      db.insertDataToDB(extractedData, result).then(picture_id => {
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
      db.GPStoAddress(extractedData.latitude, extractedData.longitude).then(result => {
        db.insertDataToDB(extractedData, result).then(picture_id => {
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