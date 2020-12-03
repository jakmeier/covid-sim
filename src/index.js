import css from "./style.css";
const { Simulation } = await
import ("../pkg").catch(e => console.error("Failed loading WASM module:", e));
import { JsSimulation } from "./lib";

export const HEALTHY = 0;
export const INFECTED_DAY_0 = 1;
export const INFECTED_DAY_MAX = 64;
export const IMMUNE = 100;
export const DEAD = 101;

let humans;
let htmlNodes;
let container;
let simulation;

let jsSimulation;
let rustSimulation;
let useJs = false;

let healthy = 0;
let infected = 0;
let immune = 0;
let dead = 0;

function main() {
    const mainElement = document.getElementsByTagName("main")[0];
    container = document.createElement("div");
    container.classList.add("container");
    mainElement.appendChild(container);

    rustSimulation = new Simulation();
    jsSimulation = new JsSimulation();
    simulation = rustSimulation;
    humans = new Uint8Array();

    reloadSettings();
    updateView();

    // Advance on space bar
    document.addEventListener('keydown', (evt) => {
        if (evt.key === ' ') { advance(); }
    });

    // Make functions globally available for onclick handler on button
    window.advance = advance;
    window.startStop = startStop;
    window.reloadSettings = reloadSettings;
    window.reloadLang = reloadLang;
    window.reset = reset;
}

function reloadSettings() {
    const form = document.getElementById("settings");
    const data = new FormData(form);
    const w = parseInt(data.get("width"));
    const h = parseInt(data.get("height"));
    const radius = parseInt(data.get("radius"));
    const recoveryDays = parseInt(data.get("recovery"));
    const infectionRate = parseFloat(data.get("infection_rate"));
    const deathRate = parseFloat(data.get("death_rate"));

    if (w * h != humans.length) {
        // Replace current state, set all values to 0 (HEALTHY)
        humans = new Uint8Array(w * h);
        generateHtmlNodes(w, h);
    }

    jsSimulation.reconfigure(w, h, radius, recoveryDays, infectionRate, deathRate);
    rustSimulation.reconfigure(w, h, radius, recoveryDays, infectionRate, deathRate);
}

function reloadLang() {
    useJs = document.getElementById("use-js").checked;
    if (useJs) {
        simulation = jsSimulation;
        document.getElementById("active-lang").textContent = "JS";
    } else {
        simulation = rustSimulation;
        document.getElementById("active-lang").textContent = "Rust";
    }
}


function reset() {
    humans = new Uint8Array(humans.length);
    htmlNodes.forEach((node) => {
        node.classList.add("healthy");
        node.classList.remove("infected");
        node.classList.remove("dead");
        node.classList.remove("immune");
    });
    setState(Math.floor(humans.length / 2), INFECTED_DAY_0);
    updateView();
}

function advance() {
    let newState = new Uint8Array(humans.length);
    const t0 = performance.now();
    simulation.next_day(humans, newState);
    const t1 = performance.now();
    for (let i = 0; i < htmlNodes.length; i++) {
        if (newState[i] != humans[i]) {
            setState(i, newState[i]);
        }
    }
    updateView();
    humans = newState;
    const t2 = performance.now();
    if (useJs) {
        console.log(`Updated in ${t2 - t0}ms  (${t1 - t0}ms computing in JS, ${t2 - t1}ms DOM updates in JS)`);
    } else {
        console.log(`Updated in ${t2 - t0}ms  (${t1 - t0}ms computing in Rust, ${t2 - t1}ms DOM updates in JS)`);
    }
}

let handle;
let isRunning = false;

function startStop() {
    const form = document.getElementById("settings");
    let simulationDelay = form.elements["delay"].value;
    if (isRunning) {
        clearInterval(handle);
        document.getElementById("start-stop-button").innerText = "Start Simulation";
    } else {
        handle = setInterval(advance, simulationDelay);
        document.getElementById("start-stop-button").innerText = "Stop Simulation";
    }
    isRunning = !isRunning;
}

function generateHtmlNodes(w, h) {
    const t0 = performance.now();
    while (container.firstChild) {
        container.removeChild(container.lastChild);
    }
    container.style.gridTemplateColumns = `repeat(${w},1fr)`;
    htmlNodes = [];
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const cell = document.createElement("div");
            cell.classList.add("human");
            cell.classList.add("healthy");
            cell.addEventListener("click", () => toggleInfected(x + y * w));
            container.appendChild(cell);
            htmlNodes.push(cell);
        }
    }
    const t1 = performance.now();
    console.log(`Created HTML nodes in ${t1 - t0}ms`);

    healthy = w * h;
    infected = 0;
    immune = 0;
    dead = 0;

    // Infect patient 0
    setState(Math.floor(humans.length / 2), INFECTED_DAY_0);
}

function updateView() {
    document.getElementById("legend-healthy").innerText = `Healthy (${healthy})`;
    document.getElementById("legend-infected").innerText = `Infected (${infected})`;
    document.getElementById("legend-immune").innerText = `Immune (${immune})`;
    document.getElementById("legend-dead").innerText = `Dead (${dead})`;
}


function setState(i, state) {
    // Remove old class
    if (humans[i] == HEALTHY) {
        htmlNodes[i].classList.remove("healthy");
        healthy -= 1;
    } else if (humans[i] >= INFECTED_DAY_0 && humans[i] <= INFECTED_DAY_MAX) {
        htmlNodes[i].classList.remove("infected");
        infected -= 1;
    } else if (humans[i] == IMMUNE) {
        htmlNodes[i].classList.remove("immune");
        immune -= 1;
    } else if (humans[i] == DEAD) {
        htmlNodes[i].classList.remove("dead");
        dead -= 1;
    }

    // Add new class
    if (state == HEALTHY) {
        htmlNodes[i].classList.add("healthy");
        healthy += 1;
    } else if (state >= INFECTED_DAY_0 && state <= INFECTED_DAY_MAX) {
        htmlNodes[i].classList.add("infected");
        infected += 1;
    } else if (state == IMMUNE) {
        htmlNodes[i].classList.add("immune");
        immune += 1;
    } else if (state == DEAD) {
        htmlNodes[i].classList.add("dead");
        dead += 1;
    }
    humans[i] = state;
}

function toggleInfected(index) {
    if (humans[index] == HEALTHY) {
        setState(index, INFECTED_DAY_0);
    } else {
        setState(index, HEALTHY);
    }
    updateView();
}

if (document.readyState != 'loading') {
    main();
} else {
    document.addEventListener('DOMContentLoaded', main);
}