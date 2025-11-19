flowchart TD
    A([Goal]):::title --> A1["Design & build a compliant cannabis inventory/traceability platform that integrates with state systems and real-world operations."]

    %% -------------------- CONTEXT --------------------
    A --> B[Context & Origin]
    subgraph BSG["Context & Origin"]
      direction TB
      B1["Seed-to-sale = state-mandated traceability platform"]
      B2["First mandated in Colorado, driven by U.S. DOJ Cole Memo"]
      B3["~14 years of evolution: early manual entry & no APIs → now APIs enable third-party integrations"]
      B4["Tech companies have it as hard or harder than operators due to compliance complexity"]
      B1 --- B2 --- B3 --- B4
    end

    %% -------------------- INTEGRATOR CHALLENGES --------------------
    A --> C[Third-Party Integrator Challenges]
    subgraph CSG["Third-Party Integrator Challenges"]
      direction TB
      C1["Integrate correctly with state traceability (e.g., METRC)"]
      C2["Embed compliance safeguards for each state's unique rules & regs"]
      C3["Choose supply-chain vertical(s) to target (grow, manufacture, distribute, retail)"]
      C1 --- C2 --- C3
    end

    %% -------------------- SUPPLY CHAIN STRUCTURES --------------------
    A --> D[State Supply-Chain Structures]
    subgraph DSG["State Supply-Chain Structures - varies by state"]
      direction TB
      D1[Dual-License Supply Chain]
      D1a["Plant labeled MED vs ADULT at planting → stays separate to final sale<br/>Usually requires two licenses<br/>Rare crossovers via unique workflows"]
      D2[Single Supply Chain]
      D2a["Inventory effectively MED+ADULT until retail sale classifies the transaction<br/>Classification influenced by purchase limits, THC content, etc<br/>Usually does NOT require separate MED & ADULT production licenses"]
      D1 --> D1a
      D2 --> D2a
    end

    %% -------------------- BUSINESS INTERACTION MODELS --------------------
    A --> E[State Business Interaction Models]
    subgraph ESG["How Businesses Can Do Business - by state law"]
      direction TB
      E1["California: Distributor must transport & handle COA testing for partners"]
      E2["MI / CO / MA: Self-distribution often allowed by cultivators/manufacturers<br/>Testing typically within those licenses<br/>In some regimes, testing occurs later at the distribution license"]
      E3["Action: Read statutes, regs, initial bills & rule history to encode legal workflows"]
      E1 --- E2 --- E3
    end

    %% -------------------- KEY TERMS & DATA OBJECTS --------------------
    A --> F[Identifiers, Batches, Serialization & Tagging]
    subgraph FSG["Identifiers, Batches, Serialization & Tagging"]
      direction TB
      F1[METRC Plant Tag]
      F2[METRC Package Tag]
      F3["Unique Identifier (UID): Regulatory term that effectively maps to METRC tags"]
      F4["Harvest Batch: Same variety, harvested at the same time, using same techniques"]
      F5["Production Batch: Manufacturing/processing run using same techniques; homogenized inputs & outputs"]
      F6["Testing Lot(s): Subsets of a batch for testing; multiple lots per harvest batch<br/>Example: 50 lb harvest in OK → 10 lb max per lot ⇒ 5 testing lots"]
      F7["SKU: Product type often tied to a specific batch (even unit level in some systems)"]
      F8["UPC: Universal product code for a product type independent of batch"]
      F1 --- F2 --- F3 --- F4 --- F5 --- F6 --- F7 --- F8
    end

    %% -------------------- COMPLIANCE SAFEGUARDS --------------------
    A --> G[Compliance Requirements to Engineer In]
    subgraph GSG["Compliance Safeguards - must be enforced in software"]
      direction TB
      G1[Purchase Limits & Equivalencies]
      G1a["Equivalencies differ by state; weight-based and/or THC-potency-based"]
      G1b["Units: grams, milligrams, ounces, etc"]
      G1c["Cross-product AND/OR logic (flower vs edibles vs concentrates)"]
      G1d["POS must prevent overselling (instant compliance violations if exceeded)"]
      G2[Tax Configuration & Reporting]
      G2a["Define who collects & who keeps records; encode jurisdictional tax rules"]
      G2b["Best practice: retailer/customer configures tax codes in POS to reduce vendor liability"]
      G3[Testing Reporting & Product Recall Tracking]
      G4[Labels]
      G4a["No overlapping labels; all required info visible to consumer/patient"]
      G4b["Provide multiple label sizes to fit various package forms"]
      G4c["Ambiguity on responsibility → design for adaptability"]
      G1 --> G1a --> G1b --> G1c --> G1d
      G2 --> G2a --> G2b
      G4 --> G4a --> G4b --> G4c
      G3
    end

    %% -------------------- ERP VS CANNABIS SOFTWARE --------------------
    A --> H["True ERP vs Cannabis Software"]
    subgraph HSG["ERP Scope & Positioning"]
      direction TB
      H1["Many cannabis vendors market as ERP—often inaccurate/oversold"]
      H2["Oracle's ERP scope: accounting, procurement, project mgmt, risk mgmt & compliance, AND supply chain operations"]
      H3["Most cannabis tools: mainly supply-chain operations, not full ERP"]
      H1 --- H2 --- H3
    end

    %% -------------------- INTEGRATION STRATEGY --------------------
    A --> I["Integration Strategy (METRC & ERP)"]
    subgraph ISG["Recommended Integration Strategy"]
      direction TB
      I1["Don't target the full supply chain across all states—impractical in practice"]
      I2["Pick a vertical (grow/manufacture/distribute/retail) → achieve depth → expand to other states"]
      I3["METRC API allows recording anything; without guardrails, clients can easily go out of compliance"]
      I4["Passing the METRC API vendor test ≠ compliant. You must implement state-by-state safeguards"]
      I5[Recommended Architecture]
      I5a["Plant-touching cannabis software ↔ METRC (direct, authoritative)"]
      I5b["Cannabis software → ERP (push one-way for centralized business view)"]
      I5c["Avoid telephone integrations (ERP ↔ cannabis software ↔ METRC) that cause drift & API mismatch"]
      I6["Technically you can enter new states with a few API endpoints, but success depends on robust rules engines & safeguards"]
      I1 --- I2 --- I3 --- I4
      I5 --> I5a
      I5 --> I5b
      I5 -.-> I5c
      I4 --- I6
    end

    %% -------------------- DEV CHECKLIST --------------------
    A --> J[Development Checklist]
    subgraph JSG["Development Checklist"]
      direction TB
      J1["Implement: inventory tracking, batch tracking, serialization & tag management"]
      J2["Embed state-specific rules engines for supply-chain structure & business-interaction constraints"]
      J3["Harden POS & workflows for purchase limits, taxes, testing, recalls, and labels"]
      J4["Provide adaptable configuration (units, limits, labeling, tax schemas) per jurisdiction"]
      J1 --- J2 --- J3 --- J4
    end

    %% -------------------- NEXT STEPS --------------------
    A --> K[Outcome & Next Steps]
    K["Engagement model: after ~10 hours, deliver a roadmap to adapt to any state's rules, accelerate market expansion, and get ahead of the hard stuff"]

    classDef title fill:#111,color:#fff,stroke:#444,stroke-width:1;