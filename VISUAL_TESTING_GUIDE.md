# SafeHer MVP - Visual Testing Guide

## 🎯 Purpose
Quick reference for testing the responsive design system across all devices and viewports.

## 📱 Device Testing Matrix

### Mobile Devices (Portrait)

#### iPhone SE (375px × 667px)
**Browser**: Safari iOS 14+
- [ ] No horizontal scrolling
- [ ] SOS button centered (280px × 160px)
- [ ] Bottom nav visible (70px + safe area)
- [ ] All buttons 44px+ height
- [ ] Text readable (no zoom required)
- [ ] Cards full-width with 16px padding
- [ ] Modals full-width, slide from bottom
- [ ] Map 300px height, controls accessible

#### iPhone 12/13/14 (390px × 844px)
**Browser**: Safari iOS 14+
- [ ] Safe area insets working (notch)
- [ ] Bottom nav doesn't overlap content
- [ ] SOS button thumb-reachable
- [ ] Input focus doesn't zoom (16px font)
- [ ] Smooth scrolling on touch
- [ ] Tap highlights removed
- [ ] All interactions responsive

#### iPhone 12/13/14 Plus (428px × 926px)
**Browser**: Safari iOS 14+
- [ ] Larger text scales properly with clamp()
- [ ] SOS button still centered
- [ ] Cards maintain proper spacing
- [ ] Map controls don't overlap
- [ ] Navigation items evenly spaced

#### Android Small (360px × 640px)
**Browser**: Chrome Android 90+
- [ ] Tighter spacing (14px instead of 16px)
- [ ] Smaller headings fit screen
- [ ] Cards 12px padding
- [ ] All touch targets 44px+
- [ ] No content cutoff
- [ ] Status bar color correct

#### Android Medium (393px × 851px - Pixel 5)
**Browser**: Chrome Android 90+
- [ ] Base responsive styles working
- [ ] 16px padding restored
- [ ] SOS button 280px width
- [ ] Map 300px height
- [ ] Forms full-width

#### Android Large (412px × 915px - Samsung S21)
**Browser**: Samsung Internet 14+
- [ ] Samsung-specific CSS working
- [ ] Touch targets comfortable
- [ ] Animations smooth (60fps)
- [ ] Text rendering crisp

### Mobile Devices (Landscape)

#### iPhone Landscape (667px × 375px)
**Browser**: Safari iOS
- [ ] SOS button reduced height (140px)
- [ ] Modal max-height 80vh (fits screen)
- [ ] Content doesn't overflow
- [ ] Bottom nav still visible
- [ ] Map controls accessible

#### Android Landscape (915px × 412px)
**Browser**: Chrome Android
- [ ] Layout switches to landscape mode
- [ ] Compact spacing applied
- [ ] SOS button adjusted
- [ ] No content cutoff

### Tablet Devices

#### iPad Mini (768px × 1024px)
**Browser**: Safari iPadOS
- [ ] 2-column grid layouts working
- [ ] Cards display side-by-side
- [ ] Modal centered (600px max-width)
- [ ] 24px padding comfortable
- [ ] Map 400px height
- [ ] Touch targets still 44px+ (hybrid device)

#### iPad (820px × 1180px)
**Browser**: Safari iPadOS
- [ ] Same as iPad Mini verification
- [ ] Adequate white space
- [ ] Not stretched mobile layout

#### iPad Pro 11" (834px × 1194px)
**Browser**: Safari iPadOS
- [ ] Desktop-like layout beginning
- [ ] 2-column grids functional
- [ ] Hover effects work (Magic Keyboard/trackpad)

#### iPad Pro 12.9" (1024px × 1366px)
**Browser**: Safari iPadOS
- [ ] Desktop breakpoint active (1024px)
- [ ] 3-column grids working
- [ ] Max-width container (1200px) centered
- [ ] SOS button larger (320px × 180px)
- [ ] Map 500px height
- [ ] Modal 800px max-width

### Desktop Devices

#### Laptop (1280px × 720px)
**Browser**: Chrome/Edge/Firefox
- [ ] Container max-width 1200px
- [ ] Content centered on screen
- [ ] 3-column layouts working
- [ ] Hover effects visible
- [ ] SOS button prominent (320px × 180px)
- [ ] Map full 500px height
- [ ] Modal centered (800px max)

#### Desktop (1920px × 1080px)
**Browser**: Chrome/Edge/Firefox
- [ ] Container max-width still 1200px
- [ ] Content doesn't stretch too wide
- [ ] Adequate margin on sides
- [ ] All hover effects working
- [ ] Typography scales with clamp()

#### Ultrawide (2560px × 1440px)
**Browser**: Chrome/Edge/Firefox
- [ ] Container max-width 1280px (1440px+ breakpoint)
- [ ] Content centered with large margins
- [ ] No layout breaks
- [ ] Professional appearance maintained

## 🧪 Feature-Specific Testing

### SOS Button Sizing
**Viewports to test**: 360px, 480px, 768px, 1024px, 1920px

- [ ] **Mobile (< 480px)**: 280px × 160px
- [ ] **Mobile (480-767px)**: 280px × 160px
- [ ] **Tablet (768-1023px)**: 300px × 170px
- [ ] **Desktop (1024px+)**: 320px × 180px
- [ ] **Landscape (< 500px height)**: Height reduced to 140px

### Bottom Navigation
**Test on**: All mobile and tablet devices

- [ ] Fixed to bottom (z-index 300)
- [ ] 70px base height
- [ ] Safe area insets added (iOS)
- [ ] Doesn't overlap page content
- [ ] Navigation items 48px height (touch-friendly)
- [ ] Icons and text visible
- [ ] Active state indicator working

### Modals
**Test viewports**: 360px, 768px, 1024px

- [ ] **Mobile (< 640px)**: Full-width, slide from bottom, max 90vh
- [ ] **Tablet (640-1023px)**: Centered, 90% width, max 600px
- [ ] **Desktop (1024px+)**: Centered, 85% width, max 800px
- [ ] Backdrop blur working
- [ ] Close button accessible
- [ ] Scrollable content when needed
- [ ] Smooth animations (slide/fade)

### Forms & Inputs
**Test on**: iPhone, Android, iPad

- [ ] Full-width on mobile
- [ ] 48px height (touch-friendly)
- [ ] 16px font size (no iOS zoom)
- [ ] Labels above inputs
- [ ] Error states visible
- [ ] Focus indicators clear (3px outline)
- [ ] Keyboard covers input (viewport adjusts)

### Cards
**Test viewports**: 360px, 768px, 1024px

- [ ] **Mobile (< 640px)**: Full-width, stacked, 12-16px padding
- [ ] **Tablet (640-1023px)**: Can be side-by-side (2-column grid)
- [ ] **Desktop (1024px+)**: 3-column grid working
- [ ] 16px gap between cards
- [ ] Proper shadows (md)
- [ ] Hover effect on desktop (transform)

### Map Container
**Test all viewports**

- [ ] **Mobile (< 480px)**: 300px height
- [ ] **Mobile (480-767px)**: 350px height
- [ ] **Tablet (768-1023px)**: 400px height
- [ ] **Desktop (1024px+)**: 500px height
- [ ] Border radius 12px
- [ ] Shadow visible
- [ ] Controls don't overlap buttons
- [ ] Risk legend visible and clear
- [ ] Zoom controls accessible

### Typography
**Test readability across all devices**

- [ ] Minimum 14px on mobile (16px on inputs)
- [ ] Proper heading hierarchy (h1 to h6)
- [ ] Line-height 1.6 for readability
- [ ] clamp() scaling smooth across viewports
- [ ] Color contrast WCAG AA (4.5:1)
- [ ] No text overflow or wrapping issues

## ♿ Accessibility Testing

### Keyboard Navigation
**Browser**: Desktop Chrome/Firefox/Edge

- [ ] Tab order logical
- [ ] All interactive elements reachable
- [ ] Focus indicators visible (3px outline, 2px offset)
- [ ] Enter/Space activates buttons
- [ ] Escape closes modals
- [ ] Skip link works (jump to main content)

### Screen Reader Testing
**Tools**: NVDA (Windows), VoiceOver (macOS/iOS), TalkBack (Android)

- [ ] Page structure announced
- [ ] Button labels descriptive
- [ ] Form labels associated
- [ ] Error messages announced
- [ ] Loading states communicated
- [ ] Modal focus trapped
- [ ] Skip link functional

### Reduced Motion
**How to test**: OS Settings → Accessibility → Reduce Motion

- [ ] Animations reduced to 0.01ms
- [ ] No dizzying effects
- [ ] SOS pulse animation disabled
- [ ] Transitions instant
- [ ] Scroll behavior auto (not smooth)

### High Contrast Mode
**How to test**: Windows High Contrast settings

- [ ] Buttons have 2px borders
- [ ] Cards have 2px borders
- [ ] Badges have 1px borders
- [ ] Text contrast excellent
- [ ] Focus indicators very visible

### Color Contrast
**Tool**: WCAG Color Contrast Checker

- [ ] Primary on white: 4.5:1+ (AA)
- [ ] Text on backgrounds: 4.5:1+
- [ ] Error red: 4.5:1+
- [ ] Secondary gray: 4.5:1+
- [ ] Link text: 4.5:1+

## 🎨 Visual Polish Testing

### Spacing Consistency
**Check across all components**

- [ ] 8px rhythm maintained (xs, sm, md, lg, xl, 2xl)
- [ ] Buttons: 16px padding horizontal, 12px vertical
- [ ] Cards: 12-20px padding (mobile to desktop)
- [ ] Section gaps: 24px
- [ ] Grid gaps: 16px
- [ ] Icon-text gap: 8px

### Shadow Consistency
**Check elevation levels**

- [ ] Cards: --shadow-md
- [ ] Buttons (hover): --shadow-sm
- [ ] Modals: --shadow-xl
- [ ] SOS button: --shadow-lg
- [ ] Dropdowns: --shadow-lg

### Border Radius Consistency
**Check corner rounding**

- [ ] Buttons: 8px
- [ ] Cards: 12px
- [ ] Inputs: 6px
- [ ] Badges: 12px (pill shape)
- [ ] Modals: 12px (0px on mobile full-width)
- [ ] Map container: 12px

### Animation Smoothness
**Test all interactions**

- [ ] Button hover: 150ms ease-in-out
- [ ] Card hover: 200ms ease
- [ ] Modal open/close: 300ms ease
- [ ] SOS pulse: 2s infinite
- [ ] Page transitions: smooth
- [ ] 60fps maintained (no janky animations)

## 🔍 Browser-Specific Testing

### Safari (macOS/iOS)
- [ ] CSS variables working
- [ ] clamp() working
- [ ] Safe area insets working
- [ ] -webkit-overflow-scrolling: touch
- [ ] -webkit-tap-highlight-color: transparent
- [ ] -webkit-text-size-adjust: 100%
- [ ] Smooth scrolling
- [ ] No input zoom on focus

### Chrome (Desktop/Android)
- [ ] All features working
- [ ] GPU acceleration active
- [ ] No layout shifts
- [ ] Lighthouse score 90+
- [ ] Performance 60fps

### Firefox (Desktop)
- [ ] CSS variables working
- [ ] clamp() working
- [ ] All animations smooth
- [ ] Focus outlines visible
- [ ] No console errors

### Edge (Desktop)
- [ ] Chromium-based, same as Chrome
- [ ] High contrast mode working
- [ ] All features functional

### Samsung Internet (Android)
- [ ] Touch targets correct
- [ ] Animations smooth
- [ ] Safe area handling
- [ ] No rendering issues

## 🚀 Performance Testing

### Lighthouse Audit
**Run on**: Chrome DevTools

- [ ] Performance: 90+ score
- [ ] Accessibility: 90+ score
- [ ] Best Practices: 90+ score
- [ ] SEO: 90+ score
- [ ] First Contentful Paint: < 1.5s
- [ ] Largest Contentful Paint: < 2.5s
- [ ] Cumulative Layout Shift: < 0.1

### Animation Performance
**Chrome DevTools**: Performance tab

- [ ] 60fps maintained during animations
- [ ] No layout recalculations
- [ ] GPU acceleration active (transform/opacity)
- [ ] No paint operations on scroll
- [ ] Smooth interactions

### CSS Size
**Check build output**

- [ ] Unminified: ~25KB
- [ ] Gzipped: ~8KB
- [ ] No unused styles
- [ ] Efficient selectors

## 📋 Quick Test Checklist

### Before Demo/Release
- [ ] Test on iPhone (Safari iOS)
- [ ] Test on Android (Chrome Android)
- [ ] Test on iPad (Safari iPadOS)
- [ ] Test on Desktop (Chrome/Edge/Firefox)
- [ ] Keyboard navigation working
- [ ] Screen reader tested
- [ ] No console errors
- [ ] No layout breaks
- [ ] All touch targets 44px+
- [ ] Reduced motion working
- [ ] High contrast mode tested
- [ ] Print preview looks good
- [ ] Lighthouse audit passed

## 🐛 Common Issues to Watch For

### Mobile Issues
- ❌ Horizontal scrolling → Check for fixed pixel widths
- ❌ Small touch targets → Verify 44px minimum
- ❌ iOS input zoom → Ensure 16px font size
- ❌ Content under nav → Check 90px bottom padding
- ❌ Overlapping elements → Verify z-index scale

### Tablet Issues
- ❌ Stretched mobile layout → Check 640px+ breakpoints
- ❌ Wasted space → Implement 2-column grids
- ❌ Desktop-like modals → Use 600px max-width

### Desktop Issues
- ❌ Too-wide content → Check max-width containers
- ❌ No hover states → Verify :hover on desktop
- ❌ Tiny clickable areas → Ensure adequate size

### Cross-Browser Issues
- ❌ Safari bugs → Test CSS variables, clamp()
- ❌ Firefox differences → Check custom properties
- ❌ Edge high contrast → Verify border styles

## 📊 Testing Schedule

### Daily (During Development)
- Mobile (iPhone/Android)
- Desktop (Chrome)
- Console errors

### Weekly
- All browsers (Chrome, Safari, Firefox, Edge)
- All devices (mobile, tablet, desktop)
- Accessibility audit

### Pre-Release
- Full testing matrix above
- Lighthouse audit
- Performance testing
- User acceptance testing

---

## ✅ Status

**Last Tested**: [Date]
**Tested By**: [Name]
**Devices Tested**: [List]
**Issues Found**: [Number]
**Status**: ✅ Pass / ⚠️ Minor Issues / ❌ Major Issues

---

**Quick Tip**: Use Chrome DevTools Device Mode to quickly test multiple viewports. Remember to test on real devices for touch interactions and performance!
