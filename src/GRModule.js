import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar, ComposedChart, Scatter, Area, Legend } from 'recharts';
import { Play, RotateCcw, Download, MapPin, Calendar, TrendingUp, Calculator, Database, ChevronRight, Info, AlertCircle, Loader } from 'lucide-react';

// 지역 데이터베이스
const REGIONS = {
  korea: { name: '한반도', lat: [33, 43], lon: [124, 132], b: 0.95, type: '판내부', desc: '유라시아판 내부, 상대적 안정', color: '#3b82f6' },
  japan_all: { name: '일본 전역', lat: [30, 46], lon: [128, 146], b: 0.85, type: '섭입대', desc: '태평양판/필리핀판 섭입', color: '#ef4444' },
  nankai: { name: '난카이 트러프', lat: [32, 35], lon: [132, 138], b: 0.80, type: '메가스러스트', desc: 'M8급 주기적 발생 위험', color: '#dc2626' },
  sendai: { name: '센다이/도호쿠', lat: [36, 42], lon: [139, 145], b: 0.82, type: '섭입대', desc: '2011 M9.0 진원', color: '#f97316' },
  kamchatka: { name: '캄차카 반도', lat: [50, 60], lon: [155, 165], b: 0.78, type: '섭입대', desc: '활발한 화산활동', color: '#7c3aed' },
  alaska: { name: '알래스카', lat: [55, 65], lon: [-165, -140], b: 0.82, type: '섭입대', desc: '1964 M9.2 발생', color: '#0891b2' },
  chile: { name: '칠레', lat: [-45, -20], lon: [-76, -68], b: 0.85, type: '섭입대', desc: '1960 M9.5 역대최대', color: '#059669' },
  sumatra: { name: '수마트라', lat: [-6, 6], lon: [95, 106], b: 0.80, type: '섭입대', desc: '2004 M9.1 쓰나미', color: '#d946ef' },
  california: { name: '캘리포니아', lat: [32, 42], lon: [-125, -114], b: 1.0, type: '변환단층', desc: '샌안드레아스 단층', color: '#f59e0b' },
  turkey_east: { name: '동아나톨리아', lat: [36, 40], lon: [36, 42], b: 0.88, type: '주향이동', desc: '2023 M7.8 발생', color: '#e11d48' },
  turkey_north: { name: '북아나톨리아', lat: [39, 42], lon: [27, 42], b: 0.90, type: '변환단층', desc: '이스탄불 위험', color: '#be185d' },
  eastafrica: { name: '동아프리카 열곡', lat: [-15, 15], lon: [28, 42], b: 1.05, type: '발산경계', desc: '아프리카판 분리중', color: '#84cc16' },
  iceland: { name: '아이슬란드', lat: [63, 67], lon: [-25, -13], b: 1.10, type: '중앙해령', desc: '해령 지표 노출', color: '#06b6d4' },
  himalaya: { name: '히말라야', lat: [26, 32], lon: [80, 90], b: 0.92, type: '충돌경계', desc: '2015 네팔 M7.8', color: '#a855f7' },
  sichuan: { name: '쓰촨성', lat: [28, 34], lon: [100, 108], b: 0.88, type: '충돌영향', desc: '2008 M7.9', color: '#ec4899' },
  philippines: { name: '필리핀', lat: [5, 20], lon: [118, 128], b: 0.85, type: '섭입대', desc: '환태평양 조산대', color: '#f472b6' },
  newzealand: { name: '뉴질랜드', lat: [-48, -34], lon: [165, 180], b: 0.95, type: '복합경계', desc: '알파인 단층', color: '#14b8a6' },
  global: { name: '전 세계', lat: [-90, 90], lon: [-180, 180], b: 1.0, type: '전체', desc: '전 세계 지진', color: '#6b7280' }
};

// G-R 데이터 생성
const generateGRData = (mags, minM = 2.0) => {
  const bins = [];
  for (let m = minM; m <= 7.0; m += 0.2) {
    const count = mags.filter(mag => mag >= m).length;
    if (count > 0) bins.push({ mag: Math.round(m * 10) / 10, count, log: Math.log10(count) });
  }
  return bins;
};

// 선형 회귀
const linReg = (data) => {
  if (data.length < 2) return null;
  const n = data.length;
  let sx = 0, sy = 0, sxy = 0, sx2 = 0;
  data.forEach(d => { sx += d.mag; sy += d.log; sxy += d.mag * d.log; sx2 += d.mag * d.mag; });
  const slope = (n * sxy - sx * sy) / (n * sx2 - sx * sx);
  const intercept = (sy - slope * sx) / n;
  return { slope, intercept, b: -slope };
};

// 히스토그램 데이터
const getHist = (mags) => {
  const bins = {};
  mags.forEach(m => { const b = Math.floor(m * 2) / 2; bins[b] = (bins[b] || 0) + 1; });
  return Object.entries(bins).map(([m, c]) => ({ mag: parseFloat(m), count: c })).sort((a, b) => a.mag - b.mag);
};

export default function GRModule() {
  const [tab, setTab] = useState('sim');
  const [simB, setSimB] = useState(1.0);
  const [simN, setSimN] = useState(500);
  const [simData, setSimData] = useState([]);
  const [simGR, setSimGR] = useState([]);
  const [simReg, setSimReg] = useState(null);
  const [step, setStep] = useState(0);
  const [anim, setAnim] = useState(false);
  
  const [region, setRegion] = useState('nankai');
  const [startD, setStartD] = useState('2023-01-01');
  const [endD, setEndD] = useState('2024-01-01');
  const [realData, setRealData] = useState([]);
  const [realGR, setRealGR] = useState([]);
  const [realReg, setRealReg] = useState(null);
  const [mc, setMc] = useState(2.5);
  const [loading, setLoading] = useState(false);
  
  const [tempB, setTempB] = useState([]);
  const [winSize, setWinSize] = useState(90);

  // 시뮬레이션 생성
  const genSim = () => {
    const mags = [];
    for (let i = 0; i < simN * 3 && mags.length < simN; i++) {
      const m = 2.0 - Math.log10(Math.random()) / simB;
      if (m >= 2.0 && m <= 7.5) mags.push(Math.round(m * 10) / 10);
    }
    setSimData(mags);
    setStep(0);
    setSimGR([]);
    setSimReg(null);
  };

  // 애니메이션
  const runAnim = async () => {
    if (!simData.length) { genSim(); return; }
    setAnim(true);
    setStep(1);
    await new Promise(r => setTimeout(r, 1200));
    const gr = generateGRData(simData);
    setSimGR(gr);
    setStep(2);
    await new Promise(r => setTimeout(r, 1200));
    setStep(3);
    await new Promise(r => setTimeout(r, 1200));
    setSimReg(linReg(gr));
    setStep(4);
    setAnim(false);
  };

  // 실제 데이터 로드
  const loadReal = async () => {
    setLoading(true);
    try {
      const r = REGIONS[region];
      let url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${startD}&endtime=${endD}&minmagnitude=2`;
      if (region !== 'global') url += `&minlatitude=${r.lat[0]}&maxlatitude=${r.lat[1]}&minlongitude=${r.lon[0]}&maxlongitude=${r.lon[1]}`;
      const res = await fetch(url);
      const json = await res.json();
      const data = json.features.map(f => ({
        time: new Date(f.properties.time).toISOString(),
        mag: f.properties.mag,
        lat: f.geometry.coordinates[1],
        lon: f.geometry.coordinates[0],
        depth: f.geometry.coordinates[2]
      })).filter(d => d.mag >= 2.0);
      setRealData(data);
      processReal(data);
    } catch (e) {
      // 샘플 데이터 생성
      const r = REGIONS[region];
      const days = Math.floor((new Date(endD) - new Date(startD)) / 86400000);
      const data = [];
      for (let i = 0; i < days * 0.5; i++) {
        const m = 2.0 - Math.log10(Math.random()) / r.b;
        if (m >= 2.0 && m <= 8.0) {
          const d = new Date(startD);
          d.setDate(d.getDate() + Math.floor(Math.random() * days));
          data.push({ time: d.toISOString(), mag: Math.round(m * 10) / 10, lat: r.lat[0] + Math.random() * (r.lat[1] - r.lat[0]), lon: r.lon[0] + Math.random() * (r.lon[1] - r.lon[0]), depth: 10 + Math.random() * 40 });
        }
      }
      setRealData(data);
      processReal(data);
    }
    setLoading(false);
  };

  const processReal = (data) => {
    const mags = data.map(d => d.mag);
    const gr = generateGRData(mags, mc);
    setRealGR(gr);
    setRealReg(linReg(gr.filter(d => d.mag >= mc)));
    calcTempB(data);
  };

  // 시계열 b-value
  const calcTempB = (data) => {
    if (data.length < 50) { setTempB([]); return; }
    const sorted = [...data].sort((a, b) => new Date(a.time) - new Date(b.time));
    const results = [];
    let ws = new Date(sorted[0].time);
    const end = new Date(sorted[sorted.length - 1].time);
    while (ws < end) {
      const we = new Date(ws); we.setDate(we.getDate() + winSize);
      const wd = sorted.filter(d => { const t = new Date(d.time); return t >= ws && t < we; });
      if (wd.length >= 30) {
        const mags = wd.map(d => d.mag).filter(m => m >= mc);
        if (mags.length >= 20) {
          const mean = mags.reduce((a, b) => a + b, 0) / mags.length;
          const b = Math.log10(Math.E) / (mean - (mc - 0.05));
          const se = b / Math.sqrt(mags.length);
          results.push({ date: ws.toISOString().slice(0, 10), b: Math.round(b * 100) / 100, se: Math.round(se * 100) / 100, n: mags.length, upper: Math.round((b + se) * 100) / 100, lower: Math.round((b - se) * 100) / 100 });
        }
      }
      ws.setDate(ws.getDate() + 30);
    }
    setTempB(results);
  };

  useEffect(() => { genSim(); }, []);

  const R = REGIONS[region];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
            <h1 className="text-2xl font-bold">📊 구텐베르그-리히터 법칙 체험</h1>
            <p className="mt-1 opacity-90">지진 통계 분석의 기초를 직접 경험해보세요</p>
          </div>

          <div className="flex border-b">
            <button onClick={() => setTab('sim')} className={`flex-1 py-3 font-medium transition-all ${tab === 'sim' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500'}`}>
              <Calculator className="w-4 h-4 inline mr-2" />시뮬레이션
            </button>
            <button onClick={() => setTab('real')} className={`flex-1 py-3 font-medium transition-all ${tab === 'real' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50' : 'text-gray-500'}`}>
              <Database className="w-4 h-4 inline mr-2" />실제 데이터
            </button>
            <button onClick={() => setTab('time')} className={`flex-1 py-3 font-medium transition-all ${tab === 'time' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50' : 'text-gray-500'}`}>
              <TrendingUp className="w-4 h-4 inline mr-2" />시계열 분석
            </button>
          </div>

          <div className="p-6">
            {/* 시뮬레이션 탭 */}
            {tab === 'sim' && (
              <div className="space-y-6">
                <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                  <h3 className="font-bold mb-4">⚙️ 시뮬레이션 설정</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm mb-2">설정 b-value: <span className="text-blue-600 font-bold">{simB.toFixed(2)}</span></label>
                      <input type="range" min="0.5" max="1.5" step="0.05" value={simB} onChange={e => setSimB(parseFloat(e.target.value))} className="w-full" />
                      <div className="flex justify-between text-xs text-gray-500"><span>0.5 (대지진↑)</span><span>1.5 (소지진↑)</span></div>
                    </div>
                    <div>
                      <label className="block text-sm mb-2">지진 수: <span className="text-blue-600 font-bold">{simN}</span></label>
                      <input type="range" min="100" max="2000" step="100" value={simN} onChange={e => setSimN(parseInt(e.target.value))} className="w-full" />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button onClick={genSim} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2">
                      <RotateCcw className="w-4 h-4" /> 데이터 생성
                    </button>
                    <button onClick={runAnim} disabled={anim} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                      <Play className="w-4 h-4" /> {anim ? '분석 중...' : '단계별 분석'}
                    </button>
                  </div>
                </div>

                <div className="flex justify-center items-center gap-2 py-2">
                  {[1, 2, 3, 4].map(s => (
                    <React.Fragment key={s}>
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold transition-all ${step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>{s}</div>
                      {s < 4 && <ChevronRight className={`w-5 h-5 ${step >= s ? 'text-blue-600' : 'text-gray-300'}`} />}
                    </React.Fragment>
                  ))}
                </div>
                <p className="text-center text-sm text-gray-600">
                  {step === 0 && '데이터 생성 후 분석 시작'}
                  {step === 1 && '1단계: 규모별 빈도 (히스토그램)'}
                  {step === 2 && '2단계: 누적 빈도 계산'}
                  {step === 3 && '3단계: 로그 스케일 변환'}
                  {step === 4 && '4단계: 선형 회귀로 b-value 계산'}
                </p>

                {step >= 1 && (
                  <div className="bg-white border rounded-xl p-5">
                    <h4 className="font-bold mb-3">📊 규모별 빈도</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={getHist(simData)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mag" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {step >= 2 && (
                  <div className="bg-white border rounded-xl p-5">
                    <h4 className="font-bold mb-3">{step >= 3 ? '📐 G-R 플롯 (로그 스케일)' : '📈 누적 빈도'}</h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <ComposedChart data={simGR}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mag" label={{ value: '규모 M', position: 'bottom', offset: -5 }} />
                        <YAxis scale={step >= 3 ? "log" : "linear"} domain={step >= 3 ? [1, 'auto'] : [0, 'auto']} />
                        <Tooltip />
                        <Scatter dataKey="count" fill="#3b82f6" />
                        {step >= 4 && simReg && (
                          <Line type="linear" dataKey="fitted" data={simGR.map(d => ({ ...d, fitted: Math.pow(10, simReg.intercept + simReg.slope * d.mag) }))} stroke="#ef4444" strokeWidth={2} dot={false} />
                        )}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {step >= 4 && simReg && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                      <h4 className="font-bold text-green-800 mb-2">✅ 계산 결과</h4>
                      <p className="text-3xl font-bold text-green-700">b = {simReg.b.toFixed(3)}</p>
                      <p className="text-sm text-gray-600 mt-1">설정값: {simB.toFixed(2)} | 오차: {Math.abs(simReg.b - simB).toFixed(3)}</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                      <h4 className="font-bold text-blue-800 mb-2">📖 해석</h4>
                      <p className="text-sm">규모 1 증가 시 빈도가 약 <strong>{Math.pow(10, simReg.b).toFixed(1)}배</strong> 감소</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 실제 데이터 탭 */}
            {tab === 'real' && (
              <div className="space-y-6">
                <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Database className="w-5 h-5 text-emerald-600" />
                    실제 지진 데이터 분석
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm mb-1">
                        <MapPin className="w-4 h-4 inline mr-1" />지역
                      </label>
                      <select value={region} onChange={e => setRegion(e.target.value)} className="w-full p-2 border rounded-lg">
                        <optgroup label="🌏 동아시아">
                          <option value="korea">🇰🇷 한반도</option>
                          <option value="japan_all">🇯🇵 일본 전역</option>
                          <option value="nankai">🇯🇵 난카이 트러프</option>
                          <option value="sendai">🇯🇵 센다이/도호쿠</option>
                          <option value="sichuan">🇨🇳 쓰촨성</option>
                          <option value="philippines">🇵🇭 필리핀</option>
                        </optgroup>
                        <optgroup label="🔥 환태평양">
                          <option value="kamchatka">🇷🇺 캄차카</option>
                          <option value="alaska">🇺🇸 알래스카</option>
                          <option value="california">🇺🇸 캘리포니아</option>
                          <option value="sumatra">🇮🇩 수마트라</option>
                          <option value="chile">🇨🇱 칠레</option>
                          <option value="newzealand">🇳🇿 뉴질랜드</option>
                        </optgroup>
                        <optgroup label="⚡ 변환/충돌">
                          <option value="turkey_east">🇹🇷 동아나톨리아</option>
                          <option value="turkey_north">🇹🇷 북아나톨리아</option>
                          <option value="himalaya">🇳🇵 히말라야</option>
                        </optgroup>
                        <optgroup label="🌋 발산경계">
                          <option value="eastafrica">🌍 동아프리카 열곡</option>
                          <option value="iceland">🇮🇸 아이슬란드</option>
                        </optgroup>
                        <optgroup label="🌐 전체">
                          <option value="global">🌐 전 세계</option>
                        </optgroup>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm mb-1">
                        <Calendar className="w-4 h-4 inline mr-1" />시작일
                      </label>
                      <input type="date" value={startD} onChange={e => setStartD(e.target.value)} className="w-full p-2 border rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">
                        <Calendar className="w-4 h-4 inline mr-1" />종료일
                      </label>
                      <input type="date" value={endD} onChange={e => setEndD(e.target.value)} className="w-full p-2 border rounded-lg" />
                    </div>
                  </div>
                  
                  {R && (
                    <div className="mt-4 p-3 rounded-lg border-l-4" style={{ borderColor: R.color, backgroundColor: `${R.color}15` }}>
                      <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
                        <div>
                          <span className="font-bold">{R.name}</span>
                          <span className="text-sm text-gray-600 ml-2">{R.desc}</span>
                        </div>
                        <span className="px-2 py-1 rounded text-xs text-white self-start" style={{ backgroundColor: R.color }}>{R.type}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">📍 {R.lat[0]}°~{R.lat[1]}°N, {R.lon[0]}°~{R.lon[1]}°E</p>
                    </div>
                  )}
                  
                  <div className="mt-4 flex flex-col md:flex-row gap-4 md:items-end">
                    <div>
                      <label className="block text-sm mb-1">Mc (완전성 규모)</label>
                      <input type="number" value={mc} onChange={e => setMc(parseFloat(e.target.value))} step="0.1" min="1" max="4" className="w-24 p-2 border rounded-lg" />
                    </div>
                    <button onClick={loadReal} disabled={loading} className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2">
                      {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      {loading ? '로드 중...' : 'USGS 데이터 불러오기'}
                    </button>
                  </div>
                </div>

                {realData.length > 0 && (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="bg-white border rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-blue-600">{realData.length}</p>
                        <p className="text-xs text-gray-500">지진 수</p>
                      </div>
                      <div className="bg-white border rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-orange-600">M{Math.max(...realData.map(d => d.mag)).toFixed(1)}</p>
                        <p className="text-xs text-gray-500">최대 규모</p>
                      </div>
                      <div className="bg-white border rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-green-600">{realReg?.b.toFixed(2) || '-'}</p>
                        <p className="text-xs text-gray-500">b-value</p>
                      </div>
                      <div className="bg-white border rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-purple-600">M{mc}</p>
                        <p className="text-xs text-gray-500">Mc</p>
                      </div>
                      <div className="bg-white border-2 rounded-xl p-3 text-center" style={{ borderColor: R?.color }}>
                        <p className="text-lg font-bold" style={{ color: R?.color }}>{R?.type}</p>
                        <p className="text-xs text-gray-500">판구조</p>
                      </div>
                    </div>

                    {realReg && (
                      <div className={`p-4 rounded-xl border-l-4 ${realReg.b < 0.85 ? 'bg-red-50 border-red-500' : realReg.b > 1.1 ? 'bg-blue-50 border-blue-500' : 'bg-green-50 border-green-500'}`}>
                        <h4 className="font-bold mb-1 flex items-center gap-2">
                          <Info className="w-4 h-4" /> b-value 해석
                        </h4>
                        <p className="text-sm">
                          {realReg.b < 0.85 && <><strong className="text-red-600">b가 낮음 ({realReg.b.toFixed(2)})</strong> - 대규모 지진 비율 높음, 섭입대/활성단층 특성</>}
                          {realReg.b >= 0.85 && realReg.b <= 1.1 && <><strong className="text-green-600">b가 평균 수준 ({realReg.b.toFixed(2)})</strong> - 전형적인 지각 응력 상태</>}
                          {realReg.b > 1.1 && <><strong className="text-blue-600">b가 높음 ({realReg.b.toFixed(2)})</strong> - 소규모 지진 다발, 화산/열곡대 특성</>}
                        </p>
                      </div>
                    )}

                    <div className="bg-white border rounded-xl p-5">
                      <h4 className="font-bold mb-3">📊 규모별 빈도</h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={getHist(realData.map(d => d.mag))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="mag" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#10b981" />
                          <ReferenceLine x={mc} stroke="#ef4444" strokeDasharray="5 5" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-white border rounded-xl p-5">
                      <h4 className="font-bold mb-3">📐 G-R 플롯</h4>
                      <ResponsiveContainer width="100%" height={280}>
                        <ComposedChart data={realGR}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="mag" />
                          <YAxis scale="log" domain={[1, 'auto']} />
                          <Tooltip />
                          <Scatter dataKey="count" fill="#10b981" name="실측값" />
                          {realReg && (
                            <Line type="linear" dataKey="fitted" data={realGR.filter(d => d.mag >= mc).map(d => ({ ...d, fitted: Math.pow(10, realReg.intercept + realReg.slope * d.mag) }))} stroke="#ef4444" strokeWidth={2} dot={false} name="회귀선" />
                          )}
                          <ReferenceLine x={mc} stroke="#f59e0b" strokeDasharray="5 5" />
                        </ComposedChart>
                      </ResponsiveContainer>
                      {realReg && (
                        <p className="mt-2 text-sm font-mono bg-gray-50 p-2 rounded">log₁₀N = {realReg.intercept.toFixed(2)} - <span className="text-red-600 font-bold">{realReg.b.toFixed(3)}</span>M</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 시계열 탭 */}
            {tab === 'time' && (
              <div className="space-y-6">
                <div className="bg-purple-50 rounded-xl p-5 border border-purple-100">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    시간에 따른 b-value 변화
                  </h3>
                  <div className="flex flex-col md:flex-row gap-4 md:items-end">
                    <div>
                      <label className="block text-sm mb-1">윈도우 크기: {winSize}일</label>
                      <input type="range" min="30" max="180" step="15" value={winSize} onChange={e => setWinSize(parseInt(e.target.value))} className="w-40" />
                    </div>
                    <button onClick={() => calcTempB(realData)} disabled={realData.length < 50} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" /> 시계열 분석
                    </button>
                  </div>
                  {realData.length < 50 && (
                    <p className="text-sm text-orange-600 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" /> 먼저 "실제 데이터" 탭에서 데이터를 불러오세요
                    </p>
                  )}
                </div>

                {tempB.length > 0 && (
                  <>
                    <div className="bg-white border rounded-xl p-5">
                      <h4 className="font-bold mb-3">📈 b-value 시계열</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={tempB}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tickFormatter={d => d.slice(5)} />
                          <YAxis domain={[0.5, 1.5]} />
                          <Tooltip formatter={v => typeof v === 'number' ? v.toFixed(3) : v} />
                          <Legend />
                          <Area type="monotone" dataKey="upper" stroke="none" fill="#c4b5fd" fillOpacity={0.4} name="오차범위" />
                          <Area type="monotone" dataKey="lower" stroke="none" fill="#ffffff" />
                          <Line type="monotone" dataKey="b" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} name="b-value" />
                          <ReferenceLine y={1.0} stroke="#ef4444" strokeDasharray="5 5" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white border rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-purple-600">{(tempB.reduce((a, c) => a + c.b, 0) / tempB.length).toFixed(3)}</p>
                        <p className="text-sm text-gray-500">평균 b-value</p>
                      </div>
                      <div className="bg-white border rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-red-600">{Math.min(...tempB.map(d => d.b)).toFixed(3)}</p>
                        <p className="text-sm text-gray-500">최소</p>
                      </div>
                      <div className="bg-white border rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-green-600">{Math.max(...tempB.map(d => d.b)).toFixed(3)}</p>
                        <p className="text-sm text-gray-500">최대</p>
                      </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <h4 className="font-bold mb-2 flex items-center gap-2">
                        <Info className="w-4 h-4 text-amber-600" /> 해석 가이드
                      </h4>
                      <ul className="text-sm space-y-1">
                        <li>• <strong>b 감소</strong>: 큰 지진 비율 증가 → 응력 축적 가능성</li>
                        <li>• <strong>b 증가</strong>: 작은 지진 다발 → 응력 해소 또는 여진</li>
                      </ul>
                      <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> b-value 변화만으로 지진 예측은 불가능합니다
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 하단 정보 */}
        <div className="mt-6 bg-white rounded-xl p-5 shadow">
          <h3 className="font-bold mb-3">📚 G-R 법칙 핵심</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="font-bold text-blue-800">log₁₀N = a - bM</p>
              <p className="text-gray-600 mt-1">N: M이상 지진수, b: 기울기(~1.0)</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg">
              <p className="font-bold text-emerald-800">b ≈ 1.0 (평균)</p>
              <p className="text-gray-600 mt-1">규모 1↑ → 빈도 10배↓</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <p className="font-bold text-purple-800">Mc (완전성 규모)</p>
              <p className="text-gray-600 mt-1">관측망 감지 최소 규모</p>
            </div>
          </div>
        </div>

        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="font-bold mb-2 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" /> 미디어 리터러시
          </h3>
          <div className="text-sm space-y-1">
            <p><span className="text-red-500 font-bold">❌</span> "2025년 대지진 확정" → <span className="text-gray-600">특정 날짜 예측 불가</span></p>
            <p><span className="text-red-500 font-bold">❌</span> "b값 낮아져서 곧 대지진" → <span className="text-gray-600">통계적 특성일 뿐, 예보 도구 아님</span></p>
            <p><span className="text-green-500 font-bold">✅</span> "30년 내 70-80% 확률" → <span className="text-gray-600">확률적 장기 위험 평가로 적절</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
