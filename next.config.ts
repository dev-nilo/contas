import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Evita empacotar Prisma no bundle do servidor (client antigo sem novos campos).
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;
