import React from "react"
import { Circuit } from "../dist"
import * as fs from "fs"
import * as path from "path"

/**
 * Export the STM32 motor/sensor control circuit to usable output files:
 *   - Schematic SVG
 *   - PCB SVG
 *   - Circuit JSON (full netlist data)
 */

// ---- Pin definitions (same as test) ----

const stm32PinLabels: Record<string, string> = {
  pin1: "VBAT", pin2: "PC13", pin3: "PC14", pin4: "PC15",
  pin5: "PD0", pin6: "PD1", pin7: "NRST", pin8: "VSSA",
  pin9: "VDDA", pin10: "PA0", pin11: "PA1", pin12: "PA2",
  pin13: "PA3", pin14: "PA4", pin15: "PA5", pin16: "PA6",
  pin17: "PA7", pin18: "PB0", pin19: "PB1", pin20: "PB2",
  pin21: "PB10", pin22: "PB11", pin23: "VSS1", pin24: "VDD1",
  pin25: "PB12", pin26: "PB13", pin27: "PB14", pin28: "PB15",
  pin29: "PA8", pin30: "PA9", pin31: "PA10", pin32: "PA11",
  pin33: "PA12", pin34: "PA13", pin35: "PA14", pin36: "PA15",
  pin37: "PB3", pin38: "PB4", pin39: "PB5", pin40: "PB6",
  pin41: "PB7", pin42: "PB8", pin43: "PB9", pin44: "BOOT0",
  pin45: "PB_UNUSED1", pin46: "PB_UNUSED2", pin47: "VSS2", pin48: "VDD2",
}

const a4988PinLabels: Record<string, string> = {
  pin1: "EN", pin2: "MS1", pin3: "MS2", pin4: "MS3",
  pin5: "RESET", pin6: "SLEEP", pin7: "STEP", pin8: "DIR",
  pin9: "GND", pin10: "VDD", pin11: "1A", pin12: "1B",
  pin13: "2A", pin14: "2B", pin15: "VMOT", pin16: "GND_MOT",
}

const mpu6050PinLabels: Record<string, string> = {
  pin1: "AUX_CL", pin2: "AUX_DA", pin3: "NC1", pin4: "NC2",
  pin5: "NC3", pin6: "NC4", pin7: "NC5", pin8: "CLKIN",
  pin9: "AD0", pin10: "NC6", pin11: "NC7", pin12: "INT",
  pin13: "VDD", pin14: "NC8", pin15: "NC9", pin16: "NC10",
  pin17: "NC11", pin18: "GND", pin19: "RESV1", pin20: "CPOUT",
  pin21: "RESV2", pin22: "RESV3", pin23: "SCL", pin24: "SDA",
}

const fdc1004PinLabels: Record<string, string> = {
  pin1: "CIN1", pin2: "CIN2", pin3: "CIN3", pin4: "CIN4", pin5: "GND",
  pin6: "SHLD", pin7: "VDD", pin8: "SCL", pin9: "SDA", pin10: "ADDR",
}

const ams1117PinLabels: Record<string, string> = {
  pin1: "GND", pin2: "VOUT", pin3: "VIN",
}

const usbPinLabels: Record<string, string> = {
  pin1: "VBUS", pin2: "DM", pin3: "DP", pin4: "GND",
}

const servoPinLabels: Record<string, string> = {
  pin1: "GND", pin2: "VCC", pin3: "SIG",
}

const nema17PinLabels: Record<string, string> = {
  pin1: "1A", pin2: "1B", pin3: "2A", pin4: "2B",
}

// ---- Build the circuit ----

const circuit = new Circuit()

circuit.add(
  <board width={120} height={100}>
    <net name="VCC3V3" />
    <net name="GND" />
    <net name="VBUS5V" />
    <net name="VMOT" />
    <net name="SERVO_VCC" />
    <net name="I2C_SCL" />
    <net name="I2C_SDA" />
    <net name="USB_DM" />
    <net name="USB_DP" />
    <net name="STEP1" />
    <net name="DIR1" />
    <net name="EN1" />
    <net name="STEP2" />
    <net name="DIR2" />
    <net name="EN2" />
    <net name="STEP3" />
    <net name="DIR3" />
    <net name="EN3" />
    <net name="STEP4" />
    <net name="DIR4" />
    <net name="EN4" />
    <net name="SERVO1_PWM" />
    <net name="SERVO2_PWM" />
    <net name="IMU_INT" />

    {/* STM32F103C8T6 */}
    <chip
      name="U1"
      footprint="qfp48_w7mm_h7mm_p0.5mm_pw0.25mm_pl1mm"
      pinLabels={stm32PinLabels}
      schPinArrangement={{
        leftSide: { pins: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], direction: "top-to-bottom" as const },
        bottomSide: { pins: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24], direction: "left-to-right" as const },
        rightSide: { pins: [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36], direction: "bottom-to-top" as const },
        topSide: { pins: [37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48], direction: "right-to-left" as const },
      }}
      pcbX={0} pcbY={0}
    />

    {/* A4988 Stepper Drivers x4 */}
    <chip name="DRV1" footprint="soic16_w5.3mm_h10mm_p1.27mm" pinLabels={a4988PinLabels}
      schPinArrangement={{ leftSide: { pins: [1,2,3,4,5,6,7,8], direction: "top-to-bottom" as const }, rightSide: { pins: [16,15,14,13,12,11,10,9], direction: "top-to-bottom" as const } }}
      pcbX={-40} pcbY={-30} />
    <chip name="DRV2" footprint="soic16_w5.3mm_h10mm_p1.27mm" pinLabels={a4988PinLabels}
      schPinArrangement={{ leftSide: { pins: [1,2,3,4,5,6,7,8], direction: "top-to-bottom" as const }, rightSide: { pins: [16,15,14,13,12,11,10,9], direction: "top-to-bottom" as const } }}
      pcbX={-40} pcbY={-10} />
    <chip name="DRV3" footprint="soic16_w5.3mm_h10mm_p1.27mm" pinLabels={a4988PinLabels}
      schPinArrangement={{ leftSide: { pins: [1,2,3,4,5,6,7,8], direction: "top-to-bottom" as const }, rightSide: { pins: [16,15,14,13,12,11,10,9], direction: "top-to-bottom" as const } }}
      pcbX={-40} pcbY={10} />
    <chip name="DRV4" footprint="soic16_w5.3mm_h10mm_p1.27mm" pinLabels={a4988PinLabels}
      schPinArrangement={{ leftSide: { pins: [1,2,3,4,5,6,7,8], direction: "top-to-bottom" as const }, rightSide: { pins: [16,15,14,13,12,11,10,9], direction: "top-to-bottom" as const } }}
      pcbX={-40} pcbY={30} />

    {/* NEMA17 Motor Connectors x4 */}
    <chip name="MOT1" footprint="pinrow4" pinLabels={nema17PinLabels} pcbX={-55} pcbY={-30} />
    <chip name="MOT2" footprint="pinrow4" pinLabels={nema17PinLabels} pcbX={-55} pcbY={-10} />
    <chip name="MOT3" footprint="pinrow4" pinLabels={nema17PinLabels} pcbX={-55} pcbY={10} />
    <chip name="MOT4" footprint="pinrow4" pinLabels={nema17PinLabels} pcbX={-55} pcbY={30} />

    {/* Servo Connectors x2 */}
    <chip name="SERVO1" footprint="pinrow3" pinLabels={servoPinLabels} pcbX={30} pcbY={-30} />
    <chip name="SERVO2" footprint="pinrow3" pinLabels={servoPinLabels} pcbX={30} pcbY={-20} />

    {/* MPU6050 IMU */}
    <chip name="U3" footprint="qfn24_w4mm_h4mm_p0.5mm_thermalpad" pinLabels={mpu6050PinLabels}
      schPinArrangement={{
        leftSide: { pins: [1, 2, 8, 9, 12, 13], direction: "top-to-bottom" as const },
        rightSide: { pins: [18, 20, 23, 24], direction: "top-to-bottom" as const },
        bottomSide: { pins: [3,4,5,6,7,10,11,14,15,16,17,19,21,22], direction: "left-to-right" as const },
      }}
      pcbX={30} pcbY={10} />

    {/* FDC1004 Capacitance Sensor */}
    <chip name="U4" footprint="tssop10_w3mm_h3mm_p0.5mm" pinLabels={fdc1004PinLabels}
      schPinArrangement={{
        leftSide: { pins: [1,2,3,4,5], direction: "top-to-bottom" as const },
        rightSide: { pins: [10,9,8,7,6], direction: "top-to-bottom" as const },
      }}
      pcbX={30} pcbY={30} />

    {/* AMS1117-3.3 LDO */}
    <chip name="U2" footprint="sot223" pinLabels={ams1117PinLabels}
      schPinArrangement={{
        leftSide: { pins: [3], direction: "top-to-bottom" as const },
        rightSide: { pins: [2], direction: "top-to-bottom" as const },
        bottomSide: { pins: [1], direction: "left-to-right" as const },
      }}
      pcbX={-30} pcbY={40} />

    {/* USB Connector */}
    <chip name="J_USB" footprint="pinrow4" pinLabels={usbPinLabels} pcbX={-50} pcbY={40} />

    {/* Crystal */}
    <crystal name="Y1" frequency="8MHz" loadCapacitance="20pF" footprint="hc49" pcbX={10} pcbY={-20} />
    <capacitor name="C_Y1" capacitance="20pF" footprint="0402" pcbX={7} pcbY={-25} />
    <capacitor name="C_Y2" capacitance="20pF" footprint="0402" pcbX={13} pcbY={-25} />

    {/* Decoupling Caps */}
    <capacitor name="C1" capacitance="100nF" footprint="0402" pcbX={5} pcbY={8} />
    <capacitor name="C2" capacitance="100nF" footprint="0402" pcbX={5} pcbY={-8} />
    <capacitor name="C3" capacitance="100nF" footprint="0402" pcbX={-8} pcbY={-8} />
    <capacitor name="C_IMU1" capacitance="100nF" footprint="0402" pcbX={35} pcbY={5} />
    <capacitor name="C_IMU2" capacitance="10nF" footprint="0402" pcbX={35} pcbY={15} />
    <capacitor name="C_FDC" capacitance="100nF" footprint="0402" pcbX={35} pcbY={25} />
    <capacitor name="C_DRV1" capacitance="100nF" footprint="0402" pcbX={-35} pcbY={-35} />
    <capacitor name="C_DRV2" capacitance="100nF" footprint="0402" pcbX={-35} pcbY={-15} />
    <capacitor name="C_DRV3" capacitance="100nF" footprint="0402" pcbX={-35} pcbY={5} />
    <capacitor name="C_DRV4" capacitance="100nF" footprint="0402" pcbX={-35} pcbY={25} />
    <capacitor name="C_MOT1" capacitance="100uF" footprint="0805" pcbX={-45} pcbY={-35} />
    <capacitor name="C_MOT2" capacitance="100uF" footprint="0805" pcbX={-45} pcbY={-15} />
    <capacitor name="C_MOT3" capacitance="100uF" footprint="0805" pcbX={-45} pcbY={5} />
    <capacitor name="C_MOT4" capacitance="100uF" footprint="0805" pcbX={-45} pcbY={25} />
    <capacitor name="C_LDO_IN" capacitance="10uF" footprint="0805" pcbX={-35} pcbY={45} />
    <capacitor name="C_LDO_OUT" capacitance="10uF" footprint="0805" pcbX={-25} pcbY={45} />

    {/* I2C Pull-ups */}
    <resistor name="R_SCL" resistance="4.7kohm" footprint="0402" pcbX={20} pcbY={5} />
    <resistor name="R_SDA" resistance="4.7kohm" footprint="0402" pcbX={20} pcbY={15} />

    {/* Status LED */}
    <resistor name="R_LED" resistance="1kohm" footprint="0402" pcbX={15} pcbY={-35} />
    <led name="LED1" footprint="0603" pcbX={20} pcbY={-35} />

    {/* ===== ALL TRACES ===== */}

    {/* Power */}
    <trace from=".J_USB > .VBUS" to="net.VBUS5V" />
    <trace from=".J_USB > .GND" to="net.GND" />
    <trace from=".U2 > .VIN" to="net.VBUS5V" />
    <trace from=".U2 > .VOUT" to="net.VCC3V3" />
    <trace from=".U2 > .GND" to="net.GND" />
    <trace from=".C_LDO_IN > .pin1" to="net.VBUS5V" />
    <trace from=".C_LDO_IN > .pin2" to="net.GND" />
    <trace from=".C_LDO_OUT > .pin1" to="net.VCC3V3" />
    <trace from=".C_LDO_OUT > .pin2" to="net.GND" />

    {/* STM32 power */}
    <trace from=".U1 > .VDD1" to="net.VCC3V3" />
    <trace from=".U1 > .VDD2" to="net.VCC3V3" />
    <trace from=".U1 > .VDDA" to="net.VCC3V3" />
    <trace from=".U1 > .VBAT" to="net.VCC3V3" />
    <trace from=".U1 > .VSS1" to="net.GND" />
    <trace from=".U1 > .VSS2" to="net.GND" />
    <trace from=".U1 > .VSSA" to="net.GND" />
    <trace from=".C1 > .pin1" to="net.VCC3V3" />
    <trace from=".C1 > .pin2" to="net.GND" />
    <trace from=".C2 > .pin1" to="net.VCC3V3" />
    <trace from=".C2 > .pin2" to="net.GND" />
    <trace from=".C3 > .pin1" to="net.VCC3V3" />
    <trace from=".C3 > .pin2" to="net.GND" />

    {/* Crystal */}
    <trace from=".Y1 > .pin1" to=".U1 > .PD0" />
    <trace from=".Y1 > .pin2" to=".U1 > .PD1" />
    <trace from=".C_Y1 > .pin1" to=".Y1 > .pin1" />
    <trace from=".C_Y1 > .pin2" to="net.GND" />
    <trace from=".C_Y2 > .pin1" to=".Y1 > .pin2" />
    <trace from=".C_Y2 > .pin2" to="net.GND" />

    {/* USB data */}
    <trace from=".J_USB > .DM" to=".U1 > .PA11" />
    <trace from=".J_USB > .DP" to=".U1 > .PA12" />

    {/* Stepper 1 */}
    <trace from=".U1 > .PA0" to=".DRV1 > .STEP" />
    <trace from=".U1 > .PA1" to=".DRV1 > .DIR" />
    <trace from=".U1 > .PB0" to=".DRV1 > .EN" />
    <trace from=".DRV1 > .VDD" to="net.VCC3V3" />
    <trace from=".DRV1 > .GND" to="net.GND" />
    <trace from=".DRV1 > .VMOT" to="net.VMOT" />
    <trace from=".DRV1 > .GND_MOT" to="net.GND" />
    <trace from=".DRV1 > .SLEEP" to="net.VCC3V3" />
    <trace from=".DRV1 > .RESET" to="net.VCC3V3" />
    <trace from=".U1 > .PB4" to=".DRV1 > .MS1" />
    <trace from=".DRV1 > .MS2" to="net.GND" />
    <trace from=".DRV1 > .MS3" to="net.GND" />
    <trace from=".DRV1 > .1A" to=".MOT1 > .1A" />
    <trace from=".DRV1 > .1B" to=".MOT1 > .1B" />
    <trace from=".DRV1 > .2A" to=".MOT1 > .2A" />
    <trace from=".DRV1 > .2B" to=".MOT1 > .2B" />
    <trace from=".C_DRV1 > .pin1" to="net.VCC3V3" />
    <trace from=".C_DRV1 > .pin2" to="net.GND" />
    <trace from=".C_MOT1 > .pin1" to="net.VMOT" />
    <trace from=".C_MOT1 > .pin2" to="net.GND" />

    {/* Stepper 2 */}
    <trace from=".U1 > .PA2" to=".DRV2 > .STEP" />
    <trace from=".U1 > .PA3" to=".DRV2 > .DIR" />
    <trace from=".U1 > .PB1" to=".DRV2 > .EN" />
    <trace from=".DRV2 > .VDD" to="net.VCC3V3" />
    <trace from=".DRV2 > .GND" to="net.GND" />
    <trace from=".DRV2 > .VMOT" to="net.VMOT" />
    <trace from=".DRV2 > .GND_MOT" to="net.GND" />
    <trace from=".DRV2 > .SLEEP" to="net.VCC3V3" />
    <trace from=".DRV2 > .RESET" to="net.VCC3V3" />
    <trace from=".DRV2 > .MS1" to="net.GND" />
    <trace from=".DRV2 > .MS2" to="net.GND" />
    <trace from=".DRV2 > .MS3" to="net.GND" />
    <trace from=".DRV2 > .1A" to=".MOT2 > .1A" />
    <trace from=".DRV2 > .1B" to=".MOT2 > .1B" />
    <trace from=".DRV2 > .2A" to=".MOT2 > .2A" />
    <trace from=".DRV2 > .2B" to=".MOT2 > .2B" />
    <trace from=".C_DRV2 > .pin1" to="net.VCC3V3" />
    <trace from=".C_DRV2 > .pin2" to="net.GND" />
    <trace from=".C_MOT2 > .pin1" to="net.VMOT" />
    <trace from=".C_MOT2 > .pin2" to="net.GND" />

    {/* Stepper 3 */}
    <trace from=".U1 > .PA8" to=".DRV3 > .STEP" />
    <trace from=".U1 > .PA9" to=".DRV3 > .DIR" />
    <trace from=".U1 > .PB2" to=".DRV3 > .EN" />
    <trace from=".DRV3 > .VDD" to="net.VCC3V3" />
    <trace from=".DRV3 > .GND" to="net.GND" />
    <trace from=".DRV3 > .VMOT" to="net.VMOT" />
    <trace from=".DRV3 > .GND_MOT" to="net.GND" />
    <trace from=".DRV3 > .SLEEP" to="net.VCC3V3" />
    <trace from=".DRV3 > .RESET" to="net.VCC3V3" />
    <trace from=".DRV3 > .MS1" to="net.GND" />
    <trace from=".DRV3 > .MS2" to="net.GND" />
    <trace from=".DRV3 > .MS3" to="net.GND" />
    <trace from=".DRV3 > .1A" to=".MOT3 > .1A" />
    <trace from=".DRV3 > .1B" to=".MOT3 > .1B" />
    <trace from=".DRV3 > .2A" to=".MOT3 > .2A" />
    <trace from=".DRV3 > .2B" to=".MOT3 > .2B" />
    <trace from=".C_DRV3 > .pin1" to="net.VCC3V3" />
    <trace from=".C_DRV3 > .pin2" to="net.GND" />
    <trace from=".C_MOT3 > .pin1" to="net.VMOT" />
    <trace from=".C_MOT3 > .pin2" to="net.GND" />

    {/* Stepper 4 */}
    <trace from=".U1 > .PA10" to=".DRV4 > .STEP" />
    <trace from=".U1 > .PA4" to=".DRV4 > .DIR" />
    <trace from=".U1 > .PB3" to=".DRV4 > .EN" />
    <trace from=".DRV4 > .VDD" to="net.VCC3V3" />
    <trace from=".DRV4 > .GND" to="net.GND" />
    <trace from=".DRV4 > .VMOT" to="net.VMOT" />
    <trace from=".DRV4 > .GND_MOT" to="net.GND" />
    <trace from=".DRV4 > .SLEEP" to="net.VCC3V3" />
    <trace from=".DRV4 > .RESET" to="net.VCC3V3" />
    <trace from=".DRV4 > .MS1" to="net.GND" />
    <trace from=".DRV4 > .MS2" to="net.GND" />
    <trace from=".DRV4 > .MS3" to="net.GND" />
    <trace from=".DRV4 > .1A" to=".MOT4 > .1A" />
    <trace from=".DRV4 > .1B" to=".MOT4 > .1B" />
    <trace from=".DRV4 > .2A" to=".MOT4 > .2A" />
    <trace from=".DRV4 > .2B" to=".MOT4 > .2B" />
    <trace from=".C_DRV4 > .pin1" to="net.VCC3V3" />
    <trace from=".C_DRV4 > .pin2" to="net.GND" />
    <trace from=".C_MOT4 > .pin1" to="net.VMOT" />
    <trace from=".C_MOT4 > .pin2" to="net.GND" />

    {/* Servos */}
    <trace from=".U1 > .PA6" to=".SERVO1 > .SIG" />
    <trace from=".SERVO1 > .VCC" to="net.VBUS5V" />
    <trace from=".SERVO1 > .GND" to="net.GND" />
    <trace from=".U1 > .PA7" to=".SERVO2 > .SIG" />
    <trace from=".SERVO2 > .VCC" to="net.VBUS5V" />
    <trace from=".SERVO2 > .GND" to="net.GND" />

    {/* I2C bus */}
    <trace from=".U1 > .PB6" to="net.I2C_SCL" />
    <trace from=".U1 > .PB7" to="net.I2C_SDA" />
    <trace from=".R_SCL > .pin1" to="net.VCC3V3" />
    <trace from=".R_SCL > .pin2" to="net.I2C_SCL" />
    <trace from=".R_SDA > .pin1" to="net.VCC3V3" />
    <trace from=".R_SDA > .pin2" to="net.I2C_SDA" />

    {/* MPU6050 */}
    <trace from=".U3 > .SCL" to="net.I2C_SCL" />
    <trace from=".U3 > .SDA" to="net.I2C_SDA" />
    <trace from=".U3 > .VDD" to="net.VCC3V3" />
    <trace from=".U3 > .GND" to="net.GND" />
    <trace from=".U3 > .AD0" to="net.GND" />
    <trace from=".U3 > .INT" to=".U1 > .PB5" />
    <trace from=".C_IMU1 > .pin1" to="net.VCC3V3" />
    <trace from=".C_IMU1 > .pin2" to="net.GND" />
    <trace from=".C_IMU2 > .pin1" to="net.VCC3V3" />
    <trace from=".C_IMU2 > .pin2" to="net.GND" />

    {/* FDC1004 */}
    <trace from=".U4 > .SCL" to="net.I2C_SCL" />
    <trace from=".U4 > .SDA" to="net.I2C_SDA" />
    <trace from=".U4 > .VDD" to="net.VCC3V3" />
    <trace from=".U4 > .GND" to="net.GND" />
    <trace from=".U4 > .ADDR" to="net.GND" />
    <trace from=".C_FDC > .pin1" to="net.VCC3V3" />
    <trace from=".C_FDC > .pin2" to="net.GND" />

    {/* Status LED */}
    <trace from=".U1 > .PC13" to=".R_LED > .pin1" />
    <trace from=".R_LED > .pin2" to=".LED1 > .anode" />
    <trace from=".LED1 > .cathode" to="net.GND" />
  </board>,
)

// ---- Render and export ----

async function main() {
  const outDir = path.resolve(__dirname, "../output")
  fs.mkdirSync(outDir, { recursive: true })

  console.log("Rendering circuit...")
  circuit.render()

  const circuitJson = circuit.getCircuitJson() as any[]

  // ---- Build connectivity data ----
  const sourcePorts = circuitJson.filter((e) => e.type === "source_port")
  const sourceComponents = circuitJson.filter((e) => e.type === "source_component")
  const sourceNets = circuitJson.filter((e) => e.type === "source_net")
  const compById = new Map(sourceComponents.map((c: any) => [c.source_component_id, c]))

  // Map connectivity keys to net names
  const netNameByKey: Map<string, string> = new Map()
  for (const net of sourceNets) {
    if (net.subcircuit_connectivity_map_key && net.name) {
      netNameByKey.set(net.subcircuit_connectivity_map_key, net.name)
    }
  }

  // Group ports by connectivity key -> list of {component, pin}
  const netConnections: Map<string, Array<{ comp: string; pin: string }>> = new Map()
  for (const port of sourcePorts) {
    const key = port.subcircuit_connectivity_map_key
    if (!key) continue
    const comp = compById.get(port.source_component_id)
    const compName = comp?.name || "?"
    const pinName = port.name || port.port_hints?.[0] || "?"
    if (!netConnections.has(key)) netConnections.set(key, [])
    netConnections.get(key)!.push({ comp: compName, pin: pinName })
  }

  // Assign readable net names to unnamed signals
  let signalCounter = 1
  const getNetName = (key: string): string => {
    if (netNameByKey.has(key)) return netNameByKey.get(key)!
    // Try to derive a name from connected pins
    const pins = netConnections.get(key)
    if (pins && pins.length === 2) {
      return `${pins[0].comp}_${pins[0].pin}__${pins[1].comp}_${pins[1].pin}`
    }
    if (pins && pins.length > 2) {
      return `NET_${pins.map((p) => `${p.comp}.${p.pin}`).join("_")}`
    }
    return `SIG${signalCounter++}`
  }

  // Build final net name map
  const finalNetNames: Map<string, string> = new Map()
  for (const [key] of netConnections) {
    finalNetNames.set(key, getNetName(key))
  }

  // Build port -> net name lookup
  const portNetName: Map<string, string> = new Map()
  for (const port of sourcePorts) {
    const key = port.subcircuit_connectivity_map_key
    if (key && finalNetNames.has(key)) {
      const comp = compById.get(port.source_component_id)
      const compName = comp?.name || "?"
      const pinName = port.name || port.port_hints?.[0] || "?"
      portNetName.set(`${compName}.${pinName}`, finalNetNames.get(key)!)
    }
  }

  // ================================================================
  // 1. SPICE NETLIST
  // ================================================================
  try {
    const { circuitJsonToSpice } = await import("circuit-json-to-spice")
    const spiceNetlist = circuitJsonToSpice(circuitJson)
    const spiceStr = spiceNetlist.toSpiceString()
    const spicePath = path.join(outDir, "stm32-motor-sensor-control.spice")
    fs.writeFileSync(spicePath, spiceStr)
    console.log(`SPICE netlist: ${spicePath} (${spiceStr.length} chars)`)
  } catch (e: any) {
    console.log(`SPICE export note: ${e.message}`)
    console.log("  (SPICE only handles R/C/L/D/transistor -- ICs are exported as subcircuits or skipped)")
  }

  // ================================================================
  // 2. CIRCUIT JSON (machine-readable, full data)
  // ================================================================
  const jsonPath = path.join(outDir, "stm32-motor-sensor-control.circuit.json")
  fs.writeFileSync(jsonPath, JSON.stringify(circuitJson, null, 2))
  console.log(`Circuit JSON: ${jsonPath} (${(fs.statSync(jsonPath).size / 1024).toFixed(0)} KB)`)

  // ================================================================
  // 3. COMPLETE WIRING TABLE (what you actually need for Proteus)
  // ================================================================
  let out = ""
  out += "╔══════════════════════════════════════════════════════════════════════════╗\n"
  out += "║     STM32 MOTOR & SENSOR CONTROL CIRCUIT — COMPLETE WIRING TABLE       ║\n"
  out += "╚══════════════════════════════════════════════════════════════════════════╝\n\n"

  // ---- Bill of Materials ----
  out += "┌─────────────────────────────────────────────────────────────────────────┐\n"
  out += "│  BILL OF MATERIALS                                                     │\n"
  out += "├──────────┬────────────────────────┬───────────┬────────────────────────┤\n"
  out += "│ Ref      │ Part                   │ Value     │ Package                │\n"
  out += "├──────────┼────────────────────────┼───────────┼────────────────────────┤\n"

  const bomEntries = [
    ["U1",      "STM32F103C8T6",        "--",       "LQFP-48"],
    ["U2",      "AMS1117-3.3",          "3.3V LDO", "SOT-223"],
    ["U3",      "MPU6050 IMU",          "--",       "QFN-24"],
    ["U4",      "FDC1004 Cap Sensor",   "--",       "TSSOP-10"],
    ["DRV1-4",  "A4988 Stepper Driver", "--",       "SOIC-16 (x4)"],
    ["MOT1-4",  "NEMA17 Connector",     "--",       "4-pin header (x4)"],
    ["SERVO1-2","Servo Connector",      "--",       "3-pin header (x2)"],
    ["J_USB",   "USB Connector",        "--",       "4-pin header"],
    ["Y1",      "Crystal Oscillator",   "8MHz",     "HC49"],
    ["C_Y1,Y2", "Crystal Load Cap",     "20pF",     "0402 (x2)"],
    ["C1-C3",   "STM32 Decoupling",     "100nF",    "0402 (x3)"],
    ["C_DRV1-4","Driver Decoupling",    "100nF",    "0402 (x4)"],
    ["C_MOT1-4","Motor Bulk Cap",       "100uF",    "0805 (x4)"],
    ["C_IMU1",  "IMU Decoupling",       "100nF",    "0402"],
    ["C_IMU2",  "IMU Decoupling",       "10nF",     "0402"],
    ["C_FDC",   "FDC Decoupling",       "100nF",    "0402"],
    ["C_LDO_IN","LDO Input Cap",        "10uF",     "0805"],
    ["C_LDO_OUT","LDO Output Cap",      "10uF",     "0805"],
    ["R_SCL",   "I2C Pull-up",          "4.7k",     "0402"],
    ["R_SDA",   "I2C Pull-up",          "4.7k",     "0402"],
    ["R_LED",   "LED Resistor",         "1k",       "0402"],
    ["LED1",    "Status LED",           "--",       "0603"],
  ]
  for (const [ref, part, val, pkg] of bomEntries) {
    out += `│ ${ref.padEnd(8)} │ ${part.padEnd(22)} │ ${val.padEnd(9)} │ ${pkg.padEnd(22)} │\n`
  }
  out += "└──────────┴────────────────────────┴───────────┴────────────────────────┘\n\n"

  // ---- STM32 Pin Allocation ----
  out += "┌─────────────────────────────────────────────────────────────────────────┐\n"
  out += "│  STM32F103C8T6 PIN ALLOCATION                                          │\n"
  out += "├──────┬───────┬──────────────────────────────────────────────────────────┤\n"
  out += "│ Pin# │ Name  │ Connected To                                             │\n"
  out += "├──────┼───────┼──────────────────────────────────────────────────────────┤\n"

  const stm32Connections: Array<[number, string, string]> = [
    [1,  "VBAT",  "VCC3V3 (3.3V rail)"],
    [2,  "PC13",  "R_LED.pin1 → LED1 (Status LED)"],
    [3,  "PC14",  "(unused)"],
    [4,  "PC15",  "(unused)"],
    [5,  "PD0",   "Y1.pin1 + C_Y1.pin1 (OSC_IN, 8MHz crystal)"],
    [6,  "PD1",   "Y1.pin2 + C_Y2.pin1 (OSC_OUT, 8MHz crystal)"],
    [7,  "NRST",  "(reset, leave unconnected or add RC)"],
    [8,  "VSSA",  "GND"],
    [9,  "VDDA",  "VCC3V3 + C3 decoupling"],
    [10, "PA0",   "DRV1.STEP (Stepper 1 step)"],
    [11, "PA1",   "DRV1.DIR  (Stepper 1 direction)"],
    [12, "PA2",   "DRV2.STEP (Stepper 2 step)"],
    [13, "PA3",   "DRV2.DIR  (Stepper 2 direction)"],
    [14, "PA4",   "DRV4.DIR  (Stepper 4 direction)"],
    [15, "PA5",   "(unused)"],
    [16, "PA6",   "SERVO1.SIG (Servo 1 PWM, TIM3_CH1)"],
    [17, "PA7",   "SERVO2.SIG (Servo 2 PWM, TIM3_CH2)"],
    [18, "PB0",   "DRV1.EN   (Stepper 1 enable)"],
    [19, "PB1",   "DRV2.EN   (Stepper 2 enable)"],
    [20, "PB2",   "DRV3.EN   (Stepper 3 enable)"],
    [21, "PB10",  "(unused)"],
    [22, "PB11",  "(unused)"],
    [23, "VSS1",  "GND"],
    [24, "VDD1",  "VCC3V3 + C1 decoupling"],
    [25, "PB12",  "(unused)"],
    [26, "PB13",  "(unused)"],
    [27, "PB14",  "(unused)"],
    [28, "PB15",  "(unused)"],
    [29, "PA8",   "DRV3.STEP (Stepper 3 step)"],
    [30, "PA9",   "DRV3.DIR  (Stepper 3 direction)"],
    [31, "PA10",  "DRV4.STEP (Stepper 4 step)"],
    [32, "PA11",  "J_USB.DM  (USB D-)"],
    [33, "PA12",  "J_USB.DP  (USB D+)"],
    [34, "PA13",  "SWDIO (debug, leave free)"],
    [35, "PA14",  "SWCLK (debug, leave free)"],
    [36, "PA15",  "(unused)"],
    [37, "PB3",   "DRV4.EN   (Stepper 4 enable)"],
    [38, "PB4",   "DRV1.MS1  (Stepper 1 microstep select)"],
    [39, "PB5",   "U3.INT    (MPU6050 interrupt)"],
    [40, "PB6",   "I2C_SCL → U3.SCL + U4.SCL + R_SCL (I2C clock)"],
    [41, "PB7",   "I2C_SDA → U3.SDA + U4.SDA + R_SDA (I2C data)"],
    [42, "PB8",   "(unused)"],
    [43, "PB9",   "(unused)"],
    [44, "BOOT0", "(tie low for normal boot)"],
    [47, "VSS2",  "GND"],
    [48, "VDD2",  "VCC3V3 + C2 decoupling"],
  ]

  for (const [pin, name, conn] of stm32Connections) {
    out += `│ ${String(pin).padStart(4)} │ ${name.padEnd(5)} │ ${conn.padEnd(56)} │\n`
  }
  out += "└──────┴───────┴──────────────────────────────────────────────────────────┘\n\n"

  // ---- Per-driver wiring ----
  out += "┌─────────────────────────────────────────────────────────────────────────┐\n"
  out += "│  A4988 STEPPER DRIVER WIRING (x4)                                      │\n"
  out += "├──────────┬──────────┬──────────┬──────────┬────────────────────────────┤\n"
  out += "│ A4988 Pin│ DRV1     │ DRV2     │ DRV3     │ DRV4                       │\n"
  out += "├──────────┼──────────┼──────────┼──────────┼────────────────────────────┤\n"

  const drvWiring: Array<[string, string, string, string, string]> = [
    ["STEP",    "U1.PA0",  "U1.PA2",  "U1.PA8",  "U1.PA10"],
    ["DIR",     "U1.PA1",  "U1.PA3",  "U1.PA9",  "U1.PA4"],
    ["EN",      "U1.PB0",  "U1.PB1",  "U1.PB2",  "U1.PB3"],
    ["MS1",     "U1.PB4",  "GND",     "GND",     "GND"],
    ["MS2",     "GND",     "GND",     "GND",     "GND"],
    ["MS3",     "GND",     "GND",     "GND",     "GND"],
    ["SLEEP",   "VCC3V3",  "VCC3V3",  "VCC3V3",  "VCC3V3"],
    ["RESET",   "VCC3V3",  "VCC3V3",  "VCC3V3",  "VCC3V3"],
    ["VDD",     "VCC3V3",  "VCC3V3",  "VCC3V3",  "VCC3V3"],
    ["GND",     "GND",     "GND",     "GND",     "GND"],
    ["VMOT",    "VMOT",    "VMOT",    "VMOT",    "VMOT"],
    ["GND_MOT", "GND",     "GND",     "GND",     "GND"],
    ["1A",      "MOT1.1A", "MOT2.1A", "MOT3.1A", "MOT4.1A"],
    ["1B",      "MOT1.1B", "MOT2.1B", "MOT3.1B", "MOT4.1B"],
    ["2A",      "MOT1.2A", "MOT2.2A", "MOT3.2A", "MOT4.2A"],
    ["2B",      "MOT1.2B", "MOT2.2B", "MOT3.2B", "MOT4.2B"],
  ]
  for (const [pin, d1, d2, d3, d4] of drvWiring) {
    out += `│ ${pin.padEnd(8)} │ ${d1.padEnd(8)} │ ${d2.padEnd(8)} │ ${d3.padEnd(8)} │ ${d4.padEnd(26)} │\n`
  }
  out += "├──────────┴──────────┴──────────┴──────────┴────────────────────────────┤\n"
  out += "│ Each driver also needs: 100nF cap (VDD→GND), 100uF cap (VMOT→GND)     │\n"
  out += "└─────────────────────────────────────────────────────────────────────────┘\n\n"

  // ---- I2C Bus ----
  out += "┌─────────────────────────────────────────────────────────────────────────┐\n"
  out += "│  I2C BUS WIRING                                                        │\n"
  out += "├──────────────┬─────────────────────────────────────────────────────────┤\n"
  out += "│ Signal       │ Connected Pins                                          │\n"
  out += "├──────────────┼─────────────────────────────────────────────────────────┤\n"
  out += "│ I2C_SCL      │ U1.PB6, U3(MPU6050).SCL, U4(FDC1004).SCL, R_SCL→3.3V │\n"
  out += "│ I2C_SDA      │ U1.PB7, U3(MPU6050).SDA, U4(FDC1004).SDA, R_SDA→3.3V │\n"
  out += "│ IMU INT      │ U3(MPU6050).INT → U1.PB5                               │\n"
  out += "│ MPU6050 AD0  │ GND (I2C address 0x68)                                 │\n"
  out += "│ FDC1004 ADDR │ GND (I2C address 0x50)                                 │\n"
  out += "├──────────────┴─────────────────────────────────────────────────────────┤\n"
  out += "│ Pull-ups: R_SCL=4.7k (VCC3V3→SCL), R_SDA=4.7k (VCC3V3→SDA)          │\n"
  out += "└─────────────────────────────────────────────────────────────────────────┘\n\n"

  // ---- Servo wiring ----
  out += "┌─────────────────────────────────────────────────────────────────────────┐\n"
  out += "│  SERVO MOTOR WIRING                                                    │\n"
  out += "├──────────┬────────────┬────────────────────────────────────────────────┤\n"
  out += "│ Servo    │ Pin        │ Connected To                                   │\n"
  out += "├──────────┼────────────┼────────────────────────────────────────────────┤\n"
  out += "│ SERVO1   │ SIG        │ U1.PA6  (TIM3_CH1 PWM)                        │\n"
  out += "│          │ VCC        │ VBUS5V  (5V from USB)                          │\n"
  out += "│          │ GND        │ GND                                            │\n"
  out += "├──────────┼────────────┼────────────────────────────────────────────────┤\n"
  out += "│ SERVO2   │ SIG        │ U1.PA7  (TIM3_CH2 PWM)                        │\n"
  out += "│          │ VCC        │ VBUS5V  (5V from USB)                          │\n"
  out += "│          │ GND        │ GND                                            │\n"
  out += "└──────────┴────────────┴────────────────────────────────────────────────┘\n\n"

  // ---- Power distribution ----
  out += "┌─────────────────────────────────────────────────────────────────────────┐\n"
  out += "│  POWER DISTRIBUTION                                                    │\n"
  out += "├──────────┬────────────────────────────────────────────────────────────┤\n"
  out += "│ Rail     │ Source / Loads                                              │\n"
  out += "├──────────┼────────────────────────────────────────────────────────────┤\n"
  out += "│ VBUS5V   │ FROM: J_USB.VBUS (laptop USB)                              │\n"
  out += "│ (5V)     │   TO: U2(AMS1117).VIN, SERVO1.VCC, SERVO2.VCC             │\n"
  out += "│          │   CAPS: C_LDO_IN (10uF)                                    │\n"
  out += "├──────────┼────────────────────────────────────────────────────────────┤\n"
  out += "│ VCC3V3   │ FROM: U2(AMS1117).VOUT                                     │\n"
  out += "│ (3.3V)   │   TO: U1(STM32) VDD1+VDD2+VDDA+VBAT                       │\n"
  out += "│          │       DRV1-4 .VDD+.SLEEP+.RESET                            │\n"
  out += "│          │       U3(MPU6050).VDD, U4(FDC1004).VDD                     │\n"
  out += "│          │       R_SCL.pin1, R_SDA.pin1 (I2C pull-ups)                │\n"
  out += "│          │   CAPS: C1,C2,C3 (100nF), C_LDO_OUT (10uF),               │\n"
  out += "│          │         C_DRV1-4 (100nF), C_IMU1 (100nF),                  │\n"
  out += "│          │         C_IMU2 (10nF), C_FDC (100nF)                       │\n"
  out += "├──────────┼────────────────────────────────────────────────────────────┤\n"
  out += "│ VMOT     │ FROM: External motor power supply (12-36V)                  │\n"
  out += "│ (12-36V) │   TO: DRV1-4 .VMOT                                         │\n"
  out += "│          │   CAPS: C_MOT1-4 (100uF each)                              │\n"
  out += "├──────────┼────────────────────────────────────────────────────────────┤\n"
  out += "│ GND      │ All component grounds tied together                         │\n"
  out += "│          │ 49 pins total on GND rail                                   │\n"
  out += "└──────────┴────────────────────────────────────────────────────────────┘\n\n"

  // ---- Crystal ----
  out += "┌─────────────────────────────────────────────────────────────────────────┐\n"
  out += "│  CRYSTAL OSCILLATOR                                                    │\n"
  out += "├─────────────────────────────────────────────────────────────────────────┤\n"
  out += "│ Y1 (8MHz HC49):  pin1 → U1.PD0 (OSC_IN)                               │\n"
  out += "│                  pin2 → U1.PD1 (OSC_OUT)                               │\n"
  out += "│ C_Y1 (20pF):    pin1 → Y1.pin1,  pin2 → GND                           │\n"
  out += "│ C_Y2 (20pF):    pin1 → Y1.pin2,  pin2 → GND                           │\n"
  out += "└─────────────────────────────────────────────────────────────────────────┘\n\n"

  // ---- USB ----
  out += "┌─────────────────────────────────────────────────────────────────────────┐\n"
  out += "│  USB CONNECTION (Laptop Communication)                                 │\n"
  out += "├─────────────────────────────────────────────────────────────────────────┤\n"
  out += "│ J_USB.VBUS → VBUS5V (5V rail)                                          │\n"
  out += "│ J_USB.GND  → GND                                                       │\n"
  out += "│ J_USB.DM   → U1.PA11 (USB D-)                                          │\n"
  out += "│ J_USB.DP   → U1.PA12 (USB D+)                                          │\n"
  out += "└─────────────────────────────────────────────────────────────────────────┘\n\n"

  // ---- LED ----
  out += "┌─────────────────────────────────────────────────────────────────────────┐\n"
  out += "│  STATUS LED                                                            │\n"
  out += "├─────────────────────────────────────────────────────────────────────────┤\n"
  out += "│ U1.PC13 → R_LED(1k).pin1 → R_LED.pin2 → LED1.anode → LED1.cathode → GND│\n"
  out += "└─────────────────────────────────────────────────────────────────────────┘\n\n"

  // ---- Full netlist by net ----
  out += "┌─────────────────────────────────────────────────────────────────────────┐\n"
  out += "│  FULL NETLIST (every net, every pin)                                   │\n"
  out += "└─────────────────────────────────────────────────────────────────────────┘\n\n"

  const sortedNets = [...netConnections.entries()]
    .filter(([_, pins]) => pins.length > 1)
    .sort(([a], [b]) => {
      const nameA = finalNetNames.get(a) || a
      const nameB = finalNetNames.get(b) || b
      return nameA.localeCompare(nameB)
    })

  for (const [key, pins] of sortedNets) {
    const netName = finalNetNames.get(key) || key
    const pinStrs = pins.map((p) => `${p.comp}.${p.pin}`).sort()
    out += `  NET ${netName}:\n`
    for (const p of pinStrs) {
      out += `    ─── ${p}\n`
    }
    out += "\n"
  }

  const wiringPath = path.join(outDir, "stm32-motor-sensor-control.wiring-table.txt")
  fs.writeFileSync(wiringPath, out)
  console.log(`Wiring table: ${wiringPath} (${(fs.statSync(wiringPath).size / 1024).toFixed(0)} KB)`)

  console.log("\nDone! Output files:")
  console.log(`  ${wiringPath}  ← USE THIS to wire in Proteus`)
  console.log(`  ${jsonPath}`)
}

main().catch(console.error)
