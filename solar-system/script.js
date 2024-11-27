let scene, camera, renderer, sun;
const planets = [];
const orbits = [];
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let tooltip;

// Initialize the scene
function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector('#solarSystem'),
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Get tooltip element
    tooltip = document.getElementById('tooltip');

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);

    // Create sun
    createSun();
    
    // Create planets
    createPlanets();
    
    // Create starfield
    createStars();

    // Position camera
    camera.position.z = 50;
    
    // Add event listeners
    window.addEventListener('wheel', onScroll);
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('click', onClick);
    window.addEventListener('mousemove', onMouseMove);

    animate();
}

function createSun() {
    const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.9
    });
    sun = new THREE.Mesh(sunGeometry, sunMaterial);
    
    // Add sun glow
    const sunGlow = new THREE.PointLight(0xffff00, 2, 100);
    sun.add(sunGlow);
    
    scene.add(sun);
}

function createPlanets() {
    // Reduced speeds for better clickability
    const planetData = [
        { name: 'Mercury', size: 1.2, distance: 10, color: 0x808080, speed: 0.008, url: '' },
        { name: 'Venus', size: 1.6, distance: 15, color: 0xffd700, speed: 0.006, url: '' },
        { name: 'Earth', size: 1.8, distance: 20, color: 0x0077be, speed: 0.004, url: 'https://fms.theserendipity.org' },
        { name: 'Mars', size: 1.4, distance: 25, color: 0xff4500, speed: 0.003, url: '' },
        { name: 'Jupiter', size: 3.5, distance: 32, color: 0xffa500, speed: 0.002, url: '' },
        { name: 'Saturn', size: 3.0, distance: 40, color: 0xffd700, speed: 0.0015, url: '' },
        { name: 'Uranus', size: 2.5, distance: 45, color: 0x40e0d0, speed: 0.001, url: '' },
        { name: 'Neptune', size: 2.3, distance: 50, color: 0x0000ff, speed: 0.0008, url: '' }
    ];

    planetData.forEach(data => {
        // Create planet with hover effect material
        const planetGeometry = new THREE.SphereGeometry(data.size, 32, 32);
        const planetMaterial = new THREE.MeshPhongMaterial({
            color: data.color,
            shininess: 25,
            emissive: 0x000000
        });
        const planet = new THREE.Mesh(planetGeometry, planetMaterial);
        planet.userData = { 
            isClickable: true,
            url: data.url,
            originalColor: data.color,
            name: data.name
        };
        
        // Create orbit
        const orbitGeometry = new THREE.RingGeometry(data.distance, data.distance + 0.1, 64);
        const orbitMaterial = new THREE.MeshBasicMaterial({
            color: 0x666666,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
        orbit.rotation.x = Math.PI / 2;
        
        planets.push({
            mesh: planet,
            distance: data.distance,
            speed: data.speed,
            angle: Math.random() * Math.PI * 2,
            material: planetMaterial
        });
        
        scene.add(planet);
        scene.add(orbit);
    });
}

function createStars() {
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
        color: 0xFFFFFF,
        size: 0.1
    });

    const starVertices = [];
    for (let i = 0; i < 10000; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = (Math.random() - 0.5) * 2000;
        starVertices.push(x, y, z);
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
}

function onMouseMove(event) {
    // Calculate mouse position in normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(scene.children);

    // Reset all planet materials
    planets.forEach(planet => {
        planet.material.emissive.setHex(0x000000);
    });

    // Hide tooltip by default
    tooltip.style.display = 'none';
    document.body.style.cursor = 'default';

    // Check for intersections
    for (let i = 0; i < intersects.length; i++) {
        const object = intersects[i].object;
        if (object.userData && object.userData.isClickable) {
            // Highlight planet
            object.material.emissive.setHex(0x555555);
            
            // Show tooltip with planet name
            tooltip.textContent = object.userData.name;
            if (object.userData.url) {
                tooltip.textContent += ' (Clickable)';
            }
            tooltip.style.display = 'block';
            tooltip.style.left = (event.clientX + 10) + 'px';
            tooltip.style.top = (event.clientY + 10) + 'px';
            
            // Change cursor if planet is clickable
            if (object.userData.url) {
                document.body.style.cursor = 'pointer';
            }
            return;
        }
    }
}

function onClick(event) {
    // Calculate mouse position in normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(scene.children);

    for (let i = 0; i < intersects.length; i++) {
        const object = intersects[i].object;
        if (object.userData && object.userData.isClickable && object.userData.url) {
            window.open(object.userData.url, '_blank');
            return;
        }
    }
}

function onScroll(event) {
    const zoomSpeed = 0.1;
    camera.position.z += event.deltaY * zoomSpeed;
    
    // Limit zoom range
    camera.position.z = Math.max(15, Math.min(100, camera.position.z));
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    // Rotate sun
    sun.rotation.y += 0.002;

    // Update planets
    planets.forEach(planet => {
        planet.angle += planet.speed;
        planet.mesh.position.x = Math.cos(planet.angle) * planet.distance;
        planet.mesh.position.z = Math.sin(planet.angle) * planet.distance;
        planet.mesh.rotation.y += 0.01;
    });

    renderer.render(scene, camera);
}

// Start the application
init();
