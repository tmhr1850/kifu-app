# Audio Files

This directory contains audio files for the Shogi application.

## Directory Structure

- `/bgm/` - Background music files
  - `traditional.mp3` - Traditional Japanese BGM
  - `modern.mp3` - Modern style BGM
  - `ambient.mp3` - Ambient background sounds

## Sound Effects

Sound effects are generated programmatically using the Web Audio API to avoid file dependencies.

## Adding Audio Files

When adding actual audio files:
1. Ensure files are in appropriate formats (MP3, OGG for compatibility)
2. Keep file sizes reasonable (< 1MB for effects, < 5MB for BGM)
3. Consider using audio sprites for multiple short effects
4. Ensure proper licensing for all audio content