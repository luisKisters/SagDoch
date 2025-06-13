const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

// Copy the 32x32 icon to favicon.ico
async function createFavicon() {
  const source = path.join(__dirname, "./public/icons/icon-32x32.png");
  const dest = path.join(__dirname, "./public/favicon.ico");

  // Copy the file
  fs.copyFileSync(source, dest);

  console.log("Created favicon.ico");
}

createFavicon().catch(console.error);
