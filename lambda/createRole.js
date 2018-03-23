'use strict';
var token = "";
var userID = "";
var testRes = true;

const pg = require("pg");
const config = require('./config');

const pool = new pg.Pool({
    user: config.dbUSER,
    password: config.dbPWD,
    database: config.dbDatabase,
    host: config.dbURL,
    port: config.dbPort
});

const creatingHandlers = {

  'ConfirmCreate': function () {
    const intentObj = this.event.request.intent;
    userID = this.event.session.user.userId;
    if(intentObj.confirmationStatus !== 'CONFIRMED'){
        const speechOutput = 'Are you sure you want to setup senior account?';
        const cardTitle = 'Setup Senior Confirmation';
        const cardContnet = 'Are you sure you want to setup senior account?'
        const repromptSpeech = speechOutput;
        this.emit(':confirmIntentWithCard', speechOutput, repromptSpeech, cardTitle. cardContnet);
    } else {
        this.emit('CreateRole')
        }
    },
    'CreateRole': function () {
        var self = this;
        console.log("userID: "+ userID);
        pool.connect()
        .then(client => {
            return client.query("SELECT ccode, id_num FROM seniors ORDER BY ccode DESC")
            .then(result => {
                console.log(testRes);
                if(findID(result, userID)) {
                    self.response.speak('Senior setup has been run already on this device. The caregiver code is '+token.split('').join('. '))
                    self.emit(':responseReady')
                } else {
                    while(testRes){
                        if(findCC(result, token)){
                            console.log("was a truey");
                            token = randomInt().toString(36);  //base36 characters.
                            console.log("token: "+ token);
                        } else {                                                                             
                            return client.query("INSERT INTO seniors (id_num, timezone, ccode) VALUES ($1, $2, $3)",[userID, -8, token])
                                .then(result => {
                                    client.release();
                                    console.log("Token success: "+ token);
                                    self.response.speak('Senior setup has been completed. Please record this value. "'+token.split('').join('. ')+'", that is your caregiver code.');
                                    self.emit(':responseReady');
                                    testRes = false;
                                }).catch(err => {
                                    console.log(err.stack);
                                });
                        }
                    }
                }
            }).catch(err => {
                client.release();
                console.log(err.stack);
            });
        });
    }
};

function randomInt () {  //returns pseudo-random number between 0 and 36^6-1;
return Math.round(Math.random() * (Math.pow(36,6)-1));
}

function findID (input, userID) {
    for(var i=0; i<input.rows.length; i++){
        console.log("Row number :"+i+"is: " +input.rows[i].id_num)
        if(userID == input.rows[i].id_num){
            console.log("Found ID!");
            token = input.rows[i].ccode;
            return true;
        }
    }
}

function findCC (input, token) {
    for(var i=0; i<input.rows.length; i++){
        console.log("Row number :"+i+"is: " +input.rows[i].ccode)
        if(token == input.rows[i].ccode || token == ""){
            console.log("Found CCode!");
            return true;
        }
    }
}

module.exports = creatingHandlers;
