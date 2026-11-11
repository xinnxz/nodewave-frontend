'use client';

import { api, extractApiError } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import type { User } from '@/types';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';

const SEEDED_PERSONAS = [
  { label: 'PM: Andi Pratama', email: 'pm@nodewave.id', role: 'PRODUCT' },
  { label: 'UI/UX: Sari Dewi', email: 'uiux@nodewave.id', role: 'UIUX' },
  { label: 'Frontend: Budi Santoso', email: 'frontend@nodewave.id', role: 'FRONTEND' },
  { label: 'Backend: Cahya Wijaya', email: 'backend@nodewave.id', role: 'BACKEND' },
  { label: 'Client: PT Maju Jaya', email: 'client@guest.com', role: 'CLIENT' },
];

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLogin, setIsLogin] = useState(true);

  // Form states
  const [email, setEmail] = useState('pm@nodewave.id');
  const [password, setPassword] = useState('Password123!');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

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
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);

      scene = new THREE.Scene();
      camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      const uniforms = {
        u_time: { value: 0 },
        u_resolution: { value: new THREE.Vector2(window.innerWidth * 2, window.innerHeight * 2) },
        u_opacities: { value: [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1.0] },
        u_colors: {
          value: [
            new THREE.Vector3(1, 1, 1),
            new THREE.Vector3(1, 1, 1),
            new THREE.Vector3(1, 1, 1),
            new THREE.Vector3(1, 1, 1),
            new THREE.Vector3(1, 1, 1),
            new THREE.Vector3(1, 1, 1),
          ],
        },
        u_total_size: { value: 20.0 },
        u_dot_size: { value: 6.0 },
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
              opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size));
              opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size));

              vec3 color = u_colors[int(show_offset * 6.0)];

              float animation_speed_factor = 3.0;
              vec2 center_grid = u_resolution / 2.0 / u_total_size;
              float dist_from_center = distance(center_grid, st2);

              float timing_offset_intro = dist_from_center * 0.01 + (random(st2) * 0.15);

              float current_timing_offset = timing_offset_intro;
              opacity *= step(current_timing_offset, u_time * animation_speed_factor);
              opacity *= clamp((1.0 - step(current_timing_offset + 0.1, u_time * animation_speed_factor)) * 1.25, 1.0, 1.25);

              fragColor = vec4(color, opacity);
              fragColor.rgb *= fragColor.a;
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
      const animate = () => {
        if (!active) return;
        animationId = requestAnimationFrame(animate);
        uniforms.u_time.value = (performance.now() - startTime) / 1000.0;
        renderer.render(scene, camera);
      };
      animate();

      const handleResize = () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        uniforms.u_resolution.value.set(window.innerWidth * 2, window.innerHeight * 2);
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    };

    // Dynamically load Three.js via script tag to avoid bundler import errors
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setServerError(null);
    try {
      const res = await api.post<{
        success: boolean;
        data: { user: User; token: string };
      }>('/auth/register', {
        name,
        email,
        password,
        role: 'INTERNAL_MEMBER',
        department: 'FRONTEND',
      });
      setAuth(res.data.data.user, res.data.data.token);
      router.push('/dashboard');
    } catch (err) {
      setServerError(extractApiError(err).message);
    } finally {
      setIsLoading(false);
    }
  };

  /* ─── shared styles matching exact 21st.dev template ─── */
  const personaBtn: React.CSSProperties = {
    width: '100%',
    padding: '0.6rem 0.8rem',
    borderRadius: 6,
    border: '1px solid #2a2a2a',
    background: 'rgba(25, 25, 25, 0.6)',
    color: '#fff',
    fontWeight: 500,
    fontSize: '0.825rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.4rem',
    transition: 'all 0.15s ease',
  };

  const input: React.CSSProperties = {
    width: '100%',
    padding: '0.65rem 0.85rem',
    borderRadius: 6,
    border: '1px solid #333',
    background: '#000',
    color: '#fff',
    fontSize: '0.875rem',
    outline: 'none',
  };

  const Logo = (
    <div
      style={{
        background: '#111',
        width: 44,
        height: 44,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: '1.15rem',
        marginBottom: '0.75rem',
        border: '1px solid #333',
        letterSpacing: '0.05em',
      }}
    >
      NW
    </div>
  );

  const Footer = (
    <div
      style={{
        marginTop: '0.85rem',
        fontSize: '0.75rem',
        color: '#666',
        lineHeight: 1.5,
        textAlign: 'center',
      }}
    >
      NodeWave Deliverables Management System
      <br />
      RBAC + ABAC · DAG Dependencies · Concurrency Control
    </div>
  );

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: '#000',
        color: '#fff',
        fontFamily: "'Inter', -apple-system, sans-serif",
        padding: '1.5rem 1rem',
      }}
    >
      {/* WebGL Dot canvas */}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />

      {/* Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          background:
            'radial-gradient(circle at center, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.98) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Modal card */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          background: '#121212',
          borderRadius: 12,
          padding: '2rem',
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          border: '1px solid #222',
        }}
      >
        {isLogin ? (
          <div
            style={{
              width: '100%',
              maxWidth: 360,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            {Logo}
            <h1
              style={{
                fontSize: '1.35rem',
                fontWeight: 600,
                marginBottom: '0.25rem',
                letterSpacing: '-0.025em',
              }}
            >
              Sign in to Account
            </h1>
            <p
              style={{
                fontSize: '0.85rem',
                color: '#888',
                marginBottom: '0.85rem',
                lineHeight: 1.5,
              }}
            >
              Sign in to your NodeWave Account.
            </p>

            {serverError && (
              <div
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 6,
                  border: '1px solid rgba(244,63,94,0.3)',
                  background: 'rgba(244,63,94,0.1)',
                  color: '#fda4af',
                  fontSize: '0.8rem',
                  marginBottom: '0.75rem',
                  textAlign: 'left',
                }}
              >
                {serverError}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin(email, password);
              }}
              style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}
            >
              <input
                style={input}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@work-email.com"
                required
              />
              <input
                style={input}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
              />
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: 6,
                  border: 'none',
                  background: '#ededed',
                  color: '#000',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  opacity: isLoading ? 0.6 : 1,
                }}
              >
                {isLoading ? 'Signing In...' : 'Continue with Email'}
              </button>
            </form>

            <div
              style={{ height: 1, background: '#222', width: '100%', margin: '1rem 0 0.85rem' }}
            />

            <div style={{ width: '100%', textAlign: 'left', marginBottom: '0.5rem' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: '#777',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                1-Click Seeded Personas (Evaluator)
              </span>
            </div>

            {SEEDED_PERSONAS.map((persona) => (
              <button
                key={persona.email}
                type="button"
                disabled={isLoading}
                onClick={() => {
                  setEmail(persona.email);
                  setPassword('Password123!');
                  handleLogin(persona.email, 'Password123!');
                }}
                style={personaBtn}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#444';
                  e.currentTarget.style.background = 'rgba(40,40,40,0.8)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#2a2a2a';
                  e.currentTarget.style.background = 'rgba(25,25,25,0.6)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background:
                        persona.role === 'PRODUCT'
                          ? '#10b981'
                          : persona.role === 'CLIENT'
                            ? '#06b6d4'
                            : '#6366f1',
                    }}
                  />
                  <span>{persona.label}</span>
                </div>
                <span style={{ fontSize: '0.7rem', color: '#888', fontFamily: 'monospace' }}>
                  →
                </span>
              </button>
            ))}

            <div style={{ marginTop: '1.25rem', fontSize: '0.875rem', color: '#888' }}>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(false);
                  setServerError(null);
                }}
                style={{
                  color: '#fff',
                  fontWeight: 500,
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                }}
              >
                Sign Up
              </button>
            </div>
            {Footer}
          </div>
        ) : (
          <div
            style={{
              width: '100%',
              maxWidth: 360,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            {Logo}
            <h1
              style={{
                fontSize: '1.35rem',
                fontWeight: 600,
                marginBottom: '0.25rem',
                letterSpacing: '-0.025em',
              }}
            >
              Sign up for Account
            </h1>
            <p
              style={{
                fontSize: '0.85rem',
                color: '#888',
                marginBottom: '0.85rem',
                lineHeight: 1.5,
              }}
            >
              Create a new account to get started.
            </p>

            {serverError && (
              <div
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 6,
                  border: '1px solid rgba(244,63,94,0.3)',
                  background: 'rgba(244,63,94,0.1)',
                  color: '#fda4af',
                  fontSize: '0.8rem',
                  marginBottom: '0.75rem',
                  textAlign: 'left',
                }}
              >
                {serverError}
              </div>
            )}

            <form
              onSubmit={handleRegister}
              style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}
            >
              <input
                style={input}
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <input
                style={input}
                type="email"
                placeholder="name@work-email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                style={input}
                type="password"
                placeholder="Password (min. 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: 6,
                  border: 'none',
                  background: '#ededed',
                  color: '#000',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  opacity: isLoading ? 0.6 : 1,
                }}
              >
                {isLoading ? 'Creating Account...' : 'Sign Up with Email'}
              </button>
            </form>

            <div style={{ marginTop: '1.25rem', fontSize: '0.875rem', color: '#888' }}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setServerError(null);
                }}
                style={{
                  color: '#fff',
                  fontWeight: 500,
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                }}
              >
                Sign In
              </button>
            </div>
            {Footer}
          </div>
        )}
      </div>
    </div>
  );
}
