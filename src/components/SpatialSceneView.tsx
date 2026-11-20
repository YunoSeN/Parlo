import { MutableRefObject, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import {
  BookmarkCheck,
  BookmarkPlus,
  ChevronDown,
  ChevronUp,
  Mic,
  PhoneOff,
  RotateCcw,
  Send,
  Volume2,
} from "lucide-react";
import { LANGUAGES } from "../data/catalog";
import { LiveConnectionState } from "../hooks/useLivePartner";
import { speakWithBrowserTts } from "../lib/audio";
import { getCultureByLanguage } from "../lib/cultures";
import { playClickSfx } from "../lib/sfx";
import { buildRoomDiorama } from "../three/buildCulturalRooms";
import { BuiltDiorama } from "../three/buildScenarioDiorama";
import {
  getPropLocalizedTerm,
  getRecommendedRoomForLanguage,
  getSpatialRoomById,
  SPATIAL_ROOMS,
  SpatialPropEntry,
} from "../three/dioramaCatalog";
import { LanguageOption, SpatialRoomId } from "../types";
import { LightRays } from "./LightRays";

interface SpatialSceneViewProps {
  language: LanguageOption;
  scenarioTitle: string;
  connectionState: LiveConnectionState;
  isPartnerSpeaking: boolean;
  userLevelRef: MutableRefObject<number>;
  partnerLevelRef: MutableRefObject<number>;
  savedPhraseStrings: Set<string>;
  onStartSession: () => void;
  onEndSession: () => void;
  onSendTextTurn: (text: string) => void;
  onSavePhrase: (params: {
    phrase: string;
    translation: string;
    reading?: string;
    languageCode: string;
    scenarioTitle: string;
    note?: string;
  }) => void;
  onOpenStudio: () => void;
  onSelectLanguage?: (code: string) => void;
}

// Pre-allocated scratch math helpers (zero GC inside animation loop)
const _mouse = new THREE.Vector2();
const _desiredCamPos = new THREE.Vector3();
const _desiredTarget = new THREE.Vector3();
const _moteDummy = new THREE.Object3D();

function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) return true;
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || "");
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export function SpatialSceneView({
  language,
  scenarioTitle,
  connectionState,
  isPartnerSpeaking,
  userLevelRef,
  partnerLevelRef,
  savedPhraseStrings,
  onStartSession,
  onEndSession,
  onSendTextTurn,
  onSavePhrase,
  onOpenStudio,
  onSelectLanguage,
}: SpatialSceneViewProps) {
  const culture = getCultureByLanguage(language.code);
  const canvasMountRef = useRef<HTMLDivElement | null>(null);

  const [activeRoomId, setActiveRoomId] = useState<SpatialRoomId>(() =>
    getRecommendedRoomForLanguage(language.code)
  );
  const activeRoom = getSpatialRoomById(activeRoomId);

  const [selectedPropId, setSelectedPropId] = useState<string>(
    () => activeRoom.props[0].id
  );
  const [dockOpen, setDockOpen] = useState(true);
  const [webglLost, setWebglLost] = useState(false);

  // Sync recommended 3D room when user switches languages
  const prevLangRef = useRef<string>(language.code);
  useEffect(() => {
    if (prevLangRef.current !== language.code) {
      prevLangRef.current = language.code;
      const nextRoomId = getRecommendedRoomForLanguage(language.code);
      setActiveRoomId(nextRoomId);
    }
  }, [language.code]);

  // Resolve active culture primary & accent colors directly from root CSS variables
  const [atmospherePalette, setAtmospherePalette] = useState<{
    primary: string;
    accent: string;
    isDark: boolean;
  }>(() => ({
    primary: culture.darkPrimaryHex,
    accent: culture.darkAccentHex,
    isDark: true,
  }));

  const selectedPropRef = useRef<string>(selectedPropId);
  const hoveredPropRef = useRef<string | null>(null);
  const activePropsRef = useRef<SpatialPropEntry[]>(activeRoom.props);
  const cameraGlideRef = useRef<{
    active: boolean;
    pos: THREE.Vector3;
    target: THREE.Vector3;
  }>({
    active: false,
    pos: new THREE.Vector3(...activeRoom.defaultCameraPos),
    target: new THREE.Vector3(...activeRoom.defaultTargetPos),
  });
  const connectionStateRef = useRef(connectionState);
  const isPartnerSpeakingRef = useRef(isPartnerSpeaking);

  // Persistent Three.js runtime references for hot-swapping 3D rooms without recreating WebGLRenderer
  const stageRuntimeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    rimLight: THREE.DirectionalLight;
    lampPoint: THREE.PointLight;
    diorama: BuiltDiorama;
    maxAnisotropy: number;
    isSoftwareGl: boolean;
    roomId: SpatialRoomId;
  } | null>(null);

  const applyFloorAndRimPalette = useCallback(
    (
      rimLight: THREE.DirectionalLight,
      floorMaterial: THREE.MeshStandardMaterial
    ) => {
      const root = document.documentElement;
      const styles = getComputedStyle(root);
      const isDarkMode = root.dataset.mode !== "light";
      const rawPrimary = styles.getPropertyValue("--parlo-primary").trim();
      const isSimpleColor = (v: string) =>
        /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v) || /^rgba?\(/i.test(v);
      const fallbackPrimary = isDarkMode
        ? culture.darkPrimaryHex
        : culture.primaryHex;
      const primary = isSimpleColor(rawPrimary) ? rawPrimary : fallbackPrimary;

      try {
        rimLight.color.set(primary);
        rimLight.intensity = isDarkMode ? 0.95 : 0.65;
        floorMaterial.color.set(isDarkMode ? 0x151923 : 0xdce3ec);
        floorMaterial.opacity = isDarkMode ? 0.9 : 0.94;
      } catch {
        // Ignore non-standard CSS colors
      }
    },
    [culture.darkPrimaryHex, culture.primaryHex]
  );

  // Sync LightRays & 3D stage rim lighting from live CSS variables
  useEffect(() => {
    let rafSyncId = 0;

    const readCultureCssVars = () => {
      const root = document.documentElement;
      const styles = getComputedStyle(root);
      const isDarkMode = root.dataset.mode !== "light";
      const fallbackPrimary = isDarkMode
        ? culture.darkPrimaryHex
        : culture.primaryHex;
      const fallbackAccent = isDarkMode
        ? culture.darkAccentHex
        : culture.accentHex;

      const rawPrimary = styles.getPropertyValue("--parlo-primary").trim();
      const rawAccent = styles.getPropertyValue("--parlo-accent").trim();
      const isSimpleColor = (v: string) =>
        /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v) || /^rgba?\(/i.test(v);

      const primary = isSimpleColor(rawPrimary) ? rawPrimary : fallbackPrimary;
      const accent = isSimpleColor(rawAccent) ? rawAccent : fallbackAccent;

      setAtmospherePalette((prev) =>
        prev.primary === primary &&
        prev.accent === accent &&
        prev.isDark === isDarkMode
          ? prev
          : { primary, accent, isDark: isDarkMode }
      );

      const runtime = stageRuntimeRef.current;
      if (runtime) {
        applyFloorAndRimPalette(
          runtime.rimLight,
          runtime.diorama.studioFloorMaterial
        );
      }
    };

    readCultureCssVars();
    rafSyncId = requestAnimationFrame(readCultureCssVars);

    const observer = new MutationObserver(() => {
      readCultureCssVars();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-culture", "data-mode", "class"],
    });

    return () => {
      cancelAnimationFrame(rafSyncId);
      observer.disconnect();
    };
  }, [
    applyFloorAndRimPalette,
    culture.accentHex,
    culture.darkAccentHex,
    culture.darkPrimaryHex,
    culture.primaryHex,
    language.code,
  ]);

  useEffect(() => {
    selectedPropRef.current = selectedPropId;
  }, [selectedPropId]);

  useEffect(() => {
    activePropsRef.current = activeRoom.props;
  }, [activeRoom.props]);

  useEffect(() => {
    connectionStateRef.current = connectionState;
  }, [connectionState]);

  useEffect(() => {
    isPartnerSpeakingRef.current = isPartnerSpeaking;
  }, [isPartnerSpeaking]);

  const focusProp = useCallback((prop: SpatialPropEntry) => {
    setSelectedPropId(prop.id);
    cameraGlideRef.current = {
      active: true,
      pos: new THREE.Vector3(...prop.cameraOffset),
      target: new THREE.Vector3(
        prop.position[0],
        prop.position[1] + 0.3,
        prop.position[2]
      ),
    };
  }, []);

  const resetCamera = useCallback(() => {
    const room = getSpatialRoomById(activeRoomId);
    cameraGlideRef.current = {
      active: true,
      pos: new THREE.Vector3(...room.defaultCameraPos),
      target: new THREE.Vector3(...room.defaultTargetPos),
    };
  }, [activeRoomId]);

  // Keyboard shortcut 'H' to toggle HUD dock
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.key === "h" || e.key === "H") {
        setDockOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Hot-swap 3D room diorama cleanly with complete GPU disposal when activeRoomId changes
  useEffect(() => {
    const room = getSpatialRoomById(activeRoomId);
    activePropsRef.current = room.props;
    setSelectedPropId(room.props[0].id);
    selectedPropRef.current = room.props[0].id;
    hoveredPropRef.current = null;

    const runtime = stageRuntimeRef.current;
    if (!runtime || runtime.roomId === activeRoomId) return;

    runtime.scene.remove(runtime.diorama.root);
    runtime.diorama.dispose();

    const nextDiorama = buildRoomDiorama(activeRoomId, runtime.maxAnisotropy);
    runtime.scene.add(nextDiorama.root);
    runtime.diorama = nextDiorama;
    runtime.roomId = activeRoomId;

    runtime.lampPoint.position.set(...room.lampLightPos);
    runtime.lampPoint.color.setHex(room.lampLightColor);
    runtime.lampPoint.intensity = room.lampLightIntensity;

    applyFloorAndRimPalette(
      runtime.rimLight,
      nextDiorama.studioFloorMaterial
    );

    if (!runtime.isSoftwareGl) {
      runtime.renderer.compile(runtime.scene, runtime.camera);
    }

    cameraGlideRef.current = {
      active: true,
      pos: new THREE.Vector3(...room.defaultCameraPos),
      target: new THREE.Vector3(...room.defaultTargetPos),
    };
  }, [activeRoomId, applyFloorAndRimPalette]);

  // Isolated single-mount Three.js lifecycle
  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    const initialRoom = getSpatialRoomById(activeRoomId);
    const isSoftwareGl = detectSoftwareWebGL();
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: !isSoftwareGl,
        powerPreference: "high-performance",
        premultipliedAlpha: true,
      });
    } catch {
      setWebglLost(true);
      return;
    }

    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2)
    );
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(mount.clientWidth || 1, mount.clientHeight || 1);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    mount.appendChild(renderer.domElement);

    let disposed = false;

    const onContextLost = (e: Event) => {
      e.preventDefault();
      if (!disposed) setWebglLost(true);
    };
    const onContextRestored = () => {
      if (!disposed) setWebglLost(false);
    };
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);
    renderer.domElement.addEventListener(
      "webglcontextrestored",
      onContextRestored
    );

    const scene = new THREE.Scene();
    scene.background = null;

    // Studio IBL environment reflections via PMREMGenerator + RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(
      40,
      (mount.clientWidth || 1) / (mount.clientHeight || 1),
      0.1,
      60
    );
    camera.position.set(...initialRoom.defaultCameraPos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(...initialRoom.defaultTargetPos);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.07;
    controls.minDistance = 1.7;
    controls.maxDistance = 7.2;
    controls.maxPolarAngle = Math.PI / 2 - 0.06;
    controls.minPolarAngle = 0.25;
    controls.enablePan = false;

    controls.addEventListener("start", () => {
      cameraGlideRef.current.active = false;
    });

    // Warm key + cool Hemisphere fill + subtle rim lighting rig
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x94a3b8, 0.9);
    hemiLight.position.set(0, 8, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff1dc, 2.2);
    keyLight.position.set(4.5, 6.2, 3.8);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 18;
    const d = 4.2;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xbfdbfe, 0.75);
    rimLight.position.set(-4.2, 3.4, -4.5);
    scene.add(rimLight);

    const lampPoint = new THREE.PointLight(
      initialRoom.lampLightColor,
      initialRoom.lampLightIntensity,
      4.5,
      2
    );
    lampPoint.position.set(...initialRoom.lampLightPos);
    scene.add(lampPoint);

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const initialDiorama = buildRoomDiorama(initialRoom.id, maxAnisotropy);
    scene.add(initialDiorama.root);

    applyFloorAndRimPalette(rimLight, initialDiorama.studioFloorMaterial);

    stageRuntimeRef.current = {
      scene,
      camera,
      renderer,
      rimLight,
      lampPoint,
      diorama: initialDiorama,
      maxAnisotropy,
      isSoftwareGl,
      roomId: initialRoom.id,
    };

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Raycasting for prop hover & click selection (reads active diorama from ref)
    const raycaster = new THREE.Raycaster();
    let pointerDownX = 0;
    let pointerDownY = 0;
    let lastHoverCheck = 0;

    const updateNormalizedMouse = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      _mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      _mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownX = e.clientX;
      pointerDownY = e.clientY;
    };

    const onPointerUp = (e: PointerEvent) => {
      const moved = Math.hypot(
        e.clientX - pointerDownX,
        e.clientY - pointerDownY
      );
      if (moved > 7) return;

      const activeDiorama = stageRuntimeRef.current?.diorama;
      if (!activeDiorama) return;

      updateNormalizedMouse(e.clientX, e.clientY);
      raycaster.setFromCamera(_mouse, camera);
      const hits = raycaster.intersectObjects(activeDiorama.interactables, false);
      if (hits.length > 0) {
        const hitPropId = hits[0].object.userData.propId as string | undefined;
        if (hitPropId) {
          const prop = activePropsRef.current.find((p) => p.id === hitPropId);
          if (prop) {
            playClickSfx();
            focusProp(prop);
          }
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastHoverCheck < 55) return;
      lastHoverCheck = now;

      const activeDiorama = stageRuntimeRef.current?.diorama;
      if (!activeDiorama) return;

      updateNormalizedMouse(e.clientX, e.clientY);
      raycaster.setFromCamera(_mouse, camera);
      const hits = raycaster.intersectObjects(activeDiorama.interactables, false);
      const hitId =
        hits.length > 0
          ? ((hits[0].object.userData.propId as string | undefined) ?? null)
          : null;
      hoveredPropRef.current = hitId;
      renderer.domElement.style.cursor = hitId ? "pointer" : "grab";
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointermove", onPointerMove);

    const resizeObserver = new ResizeObserver(() => {
      const w = Math.max(1, mount.clientWidth);
      const h = Math.max(1, mount.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(mount);

    let frameId = 0;
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (typeof gl.fenceSync !== "function") {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const tick = () => {
      if (disposed) return;
      const dt = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();
      const activeDiorama = stageRuntimeRef.current?.diorama;

      if (cameraGlideRef.current.active) {
        const alpha = reducedMotion ? 1 : 1 - Math.exp(-5.5 * dt);
        _desiredCamPos.copy(cameraGlideRef.current.pos);
        _desiredTarget.copy(cameraGlideRef.current.target);
        camera.position.lerp(_desiredCamPos, alpha);
        controls.target.lerp(_desiredTarget, alpha);
        if (
          camera.position.distanceTo(_desiredCamPos) < 0.015 &&
          controls.target.distanceTo(_desiredTarget) < 0.015
        ) {
          camera.position.copy(_desiredCamPos);
          controls.target.copy(_desiredTarget);
          cameraGlideRef.current.active = false;
        }
      }

      if (activeDiorama) {
        for (const [id, group] of activeDiorama.propGroups.entries()) {
          const isSelected = id === selectedPropRef.current;
          const isHovered = id === hoveredPropRef.current;
          const baseRotY = activeDiorama.propBaseRotY.get(id) ?? 0;

          const targetY = isSelected
            ? 0.042 + (reducedMotion ? 0 : Math.sin(elapsed * 2.1) * 0.008)
            : isHovered
            ? 0.024
            : 0;
          const targetScale = isSelected ? 1.035 : isHovered ? 1.02 : 1.0;
          const targetRotY =
            isSelected && !reducedMotion
              ? baseRotY + Math.sin(elapsed * 0.9) * 0.14
              : isHovered && !reducedMotion
              ? baseRotY + 0.06
              : baseRotY;

          group.position.y = THREE.MathUtils.damp(group.position.y, targetY, 8.5, dt);
          const nextScale = THREE.MathUtils.damp(group.scale.x, targetScale, 9, dt);
          group.scale.setScalar(nextScale);
          group.rotation.y = THREE.MathUtils.damp(
            group.rotation.y,
            targetRotY,
            6,
            dt
          );
        }

        const roomProps = activePropsRef.current;
        const focusedSpec =
          roomProps.find((p) => p.id === selectedPropRef.current) ??
          roomProps[0];
        if (focusedSpec) {
          activeDiorama.selectionBeacon.position.x = THREE.MathUtils.damp(
            activeDiorama.selectionBeacon.position.x,
            focusedSpec.position[0],
            7.5,
            dt
          );
          activeDiorama.selectionBeacon.position.z = THREE.MathUtils.damp(
            activeDiorama.selectionBeacon.position.z,
            focusedSpec.position[2],
            7.5,
            dt
          );
        }

        if (!reducedMotion) {
          activeDiorama.beaconOuterRing.rotation.z += dt * 0.45;
          activeDiorama.beaconInnerRing.rotation.z -= dt * 0.85;
          const beaconPulse = 1 + Math.sin(elapsed * 2.4) * 0.035;
          activeDiorama.selectionBeacon.scale.set(beaconPulse, 1, beaconPulse);
        }

        const liveEnergy =
          connectionStateRef.current === "live"
            ? Math.max(userLevelRef.current, partnerLevelRef.current)
            : 0;
        const [outerRing, innerRing, coreSphere, midRing] =
          activeDiorama.resonanceRings;
        if (!reducedMotion) {
          const spinSpeed = 0.34 + liveEnergy * 2.4;
          outerRing.rotation.y += dt * spinSpeed;
          outerRing.rotation.x = Math.sin(elapsed * 0.65) * 0.22;
          if (midRing) {
            midRing.rotation.z += dt * (spinSpeed * 1.15);
            midRing.rotation.y = Math.cos(elapsed * 0.7) * 0.42;
          }
          innerRing.rotation.x += dt * (spinSpeed * 1.55);
          innerRing.rotation.z = Math.cos(elapsed * 0.85) * 0.28;
        }
        const targetScale =
          1 +
          liveEnergy * 0.34 +
          (reducedMotion ? 0 : Math.sin(elapsed * 2.2) * 0.03);
        const s = THREE.MathUtils.damp(coreSphere.scale.x, targetScale, 12, dt);
        coreSphere.scale.setScalar(s);

        if (!reducedMotion) {
          for (let i = 0; i < activeDiorama.steamPuffs.length; i++) {
            const puff = activeDiorama.steamPuffs[i];
            const life = (elapsed * puff.speed + puff.phase) % 1;
            const swirl = elapsed * 1.6 + puff.phase * Math.PI * 2;
            puff.mesh.position.set(
              puff.origin[0] + Math.sin(swirl) * puff.driftRadius * life,
              puff.origin[1] + life * puff.maxHeight,
              puff.origin[2] + Math.cos(swirl * 0.8) * puff.driftRadius * life
            );
            const puffScale = 0.45 + life * 1.35;
            puff.mesh.scale.set(puffScale, puffScale * 1.15, puffScale);
            puff.material.opacity = Math.sin(life * Math.PI) * 0.22;
          }

          const moteBoost = 1 + liveEnergy * 1.8;
          for (let i = 0; i < activeDiorama.dustMoteSpecs.length; i++) {
            const spec = activeDiorama.dustMoteSpecs[i];
            const t = elapsed * spec.speed * moteBoost + spec.phase;
            _moteDummy.position.set(
              spec.baseX + Math.sin(t * 0.7) * spec.radius,
              spec.baseY + Math.cos(t * 0.55) * (spec.radius * 0.65),
              spec.baseZ + Math.cos(t * 0.65) * spec.radius
            );
            const twinkle = spec.scale * (0.75 + Math.sin(t * 1.8) * 0.25);
            _moteDummy.scale.setScalar(twinkle);
            _moteDummy.updateMatrix();
            activeDiorama.dustMotes.setMatrixAt(i, _moteDummy.matrix);
          }
          activeDiorama.dustMotes.instanceMatrix.needsUpdate = true;
        }

        const targetEmissive = isPartnerSpeakingRef.current
          ? 2.2
          : 1.45 + (reducedMotion ? 0 : Math.sin(elapsed * 1.5) * 0.12);
        activeDiorama.lampBulbMaterial.emissiveIntensity = THREE.MathUtils.damp(
          activeDiorama.lampBulbMaterial.emissiveIntensity,
          targetEmissive,
          6,
          dt
        );
      }

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      window.clearTimeout(frameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      renderer.domElement.removeEventListener(
        "webglcontextrestored",
        onContextRestored
      );
      controls.dispose();
      stageRuntimeRef.current?.diorama.dispose();
      stageRuntimeRef.current = null;
      envTarget.dispose();
      const glCtx = renderer.getContext();
      renderer.dispose();
      if (glCtx && !glCtx.isContextLost()) {
        renderer.forceContextLoss();
      }
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
    // Single-mount renderer; room swaps are handled by the dedicated activeRoomId effect above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusProp, partnerLevelRef, userLevelRef]);

  const activeProp =
    activeRoom.props.find((p) => p.id === selectedPropId) ??
    activeRoom.props[0];
  const localized = getPropLocalizedTerm(activeProp, language.code);
  const isSaved = savedPhraseStrings.has(localized.term.trim().toLowerCase());
  const isLive = connectionState === "live";

  return (
    <div
      className="relative w-full h-[calc(100dvh-3.5rem)] sm:h-[calc(100dvh-4rem)] overflow-hidden bg-[var(--parlo-canvas)]"
      style={{
        backgroundImage: atmospherePalette.isDark
          ? "radial-gradient(ellipse 80% 60% at 50% 24%, rgba(255,255,255,0.03), transparent 72%), linear-gradient(180deg, var(--parlo-viewport) 0%, var(--parlo-canvas) 62%, var(--parlo-shell) 100%)"
          : "radial-gradient(ellipse 80% 60% at 50% 24%, rgba(255,255,255,0.6), transparent 72%), linear-gradient(180deg, #e7edf5 0%, var(--parlo-canvas) 70%, var(--parlo-surface) 100%)",
      }}
    >
      {/* Atmospheric WebGL Volumetric LightRays synced to active culture CSS variables */}
      <LightRays
        raysOrigin="top-right"
        raysColor={atmospherePalette.primary}
        secondaryColor={atmospherePalette.accent}
        raysSpeed={0.42}
        lightSpread={1.25}
        rayLength={1.45}
        pulsating={false}
        fadeDistance={1.0}
        followMouse={true}
        mouseInfluence={0.07}
        noiseAmount={0.03}
        distortion={0.04}
        intensity={
          (atmospherePalette.isDark ? 0.34 : 0.16) +
          (isPartnerSpeaking ? 0.05 : 0)
        }
        className="z-0"
      />

      {/* Isolated Transparent WebGL 3D Diorama Canvas Container */}
      <div
        ref={canvasMountRef}
        className="relative z-[1] w-full h-full"
        aria-label={`Interactive 3D spatial scene: ${activeRoom.title}`}
      />

      <AnimatePresence>
        {webglLost && (
          <motion.div
            key="spatial-webgl-lost"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[var(--parlo-canvas)]/95 p-6 text-center"
          >
            <h2 className="font-display text-2xl font-semibold text-[var(--parlo-ink)]">
              3D Viewport Paused
            </h2>
            <p className="mt-2 text-sm text-[var(--parlo-ink-secondary)] max-w-md">
              WebGL rendering is unavailable or paused on this device. You can
              still inspect every object below or continue practicing in the
              Voice Studio.
            </p>
            <button
              type="button"
              onClick={onOpenStudio}
              className="mt-4 px-4 py-2 text-sm font-medium text-[var(--parlo-on-solid)] bg-[var(--parlo-primary)] hover:bg-[var(--parlo-primary-hover)] rounded-lg cursor-pointer"
            >
              Return to Voice Studio
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top-Left Scene Bar: Room Switcher + Culture Indicator + Quick Language Switcher */}
      <div className="absolute top-3.5 left-3.5 right-3.5 sm:right-auto z-10 pointer-events-auto bg-[var(--parlo-surface-solid)]/95 border border-[var(--parlo-border)] rounded-xl px-3.5 py-2 flex flex-wrap items-center gap-x-3 gap-y-2 max-w-[94vw]">
        <div className="flex items-center gap-2 text-xs text-[var(--parlo-ink-muted)]">
          <span className="font-medium text-[var(--parlo-ink)] whitespace-nowrap">
            {activeRoom.title}
          </span>
          <span aria-hidden="true" className="hidden md:inline">
            ·
          </span>
          <span className="hidden md:inline text-[var(--parlo-primary)] font-medium whitespace-nowrap">
            {activeRoom.cityTag}
          </span>
        </div>

        {/* Multi-Scene 3D Room Switcher */}
        <div
          className="flex items-center gap-1 sm:pl-2.5 sm:border-l sm:border-[var(--parlo-border)]"
          role="radiogroup"
          aria-label="Choose 3D cultural room"
        >
          {SPATIAL_ROOMS.map((room) => {
            const active = room.id === activeRoomId;
            return (
              <button
                key={room.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => {
                  if (room.id !== activeRoomId) {
                    playClickSfx();
                    setActiveRoomId(room.id);
                  }
                }}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? "bg-[var(--parlo-primary)] text-[var(--parlo-on-solid)] font-semibold"
                    : "text-[var(--parlo-ink-secondary)] hover:text-[var(--parlo-ink)] hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                {room.shortLabel}
              </button>
            );
          })}
        </div>

        {onSelectLanguage && (
          <div
            className="hidden lg:flex items-center gap-0.5 pl-2.5 border-l border-[var(--parlo-border)]"
            role="radiogroup"
            aria-label="Switch 3D stage language"
          >
            {LANGUAGES.map((lang) => {
              const active = lang.code === language.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onSelectLanguage(lang.code)}
                  title={`${lang.name} (${getCultureByLanguage(lang.code).atelierName})`}
                  className={`px-1.5 py-0.5 text-[11px] font-mono uppercase rounded transition-colors cursor-pointer ${
                    active
                      ? "bg-[var(--parlo-primary)] text-[var(--parlo-on-solid)] font-semibold"
                      : "text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)] hover:bg-black/5"
                  }`}
                >
                  {lang.code}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Collapsible Unified Bottom Control Dock */}
      <div className="absolute bottom-[76px] md:bottom-[72px] left-1/2 -translate-x-1/2 z-10 w-[min(940px,94vw)] pointer-events-auto flex flex-col items-center">
        <button
          type="button"
          onClick={() => setDockOpen((prev) => !prev)}
          className="mb-1.5 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-[var(--parlo-ink)] bg-[var(--parlo-surface-solid)]/95 border border-[var(--parlo-border)] rounded-md hover:border-[var(--parlo-ink-muted)] transition-colors cursor-pointer"
        >
          {dockOpen ? (
            <>
              <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
              Hide Controls (H)
            </>
          ) : (
            <>
              <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
              Show Controls (H)
            </>
          )}
        </button>

        <AnimatePresence initial={false}>
          {dockOpen && (
            <motion.div
              key="spatial-hud-dock"
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.96 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative overflow-hidden w-full bg-[#0d111a]/94 text-[#f1f5f9] border border-[#ffffff]/14 rounded-xl p-4 shadow-[0_20px_50px_-14px_rgba(0,0,0,0.75)] space-y-3"
            >
              <div
                aria-hidden="true"
                data-culture={language.code}
                className="parlo-motif-overlay parlo-motif-corner parlo-motif-dark"
              />
              {/* Row 1: Prop selector buttons + camera reset + voice toggle */}
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#ffffff]/10">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full">
                  {activeRoom.props.map((prop) => {
                    const active = prop.id === activeProp.id;
                    return (
                      <button
                        key={`${activeRoomId}-${prop.id}`}
                        type="button"
                        onClick={() => {
                          playClickSfx();
                          focusProp(prop);
                        }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          active
                            ? "bg-[var(--parlo-primary)] border-[var(--parlo-primary)] text-[var(--parlo-on-solid)] font-semibold"
                            : "bg-[#1a2233] border-[#ffffff]/10 text-[#cbd5e1] hover:bg-[#242f46] hover:text-[#ffffff]"
                        }`}
                      >
                        {prop.label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={resetCamera}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#cbd5e1] bg-[#1a2233] border border-[#ffffff]/10 hover:bg-[#242f46] hover:text-[#ffffff] rounded-md transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    Reset View
                  </button>

                  {isLive ? (
                    <button
                      type="button"
                      onClick={onEndSession}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#ffffff] bg-[#dc2626] hover:bg-[#b91c1c] rounded-md transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <PhoneOff className="w-3.5 h-3.5" aria-hidden="true" />
                      End Voice
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onStartSession}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--parlo-on-solid)] bg-[var(--parlo-primary)] hover:bg-[var(--parlo-primary-hover)] rounded-md transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <Mic className="w-3.5 h-3.5" aria-hidden="true" />
                      Start Voice
                    </button>
                  )}
                </div>
              </div>

              {/* Row 2: Active Prop Vocabulary & Speaking Prompt */}
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`${activeRoomId}-${language.code}-${activeProp.id}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                      <span className="font-display text-lg font-semibold text-[#f8fafc]">
                        {localized.term}
                      </span>
                      {localized.reading && (
                        <span className="font-mono text-xs text-[#94a3b8]">
                          {localized.reading}
                        </span>
                      )}
                      <span className="text-xs text-[#cbd5e1]">
                        — {localized.meaning}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#cbd5e1] line-clamp-2 sm:truncate">
                      Prompt: “{localized.samplePrompt}”
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        speakWithBrowserTts(
                          localized.samplePrompt,
                          language.speechLocale
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#e2e8f0] bg-[#1a2233] border border-[#ffffff]/10 hover:bg-[#242f46] hover:text-[#ffffff] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                      Listen
                    </button>

                    <button
                      type="button"
                      disabled={isSaved}
                      onClick={() =>
                        onSavePhrase({
                          phrase: localized.term,
                          translation: localized.meaning,
                          reading: localized.reading,
                          languageCode: language.code,
                          scenarioTitle: `${activeRoom.title} · ${scenarioTitle}`,
                          note: localized.samplePrompt,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#e2e8f0] bg-[#1a2233] border border-[#ffffff]/10 hover:bg-[#242f46] hover:text-[#ffffff] disabled:text-[#34d399] disabled:border-[#34d399]/30 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                    >
                      {isSaved ? (
                        <BookmarkCheck
                          className="w-3.5 h-3.5"
                          aria-hidden="true"
                        />
                      ) : (
                        <BookmarkPlus
                          className="w-3.5 h-3.5"
                          aria-hidden="true"
                        />
                      )}
                      {isSaved ? "Saved" : "Save"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (isLive) {
                          onSendTextTurn(localized.samplePrompt);
                        } else {
                          onStartSession();
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[var(--parlo-on-solid)] bg-[var(--parlo-primary)] hover:bg-[var(--parlo-primary-hover)] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" aria-hidden="true" />
                      {isLive ? "Use in Live Chat" : "Practice This"}
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
