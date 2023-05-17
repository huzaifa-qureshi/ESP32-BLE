import { Component } from '@angular/core';
import {BleClient,
        ScanResult,
        numberToUUID, 
        BleDevice,
        dataViewToText,} from '@capacitor-community/bluetooth-le';
import { ToastController } from '@ionic/angular';
import { Geolocation } from '@capacitor/geolocation';

const CONDUCTIVITY_UUID = "09870d43-b577-41dd-a81c-9a7b12ead6e6"; 
const TEMPERATURE_UUID = "708041fb-ae8b-4372-bcf5-5377f4c1455d";
const MOISTURE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";

const CONDUCTIVITY_CHARATERISTIC_UUID  = "a9fe258a-f732-485b-8e1b-cf32f334a1ef";
const TEMPERATURE_CHARATERISTIC_UUID = "acecfb9b-e518-4fa5-bc9a-3ac0ddd120cc";
const MOISTURE_CHARATERISTIC_UUID  = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  moisture: number = 0;
  temperature: number = 0;
  conductivity: number = 0;
  longitude: number = 0;
  latitude: number = 0;
  time: string = "";
  connected: boolean = false;
  scanned: boolean = false;
  connectedDevice!: BleDevice;

  bluetoothScanResults: ScanResult[] = [];
  bluetoothIsScanning = false;
  bluetoothConnectedDevice?: ScanResult;


  constructor(public toastController: ToastController) {

  }
  Scan(){
    this.scanForBluetoothDevices();
    this.scanned = true;
  }

  async scanForBluetoothDevices() {
    try {
      await BleClient.initialize();
      this.bluetoothScanResults = [];
      this.bluetoothIsScanning = true;

      await BleClient.requestLEScan(
        { services: [] },
        this.onBluetoothDeviceFound.bind(this)
      );
      
      setTimeout(async () => {
        await BleClient.stopLEScan();
        this.bluetoothIsScanning = false;
        console.log('stopped scanning');
      }, 12000); 
      } catch (error) {
      this.bluetoothIsScanning = false;
      console.error('scanForBluetoothDevices', error);
      }
    }
    
    onBluetoothDeviceFound(result: any) {
      console.log('received new scan result', result);
      this.bluetoothScanResults.push(result);
    }

    async connectToBluetoothDevice(scanResult: ScanResult) {
      const device = scanResult.device;
      this.connectedDevice = scanResult.device
      
      try {
        await BleClient.connect(
          device.deviceId,
          this.onBluetooDeviceDisconnected.bind(this)
        );
        
        this.bluetoothConnectedDevice = scanResult;
        this.connected = true;
        // await this.triggerBluetoothPairing(device);
        await BleClient.getServices(device.deviceId);
          
        const deviceName = device.name ?? device.deviceId;
        this.presentToast(`connected to device ${deviceName}`);
        console.log("connected to" , deviceName)

        await this.getData(device)

      } catch (error) {
        console.error('connectToDevice', error);
        this.presentToast(JSON.stringify(error));
        console.log(JSON.stringify(error))
      }
    }

    async disconnectFromBluetoothDevice(scanResult: ScanResult) {
      const device = scanResult.device;
      this.connected = false;
      try {
        await BleClient.disconnect(scanResult.device.deviceId);
        const deviceName = device.name ?? device.deviceId;
        alert(`disconnected from device ${deviceName}`);
      } catch (error) {
        console.error('disconnectFromDevice', error);
      }
    }
    
    onBluetooDeviceDisconnected(disconnectedDeviceId: string) {
      alert(`Diconnected ${disconnectedDeviceId}`);
      this.bluetoothConnectedDevice = undefined;
      this.connected = false;
    }


    async getData(device: BleDevice){
      try{
        await this.getLocation();
        
        await BleClient.startNotifications(
          device.deviceId,
          MOISTURE_UUID, 
          MOISTURE_CHARATERISTIC_UUID,
          (moisturevalue) => {
            console.log(dataViewToText(moisturevalue));
            this.moisture = Number(dataViewToText(moisturevalue));
            console.log(this.moisture)  
          }
        );

        await BleClient.startNotifications(
          device.deviceId,
          CONDUCTIVITY_UUID, 
          CONDUCTIVITY_CHARATERISTIC_UUID,
          (conductivityvalue) => {
            console.log(dataViewToText(conductivityvalue));
            this.conductivity = Number(dataViewToText(conductivityvalue));
            console.log(this.conductivity)  
          }
        );

        await BleClient.startNotifications(
          device.deviceId,
          TEMPERATURE_UUID, 
          TEMPERATURE_CHARATERISTIC_UUID,
          (temperaturevalue) => {
            console.log(dataViewToText(temperaturevalue));
            this.temperature = Number(dataViewToText(temperaturevalue));
            console.log(this.temperature)  
          }
        );
        
        await this.getTime();

      }catch (error){
        console.error("error in getting data", error);
      }
    }

    getLocation = async () => {
      const coordinates = await Geolocation.getCurrentPosition();
      console.log('Current position:', coordinates);
      this.latitude = coordinates.coords.latitude;
      this.longitude = coordinates.coords.longitude;
    };
    
    async presentToast(message: string) {
      const toast = await this.toastController.create({
        message,
        duration: 2000,
      });
      toast.present();
    }

    getTime(){
      this.time = new Date().toLocaleTimeString();
    }
}

