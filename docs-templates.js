(()=>{
  const ITEMS=[
    {id:'warranty',name:'Commercial Limited Warranty',sub:'Auto-switches 2-Yr New Install vs. 1-Yr Retop'},
    {id:'welcome',name:'Welcome, Care & Compliance Letter',sub:'Pressure washer PSI cap, cleaning & daily care'},
    {id:'atcost',name:'Extended At-Cost Service Addendum',sub:'Years 3-4 or Years 3-5 preferred-rate coverage'},
    {id:'preinstall',name:'Pre-Install Site Readiness Sign-Off',sub:'Moisture gate, access, shaded storage & dock check'},
    {id:'spec',name:'System Technical Specification Sheet',sub:'3/4″ NVM mats, VRP-111 moisture block & wear layers'},
    {id:'spot',name:'Spot Repair & Maintenance Guide',sub:'Keeper inspection checklist & minor scuff protocol'},
    {id:'quest',name:'Preliminary Facility Questionnaire',sub:'Intake form for new zoo bids & retop audits'}
  ];

  function build(id,ctx={}){
    const client=ctx.client||'[Facility / Zoo Name]';
    const room=ctx.room||'[Barn / Enclosure]';
    const date=ctx.date||new Date().toISOString().slice(0,10);
    const isNew=ctx.isNew!==false;
    const psi=ctx.psi||'2,500';
    const atWin=ctx.atCost==='3yr'?'Years 3 through 5 (+3 Full Years post-warranty)':'Years 3 through 4 (bridging to the Year-4 Proactive Retop)';
    const warrTerm=isNew?'TWO (2) YEARS (New Full System Installation)':'ONE (1) YEAR (Structural / Proactive Retop System)';

    if(id==='warranty'){
      return {
        title:`LAY A WEIGH® LIMITED COMMERCIAL WARRANTY — ${client.toUpperCase()}`,
        body:`EFFECTIVE DATE: ${date}\nFACILITY: ${client}\nENCLOSURE / AREA: ${room}\nCOVERAGE TIER: ${warrTerm}\n\n1. COVERAGE SCOPE\nThe Bespoke Renewal, LLC (TBR) warrants the installed Lay A Weigh® engineered zoological flooring system against material formulation failure and adhesive bond delamination for ${warrTerm} from substantial completion.\n\n2. MANDATORY MAINTENANCE & OPERATING CONDITIONS\n- Pressure Washing Limit: Do not exceed ${psi} PSI using a 25° or wider fan tip held at least 12 inches from the surface.\n- Standing Water: Surface must drain freely; prolonged pooled water or blocked drains void moisture-related adhesion coverage.\n- Proactive Retop Cycle: Scheduled top-coat renewal at Year 4 preserves the elastomeric cushion core and extends total system lifecycle.\n\n3. EXCLUSIONS\nThis warranty does not cover third-party structural modifications, subfloor concrete movement/hydrostatic vapor exceeding system design ratings, chemical solvents outside approved veterinary disinfectants, or abnormal mechanical/animal gouging (e.g. heavy steel bucket edges, rooting swine, or unapproved species).\n\n4. REMEDY & CONTACT\nTBR will inspect reported defects and perform warranted material and labor remediation at no charge during the active term.\n\nAuthorized Representative: Seth McNab, COO — The Bespoke Renewal, LLC\nPhone: (254) 265-5275  |  Email: thebespokerenewal@gmail.com`
      };
    }
    if(id==='welcome'){
      return {
        title:`WELCOME & DAILY COMPLIANCE GUIDE — ${client.toUpperCase()}`,
        body:`DATE: ${date}\nFACILITY: ${client}  |  AREA: ${room}\n\nThank you for partnering with The Bespoke Renewal, LLC on your Lay A Weigh® zoological flooring installation. Following these keeper care rules protects your cushion core and keeps your warranty active.\n\n1. CURE & RETURN-TO-SERVICE WINDOW\n- Light keeper foot traffic: 24 hours post-final topcoat (temperature dependent).\n- Full hoofstock / megavertebrate return: 48 to 72 hours minimum.\n\n2. DAILY WASHING & SANITATION\n- Routine rinse: Low-pressure hose and standard AZA-approved neutral veterinary disinfectants.\n- Pressure washer limit: Maximum ${psi} PSI with a 25°-40° fan nozzle kept 12″+ off the floor. Never use a zero-degree or turbo rotary nozzle.\n- Drain clearance: Keep trench and floor drains clear so urine and wash water do not pool long-term.\n\n3. MECHANICAL PROTECTION\n- Use rubber-edged scrapers or polyurethane skid-steer blades whenever moving bedding or manure.\n- Avoid dragging sharp steel pallets, forks, or unpadded metal gates across the wear surface.\n\n4. YEAR-4 PROACTIVE RETOP CHECKPOINT\nWe recommend a quick diagnostic check (rebound & wear-layer inspection) at Year 4 so a light wear-coat refresh keeps the 3/4″ cushion core performing for decades.\n\nSupport Line: Seth McNab, COO | (254) 265-5275 | thebespokerenewal@gmail.com`
      };
    }
    if(id==='atcost'){
      return {
        title:`EXTENDED AT-COST SERVICE ADDENDUM — ${client.toUpperCase()}`,
        body:`EFFECTIVE DATE: ${date}\nFACILITY: ${client}  |  AREA: ${room}\nWINDOW: ${atWin}\n\n1. PREFERRED-CLIENT PROTECTION\nFollowing expiration of the standard Limited Commercial Warranty, The Bespoke Renewal, LLC extends preferred At-Cost Service Protection for ${atWin}, provided the facility maintains documented daily compliance (<= ${psi} PSI wash limit, active drainage, and approved cleaning agents).\n\n2. AT-COST TERMS\nDuring this extended window, any localized surface remediation or structural patch work outside normal wear will be billed strictly at TBR's verified direct material, mobilization, and labor cost (0% commercial markup).\n\n3. PROACTIVE RETOP ELIGIBILITY\nCompleting a scheduled Year-4 wear-layer refresh renews surface protection and extends core cushion life without requiring a full rip-out.\n\nThe Bespoke Renewal, LLC  •  (254) 265-5275  •  thebespokerenewal@gmail.com`
      };
    }
    if(id==='preinstall'){
      return {
        title:`PRE-INSTALLATION SITE READINESS SIGN-OFF — ${client.toUpperCase()}`,
        body:`DATE: ${date}\nFACILITY: ${client}  |  AREA: ${room}\n\nPlease confirm the following site requirements prior to crew mobilization to prevent schedule delays or standby fees:\n\n1. ENCLOSURE VACANCY & DRYING\n[ ] Animals fully relocated for the entire installation and cure window.\n[ ] Floor thoroughly washed and completely dry 48 hours prior to arrival (Tramex concrete reading <= 4.5% / ASTM F1869 MVER verified).\n\n2. SITE ACCESS & LOGISTICS\n[ ] Unobstructed crew access during agreed shift hours (12-hour shifts preferred).\n[ ] Loading dock or forklift available for 4x6 mat pallets & 5-gallon coating pails (or site fee approved).\n[ ] Clean, dry, shaded staging/storage space near the work zone.\n\n3. UTILITIES & VENTILATION\n[ ] 110V/20A dedicated power circuits within 100 ft of work area.\n[ ] Active cross-ventilation / exhaust capability during coating and curing phases.\n[ ] Ambient air and slab temperature maintained between 55°F and 85°F.\n\nFacility Representative Signature: ___________________________   Date: ___________`
      };
    }
    if(id==='spec'){
      return {
        title:`LAY A WEIGH® TECHNICAL SPECIFICATION — ${client.toUpperCase()}`,
        body:`PROJECT: ${client} — ${room}\nDATE: ${date}\n\n1. SYSTEM ARCHITECTURE\n- Cushion Core (Full System): 3/4″ Non-Vulcanized Engineered Mats (4' x 6') bonded directly to prepared concrete via Structural Epoxy (#3 Kit) and Base Polymer Underbed.\n- Moisture Mitigation: Tufflex VRP-111 Epoxy Primer (1-coat up to 10 lb MVER; 2-coat up to 15 lb MVER; Tramex dry gate <= 4.5%).\n- Elastomeric Build: Rubber Base Compound + Base Polymer Wear Layer broadcast with Fine/Rough Rubber Granules & Silica Sand for controlled traction.\n- Finish Coat: Two-component Aliphatic Colorcoat AL topcoat with first-coat accelerator for UV, urine, and washdown durability.\n\n2. FIELD DIAGNOSTIC BENCHMARKS\n- Cushion Elasticity: 4-lb steel ball dropped from 36″ (Fresh Baseline = 16″ rebound; >=11″ viable for structural retop).\n- Acoustic Bond Verification: Full-floor hammer tap audit verifying solid adhesion prior to retop.\n- Pressure Wash Rating: Safe up to ${psi} PSI with wide fan nozzle (12″+ standoff).\n\nThe Bespoke Renewal, LLC | Engineered Zoological Flooring | (254) 265-5275`
      };
    }
    if(id==='spot'){
      return {
        title:`SPOT REPAIR & KEEPER INSPECTION GUIDE — ${client.toUpperCase()}`,
        body:`FACILITY: ${client}  |  AREA: ${room}  |  DATE: ${date}\n\n1. MONTHLY KEEPER WALKTHROUGH (5 MINUTES)\n- Check high-pivot zones (gate thresholds, waterers, feed chutes) for worn topcoat color.\n- Inspect perimeter coves and drain edges for any lifted sealant or standing water.\n- Listen for hollow spots when rolling carts or tapping edges.\n\n2. WHEN TO CALL FOR SPOT MAINTENANCE\nContact TBR early if you see exposed rubber granules, a localized gouge, or drain-edge separation. Catching topcoat wear early prevents moisture from reaching the structural cushion core and saves up to 70% vs. full replacement.\n\n3. INTERIM SAFETY STEPS\n- Keep the damaged spot clean and dry; do not apply store-bought epoxy, silicone, or DRYLOK over Lay A Weigh® coatings (incompatible chemistry will void adhesion).\n- Snap 2 well-lit photos with a tape measure next to the spot and email to thebespokerenewal@gmail.com.\n\nSeth McNab, COO | (254) 265-5275`
      };
    }
    return {
      title:`PRELIMINARY PROJECT QUESTIONNAIRE — ${client.toUpperCase()}`,
      body:`DATE: ${date}\nFACILITY: ${client}  |  BARN / ENCLOSURE: ${room}\n\nTo prepare an accurate commercial proposal without hidden change orders, please share what you know below:\n\n1. ENCLOSURE & SPECIES\n- Species housed (and approximate animal weight): ____________________________\n- Approximate total square footage & number of stalls: ______________________\n- Existing floor condition (bare concrete, existing Lay A Weigh®, other): ____\n\n2. TIMELINE & ACCESS\n- Target install dates / animal relocation window: __________________________\n- Can crews work 12-hour shifts continuously until complete? (Yes / No): _____\n- Forklift / loading dock and dry shaded material staging available? ________\n\n3. MOISTURE & DRAINS\n- Any history of slab moisture, weeping walls, or standing water? ___________\n- Floor drain count & current drainage condition: ___________________________\n\nReply with photos or sketches to: thebespokerenewal@gmail.com | (254) 265-5275`
    };
  }
  window.LAW_DOCS={ITEMS,build};
})();