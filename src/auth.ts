import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcrypt";
import postgres from "postgres";
import { authConfig } from "./auth.config";
import type { Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

async function getBrother(email: string) {
  try {
    const brother = await sql`SELECT * FROM brothers WHERE personal_email=${email}`;
    return brother[0];
  } catch (error) {
    console.error("Failed to fetch brother:", error);
    throw new Error("Failed to fetch brother.");
  }
}

export const authOptions = {
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials): Promise<User | null> {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (!parsedCredentials.success) {
          console.log("Invalid credentials format");
          return null;
        }

        const { email, password } = parsedCredentials.data;
        const user = await getBrother(email);
        if (!user) return null;

        const passwordsMatch = await bcrypt.compare(password, user.password);
        if (!passwordsMatch) return null;
        
        return {
          id: user.id,
          email: user.personal_email,
          isAdmin: user.is_admin,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }) {
      if (user) {
        token.id = user.id as string;
        token.email = user.email as string;
        token.isAdmin = user.isAdmin as boolean;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      // Now you can safely use token.id / token.email if you added them
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.isAdmin = token.isAdmin as boolean;
      }
      return session;
    }
  }
};

export const { auth, signIn, signOut } = NextAuth(authOptions);
