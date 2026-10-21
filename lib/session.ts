// Sesión de demo: una cookie con el id del perfil elegido en /entrar.
// No hay contraseñas; en producción esto lo sustituye Supabase Auth.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getProfile, type Profile } from "./db/repo";
import type { Role } from "./domain";

export const SESSION_COOKIE = "baco_profile";

export async function currentProfile(): Promise<Profile | null> {
  const id = (await cookies()).get(SESSION_COOKIE)?.value;
  return (id && getProfile(id)) || null;
}

export async function requireProfile(role?: Role): Promise<Profile> {
  const profile = await currentProfile();
  if (!profile) redirect("/entrar");
  if (role && profile.role !== role) redirect("/panel");
  return profile;
}
