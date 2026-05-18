/**
 * localAuthRoutes.ts
 * Rotas Express para autenticação local (registro, login, logout).
 */
import type { Express, Request, Response } from "express";
import { getSessionCookieOptions } from "./cookies";
import { hashPassword, verifyPassword, createSessionToken } from "./localAuth";
import * as db from "../db";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export function registerLocalAuthRoutes(app: Express) {
  /**
   * POST /api/auth/register
   * Cria um novo usuário com e-mail e senha.
   */
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { name, email, password } = req.body as {
        name?: string;
        email?: string;
        password?: string;
      };

      if (!name || !email || !password) {
        res.status(400).json({ error: "Nome, e-mail e senha são obrigatórios." });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({ error: "A senha deve ter ao menos 6 caracteres." });
        return;
      }

      // Verificar se e-mail já existe
      const existing = await db.getUserByOpenId(email.toLowerCase());
      if (existing) {
        res.status(409).json({ error: "Este e-mail já está cadastrado." });
        return;
      }

      const passwordHash = await hashPassword(password);

      await db.upsertUser({
        openId: email.toLowerCase(),
        name,
        email: email.toLowerCase(),
        passwordHash,
        loginMethod: "local",
        lastSignedIn: new Date(),
      });

      const sessionToken = await createSessionToken(email.toLowerCase(), name);
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({ success: true, name });
    } catch (error) {
      console.error("[Auth] Register failed:", error);
      res.status(500).json({ error: "Erro interno ao registrar usuário." });
    }
  });

  /**
   * POST /api/auth/login
   * Autentica um usuário com e-mail e senha.
   */
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body as {
        email?: string;
        password?: string;
      };

      if (!email || !password) {
        res.status(400).json({ error: "E-mail e senha são obrigatórios." });
        return;
      }

      const user = await db.getUserByOpenId(email.toLowerCase());

      if (!user || !user.passwordHash) {
        res.status(401).json({ error: "E-mail ou senha incorretos." });
        return;
      }

      const passwordValid = await verifyPassword(password, user.passwordHash);
      if (!passwordValid) {
        res.status(401).json({ error: "E-mail ou senha incorretos." });
        return;
      }

      // Atualizar lastSignedIn
      await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });

      const sessionToken = await createSessionToken(user.openId, user.name || "");
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({ success: true, name: user.name, role: user.role });
    } catch (error) {
      console.error("[Auth] Login failed:", error);
      res.status(500).json({ error: "Erro interno ao realizar login." });
    }
  });
}
