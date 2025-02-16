import { COLORS, Constants, Note, State } from "./types";

/**
 * Displays an SVG element on the canvas and brings it to the foreground.
 * This function is used to make elements visible
 *
 * @param elem SVG element to display
 */
export const show = (elem: SVGGraphicsElement): void => {
    elem.setAttribute("visibility", "visible");
    elem.parentNode!.appendChild(elem);
};

/**
 * Hides an SVG element on the canvas.
 * This function is used to make elements invisible
 *
 * @param elem SVG element to hide
 */
export const hide = (elem: SVGGraphicsElement): void =>
    elem.setAttribute("visibility", "hidden");

/**
 * Creates an SVG element with the given properties.
 *
 * @param namespace Namespace of the SVG element
 * @param name SVGElement name (e.g., 'circle', 'rect')
 * @param props Properties to set on the SVG element
 * @returns Created SVG element
 */
export const createSvgElement = (
    namespace: string | null,
    name: string,
    props: Record<string, string> = {},
): SVGElement => {
    const elem = document.createElementNS(namespace, name) as SVGElement;
    Object.entries(props).forEach(([k, v]: [string, string]) =>
        elem.setAttribute(k, v),
    );
    return elem;
};

/**
 * Creates an SVG element representing a note.
 * This function generates the visual representation of a note.
 *
 * @param note The note data to represent
 * @param namespace SVG namespace
 * @returns SVG element representing the note
 */
const createNoteSvgElement = (
    note: Readonly<Note>,
    namespace: string | null,
): SVGElement =>
    createSvgElement(namespace, "circle", {
        id: note.id,
        r: `${Note.RADIUS}`,
        cx: `${note.column * 20 + 20}%`,
        cy: `${note.y}`,
        fill: COLORS[note.column],
        class: "note shadow",
    });

/**
 * Renders the current game state on the SVG canvas.
 * This function updates the visual representation of notes and game statistics.
 *
 * @param s The current State of the game
 */
export const render = (s: State): void => {
    // Retrieve the SVG canvas element
    const svg = document.querySelector("#svgCanvas") as SVGGraphicsElement;
    if (!svg) return; // Exit if SVG element is not found

    // Function to manage individual note elements
    const manageNoteElement = (note: Readonly<Note>): void => {
        const elem = document.getElementById(note.id);

        // Ternary operator to handle different note scenarios
        note.y > Constants.HIT_LINE_Y
            ? elem && svg.removeChild(elem) // Remove note if it's past the hit line
            : elem
              ? elem.setAttribute("cy", `${note.y}`) // Update position if note exists
              : svg.appendChild(createNoteSvgElement(note, svg.namespaceURI)); // Create new note if it doesn't exist
    };

    // Process all of the notes in the current state
    s.notes.forEach(manageNoteElement);

    // Function to update game statistic displays
    const updateStatDisplay = (id: string, value: string): void => {
        const element = document.getElementById(id);
        if (element) {
            if (id === "multiplierText") {
                element.textContent = `${value}x`;
            } else {
                element.textContent = value;
            }
        }
    };

    // Update various game statistics
    updateStatDisplay("scoreText", Math.round(s.score).toString());
    updateStatDisplay("missedText", s.missedNotes.toString());
    updateStatDisplay("multiplierText", s.multiplier.toFixed(1));
    updateStatDisplay("comboText", s.consecutiveHits.toString());
};
