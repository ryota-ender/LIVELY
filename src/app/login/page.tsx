import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "ログイン" };

export default function LoginPage() {
  return (
    <AuthShell
      title="おかえりなさい"
      subtitle="ライブの記録を続けましょう。"
      footer={
        <>
          アカウントをお持ちでない方は{" "}
          <Link href="/signup" className="font-semibold text-neon-pink hover:underline">
            アカウント作成
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
