#!/usr/bin/env python3

from PIL import Image, ImageDraw
import os

def add_rounded_corners(image_path, radius_percent=8):
    """Add subtle rounded corners to an image"""
    try:
        # Open the image
        img = Image.open(image_path).convert("RGBA")
        width, height = img.size
        
        # Calculate radius (small percentage of the smallest dimension)
        radius = min(width, height) * radius_percent // 100
        
        # Create a mask for rounded corners
        mask = Image.new('L', (width, height), 0)
        draw = ImageDraw.Draw(mask)
        
        # Draw a rounded rectangle on the mask
        draw.rounded_rectangle((0, 0, width, height), radius, fill=255)
        
        # Apply the mask to the image
        output = Image.new('RGBA', (width, height), (0, 0, 0, 0))
        output.paste(img, (0, 0))
        output.putalpha(mask)
        
        # Save the result
        output.save(image_path)
        print(f"✓ Added rounded corners to {os.path.basename(image_path)}")
        
    except Exception as e:
        print(f"✗ Error processing {image_path}: {e}")

def main():
    icon_dir = "../public/icons"
    png_files = [f for f in os.listdir(icon_dir) if f.endswith('.png')]
    
    print(f"Processing {len(png_files)} PNG icons with subtle rounded corners...")
    
    for png_file in png_files:
        file_path = os.path.join(icon_dir, png_file)
        add_rounded_corners(file_path)
    
    print("\nDone! Icons now have subtle rounded corners.")

if __name__ == "__main__":
    main()