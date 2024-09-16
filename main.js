// Initialize variables
let scene, camera, renderer, controls;
let issDot, issPathLine;
let issCoordinates = { lat: 0, lon: 0, alt: 0, vel: 0, passengers: 9 };
let lastUpdate = Date.now();
const updateInterval = 15000; // Update ISS data every 15 seconds
const sunUpdateInterval = 3600000; // Update Sun position every hour

// Initialize the scene
function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('globe-container').appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;

    camera.position.z = 5;

    // Create the ISS dot and path line
    const geometry = new THREE.SphereGeometry(0.1, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    issDot = new THREE.Mesh(geometry, material);
    scene.add(issDot);

    // Create and add ISS path line (dummy line for now)
    const pathGeometry = new THREE.BufferGeometry().setFromPoints([]);
    const pathMaterial = new THREE.LineBasicMaterial({ color: 0xff00ff });
    issPathLine = new THREE.Line(pathGeometry, pathMaterial);
    scene.add(issPathLine);

    // Load textures and create the globe
    loadTextures();
}

// Load textures
function loadTextures() {
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load('assets/earth.jpg', () => {
        const earthGeometry = new THREE.SphereGeometry(2, 64, 64);
        const earthMaterial = new THREE.MeshPhongMaterial({ map: earthTexture });
        const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
        scene.add(earthMesh);

        const ambientLight = new THREE.AmbientLight(0x333333);
        scene.add(ambientLight);

        const sunlight = new THREE.DirectionalLight(0xffffff, 1.0);
        sunlight.position.set(5, 5, 5).normalize();
        scene.add(sunlight);
    }, undefined, (error) => {
        console.error('Error loading Earth texture:', error);
    });
}

// Animate the scene
function animate() {
    requestAnimationFrame(animate);
    controls.update(); // Update controls
    renderer.render(scene, camera);
}

// Update ISS position
function updateISSPosition(lat, lon) {
    // Convert latitude and longitude to 3D coordinates
    const radius = 2; // Adjust based on globe scale
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    issDot.position.x = radius * Math.sin(phi) * Math.cos(theta);
    issDot.position.y = radius * Math.cos(phi);
    issDot.position.z = radius * Math.sin(phi) * Math.sin(theta);

    // Update ISS coordinates display
    document.getElementById('iss-lat').innerText = `Latitude: ${lat.toFixed(2)}`;
    document.getElementById('iss-lon').innerText = `Longitude: ${lon.toFixed(2)}`;
}

// Fetch ISS data from API
async function fetchISSData() {
    try {
        const response = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
        if (response.ok) {
            const data = await response.json();
            const currentTime = Date.now();

            // Update ISS data only if the interval has passed
            if (currentTime - lastUpdate >= updateInterval) {
                lastUpdate = currentTime;
                issCoordinates.lat = data.latitude;
                issCoordinates.lon = data.longitude;
                issCoordinates.alt = data.altitude;
                issCoordinates.vel = data.velocity;
                
                updateISSPosition(issCoordinates.lat, issCoordinates.lon);

                // Update other ISS details
                document.getElementById('iss-alt').innerText = `Altitude: ${issCoordinates.alt.toFixed(2)} km`;
                document.getElementById('iss-vel').innerText = `Velocity: ${issCoordinates.vel.toFixed(2)} km/h`;
                document.getElementById('iss-passengers').innerText = `Passengers: ${issCoordinates.passengers}`;
            }
        } else {
            console.error('Failed to fetch ISS data');
        }
    } catch (error) {
        console.error('Error fetching ISS data:', error);
    }

    // Schedule the next update
    setTimeout(fetchISSData, updateInterval);
}

// Update local time with time zone
function updateLocalTime() {
    const now = new Date();
    const options = {
        timeZoneName: 'short',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    };
    const localTimeString = now.toLocaleTimeString('en-US', options);
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    document.getElementById('digital-clock').innerText = `Local Time (${timeZone}): ${localTimeString}`;
}

// Update Sun position (mock function)
function updateSunPosition() {
    // Placeholder for Sun position update logic
    console.log('Updating Sun position...');
}

// Initialize the application
init();
setInterval(updateLocalTime, 1000); // Update local time every second
setInterval(updateSunPosition, sunUpdateInterval); // Update Sun position every hour

// Start the data fetch and animation
fetchISSData();
animate();
