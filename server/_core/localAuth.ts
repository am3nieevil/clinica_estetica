/**
 * localAuth.ts
 * Sistema de autenticação local com e-mail e senha.
 * Substitui o Manus OAuth para uso fora da plataforma Manus.
 */
import bcrypt from "bcryptjs";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";

const SALT_ROUNDS = 10;

function getSessionSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || "local-dev-secret-change-in-production";
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(
  openId: string,
  name: string,
  expiresInMs: number = ONE_YEAR_MS
): Promise<string> {
  const secretKey = getSessionSecret();
  const expirationSeconds = Math.floor((Date.now() + expiresInMs) / 1000);

  return new SignJWT({ openId, name, appId: "local" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .sign(secretKey);
}

export async function verifySessionToken(
  token: string | undefined | null
): Promise<{ openId: string; name: string } | null> {
  if (!token) return null;

  try {
    const secretKey = getSessionSecret();
    const { payload } = await jwtVerify(token, secretKey, { algorithms: ["HS256"] });
    const { openId, name } = payload as Record<string, unknown>;

    if (typeof openId !== "string" || typeof name !== "string") return null;
    return { openId, name };
  } catch {
    return null;
  }
}

export async function authenticateRequest(req: Request): Promise<User> {
  const cookies = parseCookieHeader(req.headers.cookie || "");
  const sessionCookie = cookies[COOKIE_NAME];
  const session = await verifySessionToken(sessionCookie);

  if (!session) {
    throw ForbiddenError("Sessão inválida ou expirada.");
  }

  const user = await db.getUserByOpenId(session.openId);

  if (!user) {
    throw ForbiddenError("Usuário não encontrado.");
  }

  return user;
}
