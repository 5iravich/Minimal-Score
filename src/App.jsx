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
  
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
  const timer = setTimeout(() => {
    setIsLoading(false);
  }, 2500); // ⏱ ปรับเวลาได้
    return () => clearTimeout(timer);
}, []);

  function LoadingScreen({ carRed, carGreen, carBlue }) {
  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-950 overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* แสงวิ่ง */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />

      {/* รถวิ่ง */}
      <div className="relative w-full max-w-md h-40">
        <motion.img
          src={carRed}
          className="absolute w-28 mx-10 rotate-90"
          initial={{ x: -200 }}
          animate={{ x: 420 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
        />
        <motion.img
          src={carGreen}
          className="absolute w-28 mx-40 rotate-90 top-10"
          initial={{ x: -260 }}
          animate={{ x: 420 }}
          transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
        />
        <motion.img
          src={carBlue}
          className="absolute w-28 mx-70 rotate-90 top-20"
          initial={{ x: -320 }}
          animate={{ x: 420 }}
          transition={{ repeat: Infinity, duration: 1.6, ease: "linear" }}
        />
      </div>

      {/* ข้อความ */}
      <div className="absolute bottom-24 text-center">
        <motion.div
          className="text-xl font-extrabold tracking-widest"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
        >
          กำลังโหลดทรัพยากร
        </motion.div>
        <div className="text-xs text-gray-400 mt-2">
          เตรียมความพร้อมสนาม...
        </div>
      </div>
    </motion.div>
  );
}

  const players = ["Meen", "Cho", "Faii"]; // รายชื่อผู้แข่งขัน

  const firstPlaceColorMap = {
  Meen: "border-l-red-500 bg-red-500/10",
  Cho: "border-l-green-500 bg-green-500/10",
  Faii: "border-l-blue-500 bg-blue-500/10",
};

 const OPlaceColorMap = {
  Meen: "bg-red-500/10",
  Cho: "bg-green-500/10",
  Faii: "bg-blue-500/10",
};

 const ScoreMap = {
  Meen: "border-red-900",
  Cho: "border-green-900",
  Faii: "border-blue-900",
};


  // เริ่มคะแนน
  const [scores, setScores] = useState(() => {
    const saved = localStorage.getItem("scores");
    return saved ? JSON.parse(saved) : { Meen: 0, Cho: 0, Faii: 0 };
  });
  
  // อันดับคะแนน
  const [roundResult, setRoundResult] = useState({
    first: "",
    second: "",
    third: "",
  });

  // ประวัติคะแนน
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("history");
    return saved ? JSON.parse(saved) : [];
  });

  // โหลดประวัติคะแนน
  useEffect(() => {
    localStorage.setItem("history", JSON.stringify(history));
  }, [history]);

  // โหลดบันทึก
  useEffect(() => {
    const saved = localStorage.getItem("scores");
    if (saved) setScores(JSON.parse(saved));
  }, []);

  // บันทึกคะแนน
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
  // const handleSubmit = () => {
  //   if (!roundResult.first || !roundResult.second || !roundResult.third) return;

  //   const newScores = { ...scores };
  //   const isBonus = isBonusTime();
  //   const bonus = isBonusTime() ? 2 : 1;

  //   newScores[roundResult.first] += 2 * bonus;
  //   newScores[roundResult.second] += 1 * bonus;

  //   // 🥉 ที่ 3 ได้แต้มเฉพาะช่วงโบนัส
  //   if (isBonus) {
  //     newScores[roundResult.third] += 1;
  //   }

  //   // บันทึกลง history
  //   const newRound = {
  //     time: new Date().toLocaleString(),
  //     first: roundResult.first,
  //     second: roundResult.second,
  //     third: roundResult.third,
  //     bonus: isBonusTime(),
  //   };

  //     setHistory((h) => [...h, newRound]);
  //     setScores(newScores);

  //     setRoundResult({ first: "", second: "", third: "" });
  // };
  const [explosion, setExplosion] = useState(null);

  const handleSubmit = () => {
  if (!roundResult.first || !roundResult.second || !roundResult.third) return;

  const prevHistory = [...history];
  const prevWinner =
    prevHistory.length > 0 ? prevHistory[prevHistory.length - 1].first : null;

  const prevStreak =
    prevWinner ? getCurrentWinStreak(prevWinner) : 0;

  // 👉 ถ้ามีคนชนะติด ≥ 3 และรอบนี้แพ้
  if (
    prevWinner &&
    prevStreak >= 3 &&
    roundResult.first !== prevWinner
  ) {
    setExplosion({
      loser: prevWinner,
      winner: roundResult.first,
    });
  }

  const newScores = { ...scores };
  const isBonus = isBonusTime();
  const bonus = isBonus ? 2 : 1;

  newScores[roundResult.first] += 2 * bonus;
  newScores[roundResult.second] += 1 * bonus;
  if (isBonus) newScores[roundResult.third] += 1;

  const newRound = {
    time: new Date().toLocaleString(),
    first: roundResult.first,
    second: roundResult.second,
    third: roundResult.third,
    bonus: isBonus,
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
  const [preBonusCountdown, setPreBonusCountdown] = useState(null);


  useEffect(() => {
  const interval = setInterval(() => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const s = now.getSeconds();

    // ⏱ ก่อนเข้าโบนัส 10 วิ (16:14:50 - 16:14:59)
    if (h === 16 && m === 14 && s >= 50) {
      setPreBonusCountdown(60 - s); // 10 → 1
    } else {
      setPreBonusCountdown(null);
    }

    // ⚡ เข้าโบนัส 16:15
    if (h === 16 && m === 15) {
      const alerted = localStorage.getItem("bonusAlerted");
      if (!alerted) {
        setBonusAlert(true);
        localStorage.setItem("bonusAlerted", "true");
      }
    }

    // รีเซ็ตวันถัดไป
    if (h === 0 && m === 0) {
      localStorage.removeItem("bonusAlerted");
    }
  }, 1000);

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
  Meen: -3.40,   // %
  Cho: -3.33,
  Faii: -3.33,
};

const getPlayerStats = (player) => {
  const first = history.filter((h) => h.first === player).length;
  const second = history.filter((h) => h.second === player).length;
  const third = history.filter((h) => h.third === player).length;

  const total = history.length;
  const winRate = total === 0 ? 0 : Math.round((first / total) * 100);

  return { first, second, third, winRate };
};

const [activePlayer, setActivePlayer] = useState(null);

const getSortedPlayersByScore = () => {
  return [...players].sort((a, b) => scores[b] - scores[a]);
};

const getLeader = () => getSortedPlayersByScore()[0];
const getSecond = () => getSortedPlayersByScore()[1];

const getGapFromLeader = (player) => {
  return scores[getLeader()] - scores[player];
};

const getLeadOverSecond = (player) => {
  if (player !== getLeader()) return 0;
  return scores[player] - scores[getSecond()];
};

const getTrendIcon = (player) => {
  const last5 = history.slice(-5);

  if (last5.length < 2) return "➖";

  let trend = 0;
  last5.forEach((r) => {
    if (r.first === player) trend += 2;
    if (r.second === player) trend += 1;
  });

  if (trend >= 6) return "📈";
  if (trend <= 2) return "📉";
  return "➖";
};

function CustomSelect({ label, value, onChange, players, disabledPlayers }) {
  const colorMap = {
    Meen: "from-red-700 to-red-500",
    Cho: "from-green-700 to-green-500",
    Faii: "from-blue-700 to-blue-500",
  };

  return (
    <div>
      <div className="text-xs font-bold mb-1 text-gray-800">{label}</div>

      <div className="grid grid-cols-3 gap-2">
        {players.map((p) => {
          const disabled = disabledPlayers.includes(p);
          const selected = value === p;

          return (
            <div
              key={p}
              disabled={disabled}
              onClick={() => {
                if (disabled) return;

                if (value === p) {
                  onChange("");     // 👈 คลิกซ้ำ = เอาออก
                } else {
                  onChange(p);      // 👈 เลือกใหม่
                }
              }}
              className={`
                relative p-1 rounded-xl text-xs text-center font-bold transition-all duration-300
                ${selected
                  ? `bg-gradient-to-br ${colorMap[p]} scale-105 shadow-lg`
                  : `bg-gray-600 hover:bg-gray-500/50 hover:scale-105`}
                ${disabled ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              {selected && (
                <span className="absolute top-1 right-1 bg-white text-black text-[0.25rem] p-1 rounded-full">
                  
                </span>
              )}
              {p}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const getLoseStreaks = () => {
  const streaks = {};
  players.forEach(p => (streaks[p] = 0));

  players.forEach((player) => {
    let loseStreak = 0;

    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].first === player) break; // เจอชนะ = หยุด
      loseStreak++;
    }

    streaks[player] = loseStreak;
  });

  return streaks;
};

const loseStreaks = getLoseStreaks();

const getCurrentWinStreak = (player) => {
  let streak = 0;

  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].first === player) {
      streak++;
    } else {
      break; // แพ้ = หยุดทันที
    }
  }

  return streak;
};

const getCurrentLoseStreak = (player) => {
  let streak = 0;

  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].first !== player) {
      streak++;
    } else {
      break; // ชนะ = หยุด
    }
  }

  return streak;
};



const getTodayMVP = () => {
  if (history.length === 0) return [];

  const today = new Date().toLocaleDateString();
  const dailyScore = { Meen: 0, Cho: 0, Faii: 0 };

  history.forEach((h) => {
    const roundDate = new Date(h.time).toLocaleDateString();
    if (roundDate === today) {
      const bonus = h.bonus ? 2 : 1;
      dailyScore[h.first] += 2 * bonus;
      dailyScore[h.second] += 1 * bonus;
    }
  });

  const max = Math.max(...Object.values(dailyScore));
  if (max === 0) return [];

  return Object.keys(dailyScore).filter(
    (p) => dailyScore[p] === max
  );
};

const todayMVP = getTodayMVP();

const carMap = {
  Meen: carRed,
  Cho: carGreen,
  Faii: carBlue,
};



  return (
    <>
    {isLoading && (
      <LoadingScreen
        carRed={carRed}
        carGreen={carGreen}
        carBlue={carBlue}
      />
    )}

    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">
      <img src={loop} alt="loop" className="min-h-screen scale-150 opacity-3 " />

      {/* ⏱ PRE BONUS COUNTDOWN */}
    {preBonusCountdown !== null && (
      <motion.div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          key={preBonusCountdown}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1.2, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <div className="text-[10rem] font-extrabold text-red-500 drop-shadow-[0_0_40px_rgba(255,0,0,0.9)]">
            {preBonusCountdown}
          </div>
          <div className="mt-4 text-2xl font-bold text-white tracking-widest animate-pulse">
            BONUS TIME INCOMING
          </div>
        </motion.div>
      </motion.div>
    )}
      {explosion && (
  <motion.div
    className="fixed inset-0 z-[99999] flex items-center justify-center bg-black"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    {/* FLASH */}
    <motion.div
      className="absolute inset-0 bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0] }}
      transition={{ duration: 0.4 }}
    />

    {/* SHAKE */}
    <motion.div
      initial={{ scale: 0.6, rotate: 0 }}
      animate={{
        scale: [0.6, 1.2, 1],
        rotate: [0, 3, -3, 2, -2, 0],
      }}
      transition={{ duration: 0.8 }}
      className="text-center"
    >
      <div className="text-[5rem] font-extrabold text-red-500 drop-shadow-[0_0_40px_rgba(255,0,0,0.9)]">
        💥 BOOM!
      </div>

      <div className="mt-4 text-3xl font-extrabold text-white tracking-widest">
        คุณ <span className="text-red-400">{explosion.loser}</span>
      </div>

      <div className="text-2xl font-bold text-yellow-400 mt-2">
        ถูกชนโดย {explosion.winner}
      </div>
    </motion.div>

    {/* AUTO CLOSE */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 3 }}
      onAnimationComplete={() => setExplosion(null)}
    />
  </motion.div>
)}

    

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
        <div className="flex-1 w-full max-w-4xl mx-auto p-4">
          {bonusRemain > 0 && (
          <div className="flex justify-center -mt-2 mb-6 z-50">
            <div className={`px-16 py-2 rounded-b-full font-bold border ${isCritical ? 
              " bg-red-500/20 border-red-400 text-red-400 animate-pulse" : 
              "bg-yellow-500/20 border-yellow-400 text-yellow-300 animate-pulse"}`} 
              style={isCritical ? { animation: "shake 0.4s infinite" } : {}}>
              🔥 โบนัสกำลังทำงาน เหลือเวลาอีก {formatTime(bonusRemain)}
            </div>
          </div>
        )}
          <div className="relative w-full h-[850px]">
            {/* 🏁 FINISH LINE (Checkered) */}
            <div className="absolute left-0 w-full z-20 pointer-events-none">
              <div className="relative h-[28px] flex items-center">
                <img src={finish} alt="race" className="w-full h-7" />
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

                <Bar dataKey="score" barSize={60} className="">
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                  <LabelList
                    dataKey="name"
                    content={({ x, y, width, height, value }) => (
                      <text className="animate-pulse"
                        x={x+3}
                        y={y+59}
                        textAnchor="end"
                        transform={`rotate(-90, ${x}, ${y})`}
                        fontSize={89}
                        fontWeight="800"
                        fontFamily="'Orbitron', 'Kanit', sans-serif"
                        opacity={0.3}
                        fill={
                          value === "Meen"
                            ? "#fecaca"
                            : value === "Cho"
                            ? "#bbf7d0"
                            : "#bfdbfe"
                        }
                        style={{
                          textShadow: `
                            0 0 2px rgba(255,255,255,0.3),
                            0 0 4px rgba(255,255,255,0.2),
                            0 0 7px rgba(255,255,255,0.2)
                          `,
                        }}
                      >
                        {value}
                      </text>
                    )}
                  />
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
                  className="absolute w-[200px] h-[130px] mb-5 hover:scale-110 transition-all duration-300"
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
        
      </div>
        <h3 className="text-center text-xl font-bold mb-3 z-20">ระบบเก็บคะแนนผู้แข่งขัน</h3>
        {/* คะแนนรวม */}
      <div className="grid grid-cols-3 gap-3 mb-2 w-full max-w-xl z-20">
        {players.map((p) => { 
          const winStreak = getCurrentWinStreak(p);
          const loseStreak = getCurrentLoseStreak(p);
          return (
          <div
            key={p}
            onClick={() => setActivePlayer(p)}
            className="block group text-center cursor-pointer z-20"
          >
            <div
              className={`relative rounded-xl p-3 cursor-pointer overflow-hidden
                hover:shadow-lg hover:scale-[1.02] transition-all duration-300
                ${p === 'Meen' ? 'bg-gradient-to-br from-red-800 to-red-500' 
                : p === 'Cho' ? 'bg-gradient-to-br from-green-800 to-green-500' 
                : 'bg-gradient-to-br from-blue-800 to-blue-500 z-20'}`}
>
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500 z-0"></div>
              <h2 className="text-md font-semibold">{p}</h2>
              <motion.p key={scores[p]}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 0.4 }}
                className="text-[2.5rem] font-bold -m-4">
                {scores[p]}
              </motion.p>
              {todayMVP.includes(p) && (
                <motion.div
                  className="absolute bottom-1.5 right-3.5 mt-1 px-3 text-[0.5rem] font-extrabold text-gray-900 bg-yellow-300/70 rounded-full z-10"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                >
                  ⭐ MVP วันนี้
                </motion.div>
              )}


              <p className="text-xs mt-1 opacity-70 z-10">อัตราชนะ</p>
              <div className="flex justify-center z-10">
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
              {winStreak >= 3 && (
                <div className="absolute inset-0 z-0 pointer-events-none">
                  {/* glow */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(255,100,0,0.9),transparent_70%)] blur-xl animate-pulse" />
                  {/* flame */}
                  <div className="absolute bottom-0 w-full h-20 bg-gradient-to-t from-orange-500/80 to-transparent animate-[fire_1s_infinite]" />
                </div>
              )}
              {loseStreak >= 3 && (
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                  {[...Array(20)].map((_, i) => (
                    <span
                      key={i}
                      className="absolute top-0 w-[2px] h-6 bg-blue-300/70 animate-[rain_1s_linear_infinite]"
                      style={{
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random()}s`,
                      }}
                    />
                  ))}
                </div>
              )}
              {/* 🔥 ON FIRE */}
                {winStreak >= 3 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute top-13 left-5/6 -translate-x-1/2
                              px-3 py-0.5
                              text-8xl font-extrabold tracking-widest text-orange-500/10
                              animate-pulse z-10"
                    style={{rotate: -90}}
                  >
                    FIRE
                  </motion.div>
                )}

                {/* 😵 TILTED */}
                {loseStreak >= 3 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute top-13 left-5/6 -translate-x-1/2
                              px-3 py-0.5 text-5xl font-extrabold tracking-widest text-white/10
                              animate-pulse z-10"
                    style={{rotate: -90}}
                  >
                    TILTED
                  </motion.div>
                )}


            </div>
          </div>
        )})}
        
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
      <h2 className="text-gray-900 text-md font-bold mb-3 text-center">ผลการแข่งขันรอบนี้</h2>

      <CustomSelect
        label="🥇 ผู้ชนะ (2 คะแนน)"
        value={roundResult.first}
        onChange={(v) => handleInput("first", v)}
        players={players}
        disabledPlayers={[roundResult.second, roundResult.third].filter(Boolean)}
      />

      <CustomSelect
        label="🥈 อันดับ 2 (1 คะแนน)"
        value={roundResult.second}
        onChange={(v) => handleInput("second", v)}
        players={players}
        disabledPlayers={[roundResult.first, roundResult.third].filter(Boolean)}
      />

      <CustomSelect
        label="🥉 อันดับ 3"
        value={roundResult.third}
        onChange={(v) => handleInput("third", v)}
        players={players}
        disabledPlayers={[roundResult.first, roundResult.second].filter(Boolean)}
      />

      <div className="relative w-full z-10 text-center text-xs bg-green-600 hover:bg-green-700 p-3 rounded-xl font-bold"
      onClick={handleSubmit}>บันทึกคะแนน</div>
        <div className="flex">
          <i className="fi fi-rr-info text-sky-600 font-bold mr-2"></i>
          <p className="text-[0.7rem] text-sky-600">คะแนนจะบันทึกไว้ภายในเครื่องของท่าน หากมีการเคลียแคชอาจทำให้คะแนนหายได้</p>
        </div>
      
      </div>
      </div>

      {/* History list (Collapsible) */}
{/* LEFT SIDEBAR HISTORY PANEL */}
<motion.div
  className="fixed top-0 left-0 h-full w-90 backdrop-blur-sm p-4 z-50"
  initial={false}
  animate={{ width: showHistory ? 320 : 60 }}
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
      <div className="overflow-y-auto max-h-[90vh] transition-all duration-300 custom-scrollbar">
        {history
        .slice()
        .reverse()
        .map((r, i) => { const isLatest = i === 0; return (
            <div key={i} className="block group p-[0.2rem] mr-2 overflow-hidden ">
              <div className={`relative p-3 text-sm hover:shadow-lg rounded-xl
                border border-l-4 border-white/10
                ${firstPlaceColorMap[r.first] ?? "border-l-gray-500"}
                hover:scale-[1.02] transition-all duration-300 overflow-hidden`}
              >
                {/* 🔥 LATEST BADGE */}
                {isLatest && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="absolute top-5 -right-6 py-0.5
                              text-xl font-extrabold
                              text-yellow-200/30
                              animate-pulse -z-10"
                    style={{rotate: -90}}
                  >
                    LATEST
                  </motion.div>
                )}
                <div className={`absolute top-0 right-5 w-15 h-15 ${OPlaceColorMap[r.first] ?? "bg-gray-500/10" } rounded-xl -mr-12 -mb-12 group-hover:scale-150 transition-transform duration-500`}></div>
                <img className={`absolute opacity-20 -z-100 scale-300 group-hover:scale-350 transition-transform duration-500 `} src={pattern} alt="pattern" />
              <div className="text-gray-300 text-xs mb-2">{r.time}</div>
              <div className="flex justify-center">
                <div className={`py-1 px-3 font-semibold text-xs text-gray-900 bg-white -skew-x-25 rounded-l-md border-r-5 ${ScoreMap[r.first]}`}>🥇 {r.first}</div>
                <div className={`py-1 px-3 font-semibold text-xs text-gray-900 bg-white -skew-x-25 border-r-5 ${ScoreMap[r.second]}`}>🥈 {r.second}</div>
                <div className={`py-1 px-3 font-semibold text-xs text-gray-900 bg-white -skew-x-25 rounded-r-md border-r-5 ${ScoreMap[r.third]}`}>🥉 {r.third}</div>
              </div>
              {r.bonus && (
                <div className="text-xs text-gray-900 bg-yellow-400/70 font-bold text-center mt-2 rounded-full">
                  ⚡ PEAK TIME ZONE // BONUS TIME x 2
                </div>
              )}
              </div>
              
              
            </div>
          )})}
      </div>
    )}
  </motion.div>
</motion.div>

        
      </div>
        
        {activePlayer && (
          <motion.div
            className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setActivePlayer(null)}   // 👈 คลิกที่อื่น = ปิด
          >
          <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 w-[460px] text-center shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            {/*กัน event ไม่ให้เด้งไป overlay */}
            <a onClick={() => setActivePlayer(null)} className="absolute top-3 right-5 text-gray-400 hover:text-white">✕</a>
            <h2 className="text-xl font-bold mb-4">{activePlayer} – สถิติ</h2>

      {(() => {
        const s = getPlayerStats(activePlayer);
        return (
          <>
          {/* ช่องว่างคะแนน */}
          <div className="flex justify-center text-sm font-bold">
            {getGapFromLeader(activePlayer) === 0 ? (
              <span className="text-green-400">
                🏆 นำเป็นอันดับ 1
              </span>
            ) : (
              <span className="text-red-400">
                ⏱ ตามอันดับ 1 อยู่ {getGapFromLeader(activePlayer)} แต้ม
                {getGapFromLeader(activePlayer) < 2 && (
                  <motion.span
                    className="ml-2 text-yellow-300"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    🔥 ใกล้แซง!
                  </motion.span>
                )}
              </span>
            )}

            {activePlayer === getLeader() && (
            <div className="px-2 text-sm text-blue-400 font-semibold">
              🥈 นำอันดับ 2 อยู่ {getLeadOverSecond(activePlayer)} แต้ม
            </div>
          )}
          
          </div>

          
          <div className="flex justify-center gap-3 p-2 my-3 border-2 border-blue-900/30 rounded-2xl hover:scale-101 transition-all duration-300">
             {/* 🚗 PLAYER CAR */}
             <div className="-ml-8">
              <motion.img
              src={carMap[activePlayer]}
              alt="car"
              initial={{ y: 100, opacity: 0, rotate: 90 }}
              animate={{ y: 30, opacity: 1, rotate: 90 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-28 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
            />
             </div>
            
            <div className="-ml-8">
              <div className="group block my-2 bg-yellow-500/30 rounded-xl p-2 hover:scale-105 transition-all duration-300">
                <div className="text-2xl font-bold">🥇 {s.first}</div>
              </div>
              <div className="group block my-2 bg-gray-400/30 rounded-xl p-2 hover:scale-105 transition-all duration-300">
                <div className="text-2xl font-bold">🥈 {s.second}</div>
              </div>
              <div className="group block my-2 bg-orange-500/30 rounded-xl p-2 hover:scale-105 transition-all duration-300">
                <div className="text-2xl font-bold">🥉 {s.third}</div>
              </div>
            </div>
            <div className="">
              <div className="my-2 p-3 bg-green-500/30 rounded-xl hover:scale-105 transition-all duration-300">
              <div className="text-sm text-green-400">อัตราชนะ</div>
              <div className="text-3xl font-extrabold text-green-400">
                {s.winRate}%
              </div>
              </div>
              <div className="my-2 p-2 bg-blue-500/30 rounded-xl hover:scale-105 transition-all duration-300">
                <div className="text-sm text-blue-400">แนวโน้มล่าสุด</div> 
                <div className="text-3xl font-extrabold text-blue-400">{getTrendIcon(activePlayer)}</div>
              </div>
            </div>
          </div>   
          <div className="py-1 border-2 border-blue-900/30 rounded-2xl hover:scale-101 transition-all duration-300">
            <span className="text-sm text-gray-400 ">สถิติตลอดกาล</span>
            <div className="flex justify-center">
              <div className="m-2 p-3 text-green-400 font-semibold bg-green-500/30 rounded-xl hover:scale-105 transition-all duration-300">
                <p className="text-[0.75rem]">ชนะติดต่อกันสูงสุด</p>
                <p className="mt-2 text-3xl">🔥 {winStreaks[activePlayer]}</p>
              </div>
              <div className="m-2 p-3 text-red-400 font-semibold bg-red-500/30 rounded-xl hover:scale-105 transition-all duration-300">
                <p className="text-[0.75rem]">แพ้ติดต่อกันสูงสุด</p>
                <p className="mt-2 text-3xl">💀 {loseStreaks[activePlayer]}</p>
              </div>
            </div>
          </div>
            {/* Progress เทียบผู้นำ */}
            <div className="mt-4">
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-500"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${
                      (scores[activePlayer] / Math.max(scores[getLeader()], 1)) * 100
                    }%`,
                  }}
                  transition={{ duration: 0.6 }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>คะแนน</span>
                <span>
                  {scores[activePlayer]} / {scores[getLeader()]}
                </span>
              </div>
            </div>

          </>
        );
      })()}
    </div>
  </motion.div>
)}


      </div>
    </>
  );
  
}
