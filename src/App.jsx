import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";

export default function App() {
  const players = ["Meen", "Cho", "Faii"]; // รายชื่อผู้แข่งขัน

  const [scores, setScores] = useState(() => {
    const saved = localStorage.getItem("scores");
    return saved ? JSON.parse(saved) : { Meen: 0, Cho: 0, Faii: 0 };
  });

  const [roundResult, setRoundResult] = useState({
    first: "",
    second: "",
    third: "",
  });

  // LOAD saved
  useEffect(() => {
    const saved = localStorage.getItem("scores");
    if (saved) setScores(JSON.parse(saved));
  }, []);

  // SAVE on change
  useEffect(() => {
    localStorage.setItem("scores", JSON.stringify(scores));
  }, [scores]);

  const handleInput = (field, value) =>
    setRoundResult((r) => ({ ...r, [field]: value }));

  const handleSubmit = () => {
    if (!roundResult.first || !roundResult.second || !roundResult.third) return;
    const newScores = { ...scores };
    newScores[roundResult.first] += 2;
    newScores[roundResult.second] += 1;
    setScores(newScores);
    setRoundResult({ first: "", second: "", third: "" });
  };

  const downloadExcel = () => {
    const now = new Date();
    const pad = (n) => (n < 10 ? "0" + n : n);
    const timestamp =
      now.getFullYear() +
      "-" +
      pad(now.getMonth() + 1) +
      "-" +
      pad(now.getDate()) +
      "-" +
      pad(now.getHours()) +
      "-" +
      pad(now.getMinutes()) +
      "-" +
      pad(now.getSeconds());

    const data = Object.keys(scores).map((name) => ({
      Player: name,
      Score: scores[name],
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Scores");
    XLSX.writeFile(workbook, `scores-${timestamp}.xlsx`);
  };

  const uploadExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);
      const newScores = {};
      json.forEach((row) => {
        newScores[row.Player] = row.Score;
      });
      setScores(newScores);
    };
    reader.readAsBinaryString(file);
  };

  const clearScores = () => {
    if (!confirm("ต้องการล้างคะแนนทั้งหมดหรือไม่ ?")) return;
    const reset = { Meen: 0, Cho: 0, Faii: 0 };
    setScores(reset);
    localStorage.setItem("scores", JSON.stringify(reset));
  };

  // ---------------------- CIRCUIT ANIMATION (new system) -------------------------
  const colors = {
    Meen: "#eb1717ff",
    Cho: "#0ecc83ff",
    Faii: "#008cffff",
  };

  const maxScore = Math.max(...Object.values(scores), 1);

  // Visual params
  const TRACK_SIZE = 300; // px for container (w-80 -> 320px)
  const radius = (TRACK_SIZE - 8) / 2 - 4;
 // radius in px for circle within that svg/viewbox

  // We'll keep angles & trails in refs and update with requestAnimationFrame for smoothness
  const anglesRef = useRef({
    Meen: Math.PI * 0, // start angle same for all -> start from same place
    Cho: Math.PI * 0,
    Faii: Math.PI * 0,
  });

  // Trails: store arrays of points per player (in cartesian coords centered at 0,0)
  const trailsRef = useRef({
    Meen: [],
    Cho: [],
    Faii: [],
  });

  // A state to force re-render of visual elements (throttled by RAF loop)
  const [, setTick] = useState(0);
  const tickRef = useRef(0);

  // angles state snapshot for render (derived from refs; kept minimal)
  const [anglesSnapshot, setAnglesSnapshot] = useState({
    Meen: anglesRef.current.Meen,
    Cho: anglesRef.current.Cho,
    Faii: anglesRef.current.Faii,
  });

  useEffect(() => {
    let rafId = null;
    const lastTimeRef = { t: performance.now() };

    const loop = (time) => {
      const dt = (time - lastTimeRef.t) / 1000; // seconds
      lastTimeRef.t = time;

      // Update each player's angle based on score -> speed
      players.forEach((p) => {
        // base angular speed (radians per second)
        // make speed proportional to score fraction but keep sane base
        const scoreFraction = scores[p] / maxScore; // 0..1
        const minSpeed = 0.5; // rad/s (slow)
        const maxSpeed = 3.0; // rad/s (fast)
        const speed = minSpeed + scoreFraction * (maxSpeed - minSpeed);
        anglesRef.current[p] = (anglesRef.current[p] + speed * dt) % (Math.PI * 2);

        // compute cartesian coords
        const a = anglesRef.current[p];
        const x = Math.cos(a) * radius;
        const y = Math.sin(a) * radius;

        // Append to trail — length depends on score (requirement 1)
        // trailPoints = number of previous points to keep
        const baseTrailPoints = 20;
        const perScoreFactor = 0.6; // adjust how much score increases trail length
        const desiredPoints = Math.round(baseTrailPoints + scores[p] * perScoreFactor);
        const maxPoints = Math.max(40, desiredPoints); // minimum & scale cap
        const tArr = trailsRef.current[p];
        tArr.push({ x, y });
        // keep only the last N points
        if (tArr.length > maxPoints) tArr.splice(0, tArr.length - maxPoints);
      });

      // update snapshot and tick to re-render
      tickRef.current++;
      if (tickRef.current % 1 === 0) {
        setAnglesSnapshot({
          Meen: anglesRef.current.Meen,
          Cho: anglesRef.current.Cho,
          Faii: anglesRef.current.Faii,
        });
        setTick((t) => t + 1);
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scores]); // restart loop when scores object reference changes (safe)

  // Helper: produce SVG path "M x y L x y ..." from trail points
  const pathFromTrail = (pts) => {
    if (!pts || pts.length < 2) return "";
    // Smooth with simple quadratic bezier between segments (optional)
    // Simpler approach: use catmull-rom -> approximate with L for now (fast)
    return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  };

  // Render car at current angle
  const renderCar = (p) => {
    const a = anglesSnapshot[p] ?? anglesRef.current[p];
    const x = Math.cos(a) * radius;
    const y = Math.sin(a) * radius;
    // angle facing direction (tangent) — add 90deg to point "forward"
    const angleDeg = (a * 180) / Math.PI + 90;

    // blur amount dynamic (motion blur) proportional to score fraction
    const blurAmount = (scores[p] / maxScore) * 6; // 0 .. 6 px
    const scale = 1.05 + (scores[p] / maxScore) * 0.15;

    return (
      <div
        key={p}
        style={{
          position: "absolute",
          left: `calc(50% + ${x}px)`,
          top: `calc(50% + ${y}px)`,
          transform: `translate(-50%, -50%) rotate(${angleDeg}deg)`,
          width: 28,
          height: 28,
          pointerEvents: "none",
          zIndex: 40,
        }}
      >
        <motion.div
          animate={{
            x: [ -3, 3, -3 ].map((v) => v * (0.6 + (scores[p] / maxScore) * 0.7)), // subtle local sway scaled by speed
          }}
          transition={{
            repeat: Infinity,
            duration: 1.2,
            ease: "easeInOut",
          }}
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Car circle */}
          <div
            style={{
              width: 15,
              height: 15,
              borderRadius: 999,
              background: colors[p],
              boxShadow: `0 0 ${Math.max(6, blurAmount * 2)}px ${colors[p]}`,
              filter: `blur(${blurAmount}px)`,
              transform: `scale(${scale})`,
            }}
          />
        </motion.div>
      </div>
    );
  };

  // Render trails as SVG paths (centered at middle of track)
  const renderTrailsSVG = () => {
    // prepare defs for glow
    return (
      <svg className=""
        width="100%"
        height="100%"
        viewBox={`-${TRACK_SIZE / 2} -${TRACK_SIZE / 2} ${TRACK_SIZE} ${TRACK_SIZE}`}
        style={{ position: "absolute", inset: 0, zIndex: 20}}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="6" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="g1" x1="0" x2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* draw each player's path */}
        {players.map((p) => {
          const pts = trailsRef.current[p];
          if (!pts || pts.length < 2) return null;

          const d = pathFromTrail(pts);
          // stroke width can scale with score a bit
          const strokeW = 6 + (scores[p] / maxScore) * 4;
          const opacity = 0.28 + (scores[p] / maxScore) * 0.5;

          return (
            <g key={p} transform="">
              <path
                d={d}
                stroke={colors[p]}
                strokeWidth={strokeW}
                strokeOpacity={opacity}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow)"
              />
              {/* inner sharper core */}
              <path
                d={d}
                stroke="white"
                strokeWidth={Math.max(1, strokeW * 0.25)}
                strokeOpacity={0.6}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ mixBlendMode: "screen" }}
              />
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white ">
      <div className="absolute bottom-4 right-4 items-center p-6">

        {/* Top: TRACK + SVG trails + cars */}
        <div className="flex justify-center mb-6">
          <div
            className="relative rounded-full shadow-inner"
            style={{
              width: TRACK_SIZE-8,
              height: TRACK_SIZE -8,
              border: "6px solid rgba(100, 100, 100, 0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                "radial-gradient(circle at center, rgba(255, 255, 255, 0.1), rgba(0, 0, 0, 0.86))",
              overflow: "hidden",
            }}
          >
            {/* SVG Trails (absolute) */}
            {renderTrailsSVG()}

            {/* center marker */}
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: 6,
                height: 6,
                transform: "translate(-50%,-50%)",
                borderRadius: 999,
                background: "rgba(255,255,255,0.06)",
                zIndex: 5,
              }}
            />

            {/* cars rendered above SVG */}
            {players.map((p) => renderCar(p))}
          </div>
        </div>
        <h3 className="text-center text-xl font-bold mb-4">ระบบเก็บคะแนนผู้แข่งขัน</h3>

      {/* คะแนนรวม */}
      <div className="grid grid-cols-3 gap-3 mb-4 w-full max-w-xl">
        {players.map((p) => (
          <div key={p} className={`block group text-center `}>
            <div className={`relative rounded-xl p-3 cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-300 overflow-hidden
              ${p === 'Meen' ? 'bg-gradient-to-br from-red-800 to-red-500' 
              : p === 'Cho' ? 'bg-gradient-to-br from-green-800 to-green-500' 
              : 'bg-gradient-to-br from-blue-800 to-blue-500'}`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500"></div>
              <h2 className="text-md font-semibold">{p}</h2>
              <motion.p key={scores[p]} initial={{ scale: 1 }} animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 0.4 }} className="text-3xl font-bold">
                {scores[p]}
              </motion.p>
            </div>
          </div>
        ))}
        
      </div>
        <div className="grid grid-cols-3 gap-3 mb-4 w-full max-w-xl">

          {/* ปุ่มอัปโหลด */}
          <label className="bg-blue-700/20 hover:bg-blue-700/40 p-1 rounded-lg text-blue-700 text-xs font-bold text-center cursor-pointer hover:scale-[1.02] transition-all duration-300 overflow-hidden">
            <i class="fi fi-rr-add "></i> อัปโหลด
            <input
              type="file"
              accept=".xlsx, .xls"
              className="hidden"
              onChange={uploadExcel}
            />
          </label>

          {/* ปุ่มดาวน์โหลด */}
          <button
            className=" bg-green-500/20 hover:bg-green-500/40 p-1 rounded-lg text-green-500 text-xs font-bold hover:scale-[1.02] transition-all duration-300 overflow-hidden"
            onClick={downloadExcel}
          >
            <i class="fi fi-rr-download"></i> ดาวน์โหลด
          </button>

          <button
            className=" bg-red-500/20 hover:bg-red-500/40 p-1 rounded-lg text-red-500 text-xs font-bold hover:scale-[1.02] transition-all duration-300 overflow-hidden"
            onClick={clearScores}
          >
            <i class="fi fi-rr-trash"></i>ล้างคะแนน
          </button>

        </div>

      {/* เลือกผลรอบ */}
      <div className="block group  w-full max-w-xs ">
        <div className="relative p-6 rounded-2xl shadow-xl space-y-4 bg-white hover:shadow-lg hover:scale-[1.02] transition-all duration-300 overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gray-300 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500"></div>
      <h2 className="text-gray-900 text-md font-bold mb-4 text-center">ผลการแข่งขันรอบนี้</h2>


      <select className="w-full text-sm p-2 text-gray-900 bg-gray-400 rounded-xl"
      value={roundResult.first} onChange={(e) => handleInput("first", e.target.value)}
      >
      <option value="">เลือกผู้ชนะ (2 คะแนน)</option>
      {players.map((p) => (
      <option key={p} value={p} disabled={p === roundResult.second || p === roundResult.third }> {p} </option>
      ))}
      </select>


      <select className="w-full p-2 text-sm text-gray-900 bg-gray-400 rounded-xl"
      value={roundResult.second} onChange={(e) => handleInput("second", e.target.value)}
      >
      <option value="">เลือกอันดับ 2 (1 คะแนน)</option>
      {players.map((p) => (
      <option key={p} value={p} disabled={p === roundResult.first || p === roundResult.third}> {p} </option>
      ))}
      </select>


      <select className="w-full p-2 text-sm text-gray-900 bg-gray-400 rounded-xl"
      value={roundResult.third} onChange={(e) => handleInput("third", e.target.value)}
      >
      <option value="">เลือกอันดับ 3 (0 คะแนน)</option>
      {players.map((p) => (
      <option key={p} value={p} disabled={p === roundResult.first || p === roundResult.second}> {p} </option>
      ))}
      </select>


      <button className="w-full text-xs bg-green-600 hover:bg-green-700 p-3 rounded-xl font-bold mt-4"
      onClick={handleSubmit}>บันทึกคะแนน</button>
      </div>
      
      
      </div>
      </div>
      </div>

  );
}
