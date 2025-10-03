# Image Generation:

- https://aistudio.google.com/gen-media
  - two images to video
- https://openart.ai/assets
  - prompt to video (new3.mp4)
- add audio to video
  - used openart.ai
- SORA IS OPENAI video gen -- not as good result for me, but good cheetah scene
- https://www.one.imagine.art/video
  - two images and beautiful transition

stitched the videos together by ffmpeg:
ffmpeg -f concat -safe 0 -i input.txt -c copy output.mp4
