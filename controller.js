'use strict';

const schalter = require('./schalter');
const mqttrouter = require('./mqttrouter');
const config = require('./config');


function getDateStr(datum,timestr)
{
    var dd   = datum.getDate();
    var mm   = datum.getMonth()+1; //Januar ist 0!
    var yyyy = datum.getFullYear();

    if (timestr) {
      var hm = timestr;
    } else {
      var hour = datum.getHours();
      var minu = datum.getMinutes();
      if(minu<10){ minu='0'+minu }
      var hm = hour+':'+minu;
    }
    if(mm<10)  { mm='0'+mm }
    if(dd<10)  { dd='0'+dd }
    return yyyy+'-'+mm+'-'+dd+'T'+hm;
};


function getAction(sheduler,actionDate)
{
   let action;
   var week = new Array('Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag');
   //console.log(sheduler);

   function loop(item,searchDay) {
      if (!item) {return};

      var day = week[actionDate.getDay()];
      //vorheriger Eintrag
      //console.log('2 Wochentag '+day+' searchDay '+searchDay);
      if (searchDay) {
        if (item.day) {
          if (searchDay=='') {return}
          if (searchDay.toUpperCase() != item.day.toUpperCase()) { return }
        } else {
          if (searchDay!='') {return}
        }
      };
      //console.log('weiter...')
      if (item.day) {
        if (item.day.toUpperCase() != day.toUpperCase()) {return};
      };
      var start = new Date(getDateStr(actionDate,item.start));
      var stop = new Date(getDateStr(actionDate,item.stop));
      console.log('start '+start+' stop '+stop)
      if (start && stop) {
        //gültiger Eintrag
        if (actionDate > start && actionDate<= stop ) {
          return 'ON'
        }
        return 'OFF';
      }
      return;
    };

    //Ersten gültigen Eintrag suchen ...
    var endAction;
    var searchDay;
    let i = 0;
    do {
      action=loop(sheduler[i],searchDay);
      //console.log('1 scheduler: '+i+' action '+action);
      if (action=='ON') {
        endAction=action;
        console.log('scheduler: '+JSON.stringify(sheduler[i])+' action '+action);
      }
      //bei OFF am selben WochenTag im Scheduler weitersuchen
      if (action=='OFF') {
        searchDay = '';
        if (sheduler[i].day) { searchDay = sheduler[i].day }
        endAction = undefined;
      }
      //console.log('action '+action);
      i++;
    } while (!endAction && i < sheduler.length);

    if (!endAction) {endAction='OFF'}
    return endAction;
};



function loopProzess() {
  var dd;
  var mm;
  var datum;
  var licht;
  //datum = new Date();
  //console.log('start loopProzess...');

  function doAction(action,tag) {
    var i;
    function loop(action,tag) {
      let licht = schalter.get(tag);
      if (!licht) {return};

      if ( action != licht.state ) {
        //if (config.get("debug")) { console.log('Action Licht %s '+action,tag) };
        if ( licht.connected ) {
          if (action==='ON') { mqttrouter.switchON(tag) }
          if (action==='OFF') { mqttrouter.switchOFF(tag) }
        } else {
          console.log('Licht %s ist nicht angeschlossen!',tag);
        }
      };
    };

    if (!tag) { tag=0 };
    //console.log('DoAction '+action+' von Licht '+tag);
    for (i = 1; i <= 24; i++) {
       if (i<=tag || tag===0) {
       //if (i===tag || tag===0) {
         loop(action,i);
       } else {
         loop('OFF',i);
       }
    };
  };

  var today = new Date();
  today.setTime(Date.now());

  if (config.get("test_date")!='') {
    var datum = new Date(config.get("test_date"));
    datum.setHours(today.getHours());
    datum.setMinutes(today.getMinutes());
    datum.setSeconds(today.getSeconds());
  } else {
    var datum = today;
  }
  console.log(datum);
  dd   = datum.getDate();
  mm   = datum.getMonth()+1; //Januar ist 0!

  if (mm<12 || dd > 24)  {
    doAction('OFF');
    return;
  };
  //console.log(JSON.stringify(licht));
  if (config.get("test_all_on")) {
    doAction('ON');
  } else {
    var action=getAction(config.get("sheduler"),datum);
    console.log('Tag '+dd+' Action '+action);
    doAction(action,dd);
  };
};

config.init();
mqttrouter.init(schalter);
setInterval(loopProzess, 5000);

// delete require.cache[require.resolve('config')];
