const API_KEY_FREE = "3"; // Free API key - works for team searches
const API_KEY_PATREON = "123"; // Patreon API key - works for fixtures
const BASE_URL_FREE = `https://www.thesportsdb.com/api/v1/json/${API_KEY_FREE}`;
const BASE_URL_PATREON = `https://www.thesportsdb.com/api/v1/json/${API_KEY_PATREON}`;

// DOM Elements
const searchSection = document.getElementById("search-section");
const contentSection = document.getElementById("content-section");
const teamInput = document.getElementById("team-input");
const searchBtn = document.getElementById("search-btn");
const changeTeamBtn = document.getElementById("change-team-btn");
const statusMsg = document.getElementById("status-msg");

// New tab and browse elements
const browseTab = document.getElementById("browse-tab");
const searchTab = document.getElementById("search-tab");
const browseView = document.getElementById("browse-view");
const searchView = document.getElementById("search-view");
const leagueSelect = document.getElementById("league-select");
const teamsList = document.getElementById("teams-list");

// 1. Initialize: Check if user already has a team saved
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(["teamId", "teamName", "teamBadge"], (result) => {
    if (chrome.runtime.lastError) {
      console.error("Storage error:", chrome.runtime.lastError);
      showSearch();
      return;
    }

    if (result.teamId) {
      showContent(result.teamName, result.teamBadge);
      fetchTeamData(result.teamId);
    } else {
      showSearch();
    }
  });
});

// 2. Tab Switching Logic
browseTab.addEventListener("click", () => {
  browseTab.classList.add("active");
  searchTab.classList.remove("active");
  browseView.classList.remove("hidden");
  searchView.classList.add("hidden");
  setStatus("", false);
});

searchTab.addEventListener("click", () => {
  searchTab.classList.add("active");
  browseTab.classList.remove("active");
  searchView.classList.remove("hidden");
  browseView.classList.add("hidden");
  setStatus("", false);
});

// 3. League Selection Logic
leagueSelect.addEventListener("change", async () => {
  const leagueName = leagueSelect.value;
  if (!leagueName) {
    teamsList.classList.add("hidden");
    teamsList.innerHTML = "";
    return;
  }

  setStatus("Loading teams...", false);

  try {
    const res = await fetch(`${BASE_URL_FREE}/search_all_teams.php?l=${encodeURIComponent(leagueName)}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();

    if (!data.teams || data.teams.length === 0) {
      setStatus("No teams found for this league.", true);
      teamsList.classList.add("hidden");
      return;
    }

    displayTeams(data.teams);
    setStatus("", false);
  } catch (error) {
    console.error("League teams fetch error:", error);
    setStatus("Error loading teams.", true);
  }
});

// 4. Search Logic
searchBtn.addEventListener("click", async () => {
  const query = teamInput.value.trim();
  if (!query) return;

  setStatus("Searching...", false);

  try {
    const res = await fetch(`${BASE_URL_FREE}/searchteams.php?t=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();

    if (!data.teams || data.teams.length === 0) {
      setStatus("Team not found. Try exact name.", true);
      return;
    }

    // Determine the most likely team (first result)
    const team = data.teams[0];
    saveTeam(team.idTeam, team.strTeam, team.strBadge);
  } catch (error) {
    setStatus("Error fetching data.", true);
    console.error("Search error:", error);
  }
});

// 5. Reset/Change Team Logic
changeTeamBtn.addEventListener("click", () => {
  chrome.storage.local.remove(["teamId", "teamName"], () => {
    if (chrome.runtime.lastError) {
      console.error("Storage error:", chrome.runtime.lastError);
      setStatus("Error clearing team data.", true);
      return;
    }

    showSearch();
    teamInput.value = "";
    setStatus("", false);
  });
});

// 6. Fetch Match Data (Last and Next)
async function fetchTeamData(teamId) {
  setStatus("Loading match data...", false);

  try {
    // Get the team name from storage to filter matches
    const storageData = await new Promise((resolve) => {
      chrome.storage.local.get(["teamName"], (result) => {
        resolve(result);
      });
    });
    const teamName = storageData.teamName;

    // Fetch Last 5 Events using Patreon API key
    const lastRes = await fetch(`${BASE_URL_PATREON}/eventslast.php?id=${teamId}`);
    if (!lastRes.ok) throw new Error(`HTTP error! status: ${lastRes.status}`);
    const lastData = await lastRes.json();

    // Get the last game
    const lastGame = lastData.results?.[0];

    // Fetch Next 5 Events using Patreon API key
    const nextRes = await fetch(`${BASE_URL_PATREON}/eventsnext.php?id=${teamId}`);
    if (!nextRes.ok) throw new Error(`HTTP error! status: ${nextRes.status}`);
    const nextData = await nextRes.json();

    // Find the first upcoming match for this team
    const nextGame = nextData.events?.find(event =>
      event.strHomeTeam === teamName || event.strAwayTeam === teamName
    );

    updateUI(lastGame, nextGame);
    setStatus("", false); // Clear loading message
  } catch (error) {
    console.error("Data fetch error:", error);
    setStatus("Could not load match data.", true);
  }
}

// 7. Helper Functions
function displayTeams(teams) {
  // Sort teams alphabetically
  teams.sort((a, b) => a.strTeam.localeCompare(b.strTeam));

  teamsList.innerHTML = teams.map(team => `
    <div class="team-item" data-team-id="${team.idTeam}" data-team-name="${team.strTeam}">
      <img src="${team.strBadge}" alt="${team.strTeam}" class="team-badge" onerror="this.style.display='none'">
      <span class="team-name">${team.strTeam}</span>
    </div>
  `).join("");

  teamsList.classList.remove("hidden");

  // Add click handlers
  document.querySelectorAll(".team-item").forEach(item => {
    item.addEventListener("click", () => {
      const teamId = item.dataset.teamId;
      const teamName = item.dataset.teamName;
      const teamBadge = item.querySelector('.team-badge')?.src || '';
      saveTeam(teamId, teamName, teamBadge);
    });
  });
}

function saveTeam(id, name, badge) {
  chrome.storage.local.set({ teamId: id, teamName: name, teamBadge: badge }, () => {
    if (chrome.runtime.lastError) {
      console.error("Storage error:", chrome.runtime.lastError);
      setStatus("Error saving team data.", true);
      return;
    }

    showContent(name, badge);
    fetchTeamData(id);
  });
}

function updateUI(lastGame, nextGame) {
  // Update Last Game
  if (lastGame) {
    document.getElementById("last-league").textContent = lastGame.strLeague || "League";
    document.getElementById("last-home").textContent = lastGame.strHomeTeam;
    document.getElementById("last-away").textContent = lastGame.strAwayTeam;
    document.getElementById("last-score").textContent = `${lastGame.intHomeScore} - ${lastGame.intAwayScore}`;
    document.getElementById("last-date").textContent = lastGame.dateEvent;
  } else {
    document.getElementById("last-league").textContent = "League";
    document.getElementById("last-score").textContent = "No recent data";
  }

  // Update Next Game
  if (nextGame) {
    document.getElementById("next-league").textContent = nextGame.strLeague || "League";
    document.getElementById("next-home").textContent = nextGame.strHomeTeam;
    document.getElementById("next-away").textContent = nextGame.strAwayTeam;
    document.getElementById("next-date").textContent = `${nextGame.dateEvent} @ ${nextGame.strTime}`;
  } else {
    document.getElementById("next-league").textContent = "League";
    document.getElementById("next-date").textContent = "No upcoming fixture found";
  }
}

function showSearch() {
  searchSection.classList.remove("hidden");
  contentSection.classList.add("hidden");
}

function showContent(teamName, teamBadge) {
  searchSection.classList.add("hidden");
  contentSection.classList.remove("hidden");
  document.getElementById("team-name").textContent = teamName;

  const teamLogo = document.getElementById("team-logo");
  if (teamBadge) {
    teamLogo.src = teamBadge;
    teamLogo.style.display = "block";
  } else {
    teamLogo.style.display = "none";
  }
}

function setStatus(msg, isError) {
  statusMsg.textContent = msg;
  statusMsg.classList.remove("hidden");
  statusMsg.style.color = isError ? "red" : "black";
}