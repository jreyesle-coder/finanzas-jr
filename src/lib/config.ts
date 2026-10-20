import { prisma } from "./db";

export async function obtenerConfig() {
  return prisma.config.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
}
