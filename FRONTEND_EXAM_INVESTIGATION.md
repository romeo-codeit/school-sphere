# Frontend Exam Fetching Investigation

## Summary
After investigating the frontend code, I've confirmed that:

1. **Backend is correctly implementing pagination** - The `/api/cbt/exams` endpoint in `server/routes.ts` (lines 202-227) correctly fetches ALL exams from Appwrite using pagination:
   - Uses Appwrite's max limit of 100 per request
   - Loops through all pages until all exams are fetched
   - Returns all exams in a single response
   - Has debug logging: `console.log('Total exams returned:', allExams.length)`

2. **Frontend correctly calls the backend** - The `useExams` hook in `client/src/hooks/useExams.ts` correctly:
   - Calls `/api/cbt/exams` with JWT authentication
   - Returns the full array of exams from the backend

## Changes Made
I've added debugging to `client/src/hooks/useExams.ts` to log:
- The URL being fetched
- Any HTTP errors
- The number of exams returned and the full data

## Next Steps to Debug

### 1. Check Browser Console
With the app running, navigate to the `/exams` page and check the browser console (F12). You should see logs like:
```
Fetching exams from: /api/cbt/exams
Exams fetched: 1159 [...]
```

### 2. Check Network Tab
In the browser DevTools Network tab:
- Look for the request to `/api/cbt/exams`
- Check the response size and preview the JSON
- Verify all 1,159 exams are in the response

### 3. Check Backend Logs
In the terminal running `npm run dev:server`, you should see:
```
Total exams returned: 1159
```

### 4. Clear React Query Cache
If you see that all exams are being fetched but the UI still shows only 25:
- Hard refresh the page (Ctrl+Shift+R)
- Or clear the React Query cache manually
- Or check if there's client-side filtering hiding exams

## Potential Issues

### Issue 1: Appwrite Document Permissions
Even though the backend paginates correctly, Appwrite might not return documents if the user doesn't have read permissions. Check:
- All exam documents have appropriate read permissions
- The JWT token used has permissions to read all exams

### Issue 2: `isActive` Filter
While the backend doesn't filter by `isActive`, Appwrite's document-level permissions might hide inactive exams. Since you batch-activated all exams, this should be resolved.

### Issue 3: React Query Stale Cache
React Query might be showing cached data from before the batch activation. Solutions:
- Clear browser cache
- Restart the dev servers
- Invalidate the React Query cache programmatically

## Verification Commands

### Test Backend Endpoint (after logging in to get JWT)
You can't easily test from curl due to JWT auth, but you can:
1. Log in to the app
2. Open browser DevTools
3. Go to Application > Local Storage
4. Copy the JWT token
5. Use it to test the endpoint

### Quick Health Check
```typescript
// In the browser console after loading the app:
console.log('Exams loaded:', window.__REACT_QUERY_DEVTOOLS_CACHE__);
```

## Recommended Fix
If the issue persists, we may need to:
1. Add explicit pagination to the frontend (not recommended since backend handles it)
2. Add a "Load More" button for safety
3. Investigate Appwrite collection permissions
4. Add retry logic for failed requests
