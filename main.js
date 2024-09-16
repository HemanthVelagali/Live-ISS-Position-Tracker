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
        // Fetch ISS position from the Where the ISS at? API (note the HTTPS)
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

        // Update ISS Coordinates Display
        document.getElementById('iss-lat').textContent = `Latitude: ${latitude.toFixed(2)}°`;
        document.getElementById('iss-lon').textContent = `Longitude: ${longitude.toFixed(2)}°`;

        // Update ISS Details Display
        document.getElementById('iss-alt').textContent = `Altitude: ${altitude.toFixed(2)} km`;
        document.getElementById('iss-vel').textContent = `Velocity: ${velocity.toFixed(2)} km/h`;

        // Fetch crew data with HTTPS
        const crewResponse = await fetch('https://api.open-notify.org/astros.json'); // Updated to HTTPS
        if (!crewResponse.ok) throw new Error('Crew response was not ok.');
        const crewData = await crewResponse.json();
        const issCrew = crewData.people.filter(person => person.craft === 'ISS').length;

        document.getElementById('iss-passengers').textContent = `Passengers: ${issCrew || 9}`;
        
    } catch (error) {
        console.error('Error fetching ISS position or crew:', error);
        document.getElementById('iss-lat').textContent = `Latitude: N/A`;
        document.getElementById('iss-lon').textContent = `Longitude: N/A`;
        document.getElementById('iss-alt').textContent = `Altitude: N/A`;
        document.getElementById('iss-vel').textContent = `Velocity: N/A`;
        document.getElementById('iss-passengers').textContent = `Passengers: 9`; // Default to 9 if error
    }
}

// Function to update the sunlight position based on local time
function updateSunlight() {
    const now = new Date();
    const hours = now.getUTCHours();
    const minutes = now.getUTCMinutes();
    const seconds = now.getUTCSeconds();
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    const lightAngle = (totalSeconds / 86400) * Math.PI * 2; // Total seconds in a day to angle

    sunlight.position.set(
        Math.sin(lightAngle) * 1000,
        Math.cos(lightAngle) * 1000,
        500
    );
}

// Function to animate the scene
function animate() {
    requestAnimationFrame(animate);

    controls.update(); // Update controls (if using orbit controls)

    updateSunlight(); // Update sunlight position
    renderer.render(scene, camera); // Render the scene
}

// Initialize event listeners and other setup
document.addEventListener('DOMContentLoaded', (event) => {
    document.getElementById('menu-toggle').addEventListener('click', toggleMenu);
    document.getElementById('more-button').addEventListener('click', openMenu);
    document.getElementById('show-path').addEventListener('click', showISSPath);

    // Call updateISSPosition every 15 seconds
    setInterval(updateISSPosition, 15000);
    updateISSPosition(); // Initial call

    // Start animation loop
    animate();
});

// Function to toggle menu visibility
function toggleMenu() {
    const menu = document.getElementById('menu');
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

// Function to open the 3D local model of the ISS
function openISS3DModel() {
    window.open('https://artsandculture.google.com/asset/international-space-station-3d-model-nasa/1wEkLGp7VFjRvw?hl=en', '_blank');
}

// Function to show the ISS path on the map
function showISSPath() {
    alert('ISS path will be displayed on the map (feature to be implemented).');
}
