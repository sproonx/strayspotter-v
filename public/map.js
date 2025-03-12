document.getElementById('toggle-button').addEventListener('click', function() {
    const navLinks = document.getElementById('nav-links');
    navLinks.classList.toggle('active');
});

COORDINATES = [1.3521, 103.8198];
DEFAULT_ZOOM_LEVEL = 11;
MIN_ZOOM_LEVEL = 11; // The broadest view you can see
MAX_ZOOM_LEVEL = 30; // The smallest detail you can see
SOUTH_WEST_CORNER = [1.2000, 103.6000];
NORTH_EAST_CORNER = [1.4600, 104.1000] ;
MARK_ICON_LOCATION = "./resources/icon.png"

// Initialize the map centered on Singapore
const map = L.map('map').setView(COORDINATES, DEFAULT_ZOOM_LEVEL); // Singapore coordinates and zoom level
// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: MAX_ZOOM_LEVEL,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Set the bounds for Singapore
const bounds = [
    SOUTH_WEST_CORNER, // Southwest corner
    NORTH_EAST_CORNER // Northeast corner
];
map.setMaxBounds(bounds); // Prevent panning outside of these bounds
map.on('drag', function() {
    map.panInsideBounds(bounds);
});

// Restrict zoom levels
map.setMaxZoom(MAX_ZOOM_LEVEL); // Maximum zoom level
map.setMinZoom(MIN_ZOOM_LEVEL); // Minimum zoom level

async function loadImages() {
    const response = await fetch('/images');
    if (!response.ok) {
        console.error('Failed to fetch images:', response.statusText);
        return;
    }
    const imageKeys = await response.json();

    imageKeys.forEach(async (key) => {
        const urlResponse = await fetch(`/image-url?key=${key}`);
        if (urlResponse.ok) {
            urlResponse.json().then(async (data) => {
                try {
                    const latitude = 1.31526
                    const longitude = 103.914
                    // const gpsData = await fetchGPSByID(data.id);
                    // const latitude = gpsData[0].latitude;
                    // const longitude = gpsData[0].longitude;
                    if (isNaN(latitude) || isNaN(longitude)) {
                        console.error('Invalid latitude or longitude:', latitude, longitude);
                        return;
                    }
                    url = data.url;
                    const customIcon = L.icon({
                        iconUrl: MARK_ICON_LOCATION,
                        iconSize: [45, 50], // size of the icon
                    });
                    const marker = L.marker([latitude, longitude], { icon: customIcon }).addTo(map); //{ icon: customIcon }
                    // Create an HTML string for the tooltip
                    const tooltipContent = `<img src="${url}" alt="Cat" class="tooltip-image"/>`;
                    // Bind the tooltip to the marker
                    marker.bindTooltip(tooltipContent, { permanent: false, sticky: true });
                    // Event listeners to handle tooltip visibility
                    marker.on('mouseover', () => {
                        if (currentTooltip) {
                            currentTooltip.closeTooltip(); // Close the currently open tooltip
                        }
                        marker.openTooltip(); // Open the new tooltip
                        currentTooltip = marker; // Set the current marker as the open one
                    });
                    marker.on('mouseout', () => {
                        marker.closeTooltip(); // Optionally close the tooltip on mouse out
                        currentTooltip = null; // Reset the current tooltip reference
                    });
                } catch (error) {
                    console.error('Failed to fetch GPS data:', error);
                }
            });
        } else {
            console.error('Failed to fetch pre-signed URL:', urlResponse.statusText);
        }
    });
};

loadImages();