import { sequelize } from "../src/database/sequelize.js";
import { verificarBaseDeTest } from "./base_test.js";

// Antes de cada archivo de test: la conexión REAL del servidor (la que arma sequelize.js con
// las variables ya cargadas) tiene que ser la base local de test. Si no, no corre ningún test.
const { host, database } = sequelize.config;
verificarBaseDeTest({ host, nombre: database });
