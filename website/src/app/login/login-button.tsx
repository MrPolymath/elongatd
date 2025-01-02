"use client";

import { signIn } from "next-auth/react";
import { ClientSafeProvider } from "next-auth/react";

export default function LoginButton({
  provider,
}: {
  provider: ClientSafeProvider;
}) {
  return (
    <button
      onClick={() => signIn(provider.id, { callbackUrl: "/" })}
      className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      Sign in with {provider.name}
    </button>
  );
}
