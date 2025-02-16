/**
 * Inside this file you will use the classes and functions from rx.js
 * to add visuals to the svg element in index.html, animate them, and make them interactive.
 *
 * Study and complete the tasks in observable exercises first to get ideas.
 *
 * Course Notes showing Asteroids in FRP: https://tgdwyer.github.io/asteroids/
 *
 * You will be marked on your functional programming style
 * as well as the functionality that you implement.
 *
 * Document your code!
 */
import "./style.css";
import { Observable, interval, merge, fromEvent, zip } from "rxjs";
import { map, filter, scan, delay, withLatestFrom } from "rxjs/operators";
import * as Tone from "tone";
import { SampleLibrary } from "./tonejs-instruments";
import {
    Constants,
    initialState,
    State,
    Viewport,
    Action,
    Note,
    Key,
} from "./types";
import { reduceState, AddNotes, KeyPress, Tick, PlayRandomNote } from "./state";
import { hide, render, show } from "./view";
import {
    createRandomDurationStream,
    createRandomPitchStream,
    parseCSV,
} from "./observable";

/**
 * Initializes and runs the main game loop
 * @param csvContents The contents of the CSV file containing note data
 * @param samples An object containing Tone.Sampler instances for each instrument
 */
export function main(
    csvContents: string,
    samples: { [key: string]: Tone.Sampler },
): void {
    // Set up canvas elements
    const svg = document.querySelector("#svgCanvas") as SVGGraphicsElement &
        HTMLElement;
    const gameover = document.querySelector("#gameOver") as SVGGraphicsElement &
        HTMLElement;
    svg.setAttribute("height", `${Viewport.CANVAS_HEIGHT}`);
    svg.setAttribute("width", `${Viewport.CANVAS_WIDTH}`);

    // Create Observable Streams

    // Parse the CSV contents
    const notes$: Observable<Note> = parseCSV(csvContents);

    /**
     * Creates an Observable stream for a specific key press event.
     *
     * @param keyCode - The key code to listen for (e.g., "KeyH", "KeyJ", "KeyK", "KeyL")
     * @returns An Observable that emits KeyPress actions when the specified key is pressed
     */
    const createKeyStream = (keyCode: Key): Observable<KeyPress> =>
        fromEvent<KeyboardEvent>(document, "keypress").pipe(
            filter(({ code, repeat }) => code === keyCode && !repeat),
            map(() => new KeyPress(keyCode)),
        );

    /**
     * Combines individual key press streams into a single stream of all valid key presses.
     */
    const keyPress$: Observable<KeyPress> = merge(
        createKeyStream("KeyH"),
        createKeyStream("KeyJ"),
        createKeyStream("KeyK"),
        createKeyStream("KeyL"),
    );

    // Stream of user-playable notes
    const userPlayableNotes$: Observable<AddNotes> = notes$.pipe(
        filter((n) => n.user_played),
        map((note) => new AddNotes(note)),
    );
    // Stream of non-user-playable notes
    const nonUserPlayableNotes$ = notes$.pipe(
        filter((n) => n.user_played === false),
        delay(Constants.NOTE_FALL_TIME),
    );

    const tick$: Observable<Tick> = interval(Constants.TICK_RATE_MS).pipe(
        map(() => new Tick()),
    );

    // Create streams for random pitch and duration
    const randomPitch$ = createRandomPitchStream(tick$);
    const randomDuration$ = createRandomDurationStream(tick$);

    // Combine random pitch and duration, and map to PlayRandomNote action
    const randomNoteStream$ = zip(randomPitch$, randomDuration$).pipe(
        map(() => new PlayRandomNote()),
    );

    // Merge all action streams
    const action$: Observable<Action> = merge(
        tick$,
        userPlayableNotes$,
        keyPress$,
        randomNoteStream$,
    );

    // Create the state stream
    const state$: Observable<State> = action$.pipe(
        scan(reduceState, initialState),
    );

    const playHitNote = (s: State) => {
        s.notes.forEach((note) => {
            if (note.hit) {
                const noteName = Tone.Frequency(note.pitch, "midi").toNote();
                samples[String(note.instrumentName)].triggerAttackRelease(
                    noteName,
                    note.end - note.start,
                    undefined,
                    note.velocity * 0.8,
                );
            }
        });
    };

    const playRandomNote = (
        pitch: number,
        duration: number,
        samples: { [key: string]: Tone.Sampler },
    ) => {
        const noteName = Tone.Frequency(pitch, "midi").toNote();
        samples["piano"].triggerAttackRelease(
            noteName,
            duration,
            undefined,
            1.4,
        );
    };

    // Subscription for handling side effects
    const subscription$ = state$
        .pipe(withLatestFrom(randomPitch$, randomDuration$))
        .subscribe(([s, randomPitch, randomDuration]) => {
            render(s);
            playHitNote(s);
            if (s.shouldPlayRandomNote) {
                playRandomNote(randomPitch, randomDuration, samples);
            }
            if (s.gameEnd) {
                show(gameover);
                subscription$.unsubscribe();
                playNonUserPlayableNotes$.unsubscribe();
            } else {
                hide(gameover);
            }
        });

    // Subscription to play non-user-playable notes
    const playNonUserPlayableNotes$ = nonUserPlayableNotes$.subscribe(
        (note) => {
            const noteName = Tone.Frequency(note.pitch, "midi").toNote();
            samples[String(note.instrumentName)].triggerAttackRelease(
                noteName,
                note.end - note.start,
                undefined,
                note.velocity * 0.8,
            );
        },
    );
}

// The following simply runs your main function on window load.  Make sure to leave it in place.
// You should not need to change this, beware if you are.
if (typeof window !== "undefined") {
    const samples = SampleLibrary.load({
        instruments: [
            "bass-electric",
            "violin",
            "piano",
            "trumpet",
            "saxophone",
            "trombone",
            "flute",
        ],
        baseUrl: "samples/",
    });

    const startGame = (contents: string) => {
        document.body.addEventListener(
            "mousedown",
            () => main(contents, samples),
            { once: true },
        );
    };

    const { protocol, hostname, port } = new URL(import.meta.url);
    const baseUrl = `${protocol}//${hostname}${port ? `:${port}` : ""}`;

    Tone.ToneAudioBuffer.loaded().then(() => {
        Object.values(samples).forEach((sample) => {
            sample.toDestination();
            sample.release = 0.5;
        });

        fetch(`${baseUrl}/assets/${Constants.SONG_NAME}.csv`)
            .then((response) => response.text())
            .then(startGame)
            .catch((error) =>
                console.error("Error fetching the CSV file:", error),
            );
    });
}
