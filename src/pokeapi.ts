import { Cache } from "./pokecache.js";

export class PokeAPI {
  private static readonly baseURL = "https://pokeapi.co/api/v2";
  private cache: Cache;

  constructor() {
    // Cache entries expire after 5 minutes (300000 milliseconds)
    this.cache = new Cache(300000);
  }

  async fetchLocations(pageURL?: string): Promise<ShallowLocations> {
    const url = pageURL || `${PokeAPI.baseURL}/location-area?offset=0&limit=20`;

    // Check cache first
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

    // Add to cache
    this.cache.add(url, data);

    return data;
  }

  async fetchLocation(locationName: string): Promise<Location> {
    const url = `${PokeAPI.baseURL}/location-area/${locationName}`;

    // Check cache first
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

    // Add to cache
    this.cache.add(url, data);

    return data;
  }

  async fetchPokemon(pokemonName: string): Promise<Pokemon> {
    const url = `${PokeAPI.baseURL}/pokemon/${pokemonName}`;

    // Check cache first
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

    // Add to cache
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
