// -*- mode: js; js-indent-level:2;  -*-
/**
 * generic-sensors-adapter.js - Generic sensors adapter.
 *
 * Copyright 2018-present Samsung Electronics Co., Ltd. and other contributors
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

var GenericSensors = require('generic-sensors-lite');

let Adapter, Device, Property;
try {
  Adapter = require('../adapter');
  Device = require('../device');
  Property = require('../property');
} catch (e) {
  if (e.code !== 'MODULE_NOT_FOUND') {
    throw e;
  }

  const gwa = require('gateway-addon');
  Adapter = gwa.Adapter;
  Device = gwa.Device;
  Property = gwa.Property;
}


function on() {
  return {
    name: 'on',
    value: false,
    metadata: {
      type: 'boolean'
    }
  };
}

function level() {
  return {
    name: 'level',
    value: 0,
    metadata: {
      type: 'number',
    }
  };
}


const ambientLightSensor = {
  type: "multilevelSensor",
  sensorType: 'ambientLightSensor',
  name: 'Ambient Light Sensor',
  properties: [
    level(),
    on()
  ]
};

const temperatureSensor = {
  type: "multilevelSensor",
  sensorType: 'temperatureSensor',
  name: 'Temperature Sensor',
  properties: [
    level(),
    on()
  ]
};

const GENERICSENSORS_THINGS = [
  ambientLightSensor,
  temperatureSensor
];


class GenericSensorsProperty extends Property {
  constructor(device, name, propertyDescr) {
    super(device, name, propertyDescr);
    let self = this;
    if (name === "level") {
      var sensor = this.getSensor();
      if (sensor) {
        sensor.onreading = function() {
          self.update();
        };
      }
    }
    this.update();
  }

  getSensor() {
    var sensor = null;
    if (this.device.sensorType === "temperatureSensor") {
      sensor = this.device.sensors.temperature;
    } else  if (this.device.sensorType === "ambientLightSensor") {
      sensor = this.device.sensors.ambientLight;
    }
    return sensor;
  }

  setValue(value) {
    if (this.value === value) return;

    return new Promise((resolve, reject) => {
      if (value) {
        this.getSensor().start();
      } else {
        this.getSensor().stop();
      }
      this.setCachedValue(value);
      this.device.notifyPropertyChanged(this);
    });
  }

  update() {
    if (this.device.sensorType == "temperatureSensor") {
      this.setCachedValue(this.device.sensors.temperature.celsius);
    } else if (this.device.sensorType == "ambientLightSensor") {
      this.setCachedValue(this.device.sensors.ambientLight.illuminance);
    }
    this.device.notifyPropertyChanged(this);
  }
}

class GenericSensorsDevice extends Device {
  constructor(adapter, id, config) {
    super(adapter, id)
    this.config = config;
    this.type = config.type;
    this.name = config.name;
    this.description = "Generic Sensor";
    this.sensorType = config.sensorType;

    this.sensors = {};
    if (config.sensorType === "temperatureSensor") {
      this.sensors.temperature = new GenericSensors.Temperature({ frequency: 2 });
    } else if (config.sensorType === "ambientLightSensor") {
      this.sensors.ambientLight = new GenericSensors.AmbientLight({ frequency: 2 });
    }

    this.properties.set('level',
                        new GenericSensorsProperty(this, 'level', {type: 'number'}));
    this.properties.set('on',
                        new GenericSensorsProperty(this, 'on', {type: 'boolean'}));
    this.adapter.handleDeviceAdded(this);
  }
}

class GenericSensorsAdapter extends Adapter {
  constructor(addonManager, manifest) {
    super(addonManager, manifest.name, manifest.name);
    addonManager.addAdapter(this);
    let devices = GENERICSENSORS_THINGS;
    if (manifest.moziot.config.hasOwnProperty('generic-sensors')) {
      devices = Object.assign(devices, manifest.moziot.config.genericsensors);
    }
    for (const device in devices) {
      new GenericSensorsDevice(this, device, devices[device] );
    }
  }
}

function loadGenericSensorsAdapter(addonManager, manifest, _errorCallback) {
  new GenericSensorsAdapter(addonManager, manifest);
}

module.exports = loadGenericSensorsAdapter;
