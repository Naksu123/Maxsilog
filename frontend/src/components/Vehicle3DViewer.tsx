"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { 
  Rotate3d, 
  Sun, 
  Palette, 
  Play, 
  Pause, 
  AlertCircle,
  CheckCircle2,
  Camera,
  ExternalLink,
  ShieldCheck
} from "lucide-react";
import { lookupVehicleAsset, VehicleRegistryEntry } from "@/data/vehicleRegistry";

export type VehicleBodyStyle = "sedan" | "suv" | "hatchback" | "coupe";
export type CameraViewAngle = "threeQuarter" | "side" | "front" | "rear" | "top";

interface Vehicle3DViewerProps {
  modelName: string;
  brandName?: string;
  year?: number;
  gearType?: string;
  colorHex?: string;
}

export default function Vehicle3DViewer({
  modelName,
  brandName = "Vehicle",
  year,
  colorHex = "#0ea5e9"
}: Vehicle3DViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 1. Resolve authentic vehicle asset from registry
  const asset: VehicleRegistryEntry = lookupVehicleAsset(modelName, brandName, year);

  // 2. State for viewing modes:
  // If the asset has a verified 3D model, default to '3d'. Otherwise, default to 'photo' (authentic media).
  const [viewMode, setViewMode] = useState<"photo" | "3d">(() => {
    return asset.availability === "verified-3d" ? "3d" : "photo";
  });

  const [activeColor, setActiveColor] = useState(colorHex);
  const [isRotating, setIsRotating] = useState(true);
  const isRotatingRef = useRef(isRotating);
  const [headlightsOn, setHeadlightsOn] = useState(true);
  const [activeView, setActiveView] = useState<CameraViewAngle>("threeQuarter");
  const [gltfLoadingProgress, setGltfLoadingProgress] = useState<number | null>(null);
  const [gltfLoadError, setGltfLoadError] = useState<string | null>(null);

  const [webglSupported] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      const canvas = document.createElement("canvas");
      return !!(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
    } catch {
      return false;
    }
  });

  // Keep active color in sync if prop changes
  useEffect(() => {
    const t = setTimeout(() => {
      if (asset.colorOptions && asset.colorOptions.length > 0) {
        setActiveColor(asset.colorOptions[0].hex);
      }
    }, 0);
    return () => clearTimeout(t);
  }, [asset]);

  // Three.js Scene References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const carGroupRef = useRef<THREE.Group | null>(null);
  const carPaintMaterialsRef = useRef<THREE.MeshPhysicalMaterial[]>([]);
  const headlightMaterialsRef = useRef<THREE.MeshStandardMaterial[]>([]);

  // Orbit control refs
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const sphericalRef = useRef({ radius: 7.2, theta: Math.PI / 4, phi: Math.PI / 3 });
  const targetSphericalRef = useRef({ radius: 7.2, theta: Math.PI / 4, phi: Math.PI / 3 });

  // Sync rotating ref
  useEffect(() => {
    isRotatingRef.current = isRotating;
  }, [isRotating]);

  // Update vehicle paint color
  useEffect(() => {
    carPaintMaterialsRef.current.forEach((mat) => {
      mat.color.set(activeColor);
    });
  }, [activeColor]);

  // Toggle headlights emission
  useEffect(() => {
    headlightMaterialsRef.current.forEach((mat) => {
      if (headlightsOn) {
        mat.emissive.set("#7DD3FC");
        mat.emissiveIntensity = 3.5;
      } else {
        mat.emissive.set("#000000");
        mat.emissiveIntensity = 0;
      }
    });
  }, [headlightsOn]);

  // Camera angles
  const setCameraAngle = useCallback((view: CameraViewAngle) => {
    setActiveView(view);
    setIsRotating(false);

    switch (view) {
      case "threeQuarter":
        targetSphericalRef.current = { radius: 7.2, theta: Math.PI / 4, phi: Math.PI / 3 };
        break;
      case "side":
        targetSphericalRef.current = { radius: 7.0, theta: Math.PI / 2, phi: Math.PI / 2.3 };
        break;
      case "front":
        targetSphericalRef.current = { radius: 6.8, theta: 0, phi: Math.PI / 2.3 };
        break;
      case "rear":
        targetSphericalRef.current = { radius: 6.8, theta: Math.PI, phi: Math.PI / 2.3 };
        break;
      case "top":
        targetSphericalRef.current = { radius: 8.5, theta: Math.PI / 4, phi: 0.1 };
        break;
    }
  }, []);

  // Initialize and run Three.js Studio Scene when in 3D mode
  useEffect(() => {
    if (viewMode !== "3d" || !canvasRef.current || !webglSupported) return;

    const canvas = canvasRef.current;
    const width = canvas.clientWidth || 640;
    const height = canvas.clientHeight || 360;

    let progressTimer: ReturnType<typeof setTimeout> | undefined;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    cameraRef.current = camera;

    // 3. Renderer with physical lighting and tone mapping
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // 4. Tesla/Apple Automotive Studio Multi-Point Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const mainStudioLight = new THREE.DirectionalLight(0xffffff, 2.0);
    mainStudioLight.position.set(5, 8, 5);
    mainStudioLight.castShadow = true;
    mainStudioLight.shadow.mapSize.width = 1024;
    mainStudioLight.shadow.mapSize.height = 1024;
    mainStudioLight.shadow.bias = -0.0005;
    scene.add(mainStudioLight);

    const cyanRimLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    cyanRimLight.position.set(-6, 4, -5);
    scene.add(cyanRimLight);

    const fillWarmLight = new THREE.DirectionalLight(0xffeedd, 0.9);
    fillWarmLight.position.set(0, -2, 6);
    scene.add(fillWarmLight);

    // 5. Studio Stage Ground Mirror Plane with Radial Falloff
    const groundGeo = new THREE.PlaneGeometry(30, 30);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x090e17,
      roughness: 0.28,
      metalness: 0.6,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    scene.add(ground);

    // Car Root Group
    const carGroup = new THREE.Group();
    scene.add(carGroup);
    carGroupRef.current = carGroup;
    carPaintMaterialsRef.current = [];
    headlightMaterialsRef.current = [];

    // Check if verified 3D GLB model exists
    if (asset.availability === "verified-3d" && asset.model3dUrl) {
      progressTimer = setTimeout(() => {
        setGltfLoadingProgress(10);
        setGltfLoadError(null);
      }, 0);

      const loader = new GLTFLoader();
      loader.load(
        asset.model3dUrl,
        (gltf) => {
          setGltfLoadingProgress(null);
          const loadedModel = gltf.scene;

          // Compute bounding box to auto-center and normalize size
          const bbox = new THREE.Box3().setFromObject(loadedModel);
          const center = bbox.getCenter(new THREE.Vector3());
          const size = bbox.getSize(new THREE.Vector3());

          const maxDim = Math.max(size.x, size.y, size.z);
          const scaleFactor = 4.2 / maxDim;
          loadedModel.scale.set(scaleFactor, scaleFactor, scaleFactor);

          loadedModel.position.x = -center.x * scaleFactor;
          loadedModel.position.y = -bbox.min.y * scaleFactor;
          loadedModel.position.z = -center.z * scaleFactor;

          // Traverse and hook up paint materials
          loadedModel.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;

              // Check if material is car paint bodywork
              const mat = mesh.material as THREE.MeshStandardMaterial;
              if (mat && mat.name && (mat.name.toLowerCase().includes("body") || mat.name.toLowerCase().includes("paint") || mat.name.toLowerCase().includes("car"))) {
                const physicalMat = new THREE.MeshPhysicalMaterial({
                  color: new THREE.Color(activeColor),
                  metalness: 0.85,
                  roughness: 0.2,
                  clearcoat: 1.0,
                  clearcoatRoughness: 0.08,
                });
                mesh.material = physicalMat;
                carPaintMaterialsRef.current.push(physicalMat);
              }
            }
          });

          carGroup.add(loadedModel);
        },
        (progress) => {
          if (progress.total > 0) {
            setGltfLoadingProgress(Math.round((progress.loaded / progress.total) * 100));
          }
        },
        (err) => {
          console.error("GLTF load error:", err);
          setGltfLoadingProgress(null);
          setGltfLoadError("Failed to load 3D GLB model. Falling back to silhouette studio.");
        }
      );
    } else {
      // Build Procedural High-Detail Silhouette Studio Model
      buildProceduralStudioModel(carGroup, asset.bodyStyle.toLowerCase() as VehicleBodyStyle, activeColor, carPaintMaterialsRef, headlightMaterialsRef);
    }

    // 6. Smooth Animation and OrbitControls Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Auto Turntable Rotation
      if (isRotatingRef.current) {
        targetSphericalRef.current.theta += 0.007;
      }

      // Smooth camera interpolation
      sphericalRef.current.radius += (targetSphericalRef.current.radius - sphericalRef.current.radius) * 0.08;
      sphericalRef.current.theta += (targetSphericalRef.current.theta - sphericalRef.current.theta) * 0.08;
      sphericalRef.current.phi += (targetSphericalRef.current.phi - sphericalRef.current.phi) * 0.08;

      const { radius, theta, phi } = sphericalRef.current;
      camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = radius * Math.cos(phi);
      camera.position.z = radius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(0, 0.75, 0);

      renderer.render(scene, camera);
    };

    animate();

    // 7. Mouse and Touch Event Handlers
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      setIsRotating(false);
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      targetSphericalRef.current.theta -= deltaX * 0.007;
      targetSphericalRef.current.phi = Math.max(0.15, Math.min(Math.PI / 2 - 0.05, targetSphericalRef.current.phi - deltaY * 0.007));

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetSphericalRef.current.radius = Math.max(4.5, Math.min(11.0, targetSphericalRef.current.radius + e.deltaY * 0.005));
    };

    // Touch events for mobile/tablet
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        setIsRotating(false);
        previousMousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - previousMousePositionRef.current.x;
      const deltaY = e.touches[0].clientY - previousMousePositionRef.current.y;

      targetSphericalRef.current.theta -= deltaX * 0.007;
      targetSphericalRef.current.phi = Math.max(0.15, Math.min(Math.PI / 2 - 0.05, targetSphericalRef.current.phi - deltaY * 0.007));

      previousMousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const onTouchEnd = () => {
      isDraggingRef.current = false;
    };

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);

    // Responsive Canvas Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      if (!canvasRef.current || !rendererRef.current || !cameraRef.current) return;
      const newW = canvasRef.current.clientWidth;
      const newH = canvasRef.current.clientHeight;
      cameraRef.current.aspect = newW / newH;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newW, newH);
    });

    resizeObserver.observe(canvas);

    // Cleanup on unmount or mode switch
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();

      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("wheel", onWheel);

      canvas.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);

      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else if (mesh.material) {
            mesh.material.dispose();
          }
        }
      });

      renderer.dispose();
      if (progressTimer) clearTimeout(progressTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, asset.id, webglSupported]);

  return (
    <div className="w-full glass-panel-elevated rounded-2xl overflow-hidden border border-cyan-500/30 shadow-2xl relative studio-stage">
      
      {/* 3D / Photo Viewer Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center space-x-2">
              <span>{asset.brand} {asset.model}</span>
              {year && <span className="text-slate-400 font-mono font-normal">({year})</span>}
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
              {asset.generation}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            {asset.segment}
          </p>
        </div>

        {/* View Mode Toggle: Authentic Media vs Interactive 3D */}
        <div className="flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-[11px] self-start sm:self-auto">
          <button
            onClick={() => setViewMode("photo")}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
              viewMode === "photo"
                ? "bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Authentic Photograph</span>
          </button>

          <button
            onClick={() => setViewMode("3d")}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
              viewMode === "3d"
                ? "bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Rotate3d className="w-3.5 h-3.5" />
            <span>Interactive 3D Studio</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODE 1: AUTHENTIC AUTOMOTIVE PHOTOGRAPH VIEW             */}
      {/* ======================================================== */}
      {viewMode === "photo" ? (
        <div className="p-5 sm:p-7 space-y-5 animate-in fade-in duration-300">
          
          {/* Main Verified Photograph Showcase */}
          <div className="relative w-full h-64 sm:h-72 md:h-80 rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-950/70 shadow-2xl flex items-center justify-center group">
            {/* Background Studio Glow */}
            <div className="absolute inset-0 bg-radial-gradient from-cyan-950/20 via-transparent to-transparent opacity-60" />
            
            <Image
              src={asset.photoUrl}
              alt={`${asset.brand} ${asset.model} ${asset.generation}`}
              fill
              unoptimized
              className="object-contain p-2 sm:p-4 transition-transform duration-500 group-hover:scale-[1.02]"
              loading="lazy"
            />

            {/* Verified Badge Pill */}
            <div className="absolute top-3 left-4 flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-950/85 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono shadow-xl backdrop-blur-md">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verified Automotive Media ({asset.generation})</span>
            </div>

            {/* Quick 3D Switch Overlay on Hover */}
            <button
              onClick={() => setViewMode("3d")}
              className="absolute bottom-3 right-4 flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 text-xs font-semibold shadow-xl transition-all cursor-pointer backdrop-blur-md"
            >
              <Rotate3d className="w-3.5 h-3.5 text-cyan-400" />
              <span>Launch 3D Studio</span>
            </button>
          </div>

          {/* Genuine Vehicle Specifications & Dimensions Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
              <span className="text-[10px] text-slate-400 block font-medium">Body Style</span>
              <span className="font-bold text-white">{asset.bodyStyle}</span>
              <span className="text-[9px] text-slate-500 block truncate">{asset.segment}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
              <span className="text-[10px] text-slate-400 block font-medium">Dimensions (L × W × H)</span>
              <span className="font-mono font-bold text-cyan-300">
                {asset.dimensions.lengthMm} × {asset.dimensions.widthMm} × {asset.dimensions.heightMm}
              </span>
              <span className="text-[9px] text-slate-500 block">Millimeters (mm)</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
              <span className="text-[10px] text-slate-400 block font-medium">Wheelbase</span>
              <span className="font-mono font-bold text-white">
                {asset.dimensions.wheelbaseMm} mm
              </span>
              <span className="text-[9px] text-slate-500 block">Chassis stance</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
              <span className="text-[10px] text-slate-400 block font-medium">Authentic Colors</span>
              <div className="flex items-center space-x-1.5 pt-1">
                {asset.colorOptions.map((c) => (
                  <span
                    key={c.id}
                    title={c.name}
                    className="w-3.5 h-3.5 rounded-full border border-slate-700 shadow-sm"
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
              <span className="text-[9px] text-slate-500 block truncate">Factory options</span>
            </div>
          </div>

          {/* Genuine Media Attribution & Research Integrity Disclaimer */}
          <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                {asset.curatorNotes}
              </span>
            </div>

            <div className="flex items-center space-x-2 shrink-0 font-mono text-[10px] text-slate-400">
              <span>Photo: {asset.attribution.author} ({asset.attribution.license})</span>
              <a
                href={asset.attribution.licenseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 flex items-center space-x-0.5"
              >
                <span>License</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>

        </div>
      ) : (
        /* ======================================================== */
        /* MODE 2: INTERACTIVE 3D WEBGL STUDIO                      */
        /* ======================================================== */
        <div className="animate-in fade-in duration-300">
          
          {/* View Angle Preset Pills Bar */}
          <div className="flex items-center justify-between gap-2 px-5 py-2.5 bg-slate-950/60 border-b border-slate-800/60 text-xs">
            <div className="flex items-center space-x-1 overflow-x-auto max-w-full">
              <span className="text-[10px] uppercase font-mono text-slate-500 mr-1 hidden sm:inline">Angles:</span>
              {[
                { id: "threeQuarter", label: "3/4 View" },
                { id: "side", label: "Side" },
                { id: "front", label: "Front" },
                { id: "rear", label: "Rear" },
                { id: "top", label: "Top" },
              ].map((v) => (
                <button
                  key={v.id}
                  onClick={() => setCameraAngle(v.id as CameraViewAngle)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                    activeView === v.id
                      ? "bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2 text-[10px] font-mono text-cyan-400">
              {asset.availability === "verified-3d" ? (
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  ★ Verified 3D CAD Geometry
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-cyan-300 border border-blue-500/30">
                  3D Silhouette Studio (Simulation)
                </span>
              )}
            </div>
          </div>

          {/* Main 3D Canvas / Stage */}
          <div className="relative w-full h-72 sm:h-80 md:h-96 cursor-grab active:cursor-grabbing studio-grid">
            {webglSupported ? (
              <canvas
                ref={canvasRef}
                className="w-full h-full block"
                aria-label={`Interactive 3D representation of ${asset.brand} ${asset.model}`}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3">
                <AlertCircle className="w-10 h-10 text-amber-400" />
                <div className="text-sm font-semibold text-white">WebGL Hardware Acceleration Unavailable</div>
                <p className="text-xs text-slate-400 max-w-md">
                  Showing authentic verified vehicle photography.
                </p>
                <button
                  onClick={() => setViewMode("photo")}
                  className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-semibold"
                >
                  Switch to Photograph View
                </button>
              </div>
            )}

            {/* GLTF Loading Progress Overlay */}
            {gltfLoadingProgress !== null && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-3 z-20">
                <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-mono text-cyan-300">
                  Downloading Authentic 3D GLB Model ({gltfLoadingProgress}%)...
                </p>
              </div>
            )}

            {/* GLTF Error Banner if any */}
            {gltfLoadError && (
              <div className="absolute top-12 left-4 right-4 z-20 p-2.5 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-200 text-xs text-center font-mono">
                {gltfLoadError}
              </div>
            )}

            {/* Overlay Drag/Touch Hint */}
            <div className="absolute top-3 left-4 pointer-events-none flex items-center space-x-2 text-[10px] font-mono text-slate-400 bg-slate-950/70 px-2.5 py-1 rounded-full border border-slate-800/80 backdrop-blur-sm">
              <Rotate3d className="w-3.5 h-3.5 text-cyan-400" />
              <span>Click & Drag to Rotate 360° • Scroll to Zoom</span>
            </div>

            {/* Auto-Rotation Floating Toggle */}
            <button
              onClick={() => setIsRotating(!isRotating)}
              className="absolute top-3 right-4 z-10 flex items-center space-x-1.5 text-[11px] font-mono px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer backdrop-blur-md shadow-lg"
              title={isRotating ? "Pause auto-rotation" : "Start auto-rotation"}
            >
              {isRotating ? (
                <>
                  <Pause className="w-3 h-3 text-cyan-400" />
                  <span>Turntable Active</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 text-slate-400" />
                  <span>Resume Turntable</span>
                </>
              )}
            </button>

            {/* Headlights Toggle */}
            <button
              onClick={() => setHeadlightsOn(!headlightsOn)}
              className={`absolute bottom-3 left-4 z-10 flex items-center space-x-1.5 text-[11px] font-mono px-3 py-1.5 rounded-xl border transition-all cursor-pointer backdrop-blur-md shadow-lg ${
                headlightsOn
                  ? "bg-cyan-950/80 border-cyan-500/50 text-cyan-300"
                  : "bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white"
              }`}
              title="Toggle LED Headlights & Taillights"
            >
              <Sun className="w-3.5 h-3.5" />
              <span>LED Lamps: {headlightsOn ? "ON" : "OFF"}</span>
            </button>
          </div>

          {/* 3D Studio Footer Controls: Manufacturer Paint Colors + Disclosure */}
          <div className="p-4 bg-slate-950/80 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            {/* Color Customizer */}
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1.5 text-slate-400 font-medium">
                <Palette className="w-3.5 h-3.5 text-cyan-400" />
                <span>Finish:</span>
              </span>

              <div className="flex items-center space-x-2">
                {asset.colorOptions.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveColor(c.hex)}
                    className={`w-5 h-5 rounded-full border-2 transition-transform cursor-pointer ${
                      activeColor === c.hex ? "scale-125 border-cyan-400 ring-2 ring-cyan-500/30" : "border-slate-700 hover:scale-110"
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                    aria-label={`Select ${c.name} paint finish`}
                  />
                ))}
              </div>
            </div>

            {/* Switch back to verified genuine photo */}
            <button
              onClick={() => setViewMode("photo")}
              className="text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 font-mono text-[11px] cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>View Authentic High-Definition Photograph</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
}

/**
 * Builds realistic, proportioned automotive silhouette studio models for Malaysian market vehicles.
 */
function buildProceduralStudioModel(
  carGroup: THREE.Group,
  style: VehicleBodyStyle,
  initialColor: string,
  paintMatsRef: React.MutableRefObject<THREE.MeshPhysicalMaterial[]>,
  headlightMatsRef: React.MutableRefObject<THREE.MeshStandardMaterial[]>
) {
  // Clear any existing children
  while (carGroup.children.length > 0) {
    const obj = carGroup.children[0];
    carGroup.remove(obj);
  }

  // Authentic Physical Automotive Materials
  const paintMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(initialColor),
    metalness: 0.85,
    roughness: 0.22,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
  });
  paintMatsRef.current.push(paintMat);

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x050a12,
    transmission: 0.88,
    opacity: 0.88,
    transparent: true,
    roughness: 0.1,
    ior: 1.52,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.95,
    roughness: 0.1,
  });

  const blackTrimMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.7,
    metalness: 0.2,
  });

  const tireRubberMat = new THREE.MeshStandardMaterial({
    color: 0x111317,
    roughness: 0.85,
    metalness: 0.1,
  });

  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x7dd3fc,
    emissiveIntensity: 3.5,
  });
  headlightMatsRef.current.push(headlightMat);

  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xdc2626,
    emissiveIntensity: 3.0,
  });

  // Dimensional parameters according to body type
  let length = 4.4;
  let width = 1.82;
  let cabinStart = -0.5;
  let cabinEnd = 1.2;
  let cabinHeight = 0.58;

  if (style === "hatchback") {
    length = 3.9;
    width = 1.74;
    cabinStart = -0.85;
    cabinEnd = 0.95;
    cabinHeight = 0.64;
  } else if (style === "suv") {
    length = 4.45;
    width = 1.86;
    cabinStart = -0.85;
    cabinEnd = 1.1;
    cabinHeight = 0.68;
  } else if (style === "coupe") {
    length = 4.55;
    width = 1.88;
    cabinStart = -0.3;
    cabinEnd = 1.15;
    cabinHeight = 0.48;
  }

  // 1. Lower Chassis & Underbody
  const chassisGeo = new THREE.BoxGeometry(width * 0.96, 0.42, length * 0.98);
  const chassisMesh = new THREE.Mesh(chassisGeo, paintMat);
  chassisMesh.position.y = 0.45;
  chassisMesh.castShadow = true;
  chassisMesh.receiveShadow = true;
  carGroup.add(chassisMesh);

  // 2. Aerodynamic Upper Cabin / Greenhouse
  const cabinWidth = width * 0.82;
  const cabinLength = cabinEnd - cabinStart;
  const cabinGeo = new THREE.BoxGeometry(cabinWidth, cabinHeight, cabinLength);
  const cabinMesh = new THREE.Mesh(cabinGeo, glassMat);
  cabinMesh.position.set(0, 0.45 + 0.21 + cabinHeight / 2 - 0.05, (cabinStart + cabinEnd) / 2);
  cabinMesh.castShadow = true;
  carGroup.add(cabinMesh);

  // 3. Cabin Roof Panel
  const roofGeo = new THREE.BoxGeometry(cabinWidth * 0.94, 0.05, cabinLength * 0.85);
  const roofMesh = new THREE.Mesh(roofGeo, paintMat);
  roofMesh.position.set(0, 0.45 + 0.21 + cabinHeight - 0.02, (cabinStart + cabinEnd) / 2);
  roofMesh.castShadow = true;
  carGroup.add(roofMesh);

  // 4. Front Hood & Grille Nose
  const noseGeo = new THREE.BoxGeometry(width * 0.92, 0.35, length * 0.3);
  const noseMesh = new THREE.Mesh(noseGeo, paintMat);
  noseMesh.position.set(0, 0.44, length * 0.38);
  noseMesh.castShadow = true;
  carGroup.add(noseMesh);

  // Grille
  const grilleGeo = new THREE.BoxGeometry(width * 0.65, 0.16, 0.06);
  const grilleMesh = new THREE.Mesh(grilleGeo, blackTrimMat);
  grilleMesh.position.set(0, 0.4, length * 0.52 + 0.01);
  carGroup.add(grilleMesh);

  // 5. LED Headlight Clusters
  const hlWidth = width * 0.22;
  const leftHl = new THREE.Mesh(new THREE.BoxGeometry(hlWidth, 0.08, 0.1), headlightMat);
  leftHl.position.set(-width * 0.33, 0.47, length * 0.51);
  carGroup.add(leftHl);

  const rightHl = new THREE.Mesh(new THREE.BoxGeometry(hlWidth, 0.08, 0.1), headlightMat);
  rightHl.position.set(width * 0.33, 0.47, length * 0.51);
  carGroup.add(rightHl);

  // 6. LED Taillight Clusters
  const leftTl = new THREE.Mesh(new THREE.BoxGeometry(hlWidth * 0.9, 0.07, 0.08), taillightMat);
  leftTl.position.set(-width * 0.34, 0.52, -length * 0.48);
  carGroup.add(leftTl);

  const rightTl = new THREE.Mesh(new THREE.BoxGeometry(hlWidth * 0.9, 0.07, 0.08), taillightMat);
  rightTl.position.set(width * 0.34, 0.52, -length * 0.48);
  carGroup.add(rightTl);

  // 7. Wheels, Hubs, and Sport Rim Spokes
  const wheelRadius = style === "suv" ? 0.38 : 0.33;
  const wheelWidth = 0.22;
  const wheelPositions = [
    [-width * 0.47, wheelRadius, length * 0.32],
    [width * 0.47, wheelRadius, length * 0.32],
    [-width * 0.47, wheelRadius, -length * 0.32],
    [width * 0.47, wheelRadius, -length * 0.32],
  ];

  wheelPositions.forEach(([x, y, z]) => {
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(x, y, z);

    // Tire
    const tireGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 24);
    tireGeo.rotateZ(Math.PI / 2);
    const tireMesh = new THREE.Mesh(tireGeo, tireRubberMat);
    tireMesh.castShadow = true;
    wheelGroup.add(tireMesh);

    // Rim
    const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.72, wheelRadius * 0.72, wheelWidth * 1.05, 16);
    rimGeo.rotateZ(Math.PI / 2);
    const rimMesh = new THREE.Mesh(rimGeo, chromeMat);
    wheelGroup.add(rimMesh);

    carGroup.add(wheelGroup);
  });
}
