import json
import os
from moviepy.editor import ImageClip, TextClip, CompositeVideoClip, concatenate_videoclips, AudioFileClip

def process_edit_plan(plan_json_path, output_path="output.mp4"):
    with open(plan_json_path, 'r') as f:
        plan = json.load(f)

    # Compile the background video pieces
    video_clips = []
    
    # Track 1: Media Clips
    for clip_data in plan.get("media_track", []):
        img_path = clip_data["src"]
        if not os.path.exists(img_path):
            print(f"Warning: Missing file {img_path}")
            continue

        clip = ImageClip(img_path).set_start(clip_data["start"]).set_duration(clip_data["duration"])
        
        # Super simple zoom effect logic (Ken burns) if requested
        if clip_data.get("effect") == "zoom_in":
            # MoviePy zoom is slow, we use resize lambda
            clip = clip.resize(lambda t: 1 + 0.04 * t)
            
        video_clips.append(clip)

    # Optional: Concatenate vs Composite. Since we have explicit start/duration, composite makes sense
    base_video = CompositeVideoClip(video_clips, size=(1080, 1920)) # Assuming 9:16 vertical reel

    # Track 2: Overlays (Local worker precision objects)
    overlays = []
    for txt_data in plan.get("overlay_track", []):
        txt_clip = TextClip(
            txt_data["text"], 
            fontsize=txt_data.get("size", 70), 
            color=txt_data.get("color", "white"),
            font=txt_data.get("font", "Impact")
        )
        
        # Calculate pixel positions based on percentages (0-100)
        x_pos = (txt_data.get("x", 50) / 100) * 1080 - (txt_clip.w / 2)
        y_pos = (txt_data.get("y", 50) / 100) * 1920 - (txt_clip.h / 2)
        
        # Set precise timing
        txt_clip = txt_clip.set_position((x_pos, y_pos)).set_start(txt_data["start"]).set_duration(txt_data["duration"])
        overlays.append(txt_clip)

    final_video = CompositeVideoClip([base_video] + overlays)

    # Track 3: Audio
    if "audio" in plan and os.path.exists(plan["audio"]["src"]):
        audio_clip = AudioFileClip(plan["audio"]["src"])
        # Trim audio to video length or specific duration
        audio_clip = audio_clip.subclip(0, min(audio_clip.duration, final_video.duration))
        final_video = final_video.set_audio(audio_clip)

    print(f"Rendering video with {len(video_clips)} clips and {len(overlays)} overlays...")
    final_video.write_videofile(output_path, fps=30, codec="libx264", audio_codec="aac")
    print(f"Done! Saved to {output_path}")

# Example Usage Block
if __name__ == "__main__":
    # Ensure sample dummy files exist for the test
    for i in range(1, 4):
        with open(f"dummy_{i}.jpg", "w") as f: f.write("") # Just placeholders
        
    sample_plan = {
        "media_track": [
            {"src": "dummy_1.jpg", "start": 0.0, "duration": 2.5, "effect": "zoom_in"},
            {"src": "dummy_2.jpg", "start": 2.5, "duration": 2.5, "effect": "pan_left"},
            {"src": "dummy_3.jpg", "start": 5.0, "duration": 3.0}
        ],
        "overlay_track": [
            {"text": "Happy New Year!", "start": 2.0, "duration": 3.0, "x": 50, "y": 80, "color": "yellow"}
        ]
    }
    
    with open("sample_plan.json", "w") as f:
        json.dump(sample_plan, f, indent=2)
        
    print("Created sample_plan.json. In reality, you need real images and 'moviepy' installed.")
