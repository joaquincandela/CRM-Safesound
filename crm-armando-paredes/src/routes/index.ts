import { Router } from "express";
import auth from "./auth.routes.js";
import categorias from "./categorias.routes.js";
import productos from "./productos.routes.js";
import movimientos from "./movimientos.routes.js";
import pedidos from "./pedidos.routes.js";
import proveedores from "./proveedores.routes.js";
import ordenesCompra from "./ordenesCompra.routes.js";
import recepciones from "./recepciones.routes.js";
import costeoImportacion from "./costeoImportacion.routes.js";
import gastos from "./gastos.routes.js";
import finanzas from "./finanzas.routes.js";
import dashboard from "./dashboard.routes.js";
import influencers from "./influencers.routes.js";
import usuarios from "./usuarios.routes.js";
import calendario from "./calendario.routes.js";
import buscar from "./buscar.routes.js";

// Monta todas las rutas bajo /api.
const api = Router();

api.get("/health", (_req, res) => res.json({ status: "ok", ts: new Date().toISOString() }));
api.use("/auth", auth);
api.use("/categorias", categorias);
api.use("/productos", productos);
api.use("/movimientos", movimientos);
api.use("/pedidos", pedidos);
api.use("/proveedores", proveedores);
api.use("/ordenes-compra", ordenesCompra);
api.use("/recepciones", recepciones);
api.use("/costeo-importacion", costeoImportacion);
api.use("/gastos", gastos);
api.use("/finanzas", finanzas);
api.use("/dashboard", dashboard);
api.use("/influencers", influencers);
api.use("/usuarios", usuarios);
api.use("/calendario", calendario);
api.use("/buscar", buscar);

export { api };
