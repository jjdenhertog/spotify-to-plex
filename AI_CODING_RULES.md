# AI Coding Rules for Spotify to Plex

## CRITICAL: These rules MUST be followed when generating code for this project

### React Event Handlers - ALWAYS Use useCallback

❌ **NEVER DO THIS:**
```jsx
// BAD - Direct arrow function
<button onClick={() => handleClick()}>Click</button>

// BAD - Inline function
<button onClick={function() { handleClick() }}>Click</button>

// BAD - Even for simple state setters
<button onClick={() => setOpen(true)}>Open</button>
```

✅ **ALWAYS DO THIS:**
```jsx
// GOOD - useCallback for all event handlers
const handleClick = useCallback(() => {
  // handler logic
}, [dependencies])

<button onClick={handleClick}>Click</button>

// GOOD - Even for simple state changes
const handleOpen = useCallback(() => {
  setOpen(true)
}, [])

<button onClick={handleOpen}>Open</button>
```

### Conditional Rendering - Prevent Leaked Renders

❌ **NEVER DO THIS:**
```jsx
// BAD - Can leak 0 or false into render
{count && <div>{count}</div>}

// BAD - Can leak empty string
{text && <div>{text}</div>}

// BAD - Can leak NaN
{number && <div>{number}</div>}
```

✅ **ALWAYS DO THIS:**
```jsx
// GOOD - Double negation for booleans
{!!count && <div>{count}</div>}

// GOOD - Explicit boolean check
{count > 0 && <div>{count}</div>}

// GOOD - Ternary for fallback
{text ? <div>{text}</div> : null}

// GOOD - Double negation for strings
{!!text && <div>{text}</div>}
```

### Array Map Handlers

When using `.map()` and needing to pass parameters to handlers:

❌ **NEVER DO THIS:**
```jsx
{items.map(item => (
  <button onClick={() => handleClick(item.id)}>
    {item.name}
  </button>
))}
```

✅ **ALWAYS DO THIS:**
```jsx
// Option 1: Create a component
const ItemButton = memo(({ item, onItemClick }) => {
  const handleClick = useCallback(() => {
    onItemClick(item.id)
  }, [item.id, onItemClick])
  
  return <button onClick={handleClick}>{item.name}</button>
})

// Option 2: Data attributes (for simple cases)
const handleItemClick = useCallback((e) => {
  const itemId = e.currentTarget.dataset.itemId
  // handle click with itemId
}, [])

{items.map(item => (
  <button 
    key={item.id}
    data-item-id={item.id}
    onClick={handleItemClick}
  >
    {item.name}
  </button>
))}
```

### Component Optimization

✅ **ALWAYS:**
- Use `memo()` for functional components that receive props
- Use `useCallback()` for ALL function props passed to child components
- Use `useMemo()` for expensive computations
- Add proper dependencies to all hooks

```jsx
// GOOD - Optimized component
const MyComponent = memo(({ data, onUpdate }) => {
  const processedData = useMemo(() => {
    return expensiveProcessing(data)
  }, [data])
  
  const handleUpdate = useCallback((value) => {
    onUpdate(value)
  }, [onUpdate])
  
  return <ChildComponent data={processedData} onUpdate={handleUpdate} />
})
```

### State Updates

✅ **ALWAYS:**
- Use functional updates when new state depends on previous state
- Destructure state setters properly

```jsx
// GOOD - Functional update
const handleIncrement = useCallback(() => {
  setCount(prev => prev + 1)
}, [])

// GOOD - Proper destructuring
const [value, setValue] = useState(initialValue)
// If setter is unused, prefix with underscore
const [loading, _setLoading] = useState(false)
```

### Props Destructuring

✅ **ALWAYS:**
- Destructure props at the top of functional components
- Avoid accessing props directly in the component body

```jsx
// GOOD
function MyComponent(props) {
  const { title, onClose, data } = props
  // use title, onClose, data
}

// BETTER
function MyComponent({ title, onClose, data }) {
  // use directly
}
```

## ESLint Will Enforce These Rules

The ESLint configuration is set up to catch violations of these patterns:
- `react/jsx-no-bind`: Prevents inline functions
- `react/jsx-no-leaked-render`: Prevents render leaks
- `react/hook-use-state`: Ensures proper useState destructuring
- `react/destructuring-assignment`: Enforces props destructuring
- `react/require-optimization`: Requires component optimization

## When Writing New Code

1. **ALWAYS** run `pnpm run lint` before committing
2. **NEVER** disable ESLint rules without explicit user permission
3. **ALWAYS** use `useCallback` for event handlers
4. **ALWAYS** use `!!variable` for conditional rendering with non-booleans
5. **ALWAYS** destructure props and state properly

## For AI Code Generators

When generating React code for this project:
1. Check if the component needs event handlers → use `useCallback`
2. Check if there's conditional rendering → use `!!` or explicit boolean checks
3. Check if passing functions as props → wrap in `useCallback`
4. Check if the component receives props → consider using `memo()`
5. Run ESLint mentally before outputting code