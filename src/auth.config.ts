import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdmin = !!auth?.user?.isAdmin;
      const isOnRecruits = nextUrl.pathname.startsWith('/recruits');
      const isOnAdmin = nextUrl.pathname.startsWith('/admin');

      if (isOnAdmin) {
        if (!isLoggedIn) return false;
        if (!isAdmin) return false;
        return true;
      }

      if (isLoggedIn) return true;

      if (isOnRecruits) return false;

      return true;
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
