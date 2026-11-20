import * as THREE from "three";
import { SpatialRoomId } from "../types";
import {
  buildScenarioDiorama,
  BuiltDiorama,
  DustMoteSpec,
  SteamPuff,
} from "./buildScenarioDiorama";
import { PARIS_BOOKSHOP_PROPS, TOKYO_COUNTER_PROPS } from "./dioramaCatalog";

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 60);
  grad.addColorStop(0, "rgba(15, 23, 42, 0.5)");
  grad.addColorStop(0.55, "rgba(15, 23, 42, 0.17)");
  grad.addColorStop(1, "rgba(15, 23, 42, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createFloorAlphaTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(128, 128, 36, 128, 128, 124);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(0.52, "#d8d8d8");
  grad.addColorStop(0.82, "#383838");
  grad.addColorStop(1, "#000000");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(canvas);
}

function createHinokiWoodTexture(maxAnisotropy: number): {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#d9b68c";
  ctx.fillRect(0, 0, 512, 512);

  for (let y = 0; y < 512; y += 2) {
    const grain =
      Math.sin(y * 0.09) * 10 + Math.cos(y * 0.03) * 7 + ((y * 17) % 5);
    ctx.fillStyle = `rgb(${Math.round(212 + grain)}, ${Math.round(
      174 + grain * 0.85
    )}, ${Math.round(129 + grain * 0.65)})`;
    ctx.fillRect(0, y, 512, 2);
  }

  // Subtle plank join lines
  ctx.strokeStyle = "rgba(120, 82, 46, 0.25)";
  ctx.lineWidth = 2;
  for (const y of [128, 256, 384]) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(2, 1.5);
  map.anisotropy = maxAnisotropy;

  const rCanvas = document.createElement("canvas");
  rCanvas.width = 256;
  rCanvas.height = 256;
  const rctx = rCanvas.getContext("2d")!;
  rctx.fillStyle = "#8a8a8a";
  rctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 4) {
    rctx.fillStyle =
      y % 8 === 0 ? "rgba(170,170,170,0.22)" : "rgba(105,105,105,0.22)";
    rctx.fillRect(0, y, 256, 3);
  }
  const roughnessMap = new THREE.CanvasTexture(rCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(2, 1.5);
  return { map, roughnessMap };
}

function createSpecialsPlaqueTexture(
  maxAnisotropy: number
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#e7cfa7";
  ctx.fillRect(0, 0, 512, 256);

  // Subtle hinoki streaks
  for (let y = 0; y < 256; y += 3) {
    ctx.fillStyle =
      y % 6 === 0 ? "rgba(164, 122, 74, 0.08)" : "rgba(255, 248, 232, 0.14)";
    ctx.fillRect(0, y, 512, 2);
  }

  // Border frame
  ctx.strokeStyle = "#5c3e24";
  ctx.lineWidth = 6;
  ctx.strokeRect(14, 14, 484, 228);

  // Vermilion seal stamp
  ctx.fillStyle = "#b93829";
  ctx.fillRect(42, 42, 34, 34);
  ctx.fillStyle = "#f9edd4";
  ctx.font = "bold 18px serif";
  ctx.fillText("旬", 50, 66);

  // Editorial menu calligraphy lines
  ctx.fillStyle = "#1f1a17";
  ctx.font = "bold 30px serif";
  ctx.fillText("本日のおすすめ", 96, 70);

  ctx.font = "600 22px serif";
  ctx.fillText("特製醤油ラーメン   ¥1,180", 54, 128);
  ctx.fillText("炙り帆立と柚子      ¥760", 54, 168);
  ctx.fillText("純米吟醸 冷や        ¥820", 54, 208);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createWalnutParquetTexture(maxAnisotropy: number): {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#553927";
  ctx.fillRect(0, 0, 512, 512);

  for (let y = 0; y < 512; y += 3) {
    const shade = Math.sin(y * 0.11) * 11 + Math.cos(y * 0.04) * 8;
    ctx.fillStyle = `rgb(${Math.round(86 + shade)}, ${Math.round(
      58 + shade * 0.72
    )}, ${Math.round(40 + shade * 0.52)})`;
    ctx.fillRect(0, y, 512, 2.5);
  }
  ctx.strokeStyle = "rgba(32, 18, 11, 0.32)";
  ctx.lineWidth = 2;
  for (let x = 0; x < 512; x += 128) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(2, 1.5);
  map.anisotropy = maxAnisotropy;

  const rCanvas = document.createElement("canvas");
  rCanvas.width = 256;
  rCanvas.height = 256;
  const rctx = rCanvas.getContext("2d")!;
  rctx.fillStyle = "#7a7a7a";
  rctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 24; i++) {
    rctx.fillStyle = "rgba(130, 130, 130, 0.22)";
    rctx.fillRect(0, i * 11, 256, 4);
  }
  const roughnessMap = new THREE.CanvasTexture(rCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  return { map, roughnessMap };
}

function createStaffPickCardTexture(
  maxAnisotropy: number
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 384;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#f7f1e3";
  ctx.fillRect(0, 0, 384, 512);

  // Double Parisian bookshop border
  ctx.strokeStyle = "#1f4d3f";
  ctx.lineWidth = 6;
  ctx.strokeRect(18, 18, 348, 476);
  ctx.strokeStyle = "#c2974e";
  ctx.lineWidth = 2;
  ctx.strokeRect(28, 28, 328, 456);

  ctx.fillStyle = "#1f4d3f";
  ctx.font = "bold 24px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("COUP DE CŒUR", 192, 92);

  ctx.fillStyle = "#8a6d3b";
  ctx.font = "italic 18px Georgia, serif";
  ctx.fillText("Librairie Rive Gauche", 192, 128);

  // Divider
  ctx.strokeStyle = "#c2974e";
  ctx.beginPath();
  ctx.moveTo(96, 152);
  ctx.lineTo(288, 152);
  ctx.stroke();

  // Handwritten-style note lines
  ctx.fillStyle = "#262320";
  ctx.font = "italic 21px Georgia, serif";
  ctx.fillText("« Une flânerie lumineuse", 192, 214);
  ctx.fillText("entre les quais de Seine", 192, 250);
  ctx.fillText("et les cafés d’automne. »", 192, 286);

  ctx.fillStyle = "#1f4d3f";
  ctx.font = "bold 17px Georgia, serif";
  ctx.fillText("— Camille, libraire", 192, 366);

  ctx.fillStyle = "#6b6258";
  ctx.font = "15px monospace";
  ctx.fillText("EDITION BROCHÉE · 18,50 €", 192, 434);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
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

function buildSharedBeaconAndTotem(params: {
  root: THREE.Group;
  contactShadowMat: THREE.MeshBasicMaterial;
  initialPos: [number, number, number];
  totemPos: [number, number, number];
  outerColor: number;
  midColor: number;
  innerColor: number;
  beaconOuterColor: number;
  beaconInnerColor: number;
}) {
  const {
    root,
    contactShadowMat,
    initialPos,
    totemPos,
    outerColor,
    midColor,
    innerColor,
    beaconOuterColor,
    beaconInnerColor,
  } = params;

  const matteBaseMat = new THREE.MeshStandardMaterial({
    color: 0x1d2430,
    roughness: 0.72,
    metalness: 0.42,
  });
  const outerMat = new THREE.MeshStandardMaterial({
    color: outerColor,
    roughness: 0.25,
    metalness: 0.88,
  });
  const midMat = new THREE.MeshStandardMaterial({
    color: midColor,
    roughness: 0.28,
    metalness: 0.72,
  });
  const innerMat = new THREE.MeshPhysicalMaterial({
    color: innerColor,
    roughness: 0.22,
    metalness: 0.12,
    clearcoat: 0.7,
  });
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.18,
    metalness: 0.94,
  });

  const totemGroup = new THREE.Group();
  totemGroup.position.set(...totemPos);
  addContactShadow(totemGroup, 0.36, contactShadowMat);

  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.28, 0.1, 32),
    matteBaseMat
  );
  pedestal.position.y = 0.05;
  pedestal.castShadow = true;
  pedestal.receiveShadow = true;

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.032, 0.32, 16),
    outerMat
  );
  stem.position.y = 0.24;

  const outerRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.3, 0.017, 14, 48),
    outerMat
  );
  outerRing.position.y = 0.68;
  outerRing.castShadow = true;

  const midRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.25, 0.011, 12, 44),
    midMat
  );
  midRing.position.y = 0.68;
  midRing.castShadow = true;

  const innerRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.185, 0.014, 14, 40),
    innerMat
  );
  innerRing.position.y = 0.68;
  innerRing.castShadow = true;

  const coreSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.086, 24, 20),
    coreMat
  );
  coreSphere.position.y = 0.68;
  coreSphere.castShadow = true;

  totemGroup.add(pedestal, stem, outerRing, midRing, innerRing, coreSphere);
  root.add(totemGroup);

  const selectionBeacon = new THREE.Group();
  selectionBeacon.position.set(initialPos[0], 0.012, initialPos[2]);

  const beaconOuterMat = new THREE.MeshStandardMaterial({
    color: beaconOuterColor,
    emissive: beaconOuterColor,
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
    color: beaconInnerColor,
    transparent: true,
    opacity: 0.58,
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

  return {
    resonanceRings: [outerRing, innerRing, coreSphere, midRing],
    selectionBeacon,
    beaconOuterRing,
    beaconInnerRing,
  };
}

function buildDustMotes(
  root: THREE.Group,
  colorHex: number
): { dustMotes: THREE.InstancedMesh; dustMoteSpecs: DustMoteSpec[] } {
  const moteCount = 34;
  const moteGeo = new THREE.SphereGeometry(0.016, 8, 6);
  const moteMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.52,
    depthWrite: false,
  });
  const dustMotes = new THREE.InstancedMesh(moteGeo, moteMat, moteCount);
  dustMotes.frustumCulled = false;
  dustMotes.castShadow = false;
  dustMotes.receiveShadow = false;

  const dustMoteSpecs: DustMoteSpec[] = [];
  const initDummy = new THREE.Object3D();
  for (let i = 0; i < moteCount; i++) {
    const t = (i + 0.5) / moteCount;
    const angle = i * 2.399963;
    const r = 0.55 + Math.sqrt(t) * 1.9;
    const spec: DustMoteSpec = {
      baseX: Math.cos(angle) * r,
      baseY: 0.28 + ((i * 41) % 100) * 0.013,
      baseZ: Math.sin(angle) * (r * 0.7),
      phase: i * 0.82,
      speed: 0.34 + (i % 5) * 0.1,
      radius: 0.08 + (i % 4) * 0.032,
      scale: 0.65 + (i % 4) * 0.24,
    };
    dustMoteSpecs.push(spec);
    initDummy.position.set(spec.baseX, spec.baseY, spec.baseZ);
    initDummy.scale.setScalar(spec.scale);
    initDummy.updateMatrix();
    dustMotes.setMatrixAt(i, initDummy.matrix);
  }
  dustMotes.instanceMatrix.needsUpdate = true;
  root.add(dustMotes);
  return { dustMotes, dustMoteSpecs };
}

function createDisposeHelper(
  root: THREE.Group,
  disposableTextures: THREE.Texture[]
) {
  return () => {
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
}

/**
 * Room 2: Shimokitazawa Hinoki Counter (Tokyo)
 */
export function buildTokyoCounterDiorama(maxAnisotropy: number): BuiltDiorama {
  const root = new THREE.Group();
  const interactables: THREE.Object3D[] = [];
  const propGroups = new Map<string, THREE.Group>();
  const propBaseRotY = new Map<string, number>();
  const disposableTextures: THREE.Texture[] = [];

  const { map: hinokiMap, roughnessMap: hinokiRough } =
    createHinokiWoodTexture(maxAnisotropy);
  const plaqueMap = createSpecialsPlaqueTexture(maxAnisotropy);
  const contactTex = createContactShadowTexture();
  const floorAlphaMap = createFloorAlphaTexture();
  disposableTextures.push(
    hinokiMap,
    hinokiRough,
    plaqueMap,
    contactTex,
    floorAlphaMap
  );

  const contactShadowMat = new THREE.MeshBasicMaterial({
    map: contactTex,
    transparent: true,
    depthWrite: false,
    opacity: 0.72,
  });

  // Shared materials with clear roughness/metalness contrast
  const hinokiMat = new THREE.MeshStandardMaterial({
    map: hinokiMap,
    roughnessMap: hinokiRough,
    roughness: 0.56,
    metalness: 0.02,
  });
  const cedarDarkMat = new THREE.MeshStandardMaterial({
    color: 0x3b2920,
    roughness: 0.78,
    metalness: 0.02,
  });
  const indigoCeramicMat = new THREE.MeshPhysicalMaterial({
    color: 0x1e3554,
    roughness: 0.22,
    metalness: 0.06,
    clearcoat: 0.72,
    clearcoatRoughness: 0.16,
  });
  const stonewareMat = new THREE.MeshStandardMaterial({
    color: 0xd9d2c5,
    roughness: 0.62,
    metalness: 0.02,
  });
  const castIronMat = new THREE.MeshStandardMaterial({
    color: 0x22252a,
    roughness: 0.74,
    metalness: 0.55,
  });
  const lacquerRedMat = new THREE.MeshPhysicalMaterial({
    color: 0xb93829,
    roughness: 0.18,
    metalness: 0.04,
    clearcoat: 0.85,
    clearcoatRoughness: 0.12,
  });
  const bambooMat = new THREE.MeshStandardMaterial({
    color: 0xc9a86c,
    roughness: 0.52,
    metalness: 0.02,
  });
  const brothMat = new THREE.MeshPhysicalMaterial({
    color: 0x7c4a1f,
    roughness: 0.12,
    metalness: 0.02,
    clearcoat: 0.9,
  });
  const washiMat = new THREE.MeshStandardMaterial({
    color: 0xfff0d4,
    emissive: 0xffa852,
    emissiveIntensity: 1.45,
    roughness: 0.85,
    metalness: 0.0,
  });

  // --- Hinoki Countertop & Slatted Cedar Base ---
  const counterGroup = new THREE.Group();
  const counterSlab = new THREE.Mesh(
    new THREE.BoxGeometry(5.6, 0.18, 3.5),
    hinokiMat
  );
  counterSlab.position.y = -0.09;
  counterSlab.receiveShadow = true;
  counterGroup.add(counterSlab);

  const counterTrim = new THREE.Mesh(
    new THREE.BoxGeometry(5.64, 0.04, 3.54),
    cedarDarkMat
  );
  counterTrim.position.y = -0.2;
  counterGroup.add(counterTrim);

  const counterApron = new THREE.Mesh(
    new THREE.BoxGeometry(5.2, 0.52, 3.1),
    cedarDarkMat
  );
  counterApron.position.y = -0.48;
  counterGroup.add(counterApron);

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

  // --- 1. Steaming Ramen Donburi (8 composite parts) ---
  const ramenGroup = new THREE.Group();
  const ramenSpec = TOKYO_COUNTER_PROPS.find((p) => p.id === "ramen-bowl")!;
  ramenGroup.position.set(...ramenSpec.position);
  addContactShadow(ramenGroup, 0.56, contactShadowMat);

  const bowlPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.22, 0.0),
    new THREE.Vector2(0.24, 0.06),
    new THREE.Vector2(0.41, 0.24),
    new THREE.Vector2(0.46, 0.42),
    new THREE.Vector2(0.43, 0.43),
    new THREE.Vector2(0.37, 0.24),
    new THREE.Vector2(0.2, 0.07),
    new THREE.Vector2(0.0, 0.07),
  ];
  const bowl = new THREE.Mesh(
    new THREE.LatheGeometry(bowlPts, 40),
    indigoCeramicMat
  );
  ramenGroup.add(bowl);

  const bowlRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.445, 0.012, 10, 44),
    lacquerRedMat
  );
  bowlRim.rotation.x = Math.PI / 2;
  bowlRim.position.y = 0.42;
  ramenGroup.add(bowlRim);

  const broth = new THREE.Mesh(new THREE.CircleGeometry(0.4, 36), brothMat);
  broth.rotation.x = -Math.PI / 2;
  broth.position.y = 0.34;
  ramenGroup.add(broth);

  // Noodle mound
  const noodleMat = new THREE.MeshStandardMaterial({
    color: 0xe9c97b,
    roughness: 0.72,
  });
  const noodles = new THREE.Mesh(
    new THREE.TorusGeometry(0.16, 0.052, 12, 28),
    noodleMat
  );
  noodles.rotation.x = Math.PI / 2;
  noodles.position.set(-0.04, 0.34, 0.04);
  ramenGroup.add(noodles);

  // Half soft-boiled egg (white + golden yolk)
  const eggWhite = new THREE.Mesh(
    new THREE.SphereGeometry(0.085, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xfbf7ee, roughness: 0.45 })
  );
  eggWhite.scale.set(1.15, 0.4, 0.85);
  eggWhite.position.set(0.16, 0.355, -0.05);
  const eggYolk = new THREE.Mesh(
    new THREE.SphereGeometry(0.044, 14, 10),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.28 })
  );
  eggYolk.scale.set(1.0, 0.52, 1.0);
  eggYolk.position.set(0.16, 0.375, -0.05);
  ramenGroup.add(eggWhite, eggYolk);

  // Nori seaweed sheet tucked at back rim
  const nori = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.22, 0.01),
    new THREE.MeshStandardMaterial({ color: 0x16241b, roughness: 0.88 })
  );
  nori.position.set(-0.14, 0.44, -0.26);
  nori.rotation.x = -0.32;
  nori.rotation.y = 0.28;
  ramenGroup.add(nori);

  // Bamboo chopsticks resting across rim
  const chopstickGeo = new THREE.CylinderGeometry(0.01, 0.016, 0.96, 10);
  const chopstick1 = new THREE.Mesh(chopstickGeo, bambooMat);
  chopstick1.rotation.z = Math.PI / 2;
  chopstick1.rotation.y = 0.14;
  chopstick1.position.set(0.06, 0.445, 0.24);
  const chopstick2 = new THREE.Mesh(chopstickGeo, bambooMat);
  chopstick2.rotation.z = Math.PI / 2;
  chopstick2.rotation.y = 0.08;
  chopstick2.position.set(0.06, 0.445, 0.3);
  ramenGroup.add(chopstick1, chopstick2);

  tagInteractiveGroup(ramenGroup, "ramen-bowl", interactables);
  propGroups.set("ramen-bowl", ramenGroup);
  root.add(ramenGroup);

  // --- 2. Cast-Iron Tetsubin Teapot & Yunomi Cup (7 composite parts) ---
  const teaGroup = new THREE.Group();
  const teaSpec = TOKYO_COUNTER_PROPS.find((p) => p.id === "tetsubin-tea")!;
  teaGroup.position.set(...teaSpec.position);
  addContactShadow(teaGroup, 0.56, contactShadowMat);

  // Woven trivet under teapot
  const trivet = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.33, 0.025, 32),
    bambooMat
  );
  trivet.position.set(-0.12, 0.012, 0);
  teaGroup.add(trivet);

  // Cast-iron bulbous body
  const potPts = [
    new THREE.Vector2(0.0, 0.025),
    new THREE.Vector2(0.24, 0.025),
    new THREE.Vector2(0.36, 0.16),
    new THREE.Vector2(0.34, 0.34),
    new THREE.Vector2(0.21, 0.44),
    new THREE.Vector2(0.0, 0.44),
  ];
  const potBody = new THREE.Mesh(
    new THREE.LatheGeometry(potPts, 36),
    castIronMat
  );
  potBody.position.x = -0.12;
  teaGroup.add(potBody);

  // Lid + knob
  const potLid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.19, 0.035, 28),
    castIronMat
  );
  potLid.position.set(-0.12, 0.46, 0);
  const potKnob = new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 16, 12),
    castIronMat
  );
  potKnob.position.set(-0.12, 0.5, 0);
  teaGroup.add(potLid, potKnob);

  // Arched handle + spout
  const potHandleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.12, 0.38, -0.26),
    new THREE.Vector3(-0.12, 0.72, -0.18),
    new THREE.Vector3(-0.12, 0.72, 0.18),
    new THREE.Vector3(-0.12, 0.38, 0.26),
  ]);
  const potHandle = new THREE.Mesh(
    new THREE.TubeGeometry(potHandleCurve, 26, 0.02, 10, false),
    castIronMat
  );
  const potSpoutCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.42, 0.24, 0),
    new THREE.Vector3(-0.56, 0.33, 0),
    new THREE.Vector3(-0.63, 0.42, 0),
  ]);
  const potSpout = new THREE.Mesh(
    new THREE.TubeGeometry(potSpoutCurve, 18, 0.032, 10, false),
    castIronMat
  );
  teaGroup.add(potHandle, potSpout);

  // Companion ceramic yunomi teacup
  const cupPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.11, 0.0),
    new THREE.Vector2(0.145, 0.26),
    new THREE.Vector2(0.13, 0.265),
    new THREE.Vector2(0.1, 0.04),
    new THREE.Vector2(0.0, 0.04),
  ];
  const yunomi = new THREE.Mesh(
    new THREE.LatheGeometry(cupPts, 32),
    stonewareMat
  );
  yunomi.position.set(0.42, 0, 0.18);
  const teaSurface = new THREE.Mesh(
    new THREE.CircleGeometry(0.125, 24),
    new THREE.MeshStandardMaterial({ color: 0x6f7f3c, roughness: 0.18 })
  );
  teaSurface.rotation.x = -Math.PI / 2;
  teaSurface.position.set(0.42, 0.22, 0.18);
  teaGroup.add(yunomi, teaSurface);

  tagInteractiveGroup(teaGroup, "tetsubin-tea", interactables);
  propGroups.set("tetsubin-tea", teaGroup);
  root.add(teaGroup);

  // --- 3. Hinoki Specials Plaque on Stand (4 composite parts) ---
  const boardGroup = new THREE.Group();
  const boardSpec = TOKYO_COUNTER_PROPS.find((p) => p.id === "specials-board")!;
  boardGroup.position.set(...boardSpec.position);
  boardGroup.rotation.y = 0.08;
  addContactShadow(boardGroup, 0.58, contactShadowMat);

  const standBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.92, 0.05, 0.22),
    cedarDarkMat
  );
  standBase.position.y = 0.025;
  boardGroup.add(standBase);

  const plaqueFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.88, 0.48, 0.04),
    cedarDarkMat
  );
  plaqueFrame.position.set(0, 0.28, -0.02);
  plaqueFrame.rotation.x = -0.22;
  boardGroup.add(plaqueFrame);

  const plaqueFace = new THREE.Mesh(
    new THREE.PlaneGeometry(0.82, 0.42),
    new THREE.MeshStandardMaterial({ map: plaqueMap, roughness: 0.72 })
  );
  plaqueFace.position.set(0, 0.285, 0.002);
  plaqueFace.rotation.x = -0.22;
  boardGroup.add(plaqueFace);

  const brassClip = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.035, 0.05),
    new THREE.MeshStandardMaterial({
      color: 0xc99c4c,
      roughness: 0.26,
      metalness: 0.9,
    })
  );
  brassClip.position.set(0, 0.51, -0.07);
  boardGroup.add(brassClip);

  tagInteractiveGroup(boardGroup, "specials-board", interactables);
  propGroups.set("specials-board", boardGroup);
  root.add(boardGroup);

  // --- 4. Tokkuri Sake Carafe & Ochoko Cups on Tray (6 composite parts) ---
  const sakeGroup = new THREE.Group();
  const sakeSpec = TOKYO_COUNTER_PROPS.find((p) => p.id === "sake-set")!;
  sakeGroup.position.set(...sakeSpec.position);
  sakeGroup.rotation.y = -0.2;
  addContactShadow(sakeGroup, 0.52, contactShadowMat);

  const tray = new THREE.Mesh(
    new THREE.BoxGeometry(0.86, 0.032, 0.56),
    cedarDarkMat
  );
  tray.position.y = 0.016;
  sakeGroup.add(tray);

  const tokkuriPts = [
    new THREE.Vector2(0.0, 0.032),
    new THREE.Vector2(0.13, 0.032),
    new THREE.Vector2(0.18, 0.22),
    new THREE.Vector2(0.14, 0.42),
    new THREE.Vector2(0.065, 0.52),
    new THREE.Vector2(0.085, 0.62),
    new THREE.Vector2(0.072, 0.62),
    new THREE.Vector2(0.052, 0.5),
    new THREE.Vector2(0.0, 0.5),
  ];
  const tokkuri = new THREE.Mesh(
    new THREE.LatheGeometry(tokkuriPts, 32),
    stonewareMat
  );
  tokkuri.position.set(-0.18, 0, -0.02);
  sakeGroup.add(tokkuri);

  const neckBand = new THREE.Mesh(
    new THREE.TorusGeometry(0.07, 0.011, 10, 28),
    indigoCeramicMat
  );
  neckBand.rotation.x = Math.PI / 2;
  neckBand.position.set(-0.18, 0.52, -0.02);
  sakeGroup.add(neckBand);

  const ochokoPts = [
    new THREE.Vector2(0.0, 0.032),
    new THREE.Vector2(0.065, 0.032),
    new THREE.Vector2(0.105, 0.14),
    new THREE.Vector2(0.095, 0.142),
    new THREE.Vector2(0.055, 0.052),
    new THREE.Vector2(0.0, 0.052),
  ];
  const ochokoGeo = new THREE.LatheGeometry(ochokoPts, 28);
  const cup1 = new THREE.Mesh(ochokoGeo, indigoCeramicMat);
  cup1.position.set(0.18, 0, -0.09);
  const cup2 = new THREE.Mesh(ochokoGeo, lacquerRedMat);
  cup2.position.set(0.24, 0, 0.13);
  sakeGroup.add(cup1, cup2);

  tagInteractiveGroup(sakeGroup, "sake-set", interactables);
  propGroups.set("sake-set", sakeGroup);
  root.add(sakeGroup);

  // --- 5. Washi Chōchin Counter Lantern (7 composite parts) ---
  const lanternGroup = new THREE.Group();
  const lanternSpec = TOKYO_COUNTER_PROPS.find(
    (p) => p.id === "chochin-lantern"
  )!;
  lanternGroup.position.set(...lanternSpec.position);
  addContactShadow(lanternGroup, 0.44, contactShadowMat);

  const lBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.32, 0.07, 32),
    cedarDarkMat
  );
  lBase.position.y = 0.035;
  lanternGroup.add(lBase);

  const lPost = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.028, 1.48, 16),
    cedarDarkMat
  );
  lPost.position.set(0.14, 0.76, -0.08);
  lanternGroup.add(lPost);

  const lArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.035, 0.035),
    cedarDarkMat
  );
  lArm.position.set(-0.04, 1.48, -0.02);
  lanternGroup.add(lArm);

  // Hanging ribbed lantern body
  const lanternBody = new THREE.Mesh(
    new THREE.SphereGeometry(0.26, 28, 20),
    washiMat
  );
  lanternBody.scale.set(0.95, 1.38, 0.95);
  lanternBody.position.set(-0.16, 1.05, 0.02);
  lanternGroup.add(lanternBody);

  // Dark lacquered top & bottom caps + bamboo ribs
  const topCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.18, 0.06, 24),
    cedarDarkMat
  );
  topCap.position.set(-0.16, 1.39, 0.02);
  const botCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.12, 0.06, 24),
    cedarDarkMat
  );
  botCap.position.set(-0.16, 0.71, 0.02);
  lanternGroup.add(topCap, botCap);

  for (const offsetY of [-0.16, 0, 0.16]) {
    const ribRadius = offsetY === 0 ? 0.252 : 0.228;
    const rib = new THREE.Mesh(
      new THREE.TorusGeometry(ribRadius, 0.007, 8, 32),
      cedarDarkMat
    );
    rib.rotation.x = Math.PI / 2;
    rib.position.set(-0.16, 1.05 + offsetY, 0.02);
    lanternGroup.add(rib);
  }

  tagInteractiveGroup(lanternGroup, "chochin-lantern", interactables);
  propGroups.set("chochin-lantern", lanternGroup);
  root.add(lanternGroup);

  const { resonanceRings, selectionBeacon, beaconOuterRing, beaconInnerRing } =
    buildSharedBeaconAndTotem({
      root,
      contactShadowMat,
      initialPos: ramenSpec.position,
      totemPos: [-1.42, 0, -0.82],
      outerColor: 0xc99c4c,
      midColor: 0xb93829,
      innerColor: 0x1e3554,
      beaconOuterColor: 0xd99b52,
      beaconInnerColor: 0xb93829,
    });

  for (const [id, group] of propGroups.entries()) {
    propBaseRotY.set(id, group.rotation.y);
  }

  // Rising steam wisps above Ramen & Yunomi Tea
  const steamGeo = new THREE.SphereGeometry(0.056, 10, 8);
  const steamPuffs: SteamPuff[] = [];
  const ramenOrigin: [number, number, number] = [
    ramenSpec.position[0],
    ramenSpec.position[1] + 0.4,
    ramenSpec.position[2],
  ];
  const teaOrigin: [number, number, number] = [
    teaSpec.position[0] + 0.42,
    teaSpec.position[1] + 0.27,
    teaSpec.position[2] + 0.18,
  ];
  for (let i = 0; i < 8; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: 0xfff8ef,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(steamGeo, mat);
    root.add(mesh);
    steamPuffs.push({
      mesh,
      material: mat,
      origin: ramenOrigin,
      phase: i / 8,
      speed: 0.24 + (i % 3) * 0.03,
      driftRadius: 0.08 + (i % 2) * 0.03,
      maxHeight: 0.7,
    });
  }
  for (let i = 0; i < 4; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(steamGeo, mat);
    root.add(mesh);
    steamPuffs.push({
      mesh,
      material: mat,
      origin: teaOrigin,
      phase: i / 4,
      speed: 0.27 + (i % 2) * 0.04,
      driftRadius: 0.04,
      maxHeight: 0.48,
    });
  }

  const { dustMotes, dustMoteSpecs } = buildDustMotes(root, 0xffd7a8);

  return {
    root,
    interactables,
    propGroups,
    propBaseRotY,
    resonanceRings,
    lampBulbMaterial: washiMat,
    studioFloorMaterial,
    selectionBeacon,
    beaconOuterRing,
    beaconInnerRing,
    steamPuffs,
    dustMotes,
    dustMoteSpecs,
    dispose: createDisposeHelper(root, disposableTextures),
  };
}

/**
 * Room 3: Left-Bank Bookshop Desk (Paris)
 */
export function buildParisBookshopDiorama(maxAnisotropy: number): BuiltDiorama {
  const root = new THREE.Group();
  const interactables: THREE.Object3D[] = [];
  const propGroups = new Map<string, THREE.Group>();
  const propBaseRotY = new Map<string, number>();
  const disposableTextures: THREE.Texture[] = [];

  const { map: walnutMap, roughnessMap: walnutRough } =
    createWalnutParquetTexture(maxAnisotropy);
  const cardMap = createStaffPickCardTexture(maxAnisotropy);
  const contactTex = createContactShadowTexture();
  const floorAlphaMap = createFloorAlphaTexture();
  disposableTextures.push(
    walnutMap,
    walnutRough,
    cardMap,
    contactTex,
    floorAlphaMap
  );

  const contactShadowMat = new THREE.MeshBasicMaterial({
    map: contactTex,
    transparent: true,
    depthWrite: false,
    opacity: 0.72,
  });

  const walnutMat = new THREE.MeshStandardMaterial({
    map: walnutMap,
    roughnessMap: walnutRough,
    roughness: 0.58,
    metalness: 0.03,
  });
  const blotterLeatherMat = new THREE.MeshStandardMaterial({
    color: 0x1b4338,
    roughness: 0.84,
    metalness: 0.02,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xcba151,
    roughness: 0.24,
    metalness: 0.9,
  });
  const emeraldGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x0f6b4a,
    roughness: 0.14,
    metalness: 0.04,
    clearcoat: 0.9,
    clearcoatRoughness: 0.08,
  });
  const creamPageMat = new THREE.MeshStandardMaterial({
    color: 0xf4ecd8,
    roughness: 0.9,
    metalness: 0.0,
  });
  const porcelainMat = new THREE.MeshPhysicalMaterial({
    color: 0xf8f6f0,
    roughness: 0.22,
    metalness: 0.02,
    clearcoat: 0.72,
  });
  const inkGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x1d2b44,
    roughness: 0.12,
    metalness: 0.06,
    clearcoat: 0.92,
  });
  const lampBulbMaterial = new THREE.MeshStandardMaterial({
    color: 0xfff8e1,
    emissive: 0xffd585,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.0,
  });

  // --- Walnut Reading Desk with Inlaid Hunter-Green Leather Blotter ---
  const deskGroup = new THREE.Group();
  const deskTop = new THREE.Mesh(
    new THREE.BoxGeometry(5.6, 0.16, 3.6),
    walnutMat
  );
  deskTop.position.y = -0.08;
  deskTop.receiveShadow = true;
  deskGroup.add(deskTop);

  const leatherBlotter = new THREE.Mesh(
    new THREE.BoxGeometry(4.4, 0.012, 2.55),
    blotterLeatherMat
  );
  leatherBlotter.position.y = 0.002;
  leatherBlotter.receiveShadow = true;
  deskGroup.add(leatherBlotter);

  const brassRail = new THREE.Mesh(
    new THREE.BoxGeometry(5.64, 0.032, 3.64),
    brassMat
  );
  brassRail.position.y = -0.175;
  deskGroup.add(brassRail);

  const deskApron = new THREE.Mesh(
    new THREE.BoxGeometry(5.2, 0.54, 3.2),
    walnutMat
  );
  deskApron.position.y = -0.46;
  deskGroup.add(deskApron);

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
  deskGroup.add(studioFloor);
  root.add(deskGroup);

  // --- 1. Stack of 3 Linen-Bound Novels (7 composite parts) ---
  const stackGroup = new THREE.Group();
  const stackSpec = PARIS_BOOKSHOP_PROPS.find((p) => p.id === "book-stack")!;
  stackGroup.position.set(...stackSpec.position);
  addContactShadow(stackGroup, 0.62, contactShadowMat);

  const books = [
    { w: 0.88, h: 0.13, d: 0.64, y: 0.07, ry: 0.08, color: 0x7c2d2d },
    { w: 0.82, h: 0.11, d: 0.58, y: 0.19, ry: -0.16, color: 0x1e3a5f },
    { w: 0.74, h: 0.1, d: 0.52, y: 0.295, ry: 0.22, color: 0x265242 },
  ];
  for (const b of books) {
    const bGroup = new THREE.Group();
    bGroup.position.y = b.y;
    bGroup.rotation.y = b.ry;
    const coverMat = new THREE.MeshStandardMaterial({
      color: b.color,
      roughness: 0.82,
    });
    const spine = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), coverMat);
    const pages = new THREE.Mesh(
      new THREE.BoxGeometry(b.w - 0.04, b.h - 0.026, b.d - 0.04),
      creamPageMat
    );
    pages.position.x = 0.015;
    const goldBand = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, b.h + 0.004, b.d * 0.88),
      brassMat
    );
    goldBand.position.x = -b.w / 2 + 0.012;
    bGroup.add(spine, pages, goldBand);
    stackGroup.add(bGroup);
  }

  // Silk bookmark ribbon draped off top book
  const bookmark = new THREE.Mesh(
    new THREE.BoxGeometry(0.036, 0.008, 0.66),
    new THREE.MeshStandardMaterial({ color: 0xb93829, roughness: 0.7 })
  );
  bookmark.position.set(0.06, 0.35, 0.12);
  bookmark.rotation.y = 0.22;
  stackGroup.add(bookmark);

  tagInteractiveGroup(stackGroup, "book-stack", interactables);
  propGroups.set("book-stack", stackGroup);
  root.add(stackGroup);

  // --- 2. Coup de Cœur Staff-Picks Easel Card (5 composite parts) ---
  const cardGroup = new THREE.Group();
  const cardSpec = PARIS_BOOKSHOP_PROPS.find(
    (p) => p.id === "staff-picks-card"
  )!;
  cardGroup.position.set(...cardSpec.position);
  cardGroup.rotation.y = -0.08;
  addContactShadow(cardGroup, 0.5, contactShadowMat);

  // Brass A-frame easel legs
  const legGeo = new THREE.CylinderGeometry(0.014, 0.016, 0.82, 12);
  const leftLeg = new THREE.Mesh(legGeo, brassMat);
  leftLeg.position.set(-0.22, 0.38, 0.04);
  leftLeg.rotation.x = -0.2;
  leftLeg.rotation.z = -0.1;
  const rightLeg = new THREE.Mesh(legGeo, brassMat);
  rightLeg.position.set(0.22, 0.38, 0.04);
  rightLeg.rotation.x = -0.2;
  rightLeg.rotation.z = 0.1;
  const backLeg = new THREE.Mesh(legGeo, brassMat);
  backLeg.position.set(0, 0.36, -0.22);
  backLeg.rotation.x = 0.34;
  const ledge = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.025, 0.07), brassMat);
  ledge.position.set(0, 0.16, 0.08);
  cardGroup.add(leftLeg, rightLeg, backLeg, ledge);

  const cardBoard = new THREE.Mesh(
    new THREE.BoxGeometry(0.54, 0.72, 0.022),
    creamPageMat
  );
  cardBoard.position.set(0, 0.49, 0.0);
  cardBoard.rotation.x = -0.2;
  const cardPrint = new THREE.Mesh(
    new THREE.PlaneGeometry(0.51, 0.69),
    new THREE.MeshStandardMaterial({ map: cardMap, roughness: 0.78 })
  );
  cardPrint.position.set(0, 0.492, 0.013);
  cardPrint.rotation.x = -0.2;
  cardGroup.add(cardBoard, cardPrint);

  tagInteractiveGroup(cardGroup, "staff-picks-card", interactables);
  propGroups.set("staff-picks-card", cardGroup);
  root.add(cardGroup);

  // --- 3. Beveled Glass Inkwell & Oblique Pen (6 composite parts) ---
  const inkGroup = new THREE.Group();
  const inkSpec = PARIS_BOOKSHOP_PROPS.find((p) => p.id === "fountain-inkwell")!;
  inkGroup.position.set(...inkSpec.position);
  addContactShadow(inkGroup, 0.46, contactShadowMat);

  // Brass pen tray
  const penTray = new THREE.Mesh(
    new THREE.BoxGeometry(0.84, 0.026, 0.34),
    brassMat
  );
  penTray.position.y = 0.013;
  inkGroup.add(penTray);

  // Faceted octagonal inkwell bottle
  const bottle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.17, 0.22, 8),
    inkGlassMat
  );
  bottle.position.set(-0.22, 0.135, 0);
  const collar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.085, 0.095, 0.045, 20),
    brassMat
  );
  collar.position.set(-0.22, 0.26, 0);
  const lid = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 18, 12),
    brassMat
  );
  lid.scale.set(1, 0.72, 1);
  lid.position.set(-0.22, 0.31, 0);
  inkGroup.add(bottle, collar, lid);

  // Fountain pen on rest
  const penBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.014, 0.56, 16),
    new THREE.MeshStandardMaterial({ color: 0x3b1e24, roughness: 0.35 })
  );
  penBody.rotation.z = Math.PI / 2;
  penBody.rotation.y = 0.24;
  penBody.position.set(0.14, 0.055, 0.04);
  const penNib = new THREE.Mesh(
    new THREE.ConeGeometry(0.018, 0.09, 12),
    brassMat
  );
  penNib.rotation.z = -Math.PI / 2;
  penNib.rotation.y = 0.24;
  penNib.position.set(0.43, 0.055, -0.03);
  inkGroup.add(penBody, penNib);

  tagInteractiveGroup(inkGroup, "fountain-inkwell", interactables);
  propGroups.set("fountain-inkwell", inkGroup);
  root.add(inkGroup);

  // --- 4. Café Crème Cup & Antique Brass Pocket Watch (6 composite parts) ---
  const cremeGroup = new THREE.Group();
  const cremeSpec = PARIS_BOOKSHOP_PROPS.find((p) => p.id === "creme-watch")!;
  cremeGroup.position.set(...cremeSpec.position);
  addContactShadow(cremeGroup, 0.52, contactShadowMat);

  const saucerPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.24, 0.0),
    new THREE.Vector2(0.36, 0.045),
    new THREE.Vector2(0.37, 0.058),
    new THREE.Vector2(0.22, 0.024),
    new THREE.Vector2(0.0, 0.024),
  ];
  const saucer = new THREE.Mesh(
    new THREE.LatheGeometry(saucerPts, 36),
    porcelainMat
  );
  saucer.position.set(-0.1, 0, -0.05);
  const cupPts = [
    new THREE.Vector2(0.0, 0.024),
    new THREE.Vector2(0.15, 0.024),
    new THREE.Vector2(0.22, 0.24),
    new THREE.Vector2(0.24, 0.34),
    new THREE.Vector2(0.22, 0.345),
    new THREE.Vector2(0.14, 0.05),
    new THREE.Vector2(0.0, 0.05),
  ];
  const cup = new THREE.Mesh(new THREE.LatheGeometry(cupPts, 36), porcelainMat);
  cup.position.set(-0.1, 0, -0.05);
  const foam = new THREE.Mesh(
    new THREE.CircleGeometry(0.21, 32),
    new THREE.MeshStandardMaterial({ color: 0xe6d3b3, roughness: 0.48 })
  );
  foam.rotation.x = -Math.PI / 2;
  foam.position.set(-0.1, 0.3, -0.05);
  cremeGroup.add(saucer, cup, foam);

  // Antique brass pocket watch resting beside saucer
  const watchCase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.14, 0.042, 32),
    brassMat
  );
  watchCase.position.set(0.34, 0.024, 0.2);
  const watchDial = new THREE.Mesh(
    new THREE.CircleGeometry(0.118, 28),
    creamPageMat
  );
  watchDial.rotation.x = -Math.PI / 2;
  watchDial.position.set(0.34, 0.047, 0.2);
  const watchCrown = new THREE.Mesh(
    new THREE.TorusGeometry(0.036, 0.008, 8, 20),
    brassMat
  );
  watchCrown.rotation.x = Math.PI / 2;
  watchCrown.position.set(0.34, 0.03, 0.035);
  cremeGroup.add(watchCase, watchDial, watchCrown);

  tagInteractiveGroup(cremeGroup, "creme-watch", interactables);
  propGroups.set("creme-watch", cremeGroup);
  root.add(cremeGroup);

  // --- 5. Emerald Banker’s Lamp (7 composite parts) ---
  const lampGroup = new THREE.Group();
  const lampSpec = PARIS_BOOKSHOP_PROPS.find((p) => p.id === "banker-lamp")!;
  lampGroup.position.set(...lampSpec.position);
  addContactShadow(lampGroup, 0.46, contactShadowMat);

  const lBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.3, 0.09, 32),
    brassMat
  );
  lBase.position.y = 0.045;
  const lStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.038, 1.04, 20),
    brassMat
  );
  lStem.position.y = 0.56;
  const yoke = new THREE.Mesh(
    new THREE.BoxGeometry(0.56, 0.032, 0.032),
    brassMat
  );
  yoke.position.set(-0.08, 1.08, 0.06);
  yoke.rotation.y = 0.45;
  lampGroup.add(lBase, lStem, yoke);

  // Classic cylindrical half-hood emerald glass shade
  const shade = new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.19,
      0.22,
      0.56,
      24,
      1,
      false,
      -Math.PI * 0.55,
      Math.PI * 1.1
    ),
    emeraldGlassMat
  );
  shade.rotation.z = Math.PI / 2;
  shade.rotation.y = 0.45;
  shade.position.set(-0.08, 1.08, 0.06);
  lampGroup.add(shade);

  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 16, 14),
    lampBulbMaterial
  );
  bulb.position.set(-0.08, 1.02, 0.08);
  lampGroup.add(bulb);

  const pullChain = new THREE.Mesh(
    new THREE.CylinderGeometry(0.005, 0.005, 0.24, 8),
    brassMat
  );
  pullChain.position.set(0.04, 0.9, 0.14);
  const pullBead = new THREE.Mesh(
    new THREE.SphereGeometry(0.02, 12, 10),
    brassMat
  );
  pullBead.position.set(0.04, 0.77, 0.14);
  lampGroup.add(pullChain, pullBead);

  tagInteractiveGroup(lampGroup, "banker-lamp", interactables);
  propGroups.set("banker-lamp", lampGroup);
  root.add(lampGroup);

  const { resonanceRings, selectionBeacon, beaconOuterRing, beaconInnerRing } =
    buildSharedBeaconAndTotem({
      root,
      contactShadowMat,
      initialPos: stackSpec.position,
      totemPos: [-1.42, 0, -0.82],
      outerColor: 0xcba151,
      midColor: 0x0f6b4a,
      innerColor: 0x1e3a5f,
      beaconOuterColor: 0xcba151,
      beaconInnerColor: 0x15803d,
    });

  for (const [id, group] of propGroups.entries()) {
    propBaseRotY.set(id, group.rotation.y);
  }

  // Rising steam wisps above Café Crème
  const steamGeo = new THREE.SphereGeometry(0.052, 10, 8);
  const steamPuffs: SteamPuff[] = [];
  const cremeOrigin: [number, number, number] = [
    cremeSpec.position[0] - 0.1,
    cremeSpec.position[1] + 0.34,
    cremeSpec.position[2] - 0.05,
  ];
  for (let i = 0; i < 6; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: 0xfffdf8,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(steamGeo, mat);
    root.add(mesh);
    steamPuffs.push({
      mesh,
      material: mat,
      origin: cremeOrigin,
      phase: i / 6,
      speed: 0.22 + (i % 3) * 0.03,
      driftRadius: 0.05,
      maxHeight: 0.56,
    });
  }

  const { dustMotes, dustMoteSpecs } = buildDustMotes(root, 0xe8f5e0);

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
    dispose: createDisposeHelper(root, disposableTextures),
  };
}

export function buildRoomDiorama(
  roomId: SpatialRoomId,
  maxAnisotropy: number
): BuiltDiorama {
  switch (roomId) {
    case "tokyo-counter":
      return buildTokyoCounterDiorama(maxAnisotropy);
    case "paris-bookshop":
      return buildParisBookshopDiorama(maxAnisotropy);
    case "madrid-cafe":
    default:
      return buildScenarioDiorama(maxAnisotropy);
  }
}
