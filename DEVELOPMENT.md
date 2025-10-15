# Development Tools & Guidelines

This document outlines development tools, testing utilities, and best practices for the OhmanFoundations application.

## Performance Testing

Each page includes built-in performance testing tools available in the browser console during development. These tools help monitor data fetching performance and identify potential bottlenecks.

### Available Performance Tests

#### Students Page
```javascript
window.studentsPerfTest.testPerformance() // Run performance benchmark
window.studentsPerfTest.clearCache()      // Clear cached data
```

#### Teachers Page
```javascript
window.teachersPerfTest.testPerformance()
window.teachersPerfTest.clearCache()
```

#### Exams Page
```javascript
window.examsPerfTest.testPerformance()
window.examsPerfTest.clearCache()
```

#### Communications Page
```javascript
window.communicationsPerfTest.testPerformance()
window.communicationsPerfTest.clearCache()
```

#### Video Conferencing Page
```javascript
window.videoConferencingPerfTest.testPerformance()
window.videoConferencingPerfTest.clearCache()
```

#### Subjects Page
```javascript
window.subjectsPerfTest.testPerformance()
window.subjectsPerfTest.clearCache()
```

#### Attendance Page
```javascript
window.attendancePerfTest.testPerformance()
window.attendancePerfTest.clearCache()
```

#### Progress Page
```javascript
window.progressPerfTest.testPerformance()
window.progressPerfTest.clearCache()
```

#### Payments Page
```javascript
window.paymentsPerfTest.testPerformance()
window.paymentsPerfTest.clearCache()
```

#### Resources Page
```javascript
window.resourcesPerfTest.testPerformance()
window.resourcesPerfTest.clearCache()
```

#### Settings Page
```javascript
window.settingsPerfTest.testPerformance()
window.settingsPerfTest.clearCache()
```

#### Admin Dashboard
```javascript
window.adminDashboardPerfTest.testPerformance()
window.adminDashboardPerfTest.clearCache()
```

#### Teacher Dashboard
```javascript
window.teacherDashboardPerfTest.testPerformance()
window.teacherDashboardPerfTest.clearCache()
```

#### Student-Parent Dashboard
```javascript
window.studentParentDashboardPerfTest.testPerformance()
window.studentParentDashboardPerfTest.clearCache()
```

#### Notices Page
```javascript
window.noticesPerfTest.testPerformance()
window.noticesPerfTest.clearCache()
```

### How to Use

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open your browser** and navigate to any page

3. **Open Developer Tools** (F12 or Ctrl+Shift+I)

4. **Go to the Console tab** - you'll see helpful messages like:
   ```
   👥 Students Performance Testing available in console:
     window.studentsPerfTest.testPerformance() - Run performance test
     window.studentsPerfTest.clearCache() - Clear cache and reload
   ```

5. **Run the commands** to test performance or clear cache

### What the Tests Measure

- **Query Response Time**: How long it takes to fetch data from the backend
- **Cache Performance**: Effectiveness of data caching strategies
- **Search Performance**: Speed of filtered queries
- **Memory Usage**: Impact on browser memory

### Example Output
```javascript
📊 Students Performance Test Results: {
  totalTime: 245,
  studentsQueryTime: 120,
  searchQueryTime: 89,
  timestamp: "2025-10-10T..."
}
```

## Development Best Practices

### Code Quality
- All components include ErrorBoundary for graceful error handling
- TableSkeleton provides professional loading states
- TypeScript ensures type safety throughout
- Performance testing helps catch regressions

### Backend Integration
- **Appwrite**: Used for core data operations (students, teachers, subjects, attendance, progress, payments)
- **CBT API**: Used for exam functionality (`/api/cbt/*` endpoints)
- All hooks include proper error handling and cache management

### Testing
- Performance tests available in development console
- Console-based metrics for debugging
- Cache invalidation testing capabilities

## Production Readiness Checklist

✅ **Error Boundaries**: All pages wrapped in ErrorBoundary components
✅ **Loading States**: TableSkeleton used for professional UX
✅ **Performance Testing**: Development console tools available
✅ **Backend Integration**: Complete API connectivity verified
✅ **TypeScript**: Full type safety implemented
✅ **Responsive Design**: Mobile-optimized interfaces

## Troubleshooting

### Performance Issues
If a page seems slow:
1. Open browser console
2. Run `window.{pageName}PerfTest.testPerformance()`
3. Check the timing metrics
4. Clear cache with `window.{pageName}PerfTest.clearCache()`
5. Test again to verify improvement

### Cache Issues
If data doesn't update:
1. Run `window.{pageName}PerfTest.clearCache()`
2. Refresh the page
3. Verify data loads correctly

### Console Not Available
If performance testing commands aren't showing:
- Ensure you're in development mode (`npm run dev`)
- Check that `NODE_ENV === 'development'`
- Refresh the page to trigger the console setup

## Architecture Notes

### Data Fetching Strategy
- **TanStack Query**: Client-side caching and state management
- **Appwrite SDK**: Direct database operations for core entities
- **Custom Hooks**: Encapsulated business logic with error handling

### Error Handling
- **React Error Boundaries**: Catch and display UI errors gracefully
- **Toast Notifications**: User-friendly error messages
- **Console Logging**: Development debugging information

### Performance Optimizations
- **Query Caching**: Prevents unnecessary API calls
- **Background Updates**: Data refreshes without blocking UI
- **Optimistic Updates**: Immediate UI feedback for better UX