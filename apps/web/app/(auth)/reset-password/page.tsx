'use client';

import React, { useState } from 'react';
import { Button, Input, Card, Alert } from '@brightloop/ui';
import Link from 'next/link';
import { ArrowLeft, Lock, CheckCircle } from 'lucide-react';
import { PASSWORD_REGEX, PASSWORD_ERROR_MESSAGE } from '@brightloop/validation';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!PASSWORD_REGEX.test(password)) {
      setError(PASSWORD_ERROR_MESSAGE);
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 400);
  };

  return (
    <Card surface="dark" className="border border-[#242f44] p-6 space-y-6 shadow-2xl">
      <div className="space-y-1 text-center">
        <h2 className="text-xl font-bold tracking-tight text-white">Choose New Password</h2>
        <p className="text-xs text-slate-400">
          Enforce institutional password complexity for your tenant account.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {submitted ? (
        <div className="space-y-4 text-center">
          <div className="p-3 rounded-full bg-emerald-950/60 text-emerald-400 w-12 h-12 mx-auto flex items-center justify-center border border-emerald-800">
            <CheckCircle className="w-6 h-6" />
          </div>
          <Alert variant="success" title="Password Reset Successful">
            Your new password has been verified and updated. You may now sign in.
          </Alert>
          <div className="pt-2">
            <Link href="/sign-in">
              <Button variant="primary" size="md" className="w-full">
                Proceed to Sign In
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="New Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            hint="Min 8 chars, 1 uppercase, 1 lowercase, 1 special character"
          />

          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <Button
            variant="primary"
            size="md"
            className="w-full"
            leftIcon={<Lock className="w-4 h-4" />}
            type="submit"
            isLoading={loading}
          >
            Update Password
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
