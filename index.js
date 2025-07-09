const express = require('express');
const { Client } = require('espn-fantasy-football-api/node');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// App setup
const app = express();
const PORT = process.env.PORT || 3000;

// ESPN Fantasy Football API client setup
const leagueId = 622245675;
const espnS2 = process.env.ESPN_S2;
const SWID = '{' + process.env.SWID + '}';

const client = new Client({ leagueId });
client.setCookies({ espnS2, SWID });

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ESPN Fantasy Football API Explorer',
      version: '1.0.0',
      description: 'A simple API explorer for ESPN Fantasy Football data',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
      },
    ],
  },
  apis: ['./routes/*.js', './index.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * components:
 *   schemas:
 *     SeasonOptions:
 *       type: object
 *       required:
 *         - seasonId
 *       properties:
 *         seasonId:
 *           type: integer
 *           description: The season ID
 *     WeekOptions:
 *       type: object
 *       required:
 *         - seasonId
 *         - scoringPeriodId
 *       properties:
 *         seasonId:
 *           type: integer
 *           description: The season ID
 *         scoringPeriodId:
 *           type: integer
 *           description: The scoring period ID
 *     BoxscoreOptions:
 *       type: object
 *       required:
 *         - seasonId
 *         - matchupPeriodId
 *         - scoringPeriodId
 *       properties:
 *         seasonId:
 *           type: integer
 *           description: The season ID
 *         matchupPeriodId:
 *           type: integer
 *           description: The matchup period ID
 *         scoringPeriodId:
 *           type: integer
 *           description: The scoring period ID
 *     NFLGamesOptions:
 *       type: object
 *       required:
 *         - startDate
 *         - endDate
 *       properties:
 *         startDate:
 *           type: string
 *           description: Start date in YYYYMMDD format
 *         endDate:
 *           type: string
 *           description: End date in YYYYMMDD format
 */

/**
 * @swagger
 * /api/league-info:
 *   get:
 *     summary: Get league information
 *     parameters:
 *       - in: query
 *         name: seasonId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Season ID
 *     responses:
 *       200:
 *         description: League information
 */
app.get('/api/league-info', async (req, res) => {
  try {
    const { seasonId } = req.query;
    const leagueInfo = await client.getLeagueInfo({ seasonId: parseInt(seasonId) });
    res.json(leagueInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/teams:
 *   get:
 *     summary: Get teams at a specific week
 *     parameters:
 *       - in: query
 *         name: seasonId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Season ID
 *       - in: query
 *         name: scoringPeriodId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Scoring Period ID
 *     responses:
 *       200:
 *         description: Teams for the specified week
 */
app.get('/api/teams', async (req, res) => {
  try {
    const { seasonId, scoringPeriodId } = req.query;
    const teams = await client.getTeamsAtWeek({
      seasonId: parseInt(seasonId),
      scoringPeriodId: parseInt(scoringPeriodId)
    });
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/boxscore:
 *   get:
 *     summary: Get boxscore for a specific week
 *     parameters:
 *       - in: query
 *         name: seasonId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Season ID
 *       - in: query
 *         name: matchupPeriodId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Matchup Period ID
 *       - in: query
 *         name: scoringPeriodId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Scoring Period ID
 *     responses:
 *       200:
 *         description: Boxscore for the specified week
 */
app.get('/api/boxscore', async (req, res) => {
  try {
    const { seasonId, matchupPeriodId, scoringPeriodId } = req.query;
    const boxscores = await client.getBoxscoreForWeek({
      seasonId: parseInt(seasonId),
      matchupPeriodId: parseInt(matchupPeriodId),
      scoringPeriodId: parseInt(scoringPeriodId)
    });
    res.json(boxscores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/free-agents:
 *   get:
 *     summary: Get free agents for a specific week
 *     parameters:
 *       - in: query
 *         name: seasonId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Season ID
 *       - in: query
 *         name: scoringPeriodId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Scoring Period ID
 *     responses:
 *       200:
 *         description: Free agents for the specified week
 */
app.get('/api/free-agents', async (req, res) => {
  try {
    const { seasonId, scoringPeriodId } = req.query;
    const freeAgents = await client.getFreeAgents({
      seasonId: parseInt(seasonId),
      scoringPeriodId: parseInt(scoringPeriodId)
    });
    res.json(freeAgents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/nfl-games:
 *   get:
 *     summary: Get NFL games for a date range
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *         required: true
 *         description: Start date (YYYYMMDD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *         required: true
 *         description: End date (YYYYMMDD)
 *     responses:
 *       200:
 *         description: NFL games in the specified date range
 */
app.get('/api/nfl-games', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const games = await client.getNFLGamesForPeriod({
      startDate,
      endDate
    });
    res.json(games);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/draft-info:
 *   get:
 *     summary: Get draft information
 *     parameters:
 *       - in: query
 *         name: seasonId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Season ID
 *       - in: query
 *         name: scoringPeriodId
 *         schema:
 *           type: integer
 *         required: false
 *         description: Scoring Period ID (optional)
 *     responses:
 *       200:
 *         description: Draft information
 */
app.get('/api/draft-info', async (req, res) => {
  try {
    const { seasonId, scoringPeriodId } = req.query;
    const options = { seasonId: parseInt(seasonId) };
    
    if (scoringPeriodId) {
      options.scoringPeriodId = parseInt(scoringPeriodId);
    }
    
    const draftInfo = await client.getDraftInfo(options);
    res.json(draftInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/historical-scoreboard:
 *   get:
 *     summary: Get historical scoreboard for a specific week (only works for previous seasons)
 *     parameters:
 *       - in: query
 *         name: seasonId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Season ID (must be a previous season)
 *       - in: query
 *         name: matchupPeriodId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Matchup Period ID
 *       - in: query
 *         name: scoringPeriodId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Scoring Period ID
 *     responses:
 *       200:
 *         description: Historical boxscore data for the specified week
 */
app.get('/api/historical-scoreboard', async (req, res) => {
  try {
    const { seasonId, matchupPeriodId, scoringPeriodId } = req.query;
    const boxscores = await client.getHistoricalScoreboardForWeek({
      seasonId: parseInt(seasonId),
      matchupPeriodId: parseInt(matchupPeriodId),
      scoringPeriodId: parseInt(scoringPeriodId)
    });
    res.json(boxscores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/historical-teams:
 *   get:
 *     summary: Get historical teams for a specific week (only works for pre-2018 seasons)
 *     parameters:
 *       - in: query
 *         name: seasonId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Season ID (must be before 2018)
 *       - in: query
 *         name: scoringPeriodId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Scoring Period ID
 *     responses:
 *       200:
 *         description: Historical team data for the specified week
 */
app.get('/api/historical-teams', async (req, res) => {
  try {
    const { seasonId, scoringPeriodId } = req.query;
    const teams = await client.getHistoricalTeamsAtWeek({
      seasonId: parseInt(seasonId),
      scoringPeriodId: parseInt(scoringPeriodId)
    });
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`ESPN Fantasy Football API Explorer running on http://localhost:${PORT}`);
  console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
});