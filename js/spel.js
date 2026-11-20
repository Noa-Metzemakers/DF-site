(function () {
    const venster = document.getElementById('spel-venster');
    if (!venster) return;

    const elKicker = document.getElementById('spel-kicker');
    const elTitel = document.getElementById('spel-titel');
    const elTekst = document.getElementById('spel-tekst');
    const elKeuzes = document.getElementById('spel-keuzes');
    const elBeeld = document.getElementById('spel-beeld');
    const elAfbeelding = document.getElementById('spel-afbeelding');
    const elCaption = document.getElementById('spel-beeldcaption');
    const elBalansBar = document.getElementById('spel-balans-bar');
    const elBalansWijzer = document.getElementById('spel-balans-wijzer');
    const elGeheugen = document.getElementById('spel-geheugen-sterren');
    const elWijziging = document.getElementById('spel-wijziging');
    const elActies = document.getElementById('spel-acties');
    const elOpnieuw = document.getElementById('spel-opnieuw');
    const elSamenvatting = document.getElementById('spel-samenvatting');

    const MAX_BALANS = 6;
    const MAX_GEHEUGEN = 3;

    const scenes = {
        start: {
            kicker: 'proloog van het spel',
            titel: 'Wakker in het donker',
            beeld: { src: 'assets/img/keldrin.png', alt: 'Keldrin, de reiziger met zwaard in een donkere cape tussen blauwe bloemen in de mist', caption: 'Keldrin — de reiziger' },
            tekst: [
                'Geen hemel, geen vloer — alleen kou, en een zwaard in je hand dat nog warm is van iets dat je je niet herinnert.',
                'In de verte hoor je klokken onder de mist. Zeven, denk je. Of toch acht.',
                'Je naam is weg. Het pad achter je is uitgewist. Voor je ligt alleen de nacht van het Afgrondkoninkrijk.'
            ],
            keuzes: [
                { tekst: 'Zoek het zwakke licht van een herberg in de mist', next: 'herberg', balans: 1 },
                { tekst: 'Volg de fluisterende wind over de asgrauwe vlakten', next: 'aswastes', balans: -1 },
                { tekst: 'Ga zitten en tel de klokken die je hoort', next: 'klokken' }
            ]
        },
        klokken: {
            kicker: 'legende I',
            titel: 'De klokken onder de Staalzee',
            tekst: [
                'Eén. Twee. Drie. Vier. Vijf. Zes. Zeven. Klaar en duidelijk, als een wet.',
                'Maar als je heel goed luistert, heel zacht, hoor je er een achtste. De stad Vincennes is gestopt met tellen bij zeven — de achtste is daar nooit meer opgehouden.'
            ],
            keuzes: [
                { tekst: 'Tel stilletjes door tot acht', next: 'herberg', flags: { achtste_gehoord: true }, balans: -1, msg: 'de achtste klok galmt door je borstkas' },
                { tekst: 'Stop bij zeven, zoals Vincennes deed', next: 'herberg', balans: 1 }
            ]
        },
        herberg: {
            kicker: 'de eerste veilige plek',
            titel: 'The Hollow Lantern',
            beeld: { src: 'assets/img/grimwick.png', alt: 'Grimwick, een oude goblin met ketel en glas in een donkere herberg', caption: 'Grimwick — Keeper of the Wandering Hearth' },
            tekst: [
                'De herberg duikt op uit de mist alsof hij er altijd al stond: een lantaarn die hol brandt, een borrelende ketel, en achter de toog een eeuwenoude goblin met een glimlach die net iets te vriendelijk is.',
                '“Every traveler has a story, my friend,” zegt Grimwick. “Maar sommige verhalen kun je beter niet vertellen.”'
            ],
            fluister: [1],
            keuzes: [
                { tekst: 'Eet, luister naar zijn verhalen en vertrouw hem', next: 'kruispunt', flags: { grimwick_vertrouwd: true }, balans: 1 },
                { tekst: 'Vraag rechtuit: wie is Varynth?', next: 'kruispunt', flags: { varynth_gevraagd: true }, msg: 'Grimwicks glimlach verdwijnt onmiddelijk' },
                { tekst: 'Pak stilletjes een glanzend voorwerp van de plank en glip naar buiten', next: 'kruispunt', flags: { gestolen: true }, balans: -1 }
            ]
        },
        kruispunt: {
            kicker: 'een onmogelijke keuze',
            titel: 'Het nachtelijke kruispunt',
            beeld: { src: 'assets/img/malthor.jpg', alt: 'Malthor op een nachtmerrie met amberkleurige ogen, op een donker kruispunt', caption: 'Malthor — The Midnight Courier' },
            tekst: [
                'Op het kruispunt staat een gestalte op een gigantische nachtmerrie met gloeiende amberkleurige ogen. Malthor. Hij verschijnt uit het niets, precies waar reizigers een onmogelijke keuze moeten maken.',
                '“Berichten van de doden, aanwijzingen voor de levenden — altijd tegen een zware prijs, reiziger.”'
            ],
            fluister: [1],
            keuzes: [
                { tekst: 'Betaal: geef een herinnering voor een aanwijzing naar de troonzaal', next: 'tempel', flags: { malthor_aanwijzing: true }, geheugen: -1, balans: -1 },
                { tekst: 'Wijs zijn handel af en loop rechtdoor', next: 'tempel', balans: 1 },
                { tekst: 'Vraag hem wie Malagor werkelijk is', next: 'tempel', flags: { malagor_bekend: true }, msg: 'Malthor toont een zeldzame vorm van ontzag' }
            ]
        },
        tempel: {
            kicker: 'de verdronken eed',
            titel: 'De poortwachters van het water',
            beeld: { src: 'assets/img/twin-echoes.jpg', alt: 'Vespera en Vaelen, twee figuren met blauwe gezichten in rode capes in een verzonken tempel', caption: 'Vespera & Vaelen — The Twin Echoes of Velen' },
            tekst: [
                'Twee figuren zweven zonder benen boven het zwarte water van de verzonken tempel. Hun stemmen galmen als één echo over het water, alsof twee gedachten tegelijk door je hoofd resoneren.',
                '“Elke eed die in het bloed is geschreven, wordt uiteindelijk door het water teruggevorderd... Wat breng je ons om te ruilen, sterveling?”'
            ],
            fluister: [1],
            keuzes: [
                { tekst: 'Geef een herinnering — het pad over het water gaat open', next: 'grot', geheugen: -1 },
                { tekst: 'Weiger: geen herinnering is te koop', next: 'grot', balans: 1, flags: { echoes_geweigerd: true } },
                { tekst: 'Vraag wat er onder hun maskers zit', next: 'grot', flags: { maskers_gezien: true }, balans: -1, msg: 'onder het masker: alleen water en echo’s' }
            ]
        },
        grot: {
            kicker: 'het spel van het lot',
            titel: 'De grot onder de bergen',
            beeld: { src: 'assets/img/waxen-trio.jpg', alt: 'Morva, Vola en Zelyth aan een tafel met schaakbord en kaarsen in een grot', caption: 'Morva, Vola & Zelyth — The Waxen Trio' },
            tekst: [
                'Bij kaarslicht zitten drie zieneressen aan een schaakbord in een verborgen grot. Ze spreken in koor: “Elke koning valt, elke pion bereikt de overkant.”',
                '“Wie verliest, betaalt niet met goud — maar met een herinnering aan een geliefde.”'
            ],
            fluister: [1],
            keuzes: [
                {
                    tekst: 'Speel het schaakspel',
                    next: 'aswastes',
                    effect: function (s) {
                        if (s.balans >= 1) {
                            return { flags: { trio_gewonnen: true }, msg: 'je wint — Grimwick zou trots op je zijn' };
                        }
                        return { geheugen: -1, msg: 'je verliest een herinnering aan een geliefde' };
                    }
                },
                { tekst: 'Kijk naar het bord — de stukken zijn echte zielen van verdwenen koningen', next: 'aswastes', alleen: ['maskers_gezien'], flags: { trio_gewonnen: true, zielen_gezien: true }, balans: 1, msg: 'het trio knikt: jij ziet wat zij zien' },
                { tekst: 'Weiger te spelen en loop door naar de uitgang', next: 'aswastes', geheugen: -1 }
            ]
        },
        aswastes: {
            kicker: 'de aswoestijnen',
            titel: 'Drakhor, de bloedkrijgsheer',
            tekst: [
                'In de schaduw van de vulkanische bergen wacht een krijgsheer wier bijl ijsblauw glanst. Drakhor. Zijn ogen meten je — niet je wapen.',
                '“Sta stil, reiziger... Wie hier met getrokken zwaard komt, krijgt een graf.”'
            ],
            fluister: [1],
            keuzes: [
                { tekst: 'Daag hem uit voor een eervol duel', next: 'poort', flags: { drakhor_eer: true }, balans: -1, msg: 'jouw moed wint zijn respect' },
                { tekst: 'Bied vrede aan en noem de schulden van zijn bloedlijn', next: 'poort', flags: { drakhor_vrede: true }, balans: 1 },
                { tekst: 'Loop door zonder hem aan te kijken', next: 'poort', flags: { drakhor_beledigd: true }, balans: -1, msg: 'zijn trots is gekrenkt' }
            ]
        },
        poort: {
            kicker: 'de grens',
            titel: 'De poort van de verwoeste zaal',
            tekst: [
                'Voor je rijst de troonzaal op: een gigantisch mechanisme van steen en echo, met de gebroken troon in het midden. Wie het ritueel voltooit, herschrijft de wereld — zonder oorlog.',
                'Achter je de nacht. Voor je het einde van alle kronieken.'
            ],
            keuzes: [
                { tekst: 'Steek de poort over naar de troonzaal', next: 'troonzaal' },
                { tekst: 'Roep de naam van de Bewaker van de Afgrond', next: 'varynth' },
                { tekst: 'Luister naar de stem van de afgrond', next: 'varynth', flags: { stem_gehoord: true }, balans: -1, msg: 'de afgrond fluistert een naam die niet de jouwe is' }
            ]
        },
        troonzaal: {
            kicker: 'de gebroken troon',
            titel: 'Malagor, Heer van de Stille Zaal',
            beeld: { src: 'assets/bg/malagor-walk.webp', alt: 'Malagor, de gebroken koning, wandelend door de verwoeste zaal', caption: 'Malagor — The Sovereign of the Shattered Throne' },
            tekst: [
                'Hij beweegt niet — hij regeert. Samengesmolten met zijn gotische troon kijkt de gebroken koning je aan, kil, berekenend en gespeend van mededogen.',
                '“Laat de koninkrijken maar hopen op de ochtend. Wie op mijn troon zit, weet dat de nacht nooit werkelijk voorbijgaat.”'
            ],
            fluister: [1],
            keuzes: [
                {
                    tekst: 'Breek het mechanisme van de troon met je zwaard',
                    next: 'troonzaal',
                    alleen: ['malthor_aanwijzing', 'trio_gewonnen'],
                    effect: function (s) {
                        if (s.balans >= 1) {
                            return { next: 'eind_balans' };
                        }
                        return { next: 'eind_steen', msg: 'te laat — het ritueel was bijna voltooid' };
                    }
                },
                { tekst: 'Ga op de gebroken troon zitten en voltooi het ritueel zelf', next: 'eind_nacht', balans: -2 },
                { tekst: 'Tel de klokken in de zaal — tot acht', next: 'eind_achtste', alleen: ['achtste_gehoord'] },
                { tekst: 'Zwijg, kijk naar het gouden masker in de hoek en wacht', next: 'eind_wacht' }
            ]
        },
        varynth: {
            kicker: 'het centrale mysterie',
            titel: 'Varynth, het Gouden Gelaatloze',
            beeld: { src: 'assets/img/gouden-masker.jpg', alt: 'Varynth in een zwarte cape met een gouden masker', caption: 'Varynth — The Keeper of the Abyss' },
            tekst: [
                'Onder een zwarte hoed en een oud gouden masker staat hij: ouder dan de koninkrijken, stiller dan de nacht. Hij spreekt zelden — en als hij spreekt, luisteren zelfs koningen.',
                '“Niet alle duisternis is kwaadaardig. En niet al het licht verdient het om te overleven.”'
            ],
            fluister: [1],
            keuzes: [
                { tekst: 'Trek het gouden masker af', next: 'eind_masker' },
                {
                    tekst: 'Leg je zwaard neer en vraag: aan welke kant sta jij?',
                    next: 'eind_vraag',
                    effect: function (s) {
                        if (s.balans >= 2) return { next: 'eind_balans' };
                        if (s.balans <= -2) return { next: 'eind_afgrond' };
                        return { next: 'eind_vraag' };
                    }
                },
                {
                    tekst: 'Draai je om en loop de afgrond in, zonder om te kijken',
                    next: 'eind_weg',
                    effect: function (s) {
                        return s.flags.stem_gehoord ? { next: 'eind_afgrond' } : { next: 'eind_weg' };
                    }
                }
            ]
        }
    };

    const endings = {
        eind_balans: {
            titel: 'De balans hersteld',
            tekst: [
                'Je zwaard breekt het mechanisme met een kreet die door de zaal echoot. Steen kraakt, het ritueel stokt, en de klokken onder de Staalzee stoppen bij zeven.',
                'Varynth kijkt je aan door zijn gouden masker en knikt één keer — de eerste keer dat iemand hem ziet knikken. Boven de zwarte golven gaat voor het eerst in eeuwen een dageraad open.',
                'Je weet nog steeds niet wie je was. Maar je weet wie je bent geworden: degene die de balans herstelde.'
            ]
        },
        eind_nacht: {
            titel: 'De eeuwige nacht',
            tekst: [
                'Je gaat op de gebroken troon zitten. Malagor lacht zonder geluid — het mechanisme voltooit zichzelf.',
                'De wereld wordt stil, dan grijs, dan steen en as. Ergens onder het zwarte water hoor je geen klokken meer. Zelfs de achtste is gestopt.',
                'Wie op de troon zit, weet dat de nacht nooit werkelijk voorbijgaat. Nu zit jij erop.'
            ]
        },
        eind_achtste: {
            geheim: true,
            titel: 'De achtste klok',
            tekst: [
                'Je telde acht. In de stilte van de troonzaal zwelt de achtste klok — en het mechanisme van de troon stopt, voor het eerst in eeuwen.',
                '“Zelfs ik telde maar zeven,” zegt Malagor verbaasd. Achter je verschijnt een gouden masker in het donker.',
                '“De Bewaker kent alle acht,” zegt Varynth. “Hij heeft ze zelf gesmeed. Nu ben jij de enige andere die ze kent.”'
            ],
            fluister: [2]
        },
        eind_masker: {
            titel: 'Onder het masker',
            tekst: [
                'Je trekt het gouden masker van zijn gezicht. Er is geen gezicht — alleen donker, zo diep dat je fakkel dooft.',
                'Dan voel je het: het masker zakt op jouw eigen gezicht, en niemand — niemand — weet meer aan welke kant jij staat.',
                'Welkom, nieuwe Bewaker. De afgrond kijkt terug. Naar jou.'
            ]
        },
        eind_vraag: {
            titel: 'Het antwoord van de Stille Koning',
            tekst: [
                'Varynth kijkt je lang aan. Dan zegt hij, zacht: “Aan de kant van de eed. Niet aan die van de mensen.”',
                'Hij draait zich om en loopt de afgrond in, alleen. Jij blijft staan op de drempel — en voor het eerst sinds lange tijd voel je iets als rust.'
            ]
        },
        eind_afgrond: {
            titel: 'De afgrond beschermt',
            tekst: [
                'Je stapt de trede af, het zwarte water in. Het is ijskoud — maar het draagt je.',
                'Onder de golven hoor je de klokken: acht deze keer. Een hand pakt de jouwe.',
                '“Welkom thuis, reiziger,” galmt het. De afgrond beschermt tegen de wereld. Jij wist het al.'
            ],
            fluister: [2]
        },
        eind_weg: {
            titel: 'De nacht in',
            tekst: [
                'Je draait je om en loopt de nacht in, het zwaard in je hand.',
                'Achter je dooft het licht van de troonzaal. Voor je liggen de fluisterende heuvels.',
                'Loop door. Antwoord niet. Hij luistert mee.'
            ]
        },
        eind_wacht: {
            titel: 'De lege zaal',
            tekst: [
                'Je wacht. De nacht wacht met je mee. Om je heen kraakt het mechanisme, maar niemand voltooit het.',
                'Uiteindelijk sta je op en loop je de zaal uit — zonder te weten waarom je kwam, alleen dat je er was.'
            ]
        },
        eind_steen: {
            titel: 'Steen en as',
            tekst: [
                'Je breekt het mechanisme — maar het is te laat: de laatste relikwie lag al klaar. De muren worden grijs, de echo’s sterven weg.',
                'De wereld is gered. Een halve overwinning — maar jij voelt haar niet meer.'
            ]
        },
        eind_vergeten: {
            geheim: true,
            titel: 'Alles vergeten',
            tekst: [
                'De laatste herinnering vervaagt in de mist. Naam, pad, zwaard — alles.',
                'Iemand vangt je op bij een herberg met een hol brandende lantaarn. Een oude goblin glimlacht te vriendelijk.',
                '“Welkom, reiziger,” zegt hij. “Elke reiziger heeft een verhaal. Begin maar opnieuw.”'
            ],
            fluister: [2]
        }
    };

    let state;

    function reset() {
        state = { scene: 'start', balans: 0, geheugen: MAX_GEHEUGEN, flags: {} };
    }

    function renderStatus() {
        const pct = ((state.balans + MAX_BALANS) / (MAX_BALANS * 2)) * 100;
        elBalansWijzer.style.left = pct + '%';
        elBalansBar.setAttribute('aria-label', 'Balans: ' + state.balans + ' tussen min ' + -MAX_BALANS + ' en plus ' + MAX_BALANS);
        let sterren = '';
        for (let i = 0; i < MAX_GEHEUGEN; i++) {
            sterren += i < state.geheugen ? '✦' : '<span class="leeg">✦</span>';
        }
        elGeheugen.innerHTML = sterren;
        elGeheugen.setAttribute('aria-label', state.geheugen + ' van ' + MAX_GEHEUGEN + ' herinneringen over');
    }

    function vulTekst(container, tekst, fluister) {
        container.innerHTML = '';
        tekst.forEach((par, i) => {
            const p = document.createElement('p');
            p.textContent = par;
            if (fluister && fluister.indexOf(i) !== -1) p.classList.add('spel-fluister');
            container.appendChild(p);
        });
    }

    function toonWijziging(tekst) {
        if (!tekst) {
            elWijziging.classList.remove('zichtbaar');
            return;
        }
        elWijziging.textContent = '✦ ' + tekst;
        elWijziging.classList.add('zichtbaar');
    }

    function renderScene(id) {
        const scene = scenes[id];
        if (!scene) return;
        state.scene = id;
        elKicker.textContent = scene.kicker;
        elTitel.textContent = scene.titel;
        vulTekst(elTekst, scene.tekst, scene.fluister);
        if (scene.beeld) {
            elBeeld.hidden = false;
            elAfbeelding.src = scene.beeld.src;
            elAfbeelding.alt = scene.beeld.alt;
            elCaption.textContent = scene.beeld.caption;
        } else {
            elBeeld.hidden = true;
        }
        elKeuzes.innerHTML = '';
        scene.keuzes.forEach((keuze) => {
            if (keuze.alleen && !keuze.alleen.some((f) => state.flags[f])) return;
            const knop = document.createElement('button');
            knop.type = 'button';
            knop.className = 'knop spel-keuze';
            knop.textContent = keuze.tekst;
            knop.addEventListener('click', () => kies(keuze));
            elKeuzes.appendChild(knop);
        });
        elActies.hidden = true;
        elSamenvatting.hidden = true;
        renderStatus();
    }

    function renderEnding(id) {
        const ending = endings[id];
        if (!ending) return;
        state.scene = id;
        elKicker.textContent = ending.geheim ? 'geheim einde' : 'einde';
        elTitel.textContent = ending.titel;
        vulTekst(elTekst, ending.tekst, ending.fluister);
        elBeeld.hidden = true;
        elKeuzes.innerHTML = '';
        elSamenvatting.hidden = false;
        elSamenvatting.textContent = 'Balans: ' + state.balans + ' · Geheugen: ' + state.geheugen + '/' + MAX_GEHEUGEN + (ending.geheim ? ' · dit einde wordt bijna nooit gefluisterd' : '');
        elActies.hidden = false;
        renderStatus();
    }

    function kies(keuze) {
        let next = keuze.next;
        let balans = keuze.balans || 0;
        let geheugen = keuze.geheugen || 0;
        const flags = Object.assign({}, keuze.flags);
        let msg = keuze.msg || '';

        if (typeof keuze.effect === 'function') {
            const res = keuze.effect(state) || {};
            balans += res.balans || 0;
            geheugen += res.geheugen || 0;
            Object.assign(flags, res.flags || {});
            if (res.msg) msg = res.msg;
            if (res.next) next = res.next;
        }

        state.balans = Math.max(-MAX_BALANS, Math.min(MAX_BALANS, state.balans + balans));
        state.geheugen = Math.max(0, Math.min(MAX_GEHEUGEN, state.geheugen + geheugen));
        Object.keys(flags).forEach((f) => { if (flags[f]) state.flags[f] = true; });

        const berichten = [];
        if (balans > 0) berichten.push('het licht wint terrein');
        if (balans < 0) berichten.push('de duisternis wint terrein');
        if (geheugen < 0) berichten.push('een herinnering vervaagt in de mist');
        if (msg) berichten.push(msg);
        toonWijziging(berichten.join(' · '));

        if (state.geheugen <= 0) {
            renderEnding('eind_vergeten');
            return;
        }
        if (endings[next]) {
            renderEnding(next);
        } else {
            renderScene(next);
        }
    }

    elOpnieuw.addEventListener('click', () => {
        reset();
        toonWijziging('');
        renderScene('start');
    });

    reset();
    renderScene('start');
})();
