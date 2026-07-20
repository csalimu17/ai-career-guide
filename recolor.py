import sys
from PIL import Image
import numpy as np

def recolor_image(image_path, output_path):
    # Open image
    img = Image.open(image_path).convert('RGBA')
    data = np.array(img)
    
    # The original logo is golden. We will shift the hue to blue/indigo.
    # We can just convert to HSV, shift hue, and convert back.
    import colorsys
    
    # Vectorize the conversion
    r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]
    
    # Create output arrays
    out_r = np.zeros_like(r)
    out_g = np.zeros_like(g)
    out_b = np.zeros_like(b)
    
    # Iterate and convert
    for i in range(data.shape[0]):
        for j in range(data.shape[1]):
            if a[i, j] > 0:
                h, s, v = colorsys.rgb_to_hsv(r[i,j]/255.0, g[i,j]/255.0, b[i,j]/255.0)
                # Golden is around 0.1, Blue/Indigo is around 0.6 to 0.7
                # We'll just force the hue to 0.65 (Blue/Indigo)
                h = 0.65
                nr, ng, nb = colorsys.hsv_to_rgb(h, s, v)
                out_r[i,j] = int(nr * 255)
                out_g[i,j] = int(ng * 255)
                out_b[i,j] = int(nb * 255)
            else:
                out_r[i,j] = 0
                out_g[i,j] = 0
                out_b[i,j] = 0

    new_data = np.dstack((out_r, out_g, out_b, a))
    new_img = Image.fromarray(new_data, 'RGBA')
    new_img.save(output_path)
    print("Image recolored successfully.")

if __name__ == '__main__':
    recolor_image(sys.argv[1], sys.argv[2])
