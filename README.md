# Ohm's Law Simulation

A web-based interactive simulation of Ohm's Law (V = IR), recreated from the [PhET Interactive Simulations](https://phet.colorado.edu/sims/html/ohms-law/latest/ohms-law_all.html) project.

## Overview

This project visualizes the relationship between Voltage (V), Current (I), and Resistance (R). Users can adjust the voltage and resistance sliders to see how they affect the current flow and the visual representation of the equation.

## Features

-   **Interactive Controls**:
    -   **Voltage Slider**: Adjust voltage from 0.1V to 9.0V.
    -   **Resistance Slider**: Adjust resistance from 10Ω to 1000Ω.
-   **Dynamic Visuals**:
    -   **Equation Scaling**: The font sizes of 'V', 'I', and 'R' change dynamically based on their values.
    -   **Circuit Animation**: Current flow is visualized with animated arrows that change speed based on the current magnitude.
    -   **Battery & Resistor**: The number of battery cells and resistor density update visually.
-   **Real-time Calculation**: Displays the calculated current in milliamperes (mA).

## How to Run

Simply open the `index.html` file in any modern web browser.

```bash
# If you have python installed, you can run a simple server
python3 -m http.server
# Then open http://localhost:8000
```

## Technologies

-   HTML5
-   CSS3
-   JavaScript (Vanilla)
-   SVG (for circuit visualization)

## License

This project is for educational purposes. The original concept and design belong to PhET Interactive Simulations, University of Colorado Boulder.
