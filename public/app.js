document.addEventListener('DOMContentLoaded', function() {
    const endpointSelect = document.getElementById('endpointSelect');
    const seasonIdGroup = document.getElementById('seasonIdGroup');
    const scoringPeriodIdGroup = document.getElementById('scoringPeriodIdGroup');
    const matchupPeriodIdGroup = document.getElementById('matchupPeriodIdGroup');
    const dateGroup = document.getElementById('dateGroup');
    const queryForm = document.getElementById('queryForm');
    const jsonResults = document.getElementById('jsonResults');
    const visualResults = document.getElementById('visualResults');
    const toggleViewBtn = document.getElementById('toggleView');
    const downloadJsonBtn = document.getElementById('downloadJson');
    const loadingIndicator = document.getElementById('loading');
    const chartContainer = document.getElementById('chartContainer');
    const tableContainer = document.getElementById('tableContainer');
    
    let currentData = null;
    let currentChart = null;
    
    // Show/hide form fields based on endpoint selection
    endpointSelect.addEventListener('change', updateFormFields);
    
    function updateFormFields() {
        const endpoint = endpointSelect.value;
        
        // Hide all groups first
        seasonIdGroup.classList.remove('d-none');
        scoringPeriodIdGroup.classList.remove('d-none');
        matchupPeriodIdGroup.classList.add('d-none');
        dateGroup.classList.add('d-none');
        
        switch(endpoint) {
            case 'league-info':
                scoringPeriodIdGroup.classList.add('d-none');
                break;
            case 'teams':
            case 'free-agents':
            case 'draft-info':
            case 'historical-teams':
                // These need seasonId and scoringPeriodId
                break;
            case 'boxscore':
            case 'historical-scoreboard':
                // Needs all three IDs
                matchupPeriodIdGroup.classList.remove('d-none');
                break;
            case 'nfl-games':
                seasonIdGroup.classList.add('d-none');
                scoringPeriodIdGroup.classList.add('d-none');
                dateGroup.classList.remove('d-none');
                break;
        }
    }
    
    // Initialize form fields
    updateFormFields();
    
    // Handle form submission
    queryForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const endpoint = endpointSelect.value;
        let url = `/api/${endpoint}?`;
        
        // Build query parameters
        if (endpoint !== 'nfl-games') {
            url += `seasonId=${document.getElementById('seasonId').value}`;
            
            if (endpoint !== 'league-info') {
                url += `&scoringPeriodId=${document.getElementById('scoringPeriodId').value}`;
            }
            
            if (endpoint === 'boxscore') {
                url += `&matchupPeriodId=${document.getElementById('matchupPeriodId').value}`;
            }
        } else {
            url += `startDate=${document.getElementById('startDate').value}&endDate=${document.getElementById('endDate').value}`;
        }
        
        // Show loading indicator
        loadingIndicator.classList.remove('d-none');
        jsonResults.textContent = '';
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            currentData = data;
            
            // Display JSON
            jsonResults.textContent = JSON.stringify(data, null, 2);
            
            // Create visualization
            createVisualization(endpoint, data);
            
        } catch (error) {
            jsonResults.textContent = `Error: ${error.message}`;
        } finally {
            loadingIndicator.classList.add('d-none');
        }
    });
    
    // Toggle between JSON and visual view
    toggleViewBtn.addEventListener('click', function() {
        if (jsonResults.classList.contains('d-none')) {
            jsonResults.classList.remove('d-none');
            visualResults.classList.add('d-none');
            toggleViewBtn.textContent = 'Show Visualization';
        } else {
            jsonResults.classList.add('d-none');
            visualResults.classList.remove('d-none');
            toggleViewBtn.textContent = 'Show JSON';
        }
    });
    
    // Download JSON
    downloadJsonBtn.addEventListener('click', function() {
        if (!currentData) return;
        
        const dataStr = JSON.stringify(currentData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        
        a.href = url;
        a.download = `espn-ff-${endpointSelect.value}-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
    
    // Create visualizations based on data
    function createVisualization(endpoint, data) {
        // Clear previous visualizations
        chartContainer.innerHTML = '';
        tableContainer.innerHTML = '';
        
        if (currentChart) {
            currentChart.destroy();
            currentChart = null;
        }
        
        // Create table for data
        const table = document.createElement('table');
        table.className = 'table table-striped table-hover';
        
        // Create different visualizations based on endpoint
        switch(endpoint) {
            case 'teams':
            case 'historical-teams':
                visualizeTeams(data);
                break;
            case 'boxscore':
            case 'historical-scoreboard':
                visualizeBoxscores(data);
                break;
            case 'free-agents':
                visualizeFreeAgents(data);
                break;
            case 'nfl-games':
                visualizeNFLGames(data);
                break;
            case 'draft-info':
                visualizeDraftInfo(data);
                break;
            case 'league-info':
            default:
                visualizeGeneric(data);
                break;
        }
    }
    
    function visualizeTeams(teams) {
        // Create chart showing team wins/losses
        const canvas = document.createElement('canvas');
        chartContainer.appendChild(canvas);
        
        const labels = teams.map(team => team.name);
        const wins = teams.map(team => team.wins);
        const losses = teams.map(team => team.losses);
        
        currentChart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Wins',
                        data: wins,
                        backgroundColor: 'rgba(75, 192, 192, 0.7)'
                    },
                    {
                        label: 'Losses',
                        data: losses,
                        backgroundColor: 'rgba(255, 99, 132, 0.7)'
                    }
                ]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'Team Records'
                    }
                },
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
        
        // Create table of teams
        const table = document.createElement('table');
        table.className = 'table table-striped';
        
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Team Name</th>
                <th>Owner</th>
                <th>W-L</th>
                <th>Points For</th>
                <th>Points Against</th>
            </tr>
        `;
        
        const tbody = document.createElement('tbody');
        teams.forEach(team => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${team.name}</td>
                <td>${team.owners.join(', ')}</td>
                <td>${team.wins}-${team.losses}</td>
                <td>${team.pointsFor?.toFixed(2) || 0}</td>
                <td>${team.pointsAgainst?.toFixed(2) || 0}</td>
            `;
            tbody.appendChild(row);
        });
        
        table.appendChild(thead);
        table.appendChild(tbody);
        tableContainer.appendChild(table);
    }
    
    function visualizeBoxscores(boxscores) {
        // Create chart showing matchup scores
        const canvas = document.createElement('canvas');
        chartContainer.appendChild(canvas);
        
        const labels = [];
        const homeScores = [];
        const awayScores = [];
        
        boxscores.forEach((boxscore, index) => {
            labels.push(`Matchup ${index + 1}`);
            homeScores.push(boxscore.homeScore);
            awayScores.push(boxscore.awayScore);
        });
        
        currentChart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Home Team',
                        data: homeScores,
                        backgroundColor: 'rgba(54, 162, 235, 0.7)'
                    },
                    {
                        label: 'Away Team',
                        data: awayScores,
                        backgroundColor: 'rgba(255, 206, 86, 0.7)'
                    }
                ]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'Matchup Scores'
                    }
                },
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
        
        // Create table of boxscores
        const table = document.createElement('table');
        table.className = 'table table-striped';
        
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Matchup</th>
                <th>Home Team</th>
                <th>Home Score</th>
                <th>Away Team</th>
                <th>Away Score</th>
                <th>Winner</th>
            </tr>
        `;
        
        const tbody = document.createElement('tbody');
        boxscores.forEach((boxscore, index) => {
            const row = document.createElement('tr');
            const winner = boxscore.homeScore > boxscore.awayScore ? 'Home' : 
                           boxscore.homeScore < boxscore.awayScore ? 'Away' : 'Tie';
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${boxscore.homeTeamId}</td>
                <td>${boxscore.homeScore?.toFixed(2) || 0}</td>
                <td>${boxscore.awayTeamId}</td>
                <td>${boxscore.awayScore?.toFixed(2) || 0}</td>
                <td>${winner}</td>
            `;
            tbody.appendChild(row);
        });
        
        table.appendChild(thead);
        table.appendChild(tbody);
        tableContainer.appendChild(table);
    }
    
    function visualizeFreeAgents(freeAgents) {
        // Group free agents by position
        const positionCounts = {};
        freeAgents.forEach(player => {
            const position = player.defaultPosition;
            if (!positionCounts[position]) {
                positionCounts[position] = 0;
            }
            positionCounts[position]++;
        });
        
        // Create chart showing free agents by position
        const canvas = document.createElement('canvas');
        chartContainer.appendChild(canvas);
        
        const positions = Object.keys(positionCounts);
        const counts = positions.map(pos => positionCounts[pos]);
        
        currentChart = new Chart(canvas, {
            type: 'pie',
            data: {
                labels: positions,
                datasets: [{
                    data: counts,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)'
                    ]
                }]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'Free Agents by Position'
                    }
                },
                responsive: true
            }
        });
        
        // Create table of free agents
        const table = document.createElement('table');
        table.className = 'table table-striped';
        
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Player</th>
                <th>Position</th>
                <th>Team</th>
                <th>Projected Points</th>
            </tr>
        `;
        
        const tbody = document.createElement('tbody');
        freeAgents.slice(0, 50).forEach(player => { // Show top 50 to avoid huge table
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${player.fullName}</td>
                <td>${player.defaultPosition}</td>
                <td>${player.proTeam}</td>
                <td>${player.projectedScore?.toFixed(2) || 'N/A'}</td>
            `;
            tbody.appendChild(row);
        });
        
        table.appendChild(thead);
        table.appendChild(tbody);
        tableContainer.appendChild(table);
        
        // Add note about limited display
        const note = document.createElement('p');
        note.className = 'text-muted';
        note.textContent = `Showing ${Math.min(50, freeAgents.length)} of ${freeAgents.length} free agents`;
        tableContainer.appendChild(note);
    }
    
    function visualizeNFLGames(games) {
        // Create chart showing games by date
        const canvas = document.createElement('canvas');
        chartContainer.appendChild(canvas);
        
        // Group games by date
        const gamesByDate = {};
        games.forEach(game => {
            const date = new Date(game.date).toLocaleDateString();
            if (!gamesByDate[date]) {
                gamesByDate[date] = 0;
            }
            gamesByDate[date]++;
        });
        
        const dates = Object.keys(gamesByDate);
        const counts = dates.map(date => gamesByDate[date]);
        
        currentChart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Games',
                    data: counts,
                    backgroundColor: 'rgba(54, 162, 235, 0.7)'
                }]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'NFL Games by Date'
                    }
                },
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
        
        // Create table of NFL games
        const table = document.createElement('table');
        table.className = 'table table-striped';
        
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Date</th>
                <th>Away Team</th>
                <th>Home Team</th>
                <th>Status</th>
            </tr>
        `;
        
        const tbody = document.createElement('tbody');
        games.forEach(game => {
            const row = document.createElement('tr');
            const date = new Date(game.date).toLocaleString();
            
            row.innerHTML = `
                <td>${date}</td>
                <td>${game.awayTeam}</td>
                <td>${game.homeTeam}</td>
                <td>${game.status || 'Scheduled'}</td>
            `;
            tbody.appendChild(row);
        });
        
        table.appendChild(thead);
        table.appendChild(tbody);
        tableContainer.appendChild(table);
    }
    
    function visualizeDraftInfo(draftPicks) {
        // Create chart showing picks by round
        const canvas = document.createElement('canvas');
        chartContainer.appendChild(canvas);
        
        // Group picks by position
        const positionCounts = {};
        draftPicks.forEach(pick => {
            const position = pick.player?.defaultPosition || 'Unknown';
            if (!positionCounts[position]) {
                positionCounts[position] = 0;
            }
            positionCounts[position]++;
        });
        
        const positions = Object.keys(positionCounts);
        const counts = positions.map(pos => positionCounts[pos]);
        
        currentChart = new Chart(canvas, {
            type: 'pie',
            data: {
                labels: positions,
                datasets: [{
                    data: counts,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)'
                    ]
                }]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'Draft Picks by Position'
                    }
                },
                responsive: true
            }
        });
        
        // Create table of draft picks
        const table = document.createElement('table');
        table.className = 'table table-striped';
        
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Pick #</th>
                <th>Round</th>
                <th>Team</th>
                <th>Player</th>
                <th>Position</th>
                <th>NFL Team</th>
            </tr>
        `;
        
        const tbody = document.createElement('tbody');
        draftPicks.forEach((pick, index) => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${pick.overallPickNumber || index + 1}</td>
                <td>${pick.roundId || Math.floor(index / 10) + 1}</td>
                <td>${pick.teamId}</td>
                <td>${pick.player?.fullName || 'N/A'}</td>
                <td>${pick.player?.defaultPosition || 'N/A'}</td>
                <td>${pick.player?.proTeam || 'N/A'}</td>
            `;
            tbody.appendChild(row);
        });
        
        table.appendChild(thead);
        table.appendChild(tbody);
        tableContainer.appendChild(table);
    }
    
    function visualizeGeneric(data) {
        // For league info and any other data types
        // Just create a simple table representation
        const table = document.createElement('table');
        table.className = 'table table-striped';
        
        // Extract key values from data object
        const entries = Object.entries(data).filter(([key, value]) => 
            typeof value !== 'object' || value === null
        );
        
        // Create table headers
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Property</th>
                <th>Value</th>
            </tr>
        `;
        
        // Create table body
        const tbody = document.createElement('tbody');
        entries.forEach(([key, value]) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${key}</td>
                <td>${value}</td>
            `;
            tbody.appendChild(row);
        });
        
        table.appendChild(thead);
        table.appendChild(tbody);
        tableContainer.appendChild(table);
        
        // Add a note about complex objects
        const note = document.createElement('p');
        note.className = 'text-muted';
        note.textContent = 'Note: Complex nested objects are only visible in the JSON view.';
        tableContainer.appendChild(note);
    }
    
    // Update the endpoint select with new options
    // Add options for historical endpoints if they don't exist
    if (!Array.from(endpointSelect.options).some(option => option.value === 'historical-scoreboard')) {
        const historicalScoreboardOption = document.createElement('option');
        historicalScoreboardOption.value = 'historical-scoreboard';
        historicalScoreboardOption.textContent = 'Historical Scoreboard';
        endpointSelect.appendChild(historicalScoreboardOption);
        
        const historicalTeamsOption = document.createElement('option');
        historicalTeamsOption.value = 'historical-teams';
        historicalTeamsOption.textContent = 'Historical Teams';
        endpointSelect.appendChild(historicalTeamsOption);
    }
});
