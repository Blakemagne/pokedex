# From Zero to TypeScript Wizard: Building a Production-Ready CLI

**Table of Contents**
- [Introduction](#introduction)
- [Part 1: TypeScript Fundamentals](#part-1-typescript-fundamentals)
- [Part 2: The Type System](#part-2-the-type-system)
- [Part 3: Async JavaScript](#part-3-async-javascript)
- [Part 4: HTTP Clients and APIs](#part-4-http-clients-and-apis)
- [Part 5: Architecture Patterns](#part-5-architecture-patterns)
- [Part 6: State Management](#part-6-state-management)
- [Part 7: Caching Strategies](#part-7-caching-strategies)
- [Part 8: Testing](#part-8-testing)
- [Part 9: The Command Pattern](#part-9-the-command-pattern)
- [Part 10: REPL Construction](#part-10-repl-construction)
- [Part 11: ES Modules in TypeScript](#part-11-es-modules-in-typescript)
- [Part 12: Advanced Patterns](#part-12-advanced-patterns)
- [Conclusion](#conclusion)

---

## Introduction

This tutorial builds a complete Pokedex CLI application using TypeScript, teaching you production-ready patterns while creating something functional and educational. By the end, you'll understand:

- TypeScript's type system at a deep level
- How async/await actually works
- HTTP client patterns and error handling
- Caching strategies for performance
- Command-driven architecture
- Testing methodologies
- ES modules and their quirks

**Prerequisites:** Basic JavaScript knowledge (variables, functions, arrays, objects). No TypeScript experience required.

---

## Part 1: TypeScript Fundamentals

### What is TypeScript?

TypeScript is JavaScript with a type system. Every valid JavaScript program is valid TypeScript, but TypeScript adds the ability to describe what types of values your variables hold.

**JavaScript:**
```javascript
function add(a, b) {
  return a + b;
}

add(5, 3);     // 8
add("5", "3"); // "53" - probably not what you wanted
```

**TypeScript:**
```typescript
function add(a: number, b: number): number {
  return a + b;
}

add(5, 3);     // 8
add("5", "3"); // Error: Argument of type 'string' is not assignable to parameter of type 'number'
```

### Why Use TypeScript?

1. **Catch errors before runtime** - The compiler finds bugs before your code runs
2. **Self-documenting code** - Types serve as inline documentation
3. **Better tooling** - IDEs can provide accurate autocomplete and refactoring
4. **Confidence in refactoring** - Change code and the compiler tells you what broke

### The Compilation Process

TypeScript doesn't run directly. It compiles to JavaScript:

```
TypeScript (.ts) → TypeScript Compiler (tsc) → JavaScript (.js) → Node/Browser
```

**Why this matters:** When you write `import { foo } from "./bar.js"`, you're importing the *compiled output*, not the TypeScript source. This is why we use `.js` extensions even though the source is `.ts`.

### Setting Up TypeScript

**package.json:**
```json
{
  "type": "module",
  "devDependencies": {
    "typescript": "^5.7.3",
    "@types/node": "^22.10.5"
  }
}
```

- `"type": "module"` → Tells Node to use ES modules (import/export) instead of CommonJS (require/module.exports)
- `typescript` → The compiler
- `@types/node` → Type definitions for Node.js APIs (like `process`, `fs`, `readline`)

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "esnext",        // Compile to latest JavaScript
    "module": "esnext",        // Use ES modules
    "strict": true,            // Enable all strict type-checking
    "outDir": "./dist",        // Output directory for compiled files
    "rootDir": "./src",        // Source directory
    "moduleResolution": "Node", // How to resolve modules
    "esModuleInterop": true    // Allow default imports from CommonJS
  }
}
```

**Key setting:** `"strict": true` - This is crucial. It enables:
- `strictNullChecks` - `null` and `undefined` must be explicitly handled
- `noImplicitAny` - Can't use variables without declaring their type
- `strictFunctionTypes` - Function parameters are checked contravariantly
- And more...

---

## Part 2: The Type System

### Primitive Types

TypeScript has the same primitives as JavaScript:

```typescript
let isActive: boolean = true;
let count: number = 42;
let name: string = "Pikachu";
let missing: undefined = undefined;
let empty: null = null;
```

### Type Inference

TypeScript can often infer types without explicit annotations:

```typescript
let count = 42; // Inferred as number
count = "hello"; // Error: Type 'string' is not assignable to type 'number'
```

**When to annotate:**
- Function parameters (always)
- Function return types (best practice)
- When inference is wrong or unclear

### Arrays and Tuples

```typescript
// Array - homogeneous collection
let numbers: number[] = [1, 2, 3];
let words: Array<string> = ["hello", "world"]; // Alternative syntax

// Tuple - fixed-length array with specific types
let pair: [string, number] = ["age", 25];
pair[0]; // string
pair[1]; // number
pair[2]; // Error: Tuple type '[string, number]' of length '2' has no element at index '2'
```

### Objects and Interfaces

**Object type (inline):**
```typescript
let pokemon: { name: string; level: number } = {
  name: "Pikachu",
  level: 25
};
```

**Interface (reusable):**
```typescript
interface Pokemon {
  name: string;
  level: number;
  type?: string; // Optional property
}

let pikachu: Pokemon = {
  name: "Pikachu",
  level: 25
  // type is optional, can be omitted
};
```

**Type alias (similar to interface):**
```typescript
type Pokemon = {
  name: string;
  level: number;
  type?: string;
};
```

**Interface vs Type:**
- **Interface:** Can be extended, supports declaration merging
- **Type:** Can represent unions, intersections, primitives, mapped types

**Rule of thumb:** Use `interface` for object shapes, `type` for everything else.

### Union Types

A value can be one of several types:

```typescript
type Status = "active" | "inactive" | "pending";

let status: Status = "active"; // OK
status = "invalid"; // Error: Type '"invalid"' is not assignable to type 'Status'

function handleResult(result: string | number) {
  if (typeof result === "string") {
    console.log(result.toUpperCase()); // TypeScript knows it's a string here
  } else {
    console.log(result.toFixed(2)); // TypeScript knows it's a number here
  }
}
```

**Type narrowing:** TypeScript tracks which type a union value is through control flow.

### Literal Types

Specific values as types:

```typescript
type Direction = "north" | "south" | "east" | "west";

function move(direction: Direction) {
  // direction can only be one of the four strings
}

move("north"); // OK
move("up"); // Error
```

### Generics

Generics allow you to write reusable code that works with multiple types:

```typescript
// Without generics - have to write separate functions
function getFirstNumber(arr: number[]): number {
  return arr[0];
}

function getFirstString(arr: string[]): string {
  return arr[0];
}

// With generics - one function for all types
function getFirst<T>(arr: T[]): T {
  return arr[0];
}

let firstNum = getFirst([1, 2, 3]); // T is inferred as number
let firstStr = getFirst(["a", "b"]); // T is inferred as string
```

**How to read:** `<T>` is a type parameter. When you call `getFirst`, TypeScript substitutes `T` with the actual type.

**Real-world example from our project:**
```typescript
class Cache {
  #cache = new Map<string, CacheEntry<any>>();

  get<T>(key: string): T | undefined {
    const entry = this.#cache.get(key);
    if (!entry) {
      return undefined;
    }
    return entry.val as T;
  }
}

// Usage:
const pokemon = cache.get<Pokemon>("pikachu"); // Returns Pokemon | undefined
const location = cache.get<Location>("area-1"); // Returns Location | undefined
```

The caller specifies what type they expect back. Same function, different types.

### Type Assertions

Tell TypeScript to treat a value as a specific type:

```typescript
const data = await response.json(); // Type is 'any'
const pokemon = data as Pokemon; // Now TypeScript treats it as Pokemon
```

**When to use:** When you know more about a type than TypeScript can infer (e.g., parsing JSON from an API).

**Danger:** Type assertions don't validate data. If the API returns garbage, TypeScript won't catch it. Consider using runtime validation libraries like Zod for production code.

### Record Type

A utility type for creating objects with specific key/value types:

```typescript
// Record<KeyType, ValueType>
type PokemonByName = Record<string, Pokemon>;

const pokedex: PokemonByName = {
  "pikachu": { name: "pikachu", level: 25 },
  "charmander": { name: "charmander", level: 18 }
};

// Equivalent to:
type PokemonByName = {
  [key: string]: Pokemon;
};
```

**From our project:**
```typescript
export type State = {
  commands: Record<string, CLICommand>;  // Any string key -> CLICommand value
  pokedex: Record<string, Pokemon>;      // Pokemon name -> Pokemon object
};
```

### Function Types

Functions are values in JavaScript/TypeScript, and they have types:

```typescript
// Function declaration
function add(a: number, b: number): number {
  return a + b;
}

// Function as a type
type MathOperation = (a: number, b: number) => number;

const subtract: MathOperation = (a, b) => a - b;
const multiply: MathOperation = (a, b) => a * b;
```

**From our project:**
```typescript
export type CLICommand = {
  name: string;
  description: string;
  callback: (state: State, ...args: string[]) => Promise<void>;
};
```

This says `callback` is a function that:
- Takes a `State` and any number of `string` arguments
- Returns a `Promise` that resolves to `void` (no value)

### Rest Parameters (Variadic Functions)

Functions that accept any number of arguments:

```typescript
function sum(...numbers: number[]): number {
  return numbers.reduce((acc, n) => acc + n, 0);
}

sum(1, 2);          // 3
sum(1, 2, 3, 4, 5); // 15
```

**How it works:** `...numbers` collects all arguments into an array.

**From our project:**
```typescript
export type CLICommand = {
  callback: (state: State, ...args: string[]) => Promise<void>;
};

// Implementation:
async function commandCatch(state: State, ...args: string[]): Promise<void> {
  const pokemonName = args[0]; // First argument
}

// Call:
await commandCatch(state, "pikachu"); // args = ["pikachu"]
await commandCatch(state, "pikachu", "extra"); // args = ["pikachu", "extra"]
```

**Why use this:** Flexible function signatures. `commandExit` ignores args, `commandExplore` uses them. Same type works for both.

---

## Part 3: Async JavaScript

### The Problem: Synchronous Code Blocks

JavaScript is single-threaded. If you do something slow, everything stops:

```javascript
// This blocks for 3 seconds
function slowOperation() {
  const start = Date.now();
  while (Date.now() - start < 3000) {
    // Busy wait
  }
  return "done";
}

console.log("Starting...");
const result = slowOperation(); // UI freezes here
console.log(result);
console.log("Finished");
```

For I/O operations (network, file system, databases), blocking is unacceptable.

### Solution 1: Callbacks

```javascript
// Old way - callback hell
fetchUser(userId, (error, user) => {
  if (error) {
    console.error(error);
  } else {
    fetchPosts(user.id, (error, posts) => {
      if (error) {
        console.error(error);
      } else {
        fetchComments(posts[0].id, (error, comments) => {
          // This nesting gets absurd
        });
      }
    });
  }
});
```

**Problems:**
- Error handling is duplicated
- Hard to read (pyramid of doom)
- No way to wait for multiple operations

### Solution 2: Promises

A Promise is an object representing the eventual completion or failure of an async operation:

```javascript
// Promise states:
// 1. Pending - operation hasn't completed
// 2. Fulfilled - operation succeeded
// 3. Rejected - operation failed

fetch("https://api.example.com/user")
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error(error));
```

**Better, but still chaining:**
```javascript
fetch("/user")
  .then(response => response.json())
  .then(user => fetch(`/posts/${user.id}`))
  .then(response => response.json())
  .then(posts => fetch(`/comments/${posts[0].id}`))
  .then(response => response.json())
  .then(comments => console.log(comments))
  .catch(error => console.error(error));
```

### Solution 3: Async/Await

Syntactic sugar over Promises that makes async code look synchronous:

```typescript
async function fetchUserData() {
  try {
    const userResponse = await fetch("/user");
    const user = await userResponse.json();

    const postsResponse = await fetch(`/posts/${user.id}`);
    const posts = await postsResponse.json();

    const commentsResponse = await fetch(`/comments/${posts[0].id}`);
    const comments = await commentsResponse.json();

    console.log(comments);
  } catch (error) {
    console.error(error);
  }
}
```

**Key points:**
- `async` function always returns a Promise
- `await` pauses execution until the Promise resolves
- `try/catch` handles errors from any `await`

### Async Function Return Types

```typescript
// Without async
function getValue(): number {
  return 42;
}

// With async - automatically wraps return value in Promise
async function getValueAsync(): Promise<number> {
  return 42;
}

// These are equivalent:
async function example1(): Promise<number> {
  return 42;
}

function example2(): Promise<number> {
  return Promise.resolve(42);
}
```

**TypeScript requires:**
```typescript
async function fetchPokemon(): Promise<Pokemon> {
  // Must return Pokemon, TypeScript wraps it in Promise automatically
  const response = await fetch("/pokemon/pikachu");
  return await response.json(); // Returns Pokemon
}
```

### Common Mistake: Forgetting Await

```typescript
// WRONG
async function fetchData() {
  const data = fetch("/api"); // Returns Promise<Response>, not Response
  console.log(data); // Prints: Promise { <pending> }
  return data.json(); // Error: Property 'json' does not exist on type 'Promise<Response>'
}

// CORRECT
async function fetchData() {
  const response = await fetch("/api"); // Waits for Promise to resolve
  console.log(response); // Prints: Response object
  return await response.json(); // Returns the parsed data
}
```

**Mental model:** `await` unwraps a Promise. `Promise<T>` becomes `T`.

### Promise.all() - Parallel Execution

```typescript
// Sequential - takes 6 seconds
async function sequentialFetch() {
  const pokemon1 = await fetch("/pokemon/1"); // 2 seconds
  const pokemon2 = await fetch("/pokemon/2"); // 2 seconds
  const pokemon3 = await fetch("/pokemon/3"); // 2 seconds
  return [pokemon1, pokemon2, pokemon3];
}

// Parallel - takes 2 seconds
async function parallelFetch() {
  const [pokemon1, pokemon2, pokemon3] = await Promise.all([
    fetch("/pokemon/1"),
    fetch("/pokemon/2"),
    fetch("/pokemon/3")
  ]);
  return [pokemon1, pokemon2, pokemon3];
}
```

**Use when:** Operations don't depend on each other.

### Error Handling in Async Functions

```typescript
async function safeFetch(url: string): Promise<Pokemon | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Fetch failed:", error);
    return null; // Fallback value
  }
}
```

**Important:** Errors in async functions reject the returned Promise. Always handle them.

---

## Part 4: HTTP Clients and APIs

### Understanding REST APIs

REST (Representational State Transfer) uses HTTP methods to interact with resources:

- `GET` - Retrieve data (should not modify server state)
- `POST` - Create new resources
- `PUT` - Update existing resources
- `DELETE` - Remove resources

**PokeAPI example:**
- `GET /pokemon/pikachu` - Get Pikachu's data
- `GET /location-area/pastoria-city-area` - Get location data

### The Fetch API

Built into modern JavaScript, `fetch` makes HTTP requests:

```typescript
const response = await fetch("https://pokeapi.co/api/v2/pokemon/pikachu");
```

**Response object:**
```typescript
interface Response {
  ok: boolean;           // true if status 200-299
  status: number;        // HTTP status code (200, 404, 500, etc.)
  statusText: string;    // "OK", "Not Found", etc.
  headers: Headers;      // Response headers
  json(): Promise<any>;  // Parse JSON body
  text(): Promise<string>; // Get raw text body
}
```

### Critical: Fetch Doesn't Reject on HTTP Errors

```typescript
// WRONG - doesn't handle HTTP errors
async function fetchPokemon(name: string) {
  try {
    const response = await fetch(`/pokemon/${name}`);
    return await response.json();
  } catch (error) {
    console.error("Error:", error); // Only catches network failures!
  }
}

// If the API returns 404, this DOESN'T throw
// response.json() will try to parse the 404 error page
```

**CORRECT - check response.ok:**
```typescript
async function fetchPokemon(name: string): Promise<Pokemon> {
  const response = await fetch(`/pokemon/${name}`);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}
```

**From our project:**
```typescript
async fetchPokemon(pokemonName: string): Promise<Pokemon> {
  const url = `${PokeAPI.baseURL}/pokemon/${pokemonName}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = (await response.json()) as Pokemon;
  return data;
}
```

### Typing API Responses

`response.json()` returns `Promise<any>`. You must type it:

```typescript
// Define the shape of the API response
export type Pokemon = {
  id: number;
  name: string;
  base_experience: number;
  height: number;
  weight: number;
  stats: Array<{
    base_stat: number;
    stat: { name: string };
  }>;
};

// Type the response
async fetchPokemon(name: string): Promise<Pokemon> {
  const response = await fetch(`/pokemon/${name}`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = (await response.json()) as Pokemon;
  return data;
}
```

**How to create types from API docs:**
1. Read the API documentation
2. Make a test request and inspect the JSON
3. Create a TypeScript type matching the structure
4. Only include fields you need

**Example - PokeAPI Pokemon endpoint:**
```json
{
  "id": 25,
  "name": "pikachu",
  "base_experience": 112,
  "height": 4,
  "weight": 60,
  "stats": [
    {
      "base_stat": 35,
      "stat": { "name": "hp" }
    }
  ]
}
```

**Corresponding type:**
```typescript
export type Pokemon = {
  id: number;
  name: string;
  base_experience: number;
  height: number;
  weight: number;
  stats: Array<{
    base_stat: number;
    stat: { name: string };
  }>;
};
```

### Query Parameters

APIs often use query parameters for pagination, filtering:

```
https://pokeapi.co/api/v2/location-area?offset=20&limit=20
```

**In TypeScript:**
```typescript
async fetchLocations(offset: number = 0, limit: number = 20): Promise<LocationList> {
  const url = `${this.baseURL}/location-area?offset=${offset}&limit=${limit}`;
  const response = await fetch(url);
  // ...
}
```

**Better - using URLSearchParams:**
```typescript
async fetchLocations(offset: number = 0, limit: number = 20): Promise<LocationList> {
  const params = new URLSearchParams({
    offset: offset.toString(),
    limit: limit.toString()
  });
  const url = `${this.baseURL}/location-area?${params}`;
  const response = await fetch(url);
  // ...
}
```

### Pagination Pattern

APIs return paginated data with links to next/previous pages:

```json
{
  "count": 1000,
  "next": "https://pokeapi.co/api/v2/location-area?offset=40&limit=20",
  "previous": "https://pokeapi.co/api/v2/location-area?offset=0&limit=20",
  "results": [...]
}
```

**Type it:**
```typescript
export type ShallowLocations = {
  count: number;
  next: string | null;    // null when on last page
  previous: string | null; // null when on first page
  results: Array<{
    name: string;
    url: string;
  }>;
};
```

**From our project - using next/previous URLs:**
```typescript
async fetchLocations(pageURL?: string): Promise<ShallowLocations> {
  const url = pageURL || `${PokeAPI.baseURL}/location-area?offset=0&limit=20`;
  // If pageURL provided, use it; otherwise start at first page

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return (await response.json()) as ShallowLocations;
}

// Usage:
const page1 = await api.fetchLocations(); // First page
const page2 = await api.fetchLocations(page1.next); // Next page
const page1Again = await api.fetchLocations(page2.previous); // Previous page
```

---

## Part 5: Architecture Patterns

### The Single Responsibility Principle

Each module should have one reason to change:

**Bad - everything in one file:**
```typescript
// pokemon.ts - does too much
class Pokemon {
  fetchFromAPI() { /* ... */ }
  saveToDatabase() { /* ... */ }
  displayInUI() { /* ... */ }
  validateInput() { /* ... */ }
}
```

**Good - separated concerns:**
```
api/pokeapi.ts       - API communication
models/pokemon.ts    - Data structures
commands/catch.ts    - Business logic
ui/display.ts        - Presentation
```

### Layer Architecture

Our project uses a layered architecture:

```
┌─────────────────┐
│  Commands       │ ← Business logic (catch, explore, inspect)
├─────────────────┤
│  API Client     │ ← HTTP requests, caching
├─────────────────┤
│  State          │ ← Application state
├─────────────────┤
│  REPL           │ ← User interface
└─────────────────┘
```

**Flow:**
1. User types command → REPL parses it
2. REPL calls command function → Command executes logic
3. Command calls API client → API fetches data
4. Command updates state → State stores data
5. Command prints output → User sees result

### Dependency Injection

Instead of creating dependencies inside a function, pass them in:

**Bad - hard to test:**
```typescript
function commandCatch(pokemonName: string) {
  const api = new PokeAPI(); // Hardcoded dependency
  const pokemon = await api.fetchPokemon(pokemonName);
  // ...
}
```

**Good - dependencies injected:**
```typescript
function commandCatch(state: State, pokemonName: string) {
  const pokemon = await state.pokeapi.fetchPokemon(pokemonName);
  // state.pokeapi can be mocked for testing
}
```

**From our project:**
```typescript
export type State = {
  pokeapi: PokeAPI;  // Injected dependency
  pokedex: Record<string, Pokemon>;
  // ...
};

// Commands receive State, use whatever they need
async function commandCatch(state: State, ...args: string[]): Promise<void> {
  const pokemon = await state.pokeapi.fetchPokemon(args[0]);
  state.pokedex[pokemon.name] = pokemon;
}
```

### Command Pattern

Encapsulate requests as objects:

```typescript
// Command interface
type Command = {
  name: string;
  description: string;
  execute: (state: State, ...args: string[]) => Promise<void>;
};

// Command registry
const commands: Record<string, Command> = {
  "catch": {
    name: "catch",
    description: "Catch a Pokemon",
    execute: commandCatch
  },
  "explore": {
    name: "explore",
    description: "Explore an area",
    execute: commandExplore
  }
};

// Dispatcher
async function dispatch(commandName: string, state: State, args: string[]) {
  const command = commands[commandName];
  if (command) {
    await command.execute(state, ...args);
  } else {
    console.log("Unknown command");
  }
}
```

**Benefits:**
- Easy to add new commands (just add to registry)
- Commands are isolated (can test independently)
- Help text auto-generated from registry

### Factory Pattern

Create objects without specifying exact class:

```typescript
// From our project
export function initState(): State {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "Pokedex > ",
  });

  return {
    rl,
    commands: getCommands(),
    pokeapi: new PokeAPI(),
    nextLocationsURL: null,
    prevLocationsURL: null,
    pokedex: {},
  };
}

// Usage
const state = initState(); // All setup hidden
startREPL(state);
```

**Why:** Centralized initialization. Change how State is created in one place.

---

## Part 6: State Management

### What is State?

State is data that changes over time:
- User's caught Pokemon (pokedex)
- Current pagination position (nextLocationsURL)
- Application configuration (commands, API client)

### Centralized vs Distributed State

**Distributed - state scattered everywhere:**
```typescript
// Global variables (bad)
let currentPage = 0;
let caughtPokemon = [];
let apiClient = new PokeAPI();

function commandMap() {
  currentPage++;
  // ...
}
```

**Centralized - state in one object:**
```typescript
type State = {
  currentPage: number;
  pokedex: Record<string, Pokemon>;
  pokeapi: PokeAPI;
};

function commandMap(state: State) {
  state.currentPage++;
  // ...
}
```

**Benefits of centralized state:**
- Easy to serialize (save/load)
- Clear data flow
- Easier to debug
- Can implement undo/redo

### Our State Design

```typescript
export type State = {
  rl: Interface;                    // Readline interface (UI)
  commands: Record<string, CLICommand>; // Command registry
  pokeapi: PokeAPI;                 // API client
  nextLocationsURL: string | null;  // Pagination state
  prevLocationsURL: string | null;
  pokedex: Record<string, Pokemon>; // User's caught Pokemon
};
```

**Categories:**
1. **Infrastructure:** `rl`, `commands`, `pokeapi` - Don't change during runtime
2. **Ephemeral:** `nextLocationsURL`, `prevLocationsURL` - Change with navigation
3. **User data:** `pokedex` - Persists across sessions (if we add save/load)

### Immutability vs Mutation

**Mutation (what we do):**
```typescript
async function commandCatch(state: State, pokemonName: string) {
  const pokemon = await state.pokeapi.fetchPokemon(pokemonName);
  state.pokedex[pokemonName] = pokemon; // Mutates state object
}
```

**Immutability (functional approach):**
```typescript
async function commandCatch(state: State, pokemonName: string): Promise<State> {
  const pokemon = await state.pokeapi.fetchPokemon(pokemonName);

  return {
    ...state,
    pokedex: {
      ...state.pokedex,
      [pokemonName]: pokemon
    }
  };
}
```

**Trade-offs:**
- **Mutation:** Simpler code, better performance
- **Immutability:** Easier to track changes, enables time-travel debugging

**Our choice:** Mutation, because:
- CLI app (no need for time-travel)
- Performance matters (caching)
- Simpler code for educational purposes

### State Initialization

```typescript
export function initState(): State {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "Pokedex > ",
  });

  const commands = getCommands();
  const pokeapi = new PokeAPI();

  return {
    rl,
    commands,
    pokeapi,
    nextLocationsURL: null,
    prevLocationsURL: null,
    pokedex: {},
  };
}
```

**Why a function:** Encapsulation. Main doesn't need to know how State is created.

### Passing State Through the Application

Every command receives state:

```typescript
type CLICommand = {
  callback: (state: State, ...args: string[]) => Promise<void>;
};

// All commands follow this pattern
async function commandCatch(state: State, ...args: string[]): Promise<void> {
  // Use state.pokeapi to fetch
  // Update state.pokedex
}

async function commandExplore(state: State, ...args: string[]): Promise<void> {
  // Use state.pokeapi to fetch
  // No state updates needed
}
```

**Alternative (bad):** Global state
```typescript
// Don't do this
const globalState = initState();

function commandCatch(pokemonName: string) {
  // Uses global state
}
```

**Why bad:** Can't test without affecting global state, can't run multiple instances.

---

## Part 7: Caching Strategies

### Why Cache?

Every HTTP request:
- Takes time (100-500ms typical)
- Uses bandwidth
- Costs money (API rate limits)
- Feels slow to users

Caching stores responses so repeated requests are instant.

### Cache Invalidation - The Hard Problem

Phil Karlton: "There are only two hard things in Computer Science: cache invalidation and naming things."

**Problems:**
- How long to keep cached data?
- What if the server data changes?
- How much memory to use?

### Time-Based Expiration (Our Approach)

Simplest strategy: Keep data for X time, then discard it.

```typescript
type CacheEntry<T> = {
  createdAt: number; // Timestamp
  val: T;            // Cached value
};

class Cache {
  #cache = new Map<string, CacheEntry<any>>();
  #interval: number; // Time to live in milliseconds

  add<T>(key: string, val: T): void {
    this.#cache.set(key, {
      createdAt: Date.now(),
      val
    });
  }

  get<T>(key: string): T | undefined {
    const entry = this.#cache.get(key);
    if (!entry) {
      return undefined;
    }

    // Check if expired
    const age = Date.now() - entry.createdAt;
    if (age > this.#interval) {
      this.#cache.delete(key);
      return undefined;
    }

    return entry.val as T;
  }
}
```

**Our interval:** 5 minutes (300000ms). Pokemon data rarely changes, so this is safe.

### Automatic Cleanup (Reaping)

Problem: Expired entries sit in memory until accessed.

Solution: Periodic cleanup:

```typescript
class Cache {
  #reapIntervalId: NodeJS.Timeout | undefined;

  constructor(interval: number) {
    this.#interval = interval;
    this.#startReapLoop();
  }

  #reap(): void {
    const now = Date.now();
    const cutoff = now - this.#interval;

    for (const [key, entry] of this.#cache.entries()) {
      if (entry.createdAt < cutoff) {
        this.#cache.delete(key);
      }
    }
  }

  #startReapLoop(): void {
    this.#reapIntervalId = setInterval(() => {
      this.#reap();
    }, this.#interval);
  }

  stopReapLoop(): void {
    if (this.#reapIntervalId !== undefined) {
      clearInterval(this.#reapIntervalId);
      this.#reapIntervalId = undefined;
    }
  }
}
```

**setInterval:** Calls a function repeatedly with a delay.

**Why cleanup matters:** Memory leaks. Without it, cache grows forever.

### Cache Keys

Use URLs as keys:

```typescript
async fetchPokemon(pokemonName: string): Promise<Pokemon> {
  const url = `${PokeAPI.baseURL}/pokemon/${pokemonName}`;

  // Check cache
  const cached = this.cache.get<Pokemon>(url);
  if (cached) {
    return cached;
  }

  // Fetch and cache
  const response = await fetch(url);
  const data = await response.json();
  this.cache.add(url, data);
  return data;
}
```

**Why URLs:**
- Unique per resource
- Include query parameters automatically
- Same URL = same data (idempotent)

### Cache Hit vs Miss

```
User requests Pikachu
    ↓
Check cache with key "https://pokeapi.co/api/v2/pokemon/pikachu"
    ↓
  Found?
    ↙  ↘
  Yes    No
   ↓      ↓
Cache    Fetch from API
  Hit      ↓
   ↓     Store in cache
   ↓       ↓
Return to user
```

**Measuring effectiveness:**
```typescript
// Our logging
if (cached) {
  console.log("Cache hit for:", url);
  return cached;
}
console.log("Cache miss, fetching:", url);
```

**User experience:**
```
Pokedex > explore pastoria-city-area
Cache miss, fetching: https://pokeapi.co/api/v2/location-area/pastoria-city-area
[200ms delay]
Found Pokemon: ...

Pokedex > explore pastoria-city-area
Cache hit for: https://pokeapi.co/api/v2/location-area/pastoria-city-area
[instant]
Found Pokemon: ...
```

### Alternative Caching Strategies

**LRU (Least Recently Used):**
- Keep N most recently used items
- Evict oldest when full
- Good when memory is limited

**LFU (Least Frequently Used):**
- Keep N most frequently used items
- Track access count
- Good for "hot" data

**Write-Through:**
- Update cache when data changes
- Requires write operations to API

**Our choice:** Time-based expiration is simplest and works for read-only APIs.

### Private Class Fields

```typescript
class Cache {
  #cache = new Map<string, CacheEntry<any>>();
  #interval: number;
}
```

`#cache` is truly private (ECMAScript feature, not TypeScript):

```typescript
const cache = new Cache(5000);
cache.#cache; // SyntaxError: Private field '#cache' must be declared in an enclosing class
```

**vs TypeScript `private`:**
```typescript
class Cache {
  private cache: Map<string, any>;
}

// TypeScript: Error
// JavaScript (runtime): Works!
const cache = new Cache();
cache.cache; // Accessible at runtime
```

**Use `#` for real privacy.**

---

## Part 8: Testing

### Why Test?

1. **Catch bugs early** - Before users find them
2. **Document behavior** - Tests show how code should work
3. **Enable refactoring** - Change code confidently
4. **Regression prevention** - Ensure bugs don't come back

### Unit Testing Philosophy

Test one thing at a time in isolation:

**What to test:**
- Pure functions (same input = same output)
- Business logic
- Edge cases

**What not to test:**
- Implementation details
- Third-party libraries
- Trivial code

### Vitest Setup

Vitest is a fast unit test framework for Vite projects:

```bash
npm install -D vitest
```

**package.json:**
```json
{
  "scripts": {
    "test": "vitest --run"
  }
}
```

**File naming:** `*.test.ts` or `*.spec.ts`

### Test Structure

```typescript
import { describe, expect, test } from "vitest";

describe("feature name", () => {
  test("should do something specific", () => {
    // Arrange - set up test data
    const input = "hello world";

    // Act - execute the code
    const result = cleanInput(input);

    // Assert - verify the result
    expect(result).toEqual(["hello", "world"]);
  });
});
```

**Terminology:**
- `describe` - groups related tests
- `test` - individual test case
- `expect` - assertion

### Testing Our cleanInput Function

```typescript
export function cleanInput(input: string): string[] {
  return input.trim().toLowerCase().split(/\s+/);
}
```

**What to test:**
- Trims whitespace
- Converts to lowercase
- Splits on whitespace
- Handles multiple spaces

```typescript
import { describe, expect, test } from "vitest";
import { cleanInput } from "./repl";

describe("cleanInput", () => {
  test("should trim whitespace", () => {
    expect(cleanInput("  hello  ")).toEqual(["hello"]);
  });

  test("should convert to lowercase", () => {
    expect(cleanInput("HELLO")).toEqual(["hello"]);
  });

  test("should split on spaces", () => {
    expect(cleanInput("hello world")).toEqual(["hello", "world"]);
  });

  test("should handle multiple spaces", () => {
    expect(cleanInput("hello    world")).toEqual(["hello", "world"]);
  });
});
```

### Parametric Testing

Test same logic with different inputs:

```typescript
describe.each([
  { input: "  hello  ", expected: ["hello"] },
  { input: "HELLO WORLD", expected: ["hello", "world"] },
  { input: "hello    world", expected: ["hello", "world"] },
  { input: "Pikachu Charmander", expected: ["pikachu", "charmander"] }
])("cleanInput($input)", ({ input, expected }) => {
  test(`should return ${expected}`, () => {
    const actual = cleanInput(input);
    expect(actual).toEqual(expected);
  });
});
```

**Output:**
```
✓ cleanInput(  hello  ) > should return ["hello"]
✓ cleanInput(HELLO WORLD) > should return ["hello","world"]
✓ cleanInput(hello    world) > should return ["hello","world"]
✓ cleanInput(Pikachu Charmander) > should return ["pikachu","charmander"]
```

### Assertions

**Common matchers:**
```typescript
expect(value).toBe(other);           // Strict equality (===)
expect(value).toEqual(other);        // Deep equality (objects/arrays)
expect(value).toBeTruthy();          // Truthy value
expect(value).toBeFalsy();           // Falsy value
expect(value).toBeNull();            // null
expect(value).toBeUndefined();       // undefined
expect(value).toBeDefined();         // Not undefined
expect(array).toHaveLength(3);       // Array length
expect(string).toContain("text");    // String contains
expect(fn).toThrow();                // Function throws error
```

### Testing Async Code

Use `async/await` in tests:

```typescript
test("should fetch pokemon", async () => {
  const api = new PokeAPI();
  const pokemon = await api.fetchPokemon("pikachu");

  expect(pokemon.name).toBe("pikachu");
  expect(pokemon.id).toBe(25);
});
```

### Testing Time-Based Code

Our cache reaps old entries. How to test?

```typescript
test("should reap old entries after interval", async () => {
  const cache = new Cache(100); // 100ms interval

  cache.add("key1", "value1");
  expect(cache.get("key1")).toBe("value1"); // Present immediately

  // Wait for expiration + reap
  await new Promise((resolve) => setTimeout(resolve, 250));

  expect(cache.get("key1")).toBeUndefined(); // Gone after reaping

  cache.stopReapLoop(); // Cleanup
});
```

**`setTimeout` wrapped in Promise:** Allows `await` for delays.

### Test Lifecycle Hooks

```typescript
import { describe, test, beforeEach, afterEach } from "vitest";

describe("Cache", () => {
  let cache: Cache;

  beforeEach(() => {
    cache = new Cache(5000); // Runs before each test
  });

  afterEach(() => {
    cache.stopReapLoop(); // Runs after each test (cleanup)
  });

  test("should store values", () => {
    cache.add("key", "value");
    expect(cache.get("key")).toBe("value");
  });

  test("should return undefined for missing keys", () => {
    expect(cache.get("nonexistent")).toBeUndefined();
  });
});
```

**Why:** Ensure each test starts with clean state.

### What Makes a Good Test?

**FIRST principles:**
- **Fast** - Tests should run in milliseconds
- **Independent** - Tests don't depend on each other
- **Repeatable** - Same result every time
- **Self-validating** - Pass or fail, no manual checking
- **Timely** - Written close to the code

### Running Tests

```bash
npm run test
```

**Output:**
```
 RUN  v3.2.4 /home/user/pokedex

 ✓ src/repl.test.ts (6 tests) 9ms
 ✓ src/pokecache.test.ts (5 tests) 258ms

 Test Files  2 passed (2)
      Tests  11 passed (11)
   Start at  17:40:13
   Duration  697ms
```

**Failed test:**
```
 FAIL  src/repl.test.ts > cleanInput > should trim whitespace
AssertionError: expected [ 'hello  ' ] to deeply equal [ 'hello' ]
```

Fix the code, re-run tests, repeat until green.

---

## Part 9: The Command Pattern

### Problem: Adding Features

**Without pattern:**
```typescript
function handleInput(input: string) {
  const words = input.split(" ");
  const command = words[0];

  if (command === "catch") {
    // 20 lines of code
  } else if (command === "explore") {
    // 30 lines of code
  } else if (command === "inspect") {
    // 15 lines of code
  } else if (command === "map") {
    // 25 lines of code
  } else if (command === "mapb") {
    // 25 lines of code
  }
  // 100+ line function
}
```

**Problems:**
- One giant function
- Hard to test individual commands
- Hard to add new commands
- No help text

### Solution: Command Pattern

Encapsulate each command as an object:

```typescript
type CLICommand = {
  name: string;
  description: string;
  callback: (state: State, ...args: string[]) => Promise<void>;
};
```

**Command registry:**
```typescript
const commands: Record<string, CLICommand> = {
  catch: {
    name: "catch",
    description: "Attempt to catch a Pokemon",
    callback: commandCatch
  },
  explore: {
    name: "explore",
    description: "Explore a location area to find Pokemon",
    callback: commandExplore
  }
};
```

**Dispatcher:**
```typescript
async function executeCommand(
  commandName: string,
  state: State,
  args: string[]
) {
  const command = state.commands[commandName];

  if (command) {
    await command.callback(state, ...args);
  } else {
    console.log("Unknown command");
  }
}
```

### Benefits

**1. Easy to add commands:**
```typescript
// Just create a new file
export async function commandPokedex(state: State): Promise<void> {
  console.log("Your Pokedex:");
  for (const name of Object.keys(state.pokedex)) {
    console.log(` - ${name}`);
  }
}

// Register it
commands.pokedex = {
  name: "pokedex",
  description: "List all caught Pokemon",
  callback: commandPokedex
};
```

**2. Auto-generated help:**
```typescript
export async function commandHelp(state: State): Promise<void> {
  console.log("Welcome to the Pokedex!");
  console.log("Usage:\n");

  for (const cmd of Object.values(state.commands)) {
    console.log(`${cmd.name}: ${cmd.description}`);
  }
}
```

**3. Isolated testing:**
```typescript
test("catch command should add to pokedex", async () => {
  const state = createMockState();
  await commandCatch(state, "pikachu");

  expect(state.pokedex.pikachu).toBeDefined();
});
```

**4. Commands in separate files:**
```
src/
  command_catch.ts
  command_explore.ts
  command_inspect.ts
  command_map.ts
  command_mapb.ts
  command_pokedex.ts
```

Each file: 20-40 lines, focused on one thing.

### Variadic Command Arguments

Different commands need different arguments:

```typescript
// No arguments
async function commandHelp(state: State): Promise<void> { }

// One argument
async function commandCatch(state: State, ...args: string[]): Promise<void> {
  const pokemonName = args[0];
}

// One argument
async function commandExplore(state: State, ...args: string[]): Promise<void> {
  const locationName = args[0];
}
```

**Uniform signature:**
```typescript
type CLICommand = {
  callback: (state: State, ...args: string[]) => Promise<void>;
};
```

**Why `...args`:** Some commands ignore it, others use it. Same type works for both.

### Command Validation

```typescript
export async function commandCatch(
  state: State,
  ...args: string[]
): Promise<void> {
  if (args.length === 0) {
    console.log("Usage: catch <pokemon-name>");
    return;
  }

  const pokemonName = args[0];
  // ...
}
```

Always validate before executing.

### Command Factory

Centralize command creation:

```typescript
export function getCommands(): Record<string, CLICommand> {
  return {
    help: {
      name: "help",
      description: "Displays a help message",
      callback: commandHelp,
    },
    exit: {
      name: "exit",
      description: "Exit the Pokedex",
      callback: commandExit,
    },
    catch: {
      name: "catch",
      description: "Attempt to catch a Pokemon",
      callback: commandCatch,
    },
    // ... more commands
  };
}
```

**Usage:**
```typescript
const state = {
  commands: getCommands(),
  // ...
};
```

One place to see all commands. Easy to modify.

### Error Handling in Commands

```typescript
async function executeCommand(
  commandName: string,
  state: State,
  args: string[]
) {
  const command = state.commands[commandName];

  if (command) {
    try {
      await command.callback(state, ...args);
    } catch (error) {
      console.error("Error executing command:", error);
    }
  } else {
    console.log("Unknown command");
  }
}
```

Errors in one command don't crash the REPL.

---

## Part 10: REPL Construction

### What is a REPL?

**R**ead-**E**valuate-**P**rint **L**oop:
1. **Read** user input
2. **Evaluate** (parse and execute)
3. **Print** output
4. **Loop** back to step 1

Examples: Node.js REPL, Python interpreter, Bash shell.

### Node.js readline Module

```typescript
import { createInterface } from "readline";

const rl = createInterface({
  input: process.stdin,   // Read from terminal input
  output: process.stdout, // Write to terminal output
  prompt: "Pokedex > "    // Text shown before input
});
```

**`process.stdin`:** Standard input stream (keyboard)
**`process.stdout`:** Standard output stream (screen)

### Event-Driven Input

readline is event-based:

```typescript
rl.on("line", (line) => {
  // Called when user presses Enter
  console.log(`You typed: ${line}`);
});

rl.prompt(); // Show the prompt
```

**Flow:**
1. `rl.prompt()` displays "Pokedex > "
2. User types "catch pikachu"
3. User presses Enter
4. `line` event fires with "catch pikachu"
5. Callback executes
6. Call `rl.prompt()` again for next input

### Parsing Input

```typescript
export function cleanInput(input: string): string[] {
  return input.trim().toLowerCase().split(/\s+/);
}

// "  CATCH Pikachu  " → ["catch", "pikachu"]
```

**Steps:**
1. `trim()` - Remove leading/trailing whitespace
2. `toLowerCase()` - Case-insensitive commands
3. `split(/\s+/)` - Split on any whitespace sequence

### Command Dispatch

```typescript
rl.on("line", async (line) => {
  const words = cleanInput(line);

  if (words.length === 0) {
    rl.prompt();
    return;
  }

  const commandName = words[0];
  const args = words.slice(1);
  const command = state.commands[commandName];

  if (command) {
    try {
      await command.callback(state, ...args);
    } catch (error) {
      console.error("Error executing command:", error);
    }
  } else {
    console.log("Unknown command");
  }

  rl.prompt();
});
```

**`words.slice(1)`:** Everything after the command name.

Example: `"catch pikachu"` → `["catch", "pikachu"]` → `commandName = "catch"`, `args = ["pikachu"]`

### Async Command Execution

```typescript
rl.on("line", async (line) => {
  // Callback is async
  const command = state.commands[commandName];
  await command.callback(state, ...args); // Must await
  rl.prompt();
});
```

**Why `async`:** Commands make HTTP requests (async), we must wait for them to complete.

**What happens without `await`:**
```typescript
rl.on("line", (line) => {
  command.callback(state, ...args); // Returns Promise, doesn't wait
  rl.prompt(); // Shown immediately, before command finishes
});
```

Prompt appears before output, looks broken.

### Graceful Exit

```typescript
export async function commandExit(state: State): Promise<void> {
  console.log("Closing the Pokedex... Goodbye!");
  state.rl.close(); // Stop listening for input
  process.exit(0);  // Exit with success code
}
```

**`rl.close()`:** Cleanup readline resources
**`process.exit(0)`:** 0 = success, non-zero = error

### Empty Input Handling

```typescript
const words = cleanInput(line);

if (words.length === 0) {
  rl.prompt();
  return;
}
```

User presses Enter with no input → Show prompt again.

### Full REPL Implementation

```typescript
import type { State } from "./state.js";

export function cleanInput(input: string): string[] {
  return input.trim().toLowerCase().split(/\s+/);
}

export function startREPL(state: State): void {
  state.rl.prompt();

  state.rl.on("line", async (line) => {
    const words = cleanInput(line);

    if (words.length === 0) {
      state.rl.prompt();
      return;
    }

    const commandName = words[0];
    const args = words.slice(1);
    const command = state.commands[commandName];

    if (command) {
      try {
        await command.callback(state, ...args);
      } catch (error) {
        console.error("Error executing command:", error);
      }
    } else {
      console.log("Unknown command");
    }

    state.rl.prompt();
  });
}
```

Entire REPL: ~30 lines.

### Testing the REPL

Bash can simulate user input:

```bash
printf "help\ncatch pikachu\nexit\n" | npm run dev
```

- `printf "help\ncatch pikachu\nexit\n"` - Three lines of input
- `|` - Pipe to stdin
- `npm run dev` - Start REPL

REPL receives:
1. "help"
2. "catch pikachu"
3. "exit"

As if user typed them.

---

## Part 11: ES Modules in TypeScript

### CommonJS vs ES Modules

**CommonJS (old Node.js):**
```javascript
// Import
const { readFile } = require('fs');

// Export
module.exports = { myFunction };
```

**ES Modules (modern JavaScript):**
```typescript
// Import
import { readFile } from 'fs';

// Export
export { myFunction };
```

### Enabling ES Modules

**package.json:**
```json
{
  "type": "module"
}
```

This tells Node.js to treat `.js` files as ES modules.

### The .js Extension Mystery

In TypeScript with ES modules:

```typescript
// main.ts
import { startREPL } from "./repl.js"; // Note: .js, not .ts!
```

**Why `.js`:**
1. TypeScript compiles `repl.ts` → `repl.js`
2. Node.js runs the compiled `repl.js`
3. Imports must reference the runtime file, not source

**Common mistake:**
```typescript
import { startREPL } from "./repl"; // Error: Cannot find module
import { startREPL } from "./repl.ts"; // Error: Unknown file extension
```

**Correct:**
```typescript
import { startREPL } from "./repl.js"; // ✓
```

### Type-Only Imports

Import only the type, removed during compilation:

```typescript
import type { Pokemon } from "./pokeapi.js";

// Pokemon is only used for type checking, not at runtime
let myPokemon: Pokemon;
```

**Why:** Prevents circular dependencies, smaller bundle size.

**vs regular import:**
```typescript
import { Pokemon } from "./pokeapi.js";

// Imports both the type AND any runtime code from pokeapi.js
```

### Named vs Default Exports

**Named exports (recommended):**
```typescript
// pokemon.ts
export function catchPokemon() { }
export type Pokemon = { };

// main.ts
import { catchPokemon, type Pokemon } from "./pokemon.js";
```

**Default exports:**
```typescript
// pokemon.ts
export default function catchPokemon() { }

// main.ts
import catchPokemon from "./pokemon.js";
```

**Why prefer named:**
- Explicit imports (know what you're getting)
- Better refactoring (IDE knows what's used)
- No naming confusion (default can be renamed)

### Module Resolution

**TypeScript config:**
```json
{
  "compilerOptions": {
    "moduleResolution": "Node"
  }
}
```

Tells TypeScript to resolve modules like Node.js:
1. Check `./file.js`
2. Check `./file/index.js`
3. Check `node_modules/package/`

### Circular Dependencies

**Problem:**
```typescript
// a.ts
import { b } from "./b.js";
export const a = "A" + b;

// b.ts
import { a } from "./a.js";
export const b = "B" + a;
```

Error: Can't resolve circular reference.

**Solution:** Extract shared code to third file:
```typescript
// shared.ts
export const shared = "shared";

// a.ts
import { shared } from "./shared.js";
export const a = "A" + shared;

// b.ts
import { shared } from "./shared.js";
export const b = "B" + shared;
```

### Tree Shaking

ES modules enable tree shaking (dead code elimination):

```typescript
// utils.ts
export function used() { }
export function unused() { }

// main.ts
import { used } from "./utils.js";
```

Bundler removes `unused()` from final bundle.

**Doesn't work with CommonJS** (dynamic imports prevent static analysis).

---

## Part 12: Advanced Patterns

### Generic Constraints

Limit what types can be used with a generic:

```typescript
// Any type
function getProperty<T>(obj: T, key: string) {
  return obj[key]; // Error: T might not have index signature
}

// Constrained
function getProperty<T extends object>(obj: T, key: keyof T) {
  return obj[key]; // OK: T must be an object
}

const pokemon = { name: "Pikachu", level: 25 };
getProperty(pokemon, "name"); // OK
getProperty(pokemon, "invalid"); // Error: "invalid" is not a key of pokemon
```

**`keyof T`:** Union of all keys in T.

### Mapped Types

Transform one type into another:

```typescript
type Pokemon = {
  name: string;
  level: number;
};

// Make all properties optional
type PartialPokemon = {
  [K in keyof Pokemon]?: Pokemon[K];
};
// Same as: { name?: string; level?: number; }

// Built-in utility type
type PartialPokemon = Partial<Pokemon>;
```

**Common utilities:**
- `Partial<T>` - All properties optional
- `Required<T>` - All properties required
- `Readonly<T>` - All properties readonly
- `Pick<T, K>` - Select specific properties
- `Omit<T, K>` - Remove specific properties

### Discriminated Unions

Type-safe state machines:

```typescript
type Success = {
  status: "success";
  data: Pokemon;
};

type Loading = {
  status: "loading";
};

type Error = {
  status: "error";
  message: string;
};

type FetchState = Success | Loading | Error;

function handleState(state: FetchState) {
  switch (state.status) {
    case "success":
      console.log(state.data); // TypeScript knows state.data exists
      break;
    case "loading":
      console.log("Loading...");
      break;
    case "error":
      console.log(state.message); // TypeScript knows state.message exists
      break;
  }
}
```

**Discriminant:** Common property (`status`) that identifies the type.

### Template Literal Types

Build string types from patterns:

```typescript
type HTTPMethod = "GET" | "POST" | "PUT" | "DELETE";
type Route = "/pokemon" | "/location";

type Endpoint = `${HTTPMethod} ${Route}`;
// "GET /pokemon" | "GET /location" | "POST /pokemon" | ...

function callAPI(endpoint: Endpoint) {
  // endpoint must match the pattern
}

callAPI("GET /pokemon"); // OK
callAPI("GET /invalid"); // Error
```

### Conditional Types

Types that depend on a condition:

```typescript
type IsString<T> = T extends string ? "yes" : "no";

type A = IsString<string>; // "yes"
type B = IsString<number>; // "no"

// Practical example: Extract return type
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

function getPokemon(): Pokemon { /* ... */ }
type PokemonType = ReturnType<typeof getPokemon>; // Pokemon
```

**`infer R`:** Extract the return type into R.

### Decorators (Experimental)

Decorators modify classes/methods (TypeScript experimental feature):

```typescript
function log(target: any, key: string, descriptor: PropertyDescriptor) {
  const original = descriptor.value;

  descriptor.value = async function(...args: any[]) {
    console.log(`Calling ${key} with:`, args);
    const result = await original.apply(this, args);
    console.log(`Result:`, result);
    return result;
  };

  return descriptor;
}

class PokeAPI {
  @log
  async fetchPokemon(name: string): Promise<Pokemon> {
    // ...
  }
}
```

**Output:**
```
Calling fetchPokemon with: ["pikachu"]
Result: { name: "pikachu", ... }
```

**Enable in tsconfig.json:**
```json
{
  "compilerOptions": {
    "experimentalDecorators": true
  }
}
```

### Namespace Pattern (Deprecated)

Old way to organize code:

```typescript
namespace Pokemon {
  export interface Data {
    name: string;
  }

  export function catch(name: string) { }
}

Pokemon.catch("pikachu");
```

**Don't use:** ES modules are better. Namespaces were for pre-module TypeScript.

### Type Guards

Runtime checks that narrow types:

```typescript
function isPokemon(value: unknown): value is Pokemon {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    "level" in value
  );
}

function process(value: unknown) {
  if (isPokemon(value)) {
    console.log(value.name); // TypeScript knows it's Pokemon
  }
}
```

**`value is Pokemon`:** Type predicate. If function returns true, TypeScript narrows type.

### Assertion Functions

Functions that throw if condition isn't met:

```typescript
function assertIsPokemon(value: unknown): asserts value is Pokemon {
  if (!isPokemon(value)) {
    throw new Error("Not a Pokemon");
  }
}

function process(value: unknown) {
  assertIsPokemon(value);
  console.log(value.name); // TypeScript knows it's Pokemon (or exception thrown)
}
```

**`asserts value is Pokemon`:** After this function, value is Pokemon (or execution stopped).

### Builder Pattern

Fluent API for object construction:

```typescript
class PokemonBuilder {
  private pokemon: Partial<Pokemon> = {};

  setName(name: string): this {
    this.pokemon.name = name;
    return this;
  }

  setLevel(level: number): this {
    this.pokemon.level = level;
    return this;
  }

  build(): Pokemon {
    if (!this.pokemon.name || !this.pokemon.level) {
      throw new Error("Incomplete Pokemon");
    }
    return this.pokemon as Pokemon;
  }
}

const pikachu = new PokemonBuilder()
  .setName("Pikachu")
  .setLevel(25)
  .build();
```

**Benefit:** Readable construction of complex objects.

### Singleton Pattern

Ensure only one instance of a class:

```typescript
class PokeAPI {
  private static instance: PokeAPI;

  private constructor() {
    // Private constructor prevents new PokeAPI()
  }

  static getInstance(): PokeAPI {
    if (!PokeAPI.instance) {
      PokeAPI.instance = new PokeAPI();
    }
    return PokeAPI.instance;
  }
}

const api1 = PokeAPI.getInstance();
const api2 = PokeAPI.getInstance();
console.log(api1 === api2); // true
```

**Use case:** Database connections, configuration, caches.

### Readonly Arrays

Prevent modification:

```typescript
const pokemon: readonly Pokemon[] = [
  { name: "Pikachu", level: 25 }
];

pokemon.push({ name: "Charmander", level: 18 }); // Error: Property 'push' does not exist
pokemon[0] = { name: "Squirtle", level: 20 }; // Error: Index signature in type 'readonly Pokemon[]' only permits reading
```

**Use for:** Data that shouldn't change (API responses, constants).

### Const Assertions

Infer literal types:

```typescript
// Without const
const pokemon = { name: "Pikachu", level: 25 };
// Type: { name: string; level: number; }

// With const
const pokemon = { name: "Pikachu", level: 25 } as const;
// Type: { readonly name: "Pikachu"; readonly level: 25; }
```

**Benefits:**
- More precise types
- Readonly (can't modify)
- Literal types (exact values)

### Exhaustiveness Checking

Ensure all cases are handled:

```typescript
type PokemonType = "fire" | "water" | "grass";

function getWeakness(type: PokemonType): string {
  switch (type) {
    case "fire":
      return "water";
    case "water":
      return "grass";
    case "grass":
      return "fire";
    default:
      const exhaustive: never = type;
      throw new Error(`Unhandled type: ${exhaustive}`);
  }
}

// If we add "electric" to PokemonType and forget to handle it:
// Error: Type '"electric"' is not assignable to type 'never'
```

**`never` type:** Represents values that never occur. If we reach default, something's wrong.

---

## Conclusion

### What You've Learned

**TypeScript Mastery:**
- Type system: primitives, objects, unions, generics
- Type inference and explicit annotations
- `interface` vs `type` and when to use each
- Advanced types: mapped, conditional, template literals

**Async Programming:**
- Promises and async/await
- Error handling in async code
- Parallel vs sequential execution
- Type-safe async functions

**HTTP & APIs:**
- fetch API and response handling
- Typing API responses
- Pagination patterns
- Error handling for network requests

**Architecture:**
- Layered architecture
- Command pattern
- Dependency injection
- State management

**Caching:**
- Time-based expiration
- Cache keys and invalidation
- Memory management with reaping
- Generic cache implementation

**Testing:**
- Unit testing with Vitest
- Parametric testing
- Async test patterns
- Test lifecycle hooks

**Tooling:**
- ES modules in TypeScript
- The `.js` extension quirk
- TypeScript compiler configuration
- Bash automation for testing

### Best Practices Reinforced

1. **Always annotate function returns** - Self-documentation and catches errors
2. **Use strict mode** - Catch more bugs at compile time
3. **Prefer `const` over `let`** - Immutability by default
4. **Check `response.ok` after fetch** - HTTP errors don't auto-throw
5. **Use `.js` in ESM imports** - Runtime expects compiled files
6. **Validate input early** - Fail fast with clear messages
7. **One file, one purpose** - Single Responsibility Principle
8. **Type API responses** - No `any` from `response.json()`
9. **Clean up resources** - `clearInterval`, `rl.close()`
10. **Test edge cases** - Empty input, network failures, etc.

### Next Steps

**Extend the Pokedex:**
- Add persistence (save/load from file)
- Implement battle system
- Add Pokemon evolution
- Create a web UI
- Add GraphQL instead of REST

**Advanced TypeScript:**
- Generics with constraints
- Discriminated unions for state
- Branded types for validation
- Zod for runtime type checking

**Production Considerations:**
- Error logging (Winston, Pino)
- Configuration management (dotenv)
- Rate limiting for API calls
- CI/CD pipeline (GitHub Actions)
- Docker containerization

### Resources

**TypeScript:**
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Type Challenges](https://github.com/type-challenges/type-challenges)

**APIs:**
- [PokeAPI Documentation](https://pokeapi.co/docs/v2)
- [MDN Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

**Testing:**
- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://testingjavascript.com/)

**Patterns:**
- [Refactoring Guru](https://refactoring.guru/design-patterns)
- [Clean Code](https://github.com/ryanmcdermott/clean-code-javascript)

### Final Thoughts

You've built a complete CLI application from scratch using production-ready patterns. Every line of code serves a purpose:

- **Types** prevent bugs before runtime
- **Async/await** handles I/O without blocking
- **Caching** makes the app fast
- **Commands** keep code organized
- **Tests** ensure correctness

This is the foundation of professional TypeScript development. The patterns you've learned apply to:
- Backend APIs (Express, Fastify)
- Frontend apps (React, Vue, Angular)
- Desktop apps (Electron)
- Mobile apps (React Native)
- Cloud functions (AWS Lambda, Vercel)

**You're no longer a beginner. You're a TypeScript developer.**

Now go build something amazing.

---

*Built with TypeScript, powered by PokeAPI, tested with Vitest.*
