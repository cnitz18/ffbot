const {Client} = require('espn-fantasy-football-api/node');
const leagueId = 23001979;
const espnS2 = 'AEC7m1w8fL71ahh5zXZ14yIcDmSTiWUAX3pvJc3mXph9YWABlENVGdqZHEreWoY9tlzZSIg%2BxzFn%2FOR7ignrGUOTssDpAce1jd7b4F4lhX8VqyXNnjg0NkgwfrQ8%2Bi3L0IwvhjY26nrn7rQgRvfioWj3zsmlcj3Y0ryo6q0TwNEC4WwkLtbhBu1sJbkmhAb%2FEMIonm5TQ16%2FCI3s6KeLca%2BwhbGDmLxyTB33zjks37zbCd8I5WD%2Fn6O879wnjMwGO8h605fLBjrHZh8jNdxLp7iI';
const SWID = '{6E4EADDA-9517-447D-8EAD-DA9517B47DE6}';
const config = require('./config');
const SEASONID = '2020';
const {table} = require('table');
const fs = require('fs');
const { resolve } = require('path');
const BLOCKPATH = './tradeblock.json'

module.exports = (() => {
    let _ = new WeakMap();
    class FantasyFootball {
        constructor(){
            let me = {
                client : new Client({ leagueId }),
                getWeek : ( date ) => {
                    if( !date )
                        date = new Date(Date.now());
                    let prevMonthMax=[0,0];
                    let mostRec = config.weeks.findIndex((wk)=>{
                        wk = wk.split('/').map(ent=>parseInt(ent));
                        wk[0]--;
                        if( wk[0] == date.getMonth()-1 && wk[1] > prevMonthMax[1] ){ //set previous max
                            prevMonthMax=wk;
                            prevMonthMax[0]++;
                        }else if( wk[0] == date.getMonth() && wk[1] - date.getDate() <= 7 )
                            return true;
                    })
                    prevMonthMax=prevMonthMax.join('/');
                    if( mostRec == -1 )
                        mostRec = config.weeks.indexOf(prevMonthMax)
                    else if( mostRec == 0 )
                        mostRec = 1;
                    return mostRec;
                },
                getTeamIdFromIndex : (ind) => {
                    ind = Object.values(config.teamMap).findIndex(ent=>ent==ind.toString())
                    return Object.keys(config.teamMap)[ind];
                },
                loadTradeblock : () => {
                    let res = fs.readFileSync(BLOCKPATH);
                    me.block = JSON.parse(res);
                }
            }
            _.set(this,me)
            _.get(this).client.setCookies({espnS2,SWID});
        }
        get tb(){
            _.get(this).loadTradeblock();
            return _.get(this).block;
        }
        get client(){ return _.get(this).client };
        get week(){
            return _.get(this).getWeek();
        }
        getTeam( id, extras, internal, seasonId=2020, weekId=this.week ){
            return new Promise((resolve,reject) => {
                let teamID = config.teamMap[id];
                if( !teamID ) return resolve(null);
                this.client.getTeamsAtWeek({seasonId:seasonId,scoringPeriodId:weekId})
                .then((res) => {
                    let team = res.find(ent=>ent.id==teamID);
                    if( !team ) return resolve(null);
                    else{
                        if( extras.indexOf('record') !== -1 )
                            resolve(`Overall : ${team.wins}-${team.losses}-${team.ties}, Division : ${team.divisionWins}-${team.divisionLosses}-${team.divisionTies}`)
                        if( extras.indexOf('roster') !== -1 ){
                            let posMap = {};
                            team.roster.forEach(ent=>{
                                let realPos;
                                switch(ent.defaultPosition){
                                    case 'RB/WR':
                                        realPos = 'WR'; break;
                                    case 'WR/TE':
                                        realPos = 'K'; break;
                                    case 'TQB':
                                        realPos = 'QB'; break;
                                    case 'WR':
                                        realPos = 'TE'; break;
                                    default:
                                        realPos = ent.defaultPosition;
                                }
                                if( !posMap[realPos] ) 
                                    posMap[realPos] = [];
                                posMap[realPos].push(ent.fullName)
                            })
                            let str = `~~~~~ ${team.name} Roster ~~~~~\n\n`;
                            for( let pos in posMap )
                                str+=`--${pos}:\n\t\t${posMap[pos].join(',')}\n`
                            if( !internal )
                                resolve(str);
                            else resolve(posMap);
                        }
                        else{
                            if( internal ) resolve(team.name)
                            else resolve(`(${team.abbreviation}) ${team.name}`)
                        }
                    }
                })
            })
        }
        getRecap( extras=[], fullRecap=false ){
            return new Promise((resolve,reject) => {
                let YEAR,WEEK;
                extras.forEach((ent)=>{
                    let int = parseInt(ent);
                    if( !Number.isNaN(int) ){
                        if( int == 2019 || int == 2020 )
                            YEAR = int;
                        else WEEK = int;
                    }
                })
                if( YEAR == undefined ) YEAR=SEASONID;
                if( WEEK == undefined ) WEEK=this.week;
                this.client.getBoxscoreForWeek({seasonId:YEAR,matchupPeriodId:WEEK,scoringPeriodId:WEEK}).then(async (res) => {
                    let str = `~~~~~${YEAR} Week ${WEEK} Box Scores~~~~~\n`, teamNames = {},scoreTable = [];
                    for( let i=0; i < res.length; i++ ){
                        let hName = await this.getTeam(_.get(this).getTeamIdFromIndex(res[i].homeTeamId),[],true,YEAR);
                        let aName = await this.getTeam(_.get(this).getTeamIdFromIndex(res[i].awayTeamId),[],true,YEAR);
                        teamNames[res[i].homeTeamId] = hName;
                        teamNames[res[i].awayTeamId] = aName;
                        if( !fullRecap ){
                            scoreTable.push([`\n\t ${hName} : ${res[i].homeScore}\n\t${aName} : ${res[i].awayScore}\n`])
                            str+=`\n\t ${hName} : ${res[i].homeScore}\n\t${aName} : ${res[i].awayScore}\n`
                        }
                    }
                    str = str.replace("'","\'");
                    str = str.replace("’","\'");
                    resolve(str);
                })
            })
        }
        saveBlock(){
            fs.writeFileSync(BLOCKPATH,JSON.stringify(_.get(this).block))
        }
        async tradeBlock(id,args=[]){
            let res = await this._tradeBlock(id,args);
            this.saveBlock();
            return res;
        }
        async _tradeBlock( id, args ){
            _.get(this).loadTradeblock();
            let block;
            let parseBlock = () => {
                if( !_.get(this).block[id] ){
                    _.get(this).block[id] = {
                        QB : [], RB : [], WR : [], TE : [], QB : [], K : [], "D/ST":[]
                    }
                }
                return _.get(this).block[id]
            }
            let stringify = (b) => {
                let str = "";
                for( let pos in block ){
                    str += `\n${pos}\n  ${block[pos].join()}`
                }
                return str;
            }
            block = parseBlock();
            let teamName = await this.getTeam(id,[],true);
            let endStr = `=================================================`
            if( args.length == 0 )
                return `====== Current trade block for ${teamName} ======\n` + stringify() + endStr;
            else{
                let myTeam = await this.getTeam(id,['roster'],true);
                console.log('myTeam:',myTeam)
                let arrs = { add : [], del : [] }
                let prev;
                args.forEach((ent)=>{
                    if( ent == 'add' )
                        prev = 'add'
                    else if( ent == 'del' )
                        prev = 'del'
                    else if( prev ){
                        let player, no, pos;
                        no = parseInt(ent.substring(ent.length-1));
                        pos = ent.substring(0,ent.length-1);
                        console.log('prev:',prev,'ent:',ent,'pos',pos,'no',no)
                        if( !no || !pos ) return;
                        no--;
                        pos = pos.toUpperCase();
                        if( pos == 'D' || pos == 'ST' )
                            pos = 'D/ST';
                        player = myTeam[pos][no]
                        if( !player ) return;
                        let exists = block[pos].indexOf(player) !== -1;
                        if( !exists && prev == 'add' ){
                            console.log('adding:',player);
                            block[pos].push(player)
                        }else if( exists && prev == 'del') {
                            console.log('deleting:',player)
                            block[pos].splice(block[pos].indexOf(player),1)
                        }
                    }

                    
                })
            }
        }
    }
    return FantasyFootball;
})();