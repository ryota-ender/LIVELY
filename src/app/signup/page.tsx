import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata: Metadata = { title: "アカウント作成" };

export default function SignupPage() {
  return (
    <AuthShell
      title="アカウント作成"
      subtitle="参戦したライブを記録して、47 都道府県の制覇を目指しましょう。"
      footer={
        <>
          すでにアカウントをお持ちの方は{" "}
          <Link href="/login" className="font-semibold text-neon-blue hover:underline">
            ログイン
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthShell>
  );
}
