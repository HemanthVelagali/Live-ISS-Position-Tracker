// Basic setup for Three.js Scene, Camera, and Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 350;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('globe-container').appendChild(renderer.domElement);

// Load space background texture
const spaceTextureLoader = new THREE.TextureLoader();
const spaceTexture = spaceTextureLoader.load('assets/background.jpg', undefined, undefined, (error) => {
    console.error('Error loading space background:', error);
});
scene.background = spaceTexture;

// Create Geometry, Material, and Mesh for the Globe
const earthRadius = 200;
const globeGeometry = new THREE.SphereGeometry(earthRadius, 64, 64);
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

// Add OrbitControls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 200;
controls.maxDistance = 600;

// ISS Dot/Marker on the globe
const issGeometry = new THREE.SphereGeometry(2, 16, 16);
const issMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const issMarker = new THREE.Mesh(issGeometry, issMaterial);
scene.add(issMarker);

// Path line geometry and material
const pathPoints = [];
const pathGeometry = new THREE.BufferGeometry().setFromPoints(pathPoints);
const pathMaterial = new THREE.LineBasicMaterial({ color: 0xff00ff, opacity: 0.8 });
const pathLine = new THREE.Line(pathGeometry, pathMaterial);
scene.add(pathLine);

// Convert latitude/longitude to 3D position on the globe
function latLongToVector3(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    return new THREE.Vector3(x, y, z);
}

// Previous ISS data
let previousData = {
    latitude: null,
    longitude: null,
    altitude: null,
    velocity: null,
    crew: null
};

// Function to update ISS position on the globe
async function updateISSPosition() {
    try {
        // Fetch ISS position
        const response = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
        if (!response.ok) throw new Error('Network response was not ok.');
        const data = await response.json();

        const latitude = data.latitude;
        const longitude = data.longitude;
        const altitude = data.altitude; // in kilometers
        const velocity = data.velocity; // in km/h

        const issPosition = latLongToVector3(latitude, longitude, earthRadius);
        issMarker.position.copy(issPosition);

        pathPoints.push(issPosition);
        pathGeometry.setFromPoints(pathPoints);

        document.getElementById('iss-lat').textContent = `Latitude: ${latitude.toFixed(2)}°`;
        document.getElementById('iss-lon').textContent = `Longitude: ${longitude.toFixed(2)}°`;
        document.getElementById('iss-alt').textContent = `Altitude: ${altitude.toFixed(2)} km`;
        document.getElementById('iss-vel').textContent = `Velocity: ${velocity.toFixed(2)} km/h`;
        
        // Fetch number of passengers (crew)
        const crewResponse = await fetch('https://api.open-notify.org/astros.json');
        if (!crewResponse.ok) throw new Error('Network response was not ok.');
        const crewData = await crewResponse.json();
        
        const issCrew = crewData.people.filter(person => person.craft === 'ISS').length;
        document.getElementById('iss-passengers').textContent = `Passengers: ${issCrew}`;

        // Update previous data
        previousData = {
            latitude,
            longitude,
            altitude,
            velocity,
            crew: issCrew
        };

    } catch (error) {
        console.error('Error fetching ISS position or crew:', error);
        
        // Use previous data if available
        document.getElementById('iss-lat').textContent = previousData.latitude !== null ? `Latitude: ${previousData.latitude.toFixed(2)}°` : `Latitude: N/A`;
        document.getElementById('iss-lon').textContent = previousData.longitude !== null ? `Longitude: ${previousData.longitude.toFixed(2)}°` : `Longitude: N/A`;
        document.getElementById('iss-alt').textContent = previousData.altitude !== null ? `Altitude: ${previousData.altitude.toFixed(2)} km` : `Altitude: N/A`;
        document.getElementById('iss-vel').textContent = previousData.velocity !== null ? `Velocity: ${previousData.velocity.toFixed(2)} km/h` : `Velocity: N/A`;
        document.getElementById('iss-passengers').textContent = previousData.crew !== null ? `Passengers: ${previousData.crew}` : `Passengers: N/A`;
    }
}

// Function to update the user's local time
function updateLocalTime() {
    try {
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
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
    const lat = 0;
    const lon = 0;
    const date = new Date();

    const jd = (now.getTime() / 86400000) + 2440587.5;
    const T = (jd - 2451545.0) / 36525.0;
    const L0 = (280.46646 + 36000.76983 * T + 0.0003032 * T * T) % 360.0;
    const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) % 360.0;
    const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M * Math.PI / 180.0) +
              (0.019993 - 0.000101 * T) * Math.sin(2 * M * Math.PI / 180.0);
    const sunLongitude = (L0 + C) % 360.0;
    const sunDeclination = Math.asin(Math.sin(sunLongitude * Math.PI / 180.0) * Math.sin(23.439292 * Math.PI / 180.0)) * 180.0 / Math.PI;

    const sunPosition = new THREE.Vector3(
        earthRadius * Math.cos(sunDeclination * Math.PI / 180),
        earthRadius * Math.sin(sunDeclination * Math.PI / 180),
        0
    );
    sunlight.position.copy(sunPosition);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    updateSunPosition();
    renderer.render(scene, camera);
}
animate();

// Update the ISS position every 5 seconds
setInterval(updateISSPosition, 5000);

// Update the time every second
setInterval(updateLocalTime, 1000);

// Initial updates for ISS position, Sun position, and local time
updateISSPosition();
updateLocalTime();
updateSunPosition();

// Handle window resizing
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// Toggle the visibility of the menu
function toggleMenu() {
    const menu = document.getElementById('menu');
    menu.classList.toggle('hidden');
}

// Function to open the NASA ISS page
function openNASAISSPage() {
    window.open('https://www.nasa.gov/mission_pages/station/main/index.html', '_blank');
}

// Function to open a 3D local model
function open3DModel() {
    window.open('https://artsandculture.google.com/asset/international-space-station-3d-model-nasa/1wEkLGp7VFjRvw?hl=en', '_blank');
}

// Function to show the ISS path on the map
function showISSPath() {
    // Placeholder function, implement as needed
    alert('Show ISS Path feature is not implemented yet.');
}
