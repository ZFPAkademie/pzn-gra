import { LoginForm } from './magic-link-form';

export default function PortalLoginPage() {
  return (
    <main className="min-h-screen bg-[#0B1626] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <p className="text-[#C9A24D] text-xs tracking-[0.3em] uppercase mb-3">
            Pod Zlatým návrším
          </p>
          <h1 className="text-white font-light text-3xl tracking-wide">
            Klientský portál
          </h1>
          <div className="mt-4 mx-auto w-16 h-px bg-[#C9A24D] opacity-60" />
        </div>

        <div className="bg-white/5 border border-white/10 rounded-sm p-8">
          <LoginForm />
        </div>

        <p className="text-white/30 text-xs text-center mt-8">
          Přístup pouze pro majitele apartmánů.
        </p>
      </div>
    </main>
  );
}
