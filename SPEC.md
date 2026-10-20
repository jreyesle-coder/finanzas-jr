# App de Finanzas Personales — JR
### Spec y plan de construcción para Claude Code

> Pega este archivo en tu proyecto de Claude Code (como `SPEC.md`) y pídele que lo siga sprint por sprint. Está escrito para que el agente lo ejecute de forma autónoma.

---

## 1. Contexto y objetivo

App web privada para que una pareja (Julio y su esposa) maneje sus finanzas personales juntos, desde el móvil. El objetivo no es un simple registrador de gastos: es un **tablero de control de salida de deuda y estabilización financiera**, con flujo de caja por fecha, gestión de préstamos, atrasos, fondos de emergencia y simulación de pagos extraordinarios.

La familia salió de un déficit estructural fuerte y acaba de cruzar a superávit. El app debe ayudarles a: (1) no volver a caer por descalce de fechas, (2) liquidar atrasos acumulados, (3) construir colchón, y (4) acelerar el pago de préstamos usando ingresos extra.

---

## 2. Usuarios

- Dos cuentas: Julio y su esposa.
- **Ambos ven y editan todo** (transparencia total de pareja, sin roles restringidos).
- Uso principal desde el móvil; debe verse y funcionar bien en pantalla de teléfono.

---

## 3. Stack técnico (decidido)

- **Framework:** Next.js (App Router) + TypeScript
- **UI:** Tailwind CSS, diseño móvil-first, responsive
- **ORM / DB:** Prisma + SQLite (un archivo; respaldo = copiar el archivo). Dejar la capa de datos lista para migrar a PostgreSQL si crece.
- **Auth:** login usuario/contraseña para 2 cuentas, sesiones seguras (cookies httpOnly o JWT), contraseñas con hash (bcrypt/argon2).
- **Despliegue:** Docker + docker-compose. Incluir instrucciones para levantarlo en un VPS/NAS y como alternativa en un PaaS (Railway/Render).
- **Idioma de la interfaz:** español (República Dominicana).

---

## 4. Requisitos no funcionales

- **Seguridad:** HTTPS en producción; login obligatorio; sin datos financieros expuestos sin sesión. Variables sensibles en `.env`.
- **Multi-moneda:** soportar DOP y USD. Cada monto guarda su moneda original. Tasa USD→DOP configurable (valor inicial 62). Los reportes consolidan en DOP usando la tasa vigente.
- **Respaldo:** exportación manual a JSON y CSV; respaldo automático periódico del archivo SQLite.
- **Formato:** montos con separador de miles, formato DOP y USD; fechas en formato local (dd/mm/aaaa).
- **Móvil:** navegación cómoda con el pulgar; formularios de registro rápido (pocos toques).

---

## 5. Modelo de datos (entidades principales)

- **User**: id, nombre, email, passwordHash.
- **Cuenta** (bolsillo): nombre, banco, tipo. Marca si es **"manejable"** o **"auto-debitado"** (ver concepto de dos bolsillos abajo).
- **Ingreso**: nombre, fuente, monto, moneda, frecuencia (recurrente | puntual), díaDelMes (si recurrente), cuentaDestino, bolsillo.
- **Gasto**: categoría, descripción, monto, moneda, díaDelMes o fecha, tipo (fijo | variable), frecuencia (recurrente | puntual).
- **Deuda**: nombre, acreedor, tipo (préstamo | hipoteca | tarjeta), saldoActual, cuotaMensual, tasaAnual, tasaFijaHasta (fecha/mes de reajuste, opcional), plazoMeses, cuotasPagadas, díaPago, moneda, autoDebito (bool), cuentaOrigen, permitePrepago (bool), condicionesPrepago (texto, p. ej. "30% anual sin penalidad").
- **Pago**: deudaId, monto, fecha, tipo (regular | extraordinario), nota.
- **Atraso**: concepto, montoOriginal, montoAbonado, saldo (derivado), prioridad, nota. **Separado del flujo mensual.**
- **Fondo**: nombre (emergencia | médico | otro), meta, saldoActual, nota.
- **Movimiento**: fecha, tipo (ingreso | gasto), monto, moneda, categoría, cuenta, nota. (Registro real del día a día; alimenta los reportes.)
- **Config**: tasaUSDtoDOP, díaInicioMes, otros parámetros globales.

**Concepto de dos bolsillos (importante):** parte del ingreso (CORPHOTELS) entra por la cuenta de Banreservas y se va completo en el auto-débito del préstamo consolidado — para la vida diaria "no existe". El resto (CBS + asesorías + CODIA) es el **bolsillo manejable**. El app debe distinguir ambos y mostrar el disponible real manejable, no solo el ingreso bruto.

---

## 6. Datos iniciales (seed) — situación real a octubre 2026

> Cargar como seed. Los montos están en DOP salvo que se indique USD. Tasa USD→DOP = 62.

### Ingresos recurrentes
| Fuente | Monto | Día | Bolsillo | Nota |
|---|---|---|---|---|
| CBS (quincena 1) | 52,300 | 15 | Manejable | |
| CBS (quincena 2) | 39,644 | 30 | Manejable | |
| CORPHOTELS (neto) | 62,374 | 20–25 | Auto-debitado | Entra por Banreservas; se va en el préstamo consolidado |
| CODIA | 50,000 | (configurar) | Manejable | Verificar recurrencia |
| Asesoría A | 12,000 | (mensual) | Manejable | Recurrente |
| Asesoría B | 65,000 | (mensual) | Manejable | Verificar recurrencia |
| Ingreso extra (chofer) | 25,000 | 30 | Manejable | Se netea con el gasto del chofer |

### Gastos
| Categoría | Monto | Día | Tipo |
|---|---|---|---|
| Comida | 55,000 | semanal (~13,750) | Variable |
| Alquiler | 35,000 | 15 | Fijo |
| Colegio niña | 9,500 | 30 | Fijo |
| Colegio niños | 20,000 | 30 | Fijo |
| Servicio doméstico | 22,000 | 11,000 el 15 + 11,000 el 30 | Fijo |
| Chofer | 25,000 | 30 | Fijo (neteado con ingreso extra) |
| Servicios: luz | 5,407 | 15 | Fijo |
| Servicios: teléfonos (3 líneas) | 3,949 | 15 | Fijo |
| Servicios: internet | 4,731 | 15 | Fijo |
| Digital: Claude | ~1,240 | — | Fijo |
| Digital: Google One | ~620 | — | Fijo |
| Digital: YouTube Premium | ~990 | — | Fijo |
| Digital: Disney+ | ~990 | — | Fijo |
| Digital: Netflix | ~930 | — | Fijo |

### Deudas / préstamos (todos al día)
| Deuda | Saldo | Cuota | Tasa | Plazo | Día pago | Notas |
|---|---|---|---|---|---|---|
| Préstamo consolidado Banreservas | 1,646,884 | 46,875 | 21.95% (fija 12 meses) | 60 meses | 26 | Auto-débito de CORPHOTELS. **Prepago hasta 30% anual sin penalidad.** Revisar reajuste de tasa al mes 12. |
| Préstamo Santa Cruz #348518 | 507,052 | 15,508.67 | 20.00% | 48 meses | 23 | Activo desde jul 2026; vence jun 2030. Verificar condiciones de prepago. |
| Hipoteca apartamento (Hato Nuevo) | ~1,300,000 | 13,500 | — | — | 20 | Propiedad separada; no vendible hasta 2028 por normativa. |
| TC esposa → préstamo | ~75,000 | ~3,000 (est.) | — | — | — | En proceso de conversión a préstamo. Actualizar al cerrar. |

### Atrasos acumulados (separados del flujo)
| Concepto | Saldo |
|---|---|
| Alquiler (casa) | 55,000 |
| Colegio | 60,000 |

### Fondos / metas
| Fondo | Meta | Saldo |
|---|---|---|
| Emergencia | ~160,000 (1 mes de gastos) | (configurar) |
| Procedimiento quirúrgico | (por confirmar) | (configurar) |

### Activo
- **Apartamento Hato Nuevo:** no vendible hasta 2028 (normativa). Potencial de renta ~13,500–18,000/mes. Requiere ~70,000 de reparación para rentarse. Hoy genera 0 y cuesta 13,500/mes de hipoteca.

### Estado financiero de referencia
- Ingresos totales ≈ 281,318/mes · Egresos ≈ 239,000/mes · **Superávit ≈ +42,000/mes**
- **Fase actual: Estabilización** (recién cruzada desde Rescate). Próxima: Crecimiento.

---

## 7. Sprints

Cada sprint debe terminar funcional y probado antes de pasar al siguiente.

### Sprint 0 — Fundación
- Inicializar Next.js + TS + Tailwind + Prisma + SQLite.
- Definir el esquema de datos (sección 5) en Prisma y correr migraciones.
- Auth de 2 usuarios (login, logout, sesión, hash de contraseña).
- Layout base móvil-first con navegación inferior.
- Config global (tasa USD→DOP, etc.).
- Dockerfile + docker-compose. App corriendo localmente tras login.

### Sprint 1 — Deudas y préstamos
- CRUD de deudas con todos los campos (saldo, cuota, tasa, tasa fija hasta, plazo, cuotas pagadas, día de pago, moneda, auto-débito, condiciones de prepago).
- Vista de cada deuda con barra de progreso (cuotas pagadas / plazo) y saldo.
- Vista de **deuda total consolidada** (suma en DOP).
- Registro de pagos (regular/extraordinario) que reduce el saldo.
- Cargar seed de préstamos reales.

### Sprint 2 — Ingresos y egresos
- CRUD de ingresos (recurrente/puntual, fuente, día, moneda, bolsillo manejable vs auto-debitado).
- CRUD de gastos (categoría, fijo/variable, día, moneda).
- Registro rápido de movimientos del día a día (pocos toques, pensado para móvil).
- Multi-moneda con conversión por tasa configurable.
- Vista del **disponible manejable real** (excluye lo auto-debitado).
- Cargar seed de ingresos y gastos.

### Sprint 3 — Flujo de caja y calendario
- Calendario mensual que cruza ingresos vs egresos **por fecha**.
- Cálculo de **saldo acumulado día a día** y detección de **días de iliquidez** (descalce de fechas) con alerta visual.
- Alertas de fechas de pago próximas (cuotas, servicios).
- Vista que responda: "¿en qué días del mes me quedo corto y por cuánto?".

### Sprint 4 — Atrasos y fondos
- Módulo de **atrasos** separado del flujo corriente: concepto, saldo, prioridad, abonos.
- Proyección: "a este ritmo de abono, quedas limpio en el mes X".
- Módulo de **fondos/metas** (emergencia, médico): meta, saldo, progreso, aportes.
- Cargar seed de atrasos (casa 55k, colegio 60k) y fondos.

### Sprint 5 — Tablero y simuladores
- **Dashboard principal:** superávit/déficit del mes, fase actual (semáforo rescate/estabilización/crecimiento), deuda total, próximos pagos, disponible manejable, estado de atrasos y fondos.
- **Simulador de pago extraordinario** (cláusula 30% Banreservas): "si abono X a este préstamo, ahorras Y en intereses y terminas en el mes Z". Aplicar a capital reduciendo plazo.
- **Proyección de salida de deuda:** línea de tiempo de cuándo se liquida cada préstamo con y sin pagos extra.

### Sprint 6 — Importación, respaldo y pulido
- **Importador de CSV** de banco (Banreservas/Santa Cruz): subir archivo, mapear columnas, previsualizar y registrar movimientos.
- **Exportación/respaldo:** JSON y CSV; respaldo automático periódico del SQLite.
- **Recordatorios/notificaciones:** pagos próximos, descalce de flujo, cuando un atraso llega a cero.
- Pulido de UX móvil, hardening de seguridad, HTTPS, revisión final.

---

## 8. Criterios de aceptación

- Ambos usuarios entran desde el móvil y ven la misma información sincronizada.
- El dashboard muestra de un vistazo: superávit del mes, deuda total, atrasos pendientes y próximos pagos.
- El calendario avisa de días de iliquidez antes de que ocurran.
- El simulador calcula correctamente el ahorro de un pago extraordinario.
- Los atrasos nunca se mezclan con el flujo corriente del mes.
- Respaldo y exportación funcionan; ningún dato se pierde.
- Todo en español, con DOP y USD bien manejados.
