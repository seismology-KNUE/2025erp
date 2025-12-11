import React, { useState, useEffect, useCallback } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ReferenceLine, BarChart, Bar, ComposedChart, Scatter, Area, Legend, Cell
} from 'recharts';
import { 
  Play, RotateCcw, Download, MapPin, Calendar, TrendingUp, Calculator, 
  Database, ChevronRight, Info, AlertCircle, Loader, Map, Globe, FileDown
} from 'lucide-react';

// ==================== 지역 데이터베이스 ====================
const REGIONS = {
  korea: { 
    name: '한반도', lat: [33, 43], lon: [124, 132], 
    b: 0.95, type: '판내부', desc: '유라시아판 내부, 상대적 안정', 
    color: '#3b82f6', flag: '🇰🇷'
  },
  japan_all: { 
    name: '일본 전역', lat: [30, 46], lon: [128, 146], 
    b: 0.85, type: '섭입대', desc: '태평양판/필리핀판 섭입', 
    color: '#ef4444', flag: '🇯🇵'
  },
  nankai: { 
    name: '난카이 트러프', lat: [32, 35], lon: [132, 138], 
    b: 0.80, type: '메가스러스트', desc: 'M8급 주기적 발생 위험', 
    color: '#dc2626', flag: '🇯🇵'
  },
  sendai: { 
    name: '센다이/도호쿠', lat: [36, 42], lon: [139, 145], 
    b: 0.82, type: '섭입대', desc: '2011 M9.0 진원', 
    color: '#f97316', flag: '🇯🇵'
  },
  kamchatka: { 
    name: '캄차카 반도', lat: [50, 60], lon: [155, 165], 
    b: 0.78, type: '섭입대', desc: '활발한 화산활동', 
    color: '#7c3aed', flag: '🇷🇺'
  },
  alaska: { 
    name: '알래스카', lat: [55, 65], lon: [-165, -140], 
    b: 0.82, type: '섭입대', desc: '1964 M9.2 발생', 
    color: '#0891b2', flag: '🇺🇸'
  },
  chile: { 
    name: '칠레', lat: [-45, -20], lon: [-76, -68], 
    b: 0.85, type: '섭입대', desc: '1960 M9.5 역대최대', 
    color: '#059669', flag: '🇨🇱'
  },
  sumatra: { 
    name: '수마트라', lat: [-6, 6], lon: [95, 106], 
    b: 0.80, type: '섭입대', desc: '2004 M9.1 쓰나미', 
    color: '#d946ef', flag: '🇮🇩'
  },
  california: { 
    name: '캘리포니아', lat: [32, 42], lon: [-125, -114], 
    b: 1.0, type: '변환단층', desc: '샌안드레아스 단층', 
    color: '#f59e0b', flag: '🇺🇸'
  },
  turkey_east: { 
    name: '동아나톨리아', lat: [36, 40], lon: [36, 42], 
    b: 0.88, type: '주향이동', desc: '2023 M7.8 발생', 
    color: '#e11d48', flag: '🇹🇷'
  },
  turkey_north: { 
    name: '북아나톨리아', lat: [39, 42], lon: [27, 42], 
    b: 0.90, type: '변환단층', desc: '이스탄불 위험', 
    color: '#be185d', flag: '🇹🇷'
  },
  eastafrica: { 
    name: '동아프리카 열곡', lat: [-15, 15], lon: [28, 42], 
    b: 1.05, type: '발산경계', desc: '아프리카판 분리중', 
    color: '#84cc16', flag: '🌍'
  },
  iceland: { 
    name: '아이슬란드', lat: [63, 67], lon: [-25, -13], 
    b: 1.10, type: '중앙해령', desc: '해령 지표 노출', 
    color: '#06b6d4', flag: '🇮🇸'
  },
  himalaya: { 
    name: '히말라야', lat: [26, 32], lon: [80, 90], 
    b: 0.92, type: '충돌경계', desc: '2015 네팔 M7.8', 
    color: '#a855f7', flag: '🇳🇵'
  },
  sichuan: { 
    name: '쓰촨성', lat: [28, 34], lon: [100, 108], 
    b: 0.88, type: '충돌영향', desc: '2008 M7.9', 
    color: '#ec4899', flag: '🇨🇳'
  },
  philippines: { 
    name: '필리핀', lat: [5, 20], lon: [118, 128], 
    b: 0.85, type: '섭입대', desc: '환태평양 조산대', 
    color: '#f472b6', flag: '🇵🇭'
  },
  newzealand: { 
    name: '뉴질랜드', lat: [-48, -34], lon: [165, 180], 
    b: 0.95, type: '복합경계', desc: '알파인 단층', 
    color: '#14b8a6', flag: '🇳🇿'
  },
  global: { 
    name: '전 세계', lat: [-90, 90], lon: [-180, 180], 
    b: 1.0, type: '전체', desc: '전 세계 지진', 
    color: '#6b7280', flag: '🌐'
  }
};

// ==================== 유틸리티 함수 ====================

// G-R 누적 빈도 데이터 생성
const generateGRData = (mags, minM = 2.0) => {
  const bins = [];
  for (let m = minM; m <= 8.0; m += 0.1) {
    const count = mags.filter(mag => mag >= m).length;
    if (count > 0) {
      bins.push({ mag: Math.round(m * 10) / 10, count, log: Math.log10(count) });
    }
  }
  return bins;
};

// 선형 회귀
const linearRegression = (data) => {
  if (!data || data.length < 3) return null;
  const n = data.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  
  data.forEach(d => {
    sumX += d.mag;
    sumY += d.log;
    sumXY += d.mag * d.log;
    sumX2 += d.mag * d.mag;
    sumY2 += d.log * d.log;
  });
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  const yMean = sumY / n;
  let ssTotal = 0, ssResidual = 0;
  data.forEach(d => {
    const yPred = intercept + slope * d.mag;
    ssTotal += Math.pow(d.log - yMean, 2);
    ssResidual += Math.pow(d.log - yPred, 2);
  });
  const r2 = ssTotal > 0 ? 1 - (ssResidual / ssTotal) : 0;
  const se = Math.abs(slope) / Math.sqrt(n);
  
  return { slope, intercept, b: -slope, a: intercept, r2: Math.max(0, Math.min(1, r2)), se, n };
};

// 히스토그램 데이터
const getHistogram = (mags, binSize = 0.5) => {
  const bins = {};
  mags.forEach(m => {
    const bin = Math.floor(m / binSize) * binSize;
    bins[bin] = (bins[bin] || 0) + 1;
  });
  return Object.entries(bins).map(([m, c]) => ({ mag: parseFloat(m), count: c })).sort((a, b) => a.mag - b.mag);
};

// Mc 자동 추정 (MAXC 방법)
const estimateMc = (mags) => {
  const hist = getHistogram(mags, 0.1);
  if (hist.length === 0) return 2.0;
  const maxBin = hist.reduce((max, h) => h.count > max.count ? h : max, hist[0]);
  return Math.round((maxBin.mag + 0.2) * 10) / 10;
};

// 깊이별 색상
const getDepthColor = (depth) => {
  if (depth < 10) return '#ef4444';
  if (depth < 30) return '#f97316';
  if (depth < 70) return '#eab308';
  if (depth < 150) return '#22c55e';
  if (depth < 300) return '#3b82f6';
  return '#8b5cf6';
};

// 규모별 크기
const getMagSize = (mag) => {
  if (mag < 3) return 3;
  if (mag < 4) return 5;
  if (mag < 5) return 8;
  if (mag < 6) return 12;
  if (mag < 7) return 18;
  return 25;
};

// CSV 다운로드
const downloadCSV = (data, filename) => {
  const headers = ['time', 'latitude', 'longitude', 'depth', 'magnitude'];
  const csvContent = [
    headers.join(','),
    ...data.map(d => [d.time, d.lat, d.lon, d.depth, d.mag].join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

// ==================== 지진 분포 지도 컴포넌트 ====================
const EarthquakeMap = ({ data, region, regionData }) => {
  if (!data || data.length === 0) return null;
  
  const R = regionData;
  const padding = 25;
  const width = 420;
  const height = 320;
  
  let minLat = R.lat[0], maxLat = R.lat[1];
  let minLon = R.lon[0], maxLon = R.lon[1];
  
  data.forEach(d => {
    if (d.lat < minLat) minLat = d.lat;
    if (d.lat > maxLat) maxLat = d.lat;
    if (d.lon < minLon) minLon = d.lon;
    if (d.lon > maxLon) maxLon = d.lon;
  });
  
  const latRange = maxLat - minLat || 1;
  const lonRange = maxLon - minLon || 1;
  minLat -= latRange * 0.05;
  maxLat += latRange * 0.05;
  minLon -= lonRange * 0.05;
  maxLon += lonRange * 0.05;
  
  const toX = (lon) => padding + ((lon - minLon) / (maxLon - minLon)) * (width - 2 * padding);
  const toY = (lat) => height - padding - ((lat - minLat) / (maxLat - minLat)) * (height - 2 * padding);
  
  const magStats = {
    small: data.filter(d => d.mag < 4).length,
    medium: data.filter(d => d.mag >= 4 && d.mag < 5).length,
    large: data.filter(d => d.mag >= 5 && d.mag < 6).length,
    major: data.filter(d => d.mag >= 6).length
  };
  
  return (
    <div className="bg-white border rounded-xl p-4">
      <h4 className="font-bold mb-3 flex items-center gap-2">
        <Map className="w-5 h-5 text-blue-600" />
        지진 분포도 ({data.length.toLocaleString()}개)
      </h4>
      
      <div className="flex flex-col lg:flex-row gap-4">
        <svg width={width} height={height} className="bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg border shadow-inner">
          {/* 그리드 */}
          {[0.25, 0.5, 0.75].map(ratio => (
            <React.Fragment key={ratio}>
              <line x1={padding + ratio * (width - 2 * padding)} y1={padding} x2={padding + ratio * (width - 2 * padding)} y2={height - padding} stroke="#94a3b8" strokeDasharray="4,4" opacity="0.5" />
              <line x1={padding} y1={padding + ratio * (height - 2 * padding)} x2={width - padding} y2={padding + ratio * (height - 2 * padding)} stroke="#94a3b8" strokeDasharray="4,4" opacity="0.5" />
            </React.Fragment>
          ))}
          
          {/* 경계 박스 */}
          <rect x={toX(R.lon[0])} y={toY(R.lat[1])} width={Math.abs(toX(R.lon[1]) - toX(R.lon[0]))} height={Math.abs(toY(R.lat[0]) - toY(R.lat[1]))} fill={`${R.color}15`} stroke={R.color} strokeWidth="2" strokeDasharray="8,4" />
          
          {/* 지진 점 (작은 것부터 그려서 큰 것이 위에 오도록) */}
          {[...data].sort((a, b) => a.mag - b.mag).map((eq, i) => (
            <circle key={i} cx={toX(eq.lon)} cy={toY(eq.lat)} r={getMagSize(eq.mag) / 2} fill={getDepthColor(eq.depth)} opacity="0.75" stroke="#fff" strokeWidth="0.5">
              <title>M{eq.mag.toFixed(1)} | 깊이: {eq.depth.toFixed(0)}km | {eq.time.slice(0,10)}</title>
            </circle>
          ))}
          
          {/* 축 레이블 */}
          <text x={width/2} y={height - 5} textAnchor="middle" fontSize="11" fill="#475569">경도 ({minLon.toFixed(1)}° ~ {maxLon.toFixed(1)}°)</text>
          <text x={12} y={height/2} textAnchor="middle" fontSize="11" fill="#475569" transform={`rotate(-90, 12, ${height/2})`}>위도 ({minLat.toFixed(1)}° ~ {maxLat.toFixed(1)}°)</text>
        </svg>
        
        {/* 범례 */}
        <div className="text-xs space-y-4">
          <div>
            <p className="font-bold mb-2 text-gray-700">깊이 (km)</p>
            <div className="space-y-1">
              {[
                { label: '< 10 (얕음)', color: '#ef4444' },
                { label: '10-30', color: '#f97316' },
                { label: '30-70', color: '#eab308' },
                { label: '70-150', color: '#22c55e' },
                { label: '150-300', color: '#3b82f6' },
                { label: '> 300 (깊음)', color: '#8b5cf6' }
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: color }} />
                  <span className="text-gray-600">{label}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <p className="font-bold mb-2 text-gray-700">규모별 개수</p>
            <div className="space-y-1 text-gray-600">
              <div>M &lt; 4: <span className="font-medium">{magStats.small.toLocaleString()}</span></div>
              <div>M 4-5: <span className="font-medium">{magStats.medium.toLocaleString()}</span></div>
              <div>M 5-6: <span className="font-medium">{magStats.large.toLocaleString()}</span></div>
              <div>M ≥ 6: <span className="font-medium text-red-600">{magStats.major.toLocaleString()}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== 깊이 분포 컴포넌트 ====================
const DepthDistribution = ({ data }) => {
  if (!data || data.length === 0) return null;
  
  const depthBins = [
    { range: '0-10', min: 0, max: 10, color: '#ef4444' },
    { range: '10-30', min: 10, max: 30, color: '#f97316' },
    { range: '30-70', min: 30, max: 70, color: '#eab308' },
    { range: '70-150', min: 70, max: 150, color: '#22c55e' },
    { range: '150-300', min: 150, max: 300, color: '#3b82f6' },
    { range: '300+', min: 300, max: Infinity, color: '#8b5cf6' }
  ];
  
  const depthData = depthBins.map(bin => ({
    ...bin,
    count: data.filter(d => d.depth >= bin.min && d.depth < bin.max).length
  }));
  
  const avgDepth = data.reduce((sum, d) => sum + d.depth, 0) / data.length;
  const maxDepth = Math.max(...data.map(d => d.depth));
  
  return (
    <div className="bg-white border rounded-xl p-4">
      <h4 className="font-bold mb-3">📊 깊이 분포 (km)</h4>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={depthData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis type="category" dataKey="range" width={60} />
          <Tooltip formatter={(value) => [value.toLocaleString(), '지진 수']} />
          <Bar dataKey="count">
            {depthData.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-2 text-xs text-gray-600 flex gap-4">
        <span>평균 깊이: <strong>{avgDepth.toFixed(1)}km</strong></span>
        <span>최대 깊이: <strong>{maxDepth.toFixed(1)}km</strong></span>
      </div>
    </div>
  );
};

// ==================== 메인 컴포넌트 ====================
export default function GRModule() {
  const [tab, setTab] = useState('sim');
  
  // 시뮬레이션 상태
  const [simB, setSimB] = useState(1.0);
  const [simN, setSimN] = useState(500);
  const [simData, setSimData] = useState([]);
  const [simGR, setSimGR] = useState([]);
  const [simReg, setSimReg] = useState(null);
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  
  // 실제 데이터 상태
  const [region, setRegion] = useState('japan_all');
  const [startDate, setStartDate] = useState('2023-01-01');
  const [endDate, setEndDate] = useState('2024-01-01');
  const [realData, setRealData] = useState([]);
  const [realGR, setRealGR] = useState([]);
  const [realReg, setRealReg] = useState(null);
  const [mc, setMc] = useState(2.5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dataSource, setDataSource] = useState(null);
  
  // 시계열 상태
  const [temporalB, setTemporalB] = useState([]);
  const [windowSize, setWindowSize] = useState(90);

  // 시뮬레이션 데이터 생성
  const generateSimulation = useCallback(() => {
    const mags = [];
    for (let i = 0; i < simN * 5 && mags.length < simN; i++) {
      const u = Math.random();
      const m = 2.0 - Math.log10(u) / simB;
      if (m >= 2.0 && m <= 8.0) {
        mags.push(Math.round(m * 10) / 10);
      }
    }
    setSimData(mags);
    setStep(0);
    setSimGR([]);
    setSimReg(null);
  }, [simB, simN]);

  // 단계별 애니메이션
  const runAnimation = async () => {
    if (simData.length === 0) {
      generateSimulation();
      return;
    }
    
    setAnimating(true);
    setStep(1);
    await new Promise(r => setTimeout(r, 1000));
    
    const gr = generateGRData(simData, 2.0);
    setSimGR(gr);
    setStep(2);
    await new Promise(r => setTimeout(r, 1000));
    
    setStep(3);
    await new Promise(r => setTimeout(r, 1000));
    
    const reg = linearRegression(gr);
    setSimReg(reg);
    setStep(4);
    setAnimating(false);
  };

  // USGS 데이터 로드
  const loadUSGSData = async () => {
    setLoading(true);
    setError(null);
    setDataSource(null);
    
    const R = REGIONS[region];
    
    try {
      let url = 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson';
      url += `&starttime=${startDate}&endtime=${endDate}&minmagnitude=1.5&orderby=time`;
      
      if (region !== 'global') {
        url += `&minlatitude=${R.lat[0]}&maxlatitude=${R.lat[1]}&minlongitude=${R.lon[0]}&maxlongitude=${R.lon[1]}`;
      }
      
      console.log('USGS API 요청:', url);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const json = await response.json();
      
      if (!json.features || json.features.length === 0) {
        throw new Error('해당 기간/지역에 지진 데이터가 없습니다.');
      }
      
      const data = json.features
        .map(f => ({
          time: new Date(f.properties.time).toISOString(),
          mag: f.properties.mag,
          lat: f.geometry.coordinates[1],
          lon: f.geometry.coordinates[0],
          depth: Math.max(0, f.geometry.coordinates[2] || 0),
          place: f.properties.place || ''
        }))
        .filter(d => d.mag !== null && d.mag >= 1.5)
        .sort((a, b) => new Date(a.time) - new Date(b.time));
      
      console.log(`USGS에서 ${data.length}개 지진 로드 완료`);
      
      setRealData(data);
      setDataSource('USGS');
      
      const estimatedMc = estimateMc(data.map(d => d.mag));
      setMc(estimatedMc);
      processRealData(data, estimatedMc);
      
    } catch (err) {
      console.error('USGS 오류:', err);
      
      if (err.name === 'AbortError') {
        setError('요청 시간 초과. 기간을 줄이거나 나중에 다시 시도해주세요.');
      } else {
        setError(`${err.message} - 샘플 데이터를 생성합니다.`);
        generateSampleData();
      }
    }
    
    setLoading(false);
  };

  // 샘플 데이터 생성
  const generateSampleData = () => {
    const R = REGIONS[region];
    const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
    const data = [];
    const baseCount = Math.min(days * 2, 2000);
    
    for (let i = 0; i < baseCount; i++) {
      const u = Math.random();
      const m = 2.0 - Math.log10(u) / R.b;
      
      if (m >= 2.0 && m <= 8.5) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + Math.floor(Math.random() * days));
        date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
        
        data.push({
          time: date.toISOString(),
          mag: Math.round(m * 10) / 10,
          lat: R.lat[0] + Math.random() * (R.lat[1] - R.lat[0]),
          lon: R.lon[0] + Math.random() * (R.lon[1] - R.lon[0]),
          depth: Math.random() < 0.7 ? Math.random() * 30 : 30 + Math.random() * 300,
          place: `${R.name} 부근`
        });
      }
    }
    
    data.sort((a, b) => new Date(a.time) - new Date(b.time));
    setRealData(data);
    setDataSource('샘플 (시뮬레이션)');
    
    const estimatedMc = estimateMc(data.map(d => d.mag));
    setMc(estimatedMc);
    processRealData(data, estimatedMc);
  };

  // 실제 데이터 처리
  const processRealData = useCallback((data, minMag) => {
    const mags = data.map(d => d.mag);
    const gr = generateGRData(mags, minMag);
    setRealGR(gr);
    
    const filteredGR = gr.filter(d => d.mag >= minMag);
    const reg = linearRegression(filteredGR);
    setRealReg(reg);
    
    calculateTemporalB(data, minMag);
  }, []);

  // 시계열 b-value 계산
  const calculateTemporalB = useCallback((data, minMag) => {
    if (data.length < 50) {
      setTemporalB([]);
      return;
    }
    
    const sorted = [...data].sort((a, b) => new Date(a.time) - new Date(b.time));
    const results = [];
    
    let windowStart = new Date(sorted[0].time);
    const dataEnd = new Date(sorted[sorted.length - 1].time);
    
    while (windowStart < dataEnd) {
      const windowEnd = new Date(windowStart);
      windowEnd.setDate(windowEnd.getDate() + windowSize);
      
      const windowData = sorted.filter(d => {
        const t = new Date(d.time);
        return t >= windowStart && t < windowEnd;
      });
      
      if (windowData.length >= 30) {
        const mags = windowData.map(d => d.mag).filter(m => m >= minMag);
        
        if (mags.length >= 20) {
          const meanMag = mags.reduce((a, b) => a + b, 0) / mags.length;
          const b = Math.log10(Math.E) / (meanMag - (minMag - 0.05));
          const se = b / Math.sqrt(mags.length);
          
          results.push({
            date: windowStart.toISOString().slice(0, 10),
            b: Math.round(b * 1000) / 1000,
            se: Math.round(se * 1000) / 1000,
            n: mags.length,
            upper: Math.round((b + se) * 1000) / 1000,
            lower: Math.round((b - se) * 1000) / 1000
          });
        }
      }
      
      windowStart.setDate(windowStart.getDate() + 30);
    }
    
    setTemporalB(results);
  }, [windowSize]);

  // Mc 또는 윈도우 크기 변경 시 재처리
  useEffect(() => {
    if (realData.length > 0) {
      processRealData(realData, mc);
    }
  }, [mc, windowSize, realData, processRealData]);

  // 초기 시뮬레이션
  useEffect(() => {
    generateSimulation();
  }, [generateSimulation]);

  const R = REGIONS[region];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Globe className="w-7 h-7" />
              구텐베르그-리히터 법칙 체험
            </h1>
            <p className="mt-1 opacity-90">지진 통계 분석의 기초를 직접 경험해보세요</p>
          </div>

          {/* 탭 */}
          <div className="flex border-b">
            {[
              { id: 'sim', label: '시뮬레이션', icon: Calculator, color: 'blue' },
              { id: 'real', label: '실제 데이터', icon: Database, color: 'emerald' },
              { id: 'time', label: '시계열 분석', icon: TrendingUp, color: 'purple' }
            ].map(({ id, label, icon: Icon, color }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex-1 py-3 font-medium transition-all flex items-center justify-center gap-2 ${
                  tab === id 
                    ? `text-${color}-600 border-b-2 border-${color}-600 bg-${color}-50` 
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* ===== 시뮬레이션 탭 ===== */}
            {tab === 'sim' && (
              <div className="space-y-6">
                <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-blue-600" />
                    시뮬레이션 설정
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        설정 b-value: <span className="text-blue-600 font-bold text-lg">{simB.toFixed(2)}</span>
                      </label>
                      <input type="range" min="0.5" max="1.5" step="0.05" value={simB} onChange={e => setSimB(parseFloat(e.target.value))} className="w-full" />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0.5 (대규모↑)</span><span>1.0</span><span>1.5 (소규모↑)</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        지진 개수: <span className="text-blue-600 font-bold text-lg">{simN.toLocaleString()}</span>
                      </label>
                      <input type="range" min="100" max="2000" step="100" value={simN} onChange={e => setSimN(parseInt(e.target.value))} className="w-full" />
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mt-4">
                    <button onClick={generateSimulation} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2">
                      <RotateCcw className="w-4 h-4" /> 데이터 생성
                    </button>
                    <button onClick={runAnimation} disabled={animating} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                      {animating ? <Loader className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                      {animating ? '분석 중...' : '단계별 분석 시작'}
                    </button>
                  </div>
                </div>

                {/* 진행 단계 */}
                <div className="flex justify-center items-center gap-2 py-4">
                  {[
                    { num: 1, label: '히스토그램' },
                    { num: 2, label: '누적 빈도' },
                    { num: 3, label: '로그 변환' },
                    { num: 4, label: 'b-value' }
                  ].map(({ num, label }) => (
                    <React.Fragment key={num}>
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step >= num ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>{num}</div>
                        <span className={`text-xs mt-1 ${step >= num ? 'text-blue-600' : 'text-gray-400'}`}>{label}</span>
                      </div>
                      {num < 4 && <ChevronRight className={`w-5 h-5 ${step >= num ? 'text-blue-600' : 'text-gray-300'}`} />}
                    </React.Fragment>
                  ))}
                </div>

                {step >= 1 && (
                  <div className="bg-white border rounded-xl p-5">
                    <h4 className="font-bold mb-3">📊 Step 1: 규모별 빈도 분포</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={getHistogram(simData)}>
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
                    <h4 className="font-bold mb-3">{step >= 3 ? '📐 Step 3-4: G-R 플롯' : '📈 Step 2: 누적 빈도'}</h4>
                    <ResponsiveContainer width="100%" height={280}>
                      <ComposedChart data={simGR}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mag" label={{ value: '규모 (M)', position: 'bottom', offset: -5 }} />
                        <YAxis scale={step >= 3 ? "log" : "linear"} domain={step >= 3 ? [1, 'auto'] : [0, 'auto']} />
                        <Tooltip />
                        <Scatter dataKey="count" fill="#3b82f6" name="실측값" />
                        {step >= 4 && simReg && (
                          <Line type="linear" dataKey="fitted" data={simGR.map(d => ({ ...d, fitted: Math.pow(10, simReg.intercept + simReg.slope * d.mag) }))} stroke="#ef4444" strokeWidth={2} dot={false} name="회귀선" />
                        )}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {step >= 4 && simReg && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                      <h4 className="font-bold text-green-800 mb-3">✅ 계산 결과</h4>
                      <p className="text-4xl font-bold text-green-700 text-center">b = {simReg.b.toFixed(3)}</p>
                      <p className="text-sm text-gray-600 mt-2 text-center">설정값: {simB.toFixed(2)} | 오차: {Math.abs(simReg.b - simB).toFixed(3)} | R²: {simReg.r2.toFixed(3)}</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                      <h4 className="font-bold text-blue-800 mb-3">📖 해석</h4>
                      <ul className="text-sm space-y-1">
                        <li>• G-R 법칙: log₁₀N = {simReg.a.toFixed(2)} - {simReg.b.toFixed(2)}M</li>
                        <li>• 규모 1 증가 → 빈도 약 <strong>{Math.pow(10, simReg.b).toFixed(1)}배</strong> 감소</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===== 실제 데이터 탭 ===== */}
            {tab === 'real' && (
              <div className="space-y-6">
                <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Database className="w-5 h-5 text-emerald-600" />
                    USGS 지진 데이터 분석
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1"><MapPin className="w-4 h-4 inline" /> 지역</label>
                      <select value={region} onChange={e => setRegion(e.target.value)} className="w-full p-2 border rounded-lg bg-white">
                        <optgroup label="🌏 동아시아">
                          {['korea', 'japan_all', 'nankai', 'sendai', 'sichuan', 'philippines'].map(k => (
                            <option key={k} value={k}>{REGIONS[k].flag} {REGIONS[k].name}</option>
                          ))}
                        </optgroup>
                        <optgroup label="🔥 환태평양">
                          {['kamchatka', 'alaska', 'california', 'sumatra', 'chile', 'newzealand'].map(k => (
                            <option key={k} value={k}>{REGIONS[k].flag} {REGIONS[k].name}</option>
                          ))}
                        </optgroup>
                        <optgroup label="⚡ 변환/충돌">
                          {['turkey_east', 'turkey_north', 'himalaya'].map(k => (
                            <option key={k} value={k}>{REGIONS[k].flag} {REGIONS[k].name}</option>
                          ))}
                        </optgroup>
                        <optgroup label="🌋 발산경계">
                          {['eastafrica', 'iceland'].map(k => (
                            <option key={k} value={k}>{REGIONS[k].flag} {REGIONS[k].name}</option>
                          ))}
                        </optgroup>
                        <optgroup label="🌐 전체">
                          <option value="global">🌐 전 세계</option>
                        </optgroup>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1"><Calendar className="w-4 h-4 inline" /> 시작일</label>
                      <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 border rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1"><Calendar className="w-4 h-4 inline" /> 종료일</label>
                      <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 border rounded-lg" />
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 rounded-lg border-l-4" style={{ borderColor: R.color, backgroundColor: `${R.color}10` }}>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-bold text-lg">{R.flag} {R.name}</span>
                        <span className="text-sm text-gray-600 ml-2">{R.desc}</span>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: R.color }}>{R.type}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">📍 위도 {R.lat[0]}°~{R.lat[1]}° | 경도 {R.lon[0]}°~{R.lon[1]}° | 예상 b: ~{R.b}</p>
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-4 items-end">
                    <div>
                      <label className="block text-sm font-medium mb-1">Mc</label>
                      <input type="number" value={mc} onChange={e => setMc(parseFloat(e.target.value))} step="0.1" min="1" max="5" className="w-24 p-2 border rounded-lg" />
                    </div>
                    <button onClick={loadUSGSData} disabled={loading} className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2">
                      {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      {loading ? '로드 중...' : 'USGS 데이터 불러오기'}
                    </button>
                    {realData.length > 0 && (
                      <button onClick={() => downloadCSV(realData, `earthquakes_${region}_${startDate}_${endDate}.csv`)} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2">
                        <FileDown className="w-4 h-4" /> CSV
                      </button>
                    )}
                  </div>
                  
                  {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>

                {realData.length > 0 && (
                  <>
                    {dataSource && (
                      <div className={`p-2 rounded-lg text-sm text-center ${dataSource === 'USGS' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        📡 {dataSource} | 총 {realData.length.toLocaleString()}개 지진
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="bg-white border rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-blue-600">{realData.length.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">총 지진 수</p>
                      </div>
                      <div className="bg-white border rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-orange-600">M{Math.max(...realData.map(d => d.mag)).toFixed(1)}</p>
                        <p className="text-xs text-gray-500">최대 규모</p>
                      </div>
                      <div className="bg-white border rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-emerald-600">{realReg?.b.toFixed(3) || '-'}</p>
                        <p className="text-xs text-gray-500">b-value</p>
                      </div>
                      <div className="bg-white border rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-purple-600">M{mc}</p>
                        <p className="text-xs text-gray-500">Mc</p>
                      </div>
                      <div className="bg-white border-2 rounded-xl p-3 text-center" style={{ borderColor: R.color }}>
                        <p className="text-lg font-bold" style={{ color: R.color }}>{R.type}</p>
                        <p className="text-xs text-gray-500">판구조</p>
                      </div>
                    </div>

                    {realReg && (
                      <div className={`p-4 rounded-xl border-l-4 ${realReg.b < 0.85 ? 'bg-red-50 border-red-500' : realReg.b > 1.1 ? 'bg-blue-50 border-blue-500' : 'bg-green-50 border-green-500'}`}>
                        <h4 className="font-bold mb-1"><Info className="w-4 h-4 inline" /> b-value 해석</h4>
                        <p className="text-sm">
                          {realReg.b < 0.85 && <><strong className="text-red-600">b={realReg.b.toFixed(3)} (낮음)</strong> - 대규모 지진 비율 높음, 섭입대 특성</>}
                          {realReg.b >= 0.85 && realReg.b <= 1.1 && <><strong className="text-green-600">b={realReg.b.toFixed(3)} (평균)</strong> - 전형적인 지각 응력 상태</>}
                          {realReg.b > 1.1 && <><strong className="text-blue-600">b={realReg.b.toFixed(3)} (높음)</strong> - 소규모 지진 다발, 화산/열곡 특성</>}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">R²={realReg.r2.toFixed(3)} | SE=±{realReg.se.toFixed(3)} | n={realReg.n}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <EarthquakeMap data={realData} region={region} regionData={R} />
                      <DepthDistribution data={realData} />
                    </div>

                    <div className="bg-white border rounded-xl p-5">
                      <h4 className="font-bold mb-3">📊 규모별 빈도</h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={getHistogram(realData.map(d => d.mag))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="mag" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#10b981" />
                          <ReferenceLine x={mc} stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-white border rounded-xl p-5">
                      <h4 className="font-bold mb-3">📐 G-R 플롯</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={realGR}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="mag" label={{ value: '규모 (M)', position: 'bottom', offset: -5 }} />
                          <YAxis scale="log" domain={[1, 'auto']} />
                          <Tooltip />
                          <Scatter dataKey="count" fill="#10b981" name="실측값" />
                          {realReg && (
                            <Line type="linear" dataKey="fitted" data={realGR.filter(d => d.mag >= mc).map(d => ({ ...d, fitted: Math.pow(10, realReg.intercept + realReg.slope * d.mag) }))} stroke="#ef4444" strokeWidth={2} dot={false} />
                          )}
                          <ReferenceLine x={mc} stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" />
                        </ComposedChart>
                      </ResponsiveContainer>
                      {realReg && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg font-mono text-sm">
                          log₁₀N = <span className="text-blue-600">{realReg.a.toFixed(3)}</span> - <span className="text-red-600 font-bold">{realReg.b.toFixed(3)}</span>M
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ===== 시계열 탭 ===== */}
            {tab === 'time' && (
              <div className="space-y-6">
                <div className="bg-purple-50 rounded-xl p-5 border border-purple-100">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    시간에 따른 b-value 변화
                  </h3>
                  
                  <div className="flex flex-wrap gap-4 items-end">
                    <div>
                      <label className="block text-sm font-medium mb-1">윈도우: <span className="text-purple-600 font-bold">{windowSize}일</span></label>
                      <input type="range" min="30" max="180" step="15" value={windowSize} onChange={e => setWindowSize(parseInt(e.target.value))} className="w-48" />
                    </div>
                    <button onClick={() => calculateTemporalB(realData, mc)} disabled={realData.length < 50} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" /> 분석 실행
                    </button>
                  </div>
                  
                  {realData.length < 50 && (
                    <p className="mt-4 text-sm text-orange-600 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      먼저 "실제 데이터" 탭에서 데이터를 불러오세요.
                    </p>
                  )}
                </div>

                {temporalB.length > 0 && (
                  <>
                    <div className="bg-white border rounded-xl p-5">
                      <h4 className="font-bold mb-3">📈 b-value 시계열</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={temporalB}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tickFormatter={d => d.slice(5)} />
                          <YAxis domain={[0.4, 1.6]} />
                          <Tooltip formatter={v => typeof v === 'number' ? v.toFixed(3) : v} />
                          <Legend />
                          <Area type="monotone" dataKey="upper" stroke="none" fill="#c4b5fd" fillOpacity={0.4} name="상한" />
                          <Area type="monotone" dataKey="lower" stroke="none" fill="#fff" name="하한" />
                          <Line type="monotone" dataKey="b" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} name="b-value" />
                          <ReferenceLine y={1.0} stroke="#ef4444" strokeDasharray="5 5" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white border rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-purple-600">{(temporalB.reduce((a, c) => a + c.b, 0) / temporalB.length).toFixed(3)}</p>
                        <p className="text-sm text-gray-500">평균</p>
                      </div>
                      <div className="bg-white border rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-red-600">{Math.min(...temporalB.map(d => d.b)).toFixed(3)}</p>
                        <p className="text-sm text-gray-500">최소</p>
                      </div>
                      <div className="bg-white border rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-green-600">{Math.max(...temporalB.map(d => d.b)).toFixed(3)}</p>
                        <p className="text-sm text-gray-500">최대</p>
                      </div>
                      <div className="bg-white border rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-blue-600">{temporalB.length}</p>
                        <p className="text-sm text-gray-500">구간 수</p>
                      </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <h4 className="font-bold mb-2"><Info className="w-4 h-4 inline text-amber-600" /> 해석 가이드</h4>
                      <ul className="text-sm space-y-1">
                        <li>• <strong>b 감소</strong>: 대규모 지진 비율↑ → 응력 축적 가능성</li>
                        <li>• <strong>b 증가</strong>: 소규모 지진↑ → 응력 해소 또는 여진</li>
                      </ul>
                      <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-700">
                        <AlertCircle className="w-4 h-4 inline" /> <strong>주의:</strong> b-value 변화만으로 지진 예측은 불가능합니다.
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 하단 정보 */}
        <div className="mt-6 bg-white rounded-xl p-5 shadow">
          <h3 className="font-bold mb-3"><Info className="w-5 h-5 inline text-blue-600" /> G-R 법칙 핵심</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="font-bold text-blue-800 text-lg">log₁₀N = a - bM</p>
              <p className="text-gray-600 mt-1">N: M 이상 지진 수, b: 기울기</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-lg">
              <p className="font-bold text-emerald-800 text-lg">b ≈ 1.0</p>
              <p className="text-gray-600 mt-1">규모 1↑ → 빈도 10배↓</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="font-bold text-purple-800 text-lg">Mc (완전성 규모)</p>
              <p className="text-gray-600 mt-1">관측망 감지 최소 규모</p>
            </div>
          </div>
        </div>

        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="font-bold mb-2"><AlertCircle className="w-5 h-5 inline text-amber-600" /> 미디어 리터러시</h3>
          <div className="text-sm space-y-1">
            <p><span className="text-red-500 font-bold">❌</span> "2025년 대지진 확정" → 특정 날짜 예측 불가</p>
            <p><span className="text-red-500 font-bold">❌</span> "b값 낮아져서 곧 대지진" → 예보 도구 아님</p>
            <p><span className="text-green-500 font-bold">✅</span> "30년 내 70-80% 확률" → 확률적 장기 평가로 적절</p>
          </div>
        </div>
      </div>
    </div>
  );
}
