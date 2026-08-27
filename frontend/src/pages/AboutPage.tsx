import type { FC } from 'react';
import { Layers, Server, Sparkles, Check } from 'lucide-react';

export const AboutPage: FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Arsitektur & Tech Stack
        </h1>
        <p className="text-slate-500 mt-1">
          Gambaran umum integrasi antara Frontend React SPA dan Backend Express.js dengan OpenTelemetry & Prisma ORM.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Frontend Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Frontend (React SPA)
              </h2>
              <span className="text-xs text-slate-400">Vite + React 19 + TypeScript</span>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Aplikasi antarmuka pengguna berbasis Single Page Application (SPA) yang dibangun menggunakan Vite untuk kecepatan build & hot module replacement (HMR), ditata dengan Tailwind CSS v4, dan terhubung melalui Axios.
          </p>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>React Router DOM untuk navigasi halaman</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Tailwind CSS v4 untuk styling modern</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Vite Proxy otomatis ke Backend Express (Port 3000)</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Lucide Icons untuk icon interface yang bersih</span>
            </li>
          </ul>
        </div>

        {/* Backend Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Backend (Express REST API)
              </h2>
              <span className="text-xs text-slate-400">Node.js + Prisma ORM + OTel</span>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            REST API server yang menangani CRUD User, terhubung ke database via Prisma ORM / LibSQL dan terinstrumentasi penuh dengan OpenTelemetry (OTel Collector, Zipkin, Winston logger).
          </p>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Prisma ORM untuk database access yang type-safe</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>OpenTelemetry Traces & Logs ke Collector / Zipkin</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Bcrypt.js untuk hashing password user</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Centralized HTTP Logger Winston</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Guide Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
          <Sparkles className="w-4 h-4" />
          <span>Cara Menjalankan</span>
        </div>
        <p className="text-slate-300 text-sm">
          Untuk menjalankan development environment:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono pt-1">
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-700/60">
            <div className="text-slate-400 mb-1"># Terminal 1: Backend Express</div>
            <div className="text-emerald-400 font-semibold">npm run dev</div>
            <div className="text-slate-500 text-[11px] mt-1">Berjalan di port 3000</div>
          </div>
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-700/60">
            <div className="text-slate-400 mb-1"># Terminal 2: Frontend React</div>
            <div className="text-blue-400 font-semibold">cd frontend && npm run dev</div>
            <div className="text-slate-500 text-[11px] mt-1">Berjalan di port 5173</div>
          </div>
        </div>
      </div>
    </div>
  );
};
