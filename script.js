document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const voltageLabel = document.getElementById('voltage-label');
    const currentLabel = document.getElementById('current-label');
    const resistanceLabel = document.getElementById('resistance-label');

    const voltageDisplay = document.getElementById('voltage-display');
    const currentDisplay = document.getElementById('current-display');
    const resistanceDisplay = document.getElementById('resistance-display');

    const batteryGroup = document.getElementById('battery-group');
    const resistorGroup = document.getElementById('resistor-group');
    const currentArrowsGroup = document.getElementById('current-arrows');

    // Triangle View Elements
    const viewToggleBtn = document.getElementById('view-toggle-btn');
    const equationView = document.getElementById('equation-view');
    const triangleView = document.getElementById('triangle-view');

    const triVoltage = document.getElementById('tri-voltage');
    const triCurrent = document.getElementById('tri-current');
    const triResistance = document.getElementById('tri-resistance');

    // Constants for visual scaling
    const MIN_FONT_SIZE = 20;
    const MAX_FONT_SIZE = 120; // Max size for V

    // Triangle font scaling (smaller range due to space)
    const TRI_MIN_FONT = 14;
    const TRI_MAX_FONT = 48;

    // State
    let voltage = 4.5;
    let resistance = 500;
    let current = 0; // Amps
    let isTriangleView = false;

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
        // Calculate scales
        // Voltage (0 - 9.0)
        let vScale = (voltage - 0.1) / (9.0 - 0.1);
        vScale = Math.max(0, Math.min(1, vScale));

        // Resistance (10 - 1000)
        const rScale = (resistance - 10) / (1000 - 10);

        // Current (log scale)
        const safeCurrent = Math.max(current, 0.0001);
        const logCurrent = Math.log10(safeCurrent);
        const minLog = -4; // log10(0.0001)
        const maxLog = 0;  // log10(1.0) approx max
        let iScale = (logCurrent - minLog) / (maxLog - minLog);
        if (iScale < 0) iScale = 0;
        if (iScale > 1) iScale = 1;

        // Apply to Standard Equation View
        if (!isTriangleView) {
            const vSize = MIN_FONT_SIZE + vScale * (MAX_FONT_SIZE - MIN_FONT_SIZE);
            voltageLabel.style.fontSize = `${vSize}px`;

            const rSize = MIN_FONT_SIZE + rScale * (MAX_FONT_SIZE - MIN_FONT_SIZE);
            resistanceLabel.style.fontSize = `${rSize}px`;

            const iSize = MIN_FONT_SIZE + iScale * (MAX_FONT_SIZE - MIN_FONT_SIZE);
            currentLabel.style.fontSize = `${iSize}px`;
        } else {
            // Apply to Triangle View
            const vSize = TRI_MIN_FONT + vScale * (TRI_MAX_FONT - TRI_MIN_FONT);
            triVoltage.style.fontSize = `${vSize}px`;

            const rSize = TRI_MIN_FONT + rScale * (TRI_MAX_FONT - TRI_MIN_FONT);
            triResistance.style.fontSize = `${rSize}px`;

            const iSize = TRI_MIN_FONT + iScale * (TRI_MAX_FONT - TRI_MIN_FONT);
            triCurrent.style.fontSize = `${iSize}px`;
        }
    }

    // Toggle View Handler
    viewToggleBtn.addEventListener('click', () => {
        isTriangleView = !isTriangleView;

        if (isTriangleView) {
            equationView.classList.add('hidden');
            triangleView.classList.remove('hidden');
            viewToggleBtn.textContent = "Switch to V=IR View";
        } else {
            equationView.classList.remove('hidden');
            triangleView.classList.add('hidden');
            viewToggleBtn.textContent = "Switch to Triangle View";
        }

        // Force update to apply font sizes to the new view
        updateEquationSizes();
    });

    function updateBattery() {
        // Clear existing battery parts
        batteryGroup.innerHTML = '';

        // Clamp voltage and map to cells (1.5V per cell, max 6)
        const maxVoltage = 9;
        const clampedVoltage = Math.max(0, Math.min(maxVoltage, voltage));
        const cellCapacity = 1.5;
        const maxCells = 6;
        // Anchor point so the first cell stays put; pack grows to the right (shifted left)
        const anchorX = -150;

        if (clampedVoltage <= 0) {
            // Show only a tiny battery tip to indicate location
            const stubWidth = 12;
            const stubHeight = 16;
            const stubRadius = 2;
            const startX = anchorX;

            // Leads into the stub
            const leftLead = document.createElementNS("http://www.w3.org/2000/svg", "line");
            leftLead.setAttribute("x1", -75);
            leftLead.setAttribute("y1", 0);
            leftLead.setAttribute("x2", startX);
            leftLead.setAttribute("y2", 0);
            leftLead.setAttribute("stroke", "#555");
            leftLead.setAttribute("stroke-width", "8");
            batteryGroup.appendChild(leftLead);

            const rightLead = document.createElementNS("http://www.w3.org/2000/svg", "line");
            rightLead.setAttribute("x1", startX + stubWidth);
            rightLead.setAttribute("y1", 0);
            rightLead.setAttribute("x2", 75);
            rightLead.setAttribute("y2", 0);
            rightLead.setAttribute("stroke", "#555");
            rightLead.setAttribute("stroke-width", "8");
            batteryGroup.appendChild(rightLead);

            // The tip itself
            const tip = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            tip.setAttribute("x", startX);
            tip.setAttribute("y", -stubHeight / 2);
            tip.setAttribute("width", stubWidth);
            tip.setAttribute("height", stubHeight);
            tip.setAttribute("fill", "#C0C0C0");
            tip.setAttribute("stroke", "#666");
            tip.setAttribute("rx", stubRadius);
            batteryGroup.appendChild(tip);
            return;
        }

        // Sizing (full vs. minimal for interpolation)
        const fullCellWidth = 40;
        const minCellWidth = 12;
        const fullTerminalWidth = 6;
        const minTerminalWidth = 3;
        const cellHeight = 26;
        const terminalHeight = 10;
        const cellSpacing = 5;

        const numCells = Math.min(maxCells, Math.ceil(clampedVoltage / cellCapacity));

        // Build cells with per-cell interpolation (narrow -> wide)
        const cells = [];
        for (let i = 0; i < numCells; i++) {
            const fraction = Math.max(0, Math.min(1, (clampedVoltage - i * cellCapacity) / cellCapacity));
            const bodyWidth = minCellWidth + (fullCellWidth - minCellWidth) * fraction;
            const terminalWidth = minTerminalWidth + (fullTerminalWidth - minTerminalWidth) * fraction;
            const bandWidth = Math.min(bodyWidth, Math.max(3, bodyWidth * 0.2));
            cells.push({ bodyWidth, terminalWidth, bandWidth });
        }

        // Allow the pack to grow naturally beyond the wire gap
        const totalWidth = cells.reduce((sum, c) => sum + c.bodyWidth + c.terminalWidth, 0) + (numCells - 1) * cellSpacing;
        const startX = anchorX;

        // Leads connecting to the circuit wires
        const leftLead = document.createElementNS("http://www.w3.org/2000/svg", "line");
        leftLead.setAttribute("x1", -75);
        leftLead.setAttribute("y1", 0);
        leftLead.setAttribute("x2", startX);
        leftLead.setAttribute("y2", 0);
        leftLead.setAttribute("stroke", "#555");
        leftLead.setAttribute("stroke-width", "8");
        batteryGroup.appendChild(leftLead);

        const rightLead = document.createElementNS("http://www.w3.org/2000/svg", "line");
        rightLead.setAttribute("x1", startX + totalWidth);
        rightLead.setAttribute("y1", 0);
        rightLead.setAttribute("x2", 75);
        rightLead.setAttribute("y2", 0);
        rightLead.setAttribute("stroke", "#555");
        rightLead.setAttribute("stroke-width", "8");
        batteryGroup.appendChild(rightLead);

        // Draw each cell
        let currentX = startX;
        for (const cell of cells) {
            const bodyWidth = cell.bodyWidth;
            const terminalWidth = cell.terminalWidth;
            const bandWidth = cell.bandWidth;
            const scaledCellHeight = cellHeight;
            const scaledTerminalHeight = terminalHeight;
            const cornerRadius = 3;
            const bodyY = -scaledCellHeight / 2;

            const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
            g.setAttribute("transform", `translate(${currentX}, 0)`);

            // Battery body
            const body = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            body.setAttribute("x", 0);
            body.setAttribute("y", bodyY);
            body.setAttribute("width", bodyWidth);
            body.setAttribute("height", scaledCellHeight);
            body.setAttribute("fill", "#444");
            body.setAttribute("stroke", "none");
            body.setAttribute("rx", cornerRadius);
            g.appendChild(body);

            // Orange band at positive end
            const band = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            band.setAttribute("x", bodyWidth - bandWidth);
            band.setAttribute("y", bodyY);
            band.setAttribute("width", bandWidth);
            band.setAttribute("height", scaledCellHeight);
            band.setAttribute("fill", "#FFA500");
            g.appendChild(band);

            // Body border
            const border = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            border.setAttribute("x", 0);
            border.setAttribute("y", bodyY);
            border.setAttribute("width", bodyWidth);
            border.setAttribute("height", scaledCellHeight);
            border.setAttribute("fill", "none");
            border.setAttribute("stroke", "#222");
            border.setAttribute("stroke-width", 1);
            border.setAttribute("rx", cornerRadius);
            g.appendChild(border);

            // Positive terminal
            const terminal = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            terminal.setAttribute("x", bodyWidth);
            terminal.setAttribute("y", -scaledTerminalHeight / 2);
            terminal.setAttribute("width", terminalWidth);
            terminal.setAttribute("height", scaledTerminalHeight);
            terminal.setAttribute("fill", "#C0C0C0");
            terminal.setAttribute("stroke", "#666");
            terminal.setAttribute("rx", 2);
            g.appendChild(terminal);

            batteryGroup.appendChild(g);
            currentX += bodyWidth + terminalWidth + cellSpacing;
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
            // Random position within the resistor rect 
            // Rect is width 150, height 40, centered at 0,0 locally?
            // index.html: <rect x="-75" y="-20" width="150" height="40" ... />
            const x = (Math.random() * 140) - 70; // -70 to 70
            const y = (Math.random() * 30) - 15;  // -15 to 15

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
        // Always recreate or update path because layout changed
        if (!motionPath) {
            motionPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
            motionPath.setAttribute("id", "motion-path");
            motionPath.setAttribute("fill", "none");
            motionPath.setAttribute("stroke", "none");
            const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
            defs.appendChild(motionPath);
            document.getElementById('circuit-svg').prepend(defs);
        }

        // Path: Clockwise flow?
        // Battery pushes + charge from + terminal.
        // Our batteries are Left(-) to Right(+).
        // So Electron flow (physical) is - to +. (Left to Right through battery? No, out of - into +?)
        // Conventional current is + to -. (Out of Right, through circuit, into Left).
        // PhET usually shows Conventional Current by default or Electron Flow.
        // Let's stick to Conventional Current (Red Arrows): Out of Battery(+) -> Wire -> Resistor -> Battery(-)
        // Battery + is on Right.
        // Path: (375, 350) -> (550, 350) -> (550, 50) -> (50, 50) -> (50, 350) -> (225, 350)
        // Wait, Resistor is at Top.
        // Start from Battery + (Right side of bottom group ~ 375, 350).
        // Right to corner (550, 350)
        // Up to corner (550, 50)
        // Left through Resistor to corner (50, 50)
        // Down to corner (50, 350)
        // Right to Battery - (225, 350)
        // Through battery to Start?

        const d = "M 375 350 L 550 350 L 550 50 L 50 50 L 50 350 L 225 350 L 375 350";
        motionPath.setAttribute("d", d);

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

    // --- Custom Slider Logic ---
    function setupSlider(containerId, thumbId, min, max, initialValue, step, callback) {
        const container = document.getElementById(containerId);
        const thumb = document.getElementById(thumbId);
        let value = initialValue;

        // Visual update function
        function updateSliderAndValue(newValue) {
            // Clamp
            if (newValue < min) newValue = min;
            if (newValue > max) newValue = max;

            // Snap to step
            if (step) {
                newValue = Math.round((newValue - min) / step) * step + min;
            }

            // Re-clamp after snapping
            if (newValue < min) newValue = min;
            if (newValue > max) newValue = max;

            value = newValue;

            // Update visuals
            const percent = (value - min) / (max - min);
            // Height of container minus height of thumb is drag range
            // But we can simplify: 0% is bottom, 100% is top.
            // Thumb is positioned with `bottom: X%`
            // We need to account for thumb height slightly so it doesn't go out of bounds?
            // Actually standard approach: 
            // bottom: calc(percent% - thumbHeight/2)
            // Or simpler: just percent.
            thumb.style.bottom = `${percent * 100}%`;
            // Add a slight transform translate to center it on the point
            // thumb.style.transform = `translate(-50%, 50%)`; // Already handled in CSS `translate(-50%)` for X. Y needs adjustment?
            // CSS has:
            // .slider-thumb {
            //      transform: translateX(-50%);
            //      position: absolute; left: 50%;
            // }
            // So if we set bottom: 0%, the bottom of thumb is at bottom of track.
            // if we set bottom: 100%, button of thumb is at top of track.
            // To center the thumb on the value:
            // bottom: calc(percent * 100% - 10px); // Assuming 20px height
            thumb.style.bottom = `calc(${percent * 100}% - 10px)`;

            callback(value);
        }

        // Mouse/Touch Handling
        function handleDrag(clientY) {
            const rect = container.getBoundingClientRect();
            // 0 at bottom, Height at top
            // clientY grows downwards.
            // dist from bottom = rect.bottom - clientY
            let dist = rect.bottom - clientY;
            let percent = dist / rect.height;

            // Clamp visual logic handled in updateSliderAndValue check?
            // No, we want raw percent here.

            let newValue = min + percent * (max - min);
            updateSliderAndValue(newValue);
        }

        function startDrag(e) {
            e.preventDefault();
            const getClientY = (evt) => evt.touches ? evt.touches[0].clientY : evt.clientY;

            handleDrag(getClientY(e)); // Initial jump to click position

            function onMove(evt) {
                handleDrag(getClientY(evt));
            }

            function onEnd() {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onEnd);
                document.removeEventListener('touchmove', onMove);
                document.removeEventListener('touchend', onEnd);
            }

            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onEnd);
            document.addEventListener('touchmove', onMove, { passive: false });
            document.addEventListener('touchend', onEnd);
        }

        container.addEventListener('mousedown', startDrag);
        container.addEventListener('touchstart', startDrag, { passive: false });

        // Initial setup
        updateSliderAndValue(initialValue);
    }

    // Setup Sliders
    setupSlider('voltage-slider-container', 'voltage-slider-thumb', 0.0, 9.0, 4.5, 0.1, (val) => {
        voltage = val;
        updateCalculation();
    });

    setupSlider('resistance-slider-container', 'resistance-slider-thumb', 10, 1000, 500, 1, (val) => {
        resistance = val;
        updateCalculation();
    });

    // Initial Circuit Update
    updateCalculation(); // This was the fix!
});
