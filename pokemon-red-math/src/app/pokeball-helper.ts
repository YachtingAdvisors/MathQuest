import { PokemonEncounterType } from "../state/state-types";
import { ItemType } from "./use-item-data";
import { getPokemonMetadata } from "./use-pokemon-metadata";
import { getPokemonStats } from "./use-pokemon-stats";

// Following this https://bulbapedia.bulbagarden.net/wiki/Catch_rate
// Using the "Approximate probability" formula

const pokeballModifiers: Record<string, number> = {
  [ItemType.PokeBall]: 255,
  [ItemType.GreatBall]: 200,
  [ItemType.UltraBall]: 150,
};

/**
 * Determine if a Pokemon is caught.
 * @param pokemon - The wild pokemon encounter
 * @param pokeball - The type of pokeball used
 * @param speedBonus - Math speed bonus multiplier (1.0 = normal, 1.3 = blazing fast)
 */
const catchesPokemon = (
  pokemon: PokemonEncounterType,
  pokeball: ItemType | string,
  speedBonus: number = 1.0
) => {
  if (pokeball === ItemType.MasterBall) return true;
  const currentHp = pokemon.hp;
  const maxHp = getPokemonStats(pokemon.id, pokemon.level).hp;
  const baseCatchRate = getPokemonMetadata(pokemon.id).baseCatchRate;
  const ballModifier = pokeballModifiers[pokeball] || 255;
  const ball = ItemType.GreatBall ? 8 : 12;
  const f_ = (maxHp * 255 * 4) / (currentHp * ball);
  const f = Math.min(Math.max(f_, 1), 255);
  const p0 = 0; // TODO
  const p1 = ((baseCatchRate + 1) / (ballModifier + 1)) * ((f + 1) / 255);

  // Apply speed bonus from math questions
  const catchProbability = Math.min((p0 + p1) * speedBonus, 1.0);

  const random = Math.random();
  return random < catchProbability;
};

export default catchesPokemon;
