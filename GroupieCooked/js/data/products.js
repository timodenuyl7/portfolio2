export const PRODUCTS = {
  pils: { name: "Grolsch Pils", short: "PILS", kind: "drink", glass: "Pilsenerglas", glassShape: "pils", color: 0xf2bd3d },
  blond: { name: "Grolsch Blond", short: "BLOND", kind: "drink", glass: "Speciaalbierglas", glassShape: "tulip", color: 0xf0cd69 },
  weizen: { name: "Grolsch Weizen", short: "WEIZEN", kind: "drink", glass: "Weizenglas", glassShape: "weizen", color: 0xe9a332 },
  tripel: { name: "Grimbergen Tripel", short: "TRIPEL", kind: "drink", glass: "Kelkglas", glassShape: "chalice", color: 0xd8902b },
  stroh: { name: "Stroh 80", short: "STROH", kind: "drink", glass: "Shotglas", glassShape: "shot", color: 0xf3d07a },
  frikandel: { name: "Broodje frikandel", short: "FRIKA", kind: "snack", color: 0xc98b43 },
  kroket: { name: "Broodje kroket", short: "KROKET", kind: "snack", color: 0xb8793c },
  kaassouffle: { name: "Kaassouffle", short: "KAAS", kind: "snack", color: 0xe9bd55 }
};

export const LEVELS = [
  { title: "Pils & praat", drinks: ["pils"], snacks: [], customers: 6, startingOrders: 2, maxActiveOrders: 2, orderDelay: [12, 22], orderSize: 1, goal: 20 },
  { title: "Blond schuim", drinks: ["pils", "blond"], snacks: [], customers: 6, startingOrders: 2, maxActiveOrders: 2, orderDelay: [10, 18], orderSize: 1, goal: 20 },
  { title: "Speciaal van de tap", drinks: ["pils", "blond", "weizen", "tripel"], snacks: [], customers: 6, startingOrders: 2, maxActiveOrders: 3, orderDelay: [9, 16], orderSize: 2, goal: 20 },
  { title: "Een kleintje erbij", drinks: ["pils", "blond", "weizen", "tripel", "stroh"], snacks: [], customers: 9, startingOrders: 3, maxActiveOrders: 3, orderDelay: [8, 15], orderSize: 2, goal: 20 },
  { title: "Volle taps", drinks: ["pils", "blond", "weizen", "tripel", "stroh"], snacks: [], customers: 9, startingOrders: 3, maxActiveOrders: 3, orderDelay: [7, 13], orderSize: 2, goal: 20 },
  { title: "Ronde voor de hele tafel", drinks: ["pils", "blond", "weizen", "tripel", "stroh"], snacks: [], customers: 9, startingOrders: 3, maxActiveOrders: 4, orderDelay: [6, 12], orderSize: 2, goal: 20 },
  { title: "Dispuutsdrukte", drinks: ["pils", "blond", "weizen", "tripel", "stroh"], snacks: [], customers: 12, startingOrders: 4, maxActiveOrders: 4, orderDelay: [5, 10], orderSize: 3, goal: 20 }
];

export const PUZZLE_GOAL = 20;