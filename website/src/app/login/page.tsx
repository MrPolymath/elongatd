import { getProviders } from "next-auth/react";
import LoginButton from "./login-button";

export default async function LoginPage() {
  const providers = await getProviders();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <div className="mt-8 space-y-6">
          {providers &&
            Object.values(providers).map((provider) => (
              <div key={provider.name} className="flex justify-center">
                <LoginButton provider={provider} />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
