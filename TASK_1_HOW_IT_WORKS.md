# Task 1: Create "How It Works" Tab Component

## Objective
Create an educational overview tab that explains how the music search configuration system works, with visual diagrams and clear explanations.

## Context
Users need to understand how Text Processing, Search Approaches, and Match Filters work together before configuring them. This tab provides that foundation.

## Implementation Requirements

### 1. Create HowItWorksTab Component

**File**: `src/components/HowItWorksTab.tsx`

#### Component Structure
```typescript
// Follow CODING_GUIDELINES.md requirements:
// - Default export for React component
// - Functional component only
// - Props destructuring required
// - useCallback for ALL event handlers
// - !! for conditional rendering

export default function HowItWorksTab() {
    // Component implementation
    return (
        <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
            {/* Content sections */}
        </Box>
    );
}
```

### 2. Content Structure

#### Section 1: System Overview
```typescript
<Typography variant="h5" sx={{ mb: 2 }}>
    How Music Search Configuration Works
</Typography>
<Typography variant="body1" sx={{ mb: 3 }}>
    The music search system uses three interconnected configurations to find the best matches 
    between Spotify and Plex tracks. Each plays a specific role in the matching process.
</Typography>
```

#### Section 2: Visual Flow Diagram
Create a visual representation using Material-UI components:

```typescript
// Use Paper, Box, Typography, and ArrowForward icons to create:
// [Spotify Track] → [Text Processing] → [Search Approaches] → [Match Filters] → [Plex Match]

<Paper variant="outlined" sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
    <Typography variant="h6" sx={{ mb: 2 }}>Processing Flow</Typography>
    
    {/* Visual flow using Box components and arrows */}
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <ProcessingStep 
            title="Original Track"
            content="Song Title (Remaster)"
            color="info"
        />
        <ArrowForwardIcon />
        <ProcessingStep 
            title="Text Processing"
            content="Applies rules based on approach"
            color="warning"
        />
        <ArrowForwardIcon />
        <ProcessingStep 
            title="Match Filters"
            content="Finds best strategy"
            color="success"
        />
    </Box>
</Paper>
```

#### Section 3: Component Explanations

**Text Processing Rules** (What to process):
```typescript
<Typography variant="h6" sx={{ mb: 1 }}>1. Text Processing Rules</Typography>
<Typography variant="body2" sx={{ mb: 2 }}>
    Defines WHAT words, quotes, and separators to handle when processing track titles.
</Typography>

<Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'blue.50' }}>
    <Typography variant="subtitle2" sx={{ mb: 1 }}>Example Configuration:</Typography>
    <Typography variant="body2" component="div">
        • Filter Out Words: "remaster", "radio edit", "single version"<br/>
        • Quote Characters: ', ", ´, `<br/>
        • Cut-off Separators: (, [, {, -
    </Typography>
</Paper>
```

**Search Approaches** (When to apply):
```typescript
<Typography variant="h6" sx={{ mb: 1 }}>2. Search Approaches</Typography>
<Typography variant="body2" sx={{ mb: 2 }}>
    Defines WHEN to apply the text processing rules. Each approach represents a different 
    combination of processing steps.
</Typography>

<Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'orange.50' }}>
    <Typography variant="subtitle2" sx={{ mb: 1 }}>Example Approaches:</Typography>
    <Typography variant="body2" component="div">
        • normal: No processing applied<br/>
        • filtered: Remove filter words and quotes<br/>
        • trimmed: Cut text at separators<br/>
        • filtered_trimmed: Both filtering and trimming
    </Typography>
</Paper>
```

**Match Filters** (Which approach to use):
```typescript
<Typography variant="h6" sx={{ mb: 1 }}>3. Match Filters</Typography>
<Typography variant="body2" sx={{ mb: 2 }}>
    Defines WHICH search approach to use based on matching patterns and similarity thresholds.
</Typography>

<Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'green.50' }}>
    <Typography variant="subtitle2" sx={{ mb: 1 }}>Example Filters:</Typography>
    <Typography variant="body2" component="div">
        • "artist:match AND title:contains" → Use specific approach<br/>
        • "artist:similarity>=0.8" → Use similarity matching
    </Typography>
</Paper>
```

#### Section 4: Real Example Walkthrough
```typescript
<Typography variant="h6" sx={{ mb: 2 }}>Example: Processing "Song Title (Remaster)"</Typography>

<TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
    <Table size="small">
        <TableHead>
            <TableRow>
                <TableCell><strong>Approach</strong></TableCell>
                <TableCell><strong>Processing Applied</strong></TableCell>
                <TableCell><strong>Result</strong></TableCell>
            </TableRow>
        </TableHead>
        <TableBody>
            <TableRow>
                <TableCell>normal</TableCell>
                <TableCell>No processing</TableCell>
                <TableCell>"Song Title (Remaster)"</TableCell>
            </TableRow>
            <TableRow>
                <TableCell>filtered</TableCell>
                <TableCell>Remove "Remaster"</TableCell>
                <TableCell>"Song Title ()"</TableCell>
            </TableRow>
            <TableRow>
                <TableCell>trimmed</TableCell>
                <TableCell>Cut at "("</TableCell>
                <TableCell>"Song Title "</TableCell>
            </TableRow>
            <TableRow>
                <TableCell>filtered_trimmed</TableCell>
                <TableCell>Both remove and cut</TableCell>
                <TableCell>"Song Title"</TableCell>
            </TableRow>
        </TableBody>
    </Table>
</TableContainer>
```

### 3. Helper Components

Create small helper components for reusability:

**ProcessingStep Component**:
```typescript
type ProcessingStepProps = {
    readonly title: string;
    readonly content: string;
    readonly color: 'info' | 'warning' | 'success' | 'error';
};

const ProcessingStep: React.FC<ProcessingStepProps> = ({ title, content, color }) => {
    return (
        <Paper 
            variant="outlined" 
            sx={{ 
                p: 2, 
                minWidth: 150, 
                textAlign: 'center',
                bgcolor: `${color}.50`,
                border: 2,
                borderColor: `${color}.200`
            }}
        >
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                {title}
            </Typography>
            <Typography variant="body2">
                {content}
            </Typography>
        </Paper>
    );
};
```

### 4. Required Imports
```typescript
import { 
    Box, 
    Typography, 
    Paper, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow 
} from '@mui/material';
import { ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import React from 'react';
```

### 5. Integration Requirements

#### Update main configuration page
In `pages/plex/music-search-config.tsx`:

1. **Add the new tab**:
```typescript
<Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }} variant="scrollable" scrollButtons="auto">
    <Tab label="How It Works" />  {/* Add this first */}
    <Tab label="Match Filters" />
    <Tab label="Text Processing" />
    <Tab label="Search Approaches" />
</Tabs>
```

2. **Update tab indices** (shift existing tabs by +1):
```typescript
{/* How It Works Tab - NEW */}
{tabValue === 0 && (
    <Card>
        <CardContent>
            <HowItWorksTab />
        </CardContent>
    </Card>
)}

{/* Match Filters Tab - was 0, now 1 */}
{tabValue === 1 && (
    <Card>
        <CardContent>
            <MatchFilterEditor />
        </CardContent>
    </Card>
)}
```

3. **Add import**:
```typescript
import HowItWorksTab from "@/components/HowItWorksTab";
```

### 6. CODING_GUIDELINES.md Compliance

#### Required Patterns
- ✅ **Default export** for React component
- ✅ **Functional component** only (no class components)
- ✅ **Props destructuring** if props are used
- ✅ **useCallback** for any event handlers (if needed)
- ✅ **!! conditional rendering** if conditionals are used
- ✅ **4-space indentation** throughout

#### File Organization
- ✅ **One component per file** - HowItWorksTab.tsx contains only HowItWorksTab
- ✅ **PascalCase file naming** - HowItWorksTab.tsx
- ✅ **NO 'src' in import paths** - Use @/components/HowItWorksTab

## Acceptance Criteria

### Functional Requirements
1. **Educational content** clearly explains the system
2. **Visual flow diagram** shows processing steps
3. **Real examples** demonstrate how configurations work together
4. **Responsive design** works on different screen sizes

### Technical Requirements  
1. **Zero ESLint errors** when following CODING_GUIDELINES.md
2. **TypeScript compliance** with proper types
3. **Material-UI consistency** with existing design patterns
4. **Performance optimization** using React.memo if needed

### Integration Requirements
1. **Tab integration** works seamlessly in main configuration page
2. **Proper routing** maintains tab state
3. **Consistent styling** matches existing tabs

## Implementation Notes

### Keep It Simple
- Use static content (no complex state management needed)
- Focus on clarity and education over interactivity
- Material-UI components provide sufficient styling

### Content Guidelines
- **Clear explanations** in simple language
- **Visual hierarchy** with proper heading levels  
- **Consistent terminology** matching other tabs
- **Practical examples** using real data

This task creates the foundation for user understanding before they configure the system.