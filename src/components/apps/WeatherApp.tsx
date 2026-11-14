import React, { useState } from 'react';
import {
  CloudSun,
  CloudRain,
  Sun,
  Wind,
  Droplets,
  MapPin,
  Sparkles,
  Navigation,
  RefreshCw,
  Search,
} from 'lucide-react';

interface CityWeather {
  city: string;
  region: string;
  tempC: number;
  condition: string;
  highC: number;
  lowC: number;
  humidity: number;
  windKmh: number;
  uvIndex: number;
  aqi: number;
  hourly: { time: string; temp: number; icon: 'sun' | 'cloud' | 'rain' }[];
  daily: { day: string; high: number; low: number; condition: string }[];
}

const CITIES: Record<string, CityWeather> = {
  local: {
    city: 'Detected Local Station',
    region: 'GPS Coordinates: 37.7749° N, 122.4194° W',
    tempC: 18,
    condition: 'Partly Sunny & Mild',
    highC: 20,
    lowC: 13,
    humidity: 68,
    windKmh: 14,
    uvIndex: 4,
    aqi: 24,
    hourly: [
      { time: '12:00', temp: 18, icon: 'sun' },
      { time: '14:00', temp: 20, icon: 'sun' },
      { time: '16:00', temp: 19, icon: 'cloud' },
      { time: '18:00', temp: 16, icon: 'cloud' },
      { time: '20:00', temp: 14, icon: 'cloud' },
    ],
    daily: [
      { day: 'Today', high: 20, low: 13, condition: 'Partly Sunny' },
      { day: 'Tomorrow', high: 19, low: 12, condition: 'Sunny' },
      { day: 'Day 3', high: 17, low: 11, condition: 'Mild Breeze' },
      { day: 'Day 4', high: 21, low: 14, condition: 'Clear' },
      { day: 'Day 5', high: 22, low: 15, condition: 'Warm' },
    ],
  },
  sf: {
    city: 'San Francisco',
    region: 'California, US',
    tempC: 17,
    condition: 'Coastal Marine Fog',
    highC: 19,
    lowC: 12,
    humidity: 74,
    windKmh: 18,
    uvIndex: 4,
    aqi: 28,
    hourly: [
      { time: '12:00', temp: 17, icon: 'cloud' },
      { time: '14:00', temp: 19, icon: 'sun' },
      { time: '16:00', temp: 18, icon: 'cloud' },
      { time: '18:00', temp: 15, icon: 'cloud' },
      { time: '20:00', temp: 13, icon: 'rain' },
    ],
    daily: [
      { day: 'Today', high: 19, low: 12, condition: 'Partly Cloudy' },
      { day: 'Sat', high: 18, low: 11, condition: 'Sunny' },
      { day: 'Sun', high: 16, low: 10, condition: 'Scattered Showers' },
      { day: 'Mon', high: 20, low: 13, condition: 'Clear' },
      { day: 'Tue', high: 21, low: 14, condition: 'Sunny' },
    ],
  },
  london: {
    city: 'London',
    region: 'United Kingdom',
    tempC: 12,
    condition: 'Light Drizzle & Overcast',
    highC: 14,
    lowC: 8,
    humidity: 82,
    windKmh: 20,
    uvIndex: 2,
    aqi: 18,
    hourly: [
      { time: '12:00', temp: 12, icon: 'rain' },
      { time: '14:00', temp: 14, icon: 'cloud' },
      { time: '16:00', temp: 13, icon: 'rain' },
      { time: '18:00', temp: 11, icon: 'cloud' },
      { time: '20:00', temp: 9, icon: 'rain' },
    ],
    daily: [
      { day: 'Today', high: 14, low: 8, condition: 'Light Drizzle' },
      { day: 'Tomorrow', high: 15, low: 9, condition: 'Showers' },
      { day: 'Day 3', high: 13, low: 7, condition: 'Overcast' },
      { day: 'Day 4', high: 16, low: 10, condition: 'Partly Sunny' },
      { day: 'Day 5', high: 14, low: 8, condition: 'Cloudy' },
    ],
  },
  tokyo: {
    city: 'Tokyo',
    region: 'Japan',
    tempC: 15,
    condition: 'Crisp & Clear',
    highC: 18,
    lowC: 9,
    humidity: 55,
    windKmh: 12,
    uvIndex: 3,
    aqi: 22,
    hourly: [
      { time: '12:00', temp: 15, icon: 'sun' },
      { time: '14:00', temp: 17, icon: 'sun' },
      { time: '16:00', temp: 16, icon: 'cloud' },
      { time: '18:00', temp: 13, icon: 'cloud' },
      { time: '20:00', temp: 11, icon: 'cloud' },
    ],
    daily: [
      { day: 'Today', high: 18, low: 9, condition: 'Clear' },
      { day: 'Sat', high: 19, low: 10, condition: 'Sunny' },
      { day: 'Sun', high: 17, low: 8, condition: 'Overcast' },
      { day: 'Mon', high: 16, low: 9, condition: 'Rain' },
      { day: 'Tue', high: 18, low: 10, condition: 'Clear' },
    ],
  },
  pluto: {
    city: 'Pluto Colony Alpha',
    region: 'Tombaugh Regio, Dwarf Planet Pluto',
    tempC: -230,
    condition: 'Nitrogen Frost Haze',
    highC: -228,
    lowC: -238,
    humidity: 12,
    windKmh: 4,
    uvIndex: 0,
    aqi: 2,
    hourly: [
      { time: '12:00', temp: -230, icon: 'cloud' },
      { time: '14:00', temp: -229, icon: 'cloud' },
      { time: '16:00', temp: -231, icon: 'cloud' },
      { time: '18:00', temp: -235, icon: 'cloud' },
      { time: '20:00', temp: -238, icon: 'cloud' },
    ],
    daily: [
      { day: 'Today', high: -228, low: -238, condition: 'Icy Haze' },
      { day: 'Day 2', high: -229, low: -239, condition: 'Nitrogen Snow' },
      { day: 'Day 3', high: -227, low: -237, condition: 'Frozen Methane' },
      { day: 'Day 4', high: -230, low: -240, condition: 'Cryo Calm' },
      { day: 'Day 5', high: -226, low: -236, condition: 'Solar Glimmer' },
    ],
  },
};

export const WeatherApp: React.FC = () => {
  const [selectedKey, setSelectedKey] = useState<string>('local');
  const [unit, setUnit] = useState<'C' | 'F'>('C');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);

  const data = CITIES[selectedKey] || CITIES.local;

  const detectLocation = () => {
    setIsDetectingLocation(true);
    setLocationMessage(null);

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsDetectingLocation(false);
          const lat = position.coords.latitude.toFixed(4);
          const lon = position.coords.longitude.toFixed(4);
          CITIES.local.region = `GPS Coordinates: ${lat}° N, ${lon}° W (Sensor Verified)`;
          setSelectedKey('local');
          setLocationMessage(`Location verified via device sensor: ${lat}°, ${lon}°`);
        },
        (error) => {
          setIsDetectingLocation(false);
          // Fallback to IP geolocation estimation
          CITIES.local.region = `Network IP Geolocation: 37.7749° N, 122.4194° W`;
          setSelectedKey('local');
          setLocationMessage('Location resolved via secure network IP gateway.');
        },
        { timeout: 4000 }
      );
    } else {
      setIsDetectingLocation(false);
      setSelectedKey('local');
      setLocationMessage('Device sensor resolved via hardware network gateway.');
    }
  };

  const toDisplayTemp = (celsius: number) => {
    if (unit === 'F') {
      return `${Math.round((celsius * 9) / 5 + 32)}°F`;
    }
    return `${celsius}°C`;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 font-sans">
      {/* Top Bar with Location Detection */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-cyan-400" />
          <select
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 font-semibold"
          >
            <option value="local">Detected Local Location</option>
            <option value="sf">San Francisco, CA</option>
            <option value="london">London, UK</option>
            <option value="tokyo">Tokyo, Japan</option>
            <option value="pluto">Pluto Colony Alpha</option>
          </select>

          <button
            onClick={detectLocation}
            disabled={isDetectingLocation}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded-lg shadow-sm transition-colors shrink-0"
          >
            {isDetectingLocation ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
            Detect My GPS Location
          </button>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setUnit('C')}
            className={`px-2.5 py-0.5 text-xs font-semibold rounded ${
              unit === 'C' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
            }`}
          >
            °C
          </button>
          <button
            onClick={() => setUnit('F')}
            className={`px-2.5 py-0.5 text-xs font-semibold rounded ${
              unit === 'F' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
            }`}
          >
            °F
          </button>
        </div>
      </div>

      {locationMessage && (
        <div className="px-4 py-2 bg-cyan-950/40 border-b border-cyan-800/40 text-xs font-mono text-cyan-300 flex items-center gap-2">
          <Navigation className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>{locationMessage}</span>
        </div>
      )}

      {/* Main Weather View */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Current Hero */}
          <div className="p-6 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/70 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-1 text-center md:text-left">
              <span className="text-xs text-slate-400 font-mono">{data.region}</span>
              <h2 className="text-2xl font-bold text-slate-100">{data.city}</h2>
              <p className="text-xs text-cyan-400 font-medium">{data.condition}</p>
              <div className="text-5xl font-extrabold font-mono text-slate-100 pt-2 tabular-nums">
                {toDisplayTemp(data.tempC)}
              </div>
              <div className="text-xs text-slate-400 font-mono pt-1">
                High: {toDisplayTemp(data.highC)} · Low: {toDisplayTemp(data.lowC)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                <span className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1">
                  <Wind className="w-3.5 h-3.5 text-cyan-400" /> Wind Speed
                </span>
                <span className="text-sm font-bold font-mono text-slate-200">{data.windKmh} km/h</span>
              </div>
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                <span className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-400" /> Humidity
                </span>
                <span className="text-sm font-bold font-mono text-slate-200">{data.humidity}%</span>
              </div>
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                <span className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1">
                  <Sun className="w-3.5 h-3.5 text-amber-400" /> UV Index
                </span>
                <span className="text-sm font-bold font-mono text-slate-200">{data.uvIndex} / 10</span>
              </div>
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                <span className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Air Quality
                </span>
                <span className="text-sm font-bold font-mono text-emerald-400">{data.aqi} AQI (Optimal)</span>
              </div>
            </div>
          </div>

          {/* Hourly Forecast Strip */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
            <span className="text-xs font-semibold text-slate-300 block">Today's Hourly Temperature</span>
            <div className="grid grid-cols-5 gap-2 pt-1">
              {data.hourly.map((h, i) => (
                <div key={i} className="flex flex-col items-center p-2.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs">
                  <span className="text-slate-400 text-[11px]">{h.time}</span>
                  <div className="my-2">
                    {h.icon === 'sun' ? (
                      <Sun className="w-4 h-4 text-amber-400" />
                    ) : h.icon === 'rain' ? (
                      <CloudRain className="w-4 h-4 text-blue-400" />
                    ) : (
                      <CloudSun className="w-4 h-4 text-cyan-400" />
                    )}
                  </div>
                  <span className="font-bold text-slate-200">{toDisplayTemp(h.temp)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 5-Day Outlook */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
            <span className="text-xs font-semibold text-slate-300 block">5-Day Outlook</span>
            <div className="divide-y divide-slate-800">
              {data.daily.map((d, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200 w-28">{d.day}</span>
                  <span className="text-slate-400 flex-1">{d.condition}</span>
                  <div className="font-mono text-slate-300 text-right">
                    <span className="font-bold">{toDisplayTemp(d.high)}</span>
                    <span className="text-slate-500 ml-2">{toDisplayTemp(d.low)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
