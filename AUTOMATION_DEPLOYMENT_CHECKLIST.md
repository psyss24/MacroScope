# Backend Automation Deployment Checklist

## ✅ What's Been Done

1. **Created `/api/admin/update-bonds` endpoint**
   - Location: `backend/api/api_server.py`
   - Method: POST
   - Returns: JSON with status and timestamp
   - Triggers: `scrapers/bonds_live.py` to update all bond data

2. **Created scheduler module** (optional)
   - Location: `backend/core/scheduler.py`
   - Uses: APScheduler for in-app cron
   - Schedule: Daily at 5:30 PM EST

3. **Updated requirements.txt**
   - Added: `APScheduler>=3.10.4` (optional dependency)

4. **Created test script**
   - Location: `backend/test_update_endpoint.py`
   - Tests: Both local and production endpoints

---

## 🚀 Deployment Steps

### Step 1: Deploy to Railway

```bash
# Commit changes
git add backend/api/api_server.py \
        backend/core/scheduler.py \
        backend/requirements.txt \
        backend/test_update_endpoint.py \
        BACKEND_AUTOMATION_GUIDE.md \
        AUTOMATION_DEPLOYMENT_CHECKLIST.md

git commit -m "Add backend automation for bond data updates"

git push origin main
```

Railway will automatically detect the push and redeploy.

### Step 2: Test the Endpoint

**Wait 2-3 minutes for Railway to deploy, then:**

```bash
# Test production endpoint
python backend/test_update_endpoint.py production

# Or use curl
curl -X POST https://macroscope-00-production.up.railway.app/api/admin/update-bonds
```

**Expected response:**
```json
{
  "status": "success",
  "message": "Bond data updated successfully",
  "timestamp": "2025-10-01T17:30:00.000000"
}
```

### Step 3: Setup External Cron

**Recommended: Use cron-job.org**

1. Go to https://cron-job.org
2. Sign up (free)
3. Create new cron job:
   - **Title:** MacroScope Bond Data Update
   - **URL:** `https://macroscope-00-production.up.railway.app/api/admin/update-bonds`
   - **Request Method:** POST
   - **Schedule:** Custom - `30 17 * * *`
   - **Timezone:** America/New_York (EST)
   - **Enable:** "Send email on failure"

4. Save and activate

### Step 4: Verify

**Tomorrow at 5:35 PM:**

1. Check Railway logs:
   ```
   Railway Dashboard → Your Project → Logs
   ```
   Look for: "Bond update completed at..."

2. Test API to verify fresh data:
   ```bash
   curl https://macroscope-00-production.up.railway.app/api/bonds
   ```

3. Check your website - should show updated data automatically!

4. Check email - should NOT receive failure notification

---

## 🔒 Optional: Add Security

**Add API Key Protection:**

1. **Add environment variable in Railway:**
   - Railway Dashboard → Variables
   - Click "+ New Variable"
   - Name: `ADMIN_API_KEY`
   - Value: `generate-a-long-random-string-here`

2. **Update endpoint code** (in `backend/api/api_server.py`):
   ```python
   @app.route('/api/admin/update-bonds', methods=['POST'])
   def trigger_bond_update():
       # Check API key
       api_key = request.headers.get('X-API-Key') or request.args.get('api_key')
       expected_key = os.environ.get('ADMIN_API_KEY')
       
       if expected_key and api_key != expected_key:
           return jsonify({'status': 'error', 'message': 'Unauthorized'}), 401
       
       # ... rest of function
   ```

3. **Update cron job URL:**
   ```
   https://macroscope-00-production.up.railway.app/api/admin/update-bonds?api_key=YOUR_SECRET_KEY
   ```

---

## 🧹 Cleanup Local Automation (After 1 Week)

Once backend automation is proven to work:

```bash
# Stop local launchd (if you set it up)
launchctl unload ~/Library/LaunchAgents/com.macroscope.bond-update.plist
rm ~/Library/LaunchAgents/com.macroscope.bond-update.plist

# Or remove cron job
crontab -e  # Delete the line

# Optional: Remove local automation scripts (keep as backup)
# rm scripts/update_bonds.sh
# rm scripts/update_bonds_and_deploy.sh
```

---

## 📊 Monitoring

### Check if cron job is working:
- cron-job.org dashboard shows execution history
- Email notifications on failure
- Railway logs show "Bond update completed"

### Verify data freshness:
```bash
# Check latest date in bond data
curl https://macroscope-00-production.up.railway.app/api/bonds | jq '.us10.history | keys | sort | last'
```

Should return today's date!

---

## 🎯 Success Criteria

- ✅ Endpoint returns 200 status code
- ✅ Railway logs show daily updates at 5:30 PM
- ✅ Bond data includes today's date
- ✅ Frontend shows fresh data without manual deployment
- ✅ No manual intervention required
- ✅ Your Mac can be off and it still works

---

## 🐛 Troubleshooting

### Endpoint returns 500 error:
- Check Railway logs for Python errors
- Verify `scrapers/bonds_live.py` works standalone
- Check file permissions on Railway

### Cron job times out:
- Normal! Update can take 30+ seconds
- Check Railway logs to verify completion
- Increase cron-job.org timeout to 60 seconds

### Data not updating:
- Verify Investing.com hasn't blocked Railway IP
- Check for 503 errors in logs (rate limiting)
- Test endpoint manually to reproduce issue

### Frontend not showing new data:
- Verify frontend calls Railway API (not local JSON)
- Check API response includes new data
- Clear browser cache

---

## 💡 Tips

1. **Test locally first:**
   ```bash
   cd backend && python app.py
   # In another terminal:
   python backend/test_update_endpoint.py
   ```

2. **Monitor for first week:**
   - Check logs daily
   - Verify data updates
   - Ensure no errors

3. **Set up alerts:**
   - cron-job.org email notifications
   - Railway deployment notifications
   - UptimeRobot for API health checks (optional)

4. **Document in README:**
   - How automation works
   - How to test endpoint
   - How to troubleshoot

---

## 🎉 You're Done!

After completing these steps:
- Your backend updates bond data automatically every day at 5:30 PM
- No manual intervention needed
- Works 24/7 regardless of your computer
- Professional, production-ready setup
- Frontend always shows fresh data

**No more worrying about local automation!** 🚀
