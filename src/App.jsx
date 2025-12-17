import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";
import logo from "/src/menu.png"
import pattern from "/src/assets/pattern.svg";
import carRed from "/src/assets/Meen.png";
import carGreen from "/src/assets/Cho.png";
import carBlue from "/src/assets/Faii.png";
import circuit from "/src/assets/Japan_Circuit.avif"
import loop from "/src/assets/223594.gif"
import finish from "/src/assets/checker.jpg"

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Cell } from "recharts";

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

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("history");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("history", JSON.stringify(history));
  }, [history]);

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

  //คำนวนคะแนน - โบนัส
  const isBonusTime = () => {
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();

    const start = 16 * 60 + 15; // 16:15
    const end = 16 * 60 + 35;   // 16:35

    return minutes >= start && minutes <= end;
  };
  
  // บันทึกคะแนน
  const handleSubmit = () => {
    if (!roundResult.first || !roundResult.second || !roundResult.third) return;

    const newScores = { ...scores };
    const isBonus = isBonusTime();
    const bonus = isBonusTime() ? 2 : 1;

    newScores[roundResult.first] += 2 * bonus;
    newScores[roundResult.second] += 1 * bonus;

    // 🥉 ที่ 3 ได้แต้มเฉพาะช่วงโบนัส
    if (isBonus) {
      newScores[roundResult.third] += 1;
    }

    // บันทึกลง history
    const newRound = {
      time: new Date().toLocaleString(),
      first: roundResult.first,
      second: roundResult.second,
      third: roundResult.third,
      bonus: isBonusTime(),
    };

      setHistory((h) => [...h, newRound]);
      setScores(newScores);

      setRoundResult({ first: "", second: "", third: "" });
  };

   // ดาวน์โหลด Excel
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

    // Sheet 1: คะแนนรวม
    const scoreSheet = XLSX.utils.json_to_sheet(
      Object.keys(scores).map((name) => ({
        Player: name,
        Score: scores[name],
      }))
    );

    // Sheet 2: ประวัติการแข่งขัน
    const historySheet = XLSX.utils.json_to_sheet(history);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, scoreSheet, "Scores");
    XLSX.utils.book_append_sheet(workbook, historySheet, "History");

    XLSX.writeFile(workbook, `scores-${timestamp}.xlsx`);
  };

  // อัปโหลด Excel
  const uploadExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target.result;
      const workbook = XLSX.read(data, { type: "binary" });

      // อ่าน Sheet คะแนนรวม
      if (workbook.Sheets["Scores"]) {
        const json = XLSX.utils.sheet_to_json(workbook.Sheets["Scores"]);
        const newScores = {};
        json.forEach((row) => {
          newScores[row.Player] = row.Score;
        });
        setScores(newScores);
      }

      // อ่าน Sheet ประวัติ
      if (workbook.Sheets["History"]) {
        const json2 = XLSX.utils.sheet_to_json(workbook.Sheets["History"]);
        setHistory(json2);
      }
    };
    reader.readAsBinaryString(file);
  };

  //ล้างคะแนน
  const clearScores = () => {
    if (!confirm("ต้องการล้างคะแนนทั้งหมดหรือไม่ ?")) return;
    const reset = { Meen: 0, Cho: 0, Faii: 0 };
    setScores(reset);
    localStorage.setItem("scores", JSON.stringify(reset));
  };

  //ประวัติการแข่งขัน
  const [showHistory, setShowHistory] = useState(() => {
    const saved = localStorage.getItem("showHistory");
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem("showHistory", JSON.stringify(showHistory));
  }, [showHistory]);

  const chartData = players.map((p) => ({
    name: p,
    score: scores[p],
    color:
      p === "Meen"
        ? "#ef4444"
        : p === "Cho"
        ? "#22c55e"
        : "#3b82f6",
  }));

  const totalRounds = history.length;

  const winRate = (player) => {
    if (totalRounds === 0) return 0;
    const wins = history.filter((h) => h.first === player).length;
    return Math.round((wins / totalRounds) * 100);
  };

  const bestWinRate = Math.max(...players.map((p) => winRate(p)));

  const isTopWinner = (player) => {
    return winRate(player) === bestWinRate && bestWinRate > 0;
  };

  function WinRateCircle({ percent, color, glow }) {
    const radius = 34;
    const stroke = 6;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percent / 100) * circumference;

    return (
      <motion.svg
        height={radius * 2}
        width={radius * 2}
        animate={
          glow
            ? { scale: [1, 1.08, 1] }
            : { scale: 1 }
        }
        transition={
          glow
            ? { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
            : {}
        }
      >
        {/* Background */}
        <circle
          stroke="rgba(10, 10, 10, 0.45)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />

        {/* Glow layer */}
        {glow && (
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={stroke + 4}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            opacity={0.35}
            filter="blur(6px)"
          />
        )}

        {/* Progress */}
        <motion.circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />

        {/* Text */}
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fill="white"
          fontSize="12"
          fontWeight="bold"
        >
          {percent}%
        </text>
      </motion.svg>
    );
  }

  const [bonusAlert, setBonusAlert] = useState(false);

  useEffect(() => {
    const checkBonusTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();

      // เข้า 16:15 พอดี
      if (hours === 16 && minutes === 15) {
        const alerted = localStorage.getItem("bonusAlerted");

        if (!alerted) {
          setBonusAlert(true);
          localStorage.setItem("bonusAlerted", "true");
        }
      }

      // รีเซ็ตวันถัดไป
      if (hours === 0 && minutes === 0) {
        localStorage.removeItem("bonusAlerted");
      }
    };

    const interval = setInterval(checkBonusTime, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

const getBonusRemaining = () => {
  const now = new Date();
  const current =
    now.getHours() * 60 * 60 +
    now.getMinutes() * 60 +
    now.getSeconds();

  const end = 16 * 60 * 60 + 35 * 60; // 16:35

  return Math.max(end - current, 0);
};

const [bonusRemain, setBonusRemain] = useState(0);

useEffect(() => {
  const timer = setInterval(() => {
    if (isBonusTime()) {
      setBonusRemain(getBonusRemaining());
    } else {
      setBonusRemain(0);
    }
  }, 1000);

  return () => clearInterval(timer);
}, []);

const formatTime = (sec) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${h.toString().padStart(2, "0")}:${m
    .toString()
    .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

const isCritical = bonusRemain > 0 && bonusRemain < 60;

const getWinStreaks = () => {
  const streaks = {};
  players.forEach(p => (streaks[p] = 0));

  let currentWinner = null;
  let currentStreak = 0;

  history.forEach((round) => {
    if (round.first === currentWinner) {
      currentStreak++;
    } else {
      currentWinner = round.first;
      currentStreak = 1;
    }

    streaks[currentWinner] = Math.max(
      streaks[currentWinner],
      currentStreak
    );
  });

  return streaks;
};

const winStreaks = getWinStreaks();

const bestStreak = Math.max(...Object.values(winStreaks));
const streakLeader = players.filter(
  (p) => winStreaks[p] === bestStreak && bestStreak > 0
);

const leftOffsetMap = {
  Meen: -3.33,   // %
  Cho: -3.33,
  Faii: -3.33,
};

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">
      <img src={loop} alt="loop" className="min-h-screen scale-150 opacity-10 " />

      {/* ******************* แจ้งเตือนเวลาโบนัส ******************* */}
      {bonusAlert && (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center">
          <div className="block group">
            <div className="relative rounded-xl cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-300 overflow-hidden">              
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-6 rounded-2xl shadow-2xl text-center max-w-sm">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500"></div>
                <h2 className="text-2xl font-extrabold mb-2 text-black">⚡ เวลาโบนัสมาแว้วววววววววว!</h2>
                <p className="text-black font-semibold mb-4">ตั้งแต่เวลา 16:15 – 16:35 น. คะแนนที่ได้จะคูณสอง</p>
                <button onClick={() => setBonusAlert(false)} className="bg-black hover:bg-black/70 text-white px-4 py-2 rounded-xl font-bold hover:scale-105 transition">
                  เข้าใจแล้ว
                </button>
              </div>
            </div> 
          </div>
        </motion.div>
      )}
      {/* ******************* *************** ******************* */}
      
      <div className="fixed inset-0 flex items-center justify-center">
      
      {/* ******************* SCORE GRAPH ******************* */}
        <div className="flex-1 w-full max-w-4xl mx-auto bg-gray-900/30 p-4">
          <div className="relative w-full h-[850px]">
            {/* 🏁 FINISH LINE (Checkered) */}
            <div className="absolute left-0 w-full z-20 pointer-events-none">
              <div className="relative h-[28px] flex items-center">
                <img src={finish} alt="race" className="w-full h-5" />
              </div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                barCategoryGap={60}
                margin={{ top: 80, right: 0, left: 0, bottom: 20 }}
              >
                <XAxis dataKey="name" hide />
                <YAxis hide />

                <Bar dataKey="score" barSize={60}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* 🚗 Overlay รถ */}
            {chartData.map((d, index) => {
              const maxScore = Math.max(...chartData.map(x => x.score), 1);
              const heightRatio = d.score / maxScore;

              const leftPercent = ((index + 0.333) / chartData.length) * 100-3;
              const bottomPercent = heightRatio; // ความสูงแท่ง

              const carMap = {
                Meen: carRed,
                Cho: carGreen,
                Faii: carBlue,
              };

              return (
                <motion.img
                  key={d.name}
                  src={carMap[d.name]}
                  className="absolute w-[200px] h-[130px] mb-5 pointer-events-none list-none "
                  animate={{
                    left: `${leftPercent + (leftOffsetMap[d.name] ?? 0)}%`,
                    bottom: `${bottomPercent}%`,
                  }}
                  style={{
                    transform: "translateX(-72%)", 
                    rotate: 90,
                    listStyle: "none",      // 👈 กัน bullet
                    display: "block", 
                  }}
                />
              );
            })}
          </div>
                    <div className="mt-6 text-center text-xs text-gray-400">
            พัฒนาโดยคุณ 5iravich และสร้างสรรค์โดย Mindy — ข้อมูลเก็บในเครื่อง (localStorage) • Export/Import เป็นไฟล์ Excel (Scores + History)
          </div>
        </div>

        
        {/* ******************* *************** ******************* */}

      </div>
        <div className="absolute top-6 right-6 hover:rotate-360 z-10 transition-all duration-300">
          <img src={logo} alt="circuit" className="w-[60px]"/>
        </div>
        <div className="absolute top-10 right-4">
          <img src={circuit} alt="circuit" className="w-[400px]"/>
        </div>
      <div className="absolute bottom-4 right-4 items-center p-6">
        
      <div>
        {bonusRemain > 0 && (
          <div className="flex justify-center mb-2">
            <div className={`px-4 py-2 rounded-full font-bold border ${isCritical ? " bg-red-500/20 border-red-400 text-red-400 animate-pluse" : "bg-yellow-500/20 border-yellow-400 text-yellow-300 animate-pluse"}
      `} style={isCritical ? { animation: "shake 0.4s infinite" } : {}}
    >
              🔥 โบนัสกำลังทำงาน เหลือเวลา {formatTime(bonusRemain)}
            </div>
          </div>
        )}
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
              <motion.p
                key={scores[p]}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 0.4 }}
                className="text-3xl font-bold mb-2"
              >
                {scores[p]}
              </motion.p>

              <p className="text-xs mt-1 opacity-70">อัตราชนะ</p>
              <div className="flex justify-center">
                <WinRateCircle
                percent={winRate(p)}
                color={
                  p === "Meen"
                    ? "#ef4444"
                    : p === "Cho"
                    ? "#22c55e"
                    : "#3b82f6"
                }
                glow={isTopWinner(p)}
              />
              </div>
              {winStreaks[p] > 1 && (
                <p className="text-xs mt-1 text-yellow-400 font-semibold transition-all duration-300">
                  🔥 ชนะติด {winStreaks[p]} รอบ
                </p>
              )}
              {winStreaks[p] <= 1 && (
                <p className="text-xs mt-1 text-white-400 font-semibold transition-all duration-300">
                  พยายามเข้า
                </p>
              )}
            </div>
          </div>
        ))}
        
      </div>
        <div className="grid grid-cols-3 gap-3 mb-4 w-full max-w-xl">

          {/* ปุ่มอัปโหลด */}
          <label className="bg-blue-700/20 hover:bg-blue-700/40 p-1 rounded-lg text-blue-700 text-xs font-bold text-center cursor-pointer hover:scale-[1.02] transition-all duration-300 overflow-hidden">
            <i className="fi fi-rr-add "></i> อัปโหลด
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
            <i className="fi fi-rr-download"></i> ดาวน์โหลด
          </button>

          <button
            className=" bg-red-500/20 hover:bg-red-500/40 p-1 rounded-lg text-red-500 text-xs font-bold hover:scale-[1.02] transition-all duration-300 overflow-hidden"
            onClick={clearScores}
          >
            <i className="fi fi-rr-trash"></i>ล้างคะแนน
          </button>

        </div>

      {/* เลือกผลรอบ */}
      <div className="block group  w-full max-w-xs ">
        <div className="relative p-6 rounded-2xl shadow-xl space-y-4 bg-white hover:shadow-lg hover:scale-[1.02] transition-all duration-300 overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gray-300 rounded-full -mr-12 -mt-12 -z-10 group-hover:scale-150 transition-transform duration-500"></div>
      <h2 className="text-gray-900 text-md font-bold mb-4 text-center">ผลการแข่งขันรอบนี้</h2>


      <select className="w-full text-sm p-2 text-gray-900 bg-gray-400 rounded-xl"
      value={roundResult.first} onChange={(e) => handleInput("first", e.target.value)}>
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

      <div className="relative w-full z-10 text-center text-xs bg-green-600 hover:bg-green-700 p-3 rounded-xl font-bold"
      onClick={handleSubmit}>บันทึกคะแนน</div>
        <div className="flex">
          <i className="fi fi-rr-info text-sky-600 font-bold mr-2"></i>
          <p className="text-[0.8rem] text-sky-600">คะแนนจะบันทึกไว้ภายในเครื่องของท่าน หากมีการเคลียแคชอาจทำให้คะแนนหายได้</p>
        </div>
      
      </div>
      
      
      </div>

      {/* History list (Collapsible) */}
{/* LEFT SIDEBAR HISTORY PANEL */}
<motion.div
  className="fixed top-0 left-0 h-full w-90 backdrop-blur-sm p-4 z-50"
  initial={false}
  animate={{ width: showHistory ? 390 : 60 }}
  transition={{ duration: 0.3 }}
>

  {/* Toggle button */}
  <button onClick={() => setShowHistory((s) => !s)}
    className="w-full p-2 px-5 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center mb-4 transition"
  >
    {showHistory ? (
      <span className="text-sm">◀</span>
    ) : (
      <span className="text-sm">▶</span>
    )}
  </button>

  {/* Content inside panel */}
  <motion.div
    initial={false}
    animate={{ opacity: showHistory ? 1 : 0 }}
    transition={{ duration: 0.2 }}
    style={{ pointerEvents: showHistory ? "auto" : "none" }}
  >
    <h2 className="text-lg font-semibold mb-3">ประวัติการแข่งขัน <a className="ml-2 text-xs">( ทั้งหมด {totalRounds} รอบ )</a> </h2>
    

    {history.length === 0 ? (
      <div className="text-gray-400 text-sm mt-3">ยังไม่มีประวัติ</div>
    ) : (
      <div className="space-y-3 overflow-y-auto max-h-[90vh] pr-2 transition-all duration-300 custom-scrollbar">
        {history
          .slice()
          .reverse()
          .map((r, i) => (
            <div key={i} className="block group p-2 overflow-hidden ">
              <div className="relative p-3 text-sm hover:shadow-lg bg-white/5 rounded-xl border border-l-5  border-l-red-500 border-white/10 hover:scale-[1.02] transition-all duration-300 overflow-hidden">
                <div className="absolute top-0 right-0 w-15 h-15 bg-red-500/10 rounded-xl -mr-12 -mb-12 group-hover:scale-150 transition-transform duration-500"></div>
                <img className="absolute opacity-20 -z-100 scale-300 group-hover:scale-350 transition-transform duration-500" src={pattern} alt="pattern" />
              <div className="text-gray-300 text-xs mb-3">{r.time}</div>
              <div className="flex justify-center">
                <div className="py-2 px-3 font-medium text-xs text-gray-900 border-1 border-red-300 rounded-l-2xl bg-white">🥇 {r.first}</div>
                <div className="py-2 px-3 font-medium text-xs text-gray-900 border-1 border-red-300 bg-white">🥇 {r.second}</div>
                <div className="py-2 px-3 font-medium text-xs text-gray-900 border-1 border-red-300 rounded-r-2xl bg-white">🥉 {r.third}</div>
              </div>
              {r.bonus && (
                <div className="text-xs text-yellow-400 font-bold text-center mt-2">
                  ⚡ PEAK TIME ZONE // BONUS TIME x 2
                </div>
              )}
              

              {/* <div className="flex gap-2 mt-2">
                <button
                  className="px-2 py-1 bg-white/10 rounded text-xs"
                  onClick={() => {
                    if (!confirm("นำคะแนนรอบนี้มาบันทึกเพิ่ม ?")) return;
                    const newScores = { ...scores };
                    newScores[r.first] += 2;
                    newScores[r.second] += 1;
                    setScores(newScores);
                  }}
                >
                  +apply
                </button>

                <button
                  className="px-2 py-1 bg-red-500/30 rounded text-xs"
                  onClick={() => {
                    if (!confirm("ลบรอบนี้ ?")) return;
                    setHistory((h) => h.filter((x, idx) => idx !== history.length - 1 - i));
                  }}
                >
                  ลบ
                </button>
              </div> */}
              </div>
              
            </div>
          ))}
      </div>
    )}
  </motion.div>
</motion.div>

        
      </div>
        
      </div>

  );
}
