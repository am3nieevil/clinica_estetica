export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Para autenticação local, redireciona para a tela de login interna.
export const getLoginUrl = (returnPath?: string) => {
  const path = returnPath ? `/login?returnTo=${encodeURIComponent(returnPath)}` : "/login";
  return path;
};
