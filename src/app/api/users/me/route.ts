import { NextResponse } from "next/server";
import { AppwriteException } from "node-appwrite";
import { Account, Client } from "node-appwrite";

import env from "@/app/env";
import { users } from "@/models/server/config";
import { getAuthenticatedUser } from "@/models/server/auth";

function getJwt(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice(7);
}

export async function PATCH(request: Request) {
  try {
    const jwt = getJwt(request);

    if (!jwt) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const authenticatedUser = await getAuthenticatedUser(jwt);

    const body: unknown = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      !("name" in body) ||
      !("about" in body)
    ) {
      return NextResponse.json(
        { error: "Name and about are required" },
        { status: 400 }
      );
    }

    const { name, about } = body as {
      name: unknown;
      about: unknown;
    };

    if (
      typeof name !== "string" ||
      typeof about !== "string" ||
      name.trim().length < 2 ||
      name.trim().length > 50 ||
      about.length > 500
    ) {
      return NextResponse.json(
        { error: "Name must be 2–50 characters and About up to 500 characters" },
        { status: 400 }
      );
    }

    const client = new Client()
      .setEndpoint(env.appwrite.endpoint)
      .setProject(env.appwrite.projectId)
      .setJWT(jwt);

    const account = new Account(client);

    await users.updateName({
      userId: authenticatedUser.$id,
      name: name.trim(),
    });

    await account.updatePrefs({
      prefs: {
        ...authenticatedUser.prefs,
        about: about.trim(),
      },
    });

    return NextResponse.json({
      success: true,
      name: name.trim(),
      about: about.trim(),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Your session is invalid. Please sign in again." },
        { status: 401 }
      );
    }

    if (error instanceof AppwriteException) {
      console.error("Profile update failed:", error.code, error.type);

      return NextResponse.json(
        { error: "Unable to update profile" },
        { status: 400 }
      );
    }

    console.error("Profile update failed:", error);

    return NextResponse.json(
      { error: "Unable to update profile" },
      { status: 500 }
    );
  }
}