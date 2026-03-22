import { prisma } from "@/lib/prisma";
import {
  getSystemStatus,
  listLogs,
  listCollections,
  queryCollection,
  listApiKeys,
  createApiKey,
  revokeApiKey,
  listFeatureFlags,
  upsertFeatureFlag,
  updateFeatureFlag,
  getSafeEnv,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
} from "@/services/devService";

export const fetchSystemStatus = async () => getSystemStatus();

export const fetchLogs = async (filters) => listLogs(filters || {});

export const fetchCollections = async () => listCollections();

export const fetchCollectionData = async (params) =>
  queryCollection(params || {});

export const fetchApiKeys = async () => listApiKeys();

export const createApiKeyForUser = async ({ name, userId }) => {
  const result = await createApiKey({ name, createdBy: userId });
  await prisma.log.create({
    data: {
      userId,
      action: "DEV_CREATE_API_KEY",
      metadata: JSON.stringify({ name, keyId: result.record.id }),
    },
  });
  return result;
};

export const revokeApiKeyById = async ({ id, userId }) => {
  const record = await revokeApiKey(id);
  await prisma.log.create({
    data: {
      userId,
      action: "DEV_REVOKE_API_KEY",
      metadata: JSON.stringify({ keyId: id }),
    },
  });
  return record;
};

export const fetchFeatureFlags = async () => listFeatureFlags();

export const upsertFeatureFlagByName = async ({ name, enabled, userId }) => {
  const record = await upsertFeatureFlag({ name, enabled });
  await prisma.log.create({
    data: {
      userId,
      action: "DEV_UPSERT_FLAG",
      metadata: JSON.stringify({ name, enabled }),
    },
  });
  return record;
};

export const updateFeatureFlagById = async ({ id, enabled, userId }) => {
  const record = await updateFeatureFlag(id, enabled);
  await prisma.log.create({
    data: {
      userId,
      action: "DEV_UPDATE_FLAG",
      metadata: JSON.stringify({ id, enabled }),
    },
  });
  return record;
};

export const fetchSafeEnv = async () => getSafeEnv();

export const fetchUsers = async (params) => listUsers(params || {});

export const createUserAccount = async ({ payload, userId }) => {
  const user = await createUser(payload);
  await prisma.log.create({
    data: {
      userId,
      action: "DEV_CREATE_USER",
      metadata: JSON.stringify({ targetId: user.id, role: user.role }),
    },
  });
  return user;
};

export const updateUserAccount = async ({ userId: targetId, data, actorId }) => {
  const user = await updateUser({ userId: targetId, data });
  await prisma.log.create({
    data: {
      userId: actorId,
      action: "DEV_UPDATE_USER",
      metadata: JSON.stringify({ targetId, changes: data }),
    },
  });
  return user;
};

export const deleteUserAccount = async ({ userId: targetId, actorId }) => {
  const user = await deleteUser(targetId);
  await prisma.log.create({
    data: {
      userId: actorId,
      action: "DEV_DELETE_USER",
      metadata: JSON.stringify({ targetId }),
    },
  });
  return user;
};
