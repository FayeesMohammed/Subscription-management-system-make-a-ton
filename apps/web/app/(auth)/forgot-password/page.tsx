'use client';

import React, { useState } from 'react';
import { Button, Input, Card, Alert } from '@brightloop/ui';
import Link from 'next/link';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 400);
  };

  return (
    <Card surface="dark" className="border border-[#242f44] p-6 space-y-6 shadow-2xl">
      <div className="space-y-1 text-center">
        <h2 className="text-xl font-bold tracking-tight text-white">Reset Password</h2>
        <p className="text-xs text-slate-400">
          Enter your registered work email to receive password reset instructions.
        </p>
      </div>

      {submitted ? (
        <div className="space-y-4 text-center">
          <div className="p-3 rounded-full bg-emerald-950/60 text-emerald-400 w-12 h-12 mx-auto flex items-center justify-center border border-emerald-800">
            <CheckCircle className="w-6 h-6" />
          </div>
          <Alert variant="success" title="Reset Email Dispatched">
            If an account exists for {email}, a secure password reset link has been dispatched.
          </Alert>
          <div className="pt-2">
            <Link href="/sign-in">
              <Button variant="secondary" size="sm" className="w-full">
                Back to Sign In
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Registered Work Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            required
          />

          <Button
            variant="primary"
            size="md"
            className="w-full"
            leftIcon={<Mail className="w-4 h-4" />}
            type="submit"
            isLoading={loading}
          >
            Send Reset Instructions
          </Button>

          <div className="text-center pt-2">
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#fcee21]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </form>
      )}
    </Card>
  );
}
