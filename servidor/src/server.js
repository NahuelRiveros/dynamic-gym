import { createApp } from "./app.js";
import { sequelize } from "./database/sequelize.js";
import "./models/index.js";
import { env } from "./configuracion_servidor/env.js";
console.log("JWT_SECRET:", env.JWT_SECRET);

async function main() {
  await sequelize.authenticate();
  console.log("✅ DB conectada");

  const app = createApp();
  app.listen(env.PORT, () => console.log(`✅ API http://localhost:${env.PORT}`));
}

main().catch((e) => {
  console.error("❌ Error al iniciar:", e);
  process.exit(1);
});
