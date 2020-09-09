const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());
const PORT = 3000;
const IP = '71.34.241.103';
const POSTROUTE = 'https://api.groupme.com/v3/bots/post';
const {spawn} = require('child_process');
const localtunnel = require('localtunnel');
const GROUP_ID='62312892';
const ff = require('./ff');

module.exports = (() => {
    let _ = new WeakMap();
    class FFBot {
        constructor(){
            let me = {
                ffClient : new ff(),
                handleMessage : async (d) => {
                    if( d.text.indexOf('!bot') == -1 ) return;
                    let args = d.text.split('!bot')
                    args = args[1].split(' ').slice(1)
                    console.log('args received:',args)
                    switch( args[0].toLowerCase() ){
                        case 'myteam':
                            let info = await me.ffClient.getTeam(d.sender_id);
                            if( info )
                                this.message(info);
                            else this.message('Something went wrong retrieving your team. Talk to Casey to get it fixed.')
                            break;
                    }
                }
            };

            _.set(this,me);
        }

        async init(){
            app.get('/',async (req,res)=>{
                res.send('Hello World!');
                _.get(this).lastGetReqBody = req.body;
                this.message('test test')
            })
            let handleMsg = (body) => _.get(this).handleMessage(body);
            app.post('/', function (req, res) {
                let body = req.body;
                console.log('POST HEARD')
                console.log('req body:',req.body);
                if( req.body.sender_type == 'user' )
                    handleMsg(body);
                res.send('POST request to the homepage')
            })
            app.listen(PORT,() => {
                console.log(`Example app listening at http://localhost:${PORT}`)
            });
            _.get(this).tunnel = await localtunnel({port:PORT})
            console.log('tunnel.url:',_.get(this).tunnel.url)
            _.get(this).tunnel.on('close',(d)=>{
                console.log('tunnel closed::',d)
            })
            return this.setupBot( _.get(this).tunnel.url );
        }

        message( msg ){
            return new Promise((resolve,reject) => {
                let obj = { "text":msg, "bot_id":_.get(this).botID };
                let curl = spawn('curl',['-d',JSON.stringify(obj),POSTROUTE]);
                curl.on('close', (code) => {
                    console.log(`message exited with code ${code}`);
                    resolve(code);
                });
            })
        }

        setupBot( url ){
            return new Promise((resolve,reject) => {
                console.log('setting callback')
                let obj = { bot : { "name":"Fantasy Football Bot", "group_id":GROUP_ID, "callback_url":url } }
                let curl = spawn('curl',['-X','POST','-d',JSON.stringify(obj),'-H','Content-Type: application/json','https://api.groupme.com/v3/bots?token=YJ67aRUsWfGYKFLHljQCWx5awOavxZN90Apdfvay'])
                curl.stdout.on('data',(d)=>{
                    try{
                        let res = JSON.parse(d.toString());
                        _.get(this).botID = res.response.bot.bot_id;
                        console.log('BOTID:',_.get(this).botID)
                    }catch(err){}
                })
                curl.on('close', (code) => {
                    console.log(`setup closed with ${code}`);
                    resolve(code);
                });
            })
        }
        clearBots(){
            //implement this to clear previous bots, when deploying a new one
        }
    }
    return FFBot;
})();