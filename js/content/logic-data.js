/**
 * content/logic-data.js
 * Inhalte für die Rätselhöhle (Wortgruppen, Formen, Zahlenquadrate).
 */

const LogicData = (() => {

  const WORD_GROUPS = {
    Tiere:       ['Hund','Katze','Pferd','Vogel','Fisch','Wolf','Bär','Fuchs','Hase','Igel','Ente','Huhn','Schaf','Ziege','Löwe','Adler','Frosch','Biene','Rabe','Esel'],
    Fahrzeuge:   ['Auto','Bus','Zug','Flugzeug','Schiff','Fahrrad','Motorrad','Lkw','Traktor','Taxi','Boot','Roller','Hubschrauber','Rakete','Bagger','Tram','Kutsche','U-Boot'],
    Möbel:       ['Tisch','Stuhl','Bett','Schrank','Sofa','Lampe','Regal','Sessel','Kommode','Hocker','Schreibtisch','Kleiderschrank','Spiegel'],
    // „Orange" fehlt mit Absicht: Als Farbe und als Obst gehört es in zwei
    // Gruppen, damit wäre „Was passt nicht?" nicht mehr eindeutig.
    Farben:      ['Rot','Blau','Grün','Gelb','Schwarz','Weiß','Braun','Lila','Pink','Grau','Rosa','Türkis'],
    Kleidung:    ['Hemd','Hose','Rock','Kleid','Mantel','Jacke','Schuhe','Socken','Mütze','Schal','Pullover','Stiefel','Gürtel'],
    Lebensmittel:['Brot','Milch','Apfel','Banane','Birne','Käse','Ei','Butter','Kuchen','Kirsche','Tomate','Gurke','Salat','Karotte'],
    Körperteile: ['Kopf','Auge','Ohr','Nase','Mund','Zahn','Arm','Hand','Finger','Bein','Fuß','Knie','Bauch','Rücken','Schulter'],
    Pflanzen:    ['Baum','Rose','Tulpe','Gras','Busch','Efeu','Tanne','Eiche','Birke','Blume','Kaktus','Moos','Farn','Bambus','Palme'],
    Sportarten:  ['Fußball','Schwimmen','Turnen','Radfahren','Laufen','Tennis','Basketball','Handball','Klettern','Tanzen','Skifahren','Reiten'],
    Instrumente: ['Geige','Klavier','Flöte','Gitarre','Trommel','Trompete','Harfe','Cello','Saxofon','Mundharmonika','Akkordeon'],
    Berufe:      ['Arzt','Lehrer','Bäcker','Feuerwehrmann','Polizist','Koch','Gärtner','Pilot','Sänger','Maler','Mechaniker'],
    Jahreszeiten:['Frühling','Sommer','Herbst','Winter'],
    Wetter:      ['Regen','Sonne','Schnee','Wind','Gewitter','Hagel','Nebel','Frost','Sturm'],
    Zahlen:      ['Eins','Zwei','Drei','Vier','Fünf','Sechs','Sieben','Acht','Neun','Zehn'],
    Formen:      ['Kreis','Quadrat','Dreieck','Rechteck','Stern','Oval','Raute','Herzform'],
  };

  const INCOMPATIBLE_GROUPS = [
    ['Pflanzen', 'Lebensmittel'],
    ['Tiere', 'Lebensmittel'],
    ['Wetter', 'Jahreszeiten'],
  ];

  const GROUP_NAMES = Object.keys(WORD_GROUPS);

  function groupsCompatible(g1, g2) {
    return !INCOMPATIBLE_GROUPS.some(
      ([a, b]) => (a === g1 && b === g2) || (a === g2 && b === g1)
    );
  }

  // Formen für Mustererkennung.
  const SHAPES = ['○', '□', '△', '♦', '⭐', '❤'];

  // Rasterbilder für das Spiegelatelier: 5x5, links gefüllt, rechts gespiegelt.
  // `von` liefert "vom Baum" / "von der Blume" (für "Spiegelbild von …"),
  // `akk` den Akkusativ "den Baum" / "die Blume" (für "Spiegle den Baum").
  const MIRROR_PATTERNS = [
    { name: 'Baum',   von: 'vom Baum',      akk: 'den Baum',   cells: [[0,2],[1,1],[1,2],[2,0],[2,1],[2,2],[3,2],[4,2]] },
    { name: 'Herz',   von: 'vom Herz',      akk: 'das Herz',   cells: [[0,1],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2],[3,1],[3,2],[4,2]] },
    { name: 'Haus',   von: 'vom Haus',      akk: 'das Haus',   cells: [[0,2],[1,1],[1,2],[2,0],[2,1],[2,2],[3,0],[3,2],[4,0],[4,2]] },
    { name: 'Blume',  von: 'von der Blume', akk: 'die Blume',  cells: [[0,1],[0,2],[1,1],[1,2],[2,2],[3,2],[4,1],[4,2]] },
    { name: 'Krone',  von: 'von der Krone', akk: 'die Krone',  cells: [[0,0],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2],[3,1],[3,2]] },
    { name: 'Stern',  von: 'vom Stern',     akk: 'den Stern',  cells: [[0,2],[1,1],[1,2],[2,0],[2,1],[2,2],[3,1],[3,2],[4,2]] },
  ];

  return { WORD_GROUPS, GROUP_NAMES, INCOMPATIBLE_GROUPS, groupsCompatible, SHAPES, MIRROR_PATTERNS };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = LogicData;
