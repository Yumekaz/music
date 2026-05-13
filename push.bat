@echo off
git -C C:\Users\Mihir\OneDrive\Desktop\music add -A
git -C C:\Users\Mihir\OneDrive\Desktop\music commit -m "feat: buffering spinner, animated bars, play-next, go-to-album, crossfade, quality picker"
git -C C:\Users\Mihir\OneDrive\Desktop\music -c http.sslVerify=false push origin main
