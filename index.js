// MQTT Switch Accessory plugin for HomeBridge

'use strict';

var Service, Characteristic;
var mqtt = require("mqtt");

function mqttdoorAccessory(log, config) {
  this.log          = log;
  this.name         = config["name"];
  this.url          = config["url"];
  this.client_Id    = 'mqttjs_' + Math.random().toString(16).substr(2, 8);
  this.options      = {
      keepalive: 10,
      clientId: this.client_Id,
      protocolId: 'MQTT',
      protocolVersion: 4,
      clean: true,
      reconnectPeriod: 1000,
      connectTimeout: 30 * 1000,
      will: {
           topic: 'WillMsg',
           payload: 'Connection Closed abnormally..!',
           qos: 0,
           retain: false
      },
      username: config["username"],
      password: config["password"],
      rejectUnauthorized: false
  };
  this.caption            = config["caption"];
  this.topics             = config["topics"];
  this.payloadname        = config["payloadname"];
  this.payloadon          = config["payloadon"];
  this.payloadoff         = config["payloadoff"];
  this.on                 = true;

  this.service = new Service.Door(this.name);
  this.service
    .getCharacteristic(Characteristic.CurrentPosition)
      .on('get', this.getStatus.bind(this));

  this.service
    .getCharacteristic(Characteristic.PositionState)
      .on('get', this.getPosition.bind(this));

  this.service
    .getCharacteristic(Characteristic.TargetPosition)
      .on('get', this.getTarget.bind(this));

  // connect to MQTT broker
  this.client = mqtt.connect(this.url, this.options);
  var that = this;
  this.client.on('error', function (err) {
      that.log('Error event on MQTT:', err);
  });

  this.client.on('message', function (topic, message) {
    //console.log(that.payloadisjson);
    if (topic == that.topics.getOn) {
        var status = JSON.parse(message);
        that.on = (status[that.payloadname] == that.payloadon ? Characteristic.CurrentDoorState.OPEN : Characteristic.CurrentDoorState.CLOSED);
        that.service.getCharacteristic(Characteristic.CurrentPosition).setValue(that.on, undefined, 'fromSetValue'); 
    }
  });

  this.client.subscribe(this.topics.getOn);
}

module.exports = function(homebridge) {
      Service = homebridge.hap.Service;
      Characteristic = homebridge.hap.Characteristic;
      homebridge.registerAccessory("homebridge-mqttdoor", "mqttdoor", mqttdoorAccessory);
}

mqttdoorAccessory.prototype.getStatus = function(callback) {
    callback(null, this.on);
}

mqttdoorAccessory.prototype.getPosition = function(callback) {
    callback(null, Characteristic.PositionState.STOPPED) ;
}

mqttdoorAccessory.prototype.getTarget = function(callback) {
    callback(null, Characteristic.TargetDoorState.CLOSED);
}

mqttdoorAccessory.prototype.getServices = function() {
  return [this.service];
}

// end