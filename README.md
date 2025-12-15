# My Football Tracker

A Chrome extension that helps you track your favorite football team's last result and next fixture.

## Features

- **Browse by League**: Select from 11 popular leagues and browse all teams
- **Search by Name**: Quickly find any team by searching for its name
- **Last Result**: View the most recent match result with score
- **Next Fixture**: See the upcoming match details with date and time
- **League Information**: Display which league/competition each match is in
- **Persistent Storage**: Your selected team is saved and remembered

## Supported Leagues

- English Premier League
- English League Championship
- Spanish La Liga
- German Bundesliga
- Italian Serie A
- French Ligue 1
- Portuguese Primeira Liga
- Dutch Eredivisie
- Brazilian Serie A
- Scottish Premier League
- American Major League Soccer

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked"
5. Select the folder containing this extension

## Usage

1. Click the extension icon in your browser toolbar
2. Choose how to find your team:
   - **Browse by League**: Select a league from the dropdown and pick your team from the list
   - **Search by Name**: Enter your team's name (e.g., "Arsenal") and click "Save Team"
3. View your team's last result and next fixture
4. Click "Change" to select a different team anytime

## Technical Details

### Files

- `manifest.json` - Chrome extension configuration
- `popup.html` - Main UI structure
- `popup.js` - Application logic and API integration
- `styles.css` - Styling and layout
- `README.md` - This file

### API

This extension uses [TheSportsDB API](https://www.thesportsdb.com/):

### Permissions

- `storage` - To save your selected team
- `https://www.thesportsdb.com/*` - To fetch team and match data

## Development

The extension uses vanilla JavaScript with modern async/await patterns. Key features include:

- Chrome Storage API for data persistence
- Responsive error handling
- Input sanitization for security
- Clean, modern UI with CSS custom properties

## License

This is a personal project for educational purposes.
