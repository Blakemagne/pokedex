import type { State } from "./state.js";

export async function commandMap(state: State): Promise<void> {
  const locations = await state.pokeapi.fetchLocations(
    state.nextLocationsURL || undefined
  );

  for (const location of locations.results) {
    console.log(location.name);
  }

  state.nextLocationsURL = locations.next;
  state.prevLocationsURL = locations.previous;
}
