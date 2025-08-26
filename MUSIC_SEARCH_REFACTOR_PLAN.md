# Music Search Configuration Refactor - Analysis & Implementation Guide

## 🚨 CRITICAL: ZERO LOGIC LOSS REQUIREMENT

**IMPLEMENTING AI: This document provides detailed analysis and proposed approaches, but YOU MUST conduct your own thorough analysis and verification.**

**DO NOT simply copy-paste the proposed code. You must:**
1. **Independently analyze** the current codebase to understand the exact logic
2. **Verify every threshold and condition** through your own code review
3. **Test your understanding** by tracing through the current matching process
4. **Design your own implementation** based on your analysis
5. **Validate** that your approach preserves 100% of current behavior

This refactor requires absolute precision. The default configuration MUST produce identical matching results to the current hardcoded implementation.

---

## Current System Deep Analysis

### 1. Match Filters Critical Analysis

**Location:** `packages/music-search/src/index.ts:35-54`

**YOUR TASK:** Study this code section carefully. You'll find 13 hardcoded match filters in a specific priority order. 

**Key Analysis Points You Must Verify:**
- **Exact order matters** - the first filter that returns results wins, remaining filters are ignored
- **Precise threshold values** - some use `.8` format, others use `0.85` format
- **Boolean logic combinations** - understand AND vs OR conditions in each filter
- **Property references** - note which use `.match`, `.contains`, `.similarity`
- **Special cases** - look for `artistWithTitle`, `alternativeArtist` properties

**Questions for your analysis:**
1. What happens when `item.matching.artistWithTitle.similarity >= 0.8 AND item.matching.title.similarity >= 0.9`?
2. Why are there typos in some reason strings? (Hint: these must be preserved)
3. How does the filter priority affect matching results?
4. What's the difference between `.contains` and `.match` logic?

### 2. Text Processing Logic Analysis

**Location:** `packages/music-search/src/utils/filterOutWords.ts`

**YOUR TASK:** Understand the exact text processing pipeline and configuration arrays.

**Critical Elements to Analyze:**
- Three separate arrays: `filterOutWords`, `filterOutQuotes`, `cutOffSeparators`
- Processing order: lowercase → filter words → remove quotes → remove brackets → cut separators → trim → dash cleanup
- Parameter dependencies: `filtered`, `cutOffSeperators` (note the typo!), `removeQuotes`

**Questions for your analysis:**
1. What's the exact processing sequence?
2. How does `lastIndexOf` work with separators?
3. Why is empty bracket removal `split("()").join("")` hardcoded?
4. What are the dash cleanup rules for strings > 3 characters?

**Also analyze:** `packages/music-search/src/utils/compareTitles.ts`
- When is `twoWayContain=true` vs `false`?
- What's the minimum title length for contains logic?
- How does `createSearchString` handle accented characters?

### 3. Search Approaches Analysis

**YOUR TASK:** Compare Plex vs Tidal search approaches and understand the differences.

**Plex Approaches:** `packages/plex-music-search/src/index.ts:29-34, 61-66`
**Tidal Approaches:** `packages/tidal-music-search/src/index.ts:49-54`

**Critical Question:** Why does Plex include `removeQuotes: true` but Tidal doesn't? This difference MUST be preserved.

**Additional Plex Logic to Analyze:**
- `&` to `and` replacement (lines ~279-283)
- Album track search fallback (line ~290)
- Multiple search strategies in `searchForTrack.ts`
- Caching mechanism with `cacheId` patterns

---

## Proposed Implementation Approach

*Note: These are suggested approaches. You must develop your own implementation based on your analysis.*

### Phase 1: Configuration Schema Design

**YOUR TASK:** Design a configuration schema that can represent the current hardcoded logic without loss.

**Considerations:**
- How will you represent complex boolean logic in JSON?
- How will you maintain filter priority order?
- How will you handle the Plex vs Tidal differences?
- What's the best way to make match filters configurable while preserving exact logic?

**Suggested Schema Structure (adapt as needed):**
```typescript
// This is a starting point - refine based on your analysis
type MusicSearchConfig = {
  matchFilters: MatchFilterConfig[];
  textProcessing: TextProcessingConfig;
  searchApproaches: {
    plex: SearchApproachConfig[];
    tidal: SearchApproachConfig[];
  };
}
```

### Phase 2: Default Configuration Creation

**YOUR TASK:** Extract the exact current values and create a default configuration that produces identical behavior.

**Critical Requirements:**
- Every threshold value must match exactly
- Every reason string must match exactly (including typos)
- Filter priority order must be preserved
- Text processing arrays must be complete and accurate

**Your Process:**
1. Trace through the current code manually with test inputs
2. Document every condition and threshold
3. Create your default config
4. Verify it represents the logic correctly

### Phase 3: Implementation Strategy

**YOUR TASK:** Determine the best way to refactor the code while maintaining compatibility.

**Key Decisions You Must Make:**
1. **How to convert config to executable logic?** 
   - Function generation? Template patterns? Switch statements?
2. **Where to inject configuration loading?**
   - Constructor? Method calls? Singleton pattern?
3. **How to handle the MusicSearch singleton pattern?**
   - Is the current getInstance() pattern compatible with configuration?
4. **How to manage the dependency chain?**
   - PlexConfigManager → MusicSearch → matching logic

**Proposed Extension Points (verify these make sense):**
- Extend `@packages/plex-config` with music search settings
- Modify `@packages/music-search` to accept configuration
- Update search packages to load and pass configuration
- Modify all instantiation points to provide config manager

### Phase 4: Instantiation Point Analysis

**YOUR TASK:** Analyze all 9 locations where PlexMusicSearch is instantiated.

**Find these files and understand the context:**
- Web API endpoints (5 locations)
- Sync worker jobs (3 locations) 
- Various usage patterns

**Questions for your analysis:**
1. Do all locations have access to `settingsDir`?
2. Are there different configuration needs for different contexts?
3. How will you handle backwards compatibility during migration?
4. What's the error handling strategy if config loading fails?

---

## Validation & Testing Requirements

### 1. Logic Preservation Testing

**YOUR TASK:** Develop comprehensive tests to verify zero logic loss.

**Suggested Test Strategy:**
```typescript
// Create comprehensive test cases
const testCases = [
  { track: "Song Name", artist: "Artist Name", album: "Album Name" },
  { track: "Song (Radio Edit)", artist: "Artist & Another", album: "Album" },
  // ... more test cases covering edge cases
];

// Test current vs new implementation
testCases.forEach(testCase => {
  const currentResult = currentImplementation.search(testCase);
  const newResult = newImplementation.search(testCase);
  
  // MUST BE IDENTICAL
  expect(newResult).toEqual(currentResult);
});
```

**Edge Cases You Must Test:**
- Featured artists: "Artist feat. Other Artist"
- Special characters: "Song - Title", "Song: Title"
- Multiple variations of the same track
- Empty/null inputs
- Very short/long track names
- Classical music patterns
- Remixes and alternate versions

### 2. Configuration Loading Testing

**Test Scenarios:**
- Default config when no file exists
- Partial config override
- Invalid config handling
- Config file corruption handling

### 3. Performance Impact Analysis

**Questions to investigate:**
- How does config loading affect search performance?
- Should configuration be cached? For how long?
- What's the impact of converting config to executable logic?

---

## Web Interface Requirements

### UI Analysis Task

**YOUR TASK:** Study existing UI patterns in the application.

**Files to analyze:**
- `apps/web/pages/spotify/manage-playlists.tsx`
- `apps/web/pages/plex/connection.tsx`  
- `apps/web/src/components/` (various components)

**Questions for your analysis:**
1. What UI component patterns are used?
2. How is form validation handled?
3. What's the error handling approach?
4. How are settings pages structured and navigated?

### Interface Design Decisions

**YOUR TASK:** Decide on the best user interface approach.

**Considerations:**
- Should all 13 match filters be individually configurable in UI?
- How complex should the visual editor be?
- When should users fall back to JSON editing?
- What validation is needed in the UI vs backend?
- How to preview/test configuration changes?

**Suggested Dual Approach:**
1. **Simple UI** for common adjustments (thresholds, enable/disable filters)
2. **Advanced JSON Editor** for power users and complex modifications

---

## Implementation Verification Checklist

**Before you start coding, you must:**
- [ ] Understand the exact current matching logic through code analysis
- [ ] Trace through at least 3 different search scenarios manually
- [ ] Document all threshold values and their contexts
- [ ] Understand the difference between Plex and Tidal approaches
- [ ] Identify all hardcoded arrays and processing steps

**During implementation:**
- [ ] Test each change incrementally
- [ ] Maintain running comparison tests with current logic
- [ ] Document any ambiguities or edge cases discovered
- [ ] Validate configuration schema covers all current functionality

**Before completion:**
- [ ] Run comprehensive test suite comparing old vs new behavior
- [ ] Test all 9 instantiation points work correctly
- [ ] Verify web interface loads and saves configuration properly
- [ ] Test edge cases and error scenarios
- [ ] Confirm performance impact is acceptable

---

## Final Implementation Notes

### Lean & Clean Principles

Remember the codebase follows "Lean & Clean" principles:
- Don't over-engineer the solution
- Keep configuration schema simple but complete
- Avoid unnecessary abstractions
- Maintain existing code patterns where possible

### Migration Strategy

Since this is a "fresh build" with no backwards compatibility:
- No migration utilities needed
- Default config must work immediately
- Can remove old hardcoded logic entirely once new system is proven

### Error Handling Philosophy

Based on existing code patterns:
- Graceful degradation when config is invalid
- Console logging for debugging
- Fallback to defaults when possible
- Don't break existing functionality

---

## 🚨 FINAL REMINDER

This document is a **starting point for your analysis**, not a complete implementation guide. You must:

1. **Conduct your own thorough code review** of all mentioned files
2. **Verify every detail** of the current logic through independent analysis  
3. **Design your own implementation** that makes sense for the codebase architecture
4. **Test rigorously** to ensure zero functionality loss
5. **Think critically** about the proposed approaches and improve them as needed

The success of this refactor depends on your careful analysis and implementation, not on following this guide blindly. Use this as a framework for your investigation, but trust your own analysis of the code.