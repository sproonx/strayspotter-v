///////////////////////////////////////////////////////////////////////////////////
// FUNCTIONS AND VARIABLES
///////////////////////////////////////////////////////////////////////////////////
const imageContainer = document.getElementById('imageContainer');
const fileInput = document.getElementById('imageInput');
const MAX_KEYS_TO_BE_SENT = 4;

function closePopup() {
    document.getElementById('report-popup').style.display = 'none';
}

function goToReport() {
    window.location.href = 'report.html'; // Replace with the actual report page URL
}

function openModal() {
    document.getElementById('uploadModal').style.display = 'block';
}
function closeModal() {
    document.getElementById('uploadModal').style.display = 'none';
}

// Purpose: This asynchronous function fetches images from the server.
// It sends a GET request to /images with a query parameter maxKeys to limit the number of images fetched.
// If the response is not OK, it logs an error and exits the function.
// If successful, it parses the response as JSON to get an array of image keys.
// The imageContainer is cleared to remove any previously displayed images.
// For each image key, it sends another request to get the pre-signed URL for the image.
// If the URL request is successful, it creates an <img> element, sets its source to the fetched URL, and appends it to the imageContainer.
// If the URL request fails, it logs an error.
async function fetchImages(maxKeys) {
    const response = await fetch(`/images?maxKeys=${maxKeys}`);

    if (!response.ok) {
      console.error('Failed to fetch images:', response.statusText);
      return;
    }

    const imageKeys = await response.json();

    imageContainer.innerHTML = ''; // Clear existing images

    imageKeys.forEach(async (key) => {
      // Fetch the pre-signed URL for the image
      const urlResponse = await fetch(`/image-url?key=${key}`);
      if (urlResponse.ok) {

        urlResponse.json().then( data => {
          console.log(data);
           // Create an image element and set its source to the pre-signed URL
          const img = document.createElement('img');
          img.src = data.url; // Set the source to the pre-signed URL
          img.alt = 'Image';
          img.style.maxWidth = '200px';
          img.style.margin = '10px';

          // Append the image to the container
          imageContainer.appendChild(img);
       })
      } else {
        console.error('Failed to fetch pre-signed URL:', urlResponse.statusText);
      }

    });
}

function sumNumbersInString(s) {
// Use a regular expression to find all numbers in the string
const numbers = s.match(/\d+/g);
// If no numbers are found, return 0
if (!numbers) return 0;
// Convert strings to integers and sum them up
const total = numbers.reduce((sum, num) => sum + parseInt(num, 10), 0);0
return total;
}

function showTotalNumberOfCats(timeframe) {
    let text = '';
    let newCount = 0;

    fetch(`/report?method=${timeframe}`).then(urlResponse => {
       
        if (urlResponse.ok) {
            urlResponse.json().then(reportData => {
                console.log(reportData);
                return sumNumbersInString(reportData); // Total number of cats
            })
        }
    })
}

function sumNumbersInString(s) {
    // Use a regular expression to find all numbers in the string
    const numbers = s.match(/\d+/g);
    // If no numbers are found, return 0
    if (!numbers) return 0;
    // Convert strings to integers and sum them up
    const total = numbers.reduce((sum, num) => sum + parseInt(num, 10), 0);0
    return total;
}

function showTotalNumberOfCats(timeframe) {
  let text = '';
  let newCount = 0;
  // console.log(`/report?method=${timeframe}`);

  fetch(`/report?method=${timeframe}`).then(urlResponse => {
      
      if (urlResponse.ok) {
          urlResponse.json().then(reportData => {
              console.log(reportData);
              return sumNumbersInString(reportData); // Total number of cats
          })
      }
  })
}

function openModal() {
    document.getElementById('uploadModal').style.display = 'block';
}
function closeModal() {
    document.getElementById('uploadModal').style.display = 'none';
}

///////////////////////////////////////////////////////////////////////////////////
// CODE EXECUTION
///////////////////////////////////////////////////////////////////////////////////

//Calls the fetchImages function when the script first runs, fetching and
//  displaying the initial set of images based on the maximum keys allowed (MAX_KEYS_TO_BE_SENT).
fetchImages(MAX_KEYS_TO_BE_SENT);

///////////////////////////////////////////////////////////////////////////////////
// EVENT LISTENERS
///////////////////////////////////////////////////////////////////////////////////

// When the form is submitted, it logs the event and prevents the default form submission behavior using event.preventDefault().
// A FormData object is created, and the first file from the fileInput is added to it.
// A fetch request is sent to the server at /upload using the POST method, sending the formData.
// If the upload is successful (response.ok), it calls fetchImages() to refresh the displayed images;
//  otherwise, it logs an error message.
document.getElementById('uploadForm').addEventListener('submit', async (event) => {
  console.log(event);
  event.preventDefault();

  const formData = new FormData();
  // const filenameInput = document.querySelector('input[name="filename"]'); - Deprecated only for handling file names inputted by the user
  formData.append('image', fileInput.files[0]);
  // formData.append('filename', filenameInput.value);

  const response = await fetch('/upload', {
  method: 'POST',
  body: formData,
  });

  if (response.ok) {
  fetchImages(MAX_KEYS_TO_BE_SENT); // Refresh the image list after upload
  } else {
  console.error('Upload failed:', response.statusText);
  }
});
    
document.getElementById('toggle-button').addEventListener('click', function() {
    const navLinks = document.getElementById('nav-links');
    navLinks.classList.toggle('active');
});

// Close the modal when clicking outside of it
window.onclick = function(event) {
    if (event.target == document.getElementById('uploadModal')) {
        closeModal();
    }
}

// Add this new code for smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const currentHash = window.location.hash;
    const navLinks = document.querySelectorAll('.nav-links a');

    navLinks.forEach(nav => nav.parentElement.classList.remove('active'));
    if (currentHash === '#founders') {
        document.getElementById('founders-link').classList.add('active');
    } else {
        document.getElementById('home-link').classList.add('active');
    }
    
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.forEach(nav => nav.parentElement.classList.remove('active'));
            link.parentElement.classList.add('active');
        });
    });
});

document.getElementById('toggle-button').addEventListener('click', function() {
  const navLinks = document.getElementById('nav-links');
  navLinks.classList.toggle('active');
});

// Close the modal when clicking outside of it
window.onclick = function(event) {
    if (event.target == document.getElementById('uploadModal')) {
        closeModal();
    }
}

// Add this new code for smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const currentHash = window.location.hash;
    const navLinks = document.querySelectorAll('.nav-links a');

    navLinks.forEach(nav => nav.parentElement.classList.remove('active'));
    if (currentHash === '#founders') {
        document.getElementById('founders-link').classList.add('active');
    } else {
        document.getElementById('home-link').classList.add('active');
    }
    
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.forEach(nav => nav.parentElement.classList.remove('active'));
            link.parentElement.classList.add('active');
        });
    });
});