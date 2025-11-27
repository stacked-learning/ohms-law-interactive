document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const voltageSlider = document.getElementById('voltage-slider');
    const resistanceSlider = document.getElementById('resistance-slider');

    const voltageLabel = document.getElementById('voltage-label');
    const currentLabel = document.getElementById('current-label');
    const resistanceLabel = document.getElementById('resistance-label');

    const voltageDisplay = document.getElementById('voltage-display');
    const currentDisplay = document.getElementById('current-display');
    const resistanceDisplay = document.getElementById('resistance-display');

    const batteryGroup = document.getElementById('battery-group');
    const resistorGroup = document.getElementById('resistor-group');
    const currentArrowsGroup = document.getElementById('current-arrows');

    // Constants for visual scaling
    const MIN_FONT_SIZE = 20;
    const MAX_FONT_SIZE = 120; // Max size for V

    // State
    let voltage = 4.5;
    let resistance = 500;
    let current = 0; // Amps

    function updateCalculation() {
        // Ohm's Law: I = V / R
        // Voltage is in Volts, Resistance is in Ohms
        // Current will be in Amps
        current = voltage / resistance;

        // Update text displays
        voltageDisplay.textContent = voltage.toFixed(1);
        resistanceDisplay.textContent = resistance.toFixed(0);

        // Display current in mA (milliAmps)
        const currentMA = current * 1000;
        currentDisplay.textContent = currentMA.toFixed(1);

        updateVisuals();
    }

    function updateVisuals() {
        updateEquationSizes();
        updateBattery();
        updateResistor();
        updateCurrentArrows();
    }

    function updateEquationSizes() {
        // Scale V font size based on voltage (0.1 - 9.0)
        // Linear interpolation: size = min + (val - minVal) * (max - min) / (maxVal - minVal)
        const vScale = (voltage - 0.1) / (9.0 - 0.1);
        const vSize = MIN_FONT_SIZE + vScale * (MAX_FONT_SIZE - MIN_FONT_SIZE);
        voltageLabel.style.fontSize = `${vSize}px`;

        // Scale R font size based on resistance (10 - 1000)
        const rScale = (resistance - 10) / (1000 - 10);
        const rSize = MIN_FONT_SIZE + rScale * (MAX_FONT_SIZE - MIN_FONT_SIZE);
        resistanceLabel.style.fontSize = `${rSize}px`;

        // Scale I font size based on current
        // Use logarithmic scale because current range is large (0.1mA to 900mA)
        // Min current ~ 0.1mA (0.0001 A) -> log10 = -4
        // Max current ~ 900mA (0.9 A) -> log10 ≈ -0.045
        // Let's set a floor for log calculation to avoid -Infinity
        const safeCurrent = Math.max(current, 0.0001);
        const logCurrent = Math.log10(safeCurrent);

        const minLog = -4; // log10(0.0001)
        const maxLog = 0;  // log10(1.0) approx max

        let iScale = (logCurrent - minLog) / (maxLog - minLog);
        // Clamp
        if (iScale < 0) iScale = 0;
        if (iScale > 1) iScale = 1;

        const iSize = MIN_FONT_SIZE + iScale * (MAX_FONT_SIZE - MIN_FONT_SIZE);
        currentLabel.style.fontSize = `${iSize}px`;
    }

    function updateBattery() {
        // Clear existing battery parts
        batteryGroup.innerHTML = '';

        // Determine number of cells based on voltage
        // 0-1.5V: 1 cell
        // 1.5-3.0V: 2 cells
        // ...
        // Max 9V -> 6 cells roughly
        const numCells = Math.max(1, Math.ceil(voltage / 1.5));

        const cellHeight = 20;
        const cellSpacing = 5;
        const totalHeight = numCells * cellHeight + (numCells - 1) * cellSpacing;
        const startY = -totalHeight / 2;
        const endY = totalHeight / 2;

        // Draw connecting leads from wire gap to battery terminals
        // Wire gap is from -75 to +75 (relative to center 200)
        // Top lead: from -75 to startY
        const topLead = document.createElementNS("http://www.w3.org/2000/svg", "line");
        topLead.setAttribute("x1", 0);
        topLead.setAttribute("y1", -75);
        topLead.setAttribute("x2", 0);
        topLead.setAttribute("y2", startY);
        topLead.setAttribute("stroke", "#555"); // Wire color
        topLead.setAttribute("stroke-width", "8");
        batteryGroup.appendChild(topLead);

        // Bottom lead: from endY to 75
        const bottomLead = document.createElementNS("http://www.w3.org/2000/svg", "line");
        bottomLead.setAttribute("x1", 0);
        bottomLead.setAttribute("y1", endY);
        bottomLead.setAttribute("x2", 0);
        bottomLead.setAttribute("y2", 75);
        bottomLead.setAttribute("stroke", "#555"); // Wire color
        bottomLead.setAttribute("stroke-width", "8");
        batteryGroup.appendChild(bottomLead);

        for (let i = 0; i < numCells; i++) {
            const y = startY + i * (cellHeight + cellSpacing);

            // Positive terminal (longer line)
            const posLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
            posLine.setAttribute("x1", -20);
            posLine.setAttribute("y1", y);
            posLine.setAttribute("x2", 20);
            posLine.setAttribute("y2", y);
            posLine.setAttribute("stroke", "#333");
            posLine.setAttribute("stroke-width", "4");
            batteryGroup.appendChild(posLine);

            // Negative terminal (shorter thick line)
            const negLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
            negLine.setAttribute("x1", -10);
            negLine.setAttribute("y1", y + 10);
            negLine.setAttribute("x2", 10);
            negLine.setAttribute("y2", y + 10);
            negLine.setAttribute("stroke", "#333");
            negLine.setAttribute("stroke-width", "8");
            batteryGroup.appendChild(negLine);
        }
    }

    function updateResistor() {
        // Clear existing dots
        // We want to keep the rect, so maybe just clear a group inside resistor-group?
        // Actually, let's just rebuild the dots.
        // Remove all circle elements
        const existingDots = resistorGroup.querySelectorAll('circle');
        existingDots.forEach(dot => dot.remove());

        // Number of dots proportional to resistance
        // 10 ohms -> few dots
        // 1000 ohms -> many dots (e.g. 100)
        const numDots = Math.floor(resistance / 10);

        for (let i = 0; i < numDots; i++) {
            const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            // Random position within the resistor rect (-20 to 20 x, -75 to 75 y)
            const x = (Math.random() * 36) - 18; // slightly padded
            const y = (Math.random() * 140) - 70;

            dot.setAttribute("cx", x);
            dot.setAttribute("cy", y);
            dot.setAttribute("r", 1.5);
            dot.setAttribute("fill", "black");
            dot.classList.add("resistor-dot");
            resistorGroup.appendChild(dot);
        }
    }

    function updateCurrentArrows() {
        // Define the motion path if it doesn't exist
        let motionPath = document.getElementById('motion-path');
        if (!motionPath) {
            motionPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
            motionPath.setAttribute("id", "motion-path");
            // Path: Up from battery -> Right -> Down through resistor -> Left -> Up to battery
            // Battery center is roughly x=50. Top wire y=50. Bottom wire y=350.
            // Start at (50, 275) - center of battery group
            // Actually, let's trace the wire path.
            // Start (50, 200) -> (50, 50) -> (550, 50) -> (550, 200) -> (550, 350) -> (50, 350) -> (50, 200)
            // But we want continuous loop.
            const d = "M 50 200 L 50 50 L 550 50 L 550 200 L 550 350 L 50 350 L 50 200";
            motionPath.setAttribute("d", d);
            motionPath.setAttribute("fill", "none");
            motionPath.setAttribute("stroke", "none"); // Invisible path
            // Append to svg, but maybe before arrows?
            // Actually, it just needs to be in the defs or in the svg.
            // Let's put it in defs if possible, or just hidden in svg.
            const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
            defs.appendChild(motionPath);
            document.getElementById('circuit-svg').prepend(defs);
        }

        // Clear existing arrows
        currentArrowsGroup.innerHTML = '';

        // If current is very small, no arrows
        if (current < 0.001) return;

        // Number of arrows proportional to current? 
        // Or fixed number with variable speed?
        // PhET seems to have fixed number (maybe 10-15) and speed changes.
        const numArrows = 20;

        // Calculate duration based on current
        // Higher current -> faster speed -> lower duration
        // Max current ~0.9A. Min ~0.0001A.
        // Let's say max speed takes 2s for full loop. Min speed takes 20s.
        // Formula: dur = Base / Current?
        // Let's try: dur = 2 / current (if current is 0.9, dur = 2.2s. If 0.01, dur = 200s - too slow?)
        // Let's clamp it.
        // Map current 0.0 - 0.9 to Duration 10s - 1s.
        // Linear interp?
        // t = (current - min) / (max - min)
        // dur = maxDur - t * (maxDur - minDur)
        const minDur = 1.5; // seconds at max current
        const maxDur = 10; // seconds at min current
        const maxCurrent = 0.9;
        const minCurrent = 0.0; // effectively

        let t = (current - minCurrent) / (maxCurrent - minCurrent);
        if (t > 1) t = 1;
        if (t < 0) t = 0;

        // Non-linear feel might be better, but linear for now.
        // Actually, current is I = V/R.
        // 9V / 10ohm = 0.9A.
        // 0.1V / 1000ohm = 0.0001A.
        // At 0.0001A, it should be barely moving.
        // So maybe 1/current is better?
        // dur = 1 / current. At 0.9A -> 1.1s. At 0.1A -> 10s. At 0.01A -> 100s.
        // This feels physically correct (velocity proportional to current).
        // Let's cap the max duration so it's not infinite.
        let duration = 1.5 / current;
        if (duration > 60) duration = 60; // Max 60s for full loop

        for (let i = 0; i < numArrows; i++) {
            const arrowGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

            // Arrow shape (triangle)
            const arrow = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            arrow.setAttribute("points", "-6,-4 6,0 -6,4"); // Pointing right
            arrow.setAttribute("fill", "red");
            arrowGroup.appendChild(arrow);

            // Animate motion
            const animate = document.createElementNS("http://www.w3.org/2000/svg", "animateMotion");
            animate.setAttribute("href", "#motion-path"); // This might not work directly in all browsers if href is not supported on element, need xlink:href or just parent it.
            // Actually, putting animateMotion INSIDE the element to be animated is standard.
            // We need to reference the path.

            // mpath element
            const mpath = document.createElementNS("http://www.w3.org/2000/svg", "mpath");
            mpath.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#motion-path");
            animate.appendChild(mpath);

            animate.setAttribute("dur", `${duration}s`);
            animate.setAttribute("repeatCount", "indefinite");
            animate.setAttribute("rotate", "auto");

            // Stagger start times
            // We want them evenly spaced.
            // begin = - (i / numArrows) * duration
            // Negative begin time starts animation immediately at that offset.
            const offset = (i / numArrows) * duration;
            animate.setAttribute("begin", `-${offset}s`);

            arrowGroup.appendChild(animate);
            currentArrowsGroup.appendChild(arrowGroup);
        }
    }

    // Event Listeners
    voltageSlider.addEventListener('input', (e) => {
        voltage = parseFloat(e.target.value);
        updateCalculation();
    });

    resistanceSlider.addEventListener('input', (e) => {
        resistance = parseInt(e.target.value);
        updateCalculation();
    });

    // Initial render
    updateCalculation();
});
