import * as Sentry from "@sentry/nextjs";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { authorizeRole } from "@/lib/authorizeRole";
import { checkRateLimit } from "@/lib/rateLimit";
import { createRequestId } from "@/lib/requestId";
import {
  deleteUserFieldFavoriteParamsSchema,
  patchUserFieldFavoriteValueSchema,
  upsertUserFieldFavoriteSchema,
} from "@/lib/validations";

function valueKey(reportType: string, fieldName: string) {
  return `${reportType}:${fieldName}`;
}

export async function GET() {
  const requestId = createRequestId();
  try {
    const auth = await authorizeRole();
    if (auth.error) return auth.error;

    const userId = auth.session.user.id;
    const rows = await prisma.userFieldFavorite.findMany({
      where: { userId },
      orderBy: [{ createdAt: "asc" }],
    });

    const favourites = rows.map((r) => ({
      reportType: r.reportType,
      reportName: r.reportName ?? undefined,
      fieldName: r.fieldName,
      fieldLabel: r.fieldLabel,
      sectionTitle: r.sectionTitle ?? undefined,
      createdAt: r.createdAt.toISOString(),
    }));

    const values: Record<string, string> = {};
    for (const r of rows) {
      const k = valueKey(r.reportType, r.fieldName);
      if (r.defaultValue) values[k] = r.defaultValue;
    }

    return NextResponse.json(
      { favourites, values },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error: unknown) {
    Sentry.captureException(error, {
      tags: { requestId, route: "GET /api/user-favourites" },
    });
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to load favourites",
        requestId,
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const requestId = createRequestId();
  try {
    const auth = await authorizeRole();
    if (auth.error) return auth.error;

    const user = auth.session.user;
    const rateLimited = await checkRateLimit(user.id);
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const parsed = upsertUserFieldFavoriteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
          requestId,
        },
        { status: 400 },
      );
    }

    const { reportType, reportName, fieldName, fieldLabel, sectionTitle } =
      parsed.data;

    const whereUnique = {
      userId_reportType_fieldName: {
        userId: user.id,
        reportType,
        fieldName,
      },
    };

    const delegate = prisma.userFieldFavorite;
    if (!delegate?.create || !delegate?.update || !delegate?.findUnique) {
      return NextResponse.json(
        {
          message:
            "Database client is out of date. Run: npx prisma migrate deploy && npx prisma generate, then restart the dev server.",
          requestId,
        },
        { status: 503 },
      );
    }

    const existing = await delegate.findUnique({ where: whereUnique });
    if (existing) {
      await delegate.update({
        where: whereUnique,
        data: {
          fieldLabel,
          reportName: reportName ?? null,
          sectionTitle: sectionTitle ?? null,
        },
      });
    } else {
      try {
        await delegate.create({
          data: {
            userId: user.id,
            reportType,
            fieldName,
            fieldLabel,
            reportName: reportName ?? null,
            sectionTitle: sectionTitle ?? null,
          },
        });
      } catch (e: unknown) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === "P2002"
        ) {
          await delegate.update({
            where: whereUnique,
            data: {
              fieldLabel,
              reportName: reportName ?? null,
              sectionTitle: sectionTitle ?? null,
            },
          });
        } else {
          throw e;
        }
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: unknown) {
    Sentry.captureException(error, {
      tags: { requestId, route: "POST /api/user-favourites" },
    });
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to save favourite",
        requestId,
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const requestId = createRequestId();
  try {
    const auth = await authorizeRole();
    if (auth.error) return auth.error;

    const user = auth.session.user;
    const rateLimited = await checkRateLimit(user.id);
    if (rateLimited) return rateLimited;

    const { searchParams } = new URL(request.url);
    const parsed = deleteUserFieldFavoriteParamsSchema.safeParse({
      reportType: searchParams.get("reportType") ?? "",
      fieldName: searchParams.get("fieldName") ?? "",
    });
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid query parameters", requestId },
        { status: 400 },
      );
    }

    const { reportType, fieldName } = parsed.data;

    await prisma.userFieldFavorite.deleteMany({
      where: {
        userId: user.id,
        reportType,
        fieldName,
      },
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: unknown) {
    Sentry.captureException(error, {
      tags: { requestId, route: "DELETE /api/user-favourites" },
    });
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to remove favourite",
        requestId,
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const requestId = createRequestId();
  try {
    const auth = await authorizeRole();
    if (auth.error) return auth.error;

    const user = auth.session.user;
    const rateLimited = await checkRateLimit(user.id);
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const parsed = patchUserFieldFavoriteValueSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
          requestId,
        },
        { status: 400 },
      );
    }

    const { reportType, fieldName, value } = parsed.data;

    const result = await prisma.userFieldFavorite.updateMany({
      where: {
        userId: user.id,
        reportType,
        fieldName,
      },
      data: { defaultValue: value },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { message: "Favourite field not found", requestId },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: unknown) {
    Sentry.captureException(error, {
      tags: { requestId, route: "PATCH /api/user-favourites" },
    });
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to update value",
        requestId,
      },
      { status: 500 },
    );
  }
}
