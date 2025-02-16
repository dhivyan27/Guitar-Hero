/**
 * VIEWPORT
 */
export const Viewport = {
    CANVAS_WIDTH: 200,
    CANVAS_HEIGHT: 400,
} as const;

/**
 * GAME CONSTANTS
 */
export const Constants = {
    TICK_RATE_MS: 16, //60 fps
    SONG_NAME: "RockinRobin",
    NOTE_FALL_TIME: 1800, // Time in milliseconds for a note to fall from the top of the screen to the hit line (HIT_LINE_Y)
    HIT_WINDOW: 30, // Time window in milliseconds before the note reaches HIT_LINE_Y where a key press is considered a valid hit
    HIT_LINE_Y: 350, // Y-coordinate on the canvas where the player must hit the note; this represents the "hit line" where notes should be when the player presses a key
    SCORE_INCREMENT: 1,
    SCORE_DECREMENT: 1,
} as const;

/**
 * NOTE CONSTANT: defines the visual properties of notes in the game.
 */
export const Note = {
    RADIUS: 0.07 * Viewport.CANVAS_WIDTH,
    TAIL_WIDTH: 10,
} as const;

/**
 * COLORS array defines the color scheme for the game's notes.
 * Each color corresponds to a column in the game.
 */
export const COLORS = ["green", "red", "blue", "yellow"] as const;

/**
 * KEY_BINDINGS maps keyboard keys to game columns.
 * This allows for easy configuration of game controls.
 */
export const KEY_BINDINGS: { [key: string]: number } = {
    KeyH: 0,
    KeyJ: 1,
    KeyK: 2,
    KeyL: 3,
};

/**
 * NOTE_VELOCITY represents how much a note should move downward in each game tick
 */
export const NOTE_VELOCITY =
    Constants.HIT_LINE_Y / (Constants.NOTE_FALL_TIME / Constants.TICK_RATE_MS);

/** User input types */

/**
 * Key type represents the valid keys for game input.
 * This type ensures that only the defined keys are used for game control.
 */
export type Key = "KeyH" | "KeyJ" | "KeyK" | "KeyL";

/**
 * Event type represents the types of keyboard events the game responds to.
 */
export type Event = "keydown" | "keyup" | "keypress";

/**
 * Note type represents a note in the game state.
 */
export type Note = Readonly<{
    id: string;
    user_played: boolean;
    column: number;
    y: number;
    instrumentName: string;
    velocity: number;
    pitch: number;
    start: number;
    end: number;
    hit: boolean;
}>;

/**
 * State type represents the entire game state.
 */
export type State = Readonly<{
    notes: ReadonlyArray<Note>;
    score: number;
    missedNotes: number;
    gameEnd: boolean;
    multiplier: number;
    consecutiveHits: number;
    shouldPlayRandomNote: boolean;
}>;

/**
 * initialState defines the starting state of the game.
 */
export const initialState: State = {
    notes: [],
    score: 0,
    missedNotes: 0,
    gameEnd: false,
    multiplier: 1.0,
    consecutiveHits: 0,
    shouldPlayRandomNote: false,
} as const;

/**
 * Action interface
 * This interface is crucial for implementing the reducer pattern in the game's state management.
 */
export interface Action {
    apply(s: State): State;
}
