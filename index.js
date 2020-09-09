const {Client} = require('espn-fantasy-football-api/node');
const leagueId = 23001979;
const espnS2 = 'AEC7m1w8fL71ahh5zXZ14yIcDmSTiWUAX3pvJc3mXph9YWABlENVGdqZHEreWoY9tlzZSIg%2BxzFn%2FOR7ignrGUOTssDpAce1jd7b4F4lhX8VqyXNnjg0NkgwfrQ8%2Bi3L0IwvhjY26nrn7rQgRvfioWj3zsmlcj3Y0ryo6q0TwNEC4WwkLtbhBu1sJbkmhAb%2FEMIonm5TQ16%2FCI3s6KeLca%2BwhbGDmLxyTB33zjks37zbCd8I5WD%2Fn6O879wnjMwGO8h605fLBjrHZh8jNdxLp7iI';
const SWID = '{6E4EADDA-9517-447D-8EAD-DA9517B47DE6}';

module.exports = (() => {
    let _ = new WeakMap();
    class FantasyFootball {
        constructor(){
            let me = {
                client : new Client({ leagueId })
            }
            _.set(this,me)
            _.get(this).client.setCookies({espnS2,SWID});
        }
        get client(){ return _.get(this).client };
    }
    return FantasyFootball;
})();