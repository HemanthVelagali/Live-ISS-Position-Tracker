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

const ambientLight = new THREE.AmbientLight(0x404040, 1.0); // Soft light
scene.add(ambientLight);

// OrbitControls for camera control
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableZoom = true;

// ISS Dot
const issGeometry = new THREE.SphereGeometry(5, 32, 32); // Small sphere for ISS
const issMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Red color for ISS
const issDot = new THREE.Mesh(issGeometry, issMaterial);
scene.add(issDot);

// Function to update ISS position on the globe
function updateISSPosition(lat, lon) {
    // Convert latitude and longitude to radians
    const latRad = THREE.MathUtils.degToRad(lat);
    const lonRad = THREE.MathUtils.degToRad(lon);

    // Calculate Cartesian coordinates
    const x = earthRadius * Math.cos(latRad) * Math.cos(lonRad);
    const y = earthRadius * Math.sin(latRad);
    const z = earthRadius * Math.cos(latRad) * Math.sin(lonRad);

    // Update ISS dot position
    issDot.position.set(x, y, z);
}

// Update ISS details function
async function updateISSDetails() {
    try {
        // Fetch ISS data from API
        const response = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
        if (!response.ok) throw new Error('Network response was not ok.');
        const data = await response.json();

        // Update ISS coordinates and details
        document.getElementById('iss-lat').innerText = `Latitude: ${data.latitude.toFixed(4)}`;
        document.getElementById('iss-lon').innerText = `Longitude: ${data.longitude.toFixed(4)}`;
        document.getElementById('iss-alt').innerText = `Altitude: ${data.altitude.toFixed(2)} km`;
        document.getElementById('iss-vel').innerText = `Velocity: ${data.velocity.toFixed(2)} km/h`;

        // Update ISS position on the globe
        updateISSPosition(data.latitude, data.longitude);

    } catch (error) {
        console.error('Error fetching ISS details:', error);

        // Display previous data or default message
        document.getElementById('iss-lat').innerText = `Latitude: Error`;
        document.getElementById('iss-lon').innerText = `Longitude: Error`;
        document.getElementById('iss-alt').innerText = `Altitude: Error`;
        document.getElementById('iss-vel').innerText = `Velocity: Error`;
    }
}

// Function to update local time
function updateLocalTime() {
    const now = new Date();
    const options = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    const localTime = now.toLocaleTimeString([], options);
    document.getElementById('digital-clock').innerText = localTime;
}

// Call updateISSDetails every 15 seconds
setInterval(updateISSDetails, 15000);

// Call updateLocalTime every second
setInterval(updateLocalTime, 1000);

// Initial calls to populate data immediately
updateISSDetails();
updateLocalTime();

// Handle window resize
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();
