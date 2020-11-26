// Mirroring the behaviour of lib.rs in JavaScript for measuring the performance difference.

import { HEALTHY, INFECTED_DAY_0, INFECTED_DAY_MAX, IMMUNE, DEAD } from "./index";

export class JsSimulation {
    constructor(name, year) {
        this.w = 0;
        this.h = 0;
        this.recovery = 0;
        this.infection_rate = 0.0;
        this.death_rate = 0.0;
    }
    reconfigure(
        w,
        h,
        radius,
        recovery,
        infection_rate,
        death_rate,
    ) {
        this.w = w;
        this.h = h;
        this.radius = radius;
        this.recovery = recovery;
        this.infection_rate = infection_rate;
        this.death_rate = death_rate;
    }
    next_day(input, output) {
        for (let x = 0; x < this.w; x++) {
            for (let y = 0; y < this.h; y++) {
                const current = this.get(input, x, y);
                let next = current;
                if (current == HEALTHY) {
                    if (this.chance_to_catch_covid_today(input, x, y) > Math.random()) {
                        next = INFECTED_DAY_0 + 1;
                    }
                } else if (current >= INFECTED_DAY_0 && current <= INFECTED_DAY_MAX) {
                    if (this.death_rate > Math.random()) {
                        next = DEAD;
                    } else if (current >= INFECTED_DAY_0 && current <= INFECTED_DAY_MAX && (current - INFECTED_DAY_0) >= this.recovery) {
                        next = IMMUNE;
                    } else {
                        next = current + 1;
                    }
                }
                this.set(output, x, y, next);
            }
        }
    }
    chance_to_catch_covid_today(input, x, y) {
        let infected_neighbours = 0;
        const start_x = Math.max(0, x - this.radius);
        const start_y = Math.max(0, y - this.radius);
        const end_x = Math.min(x + this.radius + 1, this.w);
        const end_y = Math.min(y + this.radius + 1, this.h);
        for (let j = start_y; j < end_y; j++) {
            for (let i = start_x; i < end_x; i++) {
                const neighbour = this.get(input, i, j);
                if (neighbour >= INFECTED_DAY_0 && neighbour <= INFECTED_DAY_MAX) {
                    infected_neighbours += 1;
                }
            }
        }
        let p_healthy = Math.pow(1.0 - this.infection_rate, infected_neighbours);
        return 1.0 - p_healthy;
    }
    get(input, x, y) {
        return input[x + y * this.w];
    }
    set(output, x, y, status) {
        output[x + y * this.w] = status;
    }
}