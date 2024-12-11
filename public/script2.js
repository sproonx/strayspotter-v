const galleryGrid = document.getElementById('galleryGrid');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const MAX_KEYS_TO_BE_SENT = 100;



// This function generates an HTML string representing a gallery item (image card) 
// based on the provided image source (src).

// The function returns a template literal that creates a card layout with an image and action buttons.
// Action buttons include "Like", "Comment", "Share", and "Bookmark", each represented by an SVG icon.
// The number of likes and comments is displayed next to their respective buttons, defaulting to 0 if no values are provided.
function createGalleryItem(src) {
    return `
        <div class="card">
            <div class="card-content">
                <img src="${src}" alt="Cat ${"Cat Image"}">
            </div>
            
            <div class="card-footer">
                <div class="action-buttons">
                    <button aria-label="Like">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                    </button>
                    <span>${src.likes || '0'}</span>
                    <button aria-label="Comment">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                    </button>
                    <span>${src.comments || '0'}</span>
                </div>
                <div class="action-buttons">
                    <button aria-label="Share">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                    <button aria-label="Bookmark">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                    </button>
                </div>
            </div>
        </div>
    `;
}


// Replace that monstrosity with this

function createGalleryItem(src) {
    return `
        <div class="card">
            <div class="card-content">
                <img src="${src}" alt="Cat Image">
            </div>
        </div>
    `;
}






// Purpose:  fetches images from the server and updates the gallery.

// It sends a GET request to /images with a query parameter maxKeys to limit the number of image keys fetched.
// If the response is not OK, it logs an error message.
// If successful, it parses the response as JSON to get an array of image keys.
// For each image key, it sends another fetch request to get the pre-signed URL for that image.
// If the URL request is successful, it calls createGalleryItem(data.url) to generate the HTML 
// for the image and appends it to the galleryGrid.
async function loadImages(maxKeys) {

  const response = await fetch(`/images?maxKeys=${maxKeys}`);

  if (!response.ok) {
    console.error('Failed to fetch images:', response.statusText);
    return;
  }

  const imageKeys = await response.json();

  imageKeys.forEach(async (key) => {
    const urlResponse = await fetch(`/image-url?key=${key}`);
    if (urlResponse.ok) {
        urlResponse.json().then( data => {
            console.log(data);
            galleryGrid.innerHTML += createGalleryItem(data.url);
        })
    } else {
        console.error('Failed to fetch pre-signed URL:', urlResponse.statusText);
    }
  });

}


// Purpose: This block adds a click event listener to the loadMoreBtn.
// Functionality: When the button is clicked, it currently shows an alert. 
// logic to load more images from the server would be implemented.

loadMoreBtn.addEventListener('click', () => {
    // In a real application, this would load more images from a server
    alert('Load more images functionality would be implemented here.');
});

// Current Functionality: As it stands, it only shows an alert indicating that the functionality to
// load more images is not yet implemented.
// Removable

loadImages(MAX_KEYS_TO_BE_SENT);

//  loadImages function when the script first runs, fetching and displaying the
//  initial set of images based on the maximum keys defined (MAX_KEYS_TO_BE_SENT).