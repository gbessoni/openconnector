import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { SignupForm } from "./SignupForm";

export default async function SignupPage() {
  const session = await getSession();
  if (session) redirect("/app");

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="font-serif text-3xl text-gray-900">Leapify</h1>
          </Link>
          <p className="text-sm text-gray-500 mt-2">Connector Portal</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Create account</h2>
          <p className="text-sm text-gray-500 mb-6">
            Start tracking your leads and payouts.
          </p>
          <SignupForm />
          <p className="text-sm text-gray-500 mt-6 text-center">
            Already have an account?{" "}
            <Link href="/app/login" className="text-gray-900 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
