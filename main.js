// Set up Scene, Camera, and Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.z = 350;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('globe-container').appendChild(renderer.domElement);

// Load the space background texture
const spaceTextureLoader = new THREE.TextureLoader();
const spaceTexture = spaceTextureLoader.load('assets/background.jpg', undefined, undefined, (error) => {
    console.error('Error loading space background:', error);
});
scene.background = spaceTexture;

// Create Geometry, Material, and Mesh for the Globe
const earthRadius = 200; // Define a constant radius for Earth

const globeGeometry = new THREE.SphereGeometry(earthRadius, 64, 64); // High-res sphere for Earth
const earthTexture = new THREE.TextureLoader().load('assets/earth.jpg', undefined, undefined, (error) => {
    console.error('Error loading Earth texture:', error);
});
const globeMaterial = new THREE.MeshPhongMaterial({ map: earthTexture });
const globe = new THREE.Mesh(globeGeometry, globeMaterial);
scene.add(globe);

// Add lights
const sunlight = new THREE.DirectionalLight(0xffffff, 1.0);
scene.add(sunlight);

const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

// Add OrbitControls to allow interaction with the globe (rotation only by user)
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 200;
controls.maxDistance = 600;

// ISS Dot/Marker on the globe
const issGeometry = new THREE.SphereGeometry(2, 16, 16); // Small sphere for the ISS marker
const issMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Red color for the ISS marker
const issMarker = new THREE.Mesh(issGeometry, issMaterial);
scene.add(issMarker);

// Path line geometry and material
const pathPoints = [];
const pathGeometry = new THREE.BufferGeometry().setFromPoints(pathPoints);
const pathMaterial = new THREE.LineBasicMaterial({ color: 0xff00ff, opacity: 0.8 });
const pathLine = new THREE.Line(pathGeometry, pathMaterial);
scene.add(pathLine);

// Previous data storage
let previousISSData = {
    latitude: null,
    longitude: null,
    altitude: null,
    velocity: null,
    passengers: null
};

// Convert latitude/longitude to 3D position on the globe
function latLongToVector3(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180); // Convert latitude to polar angle (phi)
    const theta = (lon + 180) * (Math.PI / 180); // Convert longitude to azimuthal angle (theta)

    const x = -radius * Math.sin(phi) * Math.cos(theta); // Calculate 3D x coordinate
    const y = radius * Math.cos(phi); // Calculate 3D y coordinate
    const z = radius * Math.sin(phi) * Math.sin(theta); // Calculate 3D z coordinate

    return new THREE.Vector3(x, y, z); // Return the 3D position as a vector
}

// Function to update ISS position on the globe
async function updateISSPosition() {
    try {
        // Fetch ISS position from the Where the ISS at? API
        const response = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
        if (!response.ok) throw new Error('Network response was not ok.');
        const data = await response.json();

        const latitude = data.latitude;
        const longitude = data.longitude;
        const altitude = data.altitude; // in kilometers
        const velocity = data.velocity; // in km/h

        // Convert lat/lon to 3D position on the globe
        const issPosition = latLongToVector3(latitude, longitude, earthRadius);
        issMarker.position.copy(issPosition); // Update ISS marker position on the globe

        // Add the new position to the path
        pathPoints.push(issPosition);
        pathGeometry.setFromPoints(pathPoints);

        // Update ISS Coordinates Display
        document.getElementById('iss-lat').textContent = `Latitude: ${latitude.toFixed(2)}°`;
        document.getElementById('iss-lon').textContent = `Longitude: ${longitude.toFixed(2)}°`;

        // Update ISS Details Display with new altitude and velocity
        previousISSData.altitude = altitude;
        previousISSData.velocity = velocity;
        document.getElementById('iss-alt').textContent = `Altitude: ${altitude.toFixed(2)} km`;
        document.getElementById('iss-vel').textContent = `Velocity: ${velocity.toFixed(2)} km/h`;

        // Fetch number of passengers (crew) from Open Notify API
        await updateISSPassengers();

    } catch (error) {
        console.error('Error fetching ISS position or crew:', error);

        // Display previous data if new data fetch fails
        document.getElementById('iss-lat').textContent = `Latitude: ${previousISSData.latitude !== null ? previousISSData.latitude.toFixed(2) + '°' : 'N/A'}`;
        document.getElementById('iss-lon').textContent = `Longitude: ${previousISSData.longitude !== null ? previousISSData.longitude.toFixed(2) + '°' : 'N/A'}`;
        document.getElementById('iss-alt').textContent = `Altitude: ${previousISSData.altitude !== null ? previousISSData.altitude.toFixed(2) + ' km' : 'N/A'}`;
        document.getElementById('iss-vel').textContent = `Velocity: ${previousISSData.velocity !== null ? previousISSData.velocity.toFixed(2) + ' km/h' : 'N/A'}`;
    }
}

// Function to update ISS passengers (crew) continuously
async function updateISSPassengers() {
    try {
        // Fetch number of passengers (crew) from Open Notify API
        const crewResponse = await fetch('https://api.open-notify.org/astros.json');
        if (!crewResponse.ok) throw new Error('Network response was not ok.');
        const crewData = await crewResponse.json();
        
        const issCrew = crewData.people.filter(person => person.craft === 'ISS').length;
        previousISSData.passengers = issCrew;
        document.getElementById('iss-passengers').textContent = `Passengers: ${issCrew}`;

    } catch (error) {
        console.error('Error fetching ISS crew data:', error);

        // Display previous passenger data if new data fetch fails
        document.getElementById('iss-passengers').textContent = `Passengers: ${previousISSData.passengers !== null ? previousISSData.passengers : 'N/A'}`;
    }
}

// Function to update the user's local time
function updateLocalTime() {
    try {
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone; // Get user's timezone
        const now = new Date().toLocaleString('en-US', { timeZone: userTimezone });
        const formattedTime = new Date(now).toLocaleTimeString('en-US', { hour12: false });
        document.getElementById('digital-clock').textContent = `Local Time (${userTimezone}): ${formattedTime}`;
    } catch (error) {
        console.error('Error fetching local time:', error);
        document.getElementById('digital-clock').textContent = `Local Time: N/A`;
    }
}

// Function to update the Sun's position
function updateSunPosition() {
    const now = new Date();
    const lat = 0; // Change as needed for user location
    const lon = 0; // Change as needed for user location
    const date = new Date();

    // Calculate Julian Date
    const jd = (now.getTime() / 86400000) + 2440587.5;

    // Calculate the Sun's position
    const T = (jd - 2451545.0) / 36525.0;
    const L0 = (280.46646 + 36000.76983 * T + 0.0003032 * T * T) % 360.0;
    const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) % 360.0;
    const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M * Math.PI / 180.0) +
              (0.019993 - 0.000101 * T) * Math.sin(2 * M * Math.PI / 180.0);
    const sunLongitude = (L0 + C) % 360.0;
    const sunDeclination = Math.asin(Math.sin(sunLongitude * Math.PI / 180.0) * Math.sin(23.439292 * Math.PI / 180.0)) * 180.0 / Math.PI;

    // Set
