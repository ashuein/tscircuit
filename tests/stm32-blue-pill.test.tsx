import React from "react"
import { test, expect } from "bun:test"
import { Circuit } from "../dist"

/**
 * STM32F103C8T6 "Blue Pill" evaluation circuit.
 *
 * This test exercises tscircuit's ability to handle a realistic
 * microcontroller circuit with:
 *   - A 48-pin LQFP chip (STM32F103C8T6) with full pin labels
 *   - Decoupling capacitors on VDD/VDDA pins
 *   - An 8 MHz crystal oscillator with load capacitors
 *   - A 3.3 V LDO voltage regulator (AMS1117-3.3)
 *   - A USB type-C connector (simplified 4-pin)
 *   - Three LED indicators with current-limiting resistors
 *   - Net-based power and ground wiring
 */

// ---- STM32F103C8T6 pin map (LQFP-48) ----
const stm32PinLabels = {
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
  pin44: "PB_BOOT0",
  pin45: "PB_UNUSED1",
  pin46: "PB_UNUSED2",
  pin47: "VSS2",
  pin48: "VDD2",
} as const

// ---- AMS1117-3.3 pin map (SOT-223) ----
const ams1117PinLabels = {
  pin1: "GND",
  pin2: "VOUT",
  pin3: "VIN",
} as const

// ---- USB connector (simplified 4-pin) ----
const usbPinLabels = {
  pin1: "VBUS",
  pin2: "DM",
  pin3: "DP",
  pin4: "GND",
} as const

test("STM32F103C8T6 Blue Pill circuit renders to circuit JSON", async () => {
  const circuit = new Circuit()

  circuit.add(
    <board width={80} height={60}>
      {/* ===== Nets ===== */}
      <net name="VCC3V3" />
      <net name="GND" />
      <net name="VBUS5V" />
      <net name="USB_DM" />
      <net name="USB_DP" />
      <net name="OSC_IN" />
      <net name="OSC_OUT" />
      <net name="LED1_NET" />
      <net name="LED2_NET" />
      <net name="LED3_NET" />

      {/* ===== STM32F103C8T6 (LQFP-48) ===== */}
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

      {/* ===== Power: AMS1117-3.3 voltage regulator ===== */}
      <chip
        name="U2"
        footprint="sot223"
        pinLabels={ams1117PinLabels}
        schPinArrangement={{
          leftSide: {
            pins: [3],
            direction: "top-to-bottom" as const,
          },
          rightSide: {
            pins: [2],
            direction: "top-to-bottom" as const,
          },
          bottomSide: {
            pins: [1],
            direction: "left-to-right" as const,
          },
        }}
        pcbX={-25}
        pcbY={0}
      />

      {/* ===== USB connector ===== */}
      <chip
        name="J1"
        footprint="pinrow4"
        pinLabels={usbPinLabels}
        schPinArrangement={{
          leftSide: {
            pins: [1, 2, 3, 4],
            direction: "top-to-bottom" as const,
          },
        }}
        pcbX={-35}
        pcbY={0}
      />

      {/* ===== 8 MHz crystal oscillator ===== */}
      <crystal
        name="Y1"
        frequency="8MHz"
        loadCapacitance="20pF"
        footprint="hc49"
        pcbX={10}
        pcbY={-15}
      />

      {/* Crystal load capacitors */}
      <capacitor name="C_Y1" capacitance="20pF" footprint="0402" pcbX={7} pcbY={-20} />
      <capacitor name="C_Y2" capacitance="20pF" footprint="0402" pcbX={13} pcbY={-20} />

      {/* ===== Decoupling capacitors ===== */}
      {/* VDD1 (pin 24) decoupling */}
      <capacitor name="C1" capacitance="100nF" footprint="0402" pcbX={5} pcbY={8} />
      {/* VDD2 (pin 48) decoupling */}
      <capacitor name="C2" capacitance="100nF" footprint="0402" pcbX={5} pcbY={-8} />
      {/* VDDA (pin 9) decoupling */}
      <capacitor name="C3" capacitance="100nF" footprint="0402" pcbX={-8} pcbY={-8} />
      {/* Bulk capacitor at regulator output */}
      <capacitor name="C4" capacitance="10uF" footprint="0805" pcbX={-20} pcbY={5} />
      {/* Input bulk capacitor */}
      <capacitor name="C5" capacitance="10uF" footprint="0805" pcbX={-30} pcbY={5} />

      {/* ===== LEDs with current-limiting resistors ===== */}
      {/* LED1: Power indicator (green) on VCC3V3 */}
      <resistor name="R1" resistance="1kohm" footprint="0402" pcbX={20} pcbY={15} />
      <led name="LED1" footprint="0603" pcbX={25} pcbY={15} />

      {/* LED2: User LED on PC13 */}
      <resistor name="R2" resistance="1kohm" footprint="0402" pcbX={20} pcbY={20} />
      <led name="LED2" footprint="0603" pcbX={25} pcbY={20} />

      {/* LED3: User LED on PA5 */}
      <resistor name="R3" resistance="1kohm" footprint="0402" pcbX={20} pcbY={25} />
      <led name="LED3" footprint="0603" pcbX={25} pcbY={25} />

      {/* ===== Traces / Connections ===== */}

      {/* --- Power rails --- */}
      {/* Regulator: VIN <- VBUS, VOUT -> VCC3V3, GND -> GND */}
      <trace from=".J1 > .VBUS" to=".U2 > .VIN" />
      <trace from=".U2 > .VOUT" to="net.VCC3V3" />
      <trace from=".U2 > .GND" to="net.GND" />
      <trace from=".J1 > .GND" to="net.GND" />

      {/* USB data lines */}
      <trace from=".J1 > .DM" to=".U1 > .PA11" />
      <trace from=".J1 > .DP" to=".U1 > .PA12" />

      {/* Input cap */}
      <trace from=".C5 > .pin1" to=".J1 > .VBUS" />
      <trace from=".C5 > .pin2" to="net.GND" />

      {/* Output cap */}
      <trace from=".C4 > .pin1" to="net.VCC3V3" />
      <trace from=".C4 > .pin2" to="net.GND" />

      {/* STM32 power pins */}
      <trace from=".U1 > .VDD1" to="net.VCC3V3" />
      <trace from=".U1 > .VDD2" to="net.VCC3V3" />
      <trace from=".U1 > .VDDA" to="net.VCC3V3" />
      <trace from=".U1 > .VBAT" to="net.VCC3V3" />
      <trace from=".U1 > .VSS1" to="net.GND" />
      <trace from=".U1 > .VSS2" to="net.GND" />
      <trace from=".U1 > .VSSA" to="net.GND" />

      {/* Decoupling caps */}
      <trace from=".C1 > .pin1" to="net.VCC3V3" />
      <trace from=".C1 > .pin2" to="net.GND" />
      <trace from=".C2 > .pin1" to="net.VCC3V3" />
      <trace from=".C2 > .pin2" to="net.GND" />
      <trace from=".C3 > .pin1" to="net.VCC3V3" />
      <trace from=".C3 > .pin2" to="net.GND" />

      {/* Crystal connections */}
      <trace from=".Y1 > .pin1" to=".U1 > .PD0" />
      <trace from=".Y1 > .pin2" to=".U1 > .PD1" />
      {/* Load cap 1: crystal pin1 to GND */}
      <trace from=".C_Y1 > .pin1" to=".Y1 > .pin1" />
      <trace from=".C_Y1 > .pin2" to="net.GND" />
      {/* Load cap 2: crystal pin2 to GND */}
      <trace from=".C_Y2 > .pin1" to=".Y1 > .pin2" />
      <trace from=".C_Y2 > .pin2" to="net.GND" />

      {/* LED1: power indicator - VCC3V3 -> R1 -> LED1 -> GND */}
      <trace from=".R1 > .pin1" to="net.VCC3V3" />
      <trace from=".R1 > .pin2" to=".LED1 > .anode" />
      <trace from=".LED1 > .cathode" to="net.GND" />

      {/* LED2: PC13 -> R2 -> LED2 -> GND */}
      <trace from=".U1 > .PC13" to=".R2 > .pin1" />
      <trace from=".R2 > .pin2" to=".LED2 > .anode" />
      <trace from=".LED2 > .cathode" to="net.GND" />

      {/* LED3: PA5 -> R3 -> LED3 -> GND */}
      <trace from=".U1 > .PA5" to=".R3 > .pin1" />
      <trace from=".R3 > .pin2" to=".LED3 > .anode" />
      <trace from=".LED3 > .cathode" to="net.GND" />
    </board>,
  )

  // Render the circuit and collect the JSON output
  circuit.render()
  const circuitJson = circuit.getCircuitJson()

  // ----- Basic sanity checks -----
  expect(circuitJson).toBeTruthy()
  expect(Array.isArray(circuitJson)).toBe(true)

  // Extract element types
  const types = new Set((circuitJson as any[]).map((el: any) => el.type))

  // We expect at least source components and PCB components
  expect(types.has("source_component")).toBe(true)

  // Count source components: U1, U2, J1, Y1, C_Y1, C_Y2, C1-C5, R1-R3, LED1-LED3 = 16
  const sourceComponents = (circuitJson as any[]).filter(
    (el: any) => el.type === "source_component",
  )
  console.log(
    `Source components found: ${sourceComponents.length}`,
  )
  console.log(
    `Component names: ${sourceComponents.map((c: any) => c.name).join(", ")}`,
  )
  expect(sourceComponents.length).toBeGreaterThanOrEqual(10)

  // Check that we have PCB SMT pads (footprint rendering worked)
  const smtPads = (circuitJson as any[]).filter(
    (el: any) => el.type === "pcb_smtpad",
  )
  console.log(`PCB SMT pads: ${smtPads.length}`)
  expect(smtPads.length).toBeGreaterThan(0)

  // Check for source_net elements
  const nets = (circuitJson as any[]).filter(
    (el: any) => el.type === "source_net",
  )
  console.log(`Nets found: ${nets.length}`)
  console.log(`Net names: ${nets.map((n: any) => n.name).join(", ")}`)

  // Check for source_trace elements (our trace wiring)
  const traces = (circuitJson as any[]).filter(
    (el: any) => el.type === "source_trace",
  )
  console.log(`Source traces: ${traces.length}`)

  // Check for any errors in the circuit JSON (including missing footprint errors)
  const errors = (circuitJson as any[]).filter(
    (el: any) =>
      el.type === "pcb_error" ||
      el.type === "pcb_missing_footprint_error" ||
      el.type === "schematic_error" ||
      el.type === "source_error",
  )
  if (errors.length > 0) {
    console.log(`\n=== ERRORS/WARNINGS FOUND (${errors.length}) ===`)
    for (const err of errors) {
      console.log(`  [${err.type}] ${JSON.stringify(err, null, 2)}`)
    }
  } else {
    console.log("\nNo errors in circuit JSON.")
  }

  // Check for pcb_trace elements (actual routed PCB traces)
  const pcbTraces = (circuitJson as any[]).filter(
    (el: any) => el.type === "pcb_trace",
  )
  console.log(`PCB traces (routed): ${pcbTraces.length}`)

  // Check schematic traces
  const schTraces = (circuitJson as any[]).filter(
    (el: any) => el.type === "schematic_trace",
  )
  console.log(`Schematic traces: ${schTraces.length}`)

  // Check that the 48-pin QFP footprint generated the right number of pads
  // U1 should have 48 SMT pads
  const u1Pads = (circuitJson as any[]).filter(
    (el: any) =>
      el.type === "pcb_smtpad" &&
      (circuitJson as any[]).some(
        (comp: any) =>
          comp.type === "pcb_component" &&
          comp.pcb_component_id === el.pcb_component_id &&
          (circuitJson as any[]).some(
            (src: any) =>
              src.type === "source_component" &&
              src.source_component_id === comp.source_component_id &&
              src.name === "U1",
          ),
      ),
  )
  console.log(`U1 (STM32) SMT pads: ${u1Pads.length} (expected 48)`)

  // Print summary of all element types
  const typeCounts: Record<string, number> = {}
  for (const el of circuitJson as any[]) {
    typeCounts[el.type] = (typeCounts[el.type] || 0) + 1
  }
  console.log("\n=== Circuit JSON element type counts ===")
  for (const [type, count] of Object.entries(typeCounts).sort()) {
    console.log(`  ${type}: ${count}`)
  }

  // ---- Try generating SVG output ----
  let schSvgOk = false
  let pcbSvgOk = false

  try {
    const schSvg = await circuit.getSvg({ view: "schematic" })
    schSvgOk = typeof schSvg === "string" && schSvg.length > 100
    console.log(`\nSchematic SVG generated: ${schSvgOk} (${schSvg.length} chars)`)
  } catch (e: any) {
    console.log(`\nSchematic SVG generation failed: ${e.message}`)
  }

  try {
    const pcbSvg = await circuit.getSvg({ view: "pcb" })
    pcbSvgOk = typeof pcbSvg === "string" && pcbSvg.length > 100
    console.log(`PCB SVG generated: ${pcbSvgOk} (${pcbSvg.length} chars)`)
  } catch (e: any) {
    console.log(`PCB SVG generation failed: ${e.message}`)
  }

  // ---- Final evaluation summary ----
  console.log("\n========================================")
  console.log("  STM32 BLUE PILL EVALUATION SUMMARY")
  console.log("========================================")
  console.log(`Components created:        ${sourceComponents.length}/17`)
  console.log(`QFP48 footprint pads:      ${u1Pads.length}/48`)
  console.log(`Total SMT pads:            ${smtPads.length}`)
  console.log(`Plated holes (crystal+J1): ${(circuitJson as any[]).filter((e: any) => e.type === "pcb_plated_hole").length}`)
  console.log(`Nets defined:              ${nets.length}`)
  console.log(`Source traces:             ${traces.length}`)
  console.log(`Schematic traces routed:   ${schTraces.length}/${traces.length}`)
  console.log(`PCB traces routed:         ${pcbTraces.length}/${traces.length}`)
  console.log(`Schematic SVG:             ${schSvgOk ? "OK" : "FAILED"}`)
  console.log(`PCB SVG:                   ${pcbSvgOk ? "OK" : "FAILED"}`)
  console.log(`Errors:                    ${errors.length}`)
  console.log("========================================")
})
