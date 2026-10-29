"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import {
  AppwriteException,
  ID,
  Models,
  OAuthProvider as AppwriteOAuthProvider,
} from "appwrite";

import { account } from "../models/client/config";

export type OAuthProvider = AppwriteOAuthProvider;

export interface UserPrefs {
  reputation: number;
}

interface IAuthStore {
  session: Models.Session | null;
  jwt: string | null;
  user: Models.User<UserPrefs> | null;
  hydrated: boolean;

  loginWithOAuth(provider: OAuthProvider): void;
  setHydrated(): void;
  verifySession(): Promise<void>;

  login(
    email: string,
    password: string
  ): Promise<{
    success: boolean;
    error?: AppwriteException | null;
  }>;

  createAccount(
    name: string,
    email: string,
    password: string
  ): Promise<{
    success: boolean;
    error?: AppwriteException | null;
  }>;

  logout(): Promise<void>;
}

export const useAuthStore = create<IAuthStore>()(
  persist(
    immer((set) => ({
      session: null,
      jwt: null,
      user: null,
      hydrated: false,

      setHydrated() {
        set({ hydrated: true });
      },

      async verifySession() {
        try {
          const [session, user] = await Promise.all([
            account.getSession({ sessionId: "current" }),
            account.get<UserPrefs>(),
          ]);

          // Refresh the JWT after verifying the active session.
          const { jwt } = await account.createJWT();

          set({ session, user, jwt });
        } catch {
          set({
            session: null,
            user: null,
            jwt: null,
          });
        }
      },

      async login(email, password) {
        try {
          // Check whether a session already exists in this browser.
          let existingUser: Models.User<UserPrefs> | null = null;

          try {
            existingUser = await account.get<UserPrefs>();
          } catch {
            // No valid active session; continue with normal login.
          }

          if (existingUser) {
            // If the current session belongs to this email,
            // reuse it instead of creating a duplicate session.
            if (
              existingUser.email.toLowerCase() === email.trim().toLowerCase()
            ) {
              const [session, user] = await Promise.all([
                account.getSession({ sessionId: "current" }),
                account.get<UserPrefs>(),
              ]);

              const { jwt } = await account.createJWT();

              set({ session, user, jwt });

              return { success: true };
            }

            // A different account is signed in. Sign out before
            // attempting to switch accounts.
            await account.deleteSession({ sessionId: "current" });

            set({ session: null, user: null, jwt: null });
          }

          const session = await account.createEmailPasswordSession({
            email: email.trim(),
            password,
          });

          let user = await account.get<UserPrefs>();

          if (user.prefs?.reputation == null) {
            user = await account.updatePrefs<UserPrefs>({
              prefs: {
                ...user.prefs,
                reputation: 0,
              },
            });
          }

          const { jwt } = await account.createJWT();

          set({ session, user, jwt });

          return { success: true };
        } catch (error) {
          console.error("Login failed:", error);

          return {
            success: false,
            error: error instanceof AppwriteException ? error : null,
          };
        }
      },

      loginWithOAuth(provider) {
        const redirectUrl = `${window.location.origin}/`;

        const failureUrl = new URL("/login", window.location.origin);
        failureUrl.searchParams.set("oauth", "failed");

        void account.createOAuth2Session({
          provider,
          success: redirectUrl,
          failure: failureUrl.toString(),
        });
      },

      async createAccount(name, email, password) {
        try {
          await account.create({
            userId: ID.unique(),
            email,
            password,
            name,
          });

          return { success: true };
        } catch (error) {
          return {
            success: false,
            error:
              error instanceof AppwriteException ? error : null,
          };
        }
      },

      async logout() {
        try {
          await account.deleteSessions({});
        } catch (error) {
          console.error("Logout failed:", error);
        } finally {
          set({
            session: null,
            jwt: null,
            user: null,
          });
        }
      },
    })),
    {
      name: "auth",

      // Do not persist sessions, JWTs, or user data.
      partialize: () => ({
        session: null,
        jwt: null,
        user: null,
        hydrated: false,
      }),

      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error("Auth store hydration failed:", error);
        }

        state?.setHydrated();
      },
    }
  )
);