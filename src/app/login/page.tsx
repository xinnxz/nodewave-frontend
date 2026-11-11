'use client';

import { api, extractApiError } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import type { User } from '@/types';
import { Activity, Eye, EyeOff, Info, Lock, Mail, Shield, Users } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';

const SEEDED_PERSONAS = [
  {
    initials: 'AP',
    name: 'Andi Pratama',
    role: 'Product Manager',
    dept: 'PRODUCT',
    email: 'pm@nodewave.id',
  },
  {
    initials: 'SR',
    name: 'Siti Rahma',
    role: 'UI/UX Designer',
    dept: 'UIUX',
    email: 'uiux@nodewave.id',
  },
  {
    initials: 'BS',
    name: 'Budi Santoso',
    role: 'Frontend Engineer',
    dept: 'FRONTEND',
    email: 'frontend@nodewave.id',
  },
  {
    initials: 'EW',
    name: 'Eko Wijaya',
    role: 'Backend Engineer',
    dept: 'BACKEND',
    email: 'backend@nodewave.id',
  },
  {
    initials: 'MJ',
    name: 'PT Maju Jaya',
    role: 'Client Guest',
    dept: 'CLIENT',
    email: 'client@guest.com',
    fullWidth: true,
  },
];

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [email, setEmail] = useState('pm@nodewave.id');
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // WebGL Interactive Dot Matrix Canvas Background (Original 21st.dev template settings)
  useEffect(() => {
    let active = true;
    let renderer: any;
    let geometry: any;
    let material: any;
    let scene: any;
    let camera: any;
    let animationId: number;

    const initThree = (THREE: any) => {
      if (!canvasRef.current || !active) return;
      const canvas = canvasRef.current;
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);

      scene = new THREE.Scene();
      camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      const uniforms = {
        u_time: { value: 0 },
        u_mouse: { value: new THREE.Vector2(-5000, -5000) },
        u_resolution: { value: new THREE.Vector2(window.innerWidth * 2, window.innerHeight * 2) },
        u_opacities: { value: [0.18, 0.24, 0.3, 0.38, 0.46, 0.54, 0.62, 0.7, 0.76, 0.82] },
        u_colors: {
          value: [
            new THREE.Vector3(0.78, 0.82, 0.88),
            new THREE.Vector3(0.78, 0.82, 0.88),
            new THREE.Vector3(0.78, 0.82, 0.88),
            new THREE.Vector3(0.78, 0.82, 0.88),
            new THREE.Vector3(0.78, 0.82, 0.88),
            new THREE.Vector3(0.78, 0.82, 0.88),
          ],
        },
        u_total_size: { value: 20.0 },
        u_dot_size: { value: 5.2 },
        u_reverse: { value: 0 },
      };

      material = new THREE.ShaderMaterial({
        vertexShader: `
          precision mediump float;
          uniform vec2 u_resolution;
          out vec2 fragCoord;
          void main() {
            gl_Position = vec4(position, 1.0);
            fragCoord = (position.xy + 1.0) * 0.5 * u_resolution;
            fragCoord.y = u_resolution.y - fragCoord.y;
          }
        `,
        fragmentShader: `
          precision mediump float;
          in vec2 fragCoord;

          uniform float u_time;
          uniform vec2 u_mouse;
          uniform float u_opacities[10];
          uniform vec3 u_colors[6];
          uniform float u_total_size;
          uniform float u_dot_size;
          uniform vec2 u_resolution;
          uniform int u_reverse;

          out vec4 fragColor;

          float PHI = 1.61803398874989484820459;
          float random(vec2 xy) {
              return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x);
          }

          void main() {
              vec2 st = fragCoord.xy;
              st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));
              st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));

              float opacity = step(0.0, st.x) * step(0.0, st.y);

              vec2 st2 = vec2(int(st.x / u_total_size), int(st.y / u_total_size));

              float frequency = 5.0;
              float show_offset = random(st2);
              float rand = random(st2 * floor((u_time / frequency) + show_offset + frequency));
              opacity *= u_opacities[int(rand * 10.0)];

              // ─── NodeWave Ripple & Wave Interaction ───
              float mouse_dist = distance(fragCoord.xy, u_mouse);
              float mouse_radius = 850.0; // Wide radius (~425px on screen)
              float d = clamp(mouse_dist / mouse_radius, 0.0, 1.0);

              // Concentric sinusoidal wave propagating outward from cursor
              float wave_phase = (mouse_dist * 0.024) - (u_time * 3.5);
              float raw_wave = sin(wave_phase);
              // Sharpen wave peaks for defined, crisp ripple rings (ombak)
              float wave_crest = pow(max(raw_wave, 0.0), 1.6);

              // Wave envelope: prominent ripple along the middle-to-outer ring (pinggirannya)
              float ring_envelope = sin(d * 3.14159265);
              float boundary_fade = 1.0 - smoothstep(0.82, 1.0, d);
              float wave_amplitude = wave_crest * ring_envelope * boundary_fade;

              // Soft central luminous glow right under cursor
              float center_glow = (1.0 - smoothstep(0.0, 0.45, d)) * 0.35;

              // Combined total wave intensity
              float wave_effect = clamp(wave_amplitude * 0.85 + center_glow, 0.0, 1.0);

              // Dynamic dot size: swell physically at wave crests from 5.2px up to 7.2px
              float dynamic_dot_size = u_dot_size + (wave_effect * 2.0);

              opacity *= 1.0 - step(dynamic_dot_size / u_total_size, fract(st.x / u_total_size));
              opacity *= 1.0 - step(dynamic_dot_size / u_total_size, fract(st.y / u_total_size));

              vec3 color = u_colors[int(show_offset * 6.0)];

              float animation_speed_factor = 3.0;
              vec2 center_grid = u_resolution / 2.0 / u_total_size;
              float dist_from_center = distance(center_grid, st2);

              float timing_offset_intro = dist_from_center * 0.01 + (random(st2) * 0.15);

              float current_timing_offset = timing_offset_intro;
              opacity *= step(current_timing_offset, u_time * animation_speed_factor);
              opacity *= clamp((1.0 - step(current_timing_offset + 0.1, u_time * animation_speed_factor)) * 1.25, 1.0, 1.25);

              // Boost opacity at wave crests for clear visible presence
              opacity += wave_effect * 0.48 * step(0.001, opacity);
              opacity = clamp(opacity, 0.0, 0.85);

              // Wave crests illuminate with luminous crisp silver-white
              vec3 wave_glow_color = vec3(0.92, 0.96, 1.0);
              color = mix(color, wave_glow_color, wave_effect * 0.75);

              fragColor = vec4(color, opacity);
          }
        `,
        uniforms: uniforms,
        glslVersion: THREE.GLSL3,
        blending: THREE.CustomBlending,
        blendSrc: THREE.SrcAlphaFactor,
        blendDst: THREE.OneFactor,
        transparent: true,
      });

      geometry = new THREE.PlaneGeometry(2, 2);
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      const startTime = performance.now();
      const currentMouse = new THREE.Vector2(-5000, -5000);
      const targetMouse = new THREE.Vector2(-5000, -5000);

      const animate = () => {
        if (!active) return;
        animationId = requestAnimationFrame(animate);
        uniforms.u_time.value = (performance.now() - startTime) / 1000.0;

        // Silky smooth fluid lerp interpolation (0.10) for velvety organic wave tracking
        currentMouse.x += (targetMouse.x - currentMouse.x) * 0.1;
        currentMouse.y += (targetMouse.y - currentMouse.y) * 0.1;
        uniforms.u_mouse.value.copy(currentMouse);

        renderer.render(scene, camera);
      };
      animate();

      const handleMouseMove = (e: MouseEvent) => {
        targetMouse.set(e.clientX * 2.0, e.clientY * 2.0);
      };

      const handleMouseLeave = () => {
        targetMouse.set(-5000, -5000);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseleave', handleMouseLeave);

      const handleResize = () => {
        if (!renderer || !active) return;
        renderer.setSize(window.innerWidth, window.innerHeight);
        uniforms.u_resolution.value.set(window.innerWidth * 2, window.innerHeight * 2);
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseleave', handleMouseLeave);
        window.removeEventListener('resize', handleResize);
      };
    };

    if ((window as any).THREE) {
      const cleanUp = initThree((window as any).THREE);
      return () => {
        active = false;
        if (cleanUp) cleanUp();
        if (animationId) cancelAnimationFrame(animationId);
        if (renderer) renderer.dispose();
        if (geometry) geometry.dispose();
        if (material) material.dispose();
      };
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.async = true;
    script.onload = () => {
      if ((window as any).THREE && active) {
        initThree((window as any).THREE);
      }
    };
    document.head.appendChild(script);

    return () => {
      active = false;
      if (animationId) cancelAnimationFrame(animationId);
      if (renderer) renderer.dispose();
      if (geometry) geometry.dispose();
      if (material) material.dispose();
    };
  }, []);

  const handleLogin = async (targetEmail: string, targetPass: string) => {
    setIsLoading(true);
    setServerError(null);
    try {
      const res = await api.post<{
        success: boolean;
        data: { user: User; token: string };
      }>('/auth/login', { email: targetEmail, password: targetPass });

      setAuth(res.data.data.user, res.data.data.token);
      router.push('/dashboard');
    } catch (err) {
      setServerError(extractApiError(err).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin(email, password);
  };

  return (
    <div className="relative h-screen max-h-screen w-full overflow-hidden bg-[#07080a] text-zinc-100 flex flex-col items-center justify-center p-3 sm:p-4 font-sans selection:bg-zinc-800">
      {/* WebGL Dot Matrix Canvas Background */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Balanced Cinematic Vignette Mask - Softens matrix dots to an elegant subtle ambient level */}
      <div className="absolute inset-0 z-1 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.35)_0%,rgba(0,0,0,0.6)_60%,rgba(0,0,0,0.9)_100%)]" />

      {/* Top Brand Header with Larger Official NodeWave Logo */}
      <div className="relative z-10 mb-2 sm:mb-2.5 text-center">
        <div className="flex items-center justify-center gap-3">
          <div className="relative h-10 w-10 sm:h-12 sm:w-12 shrink-0">
            <Image
              src="/nodewave-logo.png"
              alt="NodeWave Logo"
              width={48}
              height={48}
              className="h-full w-full object-contain filter drop-shadow-[0_2px_10px_rgba(255,255,255,0.15)]"
              priority
            />
          </div>
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            NodeWave
          </span>
        </div>
        <p className="mt-0.5 text-xs text-zinc-400 font-medium tracking-wide">
          Deliverables Management System
        </p>
      </div>

      {/* Main Glass/Matte Login Card (Strict Compact Viewport Fit - No Scroll) */}
      <div className="relative z-10 w-full max-w-[480px] rounded-2xl border border-zinc-800/80 bg-[#0d0f14]/92 backdrop-blur-xl px-6 py-4.5 sm:px-7 sm:py-5 shadow-2xl shadow-black/90">
        {/* Secure Workspace Pill */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700/60 bg-zinc-800/40 px-2 py-0.5 text-[10px] font-medium tracking-wider text-zinc-300">
          <Shield className="h-3 w-3 text-zinc-400" />
          <span>SECURE WORKSPACE</span>
        </div>

        {/* Heading */}
        <div className="mt-2">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">Welcome back</h1>
          <p className="mt-0.5 text-xs text-zinc-400">
            Sign in to access your projects and deliverables.
          </p>
        </div>

        {/* Error Alert */}
        {serverError && (
          <div className="mt-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-xs text-rose-300">
            {serverError}
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="mt-3 space-y-2">
          <div>
            <label htmlFor="email" className="block text-[11px] font-medium text-zinc-300">
              Email address
            </label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full rounded-lg border border-zinc-800 bg-[#090b0e] pl-9 pr-3 py-1.5 sm:py-2 text-xs text-white placeholder-zinc-500 transition-colors focus:border-zinc-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-[11px] font-medium text-zinc-300">
                Password
              </label>
              <button
                type="button"
                onClick={() => setPassword('Password123!')}
                className="text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-zinc-800 bg-[#090b0e] pl-9 pr-9 py-1.5 sm:py-2 text-xs text-white placeholder-zinc-500 transition-colors focus:border-zinc-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showPassword ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg bg-white py-2 px-3 text-xs font-semibold text-black transition-transform hover:bg-zinc-100 active:scale-[0.98] disabled:opacity-50"
          >
            <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
            <span aria-hidden="true">→</span>
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-2.5 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800/80" />
          </div>
          <span className="relative bg-[#0d0f14] px-2 text-[9px] font-semibold tracking-wider text-zinc-500 uppercase">
            OR CONTINUE WITH A SEEDED DEMO PERSONA
          </span>
        </div>

        {/* Seeded Persona Grid with 3D Person Avatar Icons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
          {SEEDED_PERSONAS.map((persona) => {
            const isFullWidth = persona.fullWidth;
            return (
              <button
                key={persona.email}
                type="button"
                disabled={isLoading}
                onClick={() => {
                  setEmail(persona.email);
                  setPassword('Password123!');
                  handleLogin(persona.email, 'Password123!');
                }}
                className={`group flex items-center justify-between rounded-lg border border-zinc-800/80 bg-[#0a0c10] p-1.5 sm:p-2 text-left transition-all hover:border-zinc-700 hover:bg-zinc-800/30 active:scale-[0.99] ${
                  isFullWidth ? 'sm:col-span-2' : ''
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="relative flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center">
                    <Image
                      src="/avatar-3d.png"
                      alt={persona.name}
                      width={32}
                      height={32}
                      className="h-full w-full object-contain filter drop-shadow group-hover:scale-110 transition-transform duration-200"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-semibold text-zinc-200 group-hover:text-white">
                      {persona.name}
                    </p>
                    <p className="truncate text-[9.5px] text-zinc-500">{persona.role}</p>
                  </div>
                </div>

                <span className="rounded border border-zinc-800 bg-zinc-900/60 px-1.5 py-0.5 text-[8.5px] font-semibold tracking-wider text-zinc-400 group-hover:border-zinc-700 group-hover:text-zinc-300">
                  {persona.dept}
                </span>
              </button>
            );
          })}
        </div>

        {/* Demo Accounts Credentials Note */}
        <div className="mt-2 flex items-center justify-center gap-1.5 text-center text-[10px] text-zinc-500">
          <Info className="h-3 w-3 shrink-0" />
          <span>Demo accounts use seeded credentials (password: Password123!).</span>
        </div>
      </div>

      {/* Footer Below Card */}
      <div className="relative z-10 mt-2 sm:mt-2.5 space-y-0.5 text-center text-[11px] text-zinc-500">
        <div className="flex items-center justify-center gap-2 text-zinc-400">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            Built for collaborative teams
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            NodeWave Workspace
          </span>
        </div>
        <p className="text-[10px] text-zinc-600">© 2026 NodeWave Indonesia. All rights reserved.</p>
      </div>
    </div>
  );
}
