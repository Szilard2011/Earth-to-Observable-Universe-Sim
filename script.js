document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const body = document.body;
    const simulator = document.getElementById('simulator');
    const skyBgContainer = document.getElementById('sky-bg-container');
    const skyCurrentElement = document.getElementById('sky-current');
    const skyNextElement = document.getElementById('sky-next');
    const starsParallaxContainer = document.getElementById('stars-parallax-container');
    const starsContainer = document.getElementById('stars-container');
    const rocketElement = document.getElementById('rocket');
    const flameElement = rocketElement.querySelector('.flame');
    const distanceDisplay = document.getElementById('distance');
    const velocityDisplay = document.getElementById('velocity');
    const timerDisplay = document.getElementById('timer');
    const layerNameDisplay = document.getElementById('layer-name');
    const thrustSlider = document.getElementById('thrust-slider');
    const thrustLabel = document.getElementById('thrust-label');
    const thrustValueSpan = document.getElementById('thrust-value');
    const messageOverlay = document.getElementById('message-overlay');
    const messageText = document.getElementById('message-text');
    const modeToggleButton = document.getElementById('mode-toggle');
    const groundElement = document.getElementById('ground');
    const debugToggleButton = document.getElementById('debug-toggle');
    const debugPanel = document.getElementById('debug-panel');
    const debugResetButton = document.getElementById('debug-reset');
    const pcInstructions = document.getElementById('pc-instructions'); // Get instructions element

    // Debug Input Elements & Value Spans
    const debugInputs = {
        thrust: document.getElementById('debug-thrust'),
        gravity: document.getElementById('debug-gravity'),
        drag: document.getElementById('debug-drag'),
        starSpeed: document.getElementById('debug-star-speed'),
        lightSpeed: document.getElementById('debug-lightspeed'), // Get checkbox
    };
    const debugValueSpans = {
        thrust: document.getElementById('debug-thrust-value'),
        gravity: document.getElementById('debug-gravity-value'),
        drag: document.getElementById('debug-drag-value'),
        starSpeed: document.getElementById('debug-star-speed-value'),
        // No value span for checkbox
    };

    // --- Simulation Constants (Use 'let' for debuggable values) ---
    let GRAVITY_SURFACE = 9.81;
    let THRUST_ACCELERATION_MAX = 45;
    let DRAG_FACTOR_SEA_LEVEL = 0.0005;
    // STAR_PARALLAX_FACTOR > 1 means stars move slower than sky (more distant)
    let STAR_PARALLAX_FACTOR = 3;

    // ** ADDED MISSING CONSTANT HERE **
    const AIR_DENSITY_FALLOFF_ALTITUDE = 8500; // Altitude (m) where air density drops significantly

    // ** SET SKY SCROLL HEIGHT FACTOR TO 1 **
    const SKY_SCROLL_HEIGHT_FACTOR = 1; // No background scroll
    const COUNTDOWN_SECONDS = 10;
    const SKY_FADE_DURATION_MS = 2500; // Match CSS transition (in milliseconds)
    const GROUND_MAX_VISIBLE_ALTITUDE = 20000; // Meters (~20km) where ground disappears
    const STAR_CHECK_INTERVAL = 3; // Check star positions every N frames for performance
    const KEYBOARD_THRUST_INCREMENT = 0.02; // How much each key press changes thrust level
    const LIGHT_SPEED_RAMP_TIME_SCALE = 2; // Time in seconds to reach significant thrust multiplier (MUCH FASTER)
    const LIGHT_SPEED_RAMP_POWER = 11; // Power for acceleration curve (higher = faster ramp)
    const HIGH_VELOCITY_THRESHOLD = 0.1 * 299792458; // ~10% speed of light threshold for instant layer switch

    // --- Default Debug Values ---
    const defaultDebugValues = {
        thrust: 45,
        gravity: 9.81,
        drag: 0.0005,
        starSpeed: 1.1, // Default factor for standard parallax
        lightSpeed: false // Default light speed mode off
    };

    // --- Scale and Units ---
    const AU = 1.496e11;
    const LIGHT_YEAR = 9.461e15;
    const OBSERVABLE_UNIVERSE_RADIUS = 46.5 * 1e9 * LIGHT_YEAR;

    // --- Layer Definitions ---
    const layers = [
        { name: "Surface", minAlt: -Infinity, maxAlt: 0, color: 'linear-gradient(to top, #6a8aab 0%, #87CEEB 30%, #d0e0f0 80%, #304060 100%)', stars: 0, galaxies: 0 },
        { name: "Troposphere", minAlt: 0, maxAlt: 15000, color: 'linear-gradient(to top, #87CEEB 0%, #aaddf0 60%, #c0e0ff 100%)', stars: 0, galaxies: 0 },
        { name: "Stratosphere", minAlt: 15000, maxAlt: 50000, color: 'linear-gradient(to top, #a0c0f0 0%, #70a0ff 70%, #4060b0 100%)', stars: 0, galaxies: 0 },
        { name: "Mesosphere", minAlt: 50000, maxAlt: 85000, color: 'linear-gradient(to top, #4060b0 0%, #203080 60%, #101848 100%)', stars: 0, galaxies: 0 },
        { name: "Thermosphere", minAlt: 85000, maxAlt: 600000, color: 'linear-gradient(to top, #101848 0%, #080c24 70%, #02030a 100%)', stars: 5, galaxies: 0 },
        { name: "Exosphere", minAlt: 600000, maxAlt: 10e6, color: 'linear-gradient(to top, #02030a 0%, #010103 80%, #000 100%)', stars: 30, galaxies: 0 },
        { name: "Near Space", minAlt: 10e6, maxAlt: AU / 2, color: 'linear-gradient(to top, #000005 0%, #010108 50%, #000 100%)', stars: 80, galaxies: 0 },
        { name: "Inner Solar System", minAlt: AU / 2, maxAlt: 5 * AU, color: 'linear-gradient(to top, #010108 0%, #020105 70%, #000 100%)', stars: 150, galaxies: 0 },
        { name: "Outer Solar System", minAlt: 5 * AU, maxAlt: 50 * AU, color: 'linear-gradient(to top, #020105 0%, #030108 80%, #000 100%)', stars: 200, galaxies: 0 },
        { name: "Interstellar Space", minAlt: 50 * AU, maxAlt: 2 * LIGHT_YEAR, color: 'linear-gradient(to top, #030108 0%, #05020D 60%, #010001 100%)', stars: 300, galaxies: 1 },
        { name: "Deep Space", minAlt: 2 * LIGHT_YEAR, maxAlt: 1e6 * LIGHT_YEAR, color: 'linear-gradient(to top, #05020D 0%, #0A0514 50%, #010001 100%)', stars: 200, galaxies: 5 },
        { name: "Intergalactic Void", minAlt: 1e6 * LIGHT_YEAR, maxAlt: 1e9 * LIGHT_YEAR, color: 'linear-gradient(to top, #0A0514 0%, #140A1F 50%, #010001 100%)', stars: 50, galaxies: 20 },
        { name: "Cosmic Web", minAlt: 1e9 * LIGHT_YEAR, maxAlt: OBSERVABLE_UNIVERSE_RADIUS * 0.9, color: 'linear-gradient(to top, #140A1F 0%, #1F0A14 60%, #050105 100%)', stars: 20, galaxies: 50 },
        { name: "Edge of Observable Universe", minAlt: OBSERVABLE_UNIVERSE_RADIUS * 0.9, maxAlt: Infinity, color: 'linear-gradient(to top, #1F0A14 0%, #291a29 50%, #402A40 100%)', stars: 5, galaxies: 100, final: true }
    ];
    let currentLayer = layers[0];

    // --- Game State ---
    let state = {
        positionY: 0, velocityY: 0, timeElapsed: 0,
        thrustLevel: 0, isThrusting: false, gameRunning: false,
        lastTimestamp: 0, currentLayerIndex: 0, skyOffsetY: 0,
        won: false, countdownState: 'idle', audioReady: false,
        currentMode: 'mobile',
        isTransitioningSky: false, // Flag for sky fade
        hasLiftedOff: false,      // Flag for liftoff sound
        transitionEndListener: null, // Store listener reference to remove it
        frameCount: 0, // Add frame counter
        keysPressed: {}, // Track pressed keys for continuous thrust
        lightSpeedModeActive: false // Add light speed state
    };

    // --- Audio ---
    let audioContext;
    let soundBuffers = {};
    let thrustSoundSource = null;
    const soundFiles = {
        thrustLoop: 'sounds/rocket_thrust_loop.ogg',
        countdownBeep: 'sounds/countdown_beep.wav',
        liftoff: 'sounds/liftoff_rumble.mp3',
        win: 'sounds/win_chime.mp3'
    };

    // --- Initialize ---
    function init() {
        setScrollContainerHeights(); // Size sky and star containers
        skyCurrentElement.style.background = layers[0].color; // Set initial background directly
        skyCurrentElement.style.opacity = 1;
        skyNextElement.style.opacity = 0;
        groundElement.style.opacity = 1; // Ensure ground is visible initially
        groundElement.style.transform = 'translateY(0px)'; // Start ground at bottom
        setupEventListeners();
        setupDebugControls(); // Initialize debug panel values and listeners
        updateMode(); // Set initial mode based on body class
        populateStars(currentLayer.stars || 0, currentLayer.galaxies || 0); // Initial stars
        console.log("Simulator Initialized. Tap overlay or press [Space] to start countdown.");
    }

    // --- Audio Functions ---
    function initAudio() {
        if (state.audioReady || audioContext) return;
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            if (audioContext.state === 'suspended') {
                audioContext.resume().then(() => console.log("AudioContext resumed."));
            }
            const loadPromises = Object.entries(soundFiles).map(([name, path]) => loadSound(name, path));
            Promise.all(loadPromises)
                .then(() => { console.log("All sounds loaded"); state.audioReady = true; })
                .catch(error => console.error("Error loading sounds:", error));
        } catch (e) {
            console.error("Web Audio API is not supported.", e);
        }
    }
    async function loadSound(name, url) {
        if (!audioContext) throw new Error("AudioContext not available");
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status} for ${url}`);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            soundBuffers[name] = audioBuffer;
            console.log(`Sound loaded: ${name}`);
        } catch (error) {
            console.error(`Error loading sound ${name}:`, error);
            soundBuffers[name] = null;
        }
    }
    function playSound(name, loop = false, volume = 1.0) {
        if (!state.audioReady || !soundBuffers[name] || !audioContext) return null;
        if (audioContext.state === 'suspended') audioContext.resume();
        const source = audioContext.createBufferSource();
        source.buffer = soundBuffers[name];
        source.loop = loop;
        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        source.connect(gainNode).connect(audioContext.destination);
        source.start();
        return { source, gainNode }; // Return gain node too
    }
    function startThrustSound() {
        if (!thrustSoundSource && state.audioReady && state.thrustLevel > 0.01) {
            const volume = 0.2 + state.thrustLevel * 0.6; // Volume increases with thrust
            thrustSoundSource = playSound('thrustLoop', true, volume);
        } else if (thrustSoundSource && state.audioReady && thrustSoundSource.gainNode) {
            // Adjust volume smoothly if already playing
            const newVolume = 0.2 + state.thrustLevel * 0.6;
            // Use try-catch as gain node might become invalid if source stopped unexpectedly
             try {
                 thrustSoundSource.gainNode.gain.linearRampToValueAtTime(newVolume, audioContext.currentTime + 0.1);
             } catch(e) {
                 // Restart sound if ramp fails (e.g., node disconnected)
                 stopThrustSound();
                 startThrustSound();
             }
        }
    }
    function stopThrustSound() {
        if (thrustSoundSource) {
            try {
                // Fade out smoothly before stopping
                thrustSoundSource.gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1);
                thrustSoundSource.source.stop(audioContext.currentTime + 0.15); // Stop slightly after fade
                thrustSoundSource.source.disconnect(); // Disconnect source first
                thrustSoundSource.gainNode.disconnect(); // Then gain node
            } catch (e) {
                // If stop/disconnect fails (already stopped/disconnected?), just ignore
                console.warn("Error stopping thrust sound:", e);
            } finally {
                 thrustSoundSource = null; // Ensure it's cleared
            }
        }
    }
    // --- End Audio Functions ---

    // --- Dynamic Sizing & Mode ---
    let screenHeight = window.innerHeight;
    function setScrollContainerHeights() {
        screenHeight = window.innerHeight; // Update screen height
        // Use the potentially larger SKY_SCROLL_HEIGHT_FACTOR
        const skyHeight = screenHeight * SKY_SCROLL_HEIGHT_FACTOR;
        skyBgContainer.style.height = `${skyHeight}px`;
        starsParallaxContainer.style.height = `${skyHeight}px`;
        starsContainer.style.height = `${skyHeight}px`;
    }
    function toggleMode() {
        body.classList.toggle('mobile-mode');
        body.classList.toggle('pc-mode');
        updateMode();
    }
    function updateMode() {
        if (body.classList.contains('pc-mode')) {
            state.currentMode = 'pc';
            modeToggleButton.textContent = 'Switch to Mobile Mode';
            pcInstructions.classList.remove('hidden'); // Show instructions
        } else {
            state.currentMode = 'mobile';
            modeToggleButton.textContent = 'Switch to PC Mode';
            pcInstructions.classList.add('hidden'); // Hide instructions
        }
        console.log(`Switched to ${state.currentMode} mode.`);
    }
    // --- End Sizing & Mode ---

    // --- Formatting Functions ---
    function formatDistance(meters) {
        if (state.won) return "OBSERVABLE UNIVERSE LIMIT!";
        if (meters < 0) meters = 0;
        if (meters < 1000) return `${meters.toFixed(0)} m`;
        if (meters < 1e6) return `${(meters / 1000).toFixed(2)} km`;
        if (meters < 1e9) return `${(meters / 1e6).toFixed(2)} Million km`;
        if (meters < AU * 10) return `${(meters / AU).toFixed(3)} AU`;
        if (meters < LIGHT_YEAR) return `${(meters / AU).toFixed(0)} AU`; // Show more AU before LY
        if (meters < LIGHT_YEAR * 1000) return `${(meters / LIGHT_YEAR).toFixed(3)} Light Years`;
        if (meters < 1e6 * LIGHT_YEAR) return `${(meters / LIGHT_YEAR).toFixed(0)} Light Years`;
        if (meters < 1e9 * LIGHT_YEAR) return `${(meters / (1e6 * LIGHT_YEAR)).toFixed(3)} Million LY`;
        return `${(meters / (1e9 * LIGHT_YEAR)).toFixed(3)} Billion LY`;
    }
    function formatVelocity(metersPerSecond) {
        if (state.won) return "-";
        if (Math.abs(metersPerSecond) < 0.01) metersPerSecond = 0;
        const absVel = Math.abs(metersPerSecond);
        const sign = metersPerSecond < 0 ? "-" : "";
        if (absVel < 1000) return `${sign}${absVel.toFixed(1)} m/s`;
        if (absVel < 1e6) return `${sign}${(absVel / 1000).toFixed(1)} km/s`;
        const speedOfLight = 299792458;
        if (absVel < speedOfLight * 0.01) return `${sign}${(absVel / 1000).toFixed(0)} km/s`;
        return `${sign}${(absVel / speedOfLight).toFixed(4)} c`;
    }
    // --- End Formatting ---

    // --- Star/Galaxy Population & Update ---
    function populateStars(starCount, galaxyCount) {
        requestAnimationFrame(() => { // Use rAF for potentially smoother rendering
            starsContainer.innerHTML = '';
            const containerHeight = parseFloat(starsParallaxContainer.style.height);
            if (isNaN(containerHeight) || containerHeight <= 0) return; // Avoid errors if height not set

            // Add Stars
            for (let i = 0; i < starCount; i++) {
                const star = document.createElement('div'); star.classList.add('star'); const size = Math.random() * 1.5 + 0.5; star.style.width = `${size}px`; star.style.height = `${size}px`; star.style.left = `${Math.random() * 100}%`;
                // Start stars randomly within the full container height
                star.style.top = `${Math.random() * containerHeight}px`;
                star.style.opacity = Math.random() * 0.5 + 0.3;
                starsContainer.appendChild(star);
            }
            // Add Galaxies
            for (let i = 0; i < galaxyCount; i++) {
                const galaxy = document.createElement('div'); galaxy.classList.add('galaxy'); const scale = Math.random() * 0.6 + 0.7; galaxy.style.transform = `rotate(${Math.random() * 90}deg) scale(${scale})`; galaxy.style.left = `${Math.random() * 100}%`;
                galaxy.style.top = `${Math.random() * containerHeight}px`;
                starsContainer.appendChild(galaxy);
            }
        });
    }

    // --- Update Star Positions for Wrapping (Handles Positive TranslateY) ---
    function updateStarPositions() {
        if (state.frameCount % STAR_CHECK_INTERVAL !== 0) return;

        const parallaxTransform = starsParallaxContainer.style.transform;
        let currentTranslateYPercent = 0;
        if (parallaxTransform && parallaxTransform.includes('translateY')) {
            try { currentTranslateYPercent = parseFloat(parallaxTransform.split('translateY(')[1].split('%')[0]); } catch (e) {}
        }

        const containerPixelHeight = parseFloat(starsParallaxContainer.style.height);
        if (isNaN(containerPixelHeight) || containerPixelHeight <= 0) return;

        // Calculate current pixel offset of the container (Now POSITIVE)
        const currentTranslateYPx = (currentTranslateYPercent / 100) * containerPixelHeight;

        // Calculate the top edge of the viewport *within* the star container's coordinate system
        // Viewport top is effectively at -currentTranslateYPx relative to container's 0
        const viewportTopInContainerCoords = -currentTranslateYPx;
        // Calculate the bottom edge of the viewport
        const viewportBottomInContainerCoords = viewportTopInContainerCoords + screenHeight;

        const starElements = starsContainer.children;
        for (let i = 0; i < starElements.length; i++) {
            const star = starElements[i];
            const starOffsetTop = parseFloat(star.style.top || '0');
            const starHeight = parseFloat(star.style.height || '1');

            // Check if star's *bottom* edge is above the viewport's top edge
            // (starOffsetTop + starHeight) < viewportTopInContainerCoords means star is off the top
            if (starOffsetTop + starHeight < viewportTopInContainerCoords) {
                // Reposition it below the viewport's bottom edge
                const newTop = viewportBottomInContainerCoords + (Math.random() * screenHeight);
                star.style.top = `${newTop}px`;
            }
            // Check if star's *top* edge is below the viewport's bottom edge
            // starOffsetTop > viewportBottomInContainerCoords means star is off the bottom
            else if (starOffsetTop > viewportBottomInContainerCoords) {
                // Reposition it above the viewport's top edge
                const newTop = viewportTopInContainerCoords - (Math.random() * screenHeight) - starHeight;
                star.style.top = `${newTop}px`;
            }
        }
    }
    // --- End Star Update ---

    // --- Background Update (Visuals) ---
    function updateVisuals() {
        // --- Sky Layer Transition ---
        const newLayerIndex = getCurrentLayer(state.positionY);
        const oldLayerIndex = state.currentLayerIndex; // Store old index before updating state

        if (newLayerIndex !== oldLayerIndex) {
            const newLayer = layers[newLayerIndex];
            const oldLayer = layers[oldLayerIndex];

            // --- IMMEDIATE SWITCH LOGIC for high speed or interrupted transition ---
            if (Math.abs(state.velocityY) > HIGH_VELOCITY_THRESHOLD || state.isTransitioningSky) {
                // If already transitioning, or speed is too high, switch instantly

                // 1. Cancel any ongoing transition listener/timeout
                if (state.transitionEndListener) {
                    skyCurrentElement.removeEventListener('transitionend', state.transitionEndListener);
                    state.transitionEndListener = null;
                }
                state.isTransitioningSky = false; // Mark as not transitioning

                // 2. Instantly set the correct background on the main element
                skyCurrentElement.style.background = newLayer.color;
                skyCurrentElement.style.opacity = 1;
                skyNextElement.style.opacity = 0; // Ensure next is hidden

                // 3. Update state and UI text
                state.currentLayerIndex = newLayerIndex;
                layerNameDisplay.textContent = newLayer.name;

                // 4. Update stars if needed
                if (newLayer.stars !== oldLayer.stars || newLayer.galaxies !== oldLayer.galaxies) {
                    populateStars(newLayer.stars || 0, newLayer.galaxies || 0);
                }
                 // console.log(`INSTANT Layer Switch: ${oldLayer.name} -> ${newLayer.name}`);

            }
            // --- SMOOTH TRANSITION LOGIC for lower speeds ---
            else if (!state.isTransitioningSky) { // Only start if not already transitioning
                state.isTransitioningSky = true;
                state.currentLayerIndex = newLayerIndex; // Update state index

                skyNextElement.style.background = newLayer.color;
                skyNextElement.style.opacity = 1;
                skyCurrentElement.style.opacity = 0; // Start fading out current
                layerNameDisplay.textContent = newLayer.name; // Update text immediately

                const handleTransitionEnd = (event) => {
                    // Double check it's the right event and we are still meant to be transitioning
                    if (event.propertyName === 'opacity' && event.target === skyCurrentElement && state.isTransitioningSky) {
                        skyCurrentElement.style.background = newLayer.color;
                        skyCurrentElement.style.opacity = 1;
                        skyNextElement.style.opacity = 0;
                        state.isTransitioningSky = false;

                        if (newLayer.stars !== oldLayer.stars || newLayer.galaxies !== oldLayer.galaxies) {
                            populateStars(newLayer.stars || 0, newLayer.galaxies || 0);
                        }
                        skyCurrentElement.removeEventListener('transitionend', handleTransitionEnd);
                        state.transitionEndListener = null;
                        // console.log(`SMOOTH Layer Switch Complete: -> ${newLayer.name}`);
                    }
                };

                // Ensure previous listener is removed before adding a new one
                if (state.transitionEndListener) {
                    skyCurrentElement.removeEventListener('transitionend', state.transitionEndListener);
                }
                state.transitionEndListener = handleTransitionEnd;
                skyCurrentElement.addEventListener('transitionend', handleTransitionEnd);
                // console.log(`SMOOTH Layer Switch Start: ${oldLayer.name} -> ${newLayer.name}`);
            }
        } else if (!state.isTransitioningSky && skyCurrentElement.style.opacity !== '1') {
            // Safety check: If not transitioning but current isn't fully opaque, force it
            skyCurrentElement.style.opacity = 1;
            skyNextElement.style.opacity = 0;
        }


        // --- Visual Scrolling & Parallax ---
        screenHeight = window.innerHeight;
        const scrollSpeedFactor = Math.tanh(Math.abs(state.velocityY) / 70000);
        const scrollableHeightFactor = (SKY_SCROLL_HEIGHT_FACTOR - 1); // = 0 if factor is 1
        const targetYPercent = scrollSpeedFactor * scrollableHeightFactor * 100; // Positive % scroll
        state.skyOffsetY += (targetYPercent - state.skyOffsetY) * 0.05;

        const skyTranslateY = state.skyOffsetY;
        skyBgContainer.style.transform = `translateY(${skyTranslateY.toFixed(3)}%)`;

        const starsTranslateY = skyTranslateY / STAR_PARALLAX_FACTOR;
        starsParallaxContainer.style.transform = `translateY(${starsTranslateY.toFixed(3)}%)`;

        // --- Update Star Positions for Wrapping ---
        updateStarPositions();

        // --- Ground Movement ---
        if (state.positionY < GROUND_MAX_VISIBLE_ALTITUDE) {
            const groundTranslateY = Math.min(state.positionY * 1.2, screenHeight * 1.5);
            groundElement.style.transform = `translateY(${groundTranslateY.toFixed(1)}px)`;
            groundElement.style.opacity = Math.max(0, 1 - (state.positionY / GROUND_MAX_VISIBLE_ALTITUDE)).toFixed(2);
        } else if (parseFloat(groundElement.style.opacity) > 0) {
            groundElement.style.opacity = 0;
            groundElement.style.transform = `translateY(${screenHeight * 1.5}px)`;
        }
    }
    // --- End Background Update ---

    // --- Win Condition ---
    function reachWinCondition() {
        state.won = true; state.isThrusting = false; thrustSlider.value = 0; thrustSlider.disabled = true; updateThrustFromSlider(); stopThrustSound(); playSound('win');
        messageText.innerHTML = `Cosmic Milestone Reached!<br>Edge of the Observable Universe<br><span style='font-size: 0.6em; color: #aaa;'>Simulator by Pálnagy Szilárd</span>`;
        messageOverlay.classList.remove('hidden'); messageOverlay.style.cursor = 'default'; messageOverlay.onclick = null; state.gameRunning = false;
        window.removeEventListener('keydown', handleKeyDown); // Remove keyboard listeners on win
        window.removeEventListener('keyup', handleKeyUp);
    }
    // --- End Win Condition ---

    // --- Countdown Logic ---
    function startCountdown() {
        if (state.countdownState !== 'idle') return;
        initAudio(); // Attempt audio init on first interaction
        state.countdownState = 'counting';
        messageOverlay.style.cursor = 'default';
        messageOverlay.onclick = null; // Remove click listener
        window.removeEventListener('keydown', handlePreLaunchKeyDown); // Remove spacebar listener

        let count = COUNTDOWN_SECONDS;
        function countdownTick() {
            if (count > 0) {
                messageText.textContent = `T - ${count}`;
                playSound('countdownBeep', false, 0.8);
                count--;
                setTimeout(countdownTick, 1000);
            } else {
                messageText.textContent = "Ignition Sequence Start";
                state.countdownState = 'launched';
                thrustSlider.disabled = false; // Enable slider
                messageOverlay.classList.add('hidden');
                state.gameRunning = true;
                state.lastTimestamp = performance.now();
                requestAnimationFrame(gameLoop); // Start the main loop
                // Add keyboard listeners *after* launch
                window.addEventListener('keydown', handleKeyDown);
                window.addEventListener('keyup', handleKeyUp);
            }
        }
        messageText.textContent = `Initiating Sequence...`;
        setTimeout(countdownTick, 1500); // Short delay before T-10
    }
    // --- End Countdown ---

    // --- Thrust Control ---
    // Central function to set thrust level and update slider
    function setThrustLevel(level) {
        // Clamp level between 0 and 1
        const newLevel = Math.max(0, Math.min(1, level));
        if (Math.abs(newLevel - state.thrustLevel) > 0.001) { // Only update if changed significantly
            state.thrustLevel = newLevel;
            thrustSlider.value = newLevel; // Update slider position
            updateThrustFromSlider(); // Update visuals, sound, etc.
        }
    }

    // Updates visuals based on state.thrustLevel
    function updateThrustFromSlider() {
        const isNowThrusting = state.thrustLevel > 0.01;

        thrustValueSpan.textContent = `${(state.thrustLevel * 100).toFixed(0)}%`;

        // --- Liftoff Sound Logic ---
        if (state.countdownState === 'launched' && !state.hasLiftedOff && isNowThrusting) {
            playSound('liftoff', false, 0.9);
            state.hasLiftedOff = true;
        }

        // Update visuals and sound based on thrusting state change
        if (isNowThrusting) {
            if (!state.isThrusting) { rocketElement.classList.add('thrusting'); }
            startThrustSound();
            const flameScale = 0.1 + state.thrustLevel * 0.9;
            rocketElement.style.setProperty('--flame-scale', flameScale.toFixed(3));
        } else if (state.isThrusting) {
            rocketElement.classList.remove('thrusting');
            rocketElement.style.setProperty('--flame-scale', 0);
            stopThrustSound();
        }
        state.isThrusting = isNowThrusting;
    }
    // --- End Thrust Control ---


    // --- Game Loop ---
    function gameLoop(timestamp) {
        state.frameCount++;
        if (!state.gameRunning || state.won) { if (!state.won) stopThrustSound(); return; }

        // Calculate deltaTime
        if (!state.lastTimestamp) { // First frame initialization
            state.lastTimestamp = timestamp;
            requestAnimationFrame(gameLoop);
            return;
        }
        const deltaTime = (timestamp - state.lastTimestamp) / 1000;
        state.lastTimestamp = timestamp;
        const dt = Math.min(deltaTime, 0.1); // Cap delta time

        if (dt <= 0) { requestAnimationFrame(gameLoop); return; } // Skip if no time passed

        // --- Handle Continuous Keyboard Thrust ---
        if (state.currentMode === 'pc' && !thrustSlider.disabled) {
            let thrustChange = 0;
            if (state.keysPressed['w'] || state.keysPressed['arrowup']) { thrustChange += KEYBOARD_THRUST_INCREMENT; }
            if (state.keysPressed['s'] || state.keysPressed['arrowdown']) { thrustChange -= KEYBOARD_THRUST_INCREMENT; }
            if (thrustChange !== 0) { setThrustLevel(state.thrustLevel + thrustChange); }
        }

        // --- Physics Calculation ---
        const altitude = state.positionY;
        const earthRadius = 6371000;
        const distanceFromCenter = earthRadius + Math.max(0, altitude);
        let gravity = GRAVITY_SURFACE * Math.pow(earthRadius / distanceFromCenter, 2);
        const airDensityFactor = Math.exp(-Math.max(0, altitude) / AIR_DENSITY_FALLOFF_ALTITUDE); // Use the constant
        let dragForce = 0;
        if (state.velocityY !== 0) {
            dragForce = -DRAG_FACTOR_SEA_LEVEL * airDensityFactor * state.velocityY * Math.abs(state.velocityY);
        }

        // ** Calculate Effective Thrust with Light Speed Mode **
        let effectiveThrustMultiplier = 1.0;
        if (state.lightSpeedModeActive && state.timeElapsed > 1) { // Start ramp after 1 second
            const timeFactor = Math.max(0, state.timeElapsed) / LIGHT_SPEED_RAMP_TIME_SCALE;
            effectiveThrustMultiplier = 1.0 + Math.pow(timeFactor, LIGHT_SPEED_RAMP_POWER);
        }
        let thrust = state.thrustLevel * THRUST_ACCELERATION_MAX * effectiveThrustMultiplier; // Apply multiplier
        // ** End Light Speed Mode Calculation **

        let netAccelerationY = thrust - gravity + dragForce;

        // --- Update State ---
        state.velocityY += netAccelerationY * dt;
        state.positionY += state.velocityY * dt;

        // Ground limit refinement
        if (state.positionY <= 0 && state.velocityY < 0) {
            state.positionY = 0;
            state.velocityY = 0; // Stop downward velocity at ground
        }
        state.timeElapsed += dt;

        // --- Update UI Text ---
        timerDisplay.textContent = `${state.timeElapsed.toFixed(1)}s`;
        distanceDisplay.textContent = formatDistance(state.positionY);
        velocityDisplay.textContent = formatVelocity(state.velocityY);

        // --- Update Visuals ---
        updateVisuals(); // Call visual updates directly

        // --- Check Win Condition ---
        if (currentLayer.final && state.positionY >= OBSERVABLE_UNIVERSE_RADIUS && !state.won) {
            reachWinCondition();
        }

        // Request next frame for the loop
        requestAnimationFrame(gameLoop);
    }
    // --- End Game Loop ---


    // --- Debug Panel Logic ---
    function toggleDebugPanel() { debugPanel.classList.toggle('hidden'); }
    function setupDebugControls() {
        // Set initial values from constants/defaults
        debugInputs.thrust.value = THRUST_ACCELERATION_MAX; debugValueSpans.thrust.textContent = THRUST_ACCELERATION_MAX;
        debugInputs.gravity.value = GRAVITY_SURFACE; debugValueSpans.gravity.textContent = GRAVITY_SURFACE.toFixed(2);
        debugInputs.drag.value = DRAG_FACTOR_SEA_LEVEL; debugValueSpans.drag.textContent = DRAG_FACTOR_SEA_LEVEL.toFixed(4);
        debugInputs.starSpeed.value = STAR_PARALLAX_FACTOR; debugValueSpans.starSpeed.textContent = STAR_PARALLAX_FACTOR.toFixed(2);
        debugInputs.lightSpeed.checked = state.lightSpeedModeActive; // Set checkbox state

        // Add listeners
        debugInputs.thrust.addEventListener('input', (e) => { THRUST_ACCELERATION_MAX = parseFloat(e.target.value); debugValueSpans.thrust.textContent = THRUST_ACCELERATION_MAX; });
        debugInputs.gravity.addEventListener('input', (e) => { GRAVITY_SURFACE = parseFloat(e.target.value); debugValueSpans.gravity.textContent = GRAVITY_SURFACE.toFixed(2); });
        debugInputs.drag.addEventListener('input', (e) => { DRAG_FACTOR_SEA_LEVEL = parseFloat(e.target.value); debugValueSpans.drag.textContent = DRAG_FACTOR_SEA_LEVEL.toFixed(4); });
        debugInputs.starSpeed.addEventListener('input', (e) => { STAR_PARALLAX_FACTOR = parseFloat(e.target.value); debugValueSpans.starSpeed.textContent = STAR_PARALLAX_FACTOR.toFixed(2); });
        // Listener for Light Speed Checkbox
        debugInputs.lightSpeed.addEventListener('change', (e) => {
            state.lightSpeedModeActive = e.target.checked;
            console.log("Light Speed Mode:", state.lightSpeedModeActive);
        });

        debugResetButton.addEventListener('click', resetDebugDefaults);
    }
    function resetDebugDefaults() {
        THRUST_ACCELERATION_MAX = defaultDebugValues.thrust; GRAVITY_SURFACE = defaultDebugValues.gravity; DRAG_FACTOR_SEA_LEVEL = defaultDebugValues.drag; STAR_PARALLAX_FACTOR = defaultDebugValues.starSpeed;
        state.lightSpeedModeActive = defaultDebugValues.lightSpeed; // Reset light speed state
        setupDebugControls(); // Update sliders, text, and checkbox
    }
    // --- End Debug Panel ---

    // --- Keyboard Event Handlers ---
    function handlePreLaunchKeyDown(event) {
        if (event.code === 'Space' || event.key === ' ') {
            event.preventDefault();
            startCountdown(); // Start countdown on spacebar press
        }
    }

    function handleKeyDown(event) {
        // Ignore if modifier keys are pressed or input fields are focused
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable)) return;

        const key = event.key.toLowerCase();
        state.keysPressed[key] = true; // Track pressed key

        // Prevent default scroll for arrow keys used for thrust
        if (key === 'arrowup' || key === 'arrowdown' || key === 'w' || key === 's') {
            event.preventDefault();
        }
    }

    function handleKeyUp(event) {
        const key = event.key.toLowerCase();
        state.keysPressed[key] = false; // Untrack released key
    }
    // --- End Keyboard Handlers ---


    // --- Event Listeners Setup ---
    function setupEventListeners() {
        window.addEventListener('resize', setScrollContainerHeights);
        modeToggleButton.addEventListener('click', toggleMode);
        debugToggleButton.addEventListener('click', toggleDebugPanel);
        // Initial listeners for starting the game
        messageOverlay.addEventListener('click', startCountdown, { once: true });
        window.addEventListener('keydown', handlePreLaunchKeyDown, { once: true }); // Listen for spacebar once

        thrustSlider.addEventListener('input', () => setThrustLevel(parseFloat(thrustSlider.value))); // Update state from slider input
        // Prevent page scroll when interacting with slider on touch devices
        thrustSlider.addEventListener('touchstart', (e)=>{e.stopPropagation();}, {passive: true});
        thrustSlider.addEventListener('touchmove', (e)=>{e.stopPropagation();}, {passive: true});

        // Note: Keydown/keyup listeners for thrust are added *after* countdown finishes in startCountdown()
    }
    // --- End Listeners ---

    // --- Helper: Get Current Layer Index ---
    function getCurrentLayer(altitude) {
        if (!layers[state.currentLayerIndex]) state.currentLayerIndex = 0; // Safety check
        if (altitude >= layers[state.currentLayerIndex].minAlt && altitude < layers[state.currentLayerIndex].maxAlt) {
            return state.currentLayerIndex;
        }
        for (let i = 0; i < layers.length; i++) {
            if (altitude >= layers[i].minAlt && altitude < layers[i].maxAlt) { return i; }
        }
        if (altitude >= layers[layers.length - 1].minAlt) { return layers.length - 1; }
        return 0; // Default fallback
    }
    // --- End Helper ---

    // --- START THE SIMULATOR ---
    init();

}); // End DOMContentLoaded