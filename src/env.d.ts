/// <reference types="astro/client" />

// Astro's documented way to type locals; a top-level import would turn this file into a module.
/* eslint-disable @typescript-eslint/consistent-type-imports */
declare namespace App {
  interface Locals {
    /** Signed-in back-office user (set by the middleware on /admin routes). */
    user?: import('./lib/auth').SessionUser
  }
}
