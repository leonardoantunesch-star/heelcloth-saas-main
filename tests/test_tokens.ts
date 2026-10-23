import fs from "fs";
import path from "path";

function testTokens() {
  console.log("🧪 Testando tokens corporativos do Design System em globals.css...");
  const cssPath = path.join(process.cwd(), "src/app/globals.css");
  const content = fs.readFileSync(cssPath, "utf-8");

  const requiredTokens = [
    "--background: #f8fafc",
    "--foreground: #0f172a",
    "--card: #ffffff",
    "--primary: #2563eb",
    "--border: #e2e8f0",
  ];

  let missing = 0;
  for (const token of requiredTokens) {
    if (!content.includes(token)) {
      console.error(`❌ Token ausente: ${token}`);
      missing++;
    } else {
      console.log(`✅ Token encontrado: ${token}`);
    }
  }

  if (missing > 0) {
    console.error(`\nFalha: ${missing} tokens corporativos não encontrados.`);
    process.exit(1);
  } else {
    console.log("\nTodos os tokens corporativos estão corretos!");
    process.exit(0);
  }
}

testTokens();
