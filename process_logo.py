import sys
from PIL import Image

def process_image(image_path, output_path):
    img = Image.open(image_path).convert("RGBA")
    width, height = img.size
    
    # Crop the bottom part where text usually is.
    # The image is likely square, let's say 1024x1024.
    # The text is usually at the bottom 15%.
    # We will just fill the bottom 15% with black before removing the background.
    
    datas = list(img.getdata())
    
    # Get the background color from the top-left pixel (should be black/dark)
    bg_color = datas[0]
    threshold = 30
    
    newData = []
    for y in range(height):
        for x in range(width):
            item = datas[y * width + x]
            
            # If we are in the bottom 15%, we want to remove the text.
            # Wait, if we just crop it to a square that excludes the bottom, it might not be centered anymore.
            # Instead of cropping, let's just make the bottom 15% transparent.
            if y > height * 0.85:
                # Text area, just make it transparent
                newData.append((0, 0, 0, 0))
                continue
                
            # Background removal
            if abs(item[0] - bg_color[0]) < threshold and \
               abs(item[1] - bg_color[1]) < threshold and \
               abs(item[2] - bg_color[2]) < threshold:
                newData.append((255, 255, 255, 0))
            # Also remove absolute black
            elif item[0] < 20 and item[1] < 20 and item[2] < 30:
                newData.append((255, 255, 255, 0))
            else:
                newData.append(item)

    img.putdata(newData)
    
    # Now let's crop the image to a tight bounding box of the non-transparent pixels
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    img.save(output_path, "PNG")
    print(f"Processed image saved to {output_path}. Bbox was {bbox}")

if __name__ == "__main__":
    process_image(sys.argv[1], sys.argv[2])
