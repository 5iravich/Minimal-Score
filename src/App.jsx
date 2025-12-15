import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";
import pattern from "/src/assets/pattern.svg";

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

  const handleSubmit = () => {
  if (!roundResult.first || !roundResult.second || !roundResult.third) return;

  const newScores = { ...scores };
  newScores[roundResult.first] += 2;
  newScores[roundResult.second] += 1;

  // บันทึกลง history
  const newRound = {
    time: new Date().toLocaleString(),
    first: roundResult.first,
    second: roundResult.second,
    third: roundResult.third,
  };

  setHistory((h) => [...h, newRound]);
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


  const clearScores = () => {
    if (!confirm("ต้องการล้างคะแนนทั้งหมดหรือไม่ ?")) return;
    const reset = { Meen: 0, Cho: 0, Faii: 0 };
    setScores(reset);
    localStorage.setItem("scores", JSON.stringify(reset));
  };

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


  return (
    <div className="min-h-screen bg-gray-950 text-white ">

      <div className="">
        {/* SCORE GRAPH */}
      <div className="flex-1 w-full max-w-4xl mx-auto bg-gray-900 p-4">

        <div className="w-full h-180">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} >
              <defs>
                <linearGradient id="speed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
                  <stop offset="50%" stopColor="rgba(255,255,255,0.05)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.35)" />
                </linearGradient>
              </defs>
              <Tooltip />

              <Bar dataKey="score">
                {chartData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.color}
                    style={{
                      animation: "speedMove 1.2s linear infinite",
                    }}
                  />
                ))}
                {/* แสดงตัวเลขบนหัวแท่ง */}
                <LabelList
                  dataKey="score"
                  position="top"
                  className="fill-white text-sm font-bold"
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      </div>
      

      <div className="absolute bottom-4 right-4 items-center p-6">
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


      <button className="w-full text-xs bg-green-600 hover:bg-green-700 p-3 rounded-xl font-bold"
      onClick={handleSubmit}>บันทึกคะแนน</button>
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
  <button
    onClick={() => setShowHistory((s) => !s)}
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
    <h2 className="text-lg font-semibold mb-3">ประวัติการแข่งขัน</h2>

    {history.length === 0 ? (
      <div className="text-gray-400 text-sm mt-3">ยังไม่มีประวัติ</div>
    ) : (
      <div className="space-y-3 overflow-y-auto max-h-[90vh] pr-2">
        {history
          .slice()
          .reverse()
          .map((r, i) => (
            <div key={i} className="block group p-2 overflow-hidden">
              <div className="relative p-3 text-sm hover:shadow-lg bg-white/5 rounded-xl border border-l-5  border-l-red-500 border-white/10 hover:scale-[1.02] transition-all duration-300 overflow-hidden">
                <div className="absolute top-0 right-0 w-15 h-15 bg-red-500/10 rounded-xl -mr-12 -mb-12 group-hover:scale-150 transition-transform duration-500"></div>
                <img className="absolute opacity-20 -z-100 scale-300 group-hover:scale-350 transition-transform duration-500" src={pattern} alt="pattern" />
              <div className="text-gray-300 text-xs mb-1">{r.time}</div>
              <div className="flex justify-center my-3">
                <div className="py-2 px-3 font-medium text-gray-900 border-1 border-red-300 rounded-l-2xl bg-white">🥇 {r.first}</div>
                <div className="py-2 px-3 font-medium text-gray-900 border-1 border-red-300 bg-white">🥇 {r.second}</div>
                <div className="py-2 px-3 font-medium text-gray-900 border-1 border-red-300 rounded-r-2xl bg-white">🥉 {r.third}</div>
              </div>
              

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
        <div className="w-full text-center text-xs text-gray-400">
          พัฒนาโดยคุณ 5iravich และสร้างสรรค์โดย Mindy — ข้อมูลเก็บในเครื่อง (localStorage) • Export/Import เป็นไฟล์ Excel (Scores + History)
        </div>
      </div>

  );
}
