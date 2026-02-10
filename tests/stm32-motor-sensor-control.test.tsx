import React from "react"
import { test, expect } from "bun:test"
import { Circuit } from "../dist"

/**
 * STM32 Motor & Sensor Control Circuit
 *
 * A realistic embedded control circuit connecting:
 *   - STM32F103C8T6 (LQFP-48) microcontroller
 *   - 4x A4988 stepper motor drivers (for NEMA17 steppers)
 *   - 2x Servo motor connectors (PWM-driven)
 *   - MPU6050 IMU sensor (I2C)
 *   - FDC1004 capacitance sensor (I2C)
 *   - AMS1117-3.3 voltage regulator
 *   - USB connector for laptop communication
 *   - Decoupling capacitors, pull-ups, bulk caps
 *
 * STM32 Pin Allocation:
 *   PA0  -> A4988 #1 STEP      PA8  -> A4988 #3 STEP
 *   PA1  -> A4988 #1 DIR       PA9  -> A4988 #3 DIR     (also USART1_TX)
 *   PA2  -> A4988 #2 STEP      PA10 -> A4988 #4 STEP    (also USART1_RX)
 *   PA3  -> A4988 #2 DIR       PA11 -> USB D-
 *   PA4  -> A4988 #4 DIR       PA12 -> USB D+
 *   PA5  -> SPI1_SCK (free)    PA13 -> SWDIO
 *   PA6  -> SERVO1 PWM (TIM3)  PA14 -> SWCLK
 *   PA7  -> SERVO2 PWM (TIM3)  PA15 -> free
 *   PB0  -> A4988 #1 EN        PB6  -> I2C1_SCL (MPU6050 + FDC1004)
 *   PB1  -> A4988 #2 EN        PB7  -> I2C1_SDA (MPU6050 + FDC1004)
 *   PB2  -> A4988 #3 EN        PB8-PB15 -> free
 *   PB3  -> A4988 #4 EN
 *   PB4  -> A4988 #1 MS1       PB5  -> free
 *   PC13 -> Status LED
 *   PD0  -> OSC_IN             PD1  -> OSC_OUT
 */

// ---- STM32F103C8T6 LQFP-48 pin map ----
const stm32PinLabels: Record<string, string> = {
  pin1: "VBAT",
  pin2: "PC13",
  pin3: "PC14",
  pin4: "PC15",
  pin5: "PD0",
  pin6: "PD1",
  pin7: "NRST",
  pin8: "VSSA",
  pin9: "VDDA",
  pin10: "PA0",
  pin11: "PA1",
  pin12: "PA2",
  pin13: "PA3",
  pin14: "PA4",
  pin15: "PA5",
  pin16: "PA6",
  pin17: "PA7",
  pin18: "PB0",
  pin19: "PB1",
  pin20: "PB2",
  pin21: "PB10",
  pin22: "PB11",
  pin23: "VSS1",
  pin24: "VDD1",
  pin25: "PB12",
  pin26: "PB13",
  pin27: "PB14",
  pin28: "PB15",
  pin29: "PA8",
  pin30: "PA9",
  pin31: "PA10",
  pin32: "PA11",
  pin33: "PA12",
  pin34: "PA13",
  pin35: "PA14",
  pin36: "PA15",
  pin37: "PB3",
  pin38: "PB4",
  pin39: "PB5",
  pin40: "PB6",
  pin41: "PB7",
  pin42: "PB8",
  pin43: "PB9",
  pin44: "BOOT0",
  pin45: "PB_UNUSED1",
  pin46: "PB_UNUSED2",
  pin47: "VSS2",
  pin48: "VDD2",
}

// ---- A4988 stepper driver (simplified 16-pin interface) ----
// Real A4988 is a 28-pin TSSOP but we model the key interface pins
// using a 16-pin SOIC for schematic clarity.
// Pins: VDD, GND, VMOT, GND_MOT, 1A, 1B, 2A, 2B, STEP, DIR, EN, MS1, MS2, MS3, SLEEP, RESET
const a4988PinLabels: Record<string, string> = {
  pin1: "EN",
  pin2: "MS1",
  pin3: "MS2",
  pin4: "MS3",
  pin5: "RESET",
  pin6: "SLEEP",
  pin7: "STEP",
  pin8: "DIR",
  pin9: "GND",
  pin10: "VDD",
  pin11: "1A",
  pin12: "1B",
  pin13: "2A",
  pin14: "2B",
  pin15: "VMOT",
  pin16: "GND_MOT",
}

// ---- MPU6050 IMU (QFN-24) ----
// Key pins: VDD, GND, SDA, SCL, AD0, INT, AUX_DA, AUX_CL
const mpu6050PinLabels: Record<string, string> = {
  pin1: "AUX_CL",
  pin2: "AUX_DA",
  pin3: "NC1",
  pin4: "NC2",
  pin5: "NC3",
  pin6: "NC4",
  pin7: "NC5",
  pin8: "CLKIN",
  pin9: "AD0",
  pin10: "NC6",
  pin11: "NC7",
  pin12: "INT",
  pin13: "VDD",
  pin14: "NC8",
  pin15: "NC9",
  pin16: "NC10",
  pin17: "NC11",
  pin18: "GND",
  pin19: "RESV1",
  pin20: "CPOUT",
  pin21: "RESV2",
  pin22: "RESV3",
  pin23: "SCL",
  pin24: "SDA",
}

// ---- FDC1004 capacitance sensor (TSSOP-10) ----
const fdc1004PinLabels: Record<string, string> = {
  pin1: "CIN1",
  pin2: "CIN2",
  pin3: "CIN3",
  pin4: "CIN4",
  pin5: "GND",
  pin6: "SHLD",
  pin7: "VDD",
  pin8: "SCL",
  pin9: "SDA",
  pin10: "ADDR",
}

// ---- AMS1117-3.3 (SOT-223) ----
const ams1117PinLabels: Record<string, string> = {
  pin1: "GND",
  pin2: "VOUT",
  pin3: "VIN",
}

// ---- USB connector (4-pin header) ----
const usbPinLabels: Record<string, string> = {
  pin1: "VBUS",
  pin2: "DM",
  pin3: "DP",
  pin4: "GND",
}

// ---- Servo connector (3-pin header): GND, VCC, SIGNAL ----
const servoPinLabels: Record<string, string> = {
  pin1: "GND",
  pin2: "VCC",
  pin3: "SIG",
}

// ---- NEMA17 connector (4-pin header): 1A, 1B, 2A, 2B ----
const nema17PinLabels: Record<string, string> = {
  pin1: "1A",
  pin2: "1B",
  pin3: "2A",
  pin4: "2B",
}

test("STM32 motor & sensor control circuit - netlist verification", async () => {
  const circuit = new Circuit()

  circuit.add(
    <board width={120} height={100}>
      {/* ===== Power Nets ===== */}
      <net name="VCC3V3" />
      <net name="GND" />
      <net name="VBUS5V" />
      <net name="VMOT" />
      <net name="SERVO_VCC" />

      {/* ===== Signal Nets ===== */}
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

      {/* ================================================================ */}
      {/* ===== STM32F103C8T6 (LQFP-48) ===== */}
      {/* ================================================================ */}
      <chip
        name="U1"
        footprint="qfp48_w7mm_h7mm_p0.5mm_pw0.25mm_pl1mm"
        pinLabels={stm32PinLabels}
        schPinArrangement={{
          leftSide: {
            pins: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
            direction: "top-to-bottom" as const,
          },
          bottomSide: {
            pins: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
            direction: "left-to-right" as const,
          },
          rightSide: {
            pins: [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36],
            direction: "bottom-to-top" as const,
          },
          topSide: {
            pins: [37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48],
            direction: "right-to-left" as const,
          },
        }}
        pcbX={0}
        pcbY={0}
      />

      {/* ================================================================ */}
      {/* ===== A4988 Stepper Drivers x4 ===== */}
      {/* ================================================================ */}
      <chip
        name="DRV1"
        footprint="soic16_w5.3mm_h10mm_p1.27mm"
        pinLabels={a4988PinLabels}
        schPinArrangement={{
          leftSide: { pins: [1, 2, 3, 4, 5, 6, 7, 8], direction: "top-to-bottom" as const },
          rightSide: { pins: [16, 15, 14, 13, 12, 11, 10, 9], direction: "top-to-bottom" as const },
        }}
        pcbX={-40}
        pcbY={-30}
      />
      <chip
        name="DRV2"
        footprint="soic16_w5.3mm_h10mm_p1.27mm"
        pinLabels={a4988PinLabels}
        schPinArrangement={{
          leftSide: { pins: [1, 2, 3, 4, 5, 6, 7, 8], direction: "top-to-bottom" as const },
          rightSide: { pins: [16, 15, 14, 13, 12, 11, 10, 9], direction: "top-to-bottom" as const },
        }}
        pcbX={-40}
        pcbY={-10}
      />
      <chip
        name="DRV3"
        footprint="soic16_w5.3mm_h10mm_p1.27mm"
        pinLabels={a4988PinLabels}
        schPinArrangement={{
          leftSide: { pins: [1, 2, 3, 4, 5, 6, 7, 8], direction: "top-to-bottom" as const },
          rightSide: { pins: [16, 15, 14, 13, 12, 11, 10, 9], direction: "top-to-bottom" as const },
        }}
        pcbX={-40}
        pcbY={10}
      />
      <chip
        name="DRV4"
        footprint="soic16_w5.3mm_h10mm_p1.27mm"
        pinLabels={a4988PinLabels}
        schPinArrangement={{
          leftSide: { pins: [1, 2, 3, 4, 5, 6, 7, 8], direction: "top-to-bottom" as const },
          rightSide: { pins: [16, 15, 14, 13, 12, 11, 10, 9], direction: "top-to-bottom" as const },
        }}
        pcbX={-40}
        pcbY={30}
      />

      {/* ===== NEMA17 Motor Connectors x4 ===== */}
      <chip name="MOT1" footprint="pinrow4" pinLabels={nema17PinLabels} pcbX={-55} pcbY={-30} />
      <chip name="MOT2" footprint="pinrow4" pinLabels={nema17PinLabels} pcbX={-55} pcbY={-10} />
      <chip name="MOT3" footprint="pinrow4" pinLabels={nema17PinLabels} pcbX={-55} pcbY={10} />
      <chip name="MOT4" footprint="pinrow4" pinLabels={nema17PinLabels} pcbX={-55} pcbY={30} />

      {/* ===== Servo Connectors x2 ===== */}
      <chip name="SERVO1" footprint="pinrow3" pinLabels={servoPinLabels} pcbX={30} pcbY={-30} />
      <chip name="SERVO2" footprint="pinrow3" pinLabels={servoPinLabels} pcbX={30} pcbY={-20} />

      {/* ================================================================ */}
      {/* ===== MPU6050 IMU (QFN-24 with thermal pad) ===== */}
      {/* ================================================================ */}
      <chip
        name="U3"
        footprint="qfn24_w4mm_h4mm_p0.5mm_thermalpad"
        pinLabels={mpu6050PinLabels}
        schPinArrangement={{
          leftSide: { pins: [1, 2, 8, 9, 12, 13], direction: "top-to-bottom" as const },
          rightSide: { pins: [18, 20, 23, 24], direction: "top-to-bottom" as const },
          bottomSide: { pins: [3, 4, 5, 6, 7, 10, 11, 14, 15, 16, 17, 19, 21, 22], direction: "left-to-right" as const },
        }}
        pcbX={30}
        pcbY={10}
      />

      {/* ===== FDC1004 Capacitance Sensor (TSSOP-10) ===== */}
      <chip
        name="U4"
        footprint="tssop10_w3mm_h3mm_p0.5mm"
        pinLabels={fdc1004PinLabels}
        schPinArrangement={{
          leftSide: { pins: [1, 2, 3, 4, 5], direction: "top-to-bottom" as const },
          rightSide: { pins: [10, 9, 8, 7, 6], direction: "top-to-bottom" as const },
        }}
        pcbX={30}
        pcbY={30}
      />

      {/* ===== Power: AMS1117-3.3 LDO ===== */}
      <chip
        name="U2"
        footprint="sot223"
        pinLabels={ams1117PinLabels}
        schPinArrangement={{
          leftSide: { pins: [3], direction: "top-to-bottom" as const },
          rightSide: { pins: [2], direction: "top-to-bottom" as const },
          bottomSide: { pins: [1], direction: "left-to-right" as const },
        }}
        pcbX={-30}
        pcbY={40}
      />

      {/* ===== USB Connector ===== */}
      <chip
        name="J_USB"
        footprint="pinrow4"
        pinLabels={usbPinLabels}
        pcbX={-50}
        pcbY={40}
      />

      {/* ===== Crystal Oscillator 8MHz ===== */}
      <crystal name="Y1" frequency="8MHz" loadCapacitance="20pF" footprint="hc49" pcbX={10} pcbY={-20} />
      <capacitor name="C_Y1" capacitance="20pF" footprint="0402" pcbX={7} pcbY={-25} />
      <capacitor name="C_Y2" capacitance="20pF" footprint="0402" pcbX={13} pcbY={-25} />

      {/* ===== Decoupling Capacitors ===== */}
      {/* STM32 VDD decoupling */}
      <capacitor name="C1" capacitance="100nF" footprint="0402" pcbX={5} pcbY={8} />
      <capacitor name="C2" capacitance="100nF" footprint="0402" pcbX={5} pcbY={-8} />
      <capacitor name="C3" capacitance="100nF" footprint="0402" pcbX={-8} pcbY={-8} />
      {/* MPU6050 decoupling */}
      <capacitor name="C_IMU1" capacitance="100nF" footprint="0402" pcbX={35} pcbY={5} />
      <capacitor name="C_IMU2" capacitance="10nF" footprint="0402" pcbX={35} pcbY={15} />
      {/* FDC1004 decoupling */}
      <capacitor name="C_FDC" capacitance="100nF" footprint="0402" pcbX={35} pcbY={25} />
      {/* A4988 VDD decoupling x4 */}
      <capacitor name="C_DRV1" capacitance="100nF" footprint="0402" pcbX={-35} pcbY={-35} />
      <capacitor name="C_DRV2" capacitance="100nF" footprint="0402" pcbX={-35} pcbY={-15} />
      <capacitor name="C_DRV3" capacitance="100nF" footprint="0402" pcbX={-35} pcbY={5} />
      <capacitor name="C_DRV4" capacitance="100nF" footprint="0402" pcbX={-35} pcbY={25} />
      {/* A4988 VMOT bulk caps x4 */}
      <capacitor name="C_MOT1" capacitance="100uF" footprint="0805" pcbX={-45} pcbY={-35} />
      <capacitor name="C_MOT2" capacitance="100uF" footprint="0805" pcbX={-45} pcbY={-15} />
      <capacitor name="C_MOT3" capacitance="100uF" footprint="0805" pcbX={-45} pcbY={5} />
      <capacitor name="C_MOT4" capacitance="100uF" footprint="0805" pcbX={-45} pcbY={25} />
      {/* LDO bulk caps */}
      <capacitor name="C_LDO_IN" capacitance="10uF" footprint="0805" pcbX={-35} pcbY={45} />
      <capacitor name="C_LDO_OUT" capacitance="10uF" footprint="0805" pcbX={-25} pcbY={45} />

      {/* ===== I2C Pull-up Resistors ===== */}
      <resistor name="R_SCL" resistance="4.7kohm" footprint="0402" pcbX={20} pcbY={5} />
      <resistor name="R_SDA" resistance="4.7kohm" footprint="0402" pcbX={20} pcbY={15} />

      {/* ===== Status LED ===== */}
      <resistor name="R_LED" resistance="1kohm" footprint="0402" pcbX={15} pcbY={-35} />
      <led name="LED1" footprint="0603" pcbX={20} pcbY={-35} />

      {/* ================================================================ */}
      {/* ===== POWER CONNECTIONS ===== */}
      {/* ================================================================ */}

      {/* USB -> LDO -> 3.3V */}
      <trace from=".J_USB > .VBUS" to="net.VBUS5V" />
      <trace from=".J_USB > .GND" to="net.GND" />
      <trace from=".U2 > .VIN" to="net.VBUS5V" />
      <trace from=".U2 > .VOUT" to="net.VCC3V3" />
      <trace from=".U2 > .GND" to="net.GND" />

      {/* LDO bulk caps */}
      <trace from=".C_LDO_IN > .pin1" to="net.VBUS5V" />
      <trace from=".C_LDO_IN > .pin2" to="net.GND" />
      <trace from=".C_LDO_OUT > .pin1" to="net.VCC3V3" />
      <trace from=".C_LDO_OUT > .pin2" to="net.GND" />

      {/* STM32 power pins */}
      <trace from=".U1 > .VDD1" to="net.VCC3V3" />
      <trace from=".U1 > .VDD2" to="net.VCC3V3" />
      <trace from=".U1 > .VDDA" to="net.VCC3V3" />
      <trace from=".U1 > .VBAT" to="net.VCC3V3" />
      <trace from=".U1 > .VSS1" to="net.GND" />
      <trace from=".U1 > .VSS2" to="net.GND" />
      <trace from=".U1 > .VSSA" to="net.GND" />

      {/* STM32 decoupling */}
      <trace from=".C1 > .pin1" to="net.VCC3V3" />
      <trace from=".C1 > .pin2" to="net.GND" />
      <trace from=".C2 > .pin1" to="net.VCC3V3" />
      <trace from=".C2 > .pin2" to="net.GND" />
      <trace from=".C3 > .pin1" to="net.VCC3V3" />
      <trace from=".C3 > .pin2" to="net.GND" />

      {/* ================================================================ */}
      {/* ===== CRYSTAL OSCILLATOR ===== */}
      {/* ================================================================ */}
      <trace from=".Y1 > .pin1" to=".U1 > .PD0" />
      <trace from=".Y1 > .pin2" to=".U1 > .PD1" />
      <trace from=".C_Y1 > .pin1" to=".Y1 > .pin1" />
      <trace from=".C_Y1 > .pin2" to="net.GND" />
      <trace from=".C_Y2 > .pin1" to=".Y1 > .pin2" />
      <trace from=".C_Y2 > .pin2" to="net.GND" />

      {/* ================================================================ */}
      {/* ===== USB DATA LINES ===== */}
      {/* ================================================================ */}
      <trace from=".J_USB > .DM" to=".U1 > .PA11" />
      <trace from=".J_USB > .DP" to=".U1 > .PA12" />

      {/* ================================================================ */}
      {/* ===== STEPPER DRIVER 1 (NEMA17 #1) ===== */}
      {/* ================================================================ */}
      {/* Control signals: STM32 -> DRV1 */}
      <trace from=".U1 > .PA0" to=".DRV1 > .STEP" />
      <trace from=".U1 > .PA1" to=".DRV1 > .DIR" />
      <trace from=".U1 > .PB0" to=".DRV1 > .EN" />
      {/* DRV1 power */}
      <trace from=".DRV1 > .VDD" to="net.VCC3V3" />
      <trace from=".DRV1 > .GND" to="net.GND" />
      <trace from=".DRV1 > .VMOT" to="net.VMOT" />
      <trace from=".DRV1 > .GND_MOT" to="net.GND" />
      {/* DRV1 SLEEP and RESET tied high (active) */}
      <trace from=".DRV1 > .SLEEP" to="net.VCC3V3" />
      <trace from=".DRV1 > .RESET" to="net.VCC3V3" />
      {/* DRV1 microstepping: MS1 tied to PB4 for software control, MS2/MS3 low */}
      <trace from=".U1 > .PB4" to=".DRV1 > .MS1" />
      <trace from=".DRV1 > .MS2" to="net.GND" />
      <trace from=".DRV1 > .MS3" to="net.GND" />
      {/* DRV1 motor outputs -> NEMA17 connector */}
      <trace from=".DRV1 > .1A" to=".MOT1 > .1A" />
      <trace from=".DRV1 > .1B" to=".MOT1 > .1B" />
      <trace from=".DRV1 > .2A" to=".MOT1 > .2A" />
      <trace from=".DRV1 > .2B" to=".MOT1 > .2B" />
      {/* DRV1 decoupling + motor bulk cap */}
      <trace from=".C_DRV1 > .pin1" to="net.VCC3V3" />
      <trace from=".C_DRV1 > .pin2" to="net.GND" />
      <trace from=".C_MOT1 > .pin1" to="net.VMOT" />
      <trace from=".C_MOT1 > .pin2" to="net.GND" />

      {/* ================================================================ */}
      {/* ===== STEPPER DRIVER 2 (NEMA17 #2) ===== */}
      {/* ================================================================ */}
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

      {/* ================================================================ */}
      {/* ===== STEPPER DRIVER 3 (NEMA17 #3) ===== */}
      {/* ================================================================ */}
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

      {/* ================================================================ */}
      {/* ===== STEPPER DRIVER 4 (NEMA17 #4) ===== */}
      {/* ================================================================ */}
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

      {/* ================================================================ */}
      {/* ===== SERVO MOTORS ===== */}
      {/* ================================================================ */}
      {/* Servo1: PA6 (TIM3_CH1) -> PWM */}
      <trace from=".U1 > .PA6" to=".SERVO1 > .SIG" />
      <trace from=".SERVO1 > .VCC" to="net.VBUS5V" />
      <trace from=".SERVO1 > .GND" to="net.GND" />
      {/* Servo2: PA7 (TIM3_CH2) -> PWM */}
      <trace from=".U1 > .PA7" to=".SERVO2 > .SIG" />
      <trace from=".SERVO2 > .VCC" to="net.VBUS5V" />
      <trace from=".SERVO2 > .GND" to="net.GND" />

      {/* ================================================================ */}
      {/* ===== I2C BUS (MPU6050 + FDC1004) ===== */}
      {/* ================================================================ */}
      {/* STM32 I2C1 pins -> shared bus */}
      <trace from=".U1 > .PB6" to="net.I2C_SCL" />
      <trace from=".U1 > .PB7" to="net.I2C_SDA" />

      {/* I2C pull-ups to 3.3V */}
      <trace from=".R_SCL > .pin1" to="net.VCC3V3" />
      <trace from=".R_SCL > .pin2" to="net.I2C_SCL" />
      <trace from=".R_SDA > .pin1" to="net.VCC3V3" />
      <trace from=".R_SDA > .pin2" to="net.I2C_SDA" />

      {/* MPU6050 I2C + power */}
      <trace from=".U3 > .SCL" to="net.I2C_SCL" />
      <trace from=".U3 > .SDA" to="net.I2C_SDA" />
      <trace from=".U3 > .VDD" to="net.VCC3V3" />
      <trace from=".U3 > .GND" to="net.GND" />
      <trace from=".U3 > .AD0" to="net.GND" />
      <trace from=".U3 > .INT" to=".U1 > .PB5" />
      {/* MPU6050 decoupling */}
      <trace from=".C_IMU1 > .pin1" to="net.VCC3V3" />
      <trace from=".C_IMU1 > .pin2" to="net.GND" />
      <trace from=".C_IMU2 > .pin1" to="net.VCC3V3" />
      <trace from=".C_IMU2 > .pin2" to="net.GND" />

      {/* FDC1004 I2C + power */}
      <trace from=".U4 > .SCL" to="net.I2C_SCL" />
      <trace from=".U4 > .SDA" to="net.I2C_SDA" />
      <trace from=".U4 > .VDD" to="net.VCC3V3" />
      <trace from=".U4 > .GND" to="net.GND" />
      <trace from=".U4 > .ADDR" to="net.GND" />
      {/* FDC1004 decoupling */}
      <trace from=".C_FDC > .pin1" to="net.VCC3V3" />
      <trace from=".C_FDC > .pin2" to="net.GND" />

      {/* ================================================================ */}
      {/* ===== STATUS LED on PC13 ===== */}
      {/* ================================================================ */}
      <trace from=".U1 > .PC13" to=".R_LED > .pin1" />
      <trace from=".R_LED > .pin2" to=".LED1 > .anode" />
      <trace from=".LED1 > .cathode" to="net.GND" />
    </board>,
  )

  // Render and extract circuit JSON
  circuit.render()
  const circuitJson = circuit.getCircuitJson() as any[]

  // ---- Extract all elements by type ----
  const sourceComponents = circuitJson.filter((e) => e.type === "source_component")
  const sourcePorts = circuitJson.filter((e) => e.type === "source_port")
  const sourceNets = circuitJson.filter((e) => e.type === "source_net")
  const sourceTraces = circuitJson.filter((e) => e.type === "source_trace")
  const errors = circuitJson.filter(
    (e) =>
      e.type === "pcb_error" ||
      e.type === "pcb_missing_footprint_error" ||
      e.type === "schematic_error" ||
      e.type === "source_error",
  )

  console.log("\n========================================")
  console.log("  STM32 MOTOR/SENSOR CONTROL CIRCUIT")
  console.log("========================================")
  console.log(`Components:     ${sourceComponents.length}`)
  console.log(`Ports:          ${sourcePorts.length}`)
  console.log(`Nets:           ${sourceNets.length}`)
  console.log(`Source traces:  ${sourceTraces.length}`)
  console.log(`Errors:         ${errors.length}`)

  // Print component list
  console.log("\n--- Components ---")
  for (const comp of sourceComponents) {
    const ports = sourcePorts.filter(
      (p: any) => p.source_component_id === comp.source_component_id,
    )
    console.log(`  ${comp.name}: ${ports.length} pins`)
  }

  // Print errors if any
  if (errors.length > 0) {
    console.log("\n--- Errors ---")
    for (const err of errors) {
      console.log(`  [${err.type}] ${err.message || JSON.stringify(err)}`)
    }
  }

  // ---- Build connectivity map (netlist) ----
  // For each source_trace, find connected ports and nets
  const portById = new Map(sourcePorts.map((p: any) => [p.source_port_id, p]))
  const compById = new Map(sourceComponents.map((c: any) => [c.source_component_id, c]))
  const netById = new Map(sourceNets.map((n: any) => [n.source_net_id, n]))

  // Build net connectivity from subcircuit_connectivity_map_key
  const netConnections: Map<string, Set<string>> = new Map()

  for (const port of sourcePorts) {
    const key = port.subcircuit_connectivity_map_key
    if (key) {
      const comp = compById.get(port.source_component_id)
      const compName = comp?.name || "?"
      const pinName = port.name || port.port_hints?.[0] || "?"
      const label = `${compName}.${pinName}`

      if (!netConnections.has(key)) {
        netConnections.set(key, new Set())
      }
      netConnections.get(key)!.add(label)
    }
  }

  // Try to name nets from source_net names
  const netNameMap: Map<string, string> = new Map()
  for (const net of sourceNets) {
    const key = net.subcircuit_connectivity_map_key
    if (key && net.name) {
      netNameMap.set(key, net.name)
    }
  }

  // Print the full netlist
  console.log("\n========================================")
  console.log("  EXTRACTED NETLIST")
  console.log("========================================")

  const sortedNets = [...netConnections.entries()]
    .filter(([_, pins]) => pins.size > 1)
    .sort(([a], [b]) => {
      const nameA = netNameMap.get(a) || a
      const nameB = netNameMap.get(b) || b
      return nameA.localeCompare(nameB)
    })

  for (const [key, pins] of sortedNets) {
    const netName = netNameMap.get(key) || `(signal_${key.slice(0, 8)})`
    const pinList = [...pins].sort()
    console.log(`\nNET: ${netName}`)
    for (const pin of pinList) {
      console.log(`  - ${pin}`)
    }
  }

  // ---- Verification assertions ----

  // All expected components created
  const expectedComponents = [
    "U1", "U2", "U3", "U4", "J_USB",
    "DRV1", "DRV2", "DRV3", "DRV4",
    "MOT1", "MOT2", "MOT3", "MOT4",
    "SERVO1", "SERVO2",
    "Y1", "LED1",
    "C_Y1", "C_Y2", "C1", "C2", "C3",
    "C_IMU1", "C_IMU2", "C_FDC",
    "C_DRV1", "C_DRV2", "C_DRV3", "C_DRV4",
    "C_MOT1", "C_MOT2", "C_MOT3", "C_MOT4",
    "C_LDO_IN", "C_LDO_OUT",
    "R_SCL", "R_SDA", "R_LED",
  ]
  const compNames = sourceComponents.map((c: any) => c.name)
  for (const name of expectedComponents) {
    expect(compNames).toContain(name)
  }
  console.log(`\nAll ${expectedComponents.length} components verified present.`)

  // No errors
  expect(errors.length).toBe(0)

  // Verify key net connections by checking specific pins appear on same net
  function assertSameNet(pinA: string, pinB: string) {
    let foundTogether = false
    for (const [_, pins] of netConnections) {
      if (pins.has(pinA) && pins.has(pinB)) {
        foundTogether = true
        break
      }
    }
    if (!foundTogether) {
      console.log(`FAIL: ${pinA} and ${pinB} not on same net!`)
    }
    expect(foundTogether).toBe(true)
  }

  console.log("\n--- Verifying critical connections ---")

  // STM32 power
  assertSameNet("U1.VDD1", "U1.VDD2")
  assertSameNet("U1.VDD1", "U1.VDDA")
  assertSameNet("U1.VSS1", "U1.VSS2")
  console.log("  STM32 power rails: OK")

  // I2C bus shared between MPU6050 and FDC1004
  assertSameNet("U1.PB6", "U3.SCL")
  assertSameNet("U1.PB6", "U4.SCL")
  assertSameNet("U1.PB7", "U3.SDA")
  assertSameNet("U1.PB7", "U4.SDA")
  console.log("  I2C bus (MPU6050 + FDC1004 shared): OK")

  // I2C pull-ups
  assertSameNet("R_SCL.pin2", "U3.SCL")
  assertSameNet("R_SDA.pin2", "U3.SDA")
  console.log("  I2C pull-ups: OK")

  // Stepper driver 1 connections
  assertSameNet("U1.PA0", "DRV1.STEP")
  assertSameNet("U1.PA1", "DRV1.DIR")
  assertSameNet("U1.PB0", "DRV1.EN")
  assertSameNet("DRV1.1A", "MOT1.1A")
  assertSameNet("DRV1.2B", "MOT1.2B")
  console.log("  Stepper driver 1 -> Motor 1: OK")

  // Stepper driver 2 connections
  assertSameNet("U1.PA2", "DRV2.STEP")
  assertSameNet("U1.PA3", "DRV2.DIR")
  assertSameNet("DRV2.1A", "MOT2.1A")
  console.log("  Stepper driver 2 -> Motor 2: OK")

  // Stepper driver 3 connections
  assertSameNet("U1.PA8", "DRV3.STEP")
  assertSameNet("U1.PA9", "DRV3.DIR")
  assertSameNet("DRV3.1A", "MOT3.1A")
  console.log("  Stepper driver 3 -> Motor 3: OK")

  // Stepper driver 4 connections
  assertSameNet("U1.PA10", "DRV4.STEP")
  assertSameNet("U1.PA4", "DRV4.DIR")
  assertSameNet("DRV4.1A", "MOT4.1A")
  console.log("  Stepper driver 4 -> Motor 4: OK")

  // Servo connections
  assertSameNet("U1.PA6", "SERVO1.SIG")
  assertSameNet("U1.PA7", "SERVO2.SIG")
  console.log("  Servo PWM signals: OK")

  // USB data
  assertSameNet("J_USB.DM", "U1.PA11")
  assertSameNet("J_USB.DP", "U1.PA12")
  console.log("  USB data lines: OK")

  // Crystal
  assertSameNet("Y1.pin1", "U1.PD0")
  assertSameNet("Y1.pin2", "U1.PD1")
  console.log("  Crystal oscillator: OK")

  // LED
  assertSameNet("U1.PC13", "R_LED.pin1")
  assertSameNet("R_LED.pin2", "LED1.pin1")
  console.log("  Status LED: OK")

  // MPU6050 interrupt
  assertSameNet("U3.INT", "U1.PB5")
  console.log("  IMU interrupt -> PB5: OK")

  console.log("\n========================================")
  console.log("  ALL VERIFICATIONS PASSED")
  console.log("========================================")

  // Generate schematic SVG to confirm visual output works
  const schSvg = await circuit.getSvg({ view: "schematic" })
  expect(typeof schSvg).toBe("string")
  expect(schSvg.length).toBeGreaterThan(100)
  console.log(`\nSchematic SVG: ${schSvg.length} chars`)
})
