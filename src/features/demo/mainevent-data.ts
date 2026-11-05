import type { BoutLevel, ScheduledRounds } from "@/domain/bout-enums";
import type { BoutResultInput } from "@/domain/bout-result";

/**
 * Contenido de demostración de Mainevent Championship. Cardenes, Santos y el afiche de «Main XXVIII: Rebound» vienen del
 * material entregado por la promotora (sin nombres de pila: se completan desde el panel). El resto de los peleadores y
 * los resultados de «Main XXVII» son ficticios, para mostrar el sitio con datos; se reemplazan desde el panel.
 */

type Record3 = [wins: number, losses: number, draws: number];

export type DemoFighter = {
  slug: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  nationality: string;
  division: string;
  /** Récord previo de Muay Thai (`pro`) y de Kickboxing (`amateur`). */
  muayThai?: Record3;
  kickboxing?: Record3;
  hometown: string | null;
  gym: string | null;
  heightCm: number | null;
  stance: "orthodox" | "southpaw";
  bio: string;
  birthDate: string | null;
  /** Fotos del material entregado (`scripts/demo-assets`). */
  photos?: { body: string; headshot: string };
};

export const DEMO_DIVISIONS: { name: string; gender: "male" | "female"; limitKg: number }[] = [
  { name: "Mosca", gender: "male", limitKg: 50.8 },
  { name: "Gallo", gender: "male", limitKg: 53.5 },
  { name: "Pluma", gender: "male", limitKg: 57.2 },
  { name: "Ligero", gender: "male", limitKg: 61.2 },
  { name: "Súper ligero", gender: "male", limitKg: 63.5 },
  { name: "Wélter", gender: "male", limitKg: 66.7 },
  { name: "Súper wélter", gender: "male", limitKg: 69.9 },
  { name: "Medio", gender: "male", limitKg: 72.6 },
  { name: "Semipesado", gender: "male", limitKg: 79.4 },
  { name: "Crucero", gender: "male", limitKg: 86.2 },
  { name: "Pesado", gender: "male", limitKg: 95.0 },
  { name: "Paja", gender: "female", limitKg: 47.6 },
  { name: "Mosca", gender: "female", limitKg: 50.8 },
  { name: "Gallo", gender: "female", limitKg: 53.5 },
  { name: "Pluma", gender: "female", limitKg: 57.2 },
];

const fighter = (data: Omit<DemoFighter, "hometown" | "gym" | "heightCm" | "birthDate" | "stance"> & Partial<DemoFighter>): DemoFighter => ({
  hometown: null,
  gym: null,
  heightCm: null,
  birthDate: null,
  stance: "orthodox",
  ...data,
});

export const DEMO_FIGHTERS: DemoFighter[] = [
  fighter({ slug: "cardenes", firstName: "", lastName: "Cardenes", nickname: null, nationality: "AR", division: "peso-super-ligero", muayThai: [9, 1, 0], bio: "Campeón continental WMO de peso súper ligero. Presión constante, rodillas y codos en el clinch.", photos: { body: "cardenes-body.png", headshot: "cardenes-headshot.jpg" } }),
  fighter({ slug: "santos", firstName: "", lastName: "Santos", nickname: null, nationality: "BR", division: "peso-super-ligero", muayThai: [11, 2, 0], stance: "southpaw", bio: "Zurdo brasileño de patadas largas. Llega a Buenos Aires por el cinturón continental WMO.", photos: { body: "santos-body.png", headshot: "santos-headshot.jpg" } }),
  fighter({ slug: "tomas-vidal", firstName: "Tomás", lastName: "Vidal", nickname: "Látigo", nationality: "CL", division: "peso-super-ligero", muayThai: [6, 3, 0], hometown: "Santiago", gym: "Andes Muay Thai", heightCm: 175, bio: "Patada de derecha y mucha distancia." }),
  fighter({ slug: "rodrigo-paredes", firstName: "Rodrigo", lastName: "Paredes", nickname: "El Muro", nationality: "CL", division: "peso-welter", muayThai: [12, 2, 1], hometown: "Valparaíso", gym: "Puerto Nak Muay", heightCm: 178, bio: "Campeón wélter de Muay Thai. Defensa sólida y codos al cierre del round." }),
  fighter({ slug: "lucas-ferreyra", firstName: "Lucas", lastName: "Ferreyra", nickname: "Rayo", nationality: "AR", division: "peso-welter", muayThai: [8, 3, 0], hometown: "Córdoba", gym: "Córdoba Fight Team", heightCm: 177, bio: "Ritmo alto y combinaciones de puño y patada baja." }),
  fighter({ slug: "kenji-morales", firstName: "Kenji", lastName: "Morales", nickname: null, nationality: "PE", division: "peso-welter", muayThai: [7, 2, 0], hometown: "Lima", gym: "Inka Muay Thai", heightCm: 176, stance: "southpaw", bio: "Técnico y paciente; especialista en el teep." }),
  fighter({ slug: "antonella-rios", firstName: "Antonella", lastName: "Ríos", nickname: "La Reina", nationality: "AR", division: "peso-paja-femenino", muayThai: [10, 1, 0], hometown: "Rosario", gym: "Rosario Nak Muay", heightCm: 158, bio: "Campeona paja de Muay Thai. Rodillas al cuerpo y mucho clinch." }),
  fighter({ slug: "daniela-correa", firstName: "Daniela", lastName: "Correa", nickname: "Dinamita", nationality: "CL", division: "peso-paja-femenino", muayThai: [6, 2, 0], hometown: "Concepción", gym: "Bío Bío Fight", heightCm: 156, bio: "Explosiva en los primeros rounds." }),
  fighter({ slug: "facundo-ibanez", firstName: "Facundo", lastName: "Ibáñez", nickname: "Tornado", nationality: "AR", division: "peso-ligero", kickboxing: [14, 2, 0], hometown: "Mendoza", gym: "Cuyo Kickboxing", heightCm: 174, bio: "Campeón ligero de Kickboxing. Manos rápidas y gancho de izquierda." }),
  fighter({ slug: "gabriel-souza", firstName: "Gabriel", lastName: "Souza", nickname: "Furacão", nationality: "BR", division: "peso-ligero", kickboxing: [12, 3, 0], hometown: "Porto Alegre", gym: "Sul Kickboxing", heightCm: 176, stance: "southpaw", bio: "Retador al título ligero de Kickboxing. Patada giratoria peligrosa." }),
  fighter({ slug: "ignacio-herrera", firstName: "Ignacio", lastName: "Herrera", nickname: null, nationality: "CL", division: "peso-ligero", kickboxing: [8, 4, 0], hometown: "Antofagasta", gym: "Norte Kickboxing", heightCm: 173, bio: "Duro y con mucho volumen de golpes." }),
  fighter({ slug: "martin-quiroga", firstName: "Martín", lastName: "Quiroga", nickname: "Toro", nationality: "UY", division: "peso-medio", kickboxing: [11, 1, 0], hometown: "Montevideo", gym: "Río de la Plata Fight", heightCm: 183, bio: "Campeón medio de Kickboxing, con pegada de nocaut en ambas manos." }),
  fighter({ slug: "bastian-molina", firstName: "Bastián", lastName: "Molina", nickname: null, nationality: "CL", division: "peso-medio", kickboxing: [7, 3, 0], hometown: "Temuco", gym: "Sur Combat", heightCm: 182, bio: "Fuerte en la distancia larga." }),
  fighter({ slug: "florencia-duarte", firstName: "Florencia", lastName: "Duarte", nickname: "Flor", nationality: "AR", division: "peso-mosca-femenino", kickboxing: [9, 2, 1], hometown: "La Plata", gym: "La Plata Kick", heightCm: 162, bio: "Campeona mosca de Kickboxing. Contragolpeadora precisa." }),
  fighter({ slug: "camila-reyes", firstName: "Camila", lastName: "Reyes", nickname: "Tormenta", nationality: "CL", division: "peso-mosca-femenino", kickboxing: [7, 2, 1], hometown: "Viña del Mar", gym: "Costa Fight", heightCm: 160, stance: "southpaw", bio: "Presión y patadas al cuerpo." }),
];

type Result = Omit<BoutResultInput, "submissionTechniqueId">;

export type DemoBout = {
  red: string;
  blue: string;
  level: BoutLevel;
  division?: string;
  catchweightKg?: number;
  rounds?: ScheduledRounds;
  title?: { championCorner: "red" | "blue" };
  posterTitle?: string;
  result?: Result;
};

export type DemoEvent = {
  number: number;
  name: string;
  /** Domingos: el afiche de Main XXVIII anuncia el domingo 29 de noviembre. */
  date: "upcoming" | "past";
  poster?: string;
  segments: { name: string; time: string; bouts: DemoBout[] }[];
};

const cards = (...judges: [number, number][]) => judges.map(([red, blue], index) => ({ judge: `Juez ${index + 1}`, red, blue }));

export const DEMO_EVENTS: DemoEvent[] = [
  {
    number: 27,
    name: "Main XXVII",
    date: "past",
    segments: [
      {
        name: "Cartelera estelar",
        time: "21:30",
        bouts: [
          { red: "cardenes", blue: "tomas-vidal", level: "pro", division: "peso-super-ligero", rounds: 5, result: { outcome: "red_win", method: "ko_tko", koTkoType: "ko", endRound: 2, endTimeSeconds: 104, bonuses: ["ko_of_night"], referee: "Ariel Gómez" } },
          { red: "facundo-ibanez", blue: "ignacio-herrera", level: "amateur", division: "peso-ligero", result: { outcome: "red_win", method: "decision", decisionType: "unanimous", scorecards: cards([30, 27], [29, 28], [30, 27]) } },
          { red: "lucas-ferreyra", blue: "rodrigo-paredes", level: "pro", division: "peso-welter", result: { outcome: "blue_win", method: "ko_tko", koTkoType: "tko_strikes", endRound: 3, endTimeSeconds: 141, bonuses: ["fight_of_night"] } },
        ],
      },
      {
        name: "Preliminares",
        time: "20:00",
        bouts: [
          { red: "antonella-rios", blue: "daniela-correa", level: "pro", division: "peso-paja-femenino", result: { outcome: "red_win", method: "decision", decisionType: "split", scorecards: cards([29, 28], [28, 29], [29, 28]) } },
          { red: "martin-quiroga", blue: "bastian-molina", level: "amateur", division: "peso-medio", result: { outcome: "red_win", method: "ko_tko", koTkoType: "ko", endRound: 1, endTimeSeconds: 77, bonuses: ["performance_of_night"] } },
          { red: "florencia-duarte", blue: "camila-reyes", level: "amateur", division: "peso-mosca-femenino", result: { outcome: "draw", method: "decision", decisionType: "majority", scorecards: cards([29, 28], [28, 28], [28, 28]) } },
        ],
      },
    ],
  },
  {
    number: 28,
    name: "Main XXVIII: Rebound",
    date: "upcoming",
    poster: "main-xxviii-poster.jpg",
    segments: [
      {
        name: "Cartelera estelar",
        time: "21:30",
        bouts: [
          { red: "cardenes", blue: "santos", level: "pro", division: "peso-super-ligero", rounds: 5, posterTitle: "WMO Continental Title Bout" },
          { red: "gabriel-souza", blue: "facundo-ibanez", level: "amateur", division: "peso-ligero", rounds: 5, title: { championCorner: "blue" } },
          { red: "rodrigo-paredes", blue: "kenji-morales", level: "pro", division: "peso-welter" },
        ],
      },
      {
        name: "Preliminares",
        time: "20:00",
        bouts: [
          { red: "camila-reyes", blue: "florencia-duarte", level: "amateur", division: "peso-mosca-femenino", posterTitle: "Revancha" },
          { red: "tomas-vidal", blue: "lucas-ferreyra", level: "pro", catchweightKg: 65 },
          { red: "daniela-correa", blue: "antonella-rios", level: "pro", division: "peso-paja-femenino", posterTitle: "Revancha" },
        ],
      },
    ],
  },
];

/** Campeones y rankings por disciplina (`pro` = Muay Thai, `amateur` = Kickboxing); `division: null` = libra por libra. */
export const DEMO_RANKINGS: { level: BoutLevel; division: string | null; champion?: string; ranking: string[] }[] = [
  { level: "pro", division: "peso-super-ligero", champion: "cardenes", ranking: ["santos", "tomas-vidal"] },
  { level: "pro", division: "peso-welter", champion: "rodrigo-paredes", ranking: ["kenji-morales", "lucas-ferreyra"] },
  { level: "pro", division: "peso-paja-femenino", champion: "antonella-rios", ranking: ["daniela-correa"] },
  { level: "pro", division: null, ranking: ["cardenes", "rodrigo-paredes", "antonella-rios", "santos", "kenji-morales"] },
  { level: "amateur", division: "peso-ligero", champion: "facundo-ibanez", ranking: ["gabriel-souza", "ignacio-herrera"] },
  { level: "amateur", division: "peso-medio", champion: "martin-quiroga", ranking: ["bastian-molina"] },
  { level: "amateur", division: "peso-mosca-femenino", champion: "florencia-duarte", ranking: ["camila-reyes"] },
  { level: "amateur", division: null, ranking: ["facundo-ibanez", "martin-quiroga", "florencia-duarte", "gabriel-souza", "camila-reyes"] },
];
