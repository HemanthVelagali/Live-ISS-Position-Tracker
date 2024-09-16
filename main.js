// Set up Scene, Camera, and Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 350;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('globe-container').appendChild(renderer.domElement);

// Load textures
const spaceTextureLoader = new THREE.TextureLoader();
const spaceTexture = spaceTextureLoader.load('assets/background.jpg', undefined, undefined, (error) => {
    console.error('Error loading space background:', error);
});
scene.background = spaceTexture;

const earthTexture = new THREE.TextureLoader().load('assets/earth.jpg', undefined, undefined, (error) => {
    console.error('Error loading Earth texture:', error);
});

// Create globe
const earthRadius = 200;
const globeGeometry = new THREE.SphereGeometry(earthRadius, 64, 64);
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

// Create ISS marker and path
const issGeometry = new THREE.SphereGeometry(2, 16, 16);
const issMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const issMarker = new THREE.Mesh(issGeometry, issMaterial);
scene.add(issMarker);

const pathPoints = [];
const pathGeometry = new THREE.BufferGeometry().setFromPoints(pathPoints);
const pathMaterial = new THREE.LineBasicMaterial({ color: 0xff00ff, opacity: 0.8 });
const pathLine = new THREE.Line(pathGeometry, pathMaterial);
scene.add(pathLine);

// Convert latitude/longitude to 3D position
function latLongToVector3(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);

    return new THREE.Vector3(x, y, z);
}

// Update ISS position
async function updateISSPosition() {
    try {
        const response = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
        if (!response.ok) throw new Error('Network response was not ok.');
        const data = await response.json();

        const latitude = data.latitude;
        const longitude = data.longitude;
        const altitude = data.altitude;
        const velocity = data.velocity;

        const issPosition = latLongToVector3(latitude, longitude, earthRadius);
        issMarker.position.copy(issPosition);

        pathPoints.push(issPosition);
        pathGeometry.setFromPoints(pathPoints);

        document.getElementById('iss-lat').textContent = `Latitude: ${latitude.toFixed(2)}`;
        document.getElementById('iss-lon').textContent = `Longitude: ${longitude.toFixed(2)}`;
        document.getElementById('iss-alt').textContent = `Altitude: ${altitude.toFixed(2)} km`;
        document.getElementById('iss-vel').textContent = `Velocity: ${velocity.toFixed(2)} km/h`;

        // Simulating passenger count
        const passengerCount = Math.floor(Math.random() * 6) + 1; // Random number between 1 and 6
        document.getElementById('iss-passengers').textContent = `Passengers: ${passengerCount}`;

    } catch (error) {
        console.error('Error fetching ISS data:', error);
    }
}

// Update ISS position every 60 seconds
setInterval(updateISSPosition, 60000);
updateISSPosition(); // Initial call

// Update local time
function updateClock() {
    const now = new Date();
    document.getElementById('digital-clock').textContent = now.toLocaleTimeString();
}

setInterval(updateClock, 1000);

// Render loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();

// Handle window resizing
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
