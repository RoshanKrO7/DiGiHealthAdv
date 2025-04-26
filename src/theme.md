# DigiHealth Global Theme System

This document explains how to use the global theme variables in your component styling.

## Overview

The DigiHealth project now uses a centralized theming system defined in `styles.css`. This approach allows for:

1. Consistent colors across all components
2. Easy theme customization in one place
3. Automatic dark mode support
4. Component-specific styling without conflicts

## How to Use Theme Variables

In your component CSS files, you can use the theme variables like this:

```css
.my-component {
  background-color: var(--card-bg);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.my-component-button {
  background-color: var(--primary);
  color: white;
}

.my-component-alert {
  background-color: var(--danger);
  color: white;
}
```

## Available Variables

### Colors

- `--primary`: Main brand color (#4361ee)
- `--primary-light`: Lighter version of primary
- `--primary-dark`: Darker version of primary
- `--secondary`: Secondary brand color (#2ecc71)
- `--secondary-light`: Lighter version of secondary
- `--secondary-dark`: Darker version of secondary

### Accent Colors
- `--accent-teal`: For information/help
- `--accent-orange`: For warnings/caution
- `--accent-red`: For errors/danger
- `--accent-yellow`: For highlights/attention

### UI Colors
- `--background`: Page background
- `--card-bg`: Card/container background
- `--card-shadow`: Shadow for elevated elements
- `--text-primary`: Main text color
- `--text-secondary`: Secondary text (subtitles, descriptions)
- `--text-muted`: Muted text (placeholders, disabled)
- `--border-color`: Standard border color

### Status Colors
- `--success`: Success state (#2ecc71)
- `--warning`: Warning state (#f39c12)
- `--danger`: Error/danger state (#e74c3c)
- `--info`: Information state (#3498db)

### Gradients & Effects
- `--primary-gradient`: Gradient using primary colors
- `--secondary-gradient`: Gradient using secondary colors
- `--glass-bg`: Glass effect background
- `--glass-border`: Glass effect border
- `--glass-shadow`: Glass effect shadow

## Dark Mode Support

Dark mode is automatically supported through media queries. The theme variables will automatically change value when the user's system is in dark mode.

## Creating Component-Specific CSS

When creating CSS for a specific component:

1. Create a CSS file with the same name as your component
2. Use the global theme variables for colors and styling
3. Define layout, spacing, and structural styles specific to your component
4. Import your CSS file in your component file

Example:
```jsx
// MyComponent.jsx
import React from 'react';
import './MyComponent.css';

const MyComponent = () => {
  return <div className="my-component">...</div>;
};
```

```css
/* MyComponent.css */
.my-component {
  /* Use theme variables for colors */
  background-color: var(--card-bg);
  color: var(--text-primary);
  
  /* Component-specific layout/structure */
  padding: 20px;
  border-radius: 8px;
  display: flex;
  gap: 10px;
}
```

## Best Practices

1. Always use theme variables for colors
2. Don't override global styles in component CSS
3. Keep layout/structural styles separate from theme/color styles
4. Test your component in both light and dark mode 