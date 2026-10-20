// Respaldo automático diario del SQLite (solo en el servidor Node, no en build).
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.BACKUP_AUTO === "off") return;
  const { respaldoSiToca } = await import("./lib/respaldo");
  const correr = () =>
    respaldoSiToca()
      .then((n) => n && console.log(`[respaldo] creado ${n}`))
      .catch((e) => console.error("[respaldo] falló:", e));
  setTimeout(correr, 30_000); // tras arrancar
  setInterval(correr, 3_600_000); // revisa cada hora; crea uno si el último tiene >24 h
}
