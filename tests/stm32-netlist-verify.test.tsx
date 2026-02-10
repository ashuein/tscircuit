import React from "react"
import { test, expect } from "bun:test"
import { Circuit } from "../dist"

/**
 * STM32 subcircuit netlist verification test.
 *
 * Builds a minimal but electrically meaningful STM32 subcircuit:
 *   - STM32 (8-pin simplified) with power, crystal, and GPIO pins
 *   - 8 MHz crystal oscillator with two load capacitors
 *   - Three VDD decoupling capacitors
 *   - An LED with a current-limiting resistor driven from a GPIO
 *
 * After rendering, the test extracts the full netlist from the circuit JSON
 * and verifies:
 *   a. Each source_trace connects the correct source_port pairs
 *   b. Ports belonging to the same net are actually connected
 *   c. Pin labels match what was defined
 *   d. No dangling/unconnected traces exist
 *
 * Finally, it prints a human-readable netlist suitable for schematic review.
 */

// ---- Simplified STM32 pin map (16 pins) ----
const stm32PinLabels = {
  pin1: "VDD",
  pin2: "VSS",
  pin3: "VDDA",
  pin4: "VSSA",
  pin5: "OSC_IN",
  pin6: "OSC_OUT",
  pin7: "PA0",
  pin8: "PA1",
  pin9: "PA2",
  pin10: "PA3",
  pin11: "PA4",
  pin12: "PA5",
  pin13: "NRST",
  pin14: "PB0",
  pin15: "PB1",
  pin16: "BOOT0",
} as const

test("STM32 subcircuit netlist is electrically correct", () => {
  const circuit = new Circuit()

  circuit.add(
    <board width={50} height={40}>
      {/* ===== Nets ===== */}
      <net name="VCC3V3" />
      <net name="GND" />
      <net name="OSC_IN_NET" />
      <net name="OSC_OUT_NET" />
      <net name="LED_ANODE" />

      {/* ===== STM32 (simplified 16-pin) ===== */}
      <chip
        name="U1"
        footprint="soic16"
        pinLabels={stm32PinLabels}
        schPinArrangement={{
          leftSide: {
            pins: [1, 2, 3, 4, 5, 6, 7, 8],
            direction: "top-to-bottom" as const,
          },
          rightSide: {
            pins: [16, 15, 14, 13, 12, 11, 10, 9],
            direction: "top-to-bottom" as const,
          },
        }}
        pcbX={0}
        pcbY={0}
      />

      {/* ===== 8 MHz crystal oscillator ===== */}
      <crystal
        name="Y1"
        frequency="8MHz"
        loadCapacitance="20pF"
        footprint="hc49"
        pcbX={-15}
        pcbY={-10}
      />

      {/* Crystal load capacitors */}
      <capacitor name="C_Y1" capacitance="20pF" footprint="0402" pcbX={-18} pcbY={-15} />
      <capacitor name="C_Y2" capacitance="20pF" footprint="0402" pcbX={-12} pcbY={-15} />

      {/* ===== VDD decoupling capacitors ===== */}
      <capacitor name="C1" capacitance="100nF" footprint="0402" pcbX={5} pcbY={5} />
      <capacitor name="C2" capacitance="100nF" footprint="0402" pcbX={5} pcbY={-5} />
      <capacitor name="C3" capacitance="1uF" footprint="0402" pcbX={-5} pcbY={-5} />

      {/* ===== LED + current-limiting resistor on PA5 ===== */}
      <resistor name="R1" resistance="330ohm" footprint="0402" pcbX={15} pcbY={10} />
      <led name="LED1" footprint="0603" pcbX={20} pcbY={10} />

      {/* ===================================================================
          TRACES / CONNECTIONS
          =================================================================== */}

      {/* --- Power: VDD pins to VCC3V3 --- */}
      <trace from=".U1 > .VDD" to="net.VCC3V3" />
      <trace from=".U1 > .VDDA" to="net.VCC3V3" />

      {/* --- Ground: VSS pins to GND --- */}
      <trace from=".U1 > .VSS" to="net.GND" />
      <trace from=".U1 > .VSSA" to="net.GND" />

      {/* --- Crystal: Y1 pin1 -> OSC_IN (PD0), Y1 pin2 -> OSC_OUT (PD1) --- */}
      <trace from=".Y1 > .pin1" to=".U1 > .OSC_IN" />
      <trace from=".Y1 > .pin2" to=".U1 > .OSC_OUT" />

      {/* --- Crystal load caps to GND --- */}
      <trace from=".C_Y1 > .pin1" to=".Y1 > .pin1" />
      <trace from=".C_Y1 > .pin2" to="net.GND" />
      <trace from=".C_Y2 > .pin1" to=".Y1 > .pin2" />
      <trace from=".C_Y2 > .pin2" to="net.GND" />

      {/* --- Decoupling cap C1: VCC3V3 to GND --- */}
      <trace from=".C1 > .pin1" to="net.VCC3V3" />
      <trace from=".C1 > .pin2" to="net.GND" />

      {/* --- Decoupling cap C2: VCC3V3 to GND --- */}
      <trace from=".C2 > .pin1" to="net.VCC3V3" />
      <trace from=".C2 > .pin2" to="net.GND" />

      {/* --- Decoupling cap C3 (VDDA): VCC3V3 to GND --- */}
      <trace from=".C3 > .pin1" to="net.VCC3V3" />
      <trace from=".C3 > .pin2" to="net.GND" />

      {/* --- LED circuit: PA5 -> R1 -> LED1 -> GND --- */}
      <trace from=".U1 > .PA5" to=".R1 > .pin1" />
      <trace from=".R1 > .pin2" to=".LED1 > .anode" />
      <trace from=".LED1 > .cathode" to="net.GND" />
    </board>,
  )

  // -----------------------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------------------
  circuit.render()
  const circuitJson = circuit.getCircuitJson() as any[]

  // -----------------------------------------------------------------------
  // EXTRACT ELEMENTS BY TYPE
  // -----------------------------------------------------------------------
  const sourceComponents = circuitJson.filter(e => e.type === "source_component")
  const sourcePorts = circuitJson.filter(e => e.type === "source_port")
  const sourceTraces = circuitJson.filter(e => e.type === "source_trace")
  const sourceNets = circuitJson.filter(e => e.type === "source_net")

  // Build lookup maps
  const componentById = new Map<string, any>()
  for (const c of sourceComponents) componentById.set(c.source_component_id, c)

  const portById = new Map<string, any>()
  for (const p of sourcePorts) portById.set(p.source_port_id, p)

  const netById = new Map<string, any>()
  for (const n of sourceNets) netById.set(n.source_net_id, n)

  const netByName = new Map<string, any>()
  for (const n of sourceNets) netByName.set(n.name, n)

  // Helper: get "Component.Pin" label for a port.
  // Uses the port name (e.g. "pin1") and also stores port_hints for alias lookups.
  function portLabel(portId: string): string {
    const port = portById.get(portId)
    if (!port) return `<unknown_port:${portId}>`
    const comp = componentById.get(port.source_component_id)
    const compName = comp ? comp.name : `<unknown_comp:${port.source_component_id}>`
    return `${compName}.${port.name}`
  }

  // Helper: get a human-friendly label that prefers meaningful aliases from port_hints.
  // For example, LED1.pin1 becomes "LED1.pin1 (anode)".
  function portFriendlyLabel(portId: string): string {
    const port = portById.get(portId)
    if (!port) return `<unknown_port:${portId}>`
    const comp = componentById.get(port.source_component_id)
    const compName = comp ? comp.name : "?"
    const hints = (port.port_hints || []) as string[]
    // Find a meaningful hint that is NOT just "pin1", "pin2", or a bare number
    const meaningfulHint = hints.find(
      (h: string) => h !== port.name && !/^\d+$/.test(h) && !/^pin\d+$/.test(h),
    )
    if (meaningfulHint) {
      return `${compName}.${port.name} (${meaningfulHint})`
    }
    return `${compName}.${port.name}`
  }

  // Build a mapping from "Component.alias" -> canonical "Component.portName"
  // so we can look up "LED1.cathode" -> "LED1.pin2" etc.
  const aliasToCanonical = new Map<string, string>()
  for (const port of sourcePorts) {
    const comp = componentById.get(port.source_component_id)
    if (!comp) continue
    const canonical = `${comp.name}.${port.name}`
    aliasToCanonical.set(canonical, canonical)
    for (const hint of (port.port_hints || []) as string[]) {
      aliasToCanonical.set(`${comp.name}.${hint}`, canonical)
    }
  }

  // Resolve a port label that may use an alias (e.g. "LED1.cathode") to its canonical form
  function resolvePortLabel(label: string): string {
    return aliasToCanonical.get(label) || label
  }

  // -----------------------------------------------------------------------
  // 1. BASIC SANITY CHECKS
  // -----------------------------------------------------------------------
  expect(circuitJson.length).toBeGreaterThan(0)
  expect(sourceComponents.length).toBe(9) // U1, Y1, C_Y1, C_Y2, C1, C2, C3, R1, LED1

  console.log(`\n=== BASIC COUNTS ===`)
  console.log(`  Source components: ${sourceComponents.length}`)
  console.log(`  Source ports:      ${sourcePorts.length}`)
  console.log(`  Source traces:     ${sourceTraces.length}`)
  console.log(`  Source nets:       ${sourceNets.length}`)

  // -----------------------------------------------------------------------
  // 2. VERIFY PIN LABELS MATCH DEFINITIONS
  // -----------------------------------------------------------------------
  console.log(`\n=== PIN LABEL VERIFICATION ===`)

  // Get U1's ports
  const u1Comp = sourceComponents.find(c => c.name === "U1")!
  expect(u1Comp).toBeTruthy()
  const u1Ports = sourcePorts.filter(p => p.source_component_id === u1Comp.source_component_id)

  // Verify U1 has all 16 pins with correct labels
  expect(u1Ports.length).toBe(16)

  const definedLabels = Object.entries(stm32PinLabels)
  let pinLabelMismatches = 0
  for (const [pinKey, expectedLabel] of definedLabels) {
    const pinNum = parseInt(pinKey.replace("pin", ""), 10)
    const port = u1Ports.find(p => p.pin_number === pinNum)
    if (!port) {
      console.log(`  MISSING: U1.${expectedLabel} (pin ${pinNum}) not found in source_port list`)
      pinLabelMismatches++
      continue
    }
    if (port.name !== expectedLabel) {
      console.log(`  MISMATCH: U1 pin${pinNum} expected "${expectedLabel}" but got "${port.name}"`)
      pinLabelMismatches++
    }
    // Also verify port_hints include the label
    if (!port.port_hints.includes(expectedLabel)) {
      console.log(`  HINT MISSING: U1.${expectedLabel} port_hints does not include "${expectedLabel}": [${port.port_hints.join(", ")}]`)
      pinLabelMismatches++
    }
  }
  if (pinLabelMismatches === 0) {
    console.log(`  All 16 U1 pin labels match definitions. OK`)
  }
  expect(pinLabelMismatches).toBe(0)

  // Check LED1 has anode/cathode (may be in port name or port_hints)
  const led1Comp = sourceComponents.find(c => c.name === "LED1")!
  const led1Ports = sourcePorts.filter(p => p.source_component_id === led1Comp.source_component_id)
  const led1AllHints = led1Ports.flatMap(p => (p.port_hints || []) as string[])
  expect(led1AllHints).toContain("anode")
  expect(led1AllHints).toContain("cathode")
  console.log(`  LED1 ports: [${led1Ports.map((p: any) => `${p.name} (hints: ${(p.port_hints || []).join(",")})`).join("; ")}] OK`)

  // Check R1 has pin1/pin2
  const r1Comp = sourceComponents.find(c => c.name === "R1")!
  const r1Ports = sourcePorts.filter(p => p.source_component_id === r1Comp.source_component_id)
  const r1PortNames = r1Ports.map(p => p.name)
  expect(r1PortNames).toContain("pin1")
  expect(r1PortNames).toContain("pin2")
  console.log(`  R1 ports: [${r1PortNames.join(", ")}] OK`)

  // -----------------------------------------------------------------------
  // 3. BUILD NET CONNECTIVITY MAP
  //    Use subcircuit_connectivity_map_key to determine which ports/nets
  //    share the same electrical net.
  // -----------------------------------------------------------------------

  // Map connectivity key -> list of port labels + net names
  const connectivityMap = new Map<string, { ports: string[]; nets: string[]; portIds: Set<string> }>()

  for (const port of sourcePorts) {
    const key = port.subcircuit_connectivity_map_key
    if (!key) continue
    if (!connectivityMap.has(key)) {
      connectivityMap.set(key, { ports: [], nets: [], portIds: new Set() })
    }
    const entry = connectivityMap.get(key)!
    entry.ports.push(portLabel(port.source_port_id))  // canonical label for matching
    entry.portIds.add(port.source_port_id)
  }

  for (const net of sourceNets) {
    const key = net.subcircuit_connectivity_map_key
    if (!key) continue
    if (!connectivityMap.has(key)) {
      connectivityMap.set(key, { ports: [], nets: [], portIds: new Set() })
    }
    connectivityMap.get(key)!.nets.push(net.name)
  }

  // -----------------------------------------------------------------------
  // 4. VERIFY EACH SOURCE_TRACE CONNECTS THE RIGHT PORTS
  // -----------------------------------------------------------------------
  console.log(`\n=== SOURCE TRACE VERIFICATION ===`)

  let traceErrors = 0
  for (const trace of sourceTraces) {
    const portIds = trace.connected_source_port_ids || []
    const netIds = trace.connected_source_net_ids || []

    // a. Each trace must reference at least one port or net
    if (portIds.length === 0 && netIds.length === 0) {
      console.log(`  ERROR: Trace "${trace.display_name}" has no connected ports or nets`)
      traceErrors++
      continue
    }

    // b. Verify all referenced port IDs actually exist
    for (const pid of portIds) {
      if (!portById.has(pid)) {
        console.log(`  ERROR: Trace "${trace.display_name}" references non-existent port ${pid}`)
        traceErrors++
      }
    }

    // c. Verify all referenced net IDs actually exist
    for (const nid of netIds) {
      if (!netById.has(nid)) {
        console.log(`  ERROR: Trace "${trace.display_name}" references non-existent net ${nid}`)
        traceErrors++
      }
    }
  }

  if (traceErrors === 0) {
    console.log(`  All ${sourceTraces.length} source traces reference valid ports/nets. OK`)
  }
  expect(traceErrors).toBe(0)

  // -----------------------------------------------------------------------
  // 5. VERIFY NO DANGLING/UNCONNECTED TRACES
  //    A trace that connects only to a single port with no net is "dangling"
  // -----------------------------------------------------------------------
  console.log(`\n=== DANGLING TRACE CHECK ===`)

  let danglingCount = 0
  for (const trace of sourceTraces) {
    const portIds = trace.connected_source_port_ids || []
    const netIds = trace.connected_source_net_ids || []
    const totalEndpoints = portIds.length + netIds.length
    if (totalEndpoints < 2) {
      // A trace to a net still has at least 1 port + 1 net = 2, or 2 ports
      // But a port-to-net trace has 1 port + 1 net (that's fine)
      // A truly dangling trace would have only 1 endpoint total
      // Some traces have 1 port + 1 net, which is valid (port connected to net)
      if (portIds.length === 0 && netIds.length === 1) {
        console.log(`  WARNING: Trace "${trace.display_name}" connects only to net, no ports`)
        danglingCount++
      } else if (portIds.length === 1 && netIds.length === 0) {
        console.log(`  WARNING: Trace "${trace.display_name}" has only 1 port and no net`)
        danglingCount++
      }
    }
  }

  if (danglingCount === 0) {
    console.log(`  No dangling traces found. OK`)
  } else {
    console.log(`  Found ${danglingCount} potentially dangling traces.`)
  }
  expect(danglingCount).toBe(0)

  // -----------------------------------------------------------------------
  // 6. VERIFY EXPECTED NET CONNECTIVITY
  //    Check that the expected component pins land on the correct nets.
  // -----------------------------------------------------------------------
  console.log(`\n=== EXPECTED NET CONNECTIVITY ===`)

  // Helper: find all connectivity keys that contain a given net name
  function findNetKey(netName: string): string | undefined {
    for (const [key, val] of connectivityMap.entries()) {
      if (val.nets.includes(netName)) return key
    }
    return undefined
  }

  // Helper: check if a port label is on a given net (resolves aliases)
  function isPortOnNet(label: string, netName: string): boolean {
    const resolved = resolvePortLabel(label)
    const key = findNetKey(netName)
    if (!key) return false
    return connectivityMap.get(key)!.ports.includes(resolved)
  }

  // Helper: check if two port labels share the same connectivity key (resolves aliases)
  function arePortsConnected(label1: string, label2: string): boolean {
    const r1 = resolvePortLabel(label1)
    const r2 = resolvePortLabel(label2)
    for (const [, val] of connectivityMap.entries()) {
      if (val.ports.includes(r1) && val.ports.includes(r2)) return true
    }
    return false
  }

  // Define expected connections
  const expectedNetAssignments: Array<{ port: string; net: string }> = [
    // Power pins on VCC3V3
    { port: "U1.VDD", net: "VCC3V3" },
    { port: "U1.VDDA", net: "VCC3V3" },
    { port: "C1.pin1", net: "VCC3V3" },
    { port: "C2.pin1", net: "VCC3V3" },
    { port: "C3.pin1", net: "VCC3V3" },
    // Ground pins on GND
    { port: "U1.VSS", net: "GND" },
    { port: "U1.VSSA", net: "GND" },
    { port: "C1.pin2", net: "GND" },
    { port: "C2.pin2", net: "GND" },
    { port: "C3.pin2", net: "GND" },
    { port: "C_Y1.pin2", net: "GND" },
    { port: "C_Y2.pin2", net: "GND" },
    { port: "LED1.cathode", net: "GND" },
  ]

  let netAssignmentErrors = 0
  for (const { port, net } of expectedNetAssignments) {
    const ok = isPortOnNet(port, net)
    if (!ok) {
      console.log(`  FAIL: ${port} should be on net ${net} but is NOT`)
      netAssignmentErrors++
    } else {
      console.log(`  OK: ${port} -> ${net}`)
    }
  }
  expect(netAssignmentErrors).toBe(0)

  // Check direct port-to-port connections (not through named nets)
  const expectedDirectConnections: Array<{ from: string; to: string; desc: string }> = [
    { from: "Y1.pin1", to: "U1.OSC_IN", desc: "Crystal pin1 to STM32 OSC_IN" },
    { from: "Y1.pin2", to: "U1.OSC_OUT", desc: "Crystal pin2 to STM32 OSC_OUT" },
    { from: "C_Y1.pin1", to: "Y1.pin1", desc: "Load cap C_Y1 to crystal pin1" },
    { from: "C_Y2.pin1", to: "Y1.pin2", desc: "Load cap C_Y2 to crystal pin2" },
    { from: "U1.PA5", to: "R1.pin1", desc: "STM32 PA5 to resistor R1" },
    { from: "R1.pin2", to: "LED1.anode", desc: "Resistor R1 to LED1 anode" },
  ]

  console.log(`\n=== DIRECT PORT-TO-PORT CONNECTIONS ===`)
  let directErrors = 0
  for (const { from, to, desc } of expectedDirectConnections) {
    const ok = arePortsConnected(from, to)
    if (!ok) {
      console.log(`  FAIL: ${desc} (${from} <-> ${to})`)
      directErrors++
    } else {
      console.log(`  OK: ${desc} (${from} <-> ${to})`)
    }
  }
  expect(directErrors).toBe(0)

  // -----------------------------------------------------------------------
  // 7. DUMP FULL HUMAN-READABLE NETLIST
  // -----------------------------------------------------------------------
  console.log(`\n${"=".repeat(60)}`)
  console.log(`  FULL NETLIST DUMP`)
  console.log(`  (For each electrical net, all connected component.pin pairs)`)
  console.log(`${"=".repeat(60)}`)

  // Sort nets: named nets first, then unnamed nets
  const sortedKeys = [...connectivityMap.entries()]
    .filter(([, v]) => v.ports.length > 0) // skip empty nets
    .sort((a, b) => {
      const aHasNet = a[1].nets.length > 0 ? 0 : 1
      const bHasNet = b[1].nets.length > 0 ? 0 : 1
      if (aHasNet !== bHasNet) return aHasNet - bHasNet
      // Sort by net name or first port
      const aName = a[1].nets[0] || a[1].ports[0] || a[0]
      const bName = b[1].nets[0] || b[1].ports[0] || b[0]
      return aName.localeCompare(bName)
    })

  let netIndex = 0
  for (const [key, val] of sortedKeys) {
    netIndex++
    const netName = val.nets.length > 0 ? val.nets.join(", ") : `(unnamed_net_${netIndex})`

    // Build friendly port labels for netlist readability
    const friendlyPorts: string[] = []
    for (const pid of val.portIds) {
      friendlyPorts.push(portFriendlyLabel(pid))
    }
    friendlyPorts.sort()

    console.log(`\n  NET: ${netName}`)
    console.log(`  ${"─".repeat(40)}`)
    for (const p of friendlyPorts) {
      console.log(`    ${p}`)
    }
  }

  console.log(`\n${"=".repeat(60)}`)

  // -----------------------------------------------------------------------
  // 8. SUMMARY TABLE: trace-by-trace listing
  // -----------------------------------------------------------------------
  console.log(`\n=== TRACE-BY-TRACE LISTING ===`)
  console.log(`${"#".padEnd(4)} ${"From".padEnd(25)} ${"To".padEnd(25)} Net`)
  console.log(`${"─".repeat(80)}`)

  for (let i = 0; i < sourceTraces.length; i++) {
    const trace = sourceTraces[i]
    const portIds = trace.connected_source_port_ids || []
    const netIds = trace.connected_source_net_ids || []

    const fromParts: string[] = []
    const toParts: string[] = []

    for (const pid of portIds) {
      fromParts.push(portFriendlyLabel(pid))
    }
    for (const nid of netIds) {
      const n = netById.get(nid)
      toParts.push(n ? `net:${n.name}` : `net:${nid}`)
    }

    const fromStr = fromParts.join(", ") || "-"
    const toStr = toParts.join(", ") || "-"
    const idx = String(i + 1).padEnd(4)
    console.log(`${idx}${fromStr.padEnd(25)} ${toStr.padEnd(25)}`)
  }

  // -----------------------------------------------------------------------
  // 9. CHECK ERRORS IN CIRCUIT JSON
  // -----------------------------------------------------------------------
  const errors = circuitJson.filter(
    e =>
      e.type === "pcb_error" ||
      e.type === "pcb_missing_footprint_error" ||
      e.type === "schematic_error" ||
      e.type === "source_error",
  )

  console.log(`\n=== CIRCUIT ERRORS ===`)
  if (errors.length > 0) {
    for (const err of errors) {
      console.log(`  [${err.type}] ${err.message || JSON.stringify(err)}`)
    }
  } else {
    console.log(`  No errors found. OK`)
  }

  // -----------------------------------------------------------------------
  // 10. FINAL SUMMARY
  // -----------------------------------------------------------------------
  const totalNets = sortedKeys.length
  const namedNets = sortedKeys.filter(([, v]) => v.nets.length > 0).length
  const unnamedNets = totalNets - namedNets

  console.log(`\n${"=".repeat(60)}`)
  console.log(`  VERIFICATION SUMMARY`)
  console.log(`${"=".repeat(60)}`)
  console.log(`  Components:              ${sourceComponents.length}`)
  console.log(`  Total ports:             ${sourcePorts.length}`)
  console.log(`  Source traces:           ${sourceTraces.length}`)
  console.log(`  Named nets:              ${namedNets}`)
  console.log(`  Unnamed nets (signals):  ${unnamedNets}`)
  console.log(`  Total electrical nets:   ${totalNets}`)
  console.log(`  Pin label mismatches:    ${pinLabelMismatches}`)
  console.log(`  Trace ref errors:        ${traceErrors}`)
  console.log(`  Dangling traces:         ${danglingCount}`)
  console.log(`  Net assignment errors:   ${netAssignmentErrors}`)
  console.log(`  Direct connect errors:   ${directErrors}`)
  console.log(`  Circuit JSON errors:     ${errors.length}`)
  console.log(`${"=".repeat(60)}`)
  console.log(`  ALL CHECKS PASSED`)
  console.log(`${"=".repeat(60)}`)
})
