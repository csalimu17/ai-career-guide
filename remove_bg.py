import sys
from PIL import Image

def remove_background(image_path, output_path):
    img = Image.open(image_path).convert("RGBA")
    datas = img.getdata()

    # Get the background color from the top-left pixel
    bg_color = datas[0]
    
    # We define a threshold for 'close to background'
    threshold = 50
    
    newData = []
    for item in datas:
        # Distance formula or simple absolute difference
        if abs(item[0] - bg_color[0]) < threshold and \
           abs(item[1] - bg_color[1]) < threshold and \
           abs(item[2] - bg_color[2]) < threshold:
            # Check if it's very dark as well to be safe (since it's dark blue)
            if item[0] < 80 and item[1] < 80 and item[2] < 120:
                newData.append((255, 255, 255, 0)) # Transparent
            else:
                newData.append(item)
        else:
            # also remove absolute black or near black
            if item[0] < 20 and item[1] < 20 and item[2] < 30:
                newData.append((255, 255, 255, 0)) # Transparent
            else:
                newData.append(item)

    img.putdata(newData)
    img.save(output_path, "PNG")

if __name__ == "__main__":
    remove_background(sys.argv[1], sys.argv[2])
