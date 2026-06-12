/**
 * modules/science.js
 * Forscherlabor — Wissen über die Welt spielerisch entdecken (Klasse 2).
 */

const ScienceModule = (() => {

  // ─── Hilfsfunktionen ──────────────────────────────────────────────────────

  function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ─── Anti-Wiederholung ────────────────────────────────────────────────────

  const RECENT_WINDOW = 6;
  const recentKeys = {};
  function wasRecent(id, key) { return (recentKeys[id] || []).includes(String(key)); }
  function markRecent(id, key) {
    if (!recentKeys[id]) recentKeys[id] = [];
    recentKeys[id].push(String(key));
    if (recentKeys[id].length > RECENT_WINDOW) recentKeys[id].shift();
  }

  // ─── Daten: Quizfragen (Multiple Choice) ───────────────────────────────
  // Format: [frage, [falsch, falsch, richtig], bereich, emoji]
  // Das LETZTE Element im Antwort-Array ist immer die richtige Antwort.

  const KNOWLEDGE_QUESTIONS = [
    // ── Tiere ──
    ['Welches Tier legt Eier?',           ['Hund','Katze','Huhn'],        'Tiere','🐔'],
    ['Was fressen Kühe hauptsächlich?',   ['Fleisch','Fisch','Gras'],     'Tiere','🐄'],
    ['Wie viele Beine hat eine Spinne?',  ['6','4','8'],                  'Tiere','🕷️'],
    ['Welches Tier macht „Miau"?',        ['Hund','Vogel','Katze'],       'Tiere','🐱'],
    ['Wo lebt ein Fisch?',                ['In der Erde','Auf dem Baum','Im Wasser'],'Tiere','🐟'],
    ['Was macht die Biene aus Nektar?',   ['Milch','Marmelade','Honig'],  'Tiere','🐝'],
    ['Welches Tier ist das größte Landtier?',['Giraffe','Löwe','Elefant'],'Tiere','🐘'],
    ['Was frisst ein Hase?',              ['Fleisch','Würmer','Gras und Gemüse'],'Tiere','🐰'],
    ['Wie nennt man das Zuhause eines Vogels?',['Höhle','Bau','Nest'],    'Tiere','🐦'],
    ['Was macht ein Bär im Winter?',      ['Er fliegt weg','Er geht baden','Er hält Winterschlaf'],'Tiere','🐻'],
    ['Wie viele Beine hat ein Insekt?',   ['4','8','6'],                  'Tiere','🐛'],
    ['Was ist ein Delfin?',               ['Ein Fisch','Ein Vogel','Ein Säugetier'],'Tiere','🐬'],
    ['Was frisst ein Adler?',             ['Gras','Honig','Kleine Tiere'],'Tiere','🦅'],
    ['Welches Tier kann gut klettern?',   ['Fisch','Schnecke','Affe'],    'Tiere','🐒'],
    ['Was sammeln Bienen an Blumen?',     ['Sand','Steine','Nektar'],     'Tiere','🌸'],
    ['Wie heißt das Baby einer Katze?',   ['Ferkel','Fohlen','Kätzchen'], 'Tiere','🐱'],
    ['Wie heißt das Baby eines Hundes?',  ['Lamm','Kalb','Welpe'],        'Tiere','🐶'],
    ['Wie heißt das Baby eines Pferdes?', ['Ferkel','Kalb','Fohlen'],     'Tiere','🐴'],
    ['Wie heißt das Baby einer Kuh?',     ['Lamm','Welpe','Kalb'],        'Tiere','🐄'],
    ['Wie schläft eine Fledermaus?',      ['Im Stehen','Im Sitzen','Kopfüber hängend'],'Tiere','🦇'],
    ['Welches Tier kann seine Farbe ändern?',['Hund','Katze','Chamäleon'],'Tiere','🦎'],
    ['Welches Tier rennt am schnellsten?',['Löwe','Tiger','Gepard'],      'Tiere','🐆'],
    ['Wie schützt sich ein Igel?',        ['Er läuft weg','Er beißt','Er rollt sich zusammen'],'Tiere','🦔'],
    ['Was frisst eine Schnecke?',         ['Fleisch','Fische','Pflanzen'],'Tiere','🐌'],
    ['Welche Farbe hat ein Flamingo?',    ['Blau','Grün','Rosa'],         'Tiere','🦩'],
    ['Was macht eine Schlange mit ihrer Zunge?',['Sprechen','Pfeifen','Riechen'],'Tiere','🐍'],
    ['Wie viele Höcker hat ein Dromedar?',['2','3','1'],                  'Tiere','🐪'],
    ['Was frisst ein Panda?',             ['Fleisch','Fisch','Bambus'],   'Tiere','🐼'],
    ['Welches Tier hat schwarz-weiße Streifen?',['Elefant','Löwe','Zebra'],'Tiere','🦓'],
    ['Was ist ein Krokodil?',             ['Ein Vogel','Ein Säugetier','Ein Reptil'],'Tiere','🐊'],
    // ── Weltraum ──
    ['Wie heißt unser Planet?',           ['Mars','Venus','Erde'],        'Weltraum','🌍'],
    ['Was ist die Sonne?',                ['Ein Planet','Ein Mond','Ein Stern'],'Weltraum','☀️'],
    ['Wie viele Planeten hat unser Sonnensystem?',['6','10','8'],         'Weltraum','🪐'],
    ['Was dreht sich um die Erde?',       ['Die Sonne','Der Mars','Der Mond'],'Weltraum','🌙'],
    ['Warum gibt es Tag und Nacht?',      ['Wegen des Mondes','Wegen der Sterne','Weil die Erde sich dreht'],'Weltraum','🌞'],
    ['Welcher Planet ist der größte?',    ['Erde','Saturn','Jupiter'],    'Weltraum','🪐'],
    ['Was ist ein Komet?',                ['Ein Stern','Ein Planet','Ein Eisball mit Schweif'],'Weltraum','☄️'],
    ['Woher bekommt der Mond sein Licht?',['Er leuchtet selbst','Von den Sternen','Von der Sonne'],'Weltraum','🌕'],
    ['Wie nennt man Reisende ins Weltall?',['Piloten','Matrosen','Astronauten'],'Weltraum','👨‍🚀'],
    ['Was ist die Milchstraße?',          ['Ein Fluss','Ein Berg','Eine Galaxie'],'Weltraum','🌌'],
    ['Welche Farbe hat der Mars?',        ['Blau','Grün','Rot'],          'Weltraum','🔴'],
    ['Was passiert bei einer Sonnenfinsternis?',['Die Sonne explodiert','Es wird heiß','Der Mond verdeckt die Sonne'],'Weltraum','🌑'],
    ['Wie lange braucht die Erde für eine Runde um die Sonne?',['1 Monat','1 Woche','1 Jahr'],'Weltraum','🌍'],
    ['Was fliegt ins Weltall?',           ['Ein Schiff','Ein Flugzeug','Eine Rakete'],'Weltraum','🚀'],
    ['Wann kann man die Sterne am besten sehen?',['Am Mittag','Beim Regen','In der Nacht'],'Weltraum','⭐'],
    ['Welcher Stern ist der Erde am nächsten?',['Der Mond','Der Mars','Die Sonne'],'Weltraum','☀️'],
    ['Was ist ein Asteroid?',             ['Ein Stern','Ein Planet','Ein Gesteinsbrocken im Weltall'],'Weltraum','🪨'],
    ['Welcher Planet hat Ringe?',         ['Erde','Mars','Saturn'],       'Weltraum','🪐'],
    ['Was trägt ein Astronaut im Weltall?',['Einen Schlafanzug','Eine Badehose','Einen Raumanzug'],'Weltraum','👨‍🚀'],
    ['Warum leuchten Sterne?',            ['Sie spiegeln das Meer','Sie sind aus Gold','Sie sind sehr heiß und glühen'],'Weltraum','⭐'],
    // ── Natur ──
    ['Was passiert mit Wasser, wenn es friert?',['Es wird warm','Es verschwindet','Es wird zu Eis'],'Natur','🧊'],
    ['Was braucht eine Pflanze zum Wachsen?',['Zucker','Salz','Wasser und Sonne'],'Natur','🌱'],
    ['Was ist ein Vulkan?',               ['Ein Fluss','Ein See','Ein Berg mit Feuer'],'Natur','🌋'],
    ['Woher kommt der Regen?',            ['Aus der Sonne','Aus der Erde','Aus den Wolken'],'Natur','🌧️'],
    ['Was ist ein Gletscher?',            ['Ein See','Ein Fluss','Ein riesiger Berg aus Eis'],'Natur','🧊'],
    ['In welcher Jahreszeit werden die Blätter bunt?',['Im Frühling','Im Sommer','Im Herbst'],'Natur','💨'],
    ['Was macht ein Fluss?',              ['Er steht still','Er brennt','Er fließt'],'Natur','🏞️'],
    ['Was passiert im Frühling?',         ['Alles friert ein','Alles verblüht','Die Natur erwacht'],  'Natur','🌸'],
    ['Wo wachsen Pilze gern?',            ['In der Wüste','Im Meer','Im Wald'],'Natur','🍄'],
    ['Wie entsteht ein Regenbogen?',      ['Durch Wind','Durch Blitz','Durch Sonne und Regen'],'Natur','🌈'],
    ['Was wird aus einer Kaulquappe?',    ['Ein Fisch','Eine Schlange','Ein Frosch'],'Natur','🐸'],
    ['Was ist Tau?',                      ['Schnee','Hagel','Wassertropfen am Morgen'],'Natur','💧'],
    ['Welche Jahreszeit ist am wärmsten?',['Frühling','Winter','Sommer'],'Natur','☀️'],
    ['Was macht ein Baum mit seinen Blättern im Herbst?',['Sie werden größer','Sie bleiben gleich','Er lässt sie fallen'],'Natur','🍂'],
    ['Was ist ein Ozean?',                ['Ein Fluss','Ein See','Ein sehr großes Meer'],'Natur','🌊'],
    ['Woher kommt der Schnee?',           ['Aus der Erde','Vom Mond','Aus den Wolken'],'Natur','❄️'],
    ['Was ist ein Erdbeben?',             ['Starker Regen','Starker Wind','Die Erde wackelt'],'Natur','🌍'],
    ['Was ist Lava?',                     ['Kaltes Wasser','Heißer Sand','Geschmolzenes Gestein'],'Natur','🌋'],
    ['Wie viele Jahreszeiten gibt es?',   ['Zwei','Drei','Vier'],         'Natur','🍀'],
    ['Was ist ein Wald?',                 ['Viele Tiere','Viel Wasser','Viele Bäume zusammen'],'Natur','🌲'],
    // ── Mensch ──
    ['Wie viele Zähne hat ein erwachsener Mensch?',['20','36','32'],'Mensch','🦷'],
    ['Was macht das Herz?',               ['Es denkt','Es atmet','Es pumpt Blut'],   'Mensch','❤️'],
    ['Was atmen wir ein?',                ['Kohlendioxid','Wasser','Sauerstoff'],    'Mensch','🫁'],
    ['Was atmen wir aus?',                ['Sauerstoff','Wasser','Kohlendioxid'],    'Mensch','💨'],
    ['Was macht das Gehirn?',             ['Es pumpt Blut','Es verdaut Essen','Es denkt und steuert alles'],'Mensch','🧠'],
    ['Wie viele Knochen hat ein Erwachsener?',['100','500','206'],        'Mensch','🦴'],
    ['Wie viele Lungen hat der Mensch?',  ['1','3','2'],                  'Mensch','🫁'],
    ['Wozu brauchen wir die Zähne?',      ['Zum Hören','Zum Sehen','Zum Kauen'],'Mensch','🦷'],
    ['Was machen wir beim Schlafen?',     ['Wir rennen','Wir essen','Unser Körper erholt sich'],'Mensch','😴'],
    ['Welche Farbe hat unser Blut?',      ['Blau','Grün','Rot'],          'Mensch','💉'],
    ['Warum müssen wir Wasser trinken?',  ['Damit wir fliegen können','Damit die Haare glänzen','Unser Körper braucht Wasser'],'Mensch','💧'],
    ['Womit greifen wir?',                ['Mit den Füßen','Mit den Ohren','Mit den Händen'],'Mensch','🖐️'],
    ['Was schützt das Auge?',             ['Die Nase','Der Mund','Das Augenlid'],'Mensch','👁️'],
    ['Womit schmecken wir?',              ['Mit der Nase','Mit den Augen','Mit der Zunge'],'Mensch','👅'],
    ['Was machen die Muskeln?',           ['Sie denken','Sie schlafen','Sie bewegen den Körper'],'Mensch','💪'],
    ['Womit atmen wir?',                  ['Mit dem Herz','Mit dem Gehirn','Mit der Lunge'],'Mensch','🫁'],
    ['Wie viele Sinne hat der Mensch?',   ['3','7','5'],                  'Mensch','👀'],
    ['Wozu brauchen wir Schlaf?',         ['Zum Spielen','Zum Essen','Damit sich der Körper erholen kann'],'Mensch','😴'],
    ['Was ist ein Vitamin?',              ['Ein Spielzeug','Ein Knochen','Ein Nährstoff für den Körper'],'Mensch','🍎'],
    ['Was sollst du nach dem Essen tun?', ['Schlafen','Fernsehen','Zähne putzen'],'Mensch','🪥'],
    // ── Wetter ──
    ['Was ist Nebel?',                    ['Staub','Rauch','Sehr viele kleine Wassertröpfchen'],'Wetter','🌫️'],
    ['Was ist ein Blitz?',                ['Starker Wind','Starker Regen','Ein heller Strahl beim Gewitter'],'Wetter','⚡'],
    ['Was kommt nach dem Blitz?',         ['Regen','Schnee','Donner'],    'Wetter','⛈️'],
    ['Was ist ein Hurrikan?',             ['Ein Tier','Ein Berg','Ein sehr starker Wirbelsturm'],'Wetter','🌀'],
    ['Was ist Hagel?',                    ['Warmer Regen','Bunter Schnee','Gefrorene Regentropfen'],'Wetter','🌨️'],
    ['Womit misst man die Temperatur?',   ['Kompass','Lineal','Thermometer'],'Wetter','🌡️'],
    ['Was ist eine Wettervorhersage?',    ['Ein Spiel','Ein Märchen','Sie sagt, wie das Wetter wird'],'Wetter','📱'],
    ['Womit schützt du dich vor Regen?',  ['Mit einer Sonnenbrille','Mit Handschuhen','Mit einem Regenschirm'],'Wetter','☔'],
    ['Was ziehst du im Winter an?',       ['Eine Badehose','Ein T-Shirt','Eine warme Jacke'],'Wetter','🧥'],
    ['Warum ist es im Winter kälter?',    ['Weil der Mond näher ist','Wegen der Sterne','Weil die Sonne weniger scheint'],'Wetter','❄️'],
    ['Was ist ein Tornado?',              ['Ein Tier','Ein Fluss','Ein drehender Sturm'],'Wetter','🌪️'],
    ['Was passiert bei Glatteis?',        ['Es ist heiß','Es regnet stark','Wasser gefriert auf dem Boden'],'Wetter','🧊'],
    ['Welche Farben hat ein Regenbogen?', ['Nur Grau','Nur Schwarz und Weiß','Viele bunte Farben'],'Wetter','🌈'],
    ['Wann ist es draußen am hellsten?',  ['In der Nacht','Am Abend','Am Mittag'],'Wetter','⛅'],
    ['Was brauchst du an einem sonnigen Sommertag?',['Einen Wintermantel','Handschuhe','Sonnencreme'],'Wetter','🧴'],
    ['Was ist Frost?',                    ['Starker Regen','Heißer Wind','Kälte unter 0 Grad'],'Wetter','🥶'],
    ['Was bedeutet „bewölkt"?',           ['Kein Wind','Es schneit','Viele Wolken am Himmel'],'Wetter','⛅'],
    ['Wo siehst du die Wolken?',          ['Im Boden','Im Meer','Am Himmel'],'Wetter','☁️'],
    ['Was ist ein Sturm?',                ['Leichter Wind','Schwacher Regen','Sehr starker Wind'],'Wetter','🌪️'],
    ['Was passiert beim Sonnenuntergang?',['Die Sonne geht auf','Es wird Mittag','Die Sonne geht unter'],'Wetter','🌅'],
    // Weitere Tiere
    ['Welches Tier ist das schwerste der Welt?',['Elefant','Nilpferd','Blauwal'],'Tiere','🐋'],
    ['Was wird aus einer Raupe?',         ['Ein Vogel','Eine Biene','Ein Schmetterling'],'Tiere','🐛'],
    ['Wie zeigen Bienen, wo Blumen sind?',['Durch Bellen','Durch Singen','Durch Tanzen'],'Tiere','🐝'],
    ['Was ist ein Zugvogel?',             ['Ein Hausvogel','Ein Meerestier','Ein Vogel, der im Winter wegfliegt'],'Tiere','🦅'],
    ['Wo lebt ein Pinguin?',              ['In der Wüste','Im Dschungel','Dort, wo es sehr kalt ist'],'Tiere','🐧'],
    ['Was fressen Ameisen?',              ['Nur Steine','Nur Sand','Fast alles'],'Tiere','🐜'],
    ['Wie schützt sich ein Stachelschwein?',['Es beißt','Es läuft weg','Mit seinen Stacheln'],'Tiere','🦔'],
    ['Welches Tier ist kein Fisch, lebt aber im Wasser?',['Lachs','Forelle','Delfin'],'Tiere','🐬'],
    ['Was ist ein Winterschlaf?',         ['Ein kurzes Schläfchen','Ein Spiel','Ein langer Schlaf im Winter'],'Tiere','🐻'],
    ['Wie viele Beine hat ein Vogel?',    ['4','6','2'],                  'Tiere','🐦'],
    // Weitere Natur
    ['Was sind Fossilien?',               ['Lebende Tiere','Junge Pflanzen','Versteinerte Reste alter Lebewesen'],'Natur','🦕'],
    ['Was gibt uns die Kuh?',             ['Eier','Wolle','Milch'],       'Natur','🐄'],
    ['Was ist eine Oase?',                ['Ein Berg','Eine Stadt','Eine grüne Stelle in der Wüste'],'Natur','🌴'],
    ['Was ist Sauerstoff?',               ['Ein Tier','Eine Pflanze','Ein Gas, das wir zum Atmen brauchen'],'Natur','💨'],
    ['Welches Wasser kann man trinken?',  ['Meerwasser','Pfützenwasser','Leitungswasser'],'Natur','🚰'],
    // Weitere Weltraum
    ['Was ist die Internationale Raumstation?',['Ein Flugzeug','Eine Insel','Ein Labor im Weltraum'],'Weltraum','🚀'],
    ['Wie sieht der Vollmond aus?',       ['Wie ein Stern','Wie eine Banane','Rund wie ein Ball'],'Weltraum','🌕'],
    ['Was ist eine Mondfinsternis?',      ['Der Mond explodiert','Der Mond friert ein','Die Erde wirft einen Schatten auf den Mond'],'Weltraum','🌑'],
    ['Was sind Sternschnuppen?',          ['Echte Sterne','Kleine Monde','Steinchen, die am Himmel verglühen'],'Weltraum','🌠'],
    ['Womit kann man Sterne genau beobachten?',['Mit einer Lupe','Mit einem Mikroskop','Mit einem Teleskop'],'Weltraum','🔭'],
    // Mensch weitere
    ['Was ist das größte Organ des Körpers?',['Das Herz','Das Gehirn','Die Haut'],'Mensch','👋'],
    ['Wo schlägt dein Herz?',             ['Im Kopf','Im Bein','In der Brust'],'Mensch','❤️'],
    ['Was macht das Ohr?',                ['Riechen','Sehen','Hören'],    'Mensch','👂'],
    ['Was ist das Skelett?',              ['Alle Muskeln','Alle Haare','Alle Knochen zusammen'],'Mensch','🦴'],
    ['Warum ist Bewegung wichtig?',       ['Sie macht müde','Sie macht hungrig','Sie hält den Körper gesund'],'Mensch','🏃'],
    // Noch mehr Natur
    ['Was ist ein Korallenriff?',         ['Eine Wolke','Ein Berg','Ein Zuhause für Meerestiere'],'Natur','🐠'],
    ['Was findet man am Strand?',         ['Schnee','Tannenzapfen','Sand und Muscheln'],'Natur','🏖️'],
    ['Was ist eine Wüste?',               ['Ein Wald','Ein See','Sehr trockenes Land'],'Natur','🏜️'],
    ['Was ist ein Dschungel?',            ['Ein Gebirge','Eine Wüste','Ein dichter Wald mit vielen Tieren'],'Natur','🌴'],
    ['Was macht der Wind?',               ['Wasser erwärmen','Licht erzeugen','Luft bewegen'],    'Natur','💨'],
    // Weitere Wetter
    ['Was ist ein Meteorologe?',          ['Ein Astronaut','Ein Arzt','Ein Wetterforscher'],'Wetter','🌤️'],
    ['Bei welcher Temperatur friert Wasser?',['Bei 10 Grad','Bei 100 Grad','Bei 0 Grad'],'Wetter','🌡️'],
    ['Was ist ein Sandsturm?',            ['Regen mit Blumen','Schnee in der Wüste','Ein Sturm, der Sand aufwirbelt'],'Wetter','🏜️'],
    ['Was brauchst du bei Schnee an den Händen?',['Eine Sonnenbrille','Sandalen','Warme Handschuhe'],'Wetter','🧤'],
    ['Was ist ein Gewitter?',             ['Nur Wind','Nur Nebel','Blitz, Donner und Regen'],'Wetter','⛈️'],
  ];

  // ─── Daten: Wahr/Falsch ───────────────────────────────────────────────────
  // Format: [aussage, istWahr, bereich]

  const TRUE_FALSE_DATA = [
    // Tiere
    ['Die Katze ist ein Säugetier.',          true,  'Tiere'],
    ['Ein Fisch kann an Land leben.',         false, 'Tiere'],
    ['Schmetterlinge sind Insekten.',         true,  'Tiere'],
    ['Ein Hund hat 6 Beine.',                 false, 'Tiere'],
    ['Wale leben im Meer.',                   true,  'Tiere'],
    ['Krokodile sind Vögel.',                 false, 'Tiere'],
    ['Eine Biene macht Honig.',               true,  'Tiere'],
    ['Fledermäuse sind blind.',               false, 'Tiere'],
    ['Schlangen haben keine Beine.',          true,  'Tiere'],
    ['Ein Löwe ist eine Großkatze.',          true,  'Tiere'],
    ['Delfine sind Fische.',                  false, 'Tiere'],
    ['Vögel haben Federn.',                   true,  'Tiere'],
    ['Pinguine können fliegen.',              false, 'Tiere'],
    ['Ein Elefant hat einen Rüssel.',         true,  'Tiere'],
    ['Spinnen haben 6 Beine.',                false, 'Tiere'],
    ['Würmer leben im Boden.',                true,  'Tiere'],
    ['Haie sind Säugetiere.',                 false, 'Tiere'],
    ['Eisbären leben in der Wüste.',          false, 'Tiere'],
    ['Raben sind schwarze Vögel.',            true,  'Tiere'],
    ['Frösche können schwimmen.',             true,  'Tiere'],
    // Weltraum
    ['Die Sonne ist ein Stern.',              true,  'Weltraum'],
    ['Die Erde ist flach.',                   false, 'Weltraum'],
    ['Der Mond ist kleiner als die Erde.',    true,  'Weltraum'],
    ['Es gibt 9 Planeten im Sonnensystem.',   false, 'Weltraum'],
    ['Im Weltraum gibt es keinen Lärm.',      true,  'Weltraum'],
    ['Astronauten brauchen keinen Raumanzug.',false, 'Weltraum'],
    ['Saturn hat Ringe.',                     true,  'Weltraum'],
    ['Die Sonne ist ein Planet.',             false, 'Weltraum'],
    ['Mars ist der rote Planet.',             true,  'Weltraum'],
    ['Der Mond leuchtet aus eigener Kraft.',  false, 'Weltraum'],
    ['Sternschnuppen sind echte Sterne.',     false, 'Weltraum'],
    ['Die Erde dreht sich um die Sonne.',     true,  'Weltraum'],
    ['Jupiter ist der größte Planet.',        true,  'Weltraum'],
    ['Die Erde ist ein Planet.',              true,  'Weltraum'],
    ['Astronauten schweben im Weltall.',      true,  'Weltraum'],
    ['Der Mond dreht sich um die Erde.',      true,  'Weltraum'],
    ['Der Mond ist aus Käse.',                false, 'Weltraum'],
    ['Es gibt Luft im Weltall.',              false, 'Weltraum'],
    ['Raketen fahren wie Autos.',             false, 'Weltraum'],
    ['Die Sonne ist viel größer als die Erde.',true, 'Weltraum'],
    // Natur
    ['Pflanzen brauchen Licht zum Wachsen.',  true,  'Natur'],
    ['Eis ist gefrorenes Wasser.',            true,  'Natur'],
    ['Regen kommt aus der Erde.',             false, 'Natur'],
    ['Vulkane spucken Lava aus.',             true,  'Natur'],
    ['Das Meer ist süßes Wasser.',            false, 'Natur'],
    ['Ein Regenbogen hat viele Farben.',      true,  'Natur'],
    ['Laubbäume verlieren im Herbst ihre Blätter.',true,'Natur'],
    ['Im Winter wachsen die meisten Pflanzen schnell.',false,'Natur'],
    ['Wasser fließt bergab.',                 true,  'Natur'],
    ['Fossilien sind lebende Tiere.',         false, 'Natur'],
    ['Die Sahara ist eine Wüste.',            true,  'Natur'],
    ['Im Dschungel ist es sehr trocken.',     false, 'Natur'],
    ['Korallen leben im Meer.',               true,  'Natur'],
    ['Ein Gletscher besteht aus Eis.',        true,  'Natur'],
    ['Sauerstoff ist ein Gas.',               true,  'Natur'],
    ['Die Erde besteht nur aus Wasser.',      false, 'Natur'],
    ['Eine Pfütze trocknet in der Sonne.',    true,  'Natur'],
    ['Steine wachsen wie Pflanzen.',          false, 'Natur'],
    ['In der Nacht scheint die Sonne.',       false, 'Natur'],
    ['Viele Blätter werden im Herbst bunt.',  true,  'Natur'],
    // Mensch
    ['Das Herz pumpt Blut.',                  true,  'Mensch'],
    ['Menschen haben 5 Sinne.',               true,  'Mensch'],
    ['Wir atmen mit dem Gehirn.',             false, 'Mensch'],
    ['Haare wachsen nach, wenn man sie schneidet.',true,'Mensch'],
    ['Kinder haben Milchzähne.',              true,  'Mensch'],
    ['Das Gehirn ist im Bauch.',              false, 'Mensch'],
    ['Menschen brauchen kein Wasser.',        false, 'Mensch'],
    ['Schlaf ist wichtig für die Gesundheit.',true,  'Mensch'],
    ['Der Magen verdaut Essen.',              true,  'Mensch'],
    ['Knochen sind sehr weich.',              false, 'Mensch'],
    ['Die Haut schützt den Körper.',          true,  'Mensch'],
    ['Vitamine halten uns gesund.',           true,  'Mensch'],
    ['Mit dem Mund riechen wir.',             false, 'Mensch'],
    ['Die Zähne helfen beim Kauen.',          true,  'Mensch'],
    ['Menschen haben 10 Finger.',             true,  'Mensch'],
    ['Das Blut ist blau.',                    false, 'Mensch'],
    ['Muskeln bewegen unseren Körper.',       true,  'Mensch'],
    ['Gesundes Essen hilft uns beim Wachsen.',true,  'Mensch'],
    ['Das Ohr hört Töne.',                    true,  'Mensch'],
    ['Menschen brauchen Luft zum Atmen.',     true,  'Mensch'],
    // Wetter
    ['Schnee ist kalt.',                      true,  'Wetter'],
    ['Der Blitz kommt nach dem Donner.',      false, 'Wetter'],
    ['Regen kommt aus den Wolken.',           true,  'Wetter'],
    ['Im Sommer ist es meistens kälter als im Winter.',false,'Wetter'],
    ['Hagel ist gefrorener Regen.',           true,  'Wetter'],
    ['Ein Tornado dreht sich.',               true,  'Wetter'],
    ['Das Wetter ändert sich nie.',           false, 'Wetter'],
    ['Nebel ist dicker Rauch.',               false, 'Wetter'],
    ['Bei 0 Grad gefriert Wasser.',           true,  'Wetter'],
    ['Nach Regen kann wieder die Sonne scheinen.',true,'Wetter'],
    ['Im Winter kann es schneien.',           true,  'Wetter'],
    ['Wind ist bewegte Luft.',                true,  'Wetter'],
    ['Der Regenbogen erscheint bei Regen und Sonne.',true,'Wetter'],
    ['Ein Thermometer misst die Temperatur.', true,  'Wetter'],
    ['Frost gibt es nur bei Minusgraden.',    true,  'Wetter'],
    ['Ein Hurrikan ist ein starker Sturm.',   true,  'Wetter'],
    ['Wolken bestehen aus Baumwolle.',        false, 'Wetter'],
    ['Im Sommer sind die Tage länger.',       true,  'Wetter'],
    ['Gewitter kommen nur im Sommer.',        false, 'Wetter'],
    ['Der Donner ist der Schall des Blitzes.',true,  'Wetter'],
  ];

  // ─── Daten: Zuordnen ──────────────────────────────────────────────────────
  // Format: [item, zuKategorie, falscheKategorien]

  const MATCHING_DATA = [
    // Tiere und Gruppen
    ['Biene',     'Insekt',     ['Säugetier','Vogel']],
    ['Adler',     'Vogel',      ['Insekt','Fisch']],
    ['Lachs',     'Fisch',      ['Vogel','Säugetier']],
    ['Hund',      'Säugetier',  ['Insekt','Reptil']],
    ['Krokodil',  'Reptil',     ['Vogel','Fisch']],
    ['Frosch',    'Teich',      ['Wüste','Schneeberg']],
    ['Katze',     'Säugetier',  ['Vogel','Fisch']],
    ['Schmetterling','Insekt',  ['Vogel','Fisch']],
    ['Schlange',  'Reptil',     ['Säugetier','Vogel']],
    ['Ameise',    'Insekt',     ['Fisch','Säugetier']],
    ['Delfin',    'Säugetier',  ['Fisch','Vogel']],
    ['Pinguin',   'Vogel',      ['Fisch','Säugetier']],
    // Planeten und Eigenschaften
    ['Erde',      'Planet mit Leben',      ['Roter Planet','Ringplanet']],
    ['Mars',      'Roter Planet',          ['Planet mit Leben','Ringplanet']],
    ['Saturn',    'Ringplanet',            ['Roter Planet','Planet mit Leben']],
    ['Jupiter',   'Größter Planet',        ['Ringplanet','Roter Planet']],
    // Pflanzenteile
    ['Apfel',     'Frucht',    ['Wurzel','Blatt']],
    ['Eiche',     'Laubbaum',  ['Nadelbaum','Strauch']],
    ['Tanne',     'Nadelbaum', ['Laubbaum','Strauch']],
    ['Rosenstrauch','Strauch', ['Baum','Frucht']],
    // Körperteile und Funktion
    ['Auge',      'Sehen',    ['Hören','Riechen']],
    ['Ohr',       'Hören',    ['Sehen','Schmecken']],
    ['Nase',      'Riechen',  ['Hören','Sehen']],
    ['Zunge',     'Schmecken',['Riechen','Sehen']],
    ['Hand',      'Greifen',  ['Hören','Sehen']],
    // Wetter und Jahreszeit
    ['Schnee',    'Winter',   ['Sommer','Frühling']],
    ['Blüte',     'Frühling', ['Winter','Herbst']],
    ['Ernte',     'Herbst',   ['Winter','Sommer']],
    ['Hitze',     'Sommer',   ['Winter','Herbst']],
    // Essen und Herkunft
    ['Butter',    'Aus Milch',['Aus Mehl','Aus Wasser']],
    ['Brot',      'Aus Getreide',['Vom Tier','Aus Milch']],
    ['Joghurt',   'Aus Milch',['Aus Getreide','Aus Wasser']],
    ['Karotte',   'Aus der Erde',['Vom Tier','Aus Milch']],
    // Materialien
    ['Holz',      'Vom Baum',     ['Aus Metall','Aus Glas']],
    ['Wolle',     'Vom Schaf',    ['Vom Baum','Aus Metall']],
    ['Honig',     'Von der Biene',['Vom Schaf','Von der Kuh']],
    ['Milch',     'Von der Kuh',  ['Von der Biene','Vom Huhn']],
    // Musik und Instrumente
    ['Geige',     'Streichinstrument',  ['Blasinstrument','Schlaginstrument']],
    ['Flöte',     'Blasinstrument',     ['Streichinstrument','Schlaginstrument']],
    ['Trommel',   'Schlaginstrument',   ['Blasinstrument','Streichinstrument']],
    ['Trompete',  'Blasinstrument',     ['Streichinstrument','Schlaginstrument']],
    // Berufe und Tätigkeiten
    ['Arzt',      'Hilft Kranken',       ['Baut Häuser','Kocht Essen']],
    ['Bäcker',    'Backt Brot',          ['Hilft Kranken','Löscht Feuer']],
    ['Feuerwehr', 'Löscht Feuer',        ['Backt Brot','Hilft Kranken']],
    ['Lehrer',    'Unterrichtet Kinder', ['Backt Brot','Löscht Feuer']],
    // Orte
    ['Bibliothek','Ort für Bücher',      ['Ort für Essen','Ort für Sport']],
    ['Bäckerei',  'Ort für Backwaren',   ['Ort für Bücher','Ort für Sport']],
    ['Sporthalle','Ort für Sport',       ['Ort für Bücher','Ort für Backwaren']],
    // Tierkinder
    ['Welpe',     'Baby vom Hund',      ['Baby von der Katze','Baby vom Pferd']],
    ['Kätzchen',  'Baby von der Katze', ['Baby vom Hund','Baby von der Kuh']],
    // Natur
    ['Gletscher', 'Aus Eis',         ['Aus Stein','Aus Sand']],
    ['Wüste',     'Sehr trocken',    ['Sehr kalt','Sehr nass']],
    ['Regenwald', 'Sehr feucht',     ['Sehr trocken','Sehr kalt']],
  ];

  // ─── Aufgaben-Generatoren ─────────────────────────────────────────────────

  const exercises = {

    knowledgeQuiz: {
      id: 'knowledgeQuiz',
      title: 'Quizfrage',
      icon: '🔬',
      description: 'Wähle die richtige Antwort',
      generate(difficulty) {
        const pool = difficulty === 1
          ? KNOWLEDGE_QUESTIONS.filter(q => ['Tiere','Wetter'].includes(q[2]))
          : difficulty === 2
            ? KNOWLEDGE_QUESTIONS.filter(q => ['Tiere','Natur','Wetter','Mensch'].includes(q[2]))
            : KNOWLEDGE_QUESTIONS;

        let q, attempts = 0;
        do {
          q = randomFrom(pool.length >= 5 ? pool : KNOWLEDGE_QUESTIONS);
          attempts++;
        } while (wasRecent('knowledgeQuiz', q[0]) && attempts < 20);
        markRecent('knowledgeQuiz', q[0]);

        const [frage, antworten, bereich, emoji] = q;
        const correct = antworten[antworten.length - 1];
        const choices = shuffle(antworten.slice());
        // Tipp: eine falsche Antwort ausschließen — hilft, ohne zu verraten
        const wrongExample = randomFrom(antworten.slice(0, -1));

        return {
          questionHtml: `
            <div class="sci-topic-badge">${bereich}</div>
            <div class="sci-emoji-img">${emoji}</div>
            <p class="q-label">${frage}</p>
          `,
          answer: correct,
          hint: `„${wrongExample}" ist es nicht. 😉`,
          taskType: 'choice',
          choices,
        };
      },
    },

    trueFalse: {
      id: 'trueFalse',
      title: 'Stimmt das?',
      icon: '✅',
      description: 'Stimmt das oder nicht?',
      generate(difficulty) {
        const pool = difficulty === 1
          ? TRUE_FALSE_DATA.filter(d => ['Tiere','Wetter'].includes(d[2]))
          : difficulty === 2
            ? TRUE_FALSE_DATA.filter(d => ['Tiere','Natur','Wetter','Mensch'].includes(d[2]))
            : TRUE_FALSE_DATA;

        let item, attempts = 0;
        do {
          item = randomFrom(pool.length >= 5 ? pool : TRUE_FALSE_DATA);
          attempts++;
        } while (wasRecent('trueFalse', item[0]) && attempts < 20);
        markRecent('trueFalse', item[0]);

        const [aussage, istWahr, bereich] = item;
        const answer = istWahr ? 'Wahr' : 'Falsch';

        return {
          questionHtml: `
            <div class="sci-topic-badge">${bereich}</div>
            <p class="q-label">Stimmt das?</p>
            <p class="word-main">${aussage}</p>
          `,
          answer,
          // Kein Tipp bei Wahr/Falsch — er würde die Lösung verraten
          hint: null,
          taskType: 'trueFalse',
          choices: ['Wahr', 'Falsch'],
        };
      },
    },

    matching: {
      id: 'matching',
      title: 'Zuordnen',
      icon: '🔗',
      description: 'Was gehört wozu?',
      generate(difficulty) {
        let item, attempts = 0;
        do {
          item = randomFrom(MATCHING_DATA);
          attempts++;
        } while (wasRecent('matching', item[0]) && attempts < 20);
        markRecent('matching', item[0]);

        const [subject, correct, wrong] = item;
        const choices = shuffle([correct, ...wrong]);

        return {
          questionHtml: `
            <p class="q-label">Wozu gehört das?</p>
            <p class="match-word">${subject}</p>
            <p class="match-arrow">gehört zu ...</p>
          `,
          answer: correct,
          hint: `Denke daran, was „${subject}" ist oder woher es kommt.`,
          taskType: 'choice',
          choices,
        };
      },
    },

  };

  // ─── Session-State & Konstanten ───────────────────────────────────────────

  const DEFAULT_SESSION_LENGTH = 10;
  let sessionLength = DEFAULT_SESSION_LENGTH;
  let currentExerciseId = null;
  let currentTask = null;
  let sessionStats = { correct: 0, total: 0 };
  let answered = false;
  let retryQueue = []; // falsch gelöste Aufgaben kommen später noch einmal

  function resetSession() {
    sessionStats = { correct: 0, total: 0 };
    retryQueue = [];
  }

  function queueRetry() {
    if (currentTask._retry || sessionStats.total >= sessionLength) return;
    retryQueue.push({ ...currentTask, _retry: true, _notBefore: sessionStats.total + 2 });
  }

  function nextTask() {
    if (retryQueue.length &&
        (retryQueue[0]._notBefore <= sessionStats.total ||
         sessionStats.total >= sessionLength)) {
      return retryQueue.shift();
    }
    return generateTask(currentExerciseId);
  }

  const FEEDBACK_WRONG = [
    'Fast! Denk noch mal nach! 💪',
    'Nicht ganz – du schaffst das! 🌟',
    'Nochmal versuchen! ✨',
    'Das klappt beim nächsten Mal! 🎯',
    'Gute Frage – nächstes Mal weißt du es! 🔍',
  ];

  const PRAISE_MESSAGES = [
    'Klasse geforscht! 🔬',
    'Was für ein Wissensstar! 🌟',
    'Oskar ist beeindruckt! 🐶',
    'Du weißt so viel! 💫',
    'Fantastisch! 🏆',
    'Ein echter Forscher! ⭐',
    'Toll gemacht! 🎉',
    'Wunderbar! ✨',
  ];

  function getSessionStars(correct, total) {
    const r = correct / total;
    return r >= 0.9 ? 3 : r >= 0.7 ? 2 : r >= 0.5 ? 1 : 0;
  }

  function getPerformanceText(correct, total) {
    const r = correct / total;
    if (r === 1)  return 'Perfekte Leistung! 🏆';
    if (r >= 0.9) return 'Sehr stark! 🌟';
    if (r >= 0.7) return 'Gut gemacht! 👍';
    if (r >= 0.5) return 'Weiter lernen! 💪';
    return 'Nicht aufgeben! 🌈';
  }

  function launchConfetti() {
    const colors = ['#7EB8D4','#F4A435','#6DB68A','#B07EC8','#E85D75','#FFD166'];
    const c = document.createElement('div');
    c.className = 'confetti-container';
    document.body.appendChild(c);
    for (let i = 0; i < 60; i++) {
      const p = document.createElement('div');
      p.className = 'confetti-piece';
      p.style.cssText = [
        `left:${Math.random()*100}%`,
        `background:${colors[Math.floor(Math.random()*colors.length)]}`,
        `animation-delay:${(Math.random()*0.9).toFixed(2)}s`,
        `animation-duration:${(1.2+Math.random()*1.4).toFixed(2)}s`,
        `width:${6+Math.round(Math.random()*8)}px`,
        `height:${6+Math.round(Math.random()*8)}px`,
        `border-radius:${Math.random()>0.5?'50%':'3px'}`,
        `transform:rotate(${Math.round(Math.random()*360)}deg)`,
      ].join(';');
      c.appendChild(p);
    }
    setTimeout(() => c.remove(), 3500);
  }

  // ─── Rendering ────────────────────────────────────────────────────────────

  function renderHeader() {
    const profile = Storage.getActiveProfile();
    return `
      <header class="workshop-header">
        <button class="btn btn-back" id="back-to-village" title="Zurück">←</button>
        <div class="workshop-title-block">
          <span class="workshop-icon">🔬</span>
          <h1>Forscherlabor</h1>
        </div>
        <div class="star-badge">⭐ <span id="header-stars">${profile ? profile.stars : 0}</span></div>
      </header>
    `;
  }


  function renderSessionModeSelector() {
    return `
      <div class="session-mode" role="group" aria-label="Spiellänge wählen">
        <span class="session-mode-label">Wie lange?</span>
        <button class="session-mode-btn${sessionLength === 5 ? ' selected' : ''}" data-session-length="5" type="button">Kurz: 5</button>
        <button class="session-mode-btn${sessionLength === 10 ? ' selected' : ''}" data-session-length="10" type="button">Normal: 10</button>
      </div>
    `;
  }

  function bindSessionModeEvents() {
    document.querySelectorAll('.session-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const len = Number(btn.dataset.sessionLength);
        sessionLength = len === 5 ? 5 : DEFAULT_SESSION_LENGTH;
        renderMenu();
      });
    });
  }

  function renderExerciseCard(ex) {
    const profile = Storage.getActiveProfile();
    const stats = profile ? Storage.getSessionStats(profile.id, ex.id) : null;
    let progressHtml;
    if (stats) {
      const bestTotal = stats.bestTotal || DEFAULT_SESSION_LENGTH;
      const stars = getSessionStars(stats.bestScore, bestTotal);
      const starStr = stars > 0 ? '⭐'.repeat(stars) : '–';
      progressHtml = `<span class="ex-progress">${starStr} Beste: ${stats.bestScore}/${bestTotal}</span>`;
    } else {
      progressHtml = `<span class="ex-progress ex-not-played">Noch nicht gespielt</span>`;
    }
    return `
      <button class="exercise-card" data-exercise="${ex.id}">
        <span class="ex-icon">${ex.icon}</span>
        <span class="ex-title">${ex.title}</span>
        <span class="ex-desc">${ex.description}</span>
        ${progressHtml}
      </button>
    `;
  }

  function renderMenu() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="screen workshop-screen">
        ${renderHeader()}
        <main class="exercise-menu">
          <p class="menu-intro">Such dir ein Forscher-Spiel aus.</p>
          ${renderSessionModeSelector()}
          <div class="exercise-grid">
            ${Object.values(exercises).map(renderExerciseCard).join('')}
          </div>
        </main>
      </div>
    `;
    bindSessionModeEvents();

    document.querySelectorAll('.exercise-card').forEach(card => {
      card.addEventListener('click', () => {
        resetSession();
        currentExerciseId = card.dataset.exercise;
        renderTask();
      });
    });
    document.getElementById('back-to-village').addEventListener('click', () => App.showVillage());
    setTimeout(() => {
      const menu = document.querySelector('.exercise-menu');
      if (menu) Oskar.show(menu, { placement:'inline-right', pool:'science', chance:0.7 });
    }, 50);
  }

  function generateTask(exerciseId) {
    const profile = Storage.getActiveProfile();
    const difficulty = profile ? Adaptive.getDifficulty(profile.id, exerciseId) : 1;
    const ex = exercises[exerciseId];
    return { ...ex.generate(difficulty), difficulty };
  }

  function renderTask() {
    const ex = exercises[currentExerciseId];
    if (!ex) return;

    sessionStats.total++;
    currentTask = nextTask();
    answered = false;

    const isTrueFalse = currentTask.taskType === 'trueFalse';
    const isChoice = currentTask.taskType === 'choice' || isTrueFalse;

    let inputSection;
    if (isTrueFalse) {
      inputSection = `
        <div class="tf-grid">
          <button class="tf-btn tf-btn--wahr choice-btn" data-value="Wahr">✅ Wahr</button>
          <button class="tf-btn tf-btn--falsch choice-btn" data-value="Falsch">❌ Falsch</button>
        </div>
      `;
    } else {
      inputSection = `
        <div class="choice-grid" id="choice-grid">
          ${currentTask.choices.map(c => `<button class="choice-btn" data-value="${encodeURIComponent(c)}">${c}</button>`).join('')}
        </div>
      `;
    }

    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="screen task-screen">
        ${renderHeader()}
        <main class="task-main">
          <div class="task-card">
            <div class="task-category">
              <span>${ex.icon}</span><span>${ex.title}</span>
              <span class="difficulty-indicator">${['⭐','⭐⭐','⭐⭐⭐'][currentTask.difficulty-1]||'⭐'}</span>
            </div>
            <div class="task-progress">
              <div class="task-progress-bar">
                <div class="task-progress-fill" style="width:${((sessionStats.total-1)/sessionLength)*100}%"></div>
              </div>
              <span class="task-progress-label">Aufgabe <strong>${sessionStats.total}</strong> von ${sessionLength}</span>
            </div>
            <div class="task-question">${currentTask.questionHtml}</div>
            ${inputSection}
            <div class="task-feedback hidden" id="task-feedback"></div>
            <div class="task-actions">
              ${currentTask.hint ? '<button class="btn btn-ghost" id="hint-btn">💡 Tipp</button>' : ''}
            </div>
          </div>
        </main>
      </div>
    `;

    document.querySelectorAll('.choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (answered) return;
        evaluateAnswer(decodeURIComponent(btn.dataset.value));
      });
    });
    const hintBtn = document.getElementById('hint-btn');
    if (hintBtn) {
      hintBtn.addEventListener('click', () => {
        showFeedback(currentTask.hint, 'hint');
      });
    }
    document.getElementById('back-to-village').addEventListener('click', () => {
      resetSession();
      App.showVillage();
    });

    setTimeout(() => {
      const main = document.querySelector('.task-main');
      if (main) Oskar.show(main, { placement:'task-companion', pool:'taskIntro', chance:0.2 });
    }, 50);
  }

  function evaluateAnswer(value) {
    if (answered) return;
    answered = true;

    const correct = value === currentTask.answer;
    const profile = Storage.getActiveProfile();
    if (profile) Storage.recordAttempt(profile.id, currentExerciseId, correct);

    if (correct) {
      sessionStats.correct++;
      if (profile) {
        Storage.addStars(profile.id, 1);
        const el = document.getElementById('header-stars');
        if (el) el.textContent = Storage.getActiveProfile().stars;
      }
      Oskar.say(randomFrom(Oskar.MESSAGES.correct));

      const fill = document.querySelector('.task-progress-fill');
      if (fill) fill.style.width = `${(sessionStats.total/sessionLength)*100}%`;

      highlightChoices(value, true);
      setTimeout(() => {
        if (sessionStats.total >= sessionLength) renderSessionComplete();
        else renderTask();
      }, 1600);
    } else {
      answered = false;
      Oskar.silence();
      queueRetry();
      showFeedback('Schau dir die grüne Antwort gut an – so merkst du sie dir! 🌟', 'wrong');
      highlightChoices(value, false);
      answered = true;

      const actions = document.querySelector('.task-actions');
      if (actions && !document.getElementById('next-btn')) {
        const nb = document.createElement('button');
        nb.className = 'btn btn-ghost';
        nb.id = 'next-btn';
        nb.textContent = 'Weiter →';
        actions.appendChild(nb);
        nb.addEventListener('click', () => {
          if (sessionStats.total >= sessionLength) renderSessionComplete();
          else renderTask();
        });
      }
    }
  }

  function highlightChoices(selected, wasCorrect) {
    document.querySelectorAll('.choice-btn').forEach(btn => {
      btn.disabled = true;
      const val = decodeURIComponent(btn.dataset.value);
      if (val === currentTask.answer) btn.classList.add('choice-btn--correct');
      else if (val === selected && !wasCorrect) btn.classList.add('choice-btn--wrong');
    });
  }

  function showFeedback(msg, type) {
    const fb = document.getElementById('task-feedback');
    if (!fb) return;
    fb.innerHTML = msg;
    fb.className = `task-feedback feedback-${type}`;
  }

  function renderSessionComplete() {
    launchConfetti();
    const profile = Storage.getActiveProfile();
    const correct = sessionStats.correct;
    const total   = sessionLength;
    const isPerfect = correct === total;

    if (profile) {
      Storage.saveSessionResult(profile.id, currentExerciseId, correct, total);
      if (isPerfect) Storage.addStars(profile.id, 2); // Bonus für eine fehlerfreie Runde
    }

    const praise      = randomFrom(PRAISE_MESSAGES);
    const performance = getPerformanceText(correct, total);
    const stars       = getSessionStars(correct, total);
    const starStr     = stars > 0 ? '⭐'.repeat(stars) : '☆☆☆';
    const bonusHtml   = isPerfect
      ? '<p class="complete-performance">🎁 +2 Bonus-Sterne für eine fehlerfreie Runde!</p>'
      : '';

    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="screen complete-screen">
        ${renderHeader()}
        <main class="complete-main">
          <div class="complete-card">
            <div class="complete-trophy">${stars>=3?'🏆':stars>=2?'🌟':'👍'}</div>
            <h2 class="complete-praise">${praise}</h2>
            <p class="complete-subtitle">Du hast <strong>${total} Aufgaben</strong> gespielt.</p>
            <div class="complete-score-row">
              <span class="complete-stars">${starStr}</span>
              <span class="complete-score-text">Geschafft: <strong>${correct} von ${total}</strong></span>
            </div>
            <p class="complete-performance">${performance}</p>
            ${bonusHtml}
            <div class="complete-actions">
              <button class="btn btn-primary" id="play-again-btn">🔄 Nochmal spielen</button>
              <button class="btn btn-ghost" id="back-to-menu-btn">🏠 Zur Lernwelt</button>
            </div>
          </div>
        </main>
      </div>
    `;

    document.getElementById('play-again-btn').addEventListener('click', () => {
      resetSession();
      renderTask();
    });
    document.getElementById('back-to-menu-btn').addEventListener('click', () => App.showVillage());
    document.getElementById('back-to-village').addEventListener('click', () => App.showVillage());

    setTimeout(() => {
      const main = document.querySelector('.complete-main');
      if (main) Oskar.show(main, { placement:'task-companion', pool:'correct', chance:1 });
    }, 100);
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  function mount() {
    resetSession();
    renderMenu();
  }

  return { mount };
})();
