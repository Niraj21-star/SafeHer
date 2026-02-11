# SafeHer Design System - Quick Reference Card

## 🎨 CSS Variables Quick Lookup

### Colors
```css
--primary: #9333EA      /* Purple - main brand */
--primary-dark: #7E22CE /* Dark purple - hover states */
--secondary: #D4D4D8    /* Light gray - secondary actions */
--danger: #EF4444       /* Red - danger/emergency */
--accent: #10B981       /* Green - success states */
--background: #FFFFFF   /* White - page background */
--surface: #F9FAFB      /* Light gray - card backgrounds */
--text-primary: #111827 /* Almost black - main text */
--text-secondary: #6B7280 /* Medium gray - secondary text */
--border: #E5E7EB       /* Light gray - borders */
```

### Spacing (8px rhythm)
```css
var(--space-xs)   → 8px
var(--space-sm)   → 12px
var(--space-md)   → 16px
var(--space-lg)   → 24px
var(--space-xl)   → 32px
var(--space-2xl)  → 48px
```

### Typography
```css
var(--text-xs)    → 12-14px (responsive)
var(--text-sm)    → 14-16px (responsive)
var(--text-base)  → 16-18px (responsive)
var(--text-lg)    → 18-20px (responsive)
var(--text-xl)    → 20-24px (responsive)
var(--text-2xl)   → 24-32px (responsive)
var(--text-3xl)   → 32-48px (responsive)
```

### Shadows
```css
var(--shadow-sm)  → Subtle (buttons on hover)
var(--shadow-md)  → Medium (cards)
var(--shadow-lg)  → Large (SOS button, dropdowns)
var(--shadow-xl)  → Extra large (modals)
```

### Z-Index
```css
var(--z-base)           → 1    (base content)
var(--z-dropdown)       → 100  (dropdowns)
var(--z-sticky)         → 200  (sticky headers)
var(--z-fixed)          → 300  (bottom nav)
var(--z-modal-backdrop) → 400  (modal backdrop)
var(--z-modal)          → 500  (modal content)
var(--z-popover)        → 600  (popovers)
var(--z-tooltip)        → 700  (tooltips)
```

### Border Radius
```css
--radius-sm:  4px  (small elements)
--radius-md:  8px  (buttons)
--radius-lg:  12px (cards, modals)
```

---

## 📱 Responsive Breakpoints

```css
/* Base (360px+)    → Small Android */
@media (min-width: 480px)  { /* Mobile */ }
@media (min-width: 640px)  { /* Large mobile */ }
@media (min-width: 768px)  { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
@media (min-width: 1280px) { /* Large desktop */ }
@media (min-width: 1440px) { /* Wide desktop */ }
```

---

## 🧱 Component Classes

### Buttons
```html
<!-- Default button (48px height) -->
<button class="btn btn-primary">Click Me</button>

<!-- Button variants -->
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-danger">Danger</button>
<button class="btn btn-accent">Success</button>

<!-- Button sizes -->
<button class="btn btn-primary btn-sm">Small (40px)</button>
<button class="btn btn-primary">Default (48px)</button>
<button class="btn btn-primary btn-lg">Large (56px)</button>
<button class="btn btn-primary btn-full">Full Width</button>

<!-- Loading state -->
<button class="btn btn-primary loading" disabled>Processing...</button>
```

### Cards
```html
<!-- Basic card -->
<div class="card">
  <h3>Card Title</h3>
  <p>Card content goes here.</p>
</div>

<!-- Hoverable card (desktop) -->
<div class="card card-hover">
  <h3>Hoverable Card</h3>
</div>
```

### Forms
```html
<!-- Input field -->
<div class="form-group">
  <label class="label">Email Address</label>
  <input type="email" class="input" placeholder="you@example.com" />
</div>

<!-- Input with error -->
<div class="form-group">
  <label class="label">Password</label>
  <input type="password" class="input input-error" />
  <span class="error">Password is required</span>
</div>
```

### Badges
```html
<span class="badge badge-success">Active</span>
<span class="badge badge-danger">Emergency</span>
<span class="badge badge-warning">Pending</span>
<span class="badge badge-info">Info</span>
```

---

## 📐 Layout Utilities

### Container
```html
<!-- Responsive container (max-width 1200px on desktop) -->
<div class="container">
  <!-- Content here -->
</div>

<!-- Page wrapper with bottom nav padding -->
<div class="page-container">
  <!-- Page content here -->
</div>
```

### Grid System
```html
<!-- Mobile: 1 col, Tablet: 2 cols, Desktop: 3 cols -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
  <div class="card">Item 1</div>
  <div class="card">Item 2</div>
  <div class="card">Item 3</div>
</div>
```

### Flexbox
```html
<!-- Flex container -->
<div class="flex items-center justify-between gap-md">
  <div>Left content</div>
  <div>Right content</div>
</div>

<!-- Flex column -->
<div class="flex flex-col gap-sm">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

### Spacing Utilities
```html
<!-- Margin -->
<div class="m-md">  Margin all sides (16px)
<div class="mt-lg"> Margin top (24px)
<div class="mb-sm"> Margin bottom (12px)
<div class="mx-xl"> Margin horizontal (32px left+right)
<div class="my-md"> Margin vertical (16px top+bottom)

<!-- Padding -->
<div class="p-md">  Padding all sides (16px)
<div class="pt-lg"> Padding top (24px)
<div class="pb-sm"> Padding bottom (12px)
<div class="px-xl"> Padding horizontal (32px left+right)
<div class="py-md"> Padding vertical (16px top+bottom)
```

---

## 🎯 Common Patterns

### Full-Width Button (Mobile)
```html
<button class="btn btn-primary btn-full">
  Continue
</button>
```

### 2-Column Form (Desktop)
```html
<div class="grid grid-cols-1 md:grid-cols-2 gap-md">
  <div class="form-group">
    <label class="label">First Name</label>
    <input type="text" class="input" />
  </div>
  <div class="form-group">
    <label class="label">Last Name</label>
    <input type="text" class="input" />
  </div>
</div>
```

### Card Grid
```html
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
  <div class="card card-hover">Card 1</div>
  <div class="card card-hover">Card 2</div>
  <div class="card card-hover">Card 3</div>
</div>
```

### Modal Structure
```html
<div class="modal-backdrop">
  <div class="modal-content">
    <h2>Modal Title</h2>
    <p>Modal content goes here.</p>
    <div class="flex gap-md mt-lg">
      <button class="btn btn-secondary btn-full">Cancel</button>
      <button class="btn btn-primary btn-full">Confirm</button>
    </div>
  </div>
</div>
```

---

## 🎨 Design Rules

### Touch Targets
```
Minimum:  44px × 44px (Apple/Android guidelines)
Small:    40px (use sparingly, secondary actions)
Default:  48px (most interactions)
Large:    56px (primary CTAs)
```

### Spacing Rules
```
Component spacing:  16px gap
Section spacing:    24-32px gap
Page padding:       16px mobile, 24px tablet, 32px desktop
Card padding:       12px mobile, 16px tablet, 20px desktop
```

### Typography Rules
```
Body text:      16px minimum (18px comfortable)
Input text:     16px (prevents iOS zoom)
Small text:     14px minimum
Headings:       Use h1-h6 with proper hierarchy
Line height:    1.6 for readability
```

### Color Contrast (WCAG AA)
```
Text on white:  4.5:1 ratio minimum
Large text:     3:1 ratio minimum
Interactive:    3:1 for focus/hover states
```

---

## ⚡ Performance Tips

### Use GPU-Accelerated Properties
```css
/* ✅ Good (GPU-accelerated) */
transform: translateY(-2px);
opacity: 0.8;

/* ❌ Avoid (causes repaint) */
margin-top: 10px;
background-color: red;
```

### Prefer CSS Variables
```css
/* ✅ Good */
color: var(--primary);
padding: var(--space-md);

/* ❌ Avoid */
color: #9333EA;
padding: 16px;
```

### Use Appropriate Selectors
```css
/* ✅ Good (flat, single class) */
.btn-primary { }

/* ❌ Avoid (high specificity) */
div.container > button.btn.btn-primary { }
```

---

## ♿ Accessibility Checklist

### Focus Indicators
```css
/* All interactive elements should have visible focus */
.btn:focus-visible {
  outline: 3px solid var(--primary);
  outline-offset: 2px;
}
```

### Color Contrast
```
Check: Text on background meets 4.5:1 ratio
Tool: WCAG Color Contrast Checker
```

### Touch Targets
```
Check: All interactive elements ≥ 44px × 44px
Buttons, links, inputs, form controls
```

### Keyboard Navigation
```
Tab:    Move focus forward
Shift+Tab: Move focus backward
Enter:  Activate button/link
Escape: Close modal/dropdown
```

### Screen Reader Support
```html
<!-- Label all inputs -->
<label for="email">Email Address</label>
<input id="email" type="email" />

<!-- Descriptive buttons -->
<button>Submit Form</button> <!-- Not "Click Here" -->

<!-- Alt text for images -->
<img src="logo.png" alt="SafeHer logo" />
```

---

## 📏 Measurement Reference

### Spacing Scale
```
xs  = 0.5rem = 8px   (icon-text gap)
sm  = 0.75rem = 12px  (card padding mobile)
md  = 1rem = 16px     (default gap)
lg  = 1.5rem = 24px   (section spacing)
xl  = 2rem = 32px     (large spacing)
2xl = 3rem = 48px     (page sections)
```

### Font Sizes (Responsive with clamp)
```
xs   = 12-14px  (fine print)
sm   = 14-16px  (small text)
base = 16-18px  (body text)
lg   = 18-20px  (large text)
xl   = 20-24px  (subheadings)
2xl  = 24-32px  (headings)
3xl  = 32-48px  (hero text)
```

---

## 🚀 Quick Start Examples

### Building a Simple Page
```html
<div class="page-container">
  <div class="container">
    <h1>Page Title</h1>
    
    <div class="card">
      <h2>Section Title</h2>
      <p>Section content here.</p>
      
      <button class="btn btn-primary btn-full mt-md">
        Take Action
      </button>
    </div>
  </div>
</div>

<!-- Bottom Navigation -->
<nav class="nav-bottom">
  <!-- Nav items here -->
</nav>
```

### Building a Form
```html
<form class="card">
  <h2 class="mb-lg">Contact Information</h2>
  
  <div class="form-group">
    <label class="label" for="name">Name</label>
    <input id="name" type="text" class="input" required />
  </div>
  
  <div class="form-group">
    <label class="label" for="email">Email</label>
    <input id="email" type="email" class="input" required />
  </div>
  
  <button type="submit" class="btn btn-primary btn-full mt-lg">
    Submit
  </button>
</form>
```

### Building a Card Grid
```html
<div class="container">
  <h1 class="mb-lg">Recent Activity</h1>
  
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
    <div class="card card-hover">
      <h3>Activity 1</h3>
      <p class="text-secondary">Description here</p>
      <span class="badge badge-success mt-sm">Active</span>
    </div>
    
    <div class="card card-hover">
      <h3>Activity 2</h3>
      <p class="text-secondary">Description here</p>
      <span class="badge badge-info mt-sm">Pending</span>
    </div>
    
    <div class="card card-hover">
      <h3>Activity 3</h3>
      <p class="text-secondary">Description here</p>
      <span class="badge badge-danger mt-sm">Emergency</span>
    </div>
  </div>
</div>
```

---

**Need more info?** See [RESPONSIVE_DESIGN_SYSTEM.md](RESPONSIVE_DESIGN_SYSTEM.md) for comprehensive documentation.

**Last Updated**: January 2025  
**Quick Reference**: Print this card for daily development!
