let scene, camera, renderer, sun;
const planets = [];
const orbits = [];
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let tooltip;
const textureLoader = new THREE.TextureLoader();

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

    tooltip = document.getElementById('tooltip');

    // Increased ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 0, 0);
    scene.add(directionalLight);

    // Create sun
    createSun();
    
    // Create planets
    createPlanets();
    
    // Create starfield
    createStars();

    // Position camera
    camera.position.z = 50;
    camera.position.y = 30;
    camera.lookAt(0, 0, 0);
    
    // Add event listeners
    window.addEventListener('wheel', onScroll);
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('click', onClick);
    window.addEventListener('mousemove', onMouseMove);

    animate();
}

function createSun() {
    const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
    const sunTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/sun.jpg');
    const sunMaterial = new THREE.MeshBasicMaterial({
        map: sunTexture,
        emissive: 0xffff00,
        emissiveIntensity: 1
    });
    sun = new THREE.Mesh(sunGeometry, sunMaterial);
    
    // Enhanced sun glow
    const sunLight = new THREE.PointLight(0xffff00, 3, 100);
    sun.add(sunLight);
    
    // Add corona effect
    const coronaGeometry = new THREE.SphereGeometry(5.5, 32, 32);
    const coronaMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide
    });
    const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
    sun.add(corona);
    
    scene.add(sun);
}

function createRings(planet, innerRadius, outerRadius, color) {
    const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
    const ringMaterial = new THREE.MeshPhongMaterial({
        color: color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
        shininess: 30
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    planet.add(ring);
    return ring;
}

function createPlanets() {
    const planetData = [
        { 
            name: 'Mercury', 
            size: 1.5, 
            distance: 10, 
            textureUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/mercury.jpg',
            speed: 0.008, 
            url: '', 
            inclination: 7.0,
            bumpScale: 0.05
        },
        { 
            name: 'Venus', 
            size: 2.0, 
            distance: 15, 
            textureUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/venus.jpg',
            speed: 0.006, 
            url: '', 
            inclination: 3.4,
            bumpScale: 0.05
        },
        { 
            name: 'Earth', 
            size: 2.2, 
            distance: 20, 
            textureUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth.jpg',
            speed: 0.004, 
            url: 'https://fms.theserendipity.org', 
            inclination: 0.0,
            bumpScale: 0.1,
            hasAtmosphere: true
        },
        { 
            name: 'Mars', 
            size: 1.8, 
            distance: 25, 
            textureUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/mars.jpg',
            speed: 0.003, 
            url: '', 
            inclination: 1.9,
            bumpScale: 0.15
        },
        { 
            name: 'Jupiter', 
            size: 4.0, 
            distance: 32, 
            textureUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/jupiter.jpg',
            speed: 0.002, 
            url: '', 
            inclination: 1.3
        },
        { 
            name: 'Saturn', 
            size: 3.5, 
            distance: 40, 
            textureUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/saturn.jpg',
            speed: 0.0015, 
            url: '', 
            inclination: 2.5,
            hasRings: true
        },
        { 
            name: 'Uranus', 
            size: 3.0, 
            distance: 45, 
            textureUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/uranus.jpg',
            speed: 0.001, 
            url: '', 
            inclination: 0.8,
            hasRings: true
        },
        { 
            name: 'Neptune', 
            size: 2.8, 
            distance: 50, 
            textureUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/neptune.jpg',
            speed: 0.0008, 
            url: '', 
            inclination: 1.8,
            hasRings: true
        }
    ];

    planetData.forEach(data => {
        const planetGeometry = new THREE.SphereGeometry(data.size, 32, 32);
        const texture = textureLoader.load(data.textureUrl);
        
        const planetMaterial = new THREE.MeshPhongMaterial({
            map: texture,
            shininess: 30,
            bumpScale: data.bumpScale || 0,
            specular: new THREE.Color(0x333333)
        });

        const planet = new THREE.Mesh(planetGeometry, planetMaterial);
        
        // Add rings where appropriate
        if (data.hasRings) {
            if (data.name === 'Saturn') {
                createRings(planet, data.size + 1, data.size + 4, 0xc5a880);
            } else if (data.name === 'Uranus') {
                createRings(planet, data.size + 0.8, data.size + 1.5, 0x9db4c0);
            } else if (data.name === 'Neptune') {
                createRings(planet, data.size + 0.6, data.size + 1.2, 0x4b5e7b);
            }
        }

        // Add atmosphere for Earth
        if (data.hasAtmosphere) {
            const atmosphereGeometry = new THREE.SphereGeometry(data.size + 0.2, 32, 32);
            const atmosphereMaterial = new THREE.MeshPhongMaterial({
                color: 0x6ca6ff,
                transparent: true,
                opacity: 0.3,
                side: THREE.BackSide
            });
            const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
            planet.add(atmosphere);
        }
        
        const planetGroup = new THREE.Group();
        planetGroup.add(planet);
        planetGroup.rotation.x = (data.inclination * Math.PI) / 180;
        
        planet.userData = { 
            isClickable: true,
            url: data.url,
            name: data.name
        };
        
        // Create orbit with inclination
        const orbitGeometry = new THREE.RingGeometry(data.distance, data.distance + 0.1, 64);
        const orbitMaterial = new THREE.MeshBasicMaterial({
            color: 0x666666,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
        orbit.rotation.x = Math.PI / 2;
        
        const orbitGroup = new THREE.Group();
        orbitGroup.add(orbit);
        orbitGroup.rotation.x = (data.inclination * Math.PI) / 180;
        
        planets.push({
            mesh: planet,
            group: planetGroup,
            distance: data.distance,
            speed: data.speed,
            angle: Math.random() * Math.PI * 2,
            material: planetMaterial,
            inclination: data.inclination
        });
        
        scene.add(planetGroup);
        scene.add(orbitGroup);
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
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    // Reset all planet materials
    planets.forEach(planet => {
        planet.material.emissive.setHex(0x000000);
    });

    tooltip.style.display = 'none';
    document.body.style.cursor = 'default';

    for (let i = 0; i < intersects.length; i++) {
        const object = intersects[i].object;
        if (object.userData && object.userData.isClickable) {
            object.material.emissive.setHex(0x555555);
            
            tooltip.textContent = object.userData.name;
            if (object.userData.url) {
                tooltip.textContent += ' (Clickable)';
            }
            tooltip.style.display = 'block';
            tooltip.style.left = (event.clientX + 10) + 'px';
            tooltip.style.top = (event.clientY + 10) + 'px';
            
            if (object.userData.url) {
                document.body.style.cursor = 'pointer';
            }
            return;
        }
    }
}

function onClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

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
    camera.position.z = Math.max(15, Math.min(100, camera.position.z));
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    sun.rotation.y += 0.002;

    planets.forEach(planet => {
        planet.angle += planet.speed;
        
        const x = Math.cos(planet.angle) * planet.distance;
        const z = Math.sin(planet.angle) * planet.distance;
        
        planet.mesh.position.x = x;
        planet.mesh.position.z = z;
        planet.mesh.rotation.y += 0.01;
    });

    renderer.render(scene, camera);
}

init();
