const fs = require("fs");
const path = require("path");

function getFileSizeInKB(filePath) {
  const stats = fs.statSync(filePath);
  return Math.round((stats.size / 1024) * 100) / 100;
}

function analyzeCompression() {
  const distPath = path.join(__dirname, "../dist/assets");
  const files = fs.readdirSync(distPath);

  let totalOriginal = 0;
  let totalGzip = 0;
  let totalBrotli = 0;

  console.log("\n🔍 COMPRESSION ANALYSIS REPORT\n");
  console.log(
    "File                     Original    Gzip       Brotli     Gzip Savings  Brotli Savings"
  );
  console.log("─".repeat(95));

  // Lọc ra các file gốc (không phải .gz hoặc .br)
  const originalFiles = files.filter(
    (f) => !f.endsWith(".gz") && !f.endsWith(".br")
  );

  originalFiles.forEach((file) => {
    const originalPath = path.join(distPath, file);
    const gzipPath = originalPath + ".gz";
    const brotliPath = originalPath + ".br";

    if (fs.existsSync(originalPath)) {
      const originalSize = getFileSizeInKB(originalPath);
      totalOriginal += originalSize;

      let gzipSize = 0;
      let brotliSize = 0;
      let gzipSavings = 0;
      let brotliSavings = 0;

      if (fs.existsSync(gzipPath)) {
        gzipSize = getFileSizeInKB(gzipPath);
        totalGzip += gzipSize;
        gzipSavings = Math.round((1 - gzipSize / originalSize) * 100);
      }

      if (fs.existsSync(brotliPath)) {
        brotliSize = getFileSizeInKB(brotliPath);
        totalBrotli += brotliSize;
        brotliSavings = Math.round((1 - brotliSize / originalSize) * 100);
      }

      console.log(
        `${file.padEnd(24)} ${originalSize
          .toString()
          .padStart(8)} KB  ${gzipSize.toString().padStart(8)} KB  ${brotliSize
          .toString()
          .padStart(8)} KB  ${gzipSavings
          .toString()
          .padStart(8)}%     ${brotliSavings.toString().padStart(8)}%`
      );
    }
  });

  console.log("─".repeat(95));
  console.log(
    `${"TOTAL".padEnd(24)} ${totalOriginal
      .toString()
      .padStart(8)} KB  ${totalGzip.toString().padStart(8)} KB  ${totalBrotli
      .toString()
      .padStart(8)} KB`
  );

  const totalGzipSavings = Math.round((1 - totalGzip / totalOriginal) * 100);
  const totalBrotliSavings = Math.round(
    (1 - totalBrotli / totalOriginal) * 100
  );

  console.log("\n📊 SUMMARY:");
  console.log(`• Original total size: ${totalOriginal} KB`);
  console.log(
    `• Gzip compressed: ${totalGzip} KB (${totalGzipSavings}% reduction)`
  );
  console.log(
    `• Brotli compressed: ${totalBrotli} KB (${totalBrotliSavings}% reduction)`
  );
  console.log(`• Gzip savings: ${Math.round(totalOriginal - totalGzip)} KB`);
  console.log(
    `• Brotli savings: ${Math.round(totalOriginal - totalBrotli)} KB`
  );

  console.log("\n🚀 LIGHTHOUSE IMPACT:");
  if (totalGzipSavings >= 50) {
    console.log(
      "✅ Excellent compression! Should significantly improve Lighthouse score."
    );
  } else if (totalGzipSavings >= 30) {
    console.log("✅ Good compression! Should improve Lighthouse score.");
  } else {
    console.log("⚠️ Moderate compression. Consider additional optimizations.");
  }
}

analyzeCompression();
