
var staties = [];

const schalter = {
  init(maxi){
  for(var i = 1; i < maxi+1;i++){
    staties.push({switch: 's'+i, state: '' ,connected: false});
   };
  },
  setState(pos,state) {
    let _switch = this.get(pos);
    this.replace(pos,state,_switch.connected);
  },
  setConnected(pos,connected) {
    let _switch = this.get(pos);
    this.replace(pos,_switch.state,connected);
  },
  replace(pos,state,connected) {
    console.log('Set state: '+state);
    staties.splice(pos-1,1, {switch: 's'+pos, state, connected });
  },
  get(pos) {
    return staties[pos-1];
  }
};

module.exports = schalter;
