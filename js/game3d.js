import * as THREE from 'three';

const DEBUG = {};
if (typeof window !== 'undefined') window.__ABYSSA3D = DEBUG;

const $ = (id) => (typeof document !== 'undefined' ? document.getElementById(id) : null);
const setTekst = (id, t) => { const el = $(id); if (el) el.textContent = t; };
const setZichtbaar = (id, v) => { const el = $(id); if (el) el.hidden = !v; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const hoek = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
const KANS = (a, b) => a + Math.random() * (b - a);

const WERELD = 200;
const RAND = WERELD / 2 - 3;
const TROON = { x: 0, z: -62 };
const POORT_Z = -52;
const RELIKWIE_POS = [[35, -25], [-35, -35], [55, 25], [-55, -5], [15, 50]];

const QUEST_TEKSTEN = [
    'Zoek Grimwick bij The Hollow Lantern — volg het warme licht in het westen',
    'Verzamel de 5 verloren relikwieën van Malagor',
    'Spreek Varynth aan bij de poort van de troonzaal in het noorden',
    'De eed is gebroken — versla Malagor op de gebroken troon!'
];

const state = {
    mode: 'start',
    hp: 100,
    maxHp: 100,
    zwaardSchade: 15,
    relikwieen: 0,
    relikwieenTotaal: RELIKWIE_POS.length,
    quest: 0,
    tijd: 0,
    barriere: true,
    bossActief: false,
    gewonnen: false,
    meldingT: 0
};

const input = { f: false, b: false, l: false, r: false, sprint: false, aanval: false, praten: false };

let renderer = null;
let scene = null;
let camera = null;
const cam = { yaw: 0, pitch: 0.28 };

const speler = {
    pos: new THREE.Vector3(0, 0, 30),
    vel: new THREE.Vector3(),
    richting: Math.PI,
    r: 0.5,
    mesh: null,
    zwaard: null,
    aanvalT: 0,
    slagToegepast: false
};

let world = null;
let vijanden = [];
let orbs = [];
let deeltjes = [];
let dialoog = null;
let audioCtx = null;
let ambient = null;
let tijdAcc = 0;
let tTot = 0;

let GLTFLoader = null;
const loadersKlaar = (async () => {
    try {
        const mod = await import('three/addons/loaders/GLTFLoader.js');
        GLTFLoader = mod.GLTFLoader || null;
    } catch (e) {
        GLTFLoader = null;
    }
})();

const MODEL_INSTELLINGEN = { grimwick: 1, varynth: 1, malthor: 1, twin: 1, trio: 1, malagor: 1 };

function laadModelMetFallback(groep, verberg, id) {
    if (!GLTFLoader) return;
    const cap = id.charAt(0).toUpperCase() + id.slice(1);
    const paden = ['assets/models/' + id + '.glb', 'assets/models/' + cap + '.glb'];
    const schaal = MODEL_INSTELLINGEN[id] || 1;
    const probeer = (i) => {
        if (i >= paden.length) return;
        try {
            new GLTFLoader().load(paden[i], (gltf) => {
                const m = gltf.scene;
                m.scale.setScalar(schaal);
                if (verberg) verberg.visible = false;
                groep.add(m);
            }, undefined, () => probeer(i + 1));
        } catch (e) {
            probeer(i + 1);
        }
    };
    probeer(0);
}

function maakPoppetje(opts) {
    const g = new THREE.Group();
    const mantel = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.6, 8), new THREE.MeshLambertMaterial({ color: opts.mantel }));
    mantel.position.y = 0.8;
    mantel.rotation.x = Math.PI;
    g.add(mantel);
    const lijf = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.6, 4, 8), new THREE.MeshLambertMaterial({ color: opts.lijf || opts.mantel }));
    lijf.position.y = 1.0;
    g.add(lijf);
    const hoofd = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), new THREE.MeshLambertMaterial({ color: opts.huid }));
    hoofd.position.y = 1.62;
    g.add(hoofd);
    [-0.32, 0.32].forEach((x) => {
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.8, 6), new THREE.MeshLambertMaterial({ color: opts.mantel }));
        arm.position.set(x, 1.1, 0);
        arm.rotation.z = x > 0 ? -0.3 : 0.3;
        g.add(arm);
    });
    if (opts.extra) opts.extra(g);
    return g;
}

function maakNpcFigura(id) {
    if (id === 'grimwick') {
        return maakPoppetje({
            huid: 0x6a8f4f,
            mantel: 0x3a2f1d,
            extra: (g) => {
                [-0.22, 0.22].forEach((x) => {
                    const oor = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.3, 6), new THREE.MeshLambertMaterial({ color: 0x6a8f4f }));
                    oor.position.set(x, 1.66, 0);
                    oor.rotation.z = x > 0 ? -0.7 : 0.7;
                    g.add(oor);
                });
                const ketel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.28, 0.5, 10), new THREE.MeshLambertMaterial({ color: 0x14161c }));
                ketel.position.set(0.75, 0.25, 0.3);
                g.add(ketel);
            }
        });
    }
    if (id === 'varynth') {
        const g = maakPoppetje({ huid: 0x14141f, mantel: 0x0c0c14 });
        g.scale.setScalar(1.25);
        const masker = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.4, 0.08), new THREE.MeshBasicMaterial({ color: 0xd4af37 }));
        masker.position.set(0, 1.62, 0.18);
        g.add(masker);
        const kap = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.5, 8), new THREE.MeshLambertMaterial({ color: 0x08080e }));
        kap.position.y = 1.95;
        g.add(kap);
        return g;
    }
    if (id === 'malthor') {
        const oogMat = new THREE.MeshBasicMaterial({ color: 0xffaa33 });
        const g = maakPoppetje({
            huid: 0x2a2438,
            mantel: 0x1a1030,
            extra: (gg) => {
                [-0.08, 0.08].forEach((x) => {
                    const oog = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), oogMat);
                    oog.position.set(x, 1.64, 0.18);
                    gg.add(oog);
                });
                const paard = new THREE.Group();
                const lijfP = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, 0.5), new THREE.MeshLambertMaterial({ color: 0x0d0a14 }));
                lijfP.position.y = 0.9;
                paard.add(lijfP);
                const kopP = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.5), new THREE.MeshLambertMaterial({ color: 0x0d0a14 }));
                kopP.position.set(0.85, 1.15, 0);
                paard.add(kopP);
                const oogP = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 6), oogMat);
                oogP.position.set(1.0, 1.2, 0.15);
                paard.add(oogP);
                [[-0.5, 0.2], [0.5, 0.2], [-0.5, -0.2], [0.5, -0.2]].forEach((p) => {
                    const been = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.9, 6), new THREE.MeshLambertMaterial({ color: 0x0d0a14 }));
                    been.position.set(p[0], 0.45, p[1]);
                    paard.add(been);
                });
                paard.position.set(1.3, 0, 0.6);
                gg.add(paard);
            }
        });
        return g;
    }
    if (id === 'twin') {
        const g = new THREE.Group();
        [-0.7, 0.7].forEach((x) => {
            const f = maakPoppetje({ huid: 0x9fc2e8, mantel: 0x274b6d });
            f.children.forEach((c) => {
                if (c.material) {
                    c.material.transparent = true;
                    c.material.opacity = 0.8;
                }
            });
            f.position.set(x, 0.35, 0);
            g.add(f);
        });
        return g;
    }
    if (id === 'trio') {
        const g = new THREE.Group();
        [-0.7, 0, 0.7].forEach((x) => {
            const f = maakPoppetje({ huid: 0xd8c9a8, mantel: 0x4a2f3a });
            f.scale.setScalar(0.85);
            f.position.set(x, 0, 0);
            g.add(f);
        });
        const tafel = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.9), new THREE.MeshLambertMaterial({ color: 0x2a2018 }));
        tafel.position.set(0, 0.75, 0.6);
        g.add(tafel);
        const kaars = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffb84d }));
        kaars.position.set(0, 0.9, 0.6);
        g.add(kaars);
        return g;
    }
    return maakPoppetje({ huid: 0xcfd8e8, mantel: 0x1a1a2e });
}

function maakSchimMesh(elite) {
    const s = elite ? 1.5 : 1;
    const g = new THREE.Group();
    const mantelMat = new THREE.MeshLambertMaterial({ color: elite ? 0x1a0508 : 0x050508, transparent: true, opacity: 0.92 });
    const mantel = new THREE.Mesh(new THREE.ConeGeometry(0.45 * s, 1.7 * s, 7), mantelMat);
    mantel.position.y = 0.95 * s;
    g.add(mantel);
    const kap = new THREE.Mesh(new THREE.SphereGeometry(0.24 * s, 8, 8), new THREE.MeshLambertMaterial({ color: 0x0a0a12 }));
    kap.position.y = 1.9 * s;
    g.add(kap);
    [-0.4, 0.4].forEach((x) => {
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * s, 0.04 * s, 0.9 * s, 6), mantelMat);
        arm.position.set(x * s, 1.15 * s, 0);
        arm.rotation.z = x > 0 ? -0.5 : 0.5;
        g.add(arm);
    });
    const oogMat = new THREE.MeshBasicMaterial({ color: elite ? 0xff3311 : 0xff2222 });
    [-0.08, 0.08].forEach((ox) => {
        const oog = new THREE.Mesh(new THREE.SphereGeometry(elite ? 0.07 : 0.045, 6, 6), oogMat);
        oog.position.set(ox * s, 1.92 * s, 0.2 * s);
        g.add(oog);
    });
    if (elite) {
        [-0.12, 0.12].forEach((x) => {
            const hoorn = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.35, 6), new THREE.MeshLambertMaterial({ color: 0x2a0a0a }));
            hoorn.position.set(x, 2.15 * s, 0);
            hoorn.rotation.z = x > 0 ? -0.4 : 0.4;
            g.add(hoorn);
        });
    }
    return g;
}

function laadTextuur(pad) {
    if (typeof Image === 'undefined') return null;
    const t = new THREE.TextureLoader().load(pad);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

function maakGrondTextuur() {
    try {
        const c = document.createElement('canvas');
        c.width = 256;
        c.height = 256;
        const ctx = c.getContext('2d');
        if (!ctx) return null;
        ctx.fillStyle = '#1c2745';
        ctx.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 2600; i++) {
            ctx.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,0.18)' : 'rgba(150,170,210,0.10)';
            ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
        }
        for (let i = 0; i < 26; i++) {
            ctx.strokeStyle = 'rgba(0,0,0,0.35)';
            ctx.beginPath();
            let x = Math.random() * 256;
            let y = Math.random() * 256;
            ctx.moveTo(x, y);
            for (let j = 0; j < 4; j++) {
                x += KANS(-40, 40);
                y += KANS(-40, 40);
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        const t = new THREE.CanvasTexture(c);
        t.wrapS = THREE.RepeatWrapping;
        t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(24, 24);
        t.colorSpace = THREE.SRGBColorSpace;
        return t;
    } catch (e) {
        return null;
    }
}

function maakBlob(r) {
    const b = new THREE.Mesh(
        new THREE.CircleGeometry(r, 20),
        new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45 })
    );
    b.rotation.x = -Math.PI / 2;
    b.position.y = 0.02;
    return b;
}

function plaatsBlob(x, z, r) {
    const b = maakBlob(r);
    b.position.set(x, 0.02, z);
    scene.add(b);
    return b;
}

function maakSpelerMesh() {
    const g = new THREE.Group();
    const mantel = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.5, 8), new THREE.MeshLambertMaterial({ color: 0x181826 }));
    mantel.position.y = 0.75;
    mantel.rotation.x = Math.PI;
    g.add(mantel);
    const lijf = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.75, 4, 8), new THREE.MeshLambertMaterial({ color: 0x2c2c4a, emissive: 0x0d0d18 }));
    lijf.position.y = 1.0;
    g.add(lijf);
    const kap = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), new THREE.MeshLambertMaterial({ color: 0x232338, emissive: 0x0a0a12 }));
    kap.position.y = 1.72;
    g.add(kap);
    const bies = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.06), new THREE.MeshBasicMaterial({ color: 0xd4af37 }));
    bies.position.set(0, 1.35, 0.3);
    g.add(bies);
    const lamp = new THREE.PointLight(0xffe2b0, 1.3, 12);
    lamp.position.set(0, 2.3, 0);
    g.add(lamp);
    const zwaard = new THREE.Group();
    const lemmet = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.05, 0.02), new THREE.MeshBasicMaterial({ color: 0xd4af37 }));
    lemmet.position.y = 0.55;
    zwaard.add(lemmet);
    const garde = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.07), new THREE.MeshBasicMaterial({ color: 0xd4af37 }));
    garde.position.y = 0.02;
    zwaard.add(garde);
    const handvat = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.28, 6), new THREE.MeshLambertMaterial({ color: 0x2a2a35 }));
    handvat.position.y = -0.12;
    zwaard.add(handvat);
    zwaard.position.set(0.42, 1.05, 0.15);
    g.add(zwaard);
    g.add(maakBlob(0.55));
    speler.zwaard = zwaard;
    return g;
}

function maakNpc(id, naam, x, z, portretPad, lichtKleur) {
    const groep = new THREE.Group();
    const sokkel = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.3, 0.4), new THREE.MeshLambertMaterial({ color: 0x1c2333 }));
    sokkel.position.y = 0.65;
    groep.add(sokkel);
    const figuur = maakNpcFigura(id);
    figuur.position.y = 1.3;
    groep.add(figuur);
    const licht = new THREE.PointLight(lichtKleur, 1.3, 9);
    licht.position.set(0, 3, 0.6);
    groep.add(licht);
    groep.position.set(x, 0, z);
    scene.add(groep);
    plaatsBlob(x, z, 0.9);
    return { id, naam, x, z, groep, figuur, portretPad, licht, seed: Math.random() * 10 };
}

function maakBoss() {
    const g = new THREE.Group();
    const mantel = new THREE.Mesh(new THREE.ConeGeometry(1.15, 3.4, 8), new THREE.MeshLambertMaterial({ color: 0x0d0d12 }));
    mantel.position.y = 1.7;
    g.add(mantel);
    const hoofd = new THREE.Mesh(new THREE.SphereGeometry(0.36, 10, 10), new THREE.MeshLambertMaterial({ color: 0x111118 }));
    hoofd.position.y = 3.7;
    g.add(hoofd);
    const oogMat = new THREE.MeshBasicMaterial({ color: 0xff2222 });
    [-0.13, 0.13].forEach((ox) => {
        const oog = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), oogMat);
        oog.position.set(ox, 3.75, 0.3);
        g.add(oog);
    });
    const kroon = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.05, 6, 12), new THREE.MeshBasicMaterial({ color: 0xd4af37 }));
    kroon.position.y = 4.05;
    kroon.rotation.x = Math.PI / 2;
    g.add(kroon);
    const masker = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.1), new THREE.MeshBasicMaterial({ color: 0x8f1d1d }));
    masker.position.set(0, 3.72, 0.3);
    g.add(masker);
    [-0.55, 0.55].forEach((x) => {
        const schouder = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshLambertMaterial({ color: 0x11111c }));
        schouder.position.set(x, 3.1, 0);
        g.add(schouder);
    });
    g.position.set(TROON.x, 0.6, TROON.z - 1.5);
    scene.add(g);
    plaatsBlob(TROON.x, TROON.z - 1.5, 1.3);
    return { mesh: g, hp: 150, maxHp: 150, cool: 0, summonT: 8, seed: 0 };
}

function spawneVijand(x, z, type) {
    const elite = type === 'bloedschim';
    const s = elite ? 1.5 : 1;
    const g = maakSchimMesh(elite);
    g.position.set(x, 0, z);
    scene.add(g);
    plaatsBlob(x, z, 0.5 * s);
    const v = {
        mesh: g,
        type: type || 'schim',
        hp: elite ? 55 : 30,
        maxHp: elite ? 55 : 30,
        dmg: elite ? 12 : 8,
        snelheidJacht: elite ? 3.0 : 3.4,
        snelheidZwerf: elite ? 1.3 : 1.6,
        cool: 0,
        doel: { x: KANS(-RAND, RAND), z: KANS(-RAND, RAND) },
        doelT: 0,
        seed: Math.random() * 10
    };
    vijanden.push(v);
    return v;
}

function bouwWereld() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b18);
    scene.fog = new THREE.FogExp2(0x131c36, 0.02);

    camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 600);

    scene.add(new THREE.HemisphereLight(0x2a3a66, 0x0a0d18, 1.25));
    scene.add(new THREE.AmbientLight(0x223355, 0.55));
    const maanLicht = new THREE.DirectionalLight(0x9fc2e8, 0.7);
    maanLicht.position.set(-60, 90, -120);
    scene.add(maanLicht);

    const sterPos = [];
    for (let i = 0; i < 900; i++) {
        const a = Math.random() * Math.PI * 2;
        const e = Math.random() * Math.PI * 0.45 + 0.05;
        const r = 380;
        sterPos.push(Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r);
    }
    const sterGeo = new THREE.BufferGeometry();
    sterGeo.setAttribute('position', new THREE.Float32BufferAttribute(sterPos, 3));
    scene.add(new THREE.Points(sterGeo, new THREE.PointsMaterial({ color: 0xcfd8e8, size: 2.2, sizeAttenuation: false, fog: false })));

    const maan = new THREE.Mesh(new THREE.CircleGeometry(16, 32), new THREE.MeshBasicMaterial({ color: 0xcfd8e8, fog: false }));
    maan.position.set(-150, 160, -330);
    maan.lookAt(0, 0, 0);
    scene.add(maan);

    const grondTex = maakGrondTextuur();
    const grondMat = grondTex
        ? new THREE.MeshLambertMaterial({ map: grondTex, color: 0xffffff })
        : new THREE.MeshLambertMaterial({ color: 0x24304e });
    const grond = new THREE.Mesh(new THREE.PlaneGeometry(WERELD + 40, WERELD + 40), grondMat);
    grond.rotation.x = -Math.PI / 2;
    scene.add(grond);

    world = { obstakels: [], relikwieen: [], torches: [], npcs: [], barriereMesh: [], boss: null, roodLicht: null, poortMeldingGedaan: false };

    for (let i = 0; i < 44; i++) {
        const x = KANS(-RAND, RAND);
        const z = KANS(-RAND, RAND);
        if (Math.hypot(x - TROON.x, z - TROON.z) < 16) continue;
        if (Math.hypot(x, z - 30) < 6) continue;
        if (RELIKWIE_POS.some((p) => Math.hypot(x - p[0], z - p[1]) < 5)) continue;
        if (Math.hypot(x + 45, z - 25) < 9) continue;
        if (Math.abs(z - POORT_Z) < 6 && Math.abs(x) < 8) continue;
        if (Math.hypot(x + 62, z + 55) < 13) continue;
        if (Math.hypot(x + 20, z + 45) < 9) continue;
        if (Math.hypot(x - 30, z - 45) < 9) continue;
        if (Math.hypot(x - 6, z - 8) < 6) continue;
        const boom = new THREE.Group();
        const stam = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.3, 3.4, 6), new THREE.MeshLambertMaterial({ color: 0x0c0c14 }));
        stam.position.y = 1.7;
        boom.add(stam);
        for (let j = 0; j < 3; j++) {
            const kegel = new THREE.Mesh(new THREE.ConeGeometry(1.6 - j * 0.45, 2.2, 6), new THREE.MeshLambertMaterial({ color: 0x0a1020 }));
            kegel.position.y = 3.2 + j * 1.5;
            boom.add(kegel);
        }
        boom.position.set(x, 0, z);
        scene.add(boom);
        plaatsBlob(x, z, 0.9);
        world.obstakels.push({ x, z, r: 0.55 });
    }

    const struikMat = new THREE.MeshLambertMaterial({ color: 0x14241a });
    for (let i = 0; i < 22; i++) {
        const x = KANS(-RAND, RAND);
        const z = KANS(-RAND, RAND);
        if (Math.hypot(x - TROON.x, z - TROON.z) < 14) continue;
        if (Math.hypot(x, z - 30) < 5) continue;
        if (RELIKWIE_POS.some((p) => Math.hypot(x - p[0], z - p[1]) < 4)) continue;
        const s = KANS(0.4, 0.9);
        const struik = new THREE.Mesh(new THREE.SphereGeometry(s, 7, 6), struikMat);
        struik.position.set(x, s * 0.55, z);
        struik.scale.y = 0.6;
        scene.add(struik);
        plaatsBlob(x, z, s * 0.8);
    }

    for (let i = 0; i < 14; i++) {
        const x = KANS(-RAND, RAND);
        const z = KANS(-RAND, RAND);
        if (Math.hypot(x - TROON.x, z - TROON.z) < 14) continue;
        if (Math.hypot(x, z - 30) < 5) continue;
        const s = KANS(0.5, 1.6);
        const rots = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), new THREE.MeshLambertMaterial({ color: 0x232a3d }));
        rots.position.set(x, s * 0.5, z);
        rots.rotation.set(Math.random(), Math.random() * 6, Math.random());
        scene.add(rots);
        plaatsBlob(x, z, s * 0.9);
        world.obstakels.push({ x, z, r: s * 0.8 });
    }

    const steenMat = new THREE.MeshLambertMaterial({ color: 0x2c3654 });
    const kasteel = new THREE.Group();
    const muurN = new THREE.Mesh(new THREE.BoxGeometry(18, 3, 0.8), steenMat); muurN.position.set(0, 1.5, -9); kasteel.add(muurN);
    const muurZ = new THREE.Mesh(new THREE.BoxGeometry(18, 3, 0.8), steenMat); muurZ.position.set(0, 1.5, 9); kasteel.add(muurZ);
    const muurW = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3, 18), steenMat); muurW.position.set(-9, 1.5, 0); kasteel.add(muurW);
    const muurO1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3, 7), steenMat); muurO1.position.set(9, 1.5, -5.5); kasteel.add(muurO1);
    const muurO2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3, 7), steenMat); muurO2.position.set(9, 1.5, 5.5); kasteel.add(muurO2);
    [[-9, -9], [9, -9], [-9, 9], [9, 9]].forEach((p) => {
        const toren = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.4, 7, 8), steenMat);
        toren.position.set(p[0], 3.5, p[1]);
        kasteel.add(toren);
    });
    const keep = new THREE.Mesh(new THREE.BoxGeometry(6, 4.5, 6), steenMat); keep.position.set(-2, 2.25, -2); kasteel.add(keep);
    const kasteelDak = new THREE.Mesh(new THREE.ConeGeometry(4.6, 2.6, 4), new THREE.MeshLambertMaterial({ color: 0x1a2138 }));
    kasteelDak.position.set(-2, 5.8, -2); kasteelDak.rotation.y = Math.PI / 4; kasteel.add(kasteelDak);
    kasteel.position.set(-62, 0, -55);
    scene.add(kasteel);
    plaatsBlob(-62, -55, 11);
    world.obstakels.push({ x: -62, z: -55, r: 10 });
    [[-9, -9], [9, -9], [-9, 9], [9, 9]].forEach((p) => world.obstakels.push({ x: -62 + p[0], z: -55 + p[1], r: 1.6 }));
    [[11.5, -3], [11.5, 3]].forEach((p) => {
        const paal = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 1.7, 6), new THREE.MeshLambertMaterial({ color: 0x11131c }));
        paal.position.set(-62 + p[0], 0.85, -55 + p[1]);
        scene.add(paal);
        const vlam = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffb84d }));
        vlam.position.set(-62 + p[0], 1.85, -55 + p[1]);
        scene.add(vlam);
        const kl = new THREE.PointLight(0xff9d3c, 1.8, 11);
        kl.position.set(-62 + p[0], 2.1, -55 + p[1]);
        scene.add(kl);
        world.torches.push({ vlam, licht: kl, seed: Math.random() * 10 });
    });

    const vijver = new THREE.Mesh(new THREE.CircleGeometry(6, 24), new THREE.MeshLambertMaterial({ color: 0x1e3d5c, transparent: true, opacity: 0.9 }));
    vijver.rotation.x = -Math.PI / 2;
    vijver.position.set(-20, 0.05, -45);
    scene.add(vijver);
    const vijverRand = new THREE.Mesh(new THREE.TorusGeometry(6, 0.35, 8, 24), steenMat);
    vijverRand.rotation.x = Math.PI / 2;
    vijverRand.position.set(-20, 0.06, -45);
    scene.add(vijverRand);
    plaatsBlob(-20, -45, 5.5);
    world.obstakels.push({ x: -20, z: -45, r: 5.6 });

    const grot = new THREE.Group();
    [[-3.2, 0, 2.4], [0, 1.2, 3.0], [3.2, 0, 2.4]].forEach((p) => {
        const rots = new THREE.Mesh(new THREE.DodecahedronGeometry(p[2], 0), steenMat);
        rots.position.set(p[0], p[2] * 0.7, p[1]);
        grot.add(rots);
    });
    grot.position.set(30, 0, 45);
    scene.add(grot);
    plaatsBlob(30, 45, 3.6);
    world.obstakels.push({ x: 30, z: 45, r: 3.6 });

    const kruispunt = new THREE.Mesh(new THREE.CircleGeometry(3, 20), steenMat);
    kruispunt.rotation.x = -Math.PI / 2;
    kruispunt.position.set(6, 0.04, 8);
    scene.add(kruispunt);
    plaatsBlob(6, 8, 1.1);
    world.obstakels.push({ x: 6, z: 8, r: 1.1 });

    const hut = new THREE.Group();
    const huis = new THREE.Mesh(new THREE.BoxGeometry(5, 3, 4), new THREE.MeshLambertMaterial({ color: 0x141a2c }));
    huis.position.y = 1.5;
    hut.add(huis);
    const dak = new THREE.Mesh(new THREE.ConeGeometry(3.8, 2.2, 4), new THREE.MeshLambertMaterial({ color: 0x0d0d18 }));
    dak.position.y = 4.1;
    dak.rotation.y = Math.PI / 4;
    hut.add(dak);
    hut.position.set(-45, 0, 25);
    scene.add(hut);
    const lantaarn = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffb84d }));
    lantaarn.position.set(-42.2, 2.2, 27.5);
    scene.add(lantaarn);
    const hutLicht = new THREE.PointLight(0xffb84d, 2.2, 14);
    hutLicht.position.set(-42.2, 2.6, 27.5);
    scene.add(hutLicht);
    world.obstakels.push({ x: -45, z: 25, r: 3.0 });

    const fakkelPos = [[-7, 12], [7, 12], [-7, -8], [7, -8], [-7, -28], [7, -28], [-8, -44], [8, -44]];
    fakkelPos.forEach((p, i) => {
        const f = new THREE.Group();
        const paal = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 1.7, 6), new THREE.MeshLambertMaterial({ color: 0x11131c }));
        paal.position.y = 0.85;
        f.add(paal);
        const vlam = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffb84d }));
        vlam.position.y = 1.85;
        f.add(vlam);
        f.position.set(p[0], 0, p[1]);
        scene.add(f);
        const licht = new THREE.PointLight(0xff9d3c, 1.7, 10);
        licht.position.set(p[0], 2.1, p[1]);
        scene.add(licht);
        world.torches.push({ vlam, licht, seed: Math.random() * 10 });
        world.obstakels.push({ x: p[0], z: p[1], r: 0.25 });
    });

    RELIKWIE_POS.forEach((p) => {
        const groep = new THREE.Group();
        const altaar = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.75, 0.6, 8), new THREE.MeshLambertMaterial({ color: 0x1c2333 }));
        altaar.position.y = 0.3;
        groep.add(altaar);
        const relik = new THREE.Mesh(new THREE.OctahedronGeometry(0.34), new THREE.MeshBasicMaterial({ color: 0xd4af37 }));
        relik.position.y = 1.35;
        groep.add(relik);
        const licht = new THREE.PointLight(0xd4af37, 1.8, 10);
        licht.position.y = 1.8;
        groep.add(licht);
        groep.position.set(p[0], 0, p[1]);
        scene.add(groep);
        plaatsBlob(p[0], p[1], 0.8);
        world.relikwieen.push({ mesh: relik, groep, x: p[0], z: p[1], genomen: false, seed: Math.random() * 10 });
    });

    const platform = new THREE.Mesh(new THREE.BoxGeometry(12, 0.6, 9), new THREE.MeshLambertMaterial({ color: 0x141a2c }));
    platform.position.set(TROON.x, 0.3, TROON.z);
    scene.add(platform);
    [[-5, -58], [5, -58], [-5, -66], [5, -66]].forEach((p) => {
        const pilaar = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 6, 8), new THREE.MeshLambertMaterial({ color: 0x1c2333 }));
        pilaar.position.set(p[0], 3, p[1]);
        scene.add(pilaar);
        plaatsBlob(p[0], p[1], 0.9);
        world.obstakels.push({ x: p[0], z: p[1], r: 0.8 });
    });
    const troon = new THREE.Group();
    const zit = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.9, 1.2), new THREE.MeshLambertMaterial({ color: 0x0d0d14 }));
    zit.position.y = 0.45;
    troon.add(zit);
    const rug = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.8, 0.4), new THREE.MeshLambertMaterial({ color: 0x0d0d14 }));
    rug.position.set(0, 1.8, -0.45);
    troon.add(rug);
    const goudTrim = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.08, 0.08), new THREE.MeshBasicMaterial({ color: 0xd4af37 }));
    goudTrim.position.set(0, 3.1, -0.45);
    troon.add(goudTrim);
    troon.position.set(TROON.x, 0.6, TROON.z - 1.5);
    scene.add(troon);
    const beeld = new THREE.Mesh(
        new THREE.PlaneGeometry(6, 3.4),
        new THREE.MeshBasicMaterial({ map: laadTextuur('assets/bg/malagor-walk.webp'), color: 0x8899bb, transparent: true, opacity: 0.85 })
    );
    beeld.position.set(TROON.x, 2.6, TROON.z - 4.2);
    scene.add(beeld);
    const roodLicht = new THREE.PointLight(0x8f1d1d, 2.6, 20);
    roodLicht.position.set(TROON.x, 5, TROON.z);
    scene.add(roodLicht);
    world.roodLicht = roodLicht;

    const bar = new THREE.Mesh(
        new THREE.PlaneGeometry(10, 3.4),
        new THREE.MeshBasicMaterial({ color: 0x9fc2e8, transparent: true, opacity: 0.3, side: THREE.DoubleSide })
    );
    bar.position.set(0, 1.7, POORT_Z);
    scene.add(bar);
    const bar2 = new THREE.Mesh(
        new THREE.PlaneGeometry(10, 3.4),
        new THREE.MeshBasicMaterial({ color: 0x9fc2e8, wireframe: true, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
    );
    bar2.position.set(0, 1.7, POORT_Z);
    scene.add(bar2);
    world.barriereMesh = [bar, bar2];

    world.npcs.push(maakNpc('grimwick', 'Grimwick', -41.5, 28.5, 'assets/img/grimwick.png', 0xffb84d));
    world.npcs.push(maakNpc('varynth', 'Varynth', 4.5, -48, 'assets/img/gouden-masker.jpg', 0x9fc2e8));
    world.npcs.push(maakNpc('malthor', 'Malthor', 6, 8, 'assets/img/malthor.jpg', 0xffaa33));
    world.npcs.push(maakNpc('twin', 'Vespera & Vaelen', -20, -38, 'assets/img/twin-echoes.jpg', 0x9fc2e8));
    world.npcs.push(maakNpc('trio', 'Het Waxen Trio', 30, 51, 'assets/img/waxen-trio.jpg', 0xd4af37));

    world.boss = maakBoss();

    speler.mesh = maakSpelerMesh();
    speler.mesh.position.copy(speler.pos);
    scene.add(speler.mesh);

    [[20, 10], [-20, -15], [30, -45], [-30, 45], [50, -10], [-50, -30], [40, 30], [-35, 20], [10, -40], [-10, 55]].forEach((p) => spawneVijand(p[0], p[1]));
    spawneVijand(-55, -48, 'bloedschim');
    spawneVijand(-26, -40, 'bloedschim');
    spawneVijand(9, -46, 'bloedschim');
}

function burst(pos, kleur, n) {
    for (let i = 0; i < n; i++) {
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.07, 5, 5), new THREE.MeshBasicMaterial({ color: kleur }));
        m.position.copy(pos);
        scene.add(m);
        deeltjes.push({ mesh: m, vel: new THREE.Vector3(KANS(-2.5, 2.5), KANS(1, 4.5), KANS(-2.5, 2.5)), leven: KANS(0.4, 0.8) });
    }
}

function spawnOrb(x, z) {
    const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.22), new THREE.MeshBasicMaterial({ color: 0x9fc2e8 }));
    m.position.set(x, 0.8, z);
    scene.add(m);
    orbs.push({ mesh: m, x, z, seed: Math.random() * 10 });
}

function sfx(type) {
    try {
        const AC = typeof AudioContext !== 'undefined' ? AudioContext : (typeof window !== 'undefined' ? window.webkitAudioContext : undefined);
        if (!AC) return;
        if (!audioCtx) audioCtx = new AC();
        if (audioCtx.state === 'suspended' && audioCtx.resume) audioCtx.resume();
        const t = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        const freqs = {
            aanval: [220, 90, 0.12, 0.12, 'square'],
            treffer: [160, 50, 0.18, 0.18, 'sawtooth'],
            relikwie: [660, 990, 0.15, 0.3, 'sine'],
            schade: [110, 60, 0.2, 0.25, 'sawtooth'],
            brul: [70, 40, 0.25, 0.65, 'sawtooth'],
            praat: [440, 440, 0.08, 0.1, 'sine']
        };
        const f = freqs[type] || freqs.praat;
        osc.type = f[4];
        osc.frequency.setValueAtTime(f[0], t);
        osc.frequency.exponentialRampToValueAtTime(Math.max(1, f[1]), t + f[3]);
        gain.gain.setValueAtTime(f[2], t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + f[3]);
        osc.start(t);
        osc.stop(t + f[3] + 0.05);
    } catch (e) {
        return;
    }
}

function startAmbient() {
    try {
        if (typeof Audio === 'undefined') return;
        ambient = new Audio('assets/audio/VERT_DF2.flac');
        ambient.loop = true;
        ambient.volume = 0.45;
        const p = ambient.play();
        if (p && p.catch) p.catch(() => {});
    } catch (e) {
        return;
    }
}

function formatTijd(t) {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
}

function updateHUD() {
    setTekst('hud-quest', 'Missie: ' + QUEST_TEKSTEN[clamp(state.quest, 0, QUEST_TEKSTEN.length - 1)]);
    setTekst('hud-relikwieen', '✦ ' + state.relikwieen + '/' + state.relikwieenTotaal);
    const fill = $('hud-levens-fill');
    if (fill) fill.style.width = clamp((state.hp / state.maxHp) * 100, 0, 100) + '%';
    setTekst('hud-tijd', formatTijd(state.tijd));
}

function melding(tekst) {
    setTekst('hud-melding', tekst);
    setZichtbaar('hud-melding', true);
    state.meldingT = 3;
}

function questZet(i) {
    state.quest = i;
    updateHUD();
}

function flits() {
    const stage = $('game3d-stage');
    if (stage && stage.classList) {
        stage.classList.add('schade');
        setTimeout(() => stage.classList.remove('schade'), 220);
    }
}

function schadeSpeler(n) {
    if (state.mode !== 'playing') return;
    state.hp -= n;
    flits();
    sfx('schade');
    updateHUD();
    if (state.hp <= 0) {
        state.hp = 0;
        einde(false);
    }
}

function einde(gewonnen) {
    state.mode = 'einde';
    state.gewonnen = gewonnen;
    setTekst('hud-bericht-titel', gewonnen ? 'De nacht is voorbij' : 'De afgrond heeft je');
    setTekst(
        'hud-bericht-tekst',
        gewonnen
            ? 'Malagor is gevallen en het mechanisme van de troon is gebroken. De klokken onder de Staalzee stoppen bij zeven. Jij — Keldrin — hebt de balans hersteld in ' + formatTijd(state.tijd) + ' met ' + state.relikwieen + '/' + state.relikwieenTotaal + ' relikwieën.'
            : 'Je zakt weg in de mist... Iemand vangt je op bij een herberg met een hol brandende lantaarn. "Welkom, reiziger — begin maar opnieuw."'
    );
    setZichtbaar('hud-bericht', true);
    setZichtbaar('hud-dialoog', false);
    sfx(gewonnen ? 'relikwie' : 'brul');
}

function aanval() {
    if (state.mode !== 'playing' || speler.aanvalT > 0) return;
    speler.aanvalT = 0.45;
    speler.slagToegepast = false;
    sfx('aanval');
}

function slagToepassen() {
    vijanden.slice().forEach((v) => {
        const dx = v.mesh.position.x - speler.pos.x;
        const dz = v.mesh.position.z - speler.pos.z;
        const d = Math.hypot(dx, dz);
        if (d < 3.0) {
            const hv = Math.atan2(dx, dz);
            if (Math.abs(hoek(hv - speler.richting)) < 1.1 || d < 1.2) hurtVijand(v, state.zwaardSchade, dx, dz);
        }
    });
    const b = world.boss;
    if (b && b.hp > 0) {
        const dx = b.mesh.position.x - speler.pos.x;
        const dz = b.mesh.position.z - speler.pos.z;
        if (Math.hypot(dx, dz) < 3.6) hurtBoss(state.zwaardSchade);
    }
}

function hurtVijand(v, dmg, dx, dz) {
    v.hp -= dmg;
    sfx('treffer');
    burst(v.mesh.position.clone().setY(1.2), 0xff4444, 8);
    const d = Math.hypot(dx, dz) || 1;
    v.mesh.position.x += (dx / d) * 1.2;
    v.mesh.position.z += (dz / d) * 1.2;
    if (v.hp <= 0) {
        scene.remove(v.mesh);
        vijanden.splice(vijanden.indexOf(v), 1);
        burst(v.mesh.position.clone().setY(1), 0x8f1d1d, 16);
        if (Math.random() < 0.5) spawnOrb(v.mesh.position.x, v.mesh.position.z);
        melding('Een schim is vernietigd');
    }
}

function hurtBoss(dmg) {
    const b = world.boss;
    b.hp -= dmg;
    sfx('treffer');
    burst(b.mesh.position.clone().setY(2.5), 0xd4af37, 8);
    if (b.hp <= 0) {
        b.hp = 0;
        scene.remove(b.mesh);
        burst(b.mesh.position.clone().setY(2), 0x8f1d1d, 30);
        melding('Malagor is gevallen!');
        einde(true);
    } else {
        melding('Malagor: ' + Math.max(0, Math.round(b.hp)) + '/' + b.maxHp + ' levens');
    }
}

function npcRegels(npc) {
    if (npc.id === 'grimwick') {
        return [
            'Every traveler has a story, my friend. Sommigen kun je beter niet vertellen.',
            'Malagor verzamelt relikwieën in zijn troonzaal, in het noorden. Vijf stuks. Verzamel ze en breek zijn ritueel.',
            'The Hollow Lantern is een veilige plek: hier geneest de reiziger. Ga nu — en pas op de schimmen in het woud.'
        ];
    }
    if (state.relikwieen >= state.relikwieenTotaal) {
        return [
            'Niet alle duisternis is kwaadaardig. En niet al het licht verdient het om te overleven.',
            'De vijf relikwieën... ja. Daarmee breek je het mechanisme van de troon. De eed van het water is gebroken.',
            'Malagor wacht op je, reiziger. Ga — en onthoud: niemand weet aan welke kant ik sta. Misschien weet ik het zelf niet eens.'
        ];
    }
    if (npc.id === 'varynth') {
        return [
            'Je draagt het water nog in je zakken, reiziger. De poort blijft dicht.',
            'Kom terug wanneer je alle vijf de relikwieën hebt gevonden. Dan breek ik de eed.'
        ];
    }
    if (npc.id === 'malthor') {
        return [
            'Berichten van de doden, aanwijzingen voor de levenden — altijd tegen een prijs, reiziger.',
            'Kijk naar het kasteel in het westen, of naar de poort in het noorden. Daar bewaart de Bewaker zijn geheim.',
            'Neem dit — het kwam van de doden: een herinnering die geneest.'
        ];
    }
    if (npc.id === 'twin') {
        return [
            'Elke eed die in bloed is geschreven, wordt door het water teruggevorderd...',
            'Jij bent nog heel, sterveling. Het water geeft terug wat het nam.',
            'Zwem hier nooit in. Wij hebben gezworen dat te bewaken.'
        ];
    }
    if (npc.id === 'trio') {
        return [
            'Elke koning valt, elke pion bereikt de overkant...',
            'Jouw zwaard is nog scherp, reiziger. Kijk maar — het wordt scherper.',
            'Speel mee in ons schaakspel, en je wint. Verlies, en je vergeet een geliefde.'
        ];
    }
    return ['...'];
}

function dichtstbijzijndeNpc() {
    let beste = null;
    let bd = 3.6;
    world.npcs.forEach((n) => {
        const d = Math.hypot(n.x - speler.pos.x, n.z - speler.pos.z);
        if (d < bd) {
            bd = d;
            beste = n;
        }
    });
    return beste;
}

function praat() {
    if (state.mode === 'playing') {
        const n = dichtstbijzijndeNpc();
        if (n) {
            dialoog = { npc: n, regel: 0, regels: npcRegels(n) };
            state.mode = 'dialoog';
            toonDialoog();
            sfx('praat');
        }
    } else if (state.mode === 'dialoog') {
        dialoog.regel++;
        if (dialoog.regel >= dialoog.regels.length) sluitDialoog();
        else toonDialoog();
    }
}

function toonDialoog() {
    const d = dialoog;
    setZichtbaar('hud-dialoog', true);
    setTekst('hud-dialoog-naam', d.npc.naam);
    setTekst('hud-dialoog-zin', d.regels[d.regel]);
    const img = $('hud-dialoog-img');
    if (img) img.src = d.npc.portretPad;
    setTekst('hud-dialoog-volgende', d.regel >= d.regels.length - 1 ? 'Sluiten ✕' : 'Volgende →');
}

function sluitDialoog() {
    const n = dialoog.npc;
    dialoog = null;
    state.mode = 'playing';
    setZichtbaar('hud-dialoog', false);
    if (n.id === 'grimwick') {
        state.hp = state.maxHp;
        updateHUD();
        melding('Grimwick heeft je volledig genezen');
        if (state.quest === 0) questZet(1);
    } else if (n.id === 'varynth') {
        if (state.relikwieen >= state.relikwieenTotaal && state.barriere) {
            state.barriere = false;
            world.barriereMesh.forEach((m) => {
                m.visible = false;
            });
            questZet(3);
            melding('De eed van het water is gebroken — de poort staat open!');
            sfx('brul');
        } else if (state.quest < 2) {
            questZet(2);
        }
    } else if (n.id === 'malthor') {
        spawnOrb(speler.pos.x + 1, speler.pos.z);
        melding('Malthor fluistert: de dichtstbijzijnde relikwie staat in het ' + richtingNaarRelikwie());
    } else if (n.id === 'twin') {
        if (state.hp < 60) {
            state.hp = clamp(state.hp + 30, 0, state.maxHp);
            updateHUD();
            melding('Het water geeft terug — +30 levens');
        } else {
            melding('De Twin Echoes oordelen: je bent nog heel, sterveling');
        }
    } else if (n.id === 'trio') {
        state.zwaardSchade = 25;
        melding('Het Waxen Trio scherpt je zwaard — schade nu ' + state.zwaardSchade);
    }
}

function richtingNaarRelikwie() {
    let beste = null;
    let bd = 1e9;
    world.relikwieen.forEach((r) => {
        if (r.genomen) return;
        const d = Math.hypot(r.x - speler.pos.x, r.z - speler.pos.z);
        if (d < bd) {
            bd = d;
            beste = r;
        }
    });
    if (!beste) return '—';
    const dx = beste.x - speler.pos.x;
    const dz = beste.z - speler.pos.z;
    const graden = ((Math.atan2(dx, -dz) * 180) / Math.PI + 360) % 360;
    const richtingen = ['noorden', 'noordoosten', 'oosten', 'zuidoosten', 'zuiden', 'zuidwesten', 'westen', 'noordwesten'];
    return richtingen[Math.round(graden / 45) % 8] + ' (' + Math.round(bd) + 'm)';
}

function updateVijanden(dt) {
    vijanden.forEach((v) => {
        const dx = speler.pos.x - v.mesh.position.x;
        const dz = speler.pos.z - v.mesh.position.z;
        const d = Math.hypot(dx, dz);
        let dirx = 0;
        let dirz = 0;
        let snelheid = 0;
        if (d < 12 && d > 0.001) {
            dirx = dx / d;
            dirz = dz / d;
            snelheid = v.snelheidJacht;
        } else {
            v.doelT -= dt;
            if (v.doelT <= 0) {
                v.doel = { x: KANS(-RAND, RAND), z: KANS(-RAND, RAND) };
                v.doelT = KANS(3, 7);
            }
            const wx = v.doel.x - v.mesh.position.x;
            const wz = v.doel.z - v.mesh.position.z;
            const wd = Math.hypot(wx, wz);
            if (wd >= 1) {
                dirx = wx / wd;
                dirz = wz / wd;
                snelheid = v.snelheidZwerf;
            }
        }
        if (snelheid > 0) {
            v.mesh.position.x += dirx * snelheid * dt;
            v.mesh.position.z += dirz * snelheid * dt;
            v.mesh.rotation.y = Math.atan2(dirx, dirz);
        }
        world.obstakels.forEach((o) => {
            const ex = v.mesh.position.x - o.x;
            const ez = v.mesh.position.z - o.z;
            const ed = Math.hypot(ex, ez);
            const min = o.r + 0.45;
            if (ed < min && ed > 0.0001) {
                v.mesh.position.x = o.x + (ex / ed) * min;
                v.mesh.position.z = o.z + (ez / ed) * min;
            }
        });
        if (state.barriere && v.mesh.position.z < POORT_Z + 0.6 && Math.abs(v.mesh.position.x) < 5.2) {
            v.mesh.position.z = POORT_Z + 0.6;
        }
        vijanden.forEach((o) => {
            if (o === v) return;
            const sx = v.mesh.position.x - o.mesh.position.x;
            const sz = v.mesh.position.z - o.mesh.position.z;
            const sd = Math.hypot(sx, sz);
            if (sd < 1 && sd > 0.0001) {
                v.mesh.position.x += (sx / sd) * 5 * dt;
                v.mesh.position.z += (sz / sd) * 5 * dt;
            }
        });
        v.cool -= dt;
        if (d < 1.9 * (v.type === 'bloedschim' ? 1.4 : 1) && v.cool <= 0) {
            v.cool = 1.2;
            schadeSpeler(v.dmg);
        }
    });
}

function updateBoss(dt) {
    const b = world.boss;
    if (!b || b.hp <= 0) return;
    const d = Math.hypot(speler.pos.x - b.mesh.position.x, speler.pos.z - b.mesh.position.z);
    if (!state.bossActief && !state.barriere && d < 15) {
        state.bossActief = true;
        melding('Malagor is ontwaakt! Versla hem op de gebroken troon!');
        sfx('brul');
    }
    if (state.bossActief) {
        b.cool -= dt;
        if (d < 3 && b.cool <= 0) {
            b.cool = 1.5;
            schadeSpeler(18);
        }
        b.summonT -= dt;
        if (b.summonT <= 0 && vijanden.length < 4) {
            b.summonT = 9;
            spawneVijand(b.mesh.position.x + KANS(-4, 4), b.mesh.position.z + KANS(3, 6));
            melding('Malagor roept een schim op!');
        }
    }
}

function update(dt) {
    if (state.mode === 'playing') {
        state.tijd += dt;
        const F = { x: -Math.sin(cam.yaw), z: -Math.cos(cam.yaw) };
        const R = { x: -F.z, z: F.x };
        let mx = (input.r ? 1 : 0) - (input.l ? 1 : 0);
        let mz = (input.f ? 1 : 0) - (input.b ? 1 : 0);
        const len = Math.hypot(mx, mz);
        if (len > 0) {
            mx /= len;
            mz /= len;
        }
        const snelheid = input.sprint ? 7.5 : 5;
        const doelX = (F.x * mz + R.x * mx) * snelheid;
        const doelZ = (F.z * mz + R.z * mx) * snelheid;
        const k = 1 - Math.exp(-12 * dt);
        speler.vel.x += (doelX - speler.vel.x) * k;
        speler.vel.z += (doelZ - speler.vel.z) * k;
        speler.pos.x += speler.vel.x * dt;
        speler.pos.z += speler.vel.z * dt;
        if (len > 0) {
            const dirX = F.x * mz + R.x * mx;
            const dirZ = F.z * mz + R.z * mx;
            const doelRichting = Math.atan2(dirX, dirZ);
            speler.richting += hoek(doelRichting - speler.richting) * Math.min(1, 14 * dt);
        }
        speler.pos.x = clamp(speler.pos.x, -RAND, RAND);
        speler.pos.z = clamp(speler.pos.z, -RAND, RAND);
        world.obstakels.forEach((o) => {
            const dx = speler.pos.x - o.x;
            const dz = speler.pos.z - o.z;
            const d = Math.hypot(dx, dz);
            const min = o.r + speler.r;
            if (d < min && d > 0.0001) {
                speler.pos.x = o.x + (dx / d) * min;
                speler.pos.z = o.z + (dz / d) * min;
            }
        });
        if (state.barriere && speler.pos.z < POORT_Z + 0.6 && Math.abs(speler.pos.x) < 5.2) {
            speler.pos.z = POORT_Z + 0.6;
            if (!world.poortMeldingGedaan) {
                world.poortMeldingGedaan = true;
                melding('De eed van het water houdt je tegen — verzamel eerst de relikwieën en spreek Varynth aan');
            }
        }
        if (speler.aanvalT > 0) {
            speler.aanvalT -= dt;
            if (!speler.slagToegepast && speler.aanvalT <= 0.3) {
                speler.slagToegepast = true;
                slagToepassen();
            }
            if (speler.aanvalT <= 0) speler.aanvalT = 0;
        }
        if (input.aanval) {
            input.aanval = false;
            aanval();
        }
        if (input.praten) {
            input.praten = false;
            praat();
        }
        world.relikwieen.forEach((r) => {
            if (r.genomen) return;
            if (Math.hypot(r.x - speler.pos.x, r.z - speler.pos.z) < 1.9) {
                r.genomen = true;
                r.groep.visible = false;
                state.relikwieen++;
                state.hp = clamp(state.hp + 20, 0, state.maxHp);
                sfx('relikwie');
                burst(r.groep.position.clone().setY(1.4), 0xd4af37, 14);
                if (state.relikwieen >= state.relikwieenTotaal) {
                    questZet(2);
                    melding('Alle relikwieën gevonden! Spreek Varynth aan bij de poort van de troonzaal');
                } else {
                    melding('Relikwie gevonden! (' + state.relikwieen + '/' + state.relikwieenTotaal + ') — +20 levens');
                }
                updateHUD();
            }
        });
        orbs.slice().forEach((o) => {
            if (Math.hypot(o.x - speler.pos.x, o.z - speler.pos.z) < 1.5) {
                scene.remove(o.mesh);
                orbs.splice(orbs.indexOf(o), 1);
                state.hp = clamp(state.hp + 15, 0, state.maxHp);
                sfx('relikwie');
                updateHUD();
                melding('Een herinnering keert terug — +15 levens');
            }
        });
        updateVijanden(dt);
        updateBoss(dt);
        const n = dichtstbijzijndeNpc();
        setZichtbaar('hud-npc', !!n);
        if (n) setTekst('hud-npc', 'Druk op E om met ' + n.naam + ' te praten');
        if (state.meldingT > 0) {
            state.meldingT -= dt;
            if (state.meldingT <= 0) setZichtbaar('hud-melding', false);
        }
        tijdAcc += dt;
        if (tijdAcc > 0.25) {
            tijdAcc = 0;
            updateHUD();
        }
    } else if (state.mode === 'dialoog') {
        input.aanval = false;
        if (input.praten) {
            input.praten = false;
            praat();
        }
        if (state.meldingT > 0) {
            state.meldingT -= dt;
            if (state.meldingT <= 0) setZichtbaar('hud-melding', false);
        }
    }
}

function visuals(dt) {
    tTot += dt;
    if (speler.mesh) {
        speler.mesh.position.copy(speler.pos);
        speler.mesh.rotation.y = speler.richting;
        const bew = Math.hypot(speler.vel.x, speler.vel.z) > 0.5 ? 1 : 0;
        speler.mesh.position.y = Math.abs(Math.sin(tTot * 8)) * 0.06 * bew;
        if (speler.zwaard) {
            if (speler.aanvalT > 0) {
                const t = 1 - speler.aanvalT / 0.45;
                speler.zwaard.rotation.z = -1.4 + t * 2.2;
            } else {
                speler.zwaard.rotation.z = Math.sin(tTot * 2) * 0.08;
            }
        }
    }
    world.relikwieen.forEach((r) => {
        if (r.genomen) return;
        r.mesh.rotation.y += dt * 2;
        r.mesh.position.y = 1.35 + Math.sin(tTot * 2 + r.seed) * 0.12;
    });
    world.torches.forEach((t) => {
        const f = 1 + Math.sin(tTot * 11 + t.seed) * 0.25 + Math.sin(tTot * 23 + t.seed * 2) * 0.12;
        t.vlam.scale.set(f, f * (1 + Math.sin(tTot * 17 + t.seed) * 0.2), f);
        if (t.licht) t.licht.intensity = 1.3 * f;
    });
    world.npcs.forEach((n) => {
        n.figuur.position.y = 1.3 + Math.sin(tTot * 1.5 + n.seed) * 0.06;
        n.licht.intensity = 1.2 + Math.sin(tTot * 3 + n.seed) * 0.25;
    });
    const b = world.boss;
    if (b && b.hp > 0) {
        b.mesh.position.y = 0.6 + Math.sin(tTot * 1.2) * 0.15;
        b.mesh.rotation.y += dt * (state.bossActief ? 1.5 : 0.2);
    }
    vijanden.forEach((v) => {
        v.mesh.position.y = Math.sin(tTot * 3 + v.seed) * 0.12;
    });
    orbs.forEach((o) => {
        o.mesh.rotation.y += dt * 3;
        o.mesh.position.y = 0.8 + Math.sin(tTot * 2.5 + o.seed) * 0.1;
    });
    deeltjes.slice().forEach((p) => {
        p.leven -= dt;
        p.mesh.position.add(p.vel.clone().multiplyScalar(dt));
        p.vel.y -= 6 * dt;
        if (p.leven <= 0) {
            scene.remove(p.mesh);
            deeltjes.splice(deeltjes.indexOf(p), 1);
        }
    });
    if (world.roodLicht) world.roodLicht.intensity = 2.4 + Math.sin(tTot * 2.2) * 0.5;
    const afstand = 5.6 - cam.pitch * 2.0;
    const hoogte = 2.2 + cam.pitch * 2.6;
    camera.position.set(
        speler.pos.x + Math.sin(cam.yaw) * afstand,
        hoogte,
        speler.pos.z + Math.cos(cam.yaw) * afstand
    );
    camera.lookAt(speler.pos.x, 1.5, speler.pos.z);
}

let vorigeT = 0;

function animate(t) {
    if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(animate);
    const nu = typeof t === 'number' ? t : 0;
    const dt = clamp((nu - vorigeT) / 1000, 0, 0.05) || 0.016;
    vorigeT = nu;
    if (world) {
        update(dt);
        visuals(dt);
    }
    if (renderer && scene && camera) renderer.render(scene, camera);
}

function startSpel() {
    if (state.mode !== 'start') return;
    state.mode = 'playing';
    setZichtbaar('game3d-start', false);
    startAmbient();
    sfx('brul');
    questZet(0);
    melding('Zoek Grimwick bij The Hollow Lantern — het warme licht in het westen');
    updateHUD();
}

function bindInvoer() {
    function wisselFullscreen() {
        if (typeof document === 'undefined') return;
        const stage = $('game3d-stage');
        if (!document.fullscreenElement) {
            const el = stage || document.documentElement;
            if (el.requestFullscreen) el.requestFullscreen();
        } else if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
    const KEYMAP = { KeyW: 'f', ArrowUp: 'f', KeyS: 'b', ArrowDown: 'b', KeyA: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r' };
    if (typeof window !== 'undefined' && window.addEventListener) {
        window.addEventListener('keydown', (e) => {
            if (KEYMAP[e.code]) {
                input[KEYMAP[e.code]] = true;
                if (e.preventDefault) e.preventDefault();
            } else if (e.code === 'Space') {
                input.aanval = true;
                if (e.preventDefault) e.preventDefault();
            } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
                input.sprint = true;
            } else if (e.code === 'KeyE') {
                input.praten = true;
                if (e.preventDefault) e.preventDefault();
            } else if (e.code === 'KeyF') {
                wisselFullscreen();
            }
        });
        window.addEventListener('keyup', (e) => {
            if (KEYMAP[e.code]) input[KEYMAP[e.code]] = false;
            else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') input.sprint = false;
        });
        window.addEventListener('resize', () => {
            const stage = $('game3d-stage');
            if (renderer && stage && camera) {
                const w = stage.clientWidth;
                const h = stage.clientHeight;
                renderer.setSize(w, h);
                camera.aspect = w / h;
                camera.updateProjectionMatrix();
            }
        });
    }
    const stage = $('game3d-stage');
    const doel = (renderer && renderer.domElement) || stage;
    if (doel && doel.addEventListener) {
        let sleep = false;
        let sx = 0;
        let sy = 0;
        let moved = 0;
        let downT = 0;
        doel.addEventListener('pointerdown', (e) => {
            sleep = true;
            sx = e.clientX;
            sy = e.clientY;
            moved = 0;
            downT = (typeof performance !== 'undefined' ? performance.now() : 0);
        });
        if (typeof window !== 'undefined') {
            window.addEventListener('pointermove', (e) => {
                if (!sleep) return;
                const dx = e.clientX - sx;
                const dy = e.clientY - sy;
                moved += Math.abs(dx) + Math.abs(dy);
                cam.yaw -= dx * 0.006;
                cam.pitch = clamp(cam.pitch + dy * 0.004, 0, 0.85);
                sx = e.clientX;
                sy = e.clientY;
            });
            window.addEventListener('pointerup', () => {
                if (sleep && moved < 6 && (typeof performance !== 'undefined' ? performance.now() : 0) - downT < 400 && state.mode === 'playing') {
                    input.aanval = true;
                }
                sleep = false;
            });
        }
    }
    if (typeof window !== 'undefined' && 'ontouchstart' in window) {
        setZichtbaar('game3d-touch', true);
        const joy = $('touch-joystick');
        const knop = $('touch-knop');
        let joyId = null;
        let jx = 0;
        let jy = 0;
        if (joy && joy.addEventListener) {
            joy.addEventListener('touchstart', (e) => {
                const t = e.changedTouches[0];
                joyId = t.identifier;
                const r = joy.getBoundingClientRect();
                jx = r.left + r.width / 2;
                jy = r.top + r.height / 2;
                if (e.preventDefault) e.preventDefault();
            }, { passive: false });
            window.addEventListener('touchmove', (e) => {
                for (const t of e.changedTouches) {
                    if (t.identifier === joyId && knop) {
                        let dx = t.clientX - jx;
                        let dy = t.clientY - jy;
                        const d = Math.hypot(dx, dy);
                        const max = 42;
                        if (d > max) {
                            dx = (dx / d) * max;
                            dy = (dy / d) * max;
                        }
                        knop.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
                        input.f = dy < -8;
                        input.b = dy > 8;
                        input.l = dx < -8;
                        input.r = dx > 8;
                    } else if (t.identifier !== joyId) {
                        cam.yaw -= (t.clientX - (t._lx || t.clientX)) * 0.008;
                        cam.pitch = clamp(cam.pitch + (t.clientY - (t._ly || t.clientY)) * 0.005, 0, 0.85);
                        t._lx = t.clientX;
                        t._ly = t.clientY;
                    }
                }
            }, { passive: true });
            window.addEventListener('touchend', (e) => {
                for (const t of e.changedTouches) {
                    if (t.identifier === joyId) {
                        joyId = null;
                        input.f = input.b = input.l = input.r = false;
                        if (knop) knop.style.transform = '';
                    }
                    t._lx = undefined;
                    t._ly = undefined;
                }
            });
        }
        const ak = $('touch-aanval');
        if (ak) ak.addEventListener('touchstart', (e) => { input.aanval = true; if (e.preventDefault) e.preventDefault(); }, { passive: false });
        const pk = $('touch-praten');
        if (pk) pk.addEventListener('touchstart', (e) => { input.praten = true; if (e.preventDefault) e.preventDefault(); }, { passive: false });
    }
    const fsk = $('hud-fullscreen');
    if (fsk) fsk.addEventListener('click', wisselFullscreen);
    if (typeof document !== 'undefined' && document.addEventListener) {
        document.addEventListener('fullscreenchange', () => {
            setTekst('hud-fullscreen', document.fullscreenElement ? '✕' : '⛶');
            const stage = $('game3d-stage');
            if (renderer && stage && camera) {
                renderer.setSize(stage.clientWidth, stage.clientHeight);
                camera.aspect = stage.clientWidth / stage.clientHeight;
                camera.updateProjectionMatrix();
            }
        });
    }
    const vk = $('hud-dialoog-volgende');
    if (vk) vk.addEventListener('click', () => praat());
    const bk = $('hud-bericht-knop');
    if (bk) bk.addEventListener('click', () => { if (typeof location !== 'undefined') location.reload(); });
    const sk = $('game3d-start-knop');
    if (sk) sk.addEventListener('click', startSpel);
}

function init() {
    bouwWereld();
    loadersKlaar.then(() => {
        if (!GLTFLoader || !world) return;
        world.npcs.forEach((n) => laadModelMetFallback(n.groep, n.figuur, n.id));
        if (world.boss) laadModelMetFallback(world.boss.mesh, world.boss.mesh, 'malagor');
    });
    const stage = $('game3d-stage');
    const w = (stage && stage.clientWidth) || 960;
    const h = (stage && stage.clientHeight) || 540;
    try {
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(Math.min((typeof window !== 'undefined' && window.devicePixelRatio) || 1, 1.5));
        renderer.setSize(w, h);
        if (typeof THREE.SRGBColorSpace !== 'undefined') renderer.outputColorSpace = THREE.SRGBColorSpace;
        if (typeof THREE.ACESFilmicToneMapping !== 'undefined') renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.25;
        const holder = $('game3d-canvas');
        if (holder && renderer.domElement) holder.appendChild(renderer.domElement);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    } catch (e) {
        const f = $('game3d-fout');
        if (f) {
            f.hidden = false;
            f.textContent = 'WebGL wordt niet ondersteund door deze browser — de 3D-game kan niet starten.';
        }
        const sk = $('game3d-start-knop');
        if (sk) sk.disabled = true;
    }
    bindInvoer();
    updateHUD();
    animate(0);
    DEBUG.state = state;
    DEBUG.input = input;
    DEBUG.speler = speler;
    DEBUG.cam = cam;
    DEBUG.update = update;
    DEBUG.visuals = visuals;
    DEBUG.world = () => world;
    DEBUG.vijanden = () => vijanden;
    DEBUG.internals = {
        praat,
        aanval,
        schadeSpeler,
        slagToepassen,
        dichtstbijzijndeNpc,
        questZet,
        melding,
        startSpel,
        einde,
        hurtBoss,
        hurtVijand,
        spawneVijand
    };
}

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
}
