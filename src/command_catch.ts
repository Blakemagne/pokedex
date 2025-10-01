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

  // Check if already caught
  if (state.pokedex[pokemonName]) {
    console.log(`You already have ${pokemonName} in your Pokedex!`);
    return;
  }

  console.log(`Throwing a Pokeball at ${pokemonName}...`);

  try {
    const pokemon = await state.pokeapi.fetchPokemon(pokemonName);

    // Calculate catch probability based on base experience
    // Higher base experience = harder to catch
    // Normalize base_experience (usually 0-600) to a difficulty between 0.1 and 0.9
    const catchThreshold = Math.min(pokemon.base_experience / 300, 0.9);
    const randomValue = Math.random();

    if (randomValue > catchThreshold) {
      // Caught!
      state.pokedex[pokemonName] = pokemon;
      console.log(`${pokemonName} was caught!`);
      console.log("You may now inspect it with the inspect command.");
    } else {
      // Escaped
      console.log(`${pokemonName} escaped!`);
    }
  } catch (error) {
    console.error(`Failed to catch ${pokemonName}:`, error);
  }
}
