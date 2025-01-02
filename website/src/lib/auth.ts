import { getServerSession } from "next-auth";
import { authOptions } from "./auth-options";

export async function getAuth() {
  return getServerSession(authOptions);
}
