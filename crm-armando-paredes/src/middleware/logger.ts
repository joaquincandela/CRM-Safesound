import morgan from "morgan";
import { env } from "../config/env.js";

// Logger de requests. Formato compacto en prod, detallado en dev.
export const requestLogger = morgan(env.NODE_ENV === "production" ? "combined" : "dev");
