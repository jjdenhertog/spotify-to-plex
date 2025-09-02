# Music Configuration Enhancement - Full Scope Overview

## Project Goal
Transform the current 3-tab music search configuration system into a more intuitive, integrated system with UI/JSON toggle capabilities and integrated testing.

## Current System Analysis

### Existing Files Structure
```
pages/plex/music-search-config.tsx           # Main configuration page (3 tabs)
pages/spotify/search-analyzer.tsx            # Separate testing page (TO BE REMOVED)
components/MatchFilterEditor.tsx              # Has UI/JSON toggle (working example)
components/TextProcessingEditor.tsx           # JSON-only (needs UI mode)
components/SearchApproachesEditor.tsx         # JSON-only (needs UI mode)
components/SearchAnalyzer.tsx                 # Testing component (TO BE MOVED)
```

### Current Data Relationships

**Text Processing Configuration** (WHAT to process):
```json
{
  "filterOutWords": ["original mix", "remaster", "radio edit", ...],
  "filterOutQuotes": ["'", "\"", "´", "`"],
  "cutOffSeparators": ["(", "[", "{", "-"]
}
```

**Search Approaches Configuration** (WHEN to apply processing):
```json
[
  { "id": "normal", "filtered": false, "trim": false },
  { "id": "filtered", "filtered": true, "trim": false, "removeQuotes": true },
  { "id": "trimmed", "filtered": false, "trim": true }
]
```

**Match Filters Configuration** (WHICH approach to use based on patterns):
```json
[
  "artist:match AND title:contains",
  "artist:similarity>=0.8"
]
```

### System Flow
```
Song Title: "Song Name (Remaster)"
    ↓
Text Processing Rules Applied Based on Search Approach:
    ├─ normal: "Song Name (Remaster)" (no processing)
    ├─ filtered: "Song Name ()" (removes "Remaster")
    ├─ trimmed: "Song Name " (cuts at "(")
    └─ filtered_trimmed: "Song Name" (both)
    ↓
Match Filters Determine Best Match Strategy:
    ├─ If artist:match AND title:contains → Use specific approach
    └─ If artist:similarity>=0.8 → Use similarity matching
    ↓
Final Result: Best matching Plex track
```

## New 4-Tab System Design

### Tab 1: "How It Works" 
- **Purpose**: Educational overview with visual flow diagram
- **Content**: Explains the relationship between all components
- **Implementation**: New component with static content and diagram

### Tab 2: "Text Processing & Search Approaches"
- **Purpose**: Combined editor for tightly-coupled configurations  
- **Features**: UI/JSON toggle for both configurations in one interface
- **Rationale**: These work together - combining reduces confusion

### Tab 3: "Match Filters" 
- **Purpose**: Configure when to use which approach
- **Features**: Enhanced UI/JSON toggle (already mostly working)
- **Improvements**: Use shared components for consistency

### Tab 4: "Test Configuration"
- **Purpose**: Integrated testing with immediate feedback
- **Features**: Move SearchAnalyzer here, add quick test buttons
- **Benefits**: Test configurations immediately after changes

## Key Implementation Principles

### Lean & Clean Approach
- **Minimal components** - Reuse existing Material-UI patterns
- **Compact layouts** - Avoid excessive vertical space  
- **Simple interactions** - No complex drag-and-drop
- **Shared infrastructure** - Common components across editors

### Technical Standards (from CODING_GUIDELINES.md)
- **useCallback for ALL event handlers** (ESLint enforced)
- **!! for conditional rendering** (prevent render leaks)
- **errorBoundary for ALL async operations** (required pattern)
- **One function per file** for utilities
- **NO 'src' in import paths** (full paths without 'src')
- **Complete refactors only** (no legacy compatibility)

## File Organization Strategy

### Shared Components (Reusable)
```
src/components/
├── EditorHeader.tsx              # Shared header for all editors
├── StringArrayChipEditor.tsx     # Reusable string array editor with chips
└── SearchApproachCard.tsx        # Individual approach configuration card
```

### Hooks (Shared Logic)
```
src/hooks/
└── useDualModeEditor.ts          # Common UI/JSON toggle logic
```

### Utility Functions (Following one-function-per-file rule)
```
src/utils/
├── textProcessing/
│   ├── convertTextProcessingJsonToUI.ts
│   └── convertTextProcessingUIToJson.ts
└── searchApproaches/
    ├── convertSearchApproachesJsonToUI.ts
    └── convertSearchApproachesUIToJson.ts
```

### New Tab Components
```
src/components/
├── HowItWorksTab.tsx                    # Educational overview
├── TextProcessingAndSearchEditor.tsx    # Combined editor
└── TestConfigurationTab.tsx             # Integrated testing
```

## Implementation Task Breakdown

The project is split into **4 manageable, independent tasks**:

1. **TASK_1_HOW_IT_WORKS.md** - Create educational overview tab
2. **TASK_2_COMBINED_EDITOR.md** - Build text processing & search approaches combined editor  
3. **TASK_3_MATCH_FILTERS.md** - Enhance match filters with shared components
4. **TASK_4_TEST_INTEGRATION.md** - Integrate testing and finalize navigation

Each task can be completed independently but should reference this overview for context and consistency.

## Success Criteria

### User Experience
- **Clear understanding** of how the system works through "How It Works" tab
- **Intuitive editing** with UI modes for all configurations
- **Immediate testing** capability within the configuration interface
- **Consistent patterns** across all editors

### Technical Quality  
- **Zero ESLint errors** - All coding guidelines followed
- **Shared components** - No duplicate code patterns
- **Type safety** - Proper TypeScript throughout
- **Performance** - Efficient rendering and state management

### Workflow Integration
- **Logical tab order** - Understand → Configure → Test
- **Contextual help** - Guidance where needed
- **Quick iteration** - Easy to test changes immediately

This overview provides the foundation for understanding the full scope while allowing each task to be implemented independently by different AI sessions.