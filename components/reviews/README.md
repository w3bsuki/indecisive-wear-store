# Reviews Component Architecture

This directory contains the refactored reviews system, breaking down the original 769-line component into modular, reusable pieces.

## Component Structure

### Core Components

- **reviews-section.tsx** (103 lines) - Main container component that orchestrates all review features
- **review-card.tsx** (58 lines) - Individual review display with rating, content, and metadata
- **review-form.tsx** (346 lines) - Comprehensive review submission form with image upload
- **review-stats.tsx** (53 lines) - Rating overview and distribution visualization
- **review-filters.tsx** (64 lines) - Filtering and sorting controls
- **review-actions.tsx** (79 lines) - Helpful/share button functionality
- **review-images.tsx** (57 lines) - Image gallery with modal preview

### Performance Optimizations

- **lazy-image.tsx** - Intersection Observer-based lazy loading for images
- **reviews-list-virtualized.tsx** - Virtual scrolling for large review lists
- **use-virtual-scroll.ts** - Custom hook for virtualization logic

### Error Handling & UX

- **error-boundary.tsx** - React error boundary for graceful error handling
- **review-skeleton.tsx** - Loading skeletons for better perceived performance
- **reviews-section-with-boundary.tsx** - Wrapper with error boundary

### Utilities

- **types.ts** - Centralized TypeScript interfaces
- **utils.ts** - Filtering, sorting, and calculation functions
- **mock-data.ts** - Sample review data

## Features Preserved

✅ All original functionality maintained:
- Review display with ratings and badges
- Photo upload with drag-and-drop
- Social sharing integration
- Filtering by rating, verified, with photos
- Sorting by date, rating, helpfulness
- Helpful/not helpful voting
- Size and fit information
- Responsive design
- Accessibility features

## Performance Improvements

1. **Component Memoization** - React.memo on all components to prevent unnecessary re-renders
2. **Lazy Image Loading** - Images load only when visible in viewport
3. **Virtual Scrolling** - Efficient rendering of large review lists (optional)
4. **Code Splitting** - Smaller bundles with modular imports
5. **Optimized Callbacks** - useCallback hooks for stable function references

## Usage

```tsx
import { ReviewsSection } from "@/components/reviews-section"

// The component is wrapped with error boundary by default
<ReviewsSection
  productId={1}
  productName="Essential White Tee"
  averageRating={4.8}
  totalReviews={124}
/>
```

## Architecture Benefits

- **Maintainability**: Each component has a single responsibility
- **Testability**: Isolated components are easier to unit test
- **Reusability**: Components can be used independently
- **Performance**: Optimized rendering and loading strategies
- **Type Safety**: Full TypeScript coverage with proper interfaces
- **Error Resilience**: Error boundaries prevent full page crashes

## File Size Reduction

- Original: 769 lines in a single file
- Refactored: 103 lines in main component + modular sub-components
- Total: Better organized across 15+ focused files