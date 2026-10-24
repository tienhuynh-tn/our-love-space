import type { NextConfig } from "next";

// configure-pages supplies the correct path for project sites and custom domains.
const basePath = process.env.PAGES_BASE_PATH ?? "/our-love-space";
if (!/^(\/[a-zA-Z0-9._-]+)*$/.test(basePath)) throw new Error("Invalid Pages base path.");

const config: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
};
export default config;
