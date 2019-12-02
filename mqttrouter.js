// controller.js
'use strict'

const mqtt = require('mqtt');
const config = require('./config');
config.init();
//console.log(config.get("mqtt_ip"));
const client = mqtt.connect('mqtt://'+config.get("mqtt_ip"));

var _topic = 'advent';
//var lights;

const mqttRouter = {
    lights : undefined,
    connected : false,
    init(lichter) {
      this.lights = lichter;
      this.lights.init(24);

      client.on('connect', () => {
        console.log('mqtt connected');
        this.connected = true;
        for(var i = 1; i < 25;i++){
          client.subscribe(_topic+'/s'+i+'/tele/LWT');  /* Online/offline */
          /*client.subscribe(_topic+'/s1/tele/STATE');*/ /* ON/OFF */
          client.subscribe(_topic+'/s'+i+'/stat/POWER'); /* ON/OFF */
        };
      });

      client.on('disconnect', () => {
        console.log('mqtt disconnected');
        this.connected = false;
      });

      client.on('message', (topic, message) => {
         console.log('Event mqqt message '+message);
         if (topic.indexOf(_topic) === 0) {
           let pos=topic.indexOf('/',_topic.length+2);
           let light=topic.slice(_topic.length+2, pos);
           switch (topic) {
              case _topic+'/s'+light+'/tele/LWT':
                return this.handleConnected(light,message)
              case _topic+'/s'+light+'/stat/POWER':
                return this.handleState(light,message)
           }
         }
         console.log('No handler for topic %s', topic)
     });
  },

  handleConnected (light,message) {
    console.log(_topic+' connected status %s '+light, message)
    let connected = (message.toString() === 'online');
    this.lights.setConnected(light,connected);
  },

  handleState (light,message) {
    this.lights.setState(light,message);
    console.log('Light state update to %s', message)
  },

  switchON (light) {
    // can only open door if we're connected to mqtt and door isn't already open
    let _switch = this.lights.get(light);
    if (_switch.connected && _switch.state !== 'ON') {
    // Ask the door to open
      //lights.setState(light,'ON');
      client.publish(_topic+'/s'+light+'/cmnd/POWER', 'ON')
    }
  },

  switchOFF (light) {
    // can only close door if we're connected to mqtt and door isn't already closed
    let _switch = this.lights.get(light);
    if (_switch.connected && _switch.state !== 'OFF') {
      // Ask the door to close
      //lights.setState(light,'OFF');
      client.publish(_topic+'/s'+light+'/cmnd/POWER', 'OFF')
    }
  },
};

module.exports = mqttRouter;
