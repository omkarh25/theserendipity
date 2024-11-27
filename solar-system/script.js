let scene, camera, renderer, sun;
const planets = [];
const orbits = [];
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let tooltip;
let currentState = 'intro';
let particles = [];
let galaxyParticles;
let clock;

function init() {
    clock = new THREE.Clock();
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector('#solarSystem'),
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    tooltip = document.getElementById('tooltip');
    camera.position.z = 50;
    
    window.addEventListener('click', handleClick);
    window.addEventListener('wheel', onScroll);
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onMouseMove);

    animate();
}

function handleClick() {
    switch(currentState) {
        case 'intro':
            document.getElementById('intro').classList.remove('active');
            currentState = 'bigbang';
            createBigBang();
            break;
        case 'milkyway':
            document.getElementById('milkyway-text').classList.remove('active');
            currentState = 'solar';
            transitionToSolarSystem();
            break;
    }
}

function createBigBang() {
    // Initial flash
    const flashGeometry = new THREE.SphereGeometry(1, 32, 32);
    const flashMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1
    });
    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    scene.add(flash);

    // Shockwave
    const shockwaveGeometry = new THREE.RingGeometry(0.1, 0.2, 32);
    const shockwaveMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide
    });
    const shockwave = new THREE.Mesh(shockwaveGeometry, shockwaveMaterial);
    scene.add(shockwave);

    // Animate flash and shockwave
    const expandEffects = () => {
        flash.scale.multiplyScalar(1.2);
        flash.material.opacity *= 0.95;
        shockwave.scale.multiplyScalar(1.3);
        shockwave.material.opacity *= 0.96;
        
        if(flash.material.opacity > 0.01) {
            requestAnimationFrame(expandEffects);
        } else {
            scene.remove(flash);
            scene.remove(shockwave);
        }
    };
    expandEffects();

    // Create particle systems
    const createParticleSystem = (count, size, speed, colorFn) => {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3);
        const turbulence = new Float32Array(count * 3);

        for(let i = 0; i < count; i++) {
            const i3 = i * 3;
            
            // Initial positions (tight sphere)
            const phi = Math.random() * Math.PI * 2;
            const theta = Math.random() * Math.PI;
            const r = Math.random() * 0.1;

            positions[i3] = r * Math.sin(theta) * Math.cos(phi);
            positions[i3 + 1] = r * Math.sin(theta) * Math.sin(phi);
            positions[i3 + 2] = r * Math.cos(theta);

            // Velocities (outward)
            velocities[i3] = (Math.random() - 0.5) * speed;
            velocities[i3 + 1] = (Math.random() - 0.5) * speed;
            velocities[i3 + 2] = (Math.random() - 0.5) * speed;

            // Turbulence factors
            turbulence[i3] = Math.random() * Math.PI * 2;
            turbulence[i3 + 1] = Math.random() * Math.PI * 2;
            turbulence[i3 + 2] = Math.random() * Math.PI * 2;

            // Colors
            const color = colorFn(r, phi, theta);
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: size,
            vertexColors: true,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const points = new THREE.Points(geometry, material);
        points.userData = { velocities, turbulence };
        return points;
    };

    // Core particles (white-hot center)
    const coreParticles = createParticleSystem(50000, 0.15, 0.02, () => ({
        r: 1, g: 1, b: 0.95
    }));

    // Nebula particles (colorful outer region)
    const nebulaParticles = createParticleSystem(30000, 0.2, 0.015, (r, phi) => {
        const t = Math.random();
        return t < 0.5 ? 
            { r: 0.9, g: 0.2, b: 0.1 } : // Red regions
            { r: 0.1, g: 0.2, b: 0.9 };  // Blue regions
    });

    // Dust particles (scattered throughout)
    const dustParticles = createParticleSystem(20000, 0.1, 0.01, () => ({
        r: 0.6, g: 0.6, b: 0.8
    }));

    particles = [coreParticles, nebulaParticles, dustParticles];
    particles.forEach(p => scene.add(p));

    setTimeout(() => {
        currentState = 'milkyway';
        createMilkyWay();
    }, 8000);
}

function animateBigBang() {
    const time = clock.getElapsedTime();
    const deltaTime = clock.getDelta();

    particles.forEach((system, index) => {
        const positions = system.geometry.attributes.position.array;
        const colors = system.geometry.attributes.color.array;
        const velocities = system.userData.velocities;
        const turbulence = system.userData.turbulence;

        for(let i = 0; i < positions.length; i += 3) {
            // Add turbulent motion
            const turbX = Math.sin(time + turbulence[i]) * 0.02;
            const turbY = Math.cos(time + turbulence[i + 1]) * 0.02;
            const turbZ = Math.sin(time * 0.5 + turbulence[i + 2]) * 0.02;

            // Update positions
            positions[i] += (velocities[i] + turbX) * deltaTime * 60;
            positions[i + 1] += (velocities[i + 1] + turbY) * deltaTime * 60;
            positions[i + 2] += (velocities[i + 2] + turbZ) * deltaTime * 60;

            // Accelerate particles
            velocities[i] *= 1.02;
            velocities[i + 1] *= 1.02;
            velocities[i + 2] *= 1.02;

            // Color evolution
            if(index === 0) { // Core particles
                const dist = Math.sqrt(
                    positions[i] * positions[i] + 
                    positions[i + 1] * positions[i + 1] + 
                    positions[i + 2] * positions[i + 2]
                );
                const heat = Math.max(0, 1 - (dist / 10));
                colors[i] = Math.min(1, 0.8 + heat * 0.2);
                colors[i + 1] = Math.min(1, 0.7 + heat * 0.3);
                colors[i + 2] = Math.min(1, 0.6 + heat * 0.4);
            }
        }

        system.geometry.attributes.position.needsUpdate = true;
        system.geometry.attributes.color.needsUpdate = true;
    });
}

// Rest of the code (createMilkyWay, animateMilkyWay, etc.) remains the same
