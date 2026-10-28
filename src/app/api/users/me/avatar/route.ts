import { NextResponse } from "next/server";
import {
  Account,
  AppwriteException,
  Client,
  ID,
  Permission,
  Role,
} from "node-appwrite";
import { InputFile } from "node-appwrite/file";

import env from "@/app/env";
import { profileAvatarBucket } from "@/models/name";
import { storage } from "@/models/server/config";
import { getAuthenticatedUser } from "@/models/server/auth";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const ALLOWED_TYPES = {
  "image/jpeg": {
    extension: "jpg",
    signature: (b: Buffer) =>
      b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  "image/png": {
    extension: "png",
    signature: (b: Buffer) =>
      b.length >= 8 &&
      b.subarray(0, 8).equals(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      ),
  },
  "image/webp": {
    extension: "webp",
    signature: (b: Buffer) =>
      b.length >= 12 &&
      b.toString("ascii", 0, 4) === "RIFF" &&
      b.toString("ascii", 8, 12) === "WEBP",
  },
} as const;

function getJwt(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) return null;

  const jwt = authorization.slice(7).trim();

  return jwt && jwt.length <= 4096 ? jwt : null;
}

export async function POST(request: Request) {
  let uploadedFileId: string | null = null;

  try {
    const jwt = getJwt(request);

    if (!jwt) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in again." },
        { status: 401 }
      );
    }

    const user = await getAuthenticatedUser(jwt);

    const contentLength = Number(request.headers.get("content-length") || 0);

    if (contentLength > MAX_FILE_SIZE + 64 * 1024) {
      return NextResponse.json(
        { error: "Image must be no larger than 2 MB." },
        { status: 413 }
      );
    }

    const formData = await request.formData();
    const value = formData.get("avatar");

    if (!(value instanceof File)) {
      return NextResponse.json(
        { error: "Please select an image to upload." },
        { status: 400 }
      );
    }

    if (value.size === 0 || value.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Image must be between 1 byte and 2 MB." },
        { status: 400 }
      );
    }

    const imageType =
      ALLOWED_TYPES[value.type as keyof typeof ALLOWED_TYPES];

    if (!imageType) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, and WebP images are allowed." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await value.arrayBuffer());

    if (!imageType.signature(buffer)) {
      return NextResponse.json(
        { error: "The file contents do not match a supported image type." },
        { status: 400 }
      );
    }

    const client = new Client()
      .setEndpoint(env.appwrite.endpoint)
      .setProject(env.appwrite.projectId)
      .setJWT(jwt);

    const account = new Account(client);

    const previousAvatarId =
      typeof user.prefs?.avatarFileId === "string"
        ? user.prefs.avatarFileId
        : null;

    const uploaded = await storage.createFile({
      bucketId: profileAvatarBucket,
      fileId: ID.unique(),
      file: InputFile.fromBuffer(
        buffer,
        `avatar.${imageType.extension}`
      ),
      permissions: [Permission.read(Role.any())],
    });

    uploadedFileId = uploaded.$id;

    try {
      await account.updatePrefs({
        prefs: {
          ...user.prefs,
          avatarFileId: uploaded.$id,
        },
      });
    } catch (error) {
      await storage
        .deleteFile({
          bucketId: profileAvatarBucket,
          fileId: uploaded.$id,
        })
        .catch(() => undefined);

      uploadedFileId = null;
      throw error;
    }

    // Remove the previous avatar only after the new reference is saved.
    if (previousAvatarId && previousAvatarId !== uploaded.$id) {
      await storage
        .deleteFile({
          bucketId: profileAvatarBucket,
          fileId: previousAvatarId,
        })
        .catch((error) => {
          console.error("Could not delete previous avatar:", error);
        });
    }

    const avatarUrl = new URL(
      `${env.appwrite.endpoint.replace(/\/+$/, "")}/storage/buckets/${profileAvatarBucket}/files/${uploaded.$id}/view`
    );

    avatarUrl.searchParams.set("project", env.appwrite.projectId);

    return NextResponse.json({
      success: true,
      avatarFileId: uploaded.$id,
      avatarUrl: avatarUrl.toString(),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Your session is invalid. Please sign in again." },
        { status: 401 }
      );
    }

    if (error instanceof AppwriteException) {
      console.error("Avatar upload failed:", error.code, error.type);

      return NextResponse.json(
        { error: "Appwrite could not upload your avatar. Check bucket configuration." },
        { status: 400 }
      );
    }

    console.error("Avatar upload failed:", error);

    return NextResponse.json(
      { error: "Unable to upload avatar." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const jwt = authorization.slice(7).trim();

    if (!jwt || jwt.length > 4096) {
      return NextResponse.json(
        { error: "Invalid authentication token." },
        { status: 401 }
      );
    }

    const user = await getAuthenticatedUser(jwt);

    const client = new Client()
      .setEndpoint(env.appwrite.endpoint)
      .setProject(env.appwrite.projectId)
      .setJWT(jwt);

    const account = new Account(client);

    const avatarFileId =
      typeof user.prefs?.avatarFileId === "string"
        ? user.prefs.avatarFileId
        : null;

    // Remove the avatar reference first, so the profile falls back
    // to the generated initials avatar.
    await account.updatePrefs({
      prefs: {
        ...user.prefs,
        avatarFileId: null,
      },
    });

    if (avatarFileId) {
      try {
        await storage.deleteFile({
          bucketId: profileAvatarBucket,
          fileId: avatarFileId,
        });
      } catch (error) {
        // The profile has already been updated. Log cleanup failures.
        console.error("Could not delete avatar file:", error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Your session is invalid. Please sign in again." },
        { status: 401 }
      );
    }

    console.error("Avatar removal failed:", error);

    return NextResponse.json(
      { error: "Unable to remove avatar." },
      { status: 500 }
    );
  }
}