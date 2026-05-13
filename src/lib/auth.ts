import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";
import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * Custom adapter that maps NextAuth's flat { name, image } shape to our
 * User model which uses { firstName, lastName, avatar }.
 * Without this, Google OAuth createUser calls fail because firstName/lastName
 * are required non-nullable columns, causing a redirect loop back to /auth/login.
 */
function buildAdapter(): Adapter {
  const base = PrismaAdapter(prisma) as Adapter;
  return {
    ...base,
    async createUser(user) {
      const parts = (user.name ?? "").trim().split(/\s+/);
      const firstName = parts[0] || "Member";
      const lastName = parts.slice(1).join(" ") || "User";
      return prisma.user.create({
        data: {
          email: user.email,
          emailVerified: user.emailVerified ?? null,
          firstName,
          lastName,
          avatar: user.image ?? null,
        },
      });
    },
    async updateUser({ id, name, image, email, emailVerified }) {
      const data: Record<string, unknown> = {};
      if (email !== undefined) data.email = email;
      if (emailVerified !== undefined) data.emailVerified = emailVerified;
      if (image !== undefined) data.avatar = image;
      if (name) {
        const parts = (name as string).trim().split(/\s+/);
        data.firstName = parts[0];
        if (parts.length > 1) data.lastName = parts.slice(1).join(" ");
      }
      return prisma.user.update({ where: { id }, data });
    },
    async getUser(id) {
      const u = await prisma.user.findUnique({ where: { id } });
      if (!u) return null;
      return { ...u, name: `${u.firstName} ${u.lastName}`.trim(), image: u.avatar };
    },
    async getUserByEmail(email) {
      const u = await prisma.user.findUnique({ where: { email } });
      if (!u) return null;
      return { ...u, name: `${u.firstName} ${u.lastName}`.trim(), image: u.avatar };
    },
  };
}

// Only register Google provider when both credentials are present.
// Empty values cause NextAuth to throw "Missing required parameter: client_id".
const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
const googleEnabled = Boolean(googleClientId && googleClientSecret);

if (!googleEnabled && process.env.NODE_ENV !== "production") {
  console.warn(
    "[auth] Google OAuth disabled: GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not set."
  );
}

const providers: NextAuthConfig["providers"] = [];

if (googleEnabled) {
  providers.push(
    Google({
      clientId: googleClientId!,
      clientSecret: googleClientSecret!,
    })
  );
}

providers.push(
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        throw new Error("Email and password are required");
      }

      const user = await prisma.user.findUnique({
        where: { email: credentials.email as string },
      });

      if (!user || !user.password) {
        throw new Error("Invalid credentials");
      }

      const isPasswordValid = await bcrypt.compare(
        credentials.password as string,
        user.password
      );

      if (!isPasswordValid) {
        throw new Error("Invalid credentials");
      }

      return {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        image: user.avatar,
      };
    },
  })
);

export const authConfig: NextAuthConfig = {
  adapter: buildAdapter(),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
    newUser: "/join",
    error: "/auth/login",
  },
  providers,
  callbacks: {
    async signIn({ user, account }) {
      // For OAuth providers, ensure the user record exists and is active
      if (account?.provider === "google") {
        if (!user.email) return false;
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { isActive: true },
        });
        // If user exists but is deactivated, block sign-in
        if (dbUser && !dbUser.isActive) return false;
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        // user.id is the DB id provided by the adapter — use it directly
        // rather than doing a secondary email lookup which can fail for new users
        token.id = user.id;

        // Fetch role (and names for token) from DB
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { id: true, role: true, firstName: true, lastName: true, avatar: true },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.firstName = dbUser.firstName;
          token.lastName = dbUser.lastName;
          token.picture = dbUser.avatar ?? token.picture;
        } else {
          token.role = "MEMBER";
        }
      }

      // Allow session updates
      if (trigger === "update" && session) {
        token.name = session.name;
        token.picture = session.image;
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      console.log(`New user created: ${user.email}`);
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
