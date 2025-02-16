import {
    concat,
    delay,
    from,
    map,
    mergeMap,
    Observable,
    of,
    scan,
    skip,
} from "rxjs";
import { COLORS, Constants, Note } from "./types";
import { RNG } from "./util";

/**
 * Converts values in a stream to random numbers in the range [-1, 1]
 *
 * This usually would be implemented as an RxJS operator, but that is currently
 * beyond the scope of this course.
 *
 * Function sourced from Tutorial 4 solutions
 *
 * @param source$ The source Observable, elements of this are replaced with random numbers
 * @param seed The seed for the random number generator
 */
export function createRngStreamFromSource<T>(source$: Observable<T>) {
    return function createRngStream(seed: number = 0): Observable<number> {
        const randomNumberStream = source$.pipe(
            // Use scan to accumulate the seed state and generate a new seed each time
            scan((acc, _) => {
                return RNG.hash(acc);
            }, seed),
            // Map the generated seed to a random number in the range [-1, 1]
            map((hashedSeed) => RNG.scale(hashedSeed)),
        );

        return randomNumberStream;
    };
}

/**
 * Creates a stream of random pitch values.
 * @param source$ The source Observable that triggers new random values
 * @returns An Observable that emits random pitch values between 20 and 110
 */
export function createRandomPitchStream<T>(
    source$: Observable<T>,
): Observable<number> {
    const rngStream = createRngStreamFromSource(source$);
    return rngStream(0).pipe(
        map((randomVal) => {
            const minPitch = 20;
            const maxPitch = 110;
            return Math.floor(
                minPitch + ((randomVal + 1) / 2) * (maxPitch - minPitch),
            );
        }),
    );
}

/**
 * Creates a stream of random duration values.
 * @param source$ The source Observable that triggers new random values
 * @returns An Observable that emits random duration values between 0 and 0.5 seconds
 */
export function createRandomDurationStream(
    source$: Observable<any>,
): Observable<number> {
    const rngStream = createRngStreamFromSource(source$);
    return rngStream(0).pipe(map((randomValue) => (randomValue + 1) / 4));
}

/**
 * Converts a CSV line to a Note object.
 * @param line CSV line string
 * @param index Line index for generating unique ID
 * @returns A Note object
 */
const csvLineToNote = (line: string, index: number): Note => {
    const [userPlayed, instrument, velocity, pitch, start, end] =
        line.split(",");

    return {
        id: `${index}`,
        user_played: userPlayed.toLowerCase() === "true",
        column: parseInt(pitch) % COLORS.length,
        y: 0,
        instrumentName: instrument,
        velocity: parseInt(velocity) / 127,
        pitch: parseInt(pitch),
        start: parseFloat(start),
        end: parseFloat(end),
        hit: false,
    };
};

/**
 * Calculates the delay for a note based on its start time.
 * @param note The Note object
 * @returns Delay in milliseconds
 */
const calculateNoteDelay = (note: Note): number =>
    (note.start - Constants.NOTE_FALL_TIME / 1000) * 1000;

/**
 * Creates an Observable for the game end note.
 * @returns Observable<Note> for the game end
 */
const createGameEndNote$ = (): Observable<Note> =>
    of({
        id: "gameEndNote",
        user_played: true,
        column: 0,
        y: 0,
        instrumentName: "",
        velocity: 0,
        pitch: 0,
        start: 0,
        end: 0,
        hit: false,
    }).pipe(delay(Constants.NOTE_FALL_TIME + 2000));

/**
 * Parses a CSV string into an Observable stream of Note objects.
 * @param csvContents The contents of the CSV file as a string.
 * @returns An Observable that emits Note objects.
 */
export const parseCSV = (csvContents: string): Observable<Note> => {
    const notes$ = from(csvContents.split("\n")).pipe(
        skip(1), // Skip header row
        map((line, index) => csvLineToNote(line, index)),
        // For each Note, create a new Observable that emits the note after a calculated delay
        mergeMap((note) => of(note).pipe(delay(calculateNoteDelay(note)))),
    );

    return concat(notes$, createGameEndNote$()); //add GameEndNote as last note
};
