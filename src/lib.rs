use rand::rngs::SmallRng;
use rand::{Rng, SeedableRng};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Simulation {
    w: usize,
    h: usize,
    radius: usize,
    recovery: u8,
    infection_rate: f32,
    death_rate: f32,
    rng: SmallRng,
}
#[wasm_bindgen]
impl Simulation {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Simulation {
        // This makes Rust print a useful stack trace in the console when it panics.
        // Should only be used for debugging. This can easily be achieved with conditional compilation flags.
        // The line below only gets executed when running in development mode.
        #[cfg(debug_assertions)]
        console_error_panic_hook::set_once();

        // Create small, cheap to initialize and fast RNG with a random seed.
        // The randomness is supplied by the operating system.
        let rng = SmallRng::from_entropy();

        Simulation {
            w: 0,
            h: 0,
            radius: 1,
            recovery: 1,
            infection_rate: 0.01,
            death_rate: 0.01,
            rng,
        }
    }
    pub fn reconfigure(
        &mut self,
        w: usize,
        h: usize,
        radius: usize,
        recovery: u8,
        infection_rate: f32,
        death_rate: f32,
    ) {
        self.w = w;
        self.h = h;
        self.radius = radius;
        self.recovery = recovery;
        self.infection_rate = infection_rate;
        self.death_rate = death_rate;
    }
}

#[derive(Clone, Copy)]
enum InfectionStatus {
    Healthy,
    Infected(u8),
    Immune,
    Dead,
}
use InfectionStatus::*;

#[wasm_bindgen]
impl Simulation {
    pub fn next_day(&mut self, input: &[u8], output: &mut [u8]) {
        for x in 0..self.w {
            for y in 0..self.h {
                let current = self.get(input, x, y);
                let mut next = current;
                match current {
                    Healthy => {
                        if self.chance_to_catch_covid_today(input, x, y) > self.rng.gen() {
                            next = Infected(1);
                        }
                    }
                    Infected(days) => {
                        if self.death_rate > self.rng.gen() {
                            next = Dead;
                        } else if days >= self.recovery {
                            next = Immune;
                        } else {
                            next  = Infected(days + 1);
                        }
                    }
                    Dead | Immune => { /* NOP */ }
                }
                self.set(output, x, y, next);
            }
        }
    }
    fn chance_to_catch_covid_today(&self, input: &[u8], x: usize, y: usize) -> f32 {
        let mut infected_neighbours = 0;
        let start_x = x.saturating_sub(self.radius);
        let start_y = y.saturating_sub(self.radius);
        let end_x = (x + self.radius + 1).min(self.w);
        let end_y = (y + self.radius + 1).min(self.h);
        for j in start_y..end_y {
            for i in start_x..end_x {
                if let Infected(_days) = self.get(input, i, j) {
                    infected_neighbours += 1;
                }
            }
        }
        let p_healthy = (1.0 - self.infection_rate).powi(infected_neighbours);
        1.0 - p_healthy
    }
}
impl Simulation {
    fn get(&self, array: &[u8], x: usize, y: usize) -> InfectionStatus {
        InfectionStatus::from_u8(array[x + y * self.w])
    }
    fn set(&self, array: &mut [u8], x: usize, y: usize, status: InfectionStatus) {
        array[x + y * self.w] = status.to_u8();
    }
}

impl InfectionStatus {
    fn from_u8(num: u8) -> Self {
        match num {
            0 => Healthy,
            1...65 => Infected(num),
            100 => Immune,
            101 => Dead,
            _ => panic!("Invalid infection status: {}", num),
        }
    }
    fn to_u8(self) -> u8 {
        match self {
            Healthy => 0,
            Infected(days) => days,
            Immune => 100,
            Dead => 101,
        }
    }
}
