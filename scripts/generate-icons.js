const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

// Create the directory if it doesn't exist
const iconsDir = path.join(__dirname, "./public/icons");
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Get the SVG file
const svgPath = path.join(iconsDir, "icon.svg");
const svgBuffer = fs.readFileSync(svgPath);

// Generate the 192x192 icon
sharp(svgBuffer)
  .resize(192, 192)
  .png()
  .toFile(path.join(iconsDir, "icon-192x192.png"))
  .then(() => {
    console.log("Created 192x192 icon");
  })
  .catch((err) => {
    console.error("Error creating 192x192 icon:", err);
  });

// Generate the 512x512 icon
sharp(svgBuffer)
  .resize(512, 512)
  .png()
  .toFile(path.join(iconsDir, "icon-512x512.png"))
  .then(() => {
    console.log("Created 512x512 icon");
  })
  .catch((err) => {
    console.error("Error creating 512x512 icon:", err);
  });

// Generate additional sizes for iOS and other platforms
const additionalSizes = [16, 32, 64, 144, 256];

additionalSizes.forEach((size) => {
  sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(path.join(iconsDir, `icon-${size}x${size}.png`))
    .then(() => {
      console.log(`Created ${size}x${size} icon`);
    })
    .catch((err) => {
      console.error(`Error creating ${size}x${size} icon:`, err);
    });
});
