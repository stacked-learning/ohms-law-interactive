# Customization Guide

This guide explains how to modify the appearance and behavior of the Ohm's Law simulation.

## Files Overview

-   **`index.html`**: Contains the structure of the page, including the equation display, the SVG circuit diagram, and the sliders.
-   **`style.css`**: Controls the colors, fonts, layout, and spacing.
-   **`script.js`**: Handles the logic (Ohm's Law calculation), updates the visuals (battery, resistor, current arrows), and manages the dynamic font scaling.

## Common Customizations

### 1. Changing Colors

Open `style.css` and look for the `:root` section at the top. You can change the variable values to update the color scheme globally.

```css
:root {
    --color-voltage: #5c5cff; /* Change Voltage color */
    --color-current: #ff3333; /* Change Current color */
    --color-resistance: #000000; /* Change Resistance color */
    --bg-color: #ffffee; /* Change Background color */
}
```

### 2. Changing Fonts

In `style.css`, find the `body` selector and update the `font-family`.

```css
body {
    font-family: 'Helvetica Neue', sans-serif; /* Example change */
    /* ... */
}
```

### 3. Adjusting Slider Ranges

Open `index.html` and find the `<input type="range">` elements. You can change the `min`, `max`, and `step` attributes.

```html
<!-- Example: Change Voltage max to 12V -->
<input type="range" id="voltage-slider" min="0.1" max="12.0" step="0.1" value="4.5" orient="vertical">
```

**Note**: If you change the ranges significantly, you might need to update the scaling logic in `script.js` (see below).

### 4. Modifying Visual Scaling

If you want to change how much the letters grow or shrink, or how the battery/resistor visuals update, open `script.js`.

-   **Font Scaling**: Look for `updateEquationSizes()`. You can adjust `MIN_FONT_SIZE` and `MAX_FONT_SIZE` constants or the scaling formulas.
-   **Battery Cells**: Look for `updateBattery()`. The number of cells is calculated by `Math.ceil(voltage / 1.5)`. Change `1.5` to a different value to change when new cells appear.
-   **Current Animation**: Look for `updateCurrentArrows()`. You can adjust the `duration` calculation to make arrows move faster or slower.

### 5. Editing the Circuit Diagram

The circuit is drawn using SVG in `index.html`.
-   **Wires**: Defined by `<path>` elements. You can change the `d` attribute to redraw the paths.
-   **Components**: The Battery and Resistor are inside `<g>` (group) elements. You can move them by changing the `transform="translate(x, y)"` attribute.

## Example: Dark Mode

To create a dark mode, you could update `style.css`:

```css
:root {
    --bg-color: #222;
    --color-resistance: #fff; /* White text for dark bg */
}
/* You might need to update stroke colors in SVG too */
```
