# Backend-Based Bond Data Automation for Railway

## Why Backend > Local Machine

**The Problem with Local Automation:**
- ❌ Requires your computer to be on 24/7
- ❌ Stops working if you're traveling or offline  
- ❌ You're responsible for maintaining the scheduler
- ❌ Not scalable or professional

**The Solution: Backend Automation on Railway:**
- ✅ Runs 24/7 on Railway servers
- ✅ Works regardless of your computer status
- ✅ Professional, production-ready architecture
- ✅ Railway handles infrastructure concerns

---

## Architecture Comparison

### OLD (Local) Flow:
```
Your Mac @ 5:30 PM
    ↓
Scrape Investing.com
    ↓
Update local JSON files
    ↓
Git commit & push
    ↓
GitHub Pages rebuilds
    ↓
Website shows new data

❌ Fails if your Mac is off/asleep
```

### NEW (Backend) Flow:
```
Railway Cron @ 5:30 PM EST
    ↓
POST /api/admin/update-bonds
    ↓
Scrape Investing.com
    ↓
Update backend JSON files (on Railway)
    ↓
Backend API serves fresh data immediately
    ↓
Frontend fetches from API (already does this!)

✅ Always works, no deployment needed
```

---

## Implementation (3 Options)

### Option 1: External Cron Service (EASIEST ⭐)

Use a free service to ping your endpoint daily.

**Recommended: cron-job.org**

1. **Sign up** at https://cron-job.org (free)

2. **Create cron job:**
   - Title: `MacroScope Bond Update`
   - URL: `https://macroscope-00-production.up.railway.app/api/admin/update-bonds`
   - Request Method: `POST`
   - Schedule: `30 17 * * *` (5:30 PM EST)
   - Enable: `Execution notification on failure` (get email if it fails)

3. **Done!** That's it. No code changes needed on Railway.

**Alternatives:**
- **UptimeRobot**: Also monitors your site uptime (free tier)
- **EasyCron**: Simple UI (free tier)
- **Google Cloud Scheduler**: If you have GCP account

### Option 2: Railway Cron Jobs (NATIVE)

Railway may have built-in cron support (check your plan).

1. **Railway Dashboard** → Your Project → Settings
2. **Look for "Cron Jobs" or "Scheduled Tasks"**
3. **Add job:**
   ```
   Schedule: 0 22 * * *  (10 PM UTC = 5:30 PM EST)
   Command: curl -X POST http://localhost:8000/api/admin/update-bonds
   ```

**Note:** This feature may require Railway Pro plan. Check documentation.

### Option 3: APScheduler (IN-APP)

Run scheduler inside your Flask app.

**Steps:**

1. **Add dependency:**
   ```bash
   # Add to backend/requirements.txt
   APScheduler==3.10.4
   ```

2. **Update app.py:**
   ```python
   from api.api_server import create_app
   from core.scheduler import start_scheduler
   
   app = create_app()
   
   # Start background scheduler (Railway will run this)
   if __name__ == '__main__' or os.environ.get('RAILWAY_ENVIRONMENT'):
       scheduler = start_scheduler()
       print("✅ Background scheduler started")
   
   if __name__ == '__main__':
       port = int(os.environ.get('PORT', 8000))
       app.run(host='0.0.0.0', port=port, debug=False)
   ```

3. **Deploy to Railway**

4. **Check logs** to verify scheduler started

**Pros:**
- ✅ Self-contained
- ✅ No external dependencies

**Cons:**
- ❌ Uses app resources
- ❌ Railway free tier may have limitations
- ❌ Scheduler stops if app crashes

---

## Security: Protect the Endpoint

Right now, `/api/admin/update-bonds` is public - anyone can trigger it!

### Quick Fix: API Key Authentication

1. **Add API key to Railway environment variables:**
   - Railway Dashboard → Variables
   - Add: `ADMIN_API_KEY=your-secret-key-here` (generate random string)

2. **Update endpoint in `backend/api/api_server.py`:**
   ```python
   @app.route('/api/admin/update-bonds', methods=['POST'])
   def trigger_bond_update():
       """Manually trigger bond data update with API key authentication."""
       
       # Check API key
       api_key = request.headers.get('X-API-Key') or request.args.get('api_key')
       expected_key = os.environ.get('ADMIN_API_KEY')
       
       if not expected_key or api_key != expected_key:
           logger.warning(f"Unauthorized bond update attempt from {request.remote_addr}")
           return jsonify({
               'status': 'error',
               'message': 'Unauthorized'
           }), 401
       
       # Rest of the function...
   ```

3. **Update cron job to include API key:**
   - URL: `https://macroscope-00-production.up.railway.app/api/admin/update-bonds?api_key=YOUR_SECRET_KEY`
   - Or add header: `X-API-Key: YOUR_SECRET_KEY`

---

## My Recommendation for You

**Use Option 1: External Cron Service (cron-job.org)**

**Why:**
- ✅ Takes 5 minutes to setup
- ✅ Free forever
- ✅ No code changes needed (endpoint already exists)
- ✅ Email notifications if it fails
- ✅ Doesn't use Railway resources
- ✅ Easy to test and monitor

**Setup Steps:**

1. **Test the endpoint first:**
   ```bash
   curl -X POST https://macroscope-00-production.up.railway.app/api/admin/update-bonds
   ```
   Should return: `{"status": "success", ...}`

2. **Sign up at cron-job.org**

3. **Create job:**
   - URL: `https://macroscope-00-production.up.railway.app/api/admin/update-bonds`
   - Method: POST
   - Schedule: `30 17 * * *`

4. **Enable failure notifications**

5. **Done!** Check logs tomorrow to verify.

---

## Monitoring & Logs

### Check Railway logs:
```bash
# Railway CLI
railway logs

# Or view in Railway Dashboard → Logs
```

### Test manual trigger:
```bash
# From terminal
curl -X POST https://macroscope-00-production.up.railway.app/api/admin/update-bonds

# Should return JSON with status: "success"
```

### Verify data updated:
```bash
# Check bond data endpoint
curl https://macroscope-00-production.up.railway.app/api/bonds
```

---

## Migration Plan: From Local to Backend

### Phase 1: Setup Backend Automation (Today)
1. ✅ Endpoint created (`/api/admin/update-bonds`)
2. Sign up for cron-job.org
3. Configure cron job
4. Test it works

### Phase 2: Verify (Tomorrow)
1. Check Railway logs at 5:30 PM
2. Verify bond data updated
3. Check website shows new data

### Phase 3: Cleanup (After 1 week)
1. Disable local launchd/cron (if you set it up)
2. Remove local automation scripts (optional - keep as backup)
3. Document backend automation in README

---

## Troubleshooting

### Cron job fails:
- Check Railway logs for errors
- Verify endpoint URL is correct
- Test endpoint manually with curl

### Data not updating:
- Check if scraper is hitting rate limits (503 errors)
- Verify JSON files are writable on Railway
- Check Railway disk storage isn't full

### Website not showing new data:
- Verify frontend is calling Railway API, not local JSON
- Check CORS settings in `api_server.py`
- Clear browser cache

---

## Cost Analysis

| Solution | Cost | Pros | Cons |
|----------|------|------|------|
| cron-job.org | $0/mo | Easy, reliable, email alerts | External dependency |
| Railway Cron | $0-5/mo | Native to Railway | May need Pro plan |
| APScheduler | $0/mo | Self-contained | Uses app resources |
| UptimeRobot | $0/mo | Also monitors uptime | Less flexible |

**Recommendation:** Start with cron-job.org (free), migrate to Railway Cron if you upgrade to Pro.

---

## Next Steps

1. **Test the endpoint:**
   ```bash
   curl -X POST https://macroscope-00-production.up.railway.app/api/admin/update-bonds
   ```

2. **Sign up for cron-job.org**

3. **Create the cron job**

4. **Add API key security** (optional but recommended)

5. **Monitor logs tomorrow at 5:30 PM**

6. **Disable local automation** (after 1 week of successful runs)

Need help with any step? Let me know! 🚀
