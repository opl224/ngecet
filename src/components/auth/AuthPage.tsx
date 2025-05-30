
"use client";

import { useState } from "react";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AppLogo } from "@/components/core/AppLogo";

interface AuthPageProps {
  onLogin: (username: string, password_mock: string) => boolean;
  onRegister: (displayName: string, username: string, password_mock: string) => boolean;
}

export function AuthPage({ onLogin, onRegister }: AuthPageProps) {
  const [isLoginView, setIsLoginView] = useState(true);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AppLogo className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {isLoginView ? "Selamat Datang Kembali!" : "Buat Akun Baru"}
          </CardTitle>
          <CardDescription>
            {isLoginView ? "Masuk untuk melanjutkan ke Ngecet." : "Daftar untuk mulai ngecet."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoginView ? (
            <LoginForm onLogin={onLogin} />
          ) : (
            <RegisterForm onRegister={onRegister} />
          )}
          <div className="text-center">
            <Button
              variant="link"
              onClick={() => setIsLoginView(!isLoginView)}
              className="text-sm"
            >
              {isLoginView
                ? "Belum punya akun? Daftar di sini"
                : "Sudah punya akun? Masuk di sini"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
