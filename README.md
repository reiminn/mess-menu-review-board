# Mess Menu & Review Board

A frontend-only app that lets students see what the mess is serving and rate every meal. Built with plain HTML, CSS and JavaScript. Data is stored in the browser's `localStorage`, so there is no backend or install step.

## Problem
Students often don't know what's for dinner until they reach the mess, and feedback about food quality rarely reaches anyone in a useful form. This board makes the weekly menu easy to check and turns quick ratings into clear trends.

## Run it
Open `index.html` in any modern browser. Sample reviews for the past week are generated on first load so the charts are not empty.

## Features
- **Up-next widget:** shows the meal being served now (or the next one), its dishes and a countdown.
- **Weekly menu:** breakfast, lunch, snacks and dinner for any day in the past week plus tomorrow.
- **Emoji ratings:** a 5-step scale, quick tags (Tasty, Too oily, Served cold, Long queue and more) and an optional 200-character comment. Ratings open only once a meal has started serving, and you can edit your rating later.
- **Reviews feed:** anonymous reviews with filters by day, meal and "only mine". You can delete your own reviews.
- **Insights:** a 7-day average chart, average rating by meal, best-rated and lowest-rated dishes, and the most common tags.

## Files
| File | Purpose |
| --- | --- |
| `index.html` | Page shell |
| `style.css` | Styling and responsive layout |
| `app.js` | Menu data, seed data, rendering, ratings and insights |

## Notes and limits
- Reviews are stored per browser. A real deployment would add a backend (Firebase or Supabase) so everyone's ratings combine.
- The weekly menu is sample data that repeats every week. Edit the `MENU` object at the top of `app.js` to use your own mess menu.
- Dish ratings are derived from the meal each dish was served in, so they are an estimate, not a per-dish vote.
- To reset the demo, clear this site's localStorage in DevTools and reload.
