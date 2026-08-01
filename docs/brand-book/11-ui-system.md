# 11 — UI System

**Source:** Brand Book v1 panel 10

## Principles

- Dark void stage  
- Pixel-perfect icons; clean Inter for forms  
- Bitcoin balance always visible when logged in  
- CTAs sound like arcade: **PLAY**, **INSERT COIN**, **CASH OUT**  

## Buttons

| Type | Style |
|------|-------|
| Primary | Gold/orange or green fill, dark label — **PLAY** |
| Secondary | Blue outline/fill — **CASH OUT** |
| Ghost | Steel border — **BACK** |
| Danger | Red fill |

Corner radius: slightly rounded OK for vector UI (6–12px). Pixel buttons may be 0–2px chunky.

## Panels

- Fill `#14141A` / `#1C1C24`  
- Border steel  
- Optional accent top edge  

### Balance / win

```
🪙 WIN 0.0123 BTC
₿  0.045678 BTC
```

Gold coin icon + tabular numbers.

## Tabs

`GAMES` · `LEADERBOARD` · `PROFILE` — active = pink/gold underline or filled pill.

## Progress

Bar track steel; fill green/gold; label percent mono.

## States

| State | Treatment |
|-------|-----------|
| Loading | Chip THINKING… + CRT scanline optional |
| Victory | HYPED + confetti coins + score |
| Defeat | DETERMINED or soft retry; not shame |
| Empty | Sleep face + “insert coin” |
| Wallet | Clear connect; never hide network |

## Components checklist

Buttons · Panels · Popups · Wallet connect · BTC balance · Leaderboards · Game cards · Achievement cards · Badges · Menus · Progress · Countdowns · Loading · Victory · Defeat
