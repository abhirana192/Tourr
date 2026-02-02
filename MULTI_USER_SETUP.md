# Multi-User Database Synchronization Setup

Your application is now configured to support **multiple users on different PCs sharing the same database** with **real-time synchronization**.

## ✅ What's Implemented

### 1. **Backend Migration to Supabase**
   - All backend routes have been migrated from local in-memory/SQLite database to Supabase
   - Files updated:
     - `server/supabase-db.ts` - New Supabase database abstraction layer
     - `server/routes/tours.ts` - Uses Supabase for all tour operations
     - `server/routes/staff.ts` - Uses Supabase for all staff operations
     - `server/routes/assignments.ts` - Uses Supabase for all assignment operations
     - `server/routes/auth.ts` - Authentication with Supabase backend

### 2. **Frontend Real-time Synchronization**
   - New hook: `client/hooks/useRealtimeSync.ts`
   - Supabase Realtime subscriptions enable live updates across all connected clients
   - Pages updated with real-time sync:
     - `Schedule.tsx` - Real-time tour list updates
     - `MonthlyPlan.tsx` - Real-time activity aggregation
     - `Arrival.tsx` - Real-time guest information updates
   
### 3. **How Real-time Sync Works**
   - When User A on PC1 creates/updates a tour → All connected clients (PC2, PC3, etc.) automatically receive the update
   - Changes appear instantly without requiring manual refresh
   - Automatic conflict resolution with Supabase

## 📋 Required Configuration

### Supabase Credentials
Your app is already configured with Supabase credentials in environment variables:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_KEY` - Backend authentication key
- `VITE_SUPABASE_ANON_KEY` - Frontend authentication key (for real-time subscriptions)

### Database Tables Required
Ensure these tables exist in your Supabase project:

1. **tours** table
   ```
   - id (uuid, primary key)
   - invoice (text)
   - name (text)
   - start_date (date)
   - pax (integer)
   - agent (text)
   - [... all other tour fields ...]
   - activity_schedule (jsonb)
   - activity_notes (jsonb)
   - arrival_notes (text)
   - departure_notes (text)
   - created_at (timestamp)
   - updated_at (timestamp)
   ```

2. **staff** table
   ```
   - id (uuid, primary key)
   - email (text, unique)
   - first_name (text)
   - last_name (text)
   - role (text)
   - password_hash (text)
   - availability_status (text)
   - created_at (timestamp)
   ```

3. **assignments** table
   ```
   - id (uuid, primary key)
   - assignment_type (text) - "arrival", "departure", or "activity"
   - assignment_key (text)
   - activity_date (date)
   - van (text)
   - employees (text)
   - created_at (timestamp)
   - updated_at (timestamp)
   ```

## 🔐 Security - Row Level Security (RLS)

For production, enable Row Level Security on Supabase tables:

### Example RLS Policy
```sql
-- Allow users to see all tours (organization-level access)
CREATE POLICY "allow_all_access_tours" ON tours
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Similar policies for staff and assignments tables
```

**Note:** RLS policies should be configured based on your authentication model. Contact Supabase support or your database administrator if you need help setting up RLS.

## 🚀 Testing Multi-User Synchronization

### Test Scenario 1: Real-time Tour Addition
1. Open the app on PC1 → Go to Schedule page
2. Open the app on PC2 → Go to Schedule page
3. On PC1: Create a new tour and save
4. **Expected:** PC2's tour list updates automatically within 1-2 seconds

### Test Scenario 2: Real-time Tour Update
1. Both PCs open Schedule page
2. On PC1: Edit any tour (change activity, notes, etc.) and save
3. **Expected:** PC2's view updates automatically

### Test Scenario 3: Real-time Tour Deletion
1. Both PCs open Schedule page
2. On PC1: Delete a tour
3. **Expected:** Tour disappears from PC2's list automatically

### Test Scenario 4: Multi-user Arrival Page
1. PC1 and PC2 both open Arrival page
2. PC1: Select a tour and modify its schedule
3. **Expected:** PC2's Arrival information updates in real-time

## 📊 Deployment Considerations

### Cloud Deployment
When deploying to production (Netlify, Vercel, Railway, etc.):

1. **Set Environment Variables**
   - `SUPABASE_URL` - Keep your Supabase project URL
   - `SUPABASE_SERVICE_KEY` - Your service role key
   - `VITE_SUPABASE_ANON_KEY` - Your anon key (for frontend)

2. **Enable Supabase Realtime**
   - In Supabase Dashboard → Project Settings → API → Realtime
   - Ensure your tables have "Realtime Enabled"

3. **Database Backups**
   - Enable automated backups in Supabase Dashboard
   - Configure retention period based on your needs

## 🔍 Monitoring & Troubleshooting

### Check Real-time Connection
Open browser DevTools Console and look for logs like:
```
[Realtime] tours subscription status: SUBSCRIBED
[Realtime] New tours inserted: {...}
[Realtime] tours updated: {...}
```

### Common Issues

**Issue: Real-time updates not appearing**
- Solution: Ensure `VITE_SUPABASE_ANON_KEY` is set correctly
- Check browser console for errors
- Verify Realtime is enabled on the table in Supabase

**Issue: Database errors on insert/update**
- Solution: Verify table schema matches the code
- Check Row Level Security policies if enabled
- Review Supabase logs in Dashboard

## 📝 Next Steps

1. **Test the synchronization** using the test scenarios above on your network
2. **Configure Row Level Security** if using authentication
3. **Set up monitoring** in Supabase to track database usage
4. **Deploy to production** with proper environment variables

## 💡 Pro Tips

- The app automatically handles conflicts - the last write wins
- Real-time sync works across all modern browsers
- Mobile clients (iOS/Android) also support real-time sync if using same Supabase credentials
- Monitor Supabase usage in Dashboard to track concurrent connections

---

**Need Help?**
- Supabase Docs: https://supabase.com/docs
- Real-time Docs: https://supabase.com/docs/guides/realtime
- Database Configuration: https://supabase.com/docs/guides/database
