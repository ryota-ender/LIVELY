import type { AuthState } from "@/lib/auth-state";

export function FormMessage({ state }: { state: AuthState }) {
  if (state.error) {
    return (
      <p
        role="alert"
        className="rounded-lg border border-red-400/40 bg-red-400/10 px-3 py-2 text-sm text-red-300"
      >
        {state.error}
      </p>
    );
  }

  if (state.notice) {
    return (
      <p
        role="status"
        className="rounded-lg border border-neon-cyan/40 bg-neon-cyan/10 px-3 py-2 text-sm text-neon-cyan"
      >
        {state.notice}
      </p>
    );
  }

  return null;
}
