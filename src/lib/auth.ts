import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { queryOne } from "./db";

const SESSION_COOKIE = "leapify_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  role: "admin" | "connector" | "reviewer";
}

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}

export async function createSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      id: payload.id as number,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as SessionUser["role"],
    };
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: "admin" | "connector" | "reviewer";
}

export async function authenticate(
  email: string,
  password: string
): Promise<SessionUser | null> {
  const user = await queryOne<UserRow>(
    "SELECT id, email, password_hash, name, role FROM users WHERE lower(email) = lower($1)",
    [email]
  );
  if (!user) return null;
  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export async function createUser(
  email: string,
  password: string,
  name: string,
  role: "admin" | "connector" | "reviewer" = "connector"
): Promise<SessionUser> {
  const hash = await hashPassword(password);
  const user = await queryOne<UserRow>(
    "INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, password_hash, name, role",
    [email.toLowerCase(), hash, name, role]
  );
  if (!user) throw new Error("Failed to create user");
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}
