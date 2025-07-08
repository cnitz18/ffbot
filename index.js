const {Client} = require('espn-fantasy-football-api/node');
const leagueId = 23001979;
const espnS2 = process.env.ESPN_S2;
const SWID = '{' + process.env.SWID + '}';

// ESPN Fantasy Football API client setup
var client = new Client({ leagueId });
client.setCookies({espnS2,SWID});
console.log('working?')

async function main(){
    try{
        console.log(new Date().getFullYear(-1))
        var freeAgents = await client.getFreeAgents({ seasonId: new Date().getFullYear() - 1 })
        console.log(freeAgents.length + ' free agents found');
    }catch (error) {
        console.error('Error fetching free agents:', error);
    }
}

main();