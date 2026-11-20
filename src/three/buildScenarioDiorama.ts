import * as THREE from "three";
import { SPATIAL_PROPS } from "./dioramaCatalog";

export interface SteamPuff {
  mesh: THREE.Mesh;
  material: THREE.MeshBasicMaterial;
  origin: [number, number, number];
  phase: number;
  speed: number;
  driftRadius: number;
  maxHeight: number;
}

export interface DustMoteSpec {
  baseX: number;
  baseY: number;
  baseZ: number;
  phase: number;
  speed: number;
  radius: number;
  scale: number;
}

export interface BuiltDiorama {
  root: THREE.Group;
  interactables: THREE.Object3D[];
  propGroups: Map<string, THREE.Group>;
  propBaseRotY: Map<string, number>;
  resonanceRings: THREE.Mesh[];
  lampBulbMaterial: THREE.MeshStandardMaterial;
  studioFloorMaterial: THREE.MeshStandardMaterial;
  selectionBeacon: THREE.Group;
  beaconOuterRing: THREE.Mesh;
  beaconInnerRing: THREE.Mesh;
  steamPuffs: SteamPuff[];
  dustMotes: THREE.InstancedMesh;
  dustMoteSpecs: DustMoteSpec[];
  dispose: () => void;
}

function createMarbleTexture(maxAnisotropy: number): {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const size = 512;
  const colorCanvas = document.createElement("canvas");
  colorCanvas.width = size;
  colorCanvas.height = size;
  const ctx = colorCanvas.getContext("2d")!;

  // Pale cool marble travertine base
  ctx.fillStyle = "#e8ecef";
  ctx.fillRect(0, 0, size, size);

  // Subtle organic veining
  for (let i = 0; i < 28; i++) {
    ctx.beginPath();
    const startY = (i / 28) * size;
    ctx.moveTo(0, startY);
    for (let x = 0; x <= size; x += 32) {
      const wave =
        Math.sin(x * 0.015 + i * 1.1) * 14 +
        Math.cos(x * 0.032 - i * 0.7) * 7;
      ctx.lineTo(x, startY + wave);
    }
    ctx.strokeStyle =
      i % 3 === 0 ? "rgba(148, 163, 184, 0.22)" : "rgba(203, 213, 225, 0.28)";
    ctx.lineWidth = i % 4 === 0 ? 2.2 : 1;
    ctx.stroke();
  }

  // Fine mineral speckle
  for (let i = 0; i < 900; i++) {
    const x = (i * 197) % size;
    const y = (i * 353) % size;
    ctx.fillStyle =
      i % 2 === 0 ? "rgba(100,116,139,0.06)" : "rgba(255,255,255,0.22)";
    ctx.fillRect(x, y, 2, 2);
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(2, 2);
  map.anisotropy = maxAnisotropy;

  // Roughness variation map (linear space)
  const roughCanvas = document.createElement("canvas");
  roughCanvas.width = 256;
  roughCanvas.height = 256;
  const rctx = roughCanvas.getContext("2d")!;
  rctx.fillStyle = "#525252";
  rctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 18; i++) {
    rctx.strokeStyle = "rgba(130, 130, 130, 0.35)";
    rctx.lineWidth = 3;
    rctx.beginPath();
    rctx.moveTo(0, (i / 18) * 256);
    rctx.bezierCurveTo(90, i * 15, 160, i * 11, 256, i * 14);
    rctx.stroke();
  }
  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(2, 2);

  return { map, roughnessMap };
}

function createWoodTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#6e4e37";
  ctx.fillRect(0, 0, 512, 256);

  for (let y = 0; y < 256; y += 3) {
    const shade = Math.sin(y * 0.14) * 14 + Math.cos(y * 0.04) * 10;
    ctx.fillStyle = `rgb(${Math.round(104 + shade)}, ${Math.round(
      73 + shade * 0.7
    )}, ${Math.round(50 + shade * 0.5)})`;
    ctx.fillRect(0, y, 512, 2.5);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createRuledPageTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#f8f4ea";
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = "rgba(148, 163, 184, 0.45)";
  ctx.lineWidth = 1;
  for (let y = 26; y < 238; y += 16) {
    ctx.beginPath();
    ctx.moveTo(20, y);
    ctx.lineTo(236, y);
    ctx.stroke();
  }
  // Margin rule
  ctx.strokeStyle = "rgba(29, 78, 216, 0.3)";
  ctx.beginPath();
  ctx.moveTo(42, 16);
  ctx.lineTo(42, 240);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 60);
  grad.addColorStop(0, "rgba(15, 23, 42, 0.48)");
  grad.addColorStop(0.55, "rgba(15, 23, 42, 0.16)");
  grad.addColorStop(1, "rgba(15, 23, 42, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function tagInteractiveGroup(
  group: THREE.Group,
  propId: string,
  interactables: THREE.Object3D[]
) {
  group.userData.propId = propId;
  group.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.userData.propId = propId;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      interactables.push(mesh);
    }
  });
}

function addContactShadow(
  parent: THREE.Group,
  radius: number,
  shadowMaterial: THREE.MeshBasicMaterial
) {
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(radius * 2, radius * 2),
    shadowMaterial
  );
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = 0.004;
  plane.receiveShadow = false;
  plane.castShadow = false;
  parent.add(plane);
}

export function buildScenarioDiorama(
  maxAnisotropy: number
): BuiltDiorama {
  const root = new THREE.Group();
  const interactables: THREE.Object3D[] = [];
  const propGroups = new Map<string, THREE.Group>();
  const propBaseRotY = new Map<string, number>();
  const disposableTextures: THREE.Texture[] = [];

  const { map: marbleMap, roughnessMap: marbleRough } =
    createMarbleTexture(maxAnisotropy);
  const woodMap = createWoodTexture(maxAnisotropy);
  const pageMap = createRuledPageTexture(maxAnisotropy);
  const contactTex = createContactShadowTexture();
  disposableTextures.push(marbleMap, marbleRough, woodMap, pageMap, contactTex);

  const contactShadowMat = new THREE.MeshBasicMaterial({
    map: contactTex,
    transparent: true,
    depthWrite: false,
    opacity: 0.72,
  });

  // Shared PBR material palette (distinct roughness/metalness contrast between adjacent materials)
  const porcelainMat = new THREE.MeshPhysicalMaterial({
    color: 0xf8fafc,
    roughness: 0.24,
    metalness: 0.02,
    clearcoat: 0.65,
    clearcoatRoughness: 0.18,
  });
  const cobaltGlazeMat = new THREE.MeshPhysicalMaterial({
    color: 0x1d4ed8,
    roughness: 0.22,
    metalness: 0.05,
    clearcoat: 0.75,
    clearcoatRoughness: 0.15,
  });
  const brushedBrassMat = new THREE.MeshStandardMaterial({
    color: 0xc99c4c,
    roughness: 0.26,
    metalness: 0.9,
  });
  const brushedSteelMat = new THREE.MeshStandardMaterial({
    color: 0xdbe2ea,
    roughness: 0.2,
    metalness: 0.94,
  });
  const darkWalnutMat = new THREE.MeshStandardMaterial({
    map: woodMap,
    roughness: 0.78,
    metalness: 0.02,
  });
  const matteIronMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.68,
    metalness: 0.45,
  });
  const cremaMat = new THREE.MeshStandardMaterial({
    color: 0x4b2b18,
    roughness: 0.18,
    metalness: 0.04,
  });
  const pastryMat = new THREE.MeshStandardMaterial({
    color: 0xc9833a,
    roughness: 0.82,
    metalness: 0.0,
  });
  const linenMat = new THREE.MeshStandardMaterial({
    color: 0xdce4ee,
    roughness: 0.9,
    metalness: 0.0,
  });
  const coverBlueMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a5f,
    roughness: 0.76,
    metalness: 0.04,
  });
  const pageMat = new THREE.MeshStandardMaterial({
    map: pageMap,
    roughness: 0.92,
    metalness: 0.0,
  });
  const lampBulbMaterial = new THREE.MeshStandardMaterial({
    color: 0xfff5db,
    emissive: 0xffc978,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0,
  });

  // --- Architectural Café Countertop Pedestal (Composite 3-part grounded slab) ---
  const counterGroup = new THREE.Group();

  const marbleTop = new THREE.Mesh(
    new THREE.BoxGeometry(5.6, 0.16, 3.6),
    new THREE.MeshStandardMaterial({
      map: marbleMap,
      roughnessMap: marbleRough,
      roughness: 0.34,
      metalness: 0.04,
    })
  );
  marbleTop.position.y = -0.08;
  marbleTop.receiveShadow = true;
  counterGroup.add(marbleTop);

  // Brass counter edge trim
  const brassTrim = new THREE.Mesh(
    new THREE.BoxGeometry(5.64, 0.035, 3.64),
    brushedBrassMat
  );
  brassTrim.position.y = -0.175;
  counterGroup.add(brassTrim);

  // Walnut base apron
  const walnutApron = new THREE.Mesh(
    new THREE.BoxGeometry(5.2, 0.55, 3.2),
    darkWalnutMat
  );
  walnutApron.position.y = -0.46;
  counterGroup.add(walnutApron);

  // Radial-faded studio floor disc beneath table: grounds contact shadows cleanly
  // while dissolving softly into the LightRays WebGL atmospheric backdrop
  const floorAlphaCanvas = document.createElement("canvas");
  floorAlphaCanvas.width = 256;
  floorAlphaCanvas.height = 256;
  const fctx = floorAlphaCanvas.getContext("2d")!;
  const floorGrad = fctx.createRadialGradient(128, 128, 36, 128, 128, 124);
  floorGrad.addColorStop(0, "#ffffff");
  floorGrad.addColorStop(0.52, "#d8d8d8");
  floorGrad.addColorStop(0.82, "#383838");
  floorGrad.addColorStop(1, "#000000");
  fctx.fillStyle = floorGrad;
  fctx.fillRect(0, 0, 256, 256);
  const floorAlphaMap = new THREE.CanvasTexture(floorAlphaCanvas);
  disposableTextures.push(floorAlphaMap);

  const studioFloorMaterial = new THREE.MeshStandardMaterial({
    color: 0x161a24,
    roughness: 0.88,
    metalness: 0.04,
    transparent: true,
    opacity: 0.92,
    alphaMap: floorAlphaMap,
    depthWrite: false,
  });

  const studioFloor = new THREE.Mesh(
    new THREE.CircleGeometry(10.5, 64),
    studioFloorMaterial
  );
  studioFloor.rotation.x = -Math.PI / 2;
  studioFloor.position.y = -0.74;
  studioFloor.receiveShadow = true;
  counterGroup.add(studioFloor);

  root.add(counterGroup);

  // --- 1. Espresso Cup & Saucer (6 composite parts) ---
  const espressoGroup = new THREE.Group();
  const espressoSpec = SPATIAL_PROPS.find((p) => p.id === "espresso")!;
  espressoGroup.position.set(...espressoSpec.position);
  addContactShadow(espressoGroup, 0.44, contactShadowMat);

  // Lathe saucer
  const saucerPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.24, 0.0),
    new THREE.Vector2(0.36, 0.045),
    new THREE.Vector2(0.37, 0.058),
    new THREE.Vector2(0.22, 0.022),
    new THREE.Vector2(0.0, 0.022),
  ];
  const saucer = new THREE.Mesh(
    new THREE.LatheGeometry(saucerPts, 36),
    porcelainMat
  );
  espressoGroup.add(saucer);

  // Cobalt accent rim ring on saucer
  const saucerRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.355, 0.008, 10, 40),
    cobaltGlazeMat
  );
  saucerRim.rotation.x = Math.PI / 2;
  saucerRim.position.y = 0.055;
  espressoGroup.add(saucerRim);

  // Lathe espresso cup body
  const cupPts = [
    new THREE.Vector2(0.0, 0.024),
    new THREE.Vector2(0.145, 0.024),
    new THREE.Vector2(0.195, 0.14),
    new THREE.Vector2(0.22, 0.32),
    new THREE.Vector2(0.202, 0.325),
    new THREE.Vector2(0.178, 0.14),
    new THREE.Vector2(0.13, 0.045),
    new THREE.Vector2(0.0, 0.045),
  ];
  const cupBody = new THREE.Mesh(
    new THREE.LatheGeometry(cupPts, 36),
    porcelainMat
  );
  espressoGroup.add(cupBody);

  // Espresso crema surface
  const crema = new THREE.Mesh(
    new THREE.CircleGeometry(0.19, 32),
    cremaMat
  );
  crema.rotation.x = -Math.PI / 2;
  crema.position.y = 0.275;
  espressoGroup.add(crema);

  // Curved TubeGeometry handle
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.2, 0.27, 0),
    new THREE.Vector3(0.31, 0.25, 0),
    new THREE.Vector3(0.3, 0.14, 0),
    new THREE.Vector3(0.175, 0.1, 0),
  ]);
  const cupHandle = new THREE.Mesh(
    new THREE.TubeGeometry(handleCurve, 20, 0.022, 10, false),
    porcelainMat
  );
  espressoGroup.add(cupHandle);

  // Brushed stainless spoon resting on saucer
  const spoonGroup = new THREE.Group();
  const spoonStem = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.008, 0.022),
    brushedSteelMat
  );
  const spoonBowl = new THREE.Mesh(
    new THREE.SphereGeometry(0.042, 16, 12),
    brushedSteelMat
  );
  spoonBowl.scale.set(1.3, 0.26, 0.8);
  spoonBowl.position.set(0.19, 0.002, 0);
  spoonGroup.add(spoonStem, spoonBowl);
  spoonGroup.position.set(0.02, 0.056, 0.27);
  spoonGroup.rotation.y = -0.35;
  espressoGroup.add(spoonGroup);

  tagInteractiveGroup(espressoGroup, "espresso", interactables);
  propGroups.set("espresso", espressoGroup);
  root.add(espressoGroup);

  // --- 2. Artisan Brass Pour-Over Kettle (6 composite parts) ---
  const kettleGroup = new THREE.Group();
  const kettleSpec = SPATIAL_PROPS.find((p) => p.id === "kettle")!;
  kettleGroup.position.set(...kettleSpec.position);
  addContactShadow(kettleGroup, 0.56, contactShadowMat);

  const kettlePts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.41, 0.0),
    new THREE.Vector2(0.43, 0.04),
    new THREE.Vector2(0.37, 0.42),
    new THREE.Vector2(0.3, 0.68),
    new THREE.Vector2(0.28, 0.72),
    new THREE.Vector2(0.0, 0.72),
  ];
  const kettleBody = new THREE.Mesh(
    new THREE.LatheGeometry(kettlePts, 40),
    brushedBrassMat
  );
  kettleGroup.add(kettleBody);

  // Base matte iron induction collar
  const kettleCollar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.415, 0.42, 0.045, 36),
    matteIronMat
  );
  kettleCollar.position.y = 0.022;
  kettleGroup.add(kettleCollar);

  // Stepped lid
  const kettleLid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.295, 0.05, 36),
    brushedBrassMat
  );
  kettleLid.position.y = 0.74;
  kettleGroup.add(kettleLid);

  // Walnut lid knob
  const knobStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.028, 0.06, 16),
    brushedSteelMat
  );
  knobStem.position.y = 0.79;
  const knobTop = new THREE.Mesh(
    new THREE.SphereGeometry(0.068, 20, 16),
    darkWalnutMat
  );
  knobTop.scale.set(1, 0.72, 1);
  knobTop.position.y = 0.84;
  kettleGroup.add(knobStem, knobTop);

  // Gooseneck spout (TubeGeometry)
  const spoutCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.36, 0.14, 0),
    new THREE.Vector3(-0.56, 0.22, 0),
    new THREE.Vector3(-0.62, 0.56, 0),
    new THREE.Vector3(-0.74, 0.72, 0),
  ]);
  const spout = new THREE.Mesh(
    new THREE.TubeGeometry(spoutCurve, 28, 0.036, 12, false),
    brushedBrassMat
  );
  kettleGroup.add(spout);

  // Walnut ergonomic handle (TubeGeometry)
  const kettleHandleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.3, 0.62, 0),
    new THREE.Vector3(0.55, 0.58, 0),
    new THREE.Vector3(0.58, 0.34, 0),
    new THREE.Vector3(0.41, 0.16, 0),
  ]);
  const kettleHandle = new THREE.Mesh(
    new THREE.TubeGeometry(kettleHandleCurve, 24, 0.034, 12, false),
    darkWalnutMat
  );
  kettleGroup.add(kettleHandle);

  tagInteractiveGroup(kettleGroup, "kettle", interactables);
  propGroups.set("kettle", kettleGroup);
  root.add(kettleGroup);

  // --- 3. Pastry Plate & Croissant (6 composite parts) ---
  const croissantGroup = new THREE.Group();
  const croissantSpec = SPATIAL_PROPS.find((p) => p.id === "croissant")!;
  croissantGroup.position.set(...croissantSpec.position);
  addContactShadow(croissantGroup, 0.55, contactShadowMat);

  // Folded linen napkin beneath plate
  const napkin = new THREE.Mesh(
    new THREE.BoxGeometry(0.92, 0.018, 0.74),
    linenMat
  );
  napkin.position.set(0.06, 0.009, 0.02);
  napkin.rotation.y = 0.18;
  croissantGroup.add(napkin);

  // Ceramic pastry plate
  const platePts = [
    new THREE.Vector2(0.0, 0.018),
    new THREE.Vector2(0.32, 0.018),
    new THREE.Vector2(0.48, 0.065),
    new THREE.Vector2(0.49, 0.075),
    new THREE.Vector2(0.3, 0.034),
    new THREE.Vector2(0.0, 0.034),
  ];
  const plate = new THREE.Mesh(
    new THREE.LatheGeometry(platePts, 40),
    porcelainMat
  );
  croissantGroup.add(plate);

  // Segmented layered croissant silhouette (5 tapered crescent lobes)
  const pastryGroup = new THREE.Group();
  pastryGroup.position.y = 0.11;
  pastryGroup.rotation.y = -0.35;
  const lobeSpecs = [
    { x: -0.22, z: 0.08, r: 0.055, sx: 1.0, ry: 0.55 },
    { x: -0.12, z: 0.02, r: 0.082, sx: 1.15, ry: 0.25 },
    { x: 0.0, z: -0.01, r: 0.102, sx: 1.25, ry: 0.0 },
    { x: 0.12, z: 0.02, r: 0.082, sx: 1.15, ry: -0.25 },
    { x: 0.22, z: 0.08, r: 0.055, sx: 1.0, ry: -0.55 },
  ];
  for (const lobe of lobeSpecs) {
    const seg = new THREE.Mesh(
      new THREE.SphereGeometry(lobe.r, 18, 14),
      pastryMat
    );
    seg.scale.set(lobe.sx, 0.78, 0.95);
    seg.position.set(lobe.x, 0, lobe.z);
    seg.rotation.y = lobe.ry;
    pastryGroup.add(seg);
  }
  croissantGroup.add(pastryGroup);

  tagInteractiveGroup(croissantGroup, "croissant", interactables);
  propGroups.set("croissant", croissantGroup);
  root.add(croissantGroup);

  // --- 4. Hardcover Travel Phrasebook & Brass Fountain Pen (6 composite parts) ---
  const notebookGroup = new THREE.Group();
  const notebookSpec = SPATIAL_PROPS.find((p) => p.id === "notebook")!;
  notebookGroup.position.set(...notebookSpec.position);
  notebookGroup.rotation.y = 0.14;
  addContactShadow(notebookGroup, 0.62, contactShadowMat);

  // Beveled ExtrudeGeometry book cover
  const coverShape = new THREE.Shape();
  const bw = 0.86;
  const bd = 0.62;
  coverShape.moveTo(-bw / 2, -bd / 2);
  coverShape.lineTo(bw / 2, -bd / 2);
  coverShape.lineTo(bw / 2, bd / 2);
  coverShape.lineTo(-bw / 2, bd / 2);
  coverShape.closePath();

  const coverGeo = new THREE.ExtrudeGeometry(coverShape, {
    depth: 0.026,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: 2,
  });
  coverGeo.rotateX(-Math.PI / 2);
  const bookCover = new THREE.Mesh(coverGeo, coverBlueMat);
  bookCover.position.y = 0.008;
  notebookGroup.add(bookCover);

  // Ruled open page stack resting on cover
  const pageBlock = new THREE.Mesh(
    new THREE.BoxGeometry(0.81, 0.042, 0.57),
    pageMat
  );
  pageBlock.position.y = 0.056;
  notebookGroup.add(pageBlock);

  // Ribbon bookmark
  const ribbon = new THREE.Mesh(
    new THREE.BoxGeometry(0.028, 0.006, 0.66),
    cobaltGlazeMat
  );
  ribbon.position.set(0.02, 0.079, 0.05);
  notebookGroup.add(ribbon);

  // Fountain pen (barrel + brass cap band + tapered nib)
  const penGroup = new THREE.Group();
  penGroup.position.set(0.24, 0.1, 0.04);
  penGroup.rotation.y = 0.42;
  const penBarrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.018, 0.52, 16),
    matteIronMat
  );
  penBarrel.rotation.z = Math.PI / 2;
  const penBand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.045, 16),
    brushedBrassMat
  );
  penBand.rotation.z = Math.PI / 2;
  penBand.position.x = 0.08;
  const penNib = new THREE.Mesh(
    new THREE.ConeGeometry(0.018, 0.085, 12),
    brushedBrassMat
  );
  penNib.rotation.z = -Math.PI / 2;
  penNib.position.x = 0.3;
  penGroup.add(penBarrel, penBand, penNib);
  notebookGroup.add(penGroup);

  tagInteractiveGroup(notebookGroup, "notebook", interactables);
  propGroups.set("notebook", notebookGroup);
  root.add(notebookGroup);

  // --- 5. Brass Café Reading Lamp (5 composite parts) ---
  const lampGroup = new THREE.Group();
  const lampSpec = SPATIAL_PROPS.find((p) => p.id === "lamp")!;
  lampGroup.position.set(...lampSpec.position);
  addContactShadow(lampGroup, 0.42, contactShadowMat);

  // Weighted cast-iron stepped base
  const basePts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.32, 0.0),
    new THREE.Vector2(0.3, 0.045),
    new THREE.Vector2(0.22, 0.085),
    new THREE.Vector2(0.06, 0.11),
    new THREE.Vector2(0.0, 0.11),
  ];
  const lampBase = new THREE.Mesh(
    new THREE.LatheGeometry(basePts, 32),
    matteIronMat
  );
  lampGroup.add(lampBase);

  // Curved brass gooseneck arm
  const armCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.1, 0),
    new THREE.Vector3(0.06, 0.68, -0.05),
    new THREE.Vector3(-0.08, 1.24, 0.06),
    new THREE.Vector3(-0.34, 1.32, 0.22),
  ]);
  const lampArm = new THREE.Mesh(
    new THREE.TubeGeometry(armCurve, 28, 0.022, 12, false),
    brushedBrassMat
  );
  lampGroup.add(lampArm);

  // Lathe domed brass shade
  const shadePts = [
    new THREE.Vector2(0.05, 0.24),
    new THREE.Vector2(0.18, 0.2),
    new THREE.Vector2(0.32, 0.04),
    new THREE.Vector2(0.34, 0.0),
    new THREE.Vector2(0.31, 0.0),
    new THREE.Vector2(0.16, 0.18),
    new THREE.Vector2(0.04, 0.22),
  ];
  const lampShade = new THREE.Mesh(
    new THREE.LatheGeometry(shadePts, 32),
    brushedBrassMat
  );
  lampShade.position.set(-0.38, 1.07, 0.25);
  lampShade.rotation.z = 0.22;
  lampGroup.add(lampShade);

  // Warm filament bulb inside shade
  const lampBulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 16, 14),
    lampBulbMaterial
  );
  lampBulb.position.set(-0.36, 1.13, 0.24);
  lampGroup.add(lampBulb);

  // Top finial cap
  const finial = new THREE.Mesh(
    new THREE.SphereGeometry(0.036, 16, 12),
    matteIronMat
  );
  finial.position.set(-0.42, 1.33, 0.26);
  lampGroup.add(finial);

  tagInteractiveGroup(lampGroup, "lamp", interactables);
  propGroups.set("lamp", lampGroup);
  root.add(lampGroup);

  // --- Center-Back Live Acoustic Resonance Totem (reacts to live voice energy) ---
  const totemGroup = new THREE.Group();
  totemGroup.position.set(-1.35, 0, -0.82);
  addContactShadow(totemGroup, 0.36, contactShadowMat);

  const totemPedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.28, 0.1, 32),
    matteIronMat
  );
  totemPedestal.position.y = 0.05;
  totemPedestal.castShadow = true;
  totemPedestal.receiveShadow = true;
  totemGroup.add(totemPedestal);

  const totemStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.032, 0.32, 16),
    brushedBrassMat
  );
  totemStem.position.y = 0.24;
  totemGroup.add(totemStem);

  const outerRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.3, 0.018, 14, 48),
    brushedBrassMat
  );
  outerRing.position.y = 0.68;
  outerRing.castShadow = true;

  const midRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.255, 0.011, 12, 44),
    new THREE.MeshStandardMaterial({
      color: 0xd64d2a,
      roughness: 0.25,
      metalness: 0.72,
    })
  );
  midRing.position.y = 0.68;
  midRing.castShadow = true;

  const innerRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.19, 0.015, 14, 40),
    cobaltGlazeMat
  );
  innerRing.position.y = 0.68;
  innerRing.castShadow = true;

  const coreSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.088, 24, 20),
    brushedSteelMat
  );
  coreSphere.position.y = 0.68;
  coreSphere.castShadow = true;

  totemGroup.add(outerRing, midRing, innerRing, coreSphere);
  root.add(totemGroup);

  const resonanceRings = [outerRing, innerRing, coreSphere, midRing];

  // Record base Y rotation of each interactive prop for smooth showcase oscillation
  for (const [id, group] of propGroups.entries()) {
    propBaseRotY.set(id, group.rotation.y);
  }

  // --- Animated 3D Orbital Selection Beacon Ring (glides beneath focused prop) ---
  const selectionBeacon = new THREE.Group();
  selectionBeacon.position.set(
    espressoSpec.position[0],
    0.012,
    espressoSpec.position[2]
  );

  const beaconOuterMat = new THREE.MeshStandardMaterial({
    color: 0xc99c4c,
    emissive: 0xc99c4c,
    emissiveIntensity: 0.35,
    roughness: 0.25,
    metalness: 0.85,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const beaconOuterRing = new THREE.Mesh(
    new THREE.RingGeometry(0.46, 0.495, 48),
    beaconOuterMat
  );
  beaconOuterRing.rotation.x = -Math.PI / 2;

  const beaconInnerMat = new THREE.MeshBasicMaterial({
    color: 0x1b5e4b,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const beaconInnerRing = new THREE.Mesh(
    new THREE.RingGeometry(0.39, 0.415, 36, 1, 0, Math.PI * 1.45),
    beaconInnerMat
  );
  beaconInnerRing.rotation.x = -Math.PI / 2;
  beaconInnerRing.position.y = 0.002;

  // Four subtle architectural compass ticks around the outer beacon (local XY lies on tabletop XZ)
  const tickGeo = new THREE.BoxGeometry(0.075, 0.016, 0.006);
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const tick = new THREE.Mesh(tickGeo, beaconOuterMat);
    tick.position.set(Math.cos(angle) * 0.535, Math.sin(angle) * 0.535, 0.003);
    tick.rotation.z = angle;
    beaconOuterRing.add(tick);
  }

  selectionBeacon.add(beaconOuterRing, beaconInnerRing);
  root.add(selectionBeacon);

  // --- Organic 3D Rising Steam Wisps above Espresso Cup & Kettle Spout ---
  const steamGeo = new THREE.SphereGeometry(0.055, 10, 8);
  const steamPuffs: SteamPuff[] = [];
  const espressoSteamOrigin: [number, number, number] = [
    espressoSpec.position[0],
    espressoSpec.position[1] + 0.31,
    espressoSpec.position[2],
  ];
  const kettleSteamOrigin: [number, number, number] = [
    kettleSpec.position[0] - 0.72,
    kettleSpec.position[1] + 0.74,
    kettleSpec.position[2],
  ];

  for (let i = 0; i < 7; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(steamGeo, mat);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    root.add(mesh);
    steamPuffs.push({
      mesh,
      material: mat,
      origin: espressoSteamOrigin,
      phase: i / 7,
      speed: 0.24 + (i % 3) * 0.03,
      driftRadius: 0.055 + (i % 2) * 0.02,
      maxHeight: 0.62,
    });
  }

  for (let i = 0; i < 5; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: 0xfff8eb,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(steamGeo, mat);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    root.add(mesh);
    steamPuffs.push({
      mesh,
      material: mat,
      origin: kettleSteamOrigin,
      phase: i / 5,
      speed: 0.28 + (i % 2) * 0.04,
      driftRadius: 0.045,
      maxHeight: 0.48,
    });
  }

  // --- Floating Warm Café Sun-Motes (InstancedMesh, frustumCulled = false) ---
  const moteCount = 36;
  const moteGeo = new THREE.SphereGeometry(0.016, 8, 6);
  const moteMat = new THREE.MeshBasicMaterial({
    color: 0xffefc9,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const dustMotes = new THREE.InstancedMesh(moteGeo, moteMat, moteCount);
  dustMotes.frustumCulled = false;
  dustMotes.castShadow = false;
  dustMotes.receiveShadow = false;

  const dustMoteSpecs: DustMoteSpec[] = [];
  const initDummy = new THREE.Object3D();
  for (let i = 0; i < moteCount; i++) {
    // Deterministic golden-ratio distribution across the café tabletop volume
    const t = (i + 0.5) / moteCount;
    const angle = i * 2.399963;
    const r = 0.55 + Math.sqrt(t) * 1.95;
    const spec: DustMoteSpec = {
      baseX: Math.cos(angle) * r,
      baseY: 0.28 + ((i * 37) % 100) * 0.014,
      baseZ: Math.sin(angle) * (r * 0.72),
      phase: i * 0.85,
      speed: 0.35 + (i % 5) * 0.11,
      radius: 0.08 + (i % 4) * 0.035,
      scale: 0.65 + (i % 4) * 0.26,
    };
    dustMoteSpecs.push(spec);
    initDummy.position.set(spec.baseX, spec.baseY, spec.baseZ);
    initDummy.scale.setScalar(spec.scale);
    initDummy.updateMatrix();
    dustMotes.setMatrixAt(i, initDummy.matrix);
  }
  dustMotes.instanceMatrix.needsUpdate = true;
  root.add(dustMotes);

  const dispose = () => {
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    root.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        geometries.add(mesh.geometry);
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => materials.add(m));
        } else {
          materials.add(mesh.material);
        }
      }
    });
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    disposableTextures.forEach((t) => t.dispose());
  };

  return {
    root,
    interactables,
    propGroups,
    propBaseRotY,
    resonanceRings,
    lampBulbMaterial,
    studioFloorMaterial,
    selectionBeacon,
    beaconOuterRing,
    beaconInnerRing,
    steamPuffs,
    dustMotes,
    dustMoteSpecs,
    dispose,
  };
}
