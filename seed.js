const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'soccer-app',
  password: '12345678',
  port: 5432,
});

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Clear existing data (order matters for FK constraints)
    await client.query('DELETE FROM match_events');
    await client.query('DELETE FROM matches');
    await client.query('DELETE FROM players');
    await client.query('DELETE FROM teams');

    // ── TEAMS ──────────────────────────────────────────────
    const teams = [
      [1,  'Arsenal FC',           'Premier League', 'Emirates Stadium',          1886, null],
      [2,  'Liverpool FC',         'Premier League', 'Anfield',                   1892, null],
      [3,  'Manchester City',      'Premier League', 'Etihad Stadium',            1880, null],
      [4,  'Chelsea FC',           'Premier League', 'Stamford Bridge',           1905, null],
      [5,  'Tottenham Hotspur',    'Premier League', 'Tottenham Hotspur Stadium', 1882, null],
      [6,  'Real Madrid CF',       'La Liga',        'Santiago Bernabéu',         1902, null],
      [7,  'FC Barcelona',         'La Liga',        'Estadio Olímpic',           1899, null],
      [8,  'Atlético de Madrid',   'La Liga',        'Cívitas Metropolitano',     1903, null],
      [9,  'FC Bayern Munich',     'Bundesliga',     'Allianz Arena',             1900, null],
      [10, 'Borussia Dortmund',    'Bundesliga',     'Signal Iduna Park',         1909, null],
      [11, 'AC Milan',             'Serie A',        'San Siro',                  1899, null],
      [12, 'Inter Milan',          'Serie A',        'San Siro',                  1908, null],
      [13, 'Paris Saint-Germain',  'Ligue 1',        'Parc des Princes',          1970, null],
      [14, 'Olympique de Marseille','Ligue 1',       'Orange Vélodrome',          1899, null],
    ];

    for (const t of teams) {
      await client.query(
        'INSERT INTO teams (team_id, team_name, league, stadium, founded_year, logo_url) VALUES ($1,$2,$3,$4,$5,$6)',
        t
      );
    }
    console.log(`Inserted ${teams.length} teams`);

    // ── PLAYERS ────────────────────────────────────────────
    // [player_id, team_id, player_name, position, nationality, goals, assists, appearances]
    const players = [
      // Arsenal (1)
      [101, 1, 'David Raya',        'GK',  'Spain',     0,  0, 28],
      [102, 1, 'Ben White',         'DF',  'England',   2,  3, 26],
      [103, 1, 'William Saliba',    'DF',  'France',    3,  1, 27],
      [104, 1, 'Oleksandr Zinchenko','DF', 'Ukraine',   1,  5, 20],
      [105, 1, 'Thomas Partey',     'MF',  'Ghana',     2,  4, 22],
      [106, 1, 'Martin Ødegaard',   'MF',  'Norway',    8, 10, 25],
      [107, 1, 'Bukayo Saka',       'FW',  'England',  14,  9, 28],
      [108, 1, 'Leandro Trossard',  'FW',  'Belgium',   7,  5, 24],
      [109, 1, 'Kai Havertz',       'FW',  'Germany',  12,  6, 27],
      [110, 1, 'Gabriel Martinelli','FW',  'Brazil',    9,  7, 23],

      // Liverpool (2)
      [201, 2, 'Alisson Becker',    'GK',  'Brazil',    0,  0, 26],
      [202, 2, 'Trent Alexander-Arnold','DF','England', 3, 11, 25],
      [203, 2, 'Virgil van Dijk',   'DF',  'Netherlands',2, 2, 27],
      [204, 2, 'Andy Robertson',    'DF',  'Scotland',  1,  8, 24],
      [205, 2, 'Alexis Mac Allister','MF', 'Argentina', 6,  7, 26],
      [206, 2, 'Dominik Szoboszlai','MF',  'Hungary',   5,  6, 25],
      [207, 2, 'Mohamed Salah',     'FW',  'Egypt',    21,  9, 27],
      [208, 2, 'Darwin Núñez',      'FW',  'Uruguay',  13,  5, 24],
      [209, 2, 'Luis Díaz',         'FW',  'Colombia', 10,  7, 23],
      [210, 2, 'Cody Gakpo',        'FW',  'Netherlands',8, 4, 22],

      // Manchester City (3)
      [301, 3, 'Ederson',           'GK',  'Brazil',    0,  0, 25],
      [302, 3, 'Kyle Walker',       'DF',  'England',   1,  3, 22],
      [303, 3, 'Rúben Dias',        'DF',  'Portugal',  2,  1, 26],
      [304, 3, 'Manuel Akanji',     'DF',  'Switzerland',1, 0, 24],
      [305, 3, 'Rodri',             'MF',  'Spain',     5,  8, 23],
      [306, 3, 'Kevin De Bruyne',   'MF',  'Belgium',   7, 13, 20],
      [307, 3, 'Bernardo Silva',    'MF',  'Portugal',  6,  9, 25],
      [308, 3, 'Phil Foden',        'FW',  'England',  15,  8, 27],
      [309, 3, 'Erling Haaland',    'FW',  'Norway',   26,  5, 26],
      [310, 3, 'Jeremy Doku',       'FW',  'Belgium',   6, 10, 22],

      // Chelsea (4)
      [401, 4, 'Robert Sánchez',    'GK',  'Spain',     0,  0, 24],
      [402, 4, 'Reece James',       'DF',  'England',   2,  5, 18],
      [403, 4, 'Levi Colwill',      'DF',  'England',   1,  1, 25],
      [404, 4, 'Marc Cucurella',    'DF',  'Spain',     0,  3, 23],
      [405, 4, 'Moises Caicedo',    'MF',  'Ecuador',   3,  4, 26],
      [406, 4, 'Enzo Fernández',    'MF',  'Argentina', 4,  7, 24],
      [407, 4, 'Cole Palmer',       'FW',  'England',  18, 10, 27],
      [408, 4, 'Nicolas Jackson',   'FW',  'Senegal',  12,  4, 25],
      [409, 4, 'Noni Madueke',      'FW',  'England',   7,  6, 23],

      // Tottenham (5)
      [501, 5, 'Guglielmo Vicario', 'GK',  'Italy',     0,  0, 26],
      [502, 5, 'Pedro Porro',       'DF',  'Spain',     3,  6, 25],
      [503, 5, 'Cristian Romero',   'DF',  'Argentina', 2,  0, 24],
      [504, 5, 'Destiny Udogie',    'DF',  'Italy',     1,  4, 23],
      [505, 5, 'Yves Bissouma',     'MF',  'Mali',      1,  2, 22],
      [506, 5, 'James Maddison',    'MF',  'England',   7,  9, 20],
      [507, 5, 'Dejan Kulusevski',  'FW',  'Sweden',    8,  8, 24],
      [508, 5, 'Heung-min Son',     'FW',  'South Korea',13, 6, 26],
      [509, 5, 'Dominic Solanke',   'FW',  'England',  11,  3, 25],

      // Real Madrid (6)
      [601, 6, 'Andriy Lunin',      'GK',  'Ukraine',   0,  0, 20],
      [602, 6, 'Dani Carvajal',     'DF',  'Spain',     2,  4, 18],
      [603, 6, 'Antonio Rüdiger',   'DF',  'Germany',   3,  1, 22],
      [604, 6, 'Éder Militão',      'DF',  'Brazil',    2,  0, 21],
      [605, 6, 'Ferland Mendy',     'DF',  'France',    1,  3, 19],
      [606, 6, 'Aurélien Tchouaméni','MF', 'France',    4,  3, 23],
      [607, 6, 'Federico Valverde', 'MF',  'Uruguay',   8,  7, 25],
      [608, 6, 'Luka Modrić',       'MF',  'Croatia',   4,  9, 20],
      [609, 6, 'Vinícius Júnior',   'FW',  'Brazil',   19, 11, 26],
      [610, 6, 'Kylian Mbappé',     'FW',  'France',   24,  8, 27],
      [611, 6, 'Rodrygo',           'FW',  'Brazil',   10,  7, 24],

      // Barcelona (7)
      [701, 7, 'Inaki Peña',        'GK',  'Spain',     0,  0, 22],
      [702, 7, 'Jules Koundé',      'DF',  'France',    3,  2, 25],
      [703, 7, 'Pau Cubarsí',       'DF',  'Spain',     2,  1, 23],
      [704, 7, 'Alejandro Balde',   'DF',  'Spain',     2,  6, 24],
      [705, 7, 'Marc Casadó',       'MF',  'Spain',     1,  3, 22],
      [706, 7, 'Pedri',             'MF',  'Spain',     7, 11, 20],
      [707, 7, 'Gavi',              'MF',  'Spain',     5,  8, 19],
      [708, 7, 'Raphinha',          'FW',  'Brazil',   16,  9, 26],
      [709, 7, 'Robert Lewandowski','FW',  'Poland',   22,  6, 27],
      [710, 7, 'Lamine Yamal',      'FW',  'Spain',    13, 12, 25],

      // Atlético (8)
      [801, 8, 'Jan Oblak',         'GK',  'Slovenia',  0,  0, 25],
      [802, 8, 'Nahuel Molina',     'DF',  'Argentina', 3,  5, 23],
      [803, 8, 'José Giménez',      'DF',  'Uruguay',   2,  1, 22],
      [804, 8, 'Reinildo',          'DF',  'Mozambique',0,  1, 20],
      [805, 8, 'Rodrigo De Paul',   'MF',  'Argentina', 4,  8, 24],
      [806, 8, 'Pablo Barrios',     'MF',  'Spain',     3,  4, 21],
      [807, 8, 'Antoine Griezmann', 'FW',  'France',   13,  9, 25],
      [808, 8, 'Julián Álvarez',    'FW',  'Argentina',16,  7, 26],
      [809, 8, 'Samuel Lino',       'FW',  'Spain',     5,  6, 22],

      // Bayern (9)
      [901, 9, 'Manuel Neuer',      'GK',  'Germany',   0,  0, 22],
      [902, 9, 'Josip Stanisic',    'DF',  'Croatia',   1,  2, 20],
      [903, 9, 'Min-jae Kim',       'DF',  'South Korea',3, 0, 25],
      [904, 9, 'Dayot Upamecano',   'DF',  'France',    2,  0, 24],
      [905, 9, 'Alphonso Davies',   'DF',  'Canada',    2,  7, 23],
      [906, 9, 'Joshua Kimmich',    'MF',  'Germany',   5, 10, 25],
      [907, 9, 'Leon Goretzka',     'MF',  'Germany',   6,  5, 21],
      [908, 9, 'Jamal Musiala',     'FW',  'Germany',  16, 11, 26],
      [909, 9, 'Harry Kane',        'FW',  'England',  27,  8, 27],
      [910, 9, 'Leroy Sané',        'FW',  'Germany',  10,  9, 23],
      [911, 9, 'Serge Gnabry',      'FW',  'Germany',   7,  5, 20],

      // Dortmund (10)
      [1001,10,'Gregor Kobel',      'GK',  'Switzerland',0, 0, 24],
      [1002,10,'Julian Ryerson',    'DF',  'Norway',    1,  3, 22],
      [1003,10,'Nico Schlotterbeck','DF',  'Germany',   3,  1, 25],
      [1004,10,'Waldemar Anton',    'DF',  'Germany',   2,  0, 23],
      [1005,10,'Marcel Sabitzer',   'MF',  'Austria',   5,  6, 24],
      [1006,10,'Pascal Gross',      'MF',  'Germany',   4,  8, 22],
      [1007,10,'Karim Adeyemi',     'FW',  'Germany',   9,  5, 23],
      [1008,10,'Serhou Guirassy',   'FW',  'Guinea',   18,  4, 26],
      [1009,10,'Donyell Malen',     'FW',  'Netherlands',7, 6, 21],

      // AC Milan (11)
      [1101,11,'Mike Maignan',      'GK',  'France',    0,  0, 25],
      [1102,11,'Davide Calabria',   'DF',  'Italy',     1,  2, 22],
      [1103,11,'Malick Thiaw',      'DF',  'Germany',   2,  0, 23],
      [1104,11,'Fikayo Tomori',     'DF',  'England',   2,  1, 24],
      [1105,11,'Theo Hernández',    'DF',  'France',    5,  7, 25],
      [1106,11,'Tijjani Reijnders', 'MF',  'Netherlands',8, 6, 26],
      [1107,11,'Youssouf Fofana',   'MF',  'France',    3,  4, 24],
      [1108,11,'Christian Pulisic', 'FW',  'USA',      13,  9, 26],
      [1109,11,'Álvaro Morata',     'FW',  'Spain',    11,  5, 25],
      [1110,11,'Rafael Leão',       'FW',  'Portugal', 14,  8, 26],

      // Inter Milan (12)
      [1201,12,'Yann Sommer',       'GK',  'Switzerland',0, 0, 24],
      [1202,12,'Matteo Darmian',    'DF',  'Italy',     1,  2, 21],
      [1203,12,'Francesco Acerbi',  'DF',  'Italy',     2,  1, 22],
      [1204,12,'Alessandro Bastoni','DF',  'Italy',     3,  4, 25],
      [1205,12,'Hakan Çalhanoğlu',  'MF',  'Turkey',    8, 10, 25],
      [1206,12,'Nicolò Barella',    'MF',  'Italy',     6, 11, 26],
      [1207,12,'Henrikh Mkhitaryan','MF',  'Armenia',   4,  6, 22],
      [1208,12,'Lautaro Martínez',  'FW',  'Argentina',19,  7, 27],
      [1209,12,'Marcus Thuram',     'FW',  'France',   15,  6, 26],
      [1210,12,'Mehdi Taremi',      'FW',  'Iran',      9,  5, 23],

      // PSG (13)
      [1301,13,'Gianluigi Donnarumma','GK','Italy',    0,  0, 25],
      [1302,13,'Achraf Hakimi',     'DF',  'Morocco',   4,  8, 26],
      [1303,13,'Marquinhos',        'DF',  'Brazil',    3,  2, 25],
      [1304,13,'Lucas Hernández',   'DF',  'France',    1,  1, 18],
      [1305,13,'Nuno Mendes',       'DF',  'Portugal',  1,  5, 22],
      [1306,13,'Vitinha',           'MF',  'Portugal',  5,  7, 24],
      [1307,13,'João Neves',        'MF',  'Portugal',  3,  6, 23],
      [1308,13,'Ousmane Dembélé',   'FW',  'France',   14, 11, 25],
      [1309,13,'Bradley Barcola',   'FW',  'France',   12,  8, 24],
      [1310,13,'Gonçalo Ramos',     'FW',  'Portugal', 13,  5, 25],

      // Marseille (14)
      [1401,14,'Pau López',         'GK',  'Spain',     0,  0, 22],
      [1402,14,'Jonathan Clauss',   'DF',  'France',    2,  6, 23],
      [1403,14,'Leonardo Balerdi',  'DF',  'Argentina', 2,  0, 24],
      [1404,14,'Lilian Brassier',   'DF',  'France',    1,  1, 22],
      [1405,14,'Adrien Rabiot',     'MF',  'France',    4,  5, 25],
      [1406,14,'Geoffrey Kondogbia','MF',  'Central African Republic',2,3,21],
      [1407,14,'Mason Greenwood',   'FW',  'England',  13,  7, 25],
      [1408,14,'Pierre-Emerick Aubameyang','FW','Gabon',8, 4, 20],
    ];

    for (const p of players) {
      await client.query(
        'INSERT INTO players (player_id, team_id, player_name, position, nationality, goals, assists, appearances) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
        p
      );
    }
    console.log(`Inserted ${players.length} players`);

    // ── MATCHES ────────────────────────────────────────────
    // Dates around today (2026-03-05)
    // [match_id, home_team_id, away_team_id, match_date, home_score, away_score, status]
    const matches = [
      [1,  1,  2,  '2026-03-05T19:45:00Z', 2, 1, 'live'],       // Arsenal vs Liverpool — LIVE
      [2,  6,  3,  '2026-03-05T20:45:00Z', null, null, 'upcoming'], // Real Madrid vs Man City — tonight
      [3,  7,  8,  '2026-03-07T21:00:00Z', null, null, 'upcoming'], // Barcelona vs Atlético — Sat
      [4,  9,  10, '2026-03-08T15:30:00Z', null, null, 'upcoming'], // Bayern vs Dortmund — Sun
      [5,  4,  5,  '2026-03-09T20:00:00Z', null, null, 'upcoming'], // Chelsea vs Spurs — Mon
      [6,  13, 11, '2026-03-10T21:00:00Z', null, null, 'upcoming'], // PSG vs AC Milan — Tue
      [7,  3,  6,  '2026-02-26T20:45:00Z', 3, 1, 'finished'],   // Man City vs Real Madrid — finished
      [8,  9,  12, '2026-02-25T20:45:00Z', 2, 2, 'finished'],   // Bayern vs Inter — finished
      [9,  2,  7,  '2026-02-22T20:00:00Z', 4, 2, 'finished'],   // Liverpool vs Barcelona — finished
      [10, 11, 13, '2026-02-20T21:00:00Z', 1, 1, 'finished'],   // AC Milan vs PSG — finished
    ];

    for (const m of matches) {
      await client.query(
        'INSERT INTO matches (match_id, home_team_id, away_team_id, match_date, home_score, away_score, status) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        m
      );
    }
    console.log(`Inserted ${matches.length} matches`);

    // ── MATCH EVENTS ───────────────────────────────────────
    // [event_id, match_id, player_id, event_type, minute]
    const events = [
      // Match 1: Arsenal 2-1 Liverpool (LIVE, 72')
      [1,  1, 109, 'goal',       23],  // Havertz
      [2,  1, 207, 'goal',       41],  // Salah (equaliser)
      [3,  1, 107, 'goal',       67],  // Saka (Arsenal lead)
      [4,  1, 203, 'yellow_card',55],  // Van Dijk
      [5,  1, 105, 'yellow_card',38],  // Partey

      // Match 7: Man City 3-1 Real Madrid (finished)
      [6,  7, 309, 'goal',       12],  // Haaland
      [7,  7, 610, 'goal',       34],  // Mbappé
      [8,  7, 308, 'goal',       58],  // Foden
      [9,  7, 309, 'goal',       79],  // Haaland
      [10, 7, 609, 'yellow_card',60],  // Vinícius

      // Match 8: Bayern 2-2 Inter (finished)
      [11, 8, 909, 'goal',        8],  // Kane
      [12, 8,1208, 'goal',       31],  // Lautaro
      [13, 8, 908, 'goal',       54],  // Musiala
      [14, 8,1209, 'goal',       88],  // Thuram (late equaliser)

      // Match 9: Liverpool 4-2 Barcelona (finished)
      [15, 9, 207, 'goal',        6],  // Salah
      [16, 9, 709, 'goal',       18],  // Lewandowski
      [17, 9, 208, 'goal',       35],  // Núñez
      [18, 9, 207, 'goal',       51],  // Salah
      [19, 9, 710, 'goal',       65],  // Yamal
      [20, 9, 209, 'goal',       80],  // Díaz

      // Match 10: AC Milan 1-1 PSG (finished)
      [21,10,1110, 'goal',       27],  // Leão
      [22,10,1308, 'goal',       73],  // Dembélé (equaliser)
      [23,10,1102, 'yellow_card',44],  // Calabria
      [24,10,1306, 'yellow_card',69],  // Vitinha
    ];

    for (const e of events) {
      await client.query(
        'INSERT INTO match_events (event_id, match_id, player_id, event_type, minute) VALUES ($1,$2,$3,$4,$5)',
        e
      );
    }
    console.log(`Inserted ${events.length} match events`);

    await client.query('COMMIT');
    console.log('\nDatabase seeded successfully.');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed, rolled back:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
