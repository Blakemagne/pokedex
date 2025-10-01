# TypeScript Pokedex CLI

A command-line REPL built in TypeScript to practice HTTP client patterns, async/await, JSON parsing, type annotations, and caching strategies. The project uses the PokeAPI to fetch Pokemon data and implements a complete Pokedex with exploration, catching, and inspection commands.

**Skills reinforced:** `fetch` API, `async`/`await`, TypeScript type system, promise handling, JSON parsing, caching with `Map`, REPL construction with Node's `readline`, Bash test automation.

---

## Full Implementation

### Project Structure

```
pokedex/
├── src/
│   ├── main.ts                # Entry point
│   ├── repl.ts               # REPL loop and input parsing
│   ├── state.ts              # State management and types
│   ├── command.ts            # Command registry
│   ├── command_help.ts       # Help command
│   ├── command_exit.ts       # Exit command
│   ├── command_map.ts        # Map command (pagination)
│   ├── command_mapb.ts       # Map back command
│   ├── command_explore.ts    # Explore locations
│   ├── command_catch.ts      # Catch Pokemon
│   ├── command_inspect.ts    # Inspect caught Pokemon
│   ├── command_pokedex.ts    # List caught Pokemon
│   ├── pokeapi.ts            # API client
│   ├── pokecache.ts          # Caching layer
│   ├── repl.test.ts          # Input parsing tests
│   └── pokecache.test.ts     # Cache tests
├── tsconfig.json
├── package.json
└── .gitignore
```

### Core Files

**tsconfig.json**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "target": "esnext",
    "module": "esnext",
    "rootDir": "./src",
    "outDir": "./dist",
    "strict": true,
    "moduleResolution": "Node",
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["./src/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**package.json**
```json
{
  "name": "pokedex",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "build": "npx tsc",
    "start": "node dist/main.js",
    "dev": "npx tsc && node dist/main.js",
    "test": "vitest --run"
  },
  "devDependencies": {
    "@types/node": "^22.10.5",
    "typescript": "^5.7.3",
    "vitest": "^3.2.4"
  }
}
```

**src/main.ts**
```typescript
import { startREPL } from "./repl.js";
import { initState } from "./state.js";

function main() {
  const state = initState();
  startREPL(state);
}

main();
```

**src/state.ts**
```typescript
import { createInterface, type Interface } from "readline";
import { getCommands } from "./command.js";
import { PokeAPI, type Pokemon } from "./pokeapi.js";

export type CLICommand = {
  name: string;
  description: string;
  callback: (state: State, ...args: string[]) => Promise<void>;
};

export type State = {
  rl: Interface;
  commands: Record<string, CLICommand>;
  pokeapi: PokeAPI;
  nextLocationsURL: string | null;
  prevLocationsURL: string | null;
  pokedex: Record<string, Pokemon>;
};

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

**src/repl.ts**
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

**src/pokecache.ts**
```typescript
type CacheEntry<T> = {
  createdAt: number;
  val: T;
};

export class Cache {
  #cache = new Map<string, CacheEntry<any>>();
  #reapIntervalId: NodeJS.Timeout | undefined = undefined;
  #interval: number;

  constructor(interval: number) {
    this.#interval = interval;
    this.#startReapLoop();
  }

  add<T>(key: string, val: T): void {
    this.#cache.set(key, {
      createdAt: Date.now(),
      val,
    });
  }

  get<T>(key: string): T | undefined {
    const entry = this.#cache.get(key);
    if (!entry) {
      return undefined;
    }
    return entry.val as T;
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

**src/pokeapi.ts**
```typescript
import { Cache } from "./pokecache.js";

export class PokeAPI {
  private static readonly baseURL = "https://pokeapi.co/api/v2";
  private cache: Cache;

  constructor() {
    this.cache = new Cache(300000); // 5 minutes
  }

  async fetchLocations(pageURL?: string): Promise<ShallowLocations> {
    const url = pageURL || `${PokeAPI.baseURL}/location-area?offset=0&limit=20`;

    const cached = this.cache.get<ShallowLocations>(url);
    if (cached) {
      console.log("Cache hit for:", url);
      return cached;
    }

    console.log("Cache miss, fetching:", url);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = (await response.json()) as ShallowLocations;
    this.cache.add(url, data);
    return data;
  }

  async fetchLocation(locationName: string): Promise<Location> {
    const url = `${PokeAPI.baseURL}/location-area/${locationName}`;

    const cached = this.cache.get<Location>(url);
    if (cached) {
      console.log("Cache hit for:", url);
      return cached;
    }

    console.log("Cache miss, fetching:", url);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = (await response.json()) as Location;
    this.cache.add(url, data);
    return data;
  }

  async fetchPokemon(pokemonName: string): Promise<Pokemon> {
    const url = `${PokeAPI.baseURL}/pokemon/${pokemonName}`;

    const cached = this.cache.get<Pokemon>(url);
    if (cached) {
      console.log("Cache hit for:", url);
      return cached;
    }

    console.log("Cache miss, fetching:", url);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = (await response.json()) as Pokemon;
    this.cache.add(url, data);
    return data;
  }
}

export type ShallowLocations = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Array<{
    name: string;
    url: string;
  }>;
};

export type Location = {
  id: number;
  name: string;
  game_index: number;
  encounter_method_rates: Array<unknown>;
  location: {
    name: string;
    url: string;
  };
  names: Array<{
    name: string;
    language: {
      name: string;
      url: string;
    };
  }>;
  pokemon_encounters: Array<unknown>;
};

export type Pokemon = {
  id: number;
  name: string;
  base_experience: number;
  height: number;
  weight: number;
  abilities: Array<{
    ability: {
      name: string;
      url: string;
    };
    is_hidden: boolean;
    slot: number;
  }>;
  stats: Array<{
    base_stat: number;
    effort: number;
    stat: {
      name: string;
      url: string;
    };
  }>;
  types: Array<{
    slot: number;
    type: {
      name: string;
      url: string;
    };
  }>;
};
```

**src/command_catch.ts**
```typescript
import type { State } from "./state.js";

export async function commandCatch(
  state: State,
  ...args: string[]
): Promise<void> {
  if (args.length === 0) {
    console.log("Usage: catch <pokemon-name>");
    return;
  }

  const pokemonName = args[0];

  if (state.pokedex[pokemonName]) {
    console.log(`You already have ${pokemonName} in your Pokedex!`);
    return;
  }

  console.log(`Throwing a Pokeball at ${pokemonName}...`);

  try {
    const pokemon = await state.pokeapi.fetchPokemon(pokemonName);

    // Higher base_experience = harder to catch
    const catchThreshold = Math.min(pokemon.base_experience / 300, 0.9);
    const randomValue = Math.random();

    if (randomValue > catchThreshold) {
      state.pokedex[pokemonName] = pokemon;
      console.log(`${pokemonName} was caught!`);
      console.log("You may now inspect it with the inspect command.");
    } else {
      console.log(`${pokemonName} escaped!`);
    }
  } catch (error) {
    console.error(`Failed to catch ${pokemonName}:`, error);
  }
}
```

---

## Syntax Walkthrough

### Type Annotations

```typescript
export type CLICommand = {
  name: string;
  description: string;
  callback: (state: State, ...args: string[]) => Promise<void>;
};
```

- `callback: (state: State, ...args: string[]) => Promise<void>` → function signature accepting State and variadic string args, returning a Promise that resolves to void.
- `...args: string[]` → rest parameter, collects remaining arguments into an array.
- `Promise<void>` → the function is async and returns no value (side effects only).

### Async/Await Pattern

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

- `async` → function returns a `Promise` implicitly.
- `await fetch(url)` → pauses execution until the promise resolves.
- `await response.json()` → waits for JSON parsing to complete.
- `as Pokemon` → type assertion, tells TypeScript to treat the result as Pokemon type.
- `if (!response.ok)` → checks HTTP status; non-2xx responses need explicit error handling.

### Generic Functions

```typescript
get<T>(key: string): T | undefined {
  const entry = this.#cache.get(key);
  if (!entry) {
    return undefined;
  }
  return entry.val as T;
}
```

- `<T>` → generic type parameter, allows caller to specify return type.
- `T | undefined` → union type, function returns T or undefined.
- `as T` → type assertion required because internal storage uses `any`.

### Private Class Fields

```typescript
export class Cache {
  #cache = new Map<string, CacheEntry<any>>();
  #reapIntervalId: NodeJS.Timeout | undefined = undefined;
  #interval: number;
```

- `#cache` → private field (ECMAScript syntax), not accessible outside the class.
- `Map<string, CacheEntry<any>>` → Map type with string keys and CacheEntry values.
- `NodeJS.Timeout | undefined` → union type for timer handle or undefined state.

### Import Syntax for ES Modules

```typescript
import { createInterface, type Interface } from "readline";
import { getCommands } from "./command.js";
import { PokeAPI, type Pokemon } from "./pokeapi.js";
```

- `type Interface` → type-only import, removed during compilation.
- `"./command.js"` → `.js` extension required in ESM imports even though source is `.ts`.
- Named imports: `{ createInterface, type Interface }`.

### Regex Split

```typescript
export function cleanInput(input: string): string[] {
  return input.trim().toLowerCase().split(/\s+/);
}
```

- `/\s+/` → regex matching one or more whitespace characters.
- `.split(/\s+/)` → splits on any whitespace sequence, handles multiple spaces correctly.
- Without `+`, `"a  b".split(/\s/)` would create empty strings: `["a", "", "b"]`.

### Type vs Interface

```typescript
// Type alias - used for unions, primitives, mapped types
export type State = {
  rl: Interface;
  commands: Record<string, CLICommand>;
  pokedex: Record<string, Pokemon>;
};

// Interface - preferred for object shapes, supports declaration merging
interface CacheEntry<T> {
  createdAt: number;
  val: T;
}
```

- Use `type` for unions, primitives, utility types (`Record`, `Pick`, `Omit`).
- Use `interface` for object shapes that might be extended.
- Both work for simple object shapes; `type` is more flexible.

---

## HTTP Client Patterns

### Fetch with Error Handling

```typescript
const response = await fetch(url);
if (!response.ok) {
  throw new Error(`HTTP error! status: ${response.status}`);
}
const data = (await response.json()) as Pokemon;
```

- `fetch()` does not reject on HTTP errors (404, 500, etc.), only network failures.
- `response.ok` → true for status codes 200-299.
- `response.json()` → returns a Promise, requires `await`.
- Type assertion `as Pokemon` → necessary because `json()` returns `any`.

### Response Typing

```typescript
async fetchLocations(pageURL?: string): Promise<ShallowLocations> {
  // ...
  const data = (await response.json()) as ShallowLocations;
  return data;
}
```

- `pageURL?: string` → optional parameter, can be undefined.
- `Promise<ShallowLocations>` → explicit return type annotation.
- Type assertion ensures the JSON matches expected structure.

### Caching Layer

```typescript
const cached = this.cache.get<ShallowLocations>(url);
if (cached) {
  console.log("Cache hit for:", url);
  return cached;
}

console.log("Cache miss, fetching:", url);
const response = await fetch(url);
// ... fetch logic
this.cache.add(url, data);
```

- Check cache before making HTTP request.
- Use URL as cache key for idempotent GET requests.
- Add to cache after successful fetch.
- Generic `get<ShallowLocations>` provides type safety.

---

## Testing and Validation

### Unit Tests with Vitest

**src/repl.test.ts**
```typescript
import { cleanInput } from "./repl";
import { describe, expect, test } from "vitest";

describe.each([
  {
    input: "  hello  world  ",
    expected: ["hello", "world"],
  },
  {
    input: "Charmander Bulbasaur PIKACHU",
    expected: ["charmander", "bulbasaur", "pikachu"],
  },
])("cleanInput($input)", ({ input, expected }) => {
  test(`Expected: ${expected}`, () => {
    const actual = cleanInput(input);

    expect(actual).toHaveLength(expected.length);
    for (const i in expected) {
      expect(actual[i]).toBe(expected[i]);
    }
  });
});
```

- `describe.each([...])` → parametric testing, runs same test with multiple inputs.
- `expect(actual).toHaveLength(expected.length)` → asserts array length.
- `expect(actual[i]).toBe(expected[i])` → strict equality check.
- Test fails if any `expect` assertion is false.

**src/pokecache.test.ts**
```typescript
import { describe, expect, test, afterEach } from "vitest";
import { Cache } from "./pokecache";

describe("Cache", () => {
  let cache: Cache;

  afterEach(() => {
    if (cache) {
      cache.stopReapLoop();
    }
  });

  test("should add and retrieve values", () => {
    cache = new Cache(5000);

    cache.add("key1", "value1");
    expect(cache.get("key1")).toBe("value1");
  });

  test("should reap old entries after interval", async () => {
    cache = new Cache(100); // 100ms interval

    cache.add("key1", "value1");
    expect(cache.get("key1")).toBe("value1");

    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(cache.get("key1")).toBeUndefined();
  });
});
```

- `afterEach(() => { ... })` → cleanup hook, runs after each test.
- `await new Promise((resolve) => setTimeout(resolve, 250))` → async delay for testing time-based logic.
- `expect(...).toBeUndefined()` → checks for undefined return value.

### Running Tests

```bash
npm run test
```

Output:
```
✓ src/repl.test.ts (6 tests) 9ms
✓ src/pokecache.test.ts (5 tests) 258ms

Test Files  2 passed (2)
Tests  11 passed (11)
```

Test failure example:
```typescript
expect(actual[0]).toBe("HELLO"); // Fails if actual[0] is "hello"
```

Error message:
```
AssertionError: expected 'hello' to equal 'HELLO'
```

---

## Bash Command Breakdown

### Building and Running

```bash
npm run build
```
- `npm run build` → executes `scripts.build` from package.json.
- Runs `npx tsc` → compiles TypeScript to JavaScript in `dist/`.
- `npx` → runs local package binary without global install.

```bash
npm run dev
```
- Executes `npx tsc && node dist/main.js`.
- `&&` → runs second command only if first succeeds.
- Compiles TypeScript, then runs the output.

### Testing with Input Simulation

```bash
printf "map\nmap\nmapb\nexit\n" | npm run dev 2>&1 | tee repl.log
```

Token-by-token breakdown:

- `printf "map\nmap\nmapb\nexit\n"` → prints strings with newlines (simulates user input).
- `|` → pipe operator, sends stdout of left command to stdin of right command.
- `npm run dev` → starts the REPL.
- `2>&1` → redirects stderr (file descriptor 2) to stdout (file descriptor 1).
  - Combines error and output streams.
  - Without this, errors go to terminal, not to `tee`.
- `| tee repl.log` → writes stdin to both stdout and a file.
  - Displays output on terminal while saving to `repl.log`.

### Simulating Multiple Commands

```bash
(echo "catch squirtle"; sleep 2; echo "exit") | npm run start 2>&1
```

- `(...)` → subshell, groups commands.
- `echo "catch squirtle"` → prints to stdout.
- `;` → command separator, runs sequentially.
- `sleep 2` → waits 2 seconds (allows async operations to complete).
- Without `sleep`, rapid piped input can race with async fetch calls, causing `process.exit(0)` to terminate before responses arrive.

### Why Not Use `echo`?

```bash
# Works but less precise
echo -e "map\nmap\nexit" | npm run dev

# Preferred - explicit newlines
printf "map\nmap\nexit\n" | npm run dev
```

- `printf` → more portable, precise control over output format.
- `echo -e` → requires `-e` flag for escape sequences, behavior varies by shell.
- `printf` → POSIX standard, consistent across systems.

---

## Common Mistakes and Fixes

### Missing `await`

**Incorrect:**
```typescript
async function fetchData() {
  const data = fetch(url).json(); // Returns Promise<any>, not data
  console.log(data); // Prints: Promise { <pending> }
}
```

**Correct:**
```typescript
async function fetchData() {
  const response = await fetch(url);
  const data = await response.json();
  console.log(data); // Prints actual data
}
```

### Using `any` Instead of Explicit Types

**Incorrect:**
```typescript
async fetchPokemon(name: string): Promise<any> {
  const response = await fetch(`/pokemon/${name}`);
  return response.json();
}
```

**Correct:**
```typescript
async fetchPokemon(name: string): Promise<Pokemon> {
  const response = await fetch(`/pokemon/${name}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return (await response.json()) as Pokemon;
}
```

### Forgetting `.js` Extension in ESM Imports

**Incorrect:**
```typescript
import { startREPL } from "./repl"; // Module not found
```

**Correct:**
```typescript
import { startREPL } from "./repl.js"; // Required for ES modules
```

- TypeScript compiles `.ts` to `.js`, runtime imports use `.js`.
- `"type": "module"` in package.json requires explicit extensions.

### Incorrect Error Handling with `fetch`

**Incorrect:**
```typescript
try {
  const response = await fetch(url);
  const data = await response.json();
} catch (error) {
  console.error("Fetch failed:", error); // Only catches network errors
}
```

**Correct:**
```typescript
try {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
} catch (error) {
  console.error("Fetch failed:", error); // Catches network + HTTP errors
}
```

### Variadic Parameters Misuse

**Incorrect:**
```typescript
export type CLICommand = {
  callback: (state: State, args: string[]) => Promise<void>;
};

// Must pass array: command.callback(state, ["arg1", "arg2"])
```

**Correct:**
```typescript
export type CLICommand = {
  callback: (state: State, ...args: string[]) => Promise<void>;
};

// Can spread: command.callback(state, ...["arg1", "arg2"])
// Or pass directly: command.callback(state, "arg1", "arg2")
```

### Private Field Syntax

**Incorrect:**
```typescript
class Cache {
  private cache: Map<string, any>; // TypeScript private, exists at runtime
}
```

**Correct for True Privacy:**
```typescript
class Cache {
  #cache: Map<string, any>; // ECMAScript private, enforced at runtime
}
```

- TypeScript `private` → compile-time only.
- `#field` → runtime privacy, syntax error if accessed outside class.

---

## Conventions Recap

1. **Always annotate function return types** → `async function fetch(): Promise<Data>`.
2. **Use `type` for unions and records** → `Record<string, Pokemon>`, `State | null`.
3. **Use `interface` for extendable object shapes** → `interface Config { ... }`.
4. **Prefer `const` over `let`** → immutability by default.
5. **Use rest parameters for variadic args** → `...args: string[]` allows flexible arg passing.
6. **Check `response.ok` after `fetch`** → `fetch` does not auto-throw on HTTP errors.
7. **Always `await` promises** → forgetting `await` returns `Promise`, not value.
8. **Type JSON responses explicitly** → `as Pokemon` after `response.json()`.
9. **Use `.js` extensions in ESM imports** → required for Node's ES module resolution.
10. **Use `printf` over `echo` in Bash tests** → explicit newline control, POSIX compliance.
11. **Redirect stderr in pipes** → `2>&1` combines streams for full output capture.
12. **Use `#` for runtime-private fields** → ECMAScript private fields enforce true encapsulation.
13. **Clean up intervals/timers** → call `clearInterval` to prevent memory leaks.
14. **Use `tee` for output capture** → saves to file while displaying on terminal.
15. **Separate command logic into modules** → one command per file for maintainability.

---

## Build and Run

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run build

# Run the REPL
npm run start

# Run with auto-rebuild
npm run dev

# Run tests
npm run test
```

---

## Example Session

```bash
$ npm run dev

Pokedex > help
Welcome to the Pokedex!
Usage:

help: Displays a help message
exit: Exit the Pokedex
map: Displays the next 20 location areas
mapb: Displays the previous 20 location areas
explore: Explore a location area to find Pokemon
catch: Attempt to catch a Pokemon
inspect: Inspect a caught Pokemon
pokedex: List all caught Pokemon

Pokedex > map
Cache miss, fetching: https://pokeapi.co/api/v2/location-area?offset=0&limit=20
canalave-city-area
eterna-city-area
...

Pokedex > explore pastoria-city-area
Exploring pastoria-city-area...
Cache miss, fetching: https://pokeapi.co/api/v2/location-area/pastoria-city-area
Found Pokemon:
 - tentacool
 - magikarp
 - gyarados
 ...

Pokedex > catch pikachu
Throwing a Pokeball at pikachu...
Cache miss, fetching: https://pokeapi.co/api/v2/pokemon/pikachu
pikachu was caught!
You may now inspect it with the inspect command.

Pokedex > inspect pikachu
Name: pikachu
Height: 4
Weight: 60
Stats:
  -hp: 35
  -attack: 55
  -defense: 40
  -special-attack: 50
  -special-defense: 50
  -speed: 90
Types:
  - electric

Pokedex > pokedex
Your Pokedex:
 - pikachu

Pokedex > exit
Closing the Pokedex... Goodbye!
```

---

## Key Takeaways

- TypeScript's type system catches errors at compile time; `strict: true` enforces best practices.
- `async`/`await` simplifies promise handling but requires explicit `await` keywords.
- `fetch` requires manual HTTP error checking via `response.ok`.
- Generic functions (`get<T>`) enable type-safe reusable code.
- ES modules require `.js` extensions in imports, even for TypeScript files.
- Caching strategies reduce API calls; use URL as key for idempotent requests.
- Bash pipes (`|`) and redirects (`2>&1`) enable powerful test automation.
- Private fields (`#field`) enforce runtime encapsulation, unlike TypeScript's `private`.
