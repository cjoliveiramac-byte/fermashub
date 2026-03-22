import { EventEmitter } from "events";

const globalForRealtime = globalThis;

export const realtime =
  globalForRealtime.realtime || new EventEmitter();

if (process.env.NODE_ENV !== "production") {
  globalForRealtime.realtime = realtime;
}
