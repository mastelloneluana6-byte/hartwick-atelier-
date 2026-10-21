// ==========================================================================
// HARTWICK ATELIER — APPLICATION CONTROLLER
// Launch-Ready Preview with:
// - Phase 1 (§1 – §7) AND Phase 2 (§8.1 – §8.10) BOTH ACTIVE BY DEFAULT
// - Explicit Brief Number Badges (§1 through §8.10 + Product #01–#66)
// - One-click toggle to show/hide Brief Number Badges
// ==========================================================================

const SQS_CDN = "https://images.squarespace-cdn.com/content/v1/662ec4008fa24077e0d8b6b0/";

const STATE = {
  phase2Enabled: true, // Default TRUE so Phase 1 AND Phase 2 are both visible immediately
  showBriefBadges: true, // Default TRUE so client sees all numbers from the brief list
  currentView: "home",
  currentCollection: "all-apparel",
  techniqueFilter: "ALL", // Phase 2 (§8.8) advanced filter
  currentProductHandle: null,
  selectedSize: "S",
  selectedImageIndex: 0,
  currency: "EUR", // Phase 1 (§5.2): EUR & GBP | Phase 2 (§8.7): adds USD
  shippingRegion: "EU", // Phase 1 (§5.3): EU & UK | Phase 2 (§8.7): adds US
  cart: [],
  wishlist: ["palma-skirt-indigo-khadi", "upaya-handwoven-yoga-mat-turmeric"] // Pre-populated demo items for Phase 2 (§8.4)
};

const CRAFT_GLOSSARY_DATA = {
  "khadi": {
    title: "KHADI & HANDLOOM WEAVING",
    subtitle: "Handspun & Handwoven Without Electricity",
    body: "Khadi is made from handspun and handwoven natural fibers. From the harvest to the yarn on the charkha spinning wheel to the handloom weave, the material is crafted entirely by hand without electricity. It breathes with a supple softness in a rhythm that can only be created by skilled human hands."
  },
  "block-print": {
    title: "16-STEP HAND BLOCK PRINTING",
    subtitle: "Hand-Carved Teakwood Blocks & Mud Resist",
    body: "Using hand carved wooden blocks, Master Printers print each colour layer by layer using ancient resist dyeing techniques. Each piece requires a minimum of 16 processes, with the cloth resting for at least a full day between each step."
  },
  "natural-dye": {
    title: "NATURAL & AYURVEDIC DYES",
    subtitle: "Living Plant, Root & Mineral Alchemy",
    body: "Master Colorists use ancient methods to create natural dyes using indigenous plants and minerals including wild indigo, pomegranate bark and seeds, tamarind, turmeric, jaggery, ash, and fermented iron."
  },
  "zari": {
    title: "GOTA PATTI & JAIPUR GOLDSMITHING",
    subtitle: "Royal Atelier Metalwork & Lapidary Craft",
    body: "Hand-woven metallic Zari threads, Gota Patti ribbon embroidery, and 22k/23k gold settings forged by master stonecutters and goldsmiths in Jaipur."
  }
};

const COLLECTION_META = {
  "all-apparel": {
    title: "Apparel Collection",
    description: "Limited edition garments tailored from handspun and handwoven Khadi, wild silk, and natural dye block prints. Crafted by Master Artisans in small numbered lots."
  },
  "skirts-dresses": {
    title: "Skirts & Dresses",
    description: "Architectural pleats and fluid column silhouettes in handspun Khadi cotton, Matka silk, and 16-step natural dye block prints."
  },
  "shirts-blouses": {
    title: "Shirts & Blouses",
    description: "Heirloom shirtmaking crafted from UNESCO-heritage Jamdani muslin, yarn-dyed Ikat, and handspun silk-linen."
  },
  "trousers": {
    title: "Trousers",
    description: "High-waisted wide-leg and sculptural barrel-leg trousers in heavyweight handloom Khadi twill and double Ikat."
  },
  "coats-accessories": {
    title: "Coats & Accessories",
    description: "Hand-quilted reversible Ikat coats, Gota Patti embroidered silk velvet belts, and natural dye quilted travel bags."
  },
  "lounge": {
    title: "Lounge",
    description: "Ankle-sweeping block-printed robes, organic mulmul pyjama sets, and breathable linen-khadi resort silhouettes."
  },
  "fine-silk": {
    title: "Fine Silk",
    description: "Block printed by hand in natural dye. Each piece requires a minimum of 16 processes, with the mulberry silk resting for at least a day between each step."
  },
  "fine-jewellery": {
    title: "Fine Jewellery",
    description: "Inspired by traditional Indian jewellery, Byzantine and Anatolian archaeology. Handcrafted to order by master stonecutters, stone setters, and goldsmiths in Jaipur in 22k/23k gold and sterling silver."
  },
  "yoga-wellness": {
    title: "Upaya Handwoven Yoga Mats (Phase 2 — §8.9)",
    description: "Handwoven on pit looms in heavyweight organic Khadi and Ikat cotton, infused with medicinal Ayurvedic dyes of turmeric, wild indigo, and Himalayan rose."
  },
  "lot-0325": {
    title: "Lot 0325 — Pre Order",
    description: "Upcoming limited edition artisanal production lot. Reserve your piece prior to loom completion."
  },
  "lot-0924": {
    title: "Lot 0924 — Available in Small Quantities",
    description: "Current atelier edition. Handcrafted in small quantities and ready for immediate dispatch."
  },
  "lot-0324": {
    title: "Lot 0324 — Archive / Sold Out",
    description: "Completed heritage lot. View archival colourways and register via The Dispatch for future re-editions."
  }
};

function formatPrice(product) {
  if (STATE.currency === "GBP") {
    return `£${product.price_gbp.toLocaleString("en-GB")}`;
  }
  if (STATE.currency === "USD") {
    const usd = product.price_usd || Math.round(product.price_eur * 1.09);
    return `$${usd.toLocaleString("en-US")}`;
  }
  return `€${product.price_eur.toLocaleString("en-IE")}`;
}

function formatAmount(eurAmount) {
  if (STATE.currency === "GBP") {
    const gbp = Math.round(eurAmount * 0.855);
    return `£${gbp.toLocaleString("en-GB")}`;
  }
  if (STATE.currency === "USD") {
    const usd = Math.round(eurAmount * 1.09);
    return `$${usd.toLocaleString("en-US")}`;
  }
  return `€${eurAmount.toLocaleString("en-IE")}`;
}

function renderDyeBlockIcon() {
  return `
    <svg class="dye-block-ornament" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.2">
      <rect x="6" y="6" width="36" height="36" />
      <rect x="12" y="12" width="24" height="24" />
      <path d="M24 6V42M6 24H42M12 12L36 36M36 12L12 36" stroke-opacity="0.55"/>
      <circle cx="24" cy="24" r="5" fill="currentColor"/>
    </svg>
  `;
}

// ==========================================================================
// BRIEF BADGE TOGGLE & PHASE 1 / PHASE 2 MODE SWITCHER
// ==========================================================================
function toggleBriefBadges() {
  STATE.showBriefBadges = !STATE.showBriefBadges;
  document.body.classList.toggle("hide-brief-tags", !STATE.showBriefBadges);
  const btn = document.getElementById("badge-toggle-btn");
  if (btn) {
    btn.innerHTML = STATE.showBriefBadges
      ? "✓ Brief Numbers: Visible"
      : "Brief Numbers: Hidden (Click to Show)";
  }
}

function jumpToBriefSection(view, sectionId) {
  if (STATE.currentView !== view) {
    STATE.currentView = view;
    renderApp();
  }
  setTimeout(() => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, 80);
}

function openCartWithDemoItem() {
  if (STATE.cart.length === 0 && window.HARTWICK_PRODUCTS && window.HARTWICK_PRODUCTS.length > 0) {
    const sample = window.HARTWICK_PRODUCTS[0];
    STATE.cart.push({
      key: `${sample.handle}__S`,
      product: sample,
      size: "S",
      qty: 1
    });
    renderHeaderAndFooterNav();
    renderCartDrawer();
  }
  openCartDrawer();
}

function togglePhaseMode() {
  STATE.phase2Enabled = !STATE.phase2Enabled;
  if (!STATE.phase2Enabled) {
    if (STATE.currency === "USD") STATE.currency = "EUR";
    if (STATE.shippingRegion === "US") STATE.shippingRegion = "EU";
    if (["yoga-wellness"].includes(STATE.currentCollection)) {
      STATE.currentCollection = "all-apparel";
    }
    if (["journal", "wholesale", "wishlist"].includes(STATE.currentView)) {
      STATE.currentView = "home";
    }
    STATE.techniqueFilter = "ALL";
  }

  const btn = document.getElementById("phase-toggle-btn");
  if (btn) {
    if (STATE.phase2Enabled) {
      btn.style.background = "#FAF8F4";
      btn.style.color = "#1A1A1A";
      btn.innerHTML = "✦ Phase 1 + Phase 2 Complete (§1–§8.10 Active)";
    } else {
      btn.style.background = "rgba(250,248,244,0.14)";
      btn.style.color = "#FAF8F4";
      btn.innerHTML = "Mode: Phase 1 Only (§1–§7) · Click for Phase 1+2";
    }
  }

  const currSelect = document.getElementById("currency-select");
  if (currSelect) {
    currSelect.innerHTML = `
      <option value="EUR" ${STATE.currency === "EUR" ? "selected" : ""}>EUR (€) [§5.2]</option>
      <option value="GBP" ${STATE.currency === "GBP" ? "selected" : ""}>GBP (£) [§5.2]</option>
      ${STATE.phase2Enabled ? `<option value="USD" ${STATE.currency === "USD" ? "selected" : ""}>USD ($) [§8.7 P2]</option>` : ""}
    `;
  }

  const footerNote = document.getElementById("footer-currency-note");
  if (footerNote) {
    footerNote.innerHTML = STATE.phase2Enabled
      ? "EUR (€) / GBP (£) / USD ($) · EU, UK &amp; US Fulfilment · Atelier Circle Loyalty Active [§5 &amp; §8]"
      : "EUR (€) / GBP (£) · Shopify Payments &amp; Stripe [§5]";
  }

  renderHeaderAndFooterNav();
  renderApp();
  renderCartDrawer();
}

function renderHeaderAndFooterNav() {
  const nav = document.getElementById("primary-nav");
  const actions = document.getElementById("header-actions");
  const footerLinks = document.getElementById("footer-links-list");

  if (nav) {
    nav.innerHTML = `
      <!-- §1.1 Apparel -->
      <div class="nav-item" id="sec-1-nav">
        <button class="nav-link" onclick="navigateTo('collection', 'all-apparel')">
          <span class="brief-tag">§1.1</span>
          <span>Apparel</span>
          <span class="nav-caret">▾</span>
        </button>
        <div class="nav-dropdown">
          <button class="nav-dropdown__link" onclick="navigateTo('collection', 'all-apparel')">All Apparel (#01–#38)</button>
          <div class="nav-dropdown__divider"></div>
          <button class="nav-dropdown__link" onclick="navigateTo('collection', 'skirts-dresses')">Skirts &amp; Dresses (#01–#10)</button>
          <button class="nav-dropdown__link" onclick="navigateTo('collection', 'shirts-blouses')">Shirts &amp; Blouses (#11–#20)</button>
          <button class="nav-dropdown__link" onclick="navigateTo('collection', 'trousers')">Trousers (#21–#26)</button>
          <button class="nav-dropdown__link" onclick="navigateTo('collection', 'coats-accessories')">Coats &amp; Accessories (#27–#32, #64)</button>
          <button class="nav-dropdown__link" onclick="navigateTo('collection', 'lounge')">Lounge (#33–#38)</button>
        </div>
      </div>

      <!-- §1.2 Fine Silk -->
      <div class="nav-item">
        <button class="nav-link" onclick="navigateTo('collection', 'fine-silk')">
          <span class="brief-tag">§1.2</span>
          <span>Fine Silk</span>
        </button>
      </div>

      <!-- §1.3 Fine Jewellery -->
      <div class="nav-item">
        <button class="nav-link" onclick="navigateTo('collection', 'fine-jewellery')">
          <span class="brief-tag">§1.3</span>
          <span>Fine Jewellery</span>
        </button>
      </div>

      ${STATE.phase2Enabled ? `
        <!-- Phase 2 (§8.9): Upaya Yoga Mats -->
        <div class="nav-item">
          <button class="nav-link" onclick="navigateTo('collection', 'yoga-wellness')">
            <span class="brief-tag brief-tag--phase2">§8.9 P2</span>
            <span>Yoga</span>
          </button>
        </div>
      ` : ""}

      <!-- §1.4 About -->
      <div class="nav-item">
        <button class="nav-link" onclick="navigateTo('our-story')">
          <span class="brief-tag">§1.4</span>
          <span>About</span>
          <span class="nav-caret">▾</span>
        </button>
        <div class="nav-dropdown">
          <button class="nav-dropdown__link" onclick="navigateTo('the-masters')">[§1.4] The Masters</button>
          <button class="nav-dropdown__link" onclick="navigateTo('our-story')">[§1.4] Our Story</button>
          <button class="nav-dropdown__link" onclick="navigateTo('contact')">[§1.4] Contact</button>
          <div class="nav-dropdown__divider"></div>
          <button class="nav-dropdown__link" onclick="navigateTo('size-guide')">[§1.4] Size Guide</button>
          ${STATE.phase2Enabled ? `
            <div class="nav-dropdown__divider"></div>
            <button class="nav-dropdown__link" onclick="navigateTo('journal')">[§8.2 P2] Editorial Journal</button>
            <button class="nav-dropdown__link" onclick="navigateTo('wholesale')">[§8.5 P2] Wholesale Portal</button>
          ` : ""}
        </div>
      </div>
    `;
  }

  if (actions) {
    const totalQty = STATE.cart.reduce((sum, i) => sum + i.qty, 0);
    actions.innerHTML = `
      ${STATE.phase2Enabled ? `
        <button class="header-action-btn" onclick="navigateTo('wishlist')">
          <span class="brief-tag brief-tag--phase2">§8.4</span>
          <span>Wishlist (${STATE.wishlist.length})</span>
        </button>
        <button class="header-action-btn" onclick="navigateTo('wholesale')">
          <span class="brief-tag brief-tag--phase2">§8.5</span>
          <span>Wholesale</span>
        </button>
      ` : `
        <button class="header-action-btn" onclick="navigateTo('size-guide')">
          <span>Size Guide</span>
        </button>
      `}
      <button class="header-action-btn" onclick="openCartDrawer()">
        <span class="brief-tag">§5</span>
        <span>Bag</span>
        <span class="cart-count-badge" id="header-cart-count">${totalQty}</span>
      </button>
    `;
  }

  if (footerLinks) {
    footerLinks.innerHTML = `
      <li><button onclick="navigateTo('our-story')">[§2.10] About</button></li>
      <li><button onclick="navigateTo('the-masters')">[§2.10] The Masters</button></li>
      <li><button onclick="navigateTo('returns-policy')">[§5.4] Returns Policy</button></li>
      <li><button onclick="navigateTo('size-guide')">[§2.10] Size Guide</button></li>
      ${STATE.phase2Enabled ? `
        <li><button onclick="navigateTo('journal')">[§8.2 Phase 2] Editorial Journal</button></li>
        <li><button onclick="navigateTo('wholesale')">[§8.5 Phase 2] Wholesale Portal</button></li>
      ` : ""}
      <li><a href="https://instagram.com/worldofhartwickatelier" target="_blank" rel="noopener">[§2.8] Instagram</a></li>
    `;
  }
}

// ==========================================================================
// NAVIGATION & VIEW ROUTING
// ==========================================================================
function navigateTo(view, param = null) {
  STATE.currentView = view;
  if (view === "collection" && param) {
    STATE.currentCollection = param;
    STATE.techniqueFilter = "ALL";
  }
  if (view === "pdp" && param) {
    STATE.currentProductHandle = param;
    STATE.selectedSize = "S";
    STATE.selectedImageIndex = 0;
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
  renderApp();
}

// ==========================================================================
// VIEW 1: HOMEPAGE (SECTION 2 — VERBATIM 10-SECTION FLOW + PHASE 2 SHOWCASE)
// ==========================================================================
function renderHomepage() {
  const instaImages = [
    SQS_CDN + "1733585356963-UYLAKZUX9O52IES83CEB/image-asset.jpeg",
    SQS_CDN + "1733488725000-SFRNNDKSPFCYU7THM4ON/image-asset.jpeg",
    SQS_CDN + "1733404646238-6DFVWRQK127JQXRXTCF4/image-asset.jpeg",
    SQS_CDN + "1733315961132-BXS83LCLHP8HFRS0UW5U/image-asset.jpeg",
    SQS_CDN + "1733072083541-3INMHHH42J953X5CQKLM/image-asset.jpeg",
    SQS_CDN + "1732837504744-NKP83FQYX3ZPQVXXC6Z1/image-asset.jpeg"
  ];

  const phase2Products = window.HARTWICK_PRODUCTS.filter(p => p.phase === 2);

  return `
    <!-- SECTION 2.1 — HERO -->
    <section class="hero-section" id="sec-2-1-hero">
      <div class="brief-tag brief-tag--float">Brief §2.1 — Hero (Full-Bleed Image · "LIMITED EDITION COLLECTIONS" · No Button Overlay)</div>
      <img
        id="hero-parallax-img"
        class="hero-section__img"
        src="${SQS_CDN}647043be-fcc2-4ccd-a1ed-902e681194c4/156_HARTWICK_EDITORIAL_PARIS.jpg"
        alt="Hartwick Atelier Limited Edition Collections"
      />
      <div class="hero-section__overlay">
        <img
          class="hero-section__crest"
          src="${SQS_CDN}7c12511b-32bf-4ec2-aa52-d3644b321b72/Hartwick_logo_PlainFrame_Square_SansAtelier+white.png"
          alt="Hartwick Atelier Crest"
        />
        <h1 class="hero-section__title">LIMITED EDITION COLLECTIONS</h1>
      </div>
      <div class="hero-scroll-indicator" aria-hidden="true">
        <div class="hero-scroll-indicator__line"></div>
      </div>
    </section>

    <!-- SECTION 2.2 — BRAND STATEMENT (Verbatim Copy) -->
    <section class="brand-statement reveal-on-scroll" id="sec-2-2-statement">
      <div class="brief-section-banner">
        <span class="brief-tag">Brief §2.2 — Brand Statement &amp; Natural Dye Block Icon</span>
      </div>
      ${renderDyeBlockIcon()}
      <p class="brand-statement__lead">
        “Textile history dates back to the beginning of human civilization.”
      </p>
      <p class="brand-statement__body reveal-on-scroll reveal-delay-1">
        Hartwick Atelier specializes in hand spun and handwoven fabrics, natural and ayurvedic dyes, and exquisite heritage handwork. These artisanal techniques rely on rare knowledge and the natural cycles of the earth.
      </p>
      <p class="brand-statement__body reveal-on-scroll reveal-delay-2">
        Each handcrafted piece in the collection is a glimpse into the rich history, intricate process and generations of skill that have gone into its creation.
      </p>
    </section>

    <!-- SECTION 2.3 — FOUR PILLARS -->
    <section class="four-pillars" id="sec-2-3-pillars">
      <div class="brief-section-banner">
        <span class="brief-tag">Brief §2.3 — Four Pillars (Text Block I–IV)</span>
      </div>
      <div class="four-pillars__inner">
        <div class="pillar-card reveal-on-scroll">
          <span class="pillar-card__num">I · [§2.3.1]</span>
          <h3 class="pillar-card__title">Handspun and Handwoven Fabrics.</h3>
        </div>
        <div class="pillar-card reveal-on-scroll reveal-delay-1">
          <span class="pillar-card__num">II · [§2.3.2]</span>
          <h3 class="pillar-card__title">Natural and Ayurvedic Dyes.</h3>
        </div>
        <div class="pillar-card reveal-on-scroll reveal-delay-2">
          <span class="pillar-card__num">III · [§2.3.3]</span>
          <h3 class="pillar-card__title">Exquisite Heritage Handwork.</h3>
        </div>
        <div class="pillar-card reveal-on-scroll reveal-delay-3">
          <span class="pillar-card__num">IV · [§2.3.4]</span>
          <h3 class="pillar-card__title">Finely Tailored, Heirloom Quality.</h3>
        </div>
      </div>
    </section>

    <!-- SECTION 2.4 — THE FEEL -->
    <section class="the-feel" id="sec-2-4-feel">
      <div class="the-feel__media luxury-img-reveal reveal-on-scroll">
        <span class="brief-tag brief-tag--float">Brief §2.4 — The Feel</span>
        <img
          src="${SQS_CDN}3a6786b9-45ce-459e-83cb-4bee1d2e3554/184_HARTWICK_STYLE_FABRIC4R1A8940.jpg"
          alt="Handspun and handwoven natural fibres"
        />
      </div>
      <div class="the-feel__content reveal-on-scroll reveal-delay-2">
        <span class="brief-tag" style="margin-bottom:14px">Brief §2.4 — Verbatim Quote</span>
        <span class="section-eyebrow">The Tactile Experience</span>
        <blockquote class="the-feel__quote">
          “Wearing handspun and handwoven fabric has a different feeling than wearing industrially produced fabrics; handwoven natural fibres drape and breathe with a supple softness in a rhythm that can only be created by a human hand. The feeling is truly luxurious.”
        </blockquote>
      </div>
    </section>

    <!-- SECTION 2.5 — COLLECTIONS / LOT STATUS -->
    <section class="lot-status-section" id="sec-2-5-lots">
      <div class="lot-status__inner">
        <div class="lot-status__header reveal-on-scroll">
          <div class="brief-section-banner">
            <span class="brief-tag">Brief §2.5 — Collections / Lot Status (3 Lot Tiles) &amp; §3 Catalog (#01–#66)</span>
          </div>
          <span class="section-eyebrow">Edition Availability</span>
          <h2 class="lot-status__title">COLLECTIONS · LOT STATUS</h2>
        </div>
        <div class="lot-status__grid">
          <article class="lot-tile reveal-on-scroll" onclick="navigateTo('collection', 'lot-0325')">
            <div class="lot-tile__img-wrap">
              <span class="brief-tag brief-tag--float">§2.5.1 — Lot 0325 (Pre Order)</span>
              <img src="${SQS_CDN}b1d05e6b-5963-48ff-b979-b69939b7698d/002HARTWICK_HANDWOVEN_IKAT_MARYLEBONE_COAT_LONDON-2.jpg" alt="Lot 0325" />
            </div>
            <div class="lot-tile__body">
              <div class="lot-tile__top">
                <h3 class="lot-tile__name">Lot 0325</h3>
                <span class="lot-badge lot-badge--preorder">Pre Order</span>
              </div>
              <p class="lot-tile__desc">Hand-quilted Ikat outerwear, Matka silk tailoring, and new Jaipur goldsmith editions.</p>
              <span class="lot-tile__cta">Explore Lot 0325 →</span>
            </div>
          </article>

          <article class="lot-tile reveal-on-scroll reveal-delay-1" onclick="navigateTo('collection', 'lot-0924')">
            <div class="lot-tile__img-wrap">
              <span class="brief-tag brief-tag--float">§2.5.2 — Lot 0924 (Available)</span>
              <img src="${SQS_CDN}0f9d2225-1884-49cd-83e8-e835a79aaf42/002_HARTWICK_HANDWOVEN_PALMA_SKIRT_KHADI_PRAGUE_SHIRT_NATURALDYE_COTTONFIELDS.jpg" alt="Lot 0924" />
            </div>
            <div class="lot-tile__body">
              <div class="lot-tile__top">
                <h3 class="lot-tile__name">Lot 0924</h3>
                <span class="lot-badge lot-badge--available">Available in Small Quantities</span>
              </div>
              <p class="lot-tile__desc">Signature Khadi shirts, pleated skirts, wide-leg twill trousers, and 16-step block-printed silks.</p>
              <span class="lot-tile__cta">Explore Lot 0924 →</span>
            </div>
          </article>

          <article class="lot-tile reveal-on-scroll reveal-delay-2" onclick="navigateTo('collection', 'lot-0324')">
            <div class="lot-tile__img-wrap">
              <span class="brief-tag brief-tag--float">§2.5.3 — Lot 0324 (Sold Out)</span>
              <img src="${SQS_CDN}d034acf8-b744-4456-8aa3-88769320fafc/033_HARTWICK_EDITORIAL_TATLAYOKO.jpg" alt="Lot 0324" />
            </div>
            <div class="lot-tile__body">
              <div class="lot-tile__top">
                <h3 class="lot-tile__name">Lot 0324</h3>
                <span class="lot-badge lot-badge--soldout">Sold Out</span>
              </div>
              <p class="lot-tile__desc">Inaugural archival lot crafted in small batches with natural indigo and madder root.</p>
              <span class="lot-tile__cta">View Archive Lot →</span>
            </div>
          </article>
        </div>

        <div style="text-align:center;margin-top:42px;display:flex;justify-content:center;gap:16px;flex-wrap:wrap">
          <button class="btn-primary" onclick="navigateTo('collection', 'all-apparel')">
            [§3] View Full Catalog (#01–#66 Products) →
          </button>
          <button class="btn-outline" onclick="navigateTo('pdp', 'palma-skirt-indigo-khadi')">
            [§4.1–§4.10 &amp; §7] Inspect Product Page Template →
          </button>
        </div>
      </div>
    </section>

    <!-- SECTION 2.6 — CRAFT DETAIL (Image + Text Panels) -->
    <section class="craft-detail-section" id="sec-2-6-craft">
      <div class="brief-section-banner">
        <span class="brief-tag">Brief §2.6 — Craft Detail (Panel 1: Natural Dye · Panel 2: 16-Step Block Printing)</span>
      </div>
      <div class="craft-panel">
        <div class="craft-panel__media luxury-img-reveal reveal-on-scroll">
          <span class="brief-tag brief-tag--float">§2.6.1 — Natural Dye Panel</span>
          <img
            src="${SQS_CDN}9fa64956-028e-4a2c-aae7-8ba0e194e764/088_HARTWICK_FINESILK_PETITSQUARE01_SCARF_NATURALDYE_BLOCKPRINT.jpg"
            alt="Natural Dye Craft"
          />
        </div>
        <div class="craft-panel__text reveal-on-scroll reveal-delay-1">
          <span class="section-eyebrow">Heritage Alchemy</span>
          <h2 class="craft-panel__title">Natural Dye</h2>
          <p class="craft-panel__copy">
            “Master Colorists use ancient methods to create natural dyes using indigenous plants and minerals including wild indigo, pomegranate bark and seeds, tamarind, turmeric, jaggery, ash, and iron.”
          </p>
          <button class="btn-outline" onclick="navigateTo('the-masters')">Discover The Masters</button>
        </div>
      </div>

      <div class="craft-panel craft-panel--reverse">
        <div class="craft-panel__media luxury-img-reveal reveal-on-scroll">
          <span class="brief-tag brief-tag--float">§2.6.2 — Block Printing Panel</span>
          <img
            src="${SQS_CDN}643566b4-c934-4030-922c-ec6f24a25e06/218_HARTWICK_FINESILK_LARGESQUARE_SCARF_NATURALDYE_BLOCKPRINT.jpg"
            alt="Hand Carved Wooden Block Printing"
          />
        </div>
        <div class="craft-panel__text reveal-on-scroll reveal-delay-1">
          <span class="section-eyebrow">Sixteen Processes</span>
          <h2 class="craft-panel__title">Block Printing</h2>
          <p class="craft-panel__copy">
            “Using hand carved wooden blocks, Master Printers print each colour, layer by layer using resist dyeing techniques… Each piece requires a minimum of 16 processes, with the silk resting for at least a day between each step.”
          </p>
          <button class="btn-outline" onclick="navigateTo('collection', 'fine-silk')">Explore Fine Silk</button>
        </div>
      </div>
    </section>

    <!-- SECTION 2.7 — FOUNDER QUOTE -->
    <section class="founder-quote-section" id="sec-2-7-founder">
      <div class="founder-quote__inner reveal-on-scroll">
        <div class="brief-section-banner">
          <span class="brief-tag">Brief §2.7 — Founder Quote (Angela Hartwick)</span>
        </div>
        ${renderDyeBlockIcon()}
        <blockquote class="founder-quote__text">
          “Hartwick Atelier is the culmination of decades of world travel as creatives in fashion and film. At first glance, it's an elegant lifestyle brand with a distinct character and gorgeous texture. But at its roots, each collection is a portrait of nature and sustainability through refined handcraft. It's an analogue love story.”
        </blockquote>
        <p class="founder-quote__author">— Angela Hartwick, Founder and Creative Director</p>
      </div>
    </section>

    ${STATE.phase2Enabled ? `
      <!-- SECTION 8 — PHASE 2 COMPLETE SCOPE SHOWCASE (§8.1 – §8.10 VISIBLY INTEGRATED) -->
      <section class="phase2-showcase-section" id="sec-8-phase2">
        <div class="phase2-showcase__inner">
          <div class="brief-section-banner">
            <span class="brief-tag brief-tag--phase2">Brief §8.1 – §8.10 — Phase 2 Complete Scope (All 10 Features Live &amp; Interactive)</span>
          </div>
          <div style="text-align:center;max-width:820px;margin:0 auto">
            <span class="section-eyebrow">Phase 1 + Phase 2 Complete Build</span>
            <h2 style="font-family:var(--font-serif);font-size:clamp(1.7rem,2.6vw,2.4rem);font-weight:400;letter-spacing:0.06em;margin-bottom:12px">
              PHASE 2 MODULES &amp; EXPANDED ARCHIVE (§8.1 – §8.10)
            </h2>
            <p style="color:var(--text-secondary);font-size:15px">
              Click any numbered Phase 2 module below to test it live, or explore the 6 Phase 2 products (#61–#66) right below.
            </p>
          </div>

          <div class="phase2-grid">
            <div class="phase2-card" onclick="openCraftGlossaryModal('block-print')">
              <div>
                <span class="brief-tag brief-tag--phase2" style="margin-bottom:10px">§8.1 Phase 2</span>
                <h3 style="font-family:var(--font-serif);font-size:18px;margin-bottom:6px">Craft Glossary Annotations</h3>
                <p style="font-size:13px;color:var(--text-secondary)">Interactive pop-up definitions linking product fabric techniques to The Masters.</p>
              </div>
              <span style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;text-decoration:underline">Test Modal →</span>
            </div>

            <div class="phase2-card" onclick="navigateTo('journal')">
              <div>
                <span class="brief-tag brief-tag--phase2" style="margin-bottom:10px">§8.2 Phase 2</span>
                <h3 style="font-family:var(--font-serif);font-size:18px;margin-bottom:6px">Editorial Blog / Journal</h3>
                <p style="font-size:13px;color:var(--text-secondary)">"The Analogue Journal" — long-form stories from the dye vats and handlooms.</p>
              </div>
              <span style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;text-decoration:underline">Open Journal →</span>
            </div>

            <div class="phase2-card" onclick="navigateTo('pdp', 'palma-skirt-indigo-khadi')">
              <div>
                <span class="brief-tag brief-tag--phase2" style="margin-bottom:10px">§8.3 Phase 2</span>
                <h3 style="font-family:var(--font-serif);font-size:18px;margin-bottom:6px">Atelier Circle Loyalty</h3>
                <p style="font-size:13px;color:var(--text-secondary)">Automatic loyalty points calculation (2 pts per €1) on every Product Page &amp; Bag.</p>
              </div>
              <span style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;text-decoration:underline">View on PDP →</span>
            </div>

            <div class="phase2-card" onclick="navigateTo('wishlist')">
              <div>
                <span class="brief-tag brief-tag--phase2" style="margin-bottom:10px">§8.4 Phase 2</span>
                <h3 style="font-family:var(--font-serif);font-size:18px;margin-bottom:6px">Wishlist Functionality</h3>
                <p style="font-size:13px;color:var(--text-secondary)">Save pieces with ♥ on any collection card or PDP to your personal Wishlist.</p>
              </div>
              <span style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;text-decoration:underline">Open Wishlist (${STATE.wishlist.length}) →</span>
            </div>

            <div class="phase2-card" onclick="navigateTo('wholesale')">
              <div>
                <span class="brief-tag brief-tag--phase2" style="margin-bottom:10px">§8.5 Phase 2</span>
                <h3 style="font-family:var(--font-serif);font-size:18px;margin-bottom:6px">B2B Wholesale Portal</h3>
                <p style="font-size:13px;color:var(--text-secondary)">Private showroom login and Lot 0325 wholesale line-sheets for international buyers.</p>
              </div>
              <span style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;text-decoration:underline">Open Portal →</span>
            </div>

            <div class="phase2-card" onclick="openSizeRecommendationModal()">
              <div>
                <span class="brief-tag brief-tag--phase2" style="margin-bottom:10px">§8.6 Phase 2</span>
                <h3 style="font-family:var(--font-serif);font-size:18px;margin-bottom:6px">Size Recommendation Tool</h3>
                <p style="font-size:13px;color:var(--text-secondary)">Interactive measurement calculator recommending XS–XL based on height &amp; waist.</p>
              </div>
              <span style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;text-decoration:underline">Try Calculator →</span>
            </div>

            <div class="phase2-card" onclick="changeCurrency('USD');openCartWithDemoItem()">
              <div>
                <span class="brief-tag brief-tag--phase2" style="margin-bottom:10px">§8.7 Phase 2</span>
                <h3 style="font-family:var(--font-serif);font-size:18px;margin-bottom:6px">US Shipping &amp; USD ($)</h3>
                <p style="font-size:13px;color:var(--text-secondary)">Full USD ($) pricing and United States DHL Express shipping zone in Checkout.</p>
              </div>
              <span style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;text-decoration:underline">Test USD &amp; US Bag →</span>
            </div>

            <div class="phase2-card" onclick="navigateTo('collection', 'all-apparel')">
              <div>
                <span class="brief-tag brief-tag--phase2" style="margin-bottom:10px">§8.8 Phase 2</span>
                <h3 style="font-family:var(--font-serif);font-size:18px;margin-bottom:6px">Craft &amp; Fabric Filter</h3>
                <p style="font-size:13px;color:var(--text-secondary)">Filter any collection by Khadi, Ikat, Block Print, Jamdani, or Silk.</p>
              </div>
              <span style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;text-decoration:underline">Try Filter →</span>
            </div>

            <div class="phase2-card" onclick="navigateTo('collection', 'yoga-wellness')">
              <div>
                <span class="brief-tag brief-tag--phase2" style="margin-bottom:10px">§8.9 Phase 2</span>
                <h3 style="font-family:var(--font-serif);font-size:18px;margin-bottom:6px">Upaya Yoga Mats</h3>
                <p style="font-size:13px;color:var(--text-secondary)">Dedicated Yoga category with Ayurvedic-dyed handloom mats (#61–#63).</p>
              </div>
              <span style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;text-decoration:underline">View Yoga Mats →</span>
            </div>

            <div class="phase2-card" onclick="navigateTo('pdp', 'corsica-coat-raw-tussar-silk')">
              <div>
                <span class="brief-tag brief-tag--phase2" style="margin-bottom:10px">§8.10 Phase 2</span>
                <h3 style="font-family:var(--font-serif);font-size:18px;margin-bottom:6px">Archive &amp; Draft SKUs</h3>
                <p style="font-size:13px;color:var(--text-secondary)">Includes Corsica Coat (#64), Shayla 01 Headscarf (#65), and Rich Ribbons (#66).</p>
              </div>
              <span style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;text-decoration:underline">Inspect #64–#66 →</span>
            </div>
          </div>

          <!-- Direct Preview of the 6 Phase 2 Products (#61–#66) -->
          <div style="margin-top:48px">
            <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:22px;flex-wrap:wrap;gap:12px">
              <h3 style="font-family:var(--font-serif);font-size:22px;font-weight:400">
                Phase 2 Catalog Additions — Products #61 to #66 <span class="brief-tag brief-tag--phase2" style="margin-left:8px">§8.9 &amp; §8.10</span>
              </h3>
              <button class="btn-outline" style="padding:10px 20px" onclick="navigateTo('collection', 'yoga-wellness')">
                View Upaya Yoga Collection →
              </button>
            </div>
            <div class="product-grid">
              ${phase2Products.map(product => `
                <article class="product-card" onclick="navigateTo('pdp', '${product.handle}')">
                  <div class="product-card__media">
                    <div class="product-card__badges">
                      <span class="brief-tag brief-tag--phase2">Product #${String(product.catalogNumber).padStart(2, "0")} · Phase 2</span>
                      <span class="badge-pill">${product.lot}</span>
                    </div>
                    <img class="product-card__img product-card__img--primary" src="${product.images[0]}" alt="${product.title}" loading="lazy" />
                    <img class="product-card__img product-card__img--secondary" src="${product.images[1] || product.images[0]}" alt="${product.title}" loading="lazy" />
                  </div>
                  <div class="product-card__info">
                    <h2 class="product-card__title">${product.title}</h2>
                    <p class="product-card__expression">${product.commercial_expression}</p>
                    <p class="product-card__price">${formatPrice(product)}</p>
                  </div>
                </article>
              `).join("")}
            </div>
          </div>
        </div>
      </section>
    ` : ""}

    <!-- SECTION 2.8 — INSTAGRAM FEED (@HARTWICKATELIER) -->
    <section class="instagram-section" id="sec-2-8-insta">
      <div class="brief-section-banner">
        <span class="brief-tag">Brief §2.8 — Instagram Feed (@HARTWICKATELIER Visual Grid)</span>
      </div>
      <div class="instagram-section__header reveal-on-scroll">
        <div>
          <span class="section-eyebrow">Visual Journal</span>
          <h2 class="instagram-section__title">Follow the Atelier</h2>
        </div>
        <a href="https://instagram.com/worldofhartwickatelier" target="_blank" rel="noopener" class="instagram-section__handle">
          @HARTWICKATELIER
        </a>
      </div>
      <div class="instagram-grid">
        ${instaImages.map((src, i) => `
          <a href="https://instagram.com/worldofhartwickatelier" target="_blank" rel="noopener" class="instagram-item reveal-on-scroll reveal-delay-${(i % 4) + 1}">
            <img src="${src}" alt="Hartwick Atelier Instagram ${i + 1}" loading="lazy" />
          </a>
        `).join("")}
      </div>
    </section>

    <!-- SECTION 2.9 — THE DISPATCH NEWSLETTER SIGNUP (KLAVIYO) -->
    <section class="dispatch-section" id="sec-2-9-dispatch">
      <div class="dispatch-section__inner reveal-on-scroll">
        <div class="brief-section-banner">
          <span class="brief-tag">Brief §2.9 &amp; §6.1 — "The Dispatch" Newsletter Signup (Klaviyo Double Opt-In)</span>
        </div>
        <span class="section-eyebrow">Newsletter</span>
        <h2 class="dispatch-section__title">The Dispatch</h2>
        <p class="dispatch-section__sub">Sign up to receive news and updates from Hartwick Atelier</p>
        <form class="dispatch-form" onsubmit="handleNewsletterSubmit(event, 'homepage-dispatch-msg')">
          <input
            type="email"
            class="dispatch-form__input"
            placeholder="Enter your email address"
            required
            aria-label="Email address"
          />
          <button type="submit" class="dispatch-form__btn">Subscribe</button>
        </form>
        <div id="homepage-dispatch-msg" class="dispatch-feedback"></div>
      </div>
    </section>
  `;
}

// ==========================================================================
// VIEW 2: COLLECTION PAGE (SECTION 3 & PHASE 2 §8.8)
// ==========================================================================
function setTechniqueFilter(tech) {
  STATE.techniqueFilter = tech;
  renderApp();
}

function toggleWishlist(e, handle) {
  e.stopPropagation();
  if (STATE.wishlist.includes(handle)) {
    STATE.wishlist = STATE.wishlist.filter(h => h !== handle);
  } else {
    STATE.wishlist.push(handle);
  }
  renderHeaderAndFooterNav();
  renderApp();
}

function renderCollectionPage() {
  const meta = COLLECTION_META[STATE.currentCollection] || COLLECTION_META["all-apparel"];

  let pool = window.HARTWICK_PRODUCTS.filter(p => STATE.phase2Enabled || p.phase === 1);

  let filtered = pool;
  if (STATE.currentCollection === "all-apparel") {
    filtered = pool.filter(p =>
      ["skirts-dresses", "shirts-blouses", "trousers", "coats-accessories", "lounge"].includes(p.category)
    );
  } else if (STATE.currentCollection === "lot-0325") {
    filtered = pool.filter(p => p.lot === "Lot 0325");
  } else if (STATE.currentCollection === "lot-0924") {
    filtered = pool.filter(p => p.lot === "Lot 0924");
  } else if (STATE.currentCollection === "lot-0324") {
    filtered = pool.filter(p => p.lot === "Lot 0324");
  } else {
    filtered = pool.filter(p => p.category === STATE.currentCollection);
  }

  // Phase 2 (§8.8): Advanced Filtering by Fabric / Technique
  if (STATE.phase2Enabled && STATE.techniqueFilter !== "ALL") {
    filtered = filtered.filter(p =>
      (p.fabric_technique + " " + p.commercial_expression).toLowerCase().includes(STATE.techniqueFilter.toLowerCase())
    );
  }

  const apparelTabs = [
    { id: "all-apparel", label: "All Apparel (#01–#38)" },
    { id: "skirts-dresses", label: "Skirts & Dresses (#01–#10)" },
    { id: "shirts-blouses", label: "Shirts & Blouses (#11–#20)" },
    { id: "trousers", label: "Trousers (#21–#26)" },
    { id: "coats-accessories", label: "Coats & Accessories (#27–#32, #64)" },
    { id: "lounge", label: "Lounge (#33–#38)" },
    { id: "fine-silk", label: "Fine Silk (#39–#46, #65–#66)" },
    { id: "fine-jewellery", label: "Fine Jewellery (#47–#60)" },
    ...(STATE.phase2Enabled ? [{ id: "yoga-wellness", label: "Upaya Yoga Mats (#61–#63) [§8.9 P2]" }] : [])
  ];

  const techniqueOptions = ["ALL", "Khadi", "Ikat", "Block Print", "Jamdani", "Silk"];

  return `
    <div class="collection-view view-enter">
      <header class="collection-header reveal-on-scroll">
        <div class="brief-section-banner">
          <span class="brief-tag">Brief §3.1 – §3.3 — Collection Page (3-Col Grid · 3:4 Portrait · Title + Commercial Expression + Price)</span>
        </div>
        <span class="section-eyebrow">Hartwick Atelier Collection</span>
        <h1 class="collection-header__title">${meta.title}</h1>
        <p class="collection-header__desc">${meta.description}</p>
      </header>

      <nav class="collection-tabs" aria-label="Collection Categories">
        ${apparelTabs.map(tab => `
          <button
            class="collection-tab ${STATE.currentCollection === tab.id ? "active" : ""}"
            onclick="navigateTo('collection', '${tab.id}')"
          >
            ${tab.label}
          </button>
        `).join("")}
      </nav>

      ${STATE.phase2Enabled ? `
        <div style="background:var(--bg-secondary);padding:16px 22px;margin-bottom:28px;border:1px solid var(--border-subtle);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
          <span style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:var(--text-primary)">
            <span class="brief-tag brief-tag--phase2" style="margin-right:8px">Brief §8.8 — Phase 2</span>
            Filter by Craft &amp; Fabric Technique:
          </span>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            ${techniqueOptions.map(t => `
              <button
                onclick="setTechniqueFilter('${t}')"
                style="background:${STATE.techniqueFilter === t ? "var(--text-primary)" : "transparent"};color:${STATE.techniqueFilter === t ? "var(--bg-primary)" : "var(--text-primary)"};border:1px solid var(--text-primary);padding:5px 12px;font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;cursor:pointer"
              >
                ${t === "ALL" ? "All Techniques" : t}
              </button>
            `).join("")}
          </div>
        </div>
      ` : ""}

      <div class="collection-toolbar">
        <span>Showing <strong>${filtered.length}</strong> numbered pieces (Click any card to inspect Brief §4.1–§4.10)</span>
        <span>Lot Filter [§2.5]:
          <button class="collection-tab" style="margin-left:10px" onclick="navigateTo('collection', 'lot-0325')">Lot 0325</button> ·
          <button class="collection-tab" onclick="navigateTo('collection', 'lot-0924')">Lot 0924</button> ·
          <button class="collection-tab" onclick="navigateTo('collection', 'lot-0324')">Lot 0324</button>
        </span>
      </div>

      <div class="product-grid">
        ${filtered.map((product, idx) => {
          const isSoldOut = product.status === "Sold Out";
          const isPreOrder = product.status === "Pre Order";
          const secondaryImg = product.images[1] || product.images[0];
          const delayClass = `reveal-delay-${(idx % 3) + 1}`;
          const inWishlist = STATE.wishlist.includes(product.handle);
          const numStr = String(product.catalogNumber || idx + 1).padStart(2, "0");

          return `
            <article class="product-card reveal-on-scroll ${delayClass}" onclick="navigateTo('pdp', '${product.handle}')">
              <div class="product-card__media">
                <div class="product-card__badges">
                  <span class="brief-tag ${product.phase === 2 ? "brief-tag--phase2" : ""}">
                    #${numStr} ${product.phase === 2 ? "· Phase 2 [§8]" : "· Phase 1 [§3]"}
                  </span>
                  <span class="badge-pill">${product.lot}</span>
                  ${isSoldOut ? `<span class="badge-pill badge-pill--soldout">Sold Out</span>` : ""}
                  ${isPreOrder ? `<span class="badge-pill">Pre Order</span>` : ""}
                </div>
                ${STATE.phase2Enabled ? `
                  <button
                    onclick="toggleWishlist(event, '${product.handle}')"
                    title="Save to Wishlist (Brief §8.4 Phase 2)"
                    style="position:absolute;bottom:14px;right:14px;z-index:3;width:36px;height:36px;border-radius:50%;background:rgba(250,248,244,0.94);border:1px solid var(--border-strong);cursor:pointer;font-size:15px;display:flex;align-items:center;justify-content:center"
                  >
                    ${inWishlist ? "♥" : "♡"}
                  </button>
                ` : ""}
                <img
                  class="product-card__img product-card__img--primary"
                  src="${product.images[0]}"
                  alt="${product.title}"
                  loading="lazy"
                />
                <img
                  class="product-card__img product-card__img--secondary"
                  src="${secondaryImg}"
                  alt="${product.title} alternate view"
                  loading="lazy"
                />
              </div>
              <div class="product-card__info">
                <h2 class="product-card__title"><span class="brief-tag" style="margin-right:4px">§3.2</span>${product.title}</h2>
                <p class="product-card__expression">${product.commercial_expression}</p>
                <p class="product-card__price">
                  ${formatPrice(product)}
                  ${isSoldOut ? " — <span style='color:var(--text-muted);text-transform:uppercase;font-size:11px;letter-spacing:0.12em'>Sold Out</span>" : ""}
                </p>
              </div>
            </article>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

// ==========================================================================
// VIEW 3: PRODUCT DETAIL PAGE (SECTION 4.1–4.10 & SECTION 7 EXACT ORDER)
// ==========================================================================
function openCraftGlossaryModal(key) {
  const entry = CRAFT_GLOSSARY_DATA[key] || CRAFT_GLOSSARY_DATA["khadi"];
  const body = document.getElementById("phase2-modal-body");
  const backdrop = document.getElementById("phase2-modal-backdrop");
  if (body && backdrop) {
    body.innerHTML = `
      <span class="brief-tag brief-tag--phase2" style="margin-bottom:10px">Brief §8.1 — Phase 2 Linked Master Craft Glossary</span>
      <span class="section-eyebrow">Heritage Technique Annotation</span>
      <h3 style="font-family:var(--font-serif);font-size:26px;font-weight:400;margin-bottom:6px">${entry.title}</h3>
      <p style="font-family:var(--font-serif);font-style:italic;font-size:16px;color:var(--text-secondary);margin-bottom:18px">${entry.subtitle}</p>
      <p style="font-size:15px;line-height:1.8;color:var(--text-secondary);margin-bottom:24px">${entry.body}</p>
      <button class="btn-outline" onclick="closePhase2Modal();navigateTo('the-masters')">View Full Masters Glossary →</button>
    `;
    backdrop.classList.add("open");
  }
}

function openSizeRecommendationModal() {
  const body = document.getElementById("phase2-modal-body");
  const backdrop = document.getElementById("phase2-modal-backdrop");
  if (body && backdrop) {
    body.innerHTML = `
      <span class="brief-tag brief-tag--phase2" style="margin-bottom:10px">Brief §8.6 — Phase 2 Interactive Size Recommendation Tool</span>
      <span class="section-eyebrow">Interactive Fit Assistant</span>
      <h3 style="font-family:var(--font-serif);font-size:26px;font-weight:400;margin-bottom:14px">Find Your Hartwick Size</h3>
      <p style="font-size:14px;color:var(--text-secondary);margin-bottom:20px">Enter your measurements for an instant silhouette-specific recommendation (XS–XL).</p>
      <div class="form-group">
        <label>Height (cm)</label>
        <input type="number" id="size-calc-height" class="form-control" value="170" />
      </div>
      <div class="form-group">
        <label>Natural Waist (cm)</label>
        <input type="number" id="size-calc-waist" class="form-control" value="71" />
      </div>
      <button class="btn-primary" style="width:100%" onclick="calculateRecommendedSize()">Calculate My Size</button>
      <div id="size-calc-result" class="dispatch-feedback" style="margin-top:16px"></div>
    `;
    backdrop.classList.add("open");
  }
}

function calculateRecommendedSize() {
  const waist = parseInt(document.getElementById("size-calc-waist")?.value || "71", 10);
  let rec = "S";
  if (waist < 67) rec = "XS";
  else if (waist <= 72) rec = "S";
  else if (waist <= 78) rec = "M";
  else if (waist <= 84) rec = "L";
  else rec = "XL";

  STATE.selectedSize = rec;
  const res = document.getElementById("size-calc-result");
  if (res) {
    res.innerHTML = `Recommended Hartwick Atelier Size: <strong>Size ${rec}</strong> (Selected automatically on product page).`;
  }
  renderApp();
}

function closePhase2Modal() {
  const backdrop = document.getElementById("phase2-modal-backdrop");
  if (backdrop) backdrop.classList.remove("open");
}

function renderProductPage() {
  const product = window.HARTWICK_PRODUCTS.find(p => p.handle === STATE.currentProductHandle) || window.HARTWICK_PRODUCTS[0];
  const isSoldOut = product.status === "Sold Out";
  const inWishlist = STATE.wishlist.includes(product.handle);
  const numStr = String(product.catalogNumber || 1).padStart(2, "0");

  const rec1 = window.HARTWICK_PRODUCTS.find(p => p.handle === product.featured_product_1) || window.HARTWICK_PRODUCTS[1];
  const rec2 = window.HARTWICK_PRODUCTS.find(p => p.handle === product.featured_product_2) || window.HARTWICK_PRODUCTS[2];

  const activeImage = product.images[STATE.selectedImageIndex] || product.images[0];

  return `
    <div class="pdp-view view-enter">
      <div class="brief-section-banner">
        <span class="brief-tag">Brief §4.1 – §4.10 &amp; §7 — Product Page Exact Field Order + All Custom Metafields (Product #${numStr} of 66)</span>
      </div>

      <nav class="pdp-breadcrumb">
        <button onclick="navigateTo('home')">Home</button>
        <span>/</span>
        <button onclick="navigateTo('collection', '${product.category}')">${product.category.replace("-", " & ")}</button>
        <span>/</span>
        <span>#${numStr} ${product.title}</span>
      </nav>

      <div class="pdp-layout">
        <!-- Left Column: Portrait Gallery -->
        <div class="pdp-gallery">
          <div class="pdp-thumbnails">
            ${product.images.map((img, idx) => `
              <div
                class="pdp-thumb ${idx === STATE.selectedImageIndex ? "active" : ""}"
                onclick="selectPdpImage(${idx})"
              >
                <img src="${img}" alt="${product.title} thumbnail ${idx + 1}" />
              </div>
            `).join("")}
          </div>
          <div class="pdp-main-image" style="position:relative">
            <span class="brief-tag brief-tag--float">Catalog #${numStr} · ${product.lot}</span>
            <img src="${activeImage}" alt="${product.title}" />
          </div>
        </div>

        <!-- Right Column: Exact Order from Section 4 of Brief (4.1 through 4.10) -->
        <div class="pdp-details">
          <div class="pdp-subtitle-meta">
            <span>${product.subtitle} · ${product.lot}</span>
            <span>${product.status}</span>
          </div>

          <!-- 4.1 Product Title (large, UPPERCASE) -->
          <div style="margin-bottom:4px">
            <span class="brief-tag">Brief §4.1 — Product Title (UPPERCASE)</span>
          </div>
          <h1 class="pdp-title">${product.title}</h1>

          <!-- 4.2 Commercial Expression — italic label directly below the title, above the fold -->
          <div style="margin-bottom:4px">
            <span class="brief-tag">Brief §4.2 — Metafield: custom.commercial_expression (Above the Fold)</span>
          </div>
          <p class="pdp-commercial-expression">
            ${product.commercial_expression}
            ${STATE.phase2Enabled ? `
              <button
                onclick="openCraftGlossaryModal('${product.craft_glossary_key || "khadi"}')"
                style="display:inline-flex;align-items:center;gap:4px;margin-left:10px;background:var(--bg-secondary);border:1px solid var(--text-primary);padding:3px 10px;font-family:var(--font-sans);font-style:normal;font-size:9.5px;letter-spacing:0.14em;text-transform:uppercase;cursor:pointer"
              >
                <span class="brief-tag brief-tag--phase2">§8.1 P2</span> Explore Craft Glossary
              </button>
            ` : ""}
          </p>

          <!-- 4.3 Price -->
          <div style="margin-bottom:4px">
            <span class="brief-tag">Brief §4.3 — Price (${STATE.currency})</span>
            ${STATE.phase2Enabled ? `<span class="brief-tag brief-tag--phase2" style="margin-left:6px">§8.3 — Atelier Circle Loyalty</span>` : ""}
          </div>
          <div class="pdp-price-row">
            <span class="pdp-price">${formatPrice(product)}</span>
            <span style="font-size:12px;color:var(--text-muted)">
              ${STATE.phase2Enabled
                ? `✦ Earn ${product.price_eur * 2} Atelier Circle Loyalty Points [§8.3]`
                : "Taxes included · EU &amp; UK duties calculated at checkout"}
            </span>
          </div>

          <!-- 4.4 Size Selector (XS S M L XL as separate variants) -->
          <div class="pdp-size-block">
            <div style="margin-bottom:6px">
              <span class="brief-tag">Brief §4.4 — Size Selector (Separate Variants XS–XL with Unique SKU)</span>
            </div>
            <div class="pdp-size-header">
              <span>Size: <strong>${STATE.selectedSize}</strong> <span style="color:var(--text-muted);font-weight:400;margin-left:8px">(SKU: ${product.sku}-${STATE.selectedSize})</span></span>
              <div style="display:flex;gap:14px;align-items:center">
                ${STATE.phase2Enabled ? `
                  <button class="size-guide-trigger" onclick="openSizeRecommendationModal()">
                    <span class="brief-tag brief-tag--phase2">§8.6 P2</span> Find My Size
                  </button>
                ` : ""}
                <button class="size-guide-trigger" onclick="navigateTo('size-guide')">Size Guide</button>
              </div>
            </div>
            <div class="pdp-sizes">
              ${product.sizes.map(size => `
                <button
                  type="button"
                  class="size-option-btn ${STATE.selectedSize === size ? "active" : ""}"
                  onclick="selectPdpSize('${size}')"
                >
                  ${size}
                </button>
              `).join("")}
            </div>
          </div>

          <!-- 4.5 Short Description — colorway story paragraph -->
          <div class="pdp-short-description">
            <div style="margin-bottom:6px">
              <span class="brief-tag">Brief §4.5 — Metafield: custom.short_description (Colorway Story)</span>
            </div>
            <strong style="display:block;font-size:10.5px;letter-spacing:0.16em;text-transform:uppercase;margin-bottom:4px;color:var(--text-primary)">Colorway Story</strong>
            ${product.short_description}
          </div>

          <!-- 4.6 Add to Cart Button (+ Phase 2 §8.4 Wishlist Button) -->
          <div style="margin-bottom:6px">
            <span class="brief-tag">Brief §4.6 — Add to Cart Button</span>
            ${STATE.phase2Enabled ? `<span class="brief-tag brief-tag--phase2" style="margin-left:6px">§8.4 — Save to Wishlist</span>` : ""}
          </div>
          <div style="display:flex;gap:12px;margin-bottom:32px">
            <button
              type="button"
              class="btn-primary pdp-atc-btn"
              style="margin-bottom:0;flex:1"
              ${isSoldOut ? "disabled" : ""}
              onclick="addToCart('${product.handle}')"
            >
              ${isSoldOut ? "Sold Out — Archive Piece" : (product.status === "Pre Order" ? `Pre-Order Now — ${formatPrice(product)}` : `Add to Bag — ${formatPrice(product)}`)}
            </button>
            ${STATE.phase2Enabled ? `
              <button
                type="button"
                class="btn-outline"
                onclick="toggleWishlist(event, '${product.handle}')"
                title="Save to Wishlist (Brief §8.4 Phase 2)"
              >
                ${inWishlist ? "♥ Saved" : "♡ Wishlist"}
              </button>
            ` : ""}
          </div>

          <!-- 4.7 Long Description — silhouette/product story -->
          <div class="pdp-long-description">
            <div style="margin-bottom:6px">
              <span class="brief-tag">Brief §4.7 — Long Description (Silhouette &amp; Product Story)</span>
            </div>
            <p>${product.long_description}</p>
          </div>

          <!-- 4.8 & 4.10 Accordions: "How it fits" & "Materials & Craft" -->
          <div class="pdp-accordions">
            <div class="accordion-item open" id="acc-fit">
              <button class="accordion-trigger" onclick="toggleAccordion('acc-fit')">
                <span><span class="brief-tag" style="margin-right:8px">Brief §4.8</span> How It Fits (custom.fit_label &amp; custom.fit_bullets)</span>
                <span class="accordion-icon">+</span>
              </button>
              <div class="accordion-content">
                <p><strong>${product.fit_label}</strong></p>
                <ul class="fit-bullets">
                  ${product.fit_bullets.map(b => `<li>${b}</li>`).join("")}
                </ul>
              </div>
            </div>

            <div class="accordion-item open" id="acc-craft">
              <button class="accordion-trigger" onclick="toggleAccordion('acc-craft')">
                <span><span class="brief-tag" style="margin-right:8px">Brief §4.10</span> Materials &amp; Craft (fabric_technique · fibre · origin)</span>
                <span class="accordion-icon">+</span>
              </button>
              <div class="accordion-content">
                <dl class="meta-table">
                  <dt>Fabric Technique</dt>
                  <dd>
                    ${product.fabric_technique}
                    ${STATE.phase2Enabled ? `
                      <button onclick="openCraftGlossaryModal('${product.craft_glossary_key || "khadi"}')" style="background:none;border:none;text-decoration:underline;cursor:pointer;font-size:12px;margin-left:6px">
                        [§8.1 Read Master Glossary →]
                      </button>
                    ` : ""}
                  </dd>
                  <dt>Fibre</dt>
                  <dd>${product.fibre}</dd>
                  <dt>Origin</dt>
                  <dd>${product.origin}</dd>
                  <dt>Care</dt>
                  <dd>Gentle cold hand wash with pH-neutral soap or eco dry clean. Dry in shade to preserve natural plant pigments.</dd>
                </dl>
              </div>
            </div>
          </div>

          <!-- 4.9 & Section 7 "Wear it with" — 2 Featured Product Cards -->
          <div class="wear-it-with">
            <div style="margin-bottom:8px">
              <span class="brief-tag">Brief §4.9 &amp; §7.1 — "Wear It With" Cross-Sell (custom.featured_product_1 &amp; 2)</span>
            </div>
            <h3 class="wear-it-with__title">Wear it with</h3>
            <div class="wear-it-with__grid">
              ${[rec1, rec2].map((rec, i) => `
                <article class="look-card" onclick="navigateTo('pdp', '${rec.handle}')">
                  <div class="look-card__img" style="position:relative">
                    <span class="brief-tag brief-tag--float">featured_product_${i + 1}</span>
                    <img src="${rec.images[0]}" alt="${rec.title}" />
                  </div>
                  <div class="look-card__info">
                    <h4 class="look-card__name">${rec.title}</h4>
                    <p class="look-card__expr">${rec.commercial_expression}</p>
                    <p class="look-card__price">${formatPrice(rec)}</p>
                  </div>
                </article>
              `).join("")}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ==========================================================================
// PHASE 2 VIEWS: JOURNAL / BLOG (§8.2), WHOLESALE PORTAL (§8.5), WISHLIST (§8.4)
// ==========================================================================
function renderJournalPage() {
  return `
    <div class="editorial-page view-enter">
      <header class="editorial-hero reveal-on-scroll">
        <div class="brief-section-banner">
          <span class="brief-tag brief-tag--phase2">Brief §8.2 — Phase 2 Editorial Blog / Journal</span>
        </div>
        <span class="section-eyebrow">Phase 2 Roadmap · Editorial Journal</span>
        <h1 class="editorial-hero__title">The Analogue Journal</h1>
        <p class="editorial-hero__lead">
          Field notes from the dye vats of Kutch, the handlooms of Bengal, and the stonecutters of Jaipur.
        </p>
      </header>
      <div class="masters-grid">
        <article class="master-entry reveal-on-scroll">
          <div class="master-entry__img">
            <img src="${SQS_CDN}d034acf8-b744-4456-8aa3-88769320fafc/033_HARTWICK_EDITORIAL_TATLAYOKO.jpg" alt="Editorial Journal" />
          </div>
          <div class="master-entry__body">
            <span class="section-eyebrow">Issue 01 · Monsoon &amp; Indigo</span>
            <h2 class="master-entry__title">SIXTEEN DAYS OF REST</h2>
            <p class="master-entry__sub">Why Our Block-Printed Silks Cannot Be Rushed</p>
            <p>Between each of the 16 wooden block impressions, our mulberry silk rests for a full day to allow natural wild indigo, pomegranate rind, and iron mordants to bind with the protein fibre in open air.</p>
          </div>
        </article>
        <article class="master-entry reveal-on-scroll">
          <div class="master-entry__img">
            <img src="${SQS_CDN}3a6786b9-45ce-459e-83cb-4bee1d2e3554/184_HARTWICK_STYLE_FABRIC4R1A8940.jpg" alt="Charkha Spinning" />
          </div>
          <div class="master-entry__body">
            <span class="section-eyebrow">Issue 02 · The Rhythm of the Charkha</span>
            <h2 class="master-entry__title">ZERO ELECTRICITY, INFINITE SOUL</h2>
            <p class="master-entry__sub">Inside Our Master Weavers’ Guilds</p>
            <p>Every metre of Hartwick Atelier Khadi is spun by hand and woven on wooden pit looms without electricity, creating a breathable micro-climate against the skin.</p>
          </div>
        </article>
      </div>
    </div>
  `;
}

function renderWholesalePage() {
  return `
    <div class="editorial-page view-enter">
      <header class="editorial-hero reveal-on-scroll">
        <div class="brief-section-banner">
          <span class="brief-tag brief-tag--phase2">Brief §8.5 — Phase 2 B2B Wholesale Portal</span>
        </div>
        <span class="section-eyebrow">Phase 2 Roadmap · B2B Buyer Access</span>
        <h1 class="editorial-hero__title">Wholesale Portal</h1>
        <p class="editorial-hero__lead">
          Private digital showroom and Lot 0325 wholesale line-sheets for authorised international boutiques and galleries.
        </p>
      </header>
      <div class="contact-box reveal-on-scroll">
        <form onsubmit="event.preventDefault();alert('Brief §8.5 — Phase 2 B2B Wholesale Portal Login active. Line-sheets & Lot 0325 wholesale ordering unlocked.')">
          <div class="form-group">
            <label>Boutique / Buyer Email</label>
            <input type="email" class="form-control" required placeholder="buyer@boutique.com" />
          </div>
          <div class="form-group">
            <label>Showroom Access Code</label>
            <input type="password" class="form-control" required placeholder="••••••••" />
          </div>
          <button type="submit" class="btn-primary" style="width:100%">Enter Lot 0325 B2B Showroom [§8.5]</button>
        </form>
      </div>
    </div>
  `;
}

function renderWishlistPage() {
  const saved = window.HARTWICK_PRODUCTS.filter(p => STATE.wishlist.includes(p.handle));
  return `
    <div class="collection-view view-enter">
      <header class="collection-header">
        <div class="brief-section-banner">
          <span class="brief-tag brief-tag--phase2">Brief §8.4 — Phase 2 Wishlist Functionality</span>
        </div>
        <span class="section-eyebrow">Phase 2 Feature · Saved Pieces</span>
        <h1 class="collection-header__title">Your Wishlist (${saved.length})</h1>
        <p class="collection-header__desc">Curate your personal archive of limited-edition Hartwick Atelier lots.</p>
      </header>
      ${saved.length === 0 ? `
        <div style="text-align:center;padding:40px 0">
          <button class="btn-outline" onclick="navigateTo('collection','all-apparel')">Explore Collections</button>
        </div>
      ` : `
        <div class="product-grid">
          ${saved.map(product => `
            <article class="product-card" onclick="navigateTo('pdp', '${product.handle}')">
              <div class="product-card__media">
                <div class="product-card__badges">
                  <span class="brief-tag">#${String(product.catalogNumber).padStart(2, "0")}</span>
                  <span class="badge-pill">${product.lot}</span>
                </div>
                <img class="product-card__img product-card__img--primary" src="${product.images[0]}" alt="${product.title}" />
                <img class="product-card__img product-card__img--secondary" src="${product.images[1] || product.images[0]}" alt="${product.title}" />
              </div>
              <div class="product-card__info">
                <h2 class="product-card__title">${product.title}</h2>
                <p class="product-card__expression">${product.commercial_expression}</p>
                <p class="product-card__price">${formatPrice(product)}</p>
              </div>
            </article>
          `).join("")}
        </div>
      `}
    </div>
  `;
}

// ==========================================================================
// VIEW 4, 5, 6: THE MASTERS, OUR STORY, CONTACT, SIZE GUIDE, RETURNS
// ==========================================================================
function renderTheMasters() {
  return `
    <div class="editorial-page view-enter">
      <header class="editorial-hero reveal-on-scroll">
        <div class="brief-section-banner">
          <span class="brief-tag">Brief §1.4 — About → The Masters (Verbatim Squarespace Copy &amp; Photography)</span>
        </div>
        <span class="section-eyebrow">About · A Glossary of Heritage Techniques</span>
        <h1 class="editorial-hero__title">The Masters</h1>
        <p class="editorial-hero__lead">
          Textile history dates back to the beginning of human civilization. Hartwick Atelier specializes in hand spun and handwoven fabrics, natural and ayurvedic dyes, and exquisite heritage handwork. These artisanal techniques rely on rare knowledge and the natural cycles of the sun, wind and rain.
        </p>
      </header>

      <div class="masters-grid">
        <article class="master-entry reveal-on-scroll">
          <div class="master-entry__img luxury-img-reveal">
            <img src="${SQS_CDN}8b35627c-73f1-47cc-8e79-c94a0388f034/125_HARTWICK_HANDWOVEN_TOKYO_SHIRT_IKAT.jpg" alt="Khadi Handspun and Handwoven" />
          </div>
          <div class="master-entry__body">
            <h2 class="master-entry__title">KHADI &amp; HANDLOOM</h2>
            <p class="master-entry__sub">Handspun and Handwoven, Natural Fiber Cloth</p>
            <p><strong>HANDSPUN:</strong> Natural fibers, drawn out and twisted together by hand to form a yarn.</p>
            <p><strong>HANDWOVEN:</strong> Handspun yarns woven together using a handloom.</p>
            <p>Khadi is made from handspun and handwoven natural fibers. From the harvest to the yarn to the weave, the material is made by hand without the use of electricity. It is a textile that holds the story of nature and sustainable economies, community and ancient craft.</p>
            <p>Weavers in villages across South Asia have been producing Khadi yarn from hand-spun cotton and silk for millennia. Wearing Khadi has a different feeling than wearing industrially produced fabrics — khadi drapes and breathes with a supple softness in a rhythm that can only be created by skilled human hands.</p>
          </div>
        </article>

        <article class="master-entry reveal-on-scroll">
          <div class="master-entry__img luxury-img-reveal">
            <img src="${SQS_CDN}643566b4-c934-4030-922c-ec6f24a25e06/218_HARTWICK_FINESILK_LARGESQUARE_SCARF_NATURALDYE_BLOCKPRINT.jpg" alt="Block Printed by Hand" />
          </div>
          <div class="master-entry__body">
            <h2 class="master-entry__title">BLOCK PRINTED BY HAND</h2>
            <p class="master-entry__sub">Printed by Hand Using Handcarved Wooden Blocks</p>
            <p>In India, artisans have used hand carved wooden blocks to print on handwoven fabric for nearly four thousand years.</p>
            <p>Each block print started as a tree, then a wood block, carved by hand into sets of intricate patterns, dipped and stamped layer by layer, revealing ancient motifs of Earth and sky.</p>
            <p>Using hand carved wooden blocks, Master Printers print each colour, layer by layer using resist dyeing techniques. Each piece requires a minimum of 16 processes, with the silk resting for at least a day between each step.</p>
            <p>Handwork naturally results in variations in colour and placement. We cherish these nuances for their human touch.</p>
          </div>
        </article>

        <article class="master-entry reveal-on-scroll">
          <div class="master-entry__img luxury-img-reveal">
            <img src="${SQS_CDN}0c0b1cbc-4c3e-43ad-b43d-1c2c4916289f/080_HARTWICK_OKANAGAN_ROBE_KALAMALKA_BLOCKPRINT.jpg" alt="Natural and Ayurvedic Dyes" />
          </div>
          <div class="master-entry__body">
            <h2 class="master-entry__title">NATURAL &amp; AYURVEDIC DYES</h2>
            <p class="master-entry__sub">Indigenous Plants, Roots, Flowers and Minerals</p>
            <p>Master Colorists use ancient methods to create natural dyes using indigenous plants and minerals including wild indigo, pomegranate bark and seeds, tamarind, turmeric, jaggery, ash, and iron.</p>
            <p>Unlike synthetic chemical dyes, natural plant-dyed textiles are living colours that harmonize with the skin and return clean water to the earth.</p>
          </div>
        </article>

        <article class="master-entry reveal-on-scroll">
          <div class="master-entry__img luxury-img-reveal">
            <img src="${SQS_CDN}a5e7be67-eacc-4e15-88af-5074b40dcb52/002001_HARTWICK_HANDEMBROIDERY_VENICE_BELT_GOTAPATTI.jpg" alt="Gota Patti and Jaipur Goldsmiths" />
          </div>
          <div class="master-entry__body">
            <h2 class="master-entry__title">HERITAGE ZARI &amp; JAIPUR GOLDSMITHS</h2>
            <p class="master-entry__sub">Gota Patti Embroidery &amp; Master Lapidary Art</p>
            <p>From royal Gota Patti metallic ribbon embroidery to Jaipur’s master stonecutters, stone setters, and goldsmiths working in 23k gold and hand-carved emeralds, each piece preserves centuries of royal workshop lineage.</p>
          </div>
        </article>
      </div>
    </div>
  `;
}

function renderOurStory() {
  return `
    <div class="editorial-page view-enter">
      <header class="editorial-hero reveal-on-scroll">
        <div class="brief-section-banner">
          <span class="brief-tag">Brief §1.4 — About → Our Story (Verbatim Squarespace Copy &amp; Archival Photos)</span>
        </div>
        <span class="section-eyebrow">About Hartwick Atelier</span>
        <h1 class="editorial-hero__title">Our Story</h1>
        <p class="editorial-hero__lead">
          “Hartwick Atelier is the culmination of decades of world travel as creatives in fashion and film. At its roots, each collection is a portrait of nature and sustainability through refined handcraft. It's an analogue love story.”
        </p>
      </header>

      <div class="reveal-on-scroll" style="display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-bottom:64px">
        <img src="${SQS_CDN}1738813975247-BRZ8Q0E5KZ9K0MY6SHL2/IMG_7025.jpeg" alt="Angela Hartwick Archive" style="aspect-ratio:4/3;object-fit:cover;width:100%" />
        <img src="${SQS_CDN}1738813972432-DJ6MTSK4LYQOLCYX5APU/IMG_6991.jpeg" alt="Hartwick Atelier Travels" style="aspect-ratio:4/3;object-fit:cover;width:100%" />
      </div>

      <div class="story-timeline">
        <div class="story-chapter reveal-on-scroll">
          <div class="story-chapter__year">1990s</div>
          <div>
            <h3 style="font-family:var(--font-serif);font-size:22px;margin-bottom:10px">New York City &amp; Paris</h3>
            <p style="color:var(--text-secondary)">My work in fashion started in New York City in the 90s as an assistant — first to a well-known Costume Designer, then to fashion stylists and photographers. When I was hired as an assistant to a French movie star and moved to Paris, fashion became a language that I learned and lived through cinema, tailoring, and textile archives.</p>
          </div>
        </div>

        <div class="story-chapter reveal-on-scroll">
          <div class="story-chapter__year">2002</div>
          <div>
            <h3 style="font-family:var(--font-serif);font-size:22px;margin-bottom:10px">Morocco &amp; Analogue Photography</h3>
            <p style="color:var(--text-secondary)">In 2002, Daryl was starting his photography career and we spent a couple months in Morocco to shoot our first fashion book. Immersing ourselves in the souks, natural dye vats, and handloom guilds sparked a lifelong devotion to traditional craft.</p>
          </div>
        </div>

        <div class="story-chapter reveal-on-scroll">
          <div class="story-chapter__year">2003 – 2008</div>
          <div>
            <h3 style="font-family:var(--font-serif);font-size:22px;margin-bottom:10px">Costume Design &amp; Character Through Cloth</h3>
            <p style="color:var(--text-secondary)">In 2003, I became the lead costume designer for a French TV series. We shot 8 episodes concurrently with 8 main characters, developing narrative and emotion through the drape, weight, and history of fabric.</p>
          </div>
        </div>

        <div class="story-chapter reveal-on-scroll">
          <div class="story-chapter__year">Today</div>
          <div>
            <h3 style="font-family:var(--font-serif);font-size:22px;margin-bottom:10px">Hartwick Atelier</h3>
            <p style="color:var(--text-secondary)">Working directly with master weavers, natural colorists, woodblock carvers, and goldsmiths across India, Hartwick Atelier creates limited-edition, numbered lots that honour slow time, human hands, and heirloom quality.</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderContactPage() {
  return `
    <div class="editorial-page view-enter">
      <header class="editorial-hero reveal-on-scroll">
        <div class="brief-section-banner">
          <span class="brief-tag">Brief §1.4 &amp; §2.10 — Contact Page (contact@HARTWICKATELIER.com)</span>
        </div>
        <span class="section-eyebrow">Client Services &amp; Enquiries</span>
        <h1 class="editorial-hero__title">Contact</h1>
        <p class="editorial-hero__lead">
          For private client styling, sizing assistance, or press enquiries, please reach out to our atelier directly at <a href="mailto:contact@HARTWICKATELIER.com" style="text-decoration:underline">contact@HARTWICKATELIER.com</a> or via the form below.
        </p>
      </header>

      <div class="contact-box reveal-on-scroll">
        <form onsubmit="handleContactSubmit(event)">
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" class="form-control" required placeholder="Your name" />
          </div>
          <div class="form-group">
            <label>Email Address</label>
            <input type="email" class="form-control" required placeholder="your@email.com" />
          </div>
          <div class="form-group">
            <label>Subject</label>
            <input type="text" class="form-control" placeholder="Order / Sizing / Lot 0325 Pre-Order Enquiry" />
          </div>
          <div class="form-group">
            <label>Message</label>
            <textarea class="form-control" rows="5" required placeholder="How can our atelier assist you?"></textarea>
          </div>
          <button type="submit" class="btn-primary" style="width:100%">Send Message</button>
          <div id="contact-form-feedback" class="dispatch-feedback"></div>
        </form>
      </div>
    </div>
  `;
}

function renderSizeGuidePage() {
  return `
    <div class="editorial-page view-enter">
      <header class="editorial-hero reveal-on-scroll">
        <div class="brief-section-banner">
          <span class="brief-tag">Brief §1.4 &amp; §4.4 — Size Guide (XS – XL)</span>
          ${STATE.phase2Enabled ? `<span class="brief-tag brief-tag--phase2" style="margin-left:8px">§8.6 Interactive Size Calculator</span>` : ""}
        </div>
        <span class="section-eyebrow">Garment Measurements</span>
        <h1 class="editorial-hero__title">Size Guide</h1>
        <p class="editorial-hero__lead">
          Hartwick Atelier garments are tailored for a relaxed yet structured drape. All pieces are offered in sizes XS through XL.
        </p>
        ${STATE.phase2Enabled ? `
          <div style="margin-top:20px">
            <button class="btn-primary" onclick="openSizeRecommendationModal()">[§8.6 Phase 2] Launch Interactive Size Calculator</button>
          </div>
        ` : ""}
      </header>

      <table class="size-table reveal-on-scroll">
        <thead>
          <tr>
            <th>Hartwick Size</th>
            <th>EU</th>
            <th>UK</th>
            <th>Bust (cm)</th>
            <th>Natural Waist (cm)</th>
            <th>Hip (cm)</th>
          </tr>
        </thead>
        <tbody>
          <tr><td><strong>XS</strong></td><td>34</td><td>6</td><td>80 – 84</td><td>63 – 67</td><td>88 – 92</td></tr>
          <tr><td><strong>S</strong></td><td>36</td><td>8 – 10</td><td>85 – 89</td><td>68 – 72</td><td>93 – 97</td></tr>
          <tr><td><strong>M</strong></td><td>38 – 40</td><td>12</td><td>90 – 95</td><td>73 – 78</td><td>98 – 103</td></tr>
          <tr><td><strong>L</strong></td><td>42</td><td>14</td><td>96 – 101</td><td>79 – 84</td><td>104 – 109</td></tr>
          <tr><td><strong>XL</strong></td><td>44</td><td>16</td><td>102 – 108</td><td>85 – 91</td><td>110 – 116</td></tr>
        </tbody>
      </table>
    </div>
  `;
}

function renderReturnsPolicyPage() {
  return `
    <div class="editorial-page view-enter">
      <header class="editorial-hero reveal-on-scroll">
        <div class="brief-section-banner">
          <span class="brief-tag">Brief §5.4 — Returns Policy Page &amp; §5.3 Shipping Zones</span>
        </div>
        <span class="section-eyebrow">Shipping, Duties &amp; Returns</span>
        <h1 class="editorial-hero__title">Returns Policy</h1>
        <p class="editorial-hero__lead">
          Every Hartwick Atelier garment is crafted by hand in limited quantities. We want you to treasure your piece for years to come.
        </p>
      </header>
      <div class="reveal-on-scroll" style="max-width:720px;margin:0 auto;display:flex;flex-direction:column;gap:24px;color:var(--text-secondary)">
        <div>
          <h3 style="font-family:var(--font-serif);color:var(--text-primary);font-size:21px;margin-bottom:8px">[§5.4] 14-Day Return Window</h3>
          <p>We accept returns on unworn, unwashed items with original lot tags attached within 14 days of delivery across the European Union, United Kingdom, and United States. To request a return authorization, please email <strong>contact@HARTWICKATELIER.com</strong> with your order number.</p>
        </div>
        <div>
          <h3 style="font-family:var(--font-serif);color:var(--text-primary);font-size:21px;margin-bottom:8px">[§5.3 &amp; §8.7] EU, UK &amp; US Shipping Rates</h3>
          <p>Orders are dispatched via insured DHL Express from our European fulfilment studio. Complimentary express shipping is offered on orders above €500 / £430 / $550. Standard insured shipping is €18 (EU), £22 (UK), and $45 (US — Phase 2 §8.7).</p>
        </div>
        <div>
          <h3 style="font-family:var(--font-serif);color:var(--text-primary);font-size:21px;margin-bottom:8px">Handcrafted Nuances</h3>
          <p>Because our textiles are spun, woven, and block-printed entirely by hand using natural plant and mineral dyes, subtle variations in weave slub and dye tone are intrinsic hallmarks of authenticity and are not considered defects.</p>
        </div>
      </div>
    </div>
  `;
}

// ==========================================================================
// INTERACTIVE HANDLERS & SCROLL REVEAL OBSERVER
// ==========================================================================
function initScrollAnimations() {
  const elements = document.querySelectorAll(".reveal-on-scroll, .luxury-img-reveal");
  if (!("IntersectionObserver" in window)) {
    elements.forEach(el => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  elements.forEach(el => observer.observe(el));
}

function selectPdpImage(idx) {
  STATE.selectedImageIndex = idx;
  renderApp();
}

function selectPdpSize(size) {
  STATE.selectedSize = size;
  renderApp();
}

function toggleAccordion(id) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle("open");
}

function changeCurrency(newCurr) {
  STATE.currency = newCurr;
  renderApp();
  renderCartDrawer();
}

function changeShippingRegion(region) {
  STATE.shippingRegion = region;
  renderCartDrawer();
}

function addToCart(handle) {
  const product = window.HARTWICK_PRODUCTS.find(p => p.handle === handle);
  if (!product) return;
  const key = `${handle}__${STATE.selectedSize}`;
  const existing = STATE.cart.find(item => item.key === key);
  if (existing) {
    existing.qty += 1;
  } else {
    STATE.cart.push({
      key,
      product,
      size: STATE.selectedSize,
      qty: 1
    });
  }
  renderHeaderAndFooterNav();
  renderCartDrawer();
  openCartDrawer();
}

function removeFromCart(key) {
  STATE.cart = STATE.cart.filter(item => item.key !== key);
  renderHeaderAndFooterNav();
  renderCartDrawer();
}

function openCartDrawer() {
  document.getElementById("cart-backdrop").classList.add("open");
  document.getElementById("cart-drawer").classList.add("open");
}

function closeCartDrawer() {
  document.getElementById("cart-backdrop").classList.remove("open");
  document.getElementById("cart-drawer").classList.remove("open");
}

function renderCartDrawer() {
  const container = document.getElementById("cart-drawer-body");
  const footer = document.getElementById("cart-drawer-footer");
  if (!container || !footer) return;

  if (STATE.cart.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;margin:auto;color:var(--text-muted)">
        <p style="font-family:var(--font-serif);font-size:20px;margin-bottom:12px;color:var(--text-primary)">Your bag is empty</p>
        <p style="font-size:13.5px;margin-bottom:24px">Explore our limited edition handwoven collections (#01–#66).</p>
        <button class="btn-outline" onclick="closeCartDrawer();navigateTo('collection','all-apparel')">Explore Apparel</button>
      </div>
    `;
    footer.innerHTML = "";
    return;
  }

  container.innerHTML = STATE.cart.map(item => `
    <div class="cart-item">
      <img class="cart-item__img" src="${item.product.images[0]}" alt="${item.product.title}" />
      <div>
        <div style="display:flex;justify-content:space-between;gap:8px">
          <h4 style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase">#${String(item.product.catalogNumber || 1).padStart(2, "0")} ${item.product.title}</h4>
          <button onclick="removeFromCart('${item.key}')" style="background:none;border:none;cursor:pointer;font-size:16px;line-height:1">×</button>
        </div>
        <p style="font-family:var(--font-serif);font-style:italic;font-size:13px;color:var(--text-secondary)">${item.product.commercial_expression}</p>
        <p style="font-size:11.5px;color:var(--text-muted);margin:4px 0">Size: ${item.size} · Qty: ${item.qty} · ${item.product.lot}</p>
        <p style="font-size:13.5px;font-weight:500">${formatPrice(item.product)}</p>
      </div>
    </div>
  `).join("");

  const subtotalEur = STATE.cart.reduce((sum, i) => sum + i.product.price_eur * i.qty, 0);
  const shippingEur = subtotalEur >= 500 ? 0 : (STATE.shippingRegion === "US" ? 45 : (STATE.shippingRegion === "UK" ? 25 : 18));
  const totalEur = subtotalEur + shippingEur;

  footer.innerHTML = `
    <div style="margin-bottom:10px;display:flex;gap:6px;flex-wrap:wrap">
      <span class="brief-tag">§5.1 Shopify Payments + Stripe</span>
      <span class="brief-tag">§5.2 EUR/GBP</span>
      <span class="brief-tag">§5.3 EU/UK Shipping</span>
      ${STATE.phase2Enabled ? `<span class="brief-tag brief-tag--phase2">§8.3 Loyalty &amp; §8.7 US/USD</span>` : ""}
    </div>
    <div style="margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;font-size:12px">
      <span style="text-transform:uppercase;letter-spacing:0.12em;color:var(--text-muted)">Shipping Zone [§5.3]:</span>
      <select onchange="changeShippingRegion(this.value)" style="padding:4px 8px;border:1px solid var(--border-strong);background:var(--bg-primary);font-size:11.5px">
        <option value="EU" ${STATE.shippingRegion === "EU" ? "selected" : ""}>European Union (DHL Express) [§5.3]</option>
        <option value="UK" ${STATE.shippingRegion === "UK" ? "selected" : ""}>United Kingdom (DHL Express) [§5.3]</option>
        ${STATE.phase2Enabled ? `<option value="US" ${STATE.shippingRegion === "US" ? "selected" : ""}>United States (DHL Express) [§8.7 P2]</option>` : ""}
      </select>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;color:var(--text-secondary)">
      <span>Subtotal</span>
      <span>${formatAmount(subtotalEur)}</span>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px;color:var(--text-secondary)">
      <span>Shipping (${STATE.shippingRegion})</span>
      <span>${shippingEur === 0 ? "Complimentary" : formatAmount(shippingEur)}</span>
    </div>
    ${STATE.phase2Enabled ? `
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:12px;color:#5C4628">
        <span>[§8.3] Atelier Circle Loyalty Earned</span>
        <span>+${subtotalEur * 2} Points</span>
      </div>
    ` : ""}
    <div style="display:flex;justify-content:space-between;font-size:15px;font-weight:500;padding-top:12px;border-top:1px solid var(--border-subtle);margin-bottom:18px">
      <span>Total (${STATE.currency}) [§5.2]</span>
      <span>${formatAmount(totalEur)}</span>
    </div>
    <button class="btn-primary" style="width:100%" onclick="handleCheckoutDemo()">
      [§5.1 &amp; §5.5] Proceed to Checkout (Shopify Payments / Stripe)
    </button>
  `;
}

function handleCheckoutDemo() {
  alert(
    `HARTWICK ATELIER — SHOPIFY CHECKOUT (§5.1–§5.5 & §8.7)\n\n` +
    "• [§5.1] Payment Gateway: Shopify Payments + Stripe Active\n" +
    "• [§5.2 & §8.7] Multi-Currency: " + STATE.currency + " (EUR, GBP, USD)\n" +
    "• [§5.3 & §8.7] Shipping Zone: " + STATE.shippingRegion + " (EU, UK, US Configured)\n" +
    "• [§5.4] Returns Policy linked in Footer\n" +
    "• [§5.5] Transactional Email: Default Shopify confirmation with Hartwick Atelier logo."
  );
}

function handleNewsletterSubmit(e, feedbackId) {
  e.preventDefault();
  const el = document.getElementById(feedbackId);
  if (el) {
    el.innerHTML = `[§6.3] Thank you for joining <strong>The Dispatch</strong>. Please check your inbox for <em>"Confirm your subscription to The Dispatch"</em> to complete your GDPR double opt-in.`;
  }
  e.target.reset();
}

function handleContactSubmit(e) {
  e.preventDefault();
  const el = document.getElementById("contact-form-feedback");
  if (el) {
    el.innerHTML = `Thank you. Your message has been sent to <strong>contact@HARTWICKATELIER.com</strong>.`;
  }
  e.target.reset();
}

function openDispatchPopup() {
  const modal = document.getElementById("dispatch-popup-backdrop");
  if (modal) modal.classList.add("open");
}

function closeDispatchPopup() {
  const modal = document.getElementById("dispatch-popup-backdrop");
  if (modal) modal.classList.remove("open");
  localStorage.setItem("hartwick_dispatch_dismissed", Date.now().toString());
}

// ==========================================================================
// MAIN RENDERER
// ==========================================================================
function renderApp() {
  const main = document.getElementById("app-main");
  if (!main) return;

  switch (STATE.currentView) {
    case "home":
      main.innerHTML = renderHomepage();
      break;
    case "collection":
      main.innerHTML = renderCollectionPage();
      break;
    case "pdp":
      main.innerHTML = renderProductPage();
      break;
    case "the-masters":
      main.innerHTML = renderTheMasters();
      break;
    case "our-story":
      main.innerHTML = renderOurStory();
      break;
    case "contact":
      main.innerHTML = renderContactPage();
      break;
    case "size-guide":
      main.innerHTML = renderSizeGuidePage();
      break;
    case "returns-policy":
      main.innerHTML = renderReturnsPolicyPage();
      break;
    case "journal":
      main.innerHTML = renderJournalPage();
      break;
    case "wholesale":
      main.innerHTML = renderWholesalePage();
      break;
    case "wishlist":
      main.innerHTML = renderWishlistPage();
      break;
    default:
      main.innerHTML = renderHomepage();
  }

  requestAnimationFrame(() => {
    initScrollAnimations();
  });
}

window.addEventListener("scroll", () => {
  const y = window.scrollY;
  const header = document.getElementById("site-header");
  if (header) {
    if (y > 40) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  }
  const heroImg = document.getElementById("hero-parallax-img");
  if (heroImg && y < 900) {
    heroImg.style.transform = `translate3d(0, ${y * 0.18}px, 0) scale(1.03)`;
  }
}, { passive: true });

document.addEventListener("DOMContentLoaded", () => {
  renderHeaderAndFooterNav();
  renderApp();
  renderCartDrawer();

  const dismissedAt = localStorage.getItem("hartwick_dispatch_dismissed");
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  if (!dismissedAt || Date.now() - parseInt(dismissedAt, 10) > thirtyDaysMs) {
    setTimeout(() => {
      openDispatchPopup();
    }, 10000);
  }
});
