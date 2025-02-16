import {
    Constants,
    State,
    Note,
    Action,
    NOTE_VELOCITY,
    KEY_BINDINGS,
    Key,
} from "./types";

export class PlayRandomNote implements Action {
    apply = (s: State): State => ({
        ...s,
    });
}
/**
 * AddNotes action class
 * Responsible for adding new notes to the game state or ending the game.
 */
export class AddNotes implements Action {
    constructor(public readonly note: Note) {}

    /**
     * Applies the AddNotes action to the current state.
     *
     * @param s The current state
     * @returns A new State object with the added note or updated game state
     */
    apply = (s: State): State =>
        this.note.id === "gameEndNote"
            ? { ...s, gameEnd: true } // End the game if it's the game end note
            : {
                  ...s,
                  notes: [...s.notes, this.note], // Immutably add the new note
              };
}

/**
 * KeyPress action class
 * Handles key press events in the game, updating notes and score.
 */
export class KeyPress implements Action {
    constructor(private readonly key: Key) {}

    /**
     * Checks if a note is hittable based on its position and the pressed key.
     */
    private isNoteHittable = (note: Note): boolean =>
        note.column === KEY_BINDINGS[this.key] &&
        Math.abs(note.y - Constants.HIT_LINE_Y) <= Constants.HIT_WINDOW &&
        !note.hit;

    /**
     * Updates a note's state if it's hit.
     */
    private updateNote = (note: Note): Note =>
        this.isNoteHittable(note)
            ? { ...note, y: Constants.HIT_LINE_Y + NOTE_VELOCITY, hit: true }
            : note;

    /**
     * Calculates the new score based on hit notes.
     */
    private calculateScore = (s: State, notesHit: number): number => {
        const baseScore =
            notesHit === 0
                ? Math.max(0, s.score - Constants.SCORE_DECREMENT)
                : s.score + notesHit * s.multiplier * Constants.SCORE_INCREMENT;
        return Math.round(baseScore);
    };

    /**
     * Calculates the new multiplier based on consecutive hits.
     */
    private calculateMultiplier = (
        consecutiveHits: number,
        currentMultiplier: number,
    ): number =>
        consecutiveHits % 10 === 0
            ? currentMultiplier + 0.2
            : currentMultiplier;

    /**
     * Applies the KeyPress action to the current state.
     *
     * @param s The current state
     * @returns A new State object with updated notes, score, and multiplier
     */
    apply = (s: State): State => {
        const notesHit = s.notes.filter(this.isNoteHittable).length; // getting the count of how many notes were successfully hit by this key press.
        const updatedNotes = s.notes.map(this.updateNote);
        const newConsecutiveHits = notesHit > 0 ? s.consecutiveHits + 1 : 0;

        return {
            ...s,
            notes: updatedNotes,
            score: this.calculateScore(s, notesHit),
            shouldPlayRandomNote: notesHit === 0,
            consecutiveHits: newConsecutiveHits,
            multiplier:
                notesHit > 0
                    ? this.calculateMultiplier(newConsecutiveHits, s.multiplier)
                    : 1.0,
        };
    };
}

/**
 * Action class for handling game ticks.
 * This class is responsible for updating the game state at each time step
 */
export class Tick implements Action {
    /**
     * Checks if a note is missed based on its position and hit status.
     */
    private isMissedNote = (note: Note): boolean =>
        note.y > Constants.HIT_LINE_Y && !note.hit;

    /**
     * Updates a note's position.
     */
    private updateNotePosition = (note: Note): Note => ({
        ...note,
        y: note.y + NOTE_VELOCITY,
    });

    /**
     * Checks if a note is still within the playable area.
     */
    private isNoteInPlayArea = (note: Note): boolean =>
        note.y <= Constants.HIT_LINE_Y + NOTE_VELOCITY;

    /**
     * Updates game statistics based on missed notes.
     */
    private updateGameStats = (
        s: State,
        missedCount: number,
    ): Pick<State, "consecutiveHits" | "multiplier" | "missedNotes"> => ({
        consecutiveHits: missedCount > 0 ? 0 : s.consecutiveHits,
        multiplier: missedCount > 0 ? 1 : s.multiplier,
        missedNotes: s.missedNotes + missedCount,
    });

    /**
     * Applies the Tick action to the current state.
     *
     * @param s The current state
     * @returns A new State object with updated notes and game statistics
     */
    apply = (s: State): State => {
        const missedNotesCount = s.notes.filter(this.isMissedNote).length;

        // Update note positions and remove notes outside game area
        const updatedNotes = s.notes
            .map(this.updateNotePosition)
            .filter(this.isNoteInPlayArea);

        // Combine multiple updates
        return {
            ...s,
            notes: updatedNotes,
            ...this.updateGameStats(s, missedNotesCount),
            shouldPlayRandomNote: false,
        };
    };
}

/**
 * The main state reducer function.
 *
 * @param s The current state
 * @param action The action to apply to the state
 * @returns A new State object after applying the action
 */
export const reduceState = (s: State, action: Action): State => action.apply(s);
