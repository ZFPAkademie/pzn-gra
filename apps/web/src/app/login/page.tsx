/**
 * Login Page
 * 
 * Sprint 0: Placeholder only
 * Implementation in Sprint 1+
 */

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Přihlášení</h1>
        <p className="text-gray-500 text-center mb-8">
          Login functionality will be implemented in Sprint 1.
        </p>
        
        {/* Placeholder form - not functional */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              disabled
              placeholder="email@example.com"
              className="w-full px-3 py-2 border rounded-md bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Heslo</label>
            <input
              type="password"
              disabled
              placeholder="••••••••"
              className="w-full px-3 py-2 border rounded-md bg-gray-100"
            />
          </div>
          <button
            disabled
            className="w-full py-2 px-4 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed"
          >
            Přihlásit se (disabled)
          </button>
        </div>
        
        <p className="mt-8 text-xs text-gray-400 text-center">
          Sprint 0 - Foundation Setup
        </p>
      </div>
    </main>
  );
}
