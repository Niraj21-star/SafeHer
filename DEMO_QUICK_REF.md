# 🎭 SafeHer Demo Mode - Quick Reference

## ⚡ Quick Toggle

### Enable Demo Mode
```bash
# Edit: backend/.env
DEMO_MODE=true

# Restart
npm run dev
```

### Disable Demo Mode  
```bash
# Edit: backend/.env
DEMO_MODE=false

# Add real credentials, then restart
npm run dev
```

---

## 📊 Status Check

### Demo Mode Active ✅
```
🎭 ========================================
   DEMO MODE ENABLED
   External services will be simulated
========================================
```

### Production Mode Active
```
🚀 SafeHer API running on port 5000
📍 Health check: http://localhost:5000/health
(no demo mode banner)
```

---

## 🎬 Demo Script (90 seconds)

1. **Login** (10s)
   - Use test credentials
   
2. **Trigger SOS** (15s)
   - Click SOS button
   - Allow location
   - Confirm

3. **Show Results** (20s)
   - "Alerts sent to 2 contacts" ✅
   - "2 nearby guardians notified" ✅
   - No errors ✅

4. **Legal Assistant** (25s)
   - Navigate to Legal page
   - Ask: "How to file FIR?"
   - Show instant response ✅

5. **FIR Generation** (20s)
   - Fill incident form
   - Generate FIR
   - Show formatted document ✅

**Total:** 90 seconds, zero errors

---

## 🔍 Console Indicators

### What to Look For:

**Demo Mode Active:**
```
📱 [DEMO MODE] SMS sent successfully
📧 [DEMO MODE] Email sent successfully
👮 [DEMO MODE] 2 guardians notified
💬 [DEMO MODE] Generating legal response
```

**Production Mode:**
```
📱 SMS sent: SM1234567890...
📧 Email sent: <msg123@...>
(no [DEMO MODE] prefix)
```

---

## ⚠️ Important Notes

### DO in Demo Mode:
✅ Show full SOS flow  
✅ Demonstrate legal AI  
✅ Generate FIR documents  
✅ Use real location data  
✅ Test all features

### DON'T in Demo Mode:
❌ Show console logs to judges  
❌ Mention "demo" or "mock" to users  
❌ Deploy to production  
❌ Expect real SMS/emails

---

## 🆘 Quick Fixes

### "SMS/Email still failing"
→ Check: `DEMO_MODE=true` in `.env`  
→ Restart: `npm run dev`

### "Guardians not showing"
→ Check console for: `[DEMO MODE] 2 guardians notified`  
→ Verify demo mode is active

### "AI not responding"
→ In demo mode, uses cached responses  
→ Should be instant (no API calls)

---

## 📞 Support

**Documentation:**  
- Full Guide: [DEMO_MODE.md](DEMO_MODE.md)  
- Implementation: [DEMO_MODE_IMPLEMENTATION.md](DEMO_MODE_IMPLEMENTATION.md)

**Files Modified:**
- Backend: 7 files
- Docs: 3 files
- Total: 10 files

**Current Status:** ✅ Active and Ready

---

*Last Updated: February 10, 2026*  
*SafeHer MVP - Demo Mode v1.0*
