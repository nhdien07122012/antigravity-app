import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import os

def create_icons():
    # Supersampling 2x: render at 2048x2048, downsample to 1024x1024 with Lanczos
    SIZE = 2048
    TARGET_SIZE = (1024, 1024)
    
    # 1. Build Vector Mask of the Antigravity 'A' Emblem
    # We will draw on an image at 2048x2048
    mask_img = Image.new("L", (SIZE, SIZE), 0)
    draw = ImageDraw.Draw(mask_img)
    
    # Geometry points for the Antigravity 'A'
    # Apex top: (1024, 430)
    # Bottom Left: (540, 1620)
    # Bottom Right: (1508, 1620)
    # Outer polygon with rounded caps:
    # Outer left contour, apex curve, outer right contour, bottom right cap, inner right contour, inner arch, inner left contour, bottom left cap
    
    # Let's draw using precise polygon & rounded caps
    apex_x, apex_y = 1024, 430
    bl_x, bl_y = 520, 1630
    br_x, br_y = 1528, 1630
    leg_w = 260
    
    # Inner arch top
    arch_top_x, arch_top_y = 1024, 1080
    arch_radius = 140
    
    # Outer polygon points
    # Outer triangle
    outer_pts = [
        (apex_x, apex_y),
        (br_x + leg_w/2, br_y),
        (br_x - leg_w/2, br_y),
        (apex_x, arch_top_y),
        (bl_x + leg_w/2, bl_y),
        (bl_x - leg_w/2, bl_y)
    ]
    
    # Better yet: draw lines with thick stroke and rounded caps!
    # Left leg: from (bl_x, bl_y) to (apex_x, apex_y)
    # Right leg: from (apex_x, apex_y) to (br_x, br_y)
    stroke_w = 270
    draw.line([(bl_x, bl_y), (apex_x, apex_y), (br_x, br_y)], fill=255, width=stroke_w, joint="curve")
    
    # Add rounded end caps
    draw.ellipse([bl_x - stroke_w/2, bl_y - stroke_w/2, bl_x + stroke_w/2, bl_y + stroke_w/2], fill=255)
    draw.ellipse([br_x - stroke_w/2, br_y - stroke_w/2, br_x + stroke_w/2, br_y + stroke_w/2], fill=255)
    draw.ellipse([apex_x - stroke_w/2, apex_y - stroke_w/2, apex_x + stroke_w/2, apex_y + stroke_w/2], fill=255)
    
    # Smooth the mask slightly
    mask_img = mask_img.filter(ImageFilter.GaussianBlur(radius=2))
    mask = np.array(mask_img, dtype=np.float32) / 255.0

    # 2. Compute Google Gradient along the path
    # Gradient coordinates:
    # Parametric coordinate t from 0 (bottom-left) -> 0.5 (apex) -> 1.0 (bottom-right)
    # Google Colors:
    # 0.00: Blue   #4285F4 (66, 133, 244)
    # 0.25: Green  #34A853 (52, 168, 83)
    # 0.50: Yellow #FBBC05 (251, 188, 5)
    # 0.75: Red    #EA4335 (234, 67, 53)
    # 1.00: Blue   #4285F4 (66, 133, 244)
    
    y_coords, x_coords = np.mgrid[0:SIZE, 0:SIZE]
    
    # Approximate t based on x and y
    # For left side (x <= apex_x): t goes from 0.0 at (bl_x, bl_y) to 0.5 at (apex_x, apex_y)
    # For right side (x > apex_x): t goes from 0.5 at (apex_x, apex_y) to 1.0 at (br_x, br_y)
    norm_y = (y_coords - apex_y) / (bl_y - apex_y) # 0 at apex, 1 at bottom
    norm_y = np.clip(norm_y, 0.0, 1.0)
    
    t_left = 0.5 * (1.0 - norm_y)   # 0 at bottom, 0.5 at apex
    t_right = 0.5 + 0.5 * norm_y    # 0.5 at apex, 1.0 at bottom
    
    t = np.where(x_coords <= apex_x, t_left, t_right)
    
    # Color interpolation function
    def get_color(t_val):
        stops = [
            (0.00, np.array([66, 133, 244])),   # Blue
            (0.24, np.array([52, 168, 83])),    # Green
            (0.50, np.array([251, 188, 5])),    # Yellow
            (0.76, np.array([234, 67, 53])),    # Red
            (1.00, np.array([66, 133, 244]))    # Blue
        ]
        
        r = np.zeros_like(t_val)
        g = np.zeros_like(t_val)
        b = np.zeros_like(t_val)
        
        for i in range(len(stops) - 1):
            t0, c0 = stops[i]
            t1, c1 = stops[i+1]
            seg_mask = (t_val >= t0) & (t_val <= t1)
            f = (t_val - t0) / (t1 - t0)
            
            r = np.where(seg_mask, c0[0] + f * (c1[0] - c0[0]), r)
            g = np.where(seg_mask, c0[1] + f * (c1[1] - c0[1]), g)
            b = np.where(seg_mask, c0[2] + f * (c1[2] - c0[2]), b)
            
        return np.dstack([r, g, b]).astype(np.float32)

    gradient_rgb = get_color(t)

    # Output directory
    icon_dir = "ios/App/App/Assets.xcassets/AppIcon.appiconset"
    os.makedirs(icon_dir, exist_ok=True)

    # -------------------------------------------------------------
    # 3. Create LIGHT ICON (AppIcon-512@2x.png)
    # Background: Premium clean white/light canvas with subtle gradient
    # -------------------------------------------------------------
    bg_light = np.zeros((SIZE, SIZE, 3), dtype=np.float32)
    for y in range(SIZE):
        factor = y / SIZE
        # Soft subtle white to clean icy-slate gradient #FFFFFF to #F1F5F9
        bg_light[y, :, 0] = 255.0 - factor * 8.0
        bg_light[y, :, 1] = 255.0 - factor * 6.0
        bg_light[y, :, 2] = 255.0 - factor * 4.0
        
    # Drop shadow
    shadow_mask_img = mask_img.filter(ImageFilter.GaussianBlur(radius=28))
    shadow_mask = np.array(shadow_mask_img, dtype=np.float32) / 255.0
    shadow_shift = 18
    shadow_mask = np.roll(shadow_mask, shadow_shift, axis=0)
    
    # Composite light: bg -> shadow -> emblem
    light_comp = bg_light.copy()
    # Apply soft dark shadow
    shadow_alpha = shadow_mask * 0.22
    for c in range(3):
        light_comp[:, :, c] = light_comp[:, :, c] * (1.0 - shadow_alpha)
        
    # Apply emblem
    m3 = np.dstack([mask, mask, mask])
    light_comp = light_comp * (1.0 - m3) + gradient_rgb * m3
    light_comp = np.clip(light_comp, 0, 255).astype(np.uint8)
    
    img_light = Image.fromarray(light_comp).resize(TARGET_SIZE, Image.Resampling.LANCZOS)
    img_light.save(os.path.join(icon_dir, "AppIcon-512@2x.png"))
    print("Saved AppIcon-512@2x.png (Light Mode)")

    # -------------------------------------------------------------
    # 4. Create DARK ICON (AppIcon-Dark-512@2x.png)
    # Background: Deep dark #141416 with neon luminescence
    # -------------------------------------------------------------
    bg_dark = np.zeros((SIZE, SIZE, 3), dtype=np.float32)
    # Dark carbon background #141416 with subtle radial center highlight
    for y in range(SIZE):
        for x in range(SIZE):
            dist = math.sqrt((x - 1024)**2 + (y - 1024)**2) / 1024.0
            val = max(18.0, 26.0 - dist * 10.0)
            bg_dark[y, x, 0] = val
            bg_dark[y, x, 1] = val + 1.0
            bg_dark[y, x, 2] = val + 3.0
            
    # Glow around emblem
    glow_mask_img = mask_img.filter(ImageFilter.GaussianBlur(radius=40))
    glow_mask = np.array(glow_mask_img, dtype=np.float32) / 255.0
    glow_alpha = glow_mask * 0.35
    
    dark_comp = bg_dark.copy()
    for c in range(3):
        dark_comp[:, :, c] += gradient_rgb[:, :, c] * glow_alpha
        
    # Overlay emblem
    dark_comp = dark_comp * (1.0 - m3) + gradient_rgb * m3
    dark_comp = np.clip(dark_comp, 0, 255).astype(np.uint8)
    
    img_dark = Image.fromarray(dark_comp).resize(TARGET_SIZE, Image.Resampling.LANCZOS)
    img_dark.save(os.path.join(icon_dir, "AppIcon-Dark-512@2x.png"))
    print("Saved AppIcon-Dark-512@2x.png (Dark Mode)")

    # -------------------------------------------------------------
    # 5. Create TINTED / CLEAR ICON (AppIcon-Tinted-512@2x.png)
    # Transparent background, pure grayscale monochrome emblem for iOS 18 tinting
    # -------------------------------------------------------------
    # Greyscale emblem with subtle top-to-bottom shading (255 at top to 220 at bottom)
    tinted_comp = np.zeros((SIZE, SIZE, 4), dtype=np.uint8)
    gray_val = (255.0 - norm_y * 35.0) # subtle shading
    
    tinted_comp[:, :, 0] = gray_val.astype(np.uint8)
    tinted_comp[:, :, 1] = gray_val.astype(np.uint8)
    tinted_comp[:, :, 2] = gray_val.astype(np.uint8)
    tinted_comp[:, :, 3] = (mask * 255.0).astype(np.uint8)
    
    img_tinted = Image.fromarray(tinted_comp, mode="RGBA").resize(TARGET_SIZE, Image.Resampling.LANCZOS)
    img_tinted.save(os.path.join(icon_dir, "AppIcon-Tinted-512@2x.png"))
    print("Saved AppIcon-Tinted-512@2x.png (Tinted / Clear Mode for iOS 18)")

    # Also update public/logo.svg and web icons
    print("All iOS 18 app icons generated successfully!")

if __name__ == "__main__":
    create_icons()
