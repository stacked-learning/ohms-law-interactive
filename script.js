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
    const circuitSvg = document.getElementById('circuit-svg');

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
    let lastRenderedResistance = null;

    function ensureBatteryGradients() {
        if (!circuitSvg) return;
        let defs = document.getElementById('battery-gradients');
        if (!defs) {
            defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
            defs.setAttribute("id", "battery-gradients");
            circuitSvg.insertBefore(defs, circuitSvg.firstChild);
        }

        const addLinearGradient = (id, stops, orientation = 'vertical') => {
            let grad = document.getElementById(id);
            if (!grad) {
                grad = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
                grad.setAttribute("id", id);
                defs.appendChild(grad);
            }
            if (orientation === 'horizontal') {
                grad.setAttribute("x1", "0%");
                grad.setAttribute("y1", "0%");
                grad.setAttribute("x2", "100%");
                grad.setAttribute("y2", "0%");
            } else {
                grad.setAttribute("x1", "0%");
                grad.setAttribute("y1", "0%");
                grad.setAttribute("x2", "0%");
                grad.setAttribute("y2", "100%");
            }
            // Clear existing stops before re-adding
            while (grad.firstChild) grad.removeChild(grad.firstChild);
            stops.forEach(({ offset, color }) => {
                const stop = document.createElementNS("http://www.w3.org/2000/svg", "stop");
                stop.setAttribute("offset", offset);
                stop.setAttribute("stop-color", color);
                grad.appendChild(stop);
            });
        };

        const addRadialGradient = (id, stops) => {
            let grad = document.getElementById(id);
            if (!grad) {
                grad = document.createElementNS("http://www.w3.org/2000/svg", "radialGradient");
                grad.setAttribute("id", id);
                defs.appendChild(grad);
            }
            grad.setAttribute("cx", "50%");
            grad.setAttribute("cy", "50%");
            grad.setAttribute("r", "65%");
            while (grad.firstChild) grad.removeChild(grad.firstChild);
            stops.forEach(({ offset, color }) => {
                const stop = document.createElementNS("http://www.w3.org/2000/svg", "stop");
                stop.setAttribute("offset", offset);
                stop.setAttribute("stop-color", color);
                grad.appendChild(stop);
            });
        };

        addLinearGradient("battery-body-grad", [
            { offset: "0%", color: "#1a1a1a" },
            { offset: "22%", color: "#777" },
            { offset: "38%", color: "#c0c0c0" },
            { offset: "58%", color: "#565656" },
            { offset: "100%", color: "#141414" }
        ]);

        addLinearGradient("battery-terminal-grad", [
            { offset: "0%", color: "#7a7a7a" },
            { offset: "25%", color: "#e6e6e6" },
            { offset: "42%", color: "#ffffff" },
            { offset: "60%", color: "#c2c2c2" },
            { offset: "100%", color: "#7a7a7a" }
        ]);

        addLinearGradient("battery-band-grad", [
            { offset: "0%", color: "#8c3e00" },
            { offset: "25%", color: "#ffb347" },
            { offset: "45%", color: "#ffd08a" },
            { offset: "100%", color: "#8c3e00" }
        ]);

        addLinearGradient("resistor-body-grad", [
            { offset: "0%", color: "#8b0000" },
            { offset: "25%", color: "#ff7f7f" },
            { offset: "50%", color: "#ffffff" },
            { offset: "75%", color: "#ff7f7f" },
            { offset: "100%", color: "#8b0000" }
        ], 'horizontal');

        addRadialGradient("resistor-cap-grad", [
            { offset: "0%", color: "#ffffff" },
            { offset: "45%", color: "#ffb3b3" },
            { offset: "75%", color: "#d40000" },
            { offset: "100%", color: "#4a0000" }
        ]);
    }

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
        currentDisplay.textContent = `${currentMA.toFixed(1)}`;

        updateVisuals();
    }

    function updateVisuals() {
        updateEquationSizes();
        updateBattery();
        if (lastRenderedResistance !== resistance) {
            updateResistor();
            lastRenderedResistance = resistance;
        }
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
        ensureBatteryGradients();

        // Clamp voltage and map to cells (1.5V per cell, max 6)
        const maxVoltage = 9;
        const clampedVoltage = Math.max(0, Math.min(maxVoltage, voltage));
        const cellCapacity = 1.5;
        const maxCells = 6;
        // Anchor point so the first cell stays put; pack grows to the right (slightly more left)
        const anchorBase = -170;

        if (clampedVoltage <= 0) {
            // Show only a tiny battery tip to indicate location
            const stubWidth = 16;
            const stubHeight = 20;
            const stubRadius = 3;
            const startX = anchorBase;

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
            tip.setAttribute("fill", "url(#battery-terminal-grad)");
            tip.setAttribute("stroke", "#666");
            tip.setAttribute("rx", stubRadius);
            batteryGroup.appendChild(tip);
            return;
        }

        // Sizing (full vs. minimal for interpolation)
        const fullCellWidth = 52;
        const minCellWidth = 18;
        const fullTerminalWidth = 8;
        const minTerminalWidth = 4;
        const cellHeight = 32;
        const terminalHeight = 14;
        const cellSpacing = 7;

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
        const startX = anchorBase; // keep anchor fixed to avoid drifting when expanding

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
        for (let idx = 0; idx < cells.length; idx++) {
            const cell = cells[idx];
            const bodyWidth = cell.bodyWidth;
            const terminalWidth = cell.terminalWidth;
            const bandWidth = cell.bandWidth;
            const scaledCellHeight = cellHeight;
            const scaledTerminalHeight = terminalHeight;
            const cornerRadius = 3;
            const bodyY = -scaledCellHeight / 2;
            const cellVoltage = Math.min(cellCapacity, Math.max(0, clampedVoltage - (idx * cellCapacity)));

            const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
            g.setAttribute("transform", `translate(${currentX}, 0)`);

            // Battery body
            const body = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            body.setAttribute("x", 0);
            body.setAttribute("y", bodyY);
            body.setAttribute("width", bodyWidth);
            body.setAttribute("height", scaledCellHeight);
            body.setAttribute("fill", "url(#battery-body-grad)");
            body.setAttribute("stroke", "none");
            body.setAttribute("rx", cornerRadius);
            g.appendChild(body);

            // Orange band at positive end
            const band = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            band.setAttribute("x", bodyWidth - bandWidth);
            band.setAttribute("y", bodyY);
            band.setAttribute("width", bandWidth);
            band.setAttribute("height", scaledCellHeight);
            band.setAttribute("fill", "url(#battery-band-grad)");
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
            terminal.setAttribute("fill", "url(#battery-terminal-grad)");
            terminal.setAttribute("stroke", "#666");
            terminal.setAttribute("rx", 2);
            g.appendChild(terminal);

            // Per-cell voltage label
            const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
            label.setAttribute("x", bodyWidth / 2);
            label.setAttribute("y", bodyY - 8);
            label.setAttribute("text-anchor", "middle");
            label.setAttribute("fill", "#fff");
            label.setAttribute("stroke", "#000");
            label.setAttribute("stroke-width", "0.6");
            label.setAttribute("font-family", "'Barlow', sans-serif");
            label.setAttribute("font-size", "14");
            label.setAttribute("font-weight", "800");
            label.textContent = `${cellVoltage.toFixed(1)}V`;
            g.appendChild(label);

            batteryGroup.appendChild(g);
            currentX += bodyWidth + terminalWidth + cellSpacing;
        }
    }

    function updateResistor() {
        ensureBatteryGradients();
        // Clear existing dots
        // We want to keep the rect, so maybe just clear a group inside resistor-group?
        // Actually, let's just rebuild the dots.
        // Remove all circle elements
        const existingDots = resistorGroup.querySelectorAll('circle');
        existingDots.forEach(dot => dot.remove());

        // Style the base resistor body to look like a glossy red cylinder
        const bodyRect = resistorGroup.querySelector('rect');
        if (bodyRect) {
            bodyRect.setAttribute('fill', 'url(#resistor-body-grad)');
            bodyRect.setAttribute('stroke', '#2a0000');
            bodyRect.setAttribute('stroke-width', '2');
            bodyRect.setAttribute('rx', '20');
            bodyRect.setAttribute('ry', '20');
        }

        // Flat capsule look: no protruding end caps, just a rounded pill shape
        resistorGroup.querySelectorAll('ellipse.resistor-cap').forEach(el => el.remove());

        // Number of dots proportional to resistance
        // 10 ohms -> few dots
        // 1000 ohms -> many dots (e.g. 100)
        const numDots = Math.floor(resistance / 25);

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
            dot.setAttribute("fill", "#2a0000");
            dot.classList.add("resistor-dot");
            resistorGroup.appendChild(dot);
        }
    }

    function updateCurrentArrows() {
        // Path: conventional current (positive to negative) flowing counterclockwise around the loop
        // Starts at battery + (right side), goes left across bottom, up left, across resistor, down right, back to start.
        const d = "M 375 350 L 225 350 L 50 350 L 50 50 L 550 50 L 550 350 L 375 350";

        // Clear existing arrows
        currentArrowsGroup.innerHTML = '';

        // If current is very small, no arrows
        if (current < 0.001) return;

        // Fixed arrow count with speed tightly coupled to current magnitude
        const numArrows = 28;

        // Map current to duration with a predictable scale:
        // duration = (maxCurrent / current) * minDur, clamped to [minDur, maxDur]
        const maxExpectedCurrent = 0.9; // ~9V / 10Ω
        const minDur = 0.8;
        const maxDur = 20;
        const safeCurrent = Math.max(current, 1e-6);
        let duration = (maxExpectedCurrent / safeCurrent) * minDur;
        if (duration < minDur) duration = minDur;
        if (duration > maxDur) duration = maxDur;

        for (let i = 0; i < numArrows; i++) {
            const arrowGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

            // Arrow shape (triangle)
            const arrow = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            arrow.setAttribute("points", "-7,-4 7,0 -7,4"); // Pointing right
            arrow.setAttribute("fill", "red");
            arrow.setAttribute("stroke", "none");
            arrow.classList.add("current-arrow");
            arrowGroup.appendChild(arrow);

            // Animate motion directly via path attribute (avoids mpath compatibility issues)
            const animate = document.createElementNS("http://www.w3.org/2000/svg", "animateMotion");
            animate.setAttribute("path", d);
            animate.setAttribute("dur", `${duration}s`);
            animate.setAttribute("repeatCount", "indefinite");
            animate.setAttribute("rotate", "auto");

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
