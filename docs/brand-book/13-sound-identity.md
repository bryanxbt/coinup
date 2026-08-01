# 13 — Sound Identity

## Goals

Instant arcade recognition in &lt; 500ms. Happy path sounds rewarding; errors informative not punishing.

## Cue list

| Cue | Feel |
|-----|------|
| Startup | CRT power + short jingle |
| Insert coin | Classic coin clink (modern clean) |
| Button | Soft blip |
| Countdown | Rising beeps |
| Victory | Bright fanfare stinger |
| Loss | Descending soft thud |
| Achievement | Sparkle + chord |
| Jackpot | Big layered hit + coins |
| UI navigate | Minimal ticks |

## Music direction

- Chiptune-forward with modern mix  
- Lobby loop low intensity  
- Tournament beds higher energy  
- No generic “crypto trap” bed as default  

## Implementation notes

- Sprite-able SFX; short loops  
- Mute control always available  
- Don't autoplay music with sound until gesture (web policy)  
