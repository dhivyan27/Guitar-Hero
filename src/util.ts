/** Utility functions */

/**
 * A random number generator which provides two pure functions
 * `hash` and `scaleToRange`.  Call `hash` repeatedly to generate the
 * sequence of hashes. RNG class was sourced from applied class solutions
 *
 * Sourced from Applied Class Solutions
 */
export abstract class RNG {
    // LCG using GCC's constants
    private static m: number = 0x80000000; // 2**31
    private static a: number = 1103515245;
    private static c: number = 12345;

    /**
     * Call `hash` repeatedly to generate the sequence of hashes.
     * @param seed
     * @returns a hash of the seed
     */
    public static hash = (seed: number): number =>
        (RNG.a * seed + RNG.c) % RNG.m;

    /**
     * Takes hash value and scales it to the range [-1, 1]
     */
    public static scale = (hash: number): number =>
        (2 * hash) / (RNG.m - 1) - 1;
}
