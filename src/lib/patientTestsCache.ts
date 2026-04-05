import { getRedis } from "@/lib/redis";

const P = "d4r:pt";
const VER_TTL_SEC = 604800;
const DATA_TTL_SEC = 45;

function verKey(userId: string, scope: string) {
  return `${P}:ver:${userId}:${scope}`;
}

function dataKey(userId: string, scope: string, page: number, limit: number, ver: number) {
  return `${P}:data:${userId}:${scope}:${page}:${limit}:v${ver}`;
}

export async function getPatientTestsListVersion(
  userId: string,
  scope: string,
): Promise<number> {
  const r = getRedis();
  if (!r) return 0;
  try {
    const v = await r.get(verKey(userId, scope));
    return v ? parseInt(v, 10) : 0;
  } catch {
    return 0;
  }
}

export async function getCachedPatientTestsJson(
  userId: string,
  scope: string,
  page: number,
  limit: number,
  version: number,
): Promise<string | null> {
  const r = getRedis();
  if (!r) return null;
  try {
    return await r.get(dataKey(userId, scope, page, limit, version));
  } catch {
    return null;
  }
}

export async function setCachedPatientTestsJson(
  userId: string,
  scope: string,
  page: number,
  limit: number,
  version: number,
  json: string,
): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.setex(dataKey(userId, scope, page, limit, version), DATA_TTL_SEC, json);
  } catch {
    /* ignore */
  }
}

/** After any patient test write, bump versions so cached payloads miss. */
export async function bumpPatientTestsCacheVersions(
  userId: string,
  patientInternalId: string | null,
): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    const pipe = r.pipeline();
    pipe.incr(verKey(userId, "all"));
    pipe.expire(verKey(userId, "all"), VER_TTL_SEC);
    if (patientInternalId) {
      pipe.incr(verKey(userId, patientInternalId));
      pipe.expire(verKey(userId, patientInternalId), VER_TTL_SEC);
    }
    await pipe.exec();
  } catch {
    /* ignore */
  }
}
