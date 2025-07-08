const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());
const PORT = 3000;
const POSTROUTE = 'https://api.groupme.com/v3/bots/post';
const {spawn} = require('child_process');
const localtunnel = require('localtunnel');
const cron = require('node-cron');
const KEVIN = '30664125';
const CASEY = '32215382';
const NICK = '30790872';
const GROUP_ID='62312892'; //this is the test channel
//const GROUP_ID='51790623'; //this is the real channel
const ff = require('./ff');
const CMDOBJ = {
    '!myteam' : {
        help : ``
    },
    '!recap' : {
        help : ``
    },
    '!help':{help:{}},
    '!tradeblock':{}
}
const help = `
Welcome to the y3ez Fantasy Football Bot. Keep in mind this is a work in progress, and more features are still coming\n
\nCommands : 
\n"!myteam" - Lists your team name
\n"!myteam roster" - Lists your current roster
\n"!myteam record" - Lists your current record
\n
\n"!recap" - Shows the most recent week's box score from the current season
\n"!recap 2" - Shows Week 2's box scores from this season
\n"!recap 2019 10" - Shows last year week 10's box scores (Just because I fucking can)
\n
\nPLEASE NOTE: This bot currently lives on my PC, so if/when my PC is turned off, it will not be responsive (especially overnight). Later this week, I'll move it to a more permanent location, and eventually it'll be up consistently.
\nMore features to come!
`
const CMDS = Object.keys(CMDOBJ);
const TOKEN = process.env.BOT_TOKEN;
//"thisWeek","record",""

module.exports = (() => {
    let _ = new WeakMap();
    class FFBot {
        constructor(){
            let me = {
                ffClient : new ff(),
                handleMessage : async (d) => {
                    let searchFor = (str) => {
                        if( d.text.indexOf(str) == -1 ) return false;
                        let args = d.text.split(" ");
                        args = args.slice(1);
                        return args;
                    }
                    CMDS.forEach(async (ent)=>{
                        let searchRes = searchFor(ent);
                        if( searchRes ){
                            let msg;
                            switch(ent){
                                case '!myteam' : 
                                    msg = await me.ffClient.getTeam(d.sender_id,searchRes);
                                    this.message(msg);
                                    break;
                                case '!recap':
                                    await this.message('Working on getting your recap...')
                                    msg = await me.ffClient.getRecap(searchRes)
                                    //this.message('hmm...')
                                    this.message(msg);
                                    break;
                                case '!help':
                                    this.message(help);
                                    break;
                                case '!tradeblock':
                                    msg = await me.ffClient.tradeBlock(d.sender_id,searchRes);
                                    this.message(msg);
                                    break;
                            }
                        }
                    });
                }
            };

            _.set(this,me);
        }

        async init(){
            app.get('/',async (req,res)=>{
                res.send('Hello World!');
            })
            let handleMsg = (body) => _.get(this).handleMessage(body);
            app.post('/', function (req, res) {
                let body = req.body;
                console.log()
                console.log('POST BODY:',req.body);
                console.log();
                if( req.body.sender_type == 'user' )
                    handleMsg(body);
                res.send('POST request to the homepage')
            })
            app.listen(PORT,() => {
                console.log(`Example app listening at http://localhost:${PORT}`)
            });
            _.get(this).tunnel = await localtunnel({port:PORT})
            _.get(this).tunnel.on('close',(d)=>{
                console.log('tunnel closed::',d)
            })
            await this.clearBots();
            return this.setupBot( _.get(this).tunnel.url );
        }
        async schedule( which ){
            switch(which){
                case 'remindKevin':
                    cron.schedule('30 17 * * 4',()=>{
                        this.message("It's Thursday evening, which means it's time for @Kevin Miller's weekly reminder to set your lineup!!!", [KEVIN])
                    });
                    break;
            }
        }
        remindKevin(){
            return this.schedule('remindKevin')
        }
        message( msg, mentions=[] ){
            return new Promise((resolve,reject) => {
                let obj = { "text":msg, "bot_id":_.get(this).botID };
                if( mentions.length > 0 ) obj.attachments = [{
                    type:'mentions',user_ids:mentions
                }]
                let curl = spawn('curl',['-d',JSON.stringify(obj),POSTROUTE]);
                curl.on('close', (code) => {
                    resolve(code);
                });
            })
        }

        setupBot( url ){
            return new Promise((resolve,reject) => {
                let obj = { bot : { "name":"y3ez Fantasy Football", "group_id":GROUP_ID, "callback_url":url } }
                let curl = spawn('curl',['-X','POST','-d',JSON.stringify(obj),'-H','Content-Type: application/json',`https://api.groupme.com/v3/bots?token=${TOKEN}`])
                curl.stdout.on('data',(d)=>{
                    try{
                        let res = JSON.parse(d.toString());
                        _.get(this).botID = res.response.bot.bot_id;
                    }catch(err){}
                })
                curl.on('close', (code) => {
                    this.remindKevin().then(() => resolve(code));
                });
            })
        }
        clearBots(){
            //implement this to clear previous bots, when deploying a new one
            return new Promise((resolve,reject)=> {
                let delBot = ( bot_id ) => new Promise((r)=>{
                    let obj = { bot_id }
                    let proc = spawn('curl',['-d',JSON.stringify(obj),'-H','Content-Type: application/json',`https://api.groupme.com/v3/bots/destroy?token=${TOKEN}`]);
                    proc.on('close',(code)=>{
                        r(code)
                    })
                })
                let curl = spawn('curl',[`https://api.groupme.com/v3/bots?token=${TOKEN}`])
                curl.stdout.on('data',(d)=>{
                    try{
                        let delArr = [];
                        let res = JSON.parse(d.toString());
                        let bots = res.response;
                        bots.forEach((bot) => {
                            if( bot.group_id==GROUP_ID )
                                delArr.push( delBot(bot.bot_id) )
                        })
                        Promise.all(delArr).then(()=>resolve())
                    }catch(err){}
                })
            })
        }
    }
    return FFBot;
})();