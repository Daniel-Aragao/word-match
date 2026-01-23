/**
 * Uses Linear Congruential Generator algorithm to produce a pseudo-random number generator function.
 * The returned function, when called, produces the next number in the sequence.
 * @param seed
 * @returns
 */
export function createRandomGenerator(seed: number): (max?: number) => number {
  const module = 2147483648;
  const multiplier = 1103515245;
  const increment = 12345;

  let current = seed;

  return (max?: number) => {
    current = (multiplier * current + increment) % module;

    return max ? current % max : current;
  };
}

export function createRandomGeneratorOfDay(date: Date = new Date()) {
  const seed =
    Number(
      `${date.getFullYear()}${date.getMonth()}${date.getDate()}`,
    ) ** 2;

  return createRandomGenerator(seed);
}
