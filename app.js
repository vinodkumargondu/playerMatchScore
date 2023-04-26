const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//Convert Db Object
const convertDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
    playerMatchId: dbObject.player_match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};

//GET All Players API 1
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
        SELECT
            *
        FROM
            player_details
        ORDER BY
            player_id;`;
  const getPlayers = await db.all(getPlayersQuery);
  response.send(
    getPlayers.map((eachPlayer) => convertDbObjectToResponseObject(eachPlayer))
  );
});

//GET Specific Player API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
        SELECT
            *
        FROM
            player_details
        WHERE
            player_id = ${playerId};`;
  const getPlayer = await db.get(getPlayerQuery);
  response.send(convertDbObjectToResponseObject(getPlayer));
});

//UPDATE Player Details API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayerQuery = `
        UPDATE
            player_details
        SET
            player_name = '${playerName}'
        WHERE
            player_id = ${playerId};`;
  const updatePlayerDetails = await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//GET Match Details API 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailsQuery = `
        SELECT
            *
        FROM
            match_details
        WHERE
            match_id = ${matchId};`;
  const getMatchDetails = await db.get(getMatchDetailsQuery);
  response.send(convertDbObjectToResponseObject(getMatchDetails));
});

//GET All Matches List of Player API 5
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesQuery = `
        SELECT
            match_id,match,year
        FROM
            match_details
                NATURAL JOIN player_match_score
        WHERE
            player_id = ${playerId};`;
  const getMatches = await db.all(getMatchesQuery);
  response.send(
    getMatches.map((eachMatch) => convertDbObjectToResponseObject(eachMatch))
  );
});

//GET Players List of Specific Match API 6
app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersQuery = `
        SELECT
            player_id, player_name
        FROM
            player_details
                NATURAL JOIN player_match_score
        WHERE
            match_id = ${matchId};`;
  const getPlayers = await db.all(getPlayersQuery);
  response.send(
    getPlayers.map((eachPlayer) => convertDbObjectToResponseObject(eachPlayer))
  );
});

//GET Player Stats API 7
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const playerStatsQuery = `
        SELECT
           player_details.player_id AS playerId,
           player_details.player_name AS playerName,
           SUM(player_match_score.score) AS totalScore,
           SUM(fours) AS totalFours, 
           SUM(sixes) AS totalSixes
        FROM
            player_details
                INNER JOIN player_match_score
        ON player_details.player_id = player_match_score.player_id
        WHERE
            player_id = ${playerId};`;
  const getPlayerStats = await db.run(playerStatsQuery);
  response.send(getPlayerStats);
});
module.exports = app;
