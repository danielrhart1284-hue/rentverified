/**
 * RentVerified — Recommended Supplies Widget
 * ============================================
 * Drop-in widget showing recommended supplies from Home Depot & Northern Tool.
 * Auto-detects industry from page context and shows relevant deals.
 *
 * Usage:
 *   <script src="recommended-supplies.js" data-industry="construction" data-category="plumbing"></script>
 *   <div id="rv-supplies-widget"></div>
 *
 * Attributes:
 *   data-industry   = construction|property_management|commercial|str|general (auto-detected if omitted)
 *   data-category   = plumbing|electrical|hvac|painting|flooring|roofing|appliances|cleaning|safety|office|landscaping (optional filter)
 *   data-context    = work order description or keyword to match supplies (optional)
 *   data-max        = max items to show (default 6)
 *   data-container  = custom container ID (default: rv-supplies-widget)
 *
 * Public API:
 *   RVSupplies.show(category, context)  — manually show supplies for a category
 *   RVSupplies.refresh()                — re-render with current config
 *   RVSupplies.logClick(product)        — track a click
 */
(function() {
  'use strict';

  // ── Affiliate Tag (replace with real affiliate IDs) ──
  var AFFILIATE = {
    homedepot: 'rv-rentverified-20',
    northerntool: 'rv-rentverified-nt'
  };

  // ── Product Database ──
  // Each product: { name, category, retailer, price, url, image (emoji), tags[], industries[] }
  var PRODUCTS = [
    // ═══ PLUMBING ═══
    { name:'SharkBite 1/2" Push-to-Connect Coupling', category:'plumbing', retailer:'Home Depot', price:7.98, url:'https://www.homedepot.com/s/sharkbite%20coupling', img:'🔧', tags:['pipe','fitting','copper','pex'], industries:['construction','property_management'] },
    { name:'Ridgid 14" Pipe Wrench', category:'plumbing', retailer:'Home Depot', price:29.97, url:'https://www.homedepot.com/s/ridgid%20pipe%20wrench', img:'🔧', tags:['wrench','pipe','tool'], industries:['construction'] },
    { name:'Oatey 8 oz. Regular Clear PVC Cement', category:'plumbing', retailer:'Home Depot', price:5.48, url:'https://www.homedepot.com/s/pvc%20cement', img:'🧴', tags:['pvc','glue','cement','drain'], industries:['construction','property_management'] },
    { name:'Fluidmaster 400A Universal Toilet Fill Valve', category:'plumbing', retailer:'Home Depot', price:8.98, url:'https://www.homedepot.com/s/fluidmaster%20fill%20valve', img:'🚽', tags:['toilet','fill','valve','repair'], industries:['construction','property_management'] },
    { name:'Delta Foundations Kitchen Faucet', category:'plumbing', retailer:'Home Depot', price:64.00, url:'https://www.homedepot.com/s/delta%20kitchen%20faucet', img:'🚰', tags:['faucet','kitchen','sink'], industries:['construction','property_management','str'] },
    { name:'NorthStar 157 GPH Electric Drain Cleaner', category:'plumbing', retailer:'Northern Tool', price:449.99, url:'https://www.northerntool.com/shop/tools/category_drain-cleaners', img:'🔌', tags:['drain','cleaner','electric','snake'], industries:['construction'] },
    { name:'Apache 50ft Sewer Jetter Hose', category:'plumbing', retailer:'Northern Tool', price:89.99, url:'https://www.northerntool.com/shop/tools/category_sewer-jetters', img:'💧', tags:['sewer','jetter','hose','drain'], industries:['construction'] },

    // ═══ ELECTRICAL ═══
    { name:'Leviton 15A Tamper-Resistant Outlet (10pk)', category:'electrical', retailer:'Home Depot', price:14.47, url:'https://www.homedepot.com/s/leviton%20outlet%2010%20pack', img:'🔌', tags:['outlet','receptacle','15a'], industries:['construction','property_management'] },
    { name:'Southwire 250ft 12/2 Romex NM-B Wire', category:'electrical', retailer:'Home Depot', price:89.00, url:'https://www.homedepot.com/s/romex%2012%202%20wire', img:'⚡', tags:['wire','romex','12-gauge','nm-b'], industries:['construction'] },
    { name:'Klein Tools 11-in-1 Screwdriver', category:'electrical', retailer:'Home Depot', price:14.97, url:'https://www.homedepot.com/s/klein%2011%20in%201', img:'🪛', tags:['screwdriver','klein','multi-tool'], industries:['construction','property_management'] },
    { name:'Square D 200A Main Breaker Panel', category:'electrical', retailer:'Home Depot', price:189.00, url:'https://www.homedepot.com/s/square%20d%20200%20amp%20panel', img:'⚡', tags:['panel','breaker','200a','electrical'], industries:['construction'] },
    { name:'Fluke T5-600 Voltage Tester', category:'electrical', retailer:'Northern Tool', price:159.99, url:'https://www.northerntool.com/shop/tools/category_voltage-testers', img:'🔋', tags:['tester','voltage','fluke','multimeter'], industries:['construction'] },

    // ═══ HVAC ═══
    { name:'Honeywell Home T6 Pro Thermostat', category:'hvac', retailer:'Home Depot', price:59.98, url:'https://www.homedepot.com/s/honeywell%20t6%20thermostat', img:'🌡️', tags:['thermostat','honeywell','programmable'], industries:['construction','property_management','str'] },
    { name:'16x25x1 MERV 8 Air Filter (6pk)', category:'hvac', retailer:'Home Depot', price:29.98, url:'https://www.homedepot.com/s/16x25x1%20air%20filter', img:'🌬️', tags:['filter','air','hvac','furnace'], industries:['construction','property_management','str'] },
    { name:'Rectorseal Nokorode Flux Paste', category:'hvac', retailer:'Northern Tool', price:6.99, url:'https://www.northerntool.com/shop/tools/category_soldering', img:'🔥', tags:['flux','solder','copper','hvac'], industries:['construction'] },
    { name:'Yellow Jacket 4-Valve Manifold Gauge Set', category:'hvac', retailer:'Northern Tool', price:289.99, url:'https://www.northerntool.com/shop/tools/category_hvac-tools', img:'❄️', tags:['manifold','gauge','refrigerant','hvac'], industries:['construction'] },

    // ═══ PAINTING ═══
    { name:'Behr Premium Plus Interior Paint (1 gal)', category:'painting', retailer:'Home Depot', price:34.98, url:'https://www.homedepot.com/s/behr%20premium%20plus%20interior', img:'🎨', tags:['paint','interior','behr','gallon'], industries:['construction','property_management','str'] },
    { name:'Purdy 9" White Dove Roller Cover (3pk)', category:'painting', retailer:'Home Depot', price:14.97, url:'https://www.homedepot.com/s/purdy%20roller%20cover', img:'🖌️', tags:['roller','purdy','painting'], industries:['construction','property_management'] },
    { name:'FrogTape 1.41" Multi-Surface Painter\'s Tape', category:'painting', retailer:'Home Depot', price:7.98, url:'https://www.homedepot.com/s/frog%20tape', img:'📏', tags:['tape','painter','masking','frogtape'], industries:['construction','property_management'] },
    { name:'Wagner Control Pro 130 Airless Sprayer', category:'painting', retailer:'Northern Tool', price:299.00, url:'https://www.northerntool.com/shop/tools/category_paint-sprayers', img:'💨', tags:['sprayer','airless','wagner','paint'], industries:['construction'] },

    // ═══ FLOORING ═══
    { name:'LifeProof Vinyl Plank Flooring (case)', category:'flooring', retailer:'Home Depot', price:42.98, url:'https://www.homedepot.com/s/lifeproof%20vinyl%20plank', img:'🪵', tags:['vinyl','plank','flooring','lifeproof'], industries:['construction','property_management','str'] },
    { name:'Roberts 50-lb Floor Leveling Compound', category:'flooring', retailer:'Home Depot', price:31.98, url:'https://www.homedepot.com/s/floor%20leveling%20compound', img:'🏗️', tags:['leveling','compound','subfloor'], industries:['construction'] },
    { name:'DEWALT 7" Wet Tile Saw', category:'flooring', retailer:'Northern Tool', price:399.00, url:'https://www.northerntool.com/shop/tools/category_tile-saws', img:'💎', tags:['tile','saw','dewalt','wet'], industries:['construction'] },

    // ═══ ROOFING ═══
    { name:'GAF Timberline HDZ Shingles (bundle)', category:'roofing', retailer:'Home Depot', price:36.48, url:'https://www.homedepot.com/s/gaf%20timberline%20shingles', img:'🏠', tags:['shingles','gaf','roofing','asphalt'], industries:['construction'] },
    { name:'Henry 4.75 gal Roof Coating', category:'roofing', retailer:'Home Depot', price:89.98, url:'https://www.homedepot.com/s/henry%20roof%20coating', img:'🪣', tags:['coating','roof','henry','sealant'], industries:['construction','property_management'] },

    // ═══ CLEANING (STR / Property Management) ═══
    { name:'Clorox Disinfecting Wipes (225ct)', category:'cleaning', retailer:'Home Depot', price:14.98, url:'https://www.homedepot.com/s/clorox%20disinfecting%20wipes', img:'🧹', tags:['cleaning','disinfecting','wipes','clorox'], industries:['property_management','str'] },
    { name:'Bissell CrossWave All-in-One Cleaner', category:'cleaning', retailer:'Home Depot', price:199.99, url:'https://www.homedepot.com/s/bissell%20crosswave', img:'🧽', tags:['vacuum','mop','floor','bissell'], industries:['str','property_management'] },
    { name:'Karcher K1700 Electric Pressure Washer', category:'cleaning', retailer:'Northern Tool', price:149.99, url:'https://www.northerntool.com/shop/tools/category_pressure-washers', img:'💦', tags:['pressure','washer','karcher','cleaning'], industries:['property_management','str','construction'] },
    { name:'Rubbermaid Mop Bucket & Wringer Combo', category:'cleaning', retailer:'Home Depot', price:34.98, url:'https://www.homedepot.com/s/rubbermaid%20mop%20bucket', img:'🪣', tags:['mop','bucket','cleaning','commercial'], industries:['property_management','str'] },

    // ═══ APPLIANCES ═══
    { name:'GE 18.3 cu.ft. Top-Freezer Refrigerator', category:'appliances', retailer:'Home Depot', price:578.00, url:'https://www.homedepot.com/s/ge%20top%20freezer%20refrigerator', img:'🧊', tags:['refrigerator','fridge','ge','appliance'], industries:['property_management','str'] },
    { name:'Whirlpool Top-Load Washer', category:'appliances', retailer:'Home Depot', price:498.00, url:'https://www.homedepot.com/s/whirlpool%20top%20load%20washer', img:'🫧', tags:['washer','laundry','whirlpool'], industries:['property_management','str'] },
    { name:'Broan 80 CFM Bath Exhaust Fan', category:'appliances', retailer:'Home Depot', price:21.97, url:'https://www.homedepot.com/s/broan%20bath%20fan', img:'🌀', tags:['fan','exhaust','bathroom','ventilation'], industries:['construction','property_management'] },

    // ═══ SAFETY ═══
    { name:'Kidde 10-Year Smoke Detector (2pk)', category:'safety', retailer:'Home Depot', price:37.98, url:'https://www.homedepot.com/s/kidde%20smoke%20detector', img:'🔥', tags:['smoke','detector','alarm','kidde'], industries:['property_management','str','construction'] },
    { name:'First Alert CO Detector', category:'safety', retailer:'Home Depot', price:29.98, url:'https://www.homedepot.com/s/first%20alert%20co%20detector', img:'⚠️', tags:['carbon','monoxide','detector','safety'], industries:['property_management','str'] },
    { name:'Kidde Fire Extinguisher ABC (2pk)', category:'safety', retailer:'Home Depot', price:39.98, url:'https://www.homedepot.com/s/kidde%20fire%20extinguisher', img:'🧯', tags:['fire','extinguisher','kidde','safety'], industries:['property_management','str','construction'] },

    // ═══ LANDSCAPING ═══
    { name:'Sun Joe 14" Electric Lawn Mower', category:'landscaping', retailer:'Home Depot', price:169.00, url:'https://www.homedepot.com/s/sun%20joe%20lawn%20mower', img:'🌿', tags:['mower','lawn','electric','landscaping'], industries:['property_management'] },
    { name:'Greenworks 80V Cordless Blower', category:'landscaping', retailer:'Home Depot', price:179.00, url:'https://www.homedepot.com/s/greenworks%2080v%20blower', img:'🍃', tags:['blower','leaf','cordless','greenworks'], industries:['property_management','construction'] },

    // ═══ OFFICE / ADMIN ═══
    { name:'Brother HL-L2350DW Laser Printer', category:'office', retailer:'Home Depot', price:119.99, url:'https://www.homedepot.com/s/brother%20laser%20printer', img:'🖨️', tags:['printer','laser','brother','office'], industries:['accounting','attorney','commercial','general','insurance'] },
    { name:'Pendaflex Hanging File Folders (25pk)', category:'office', retailer:'Home Depot', price:9.98, url:'https://www.homedepot.com/s/hanging%20file%20folders', img:'📁', tags:['folders','filing','office','organization'], industries:['accounting','attorney','general','insurance'] },
    { name:'Yale Assure Lock 2 Smart Lock', category:'safety', retailer:'Home Depot', price:179.99, url:'https://www.homedepot.com/s/yale%20smart%20lock', img:'🔐', tags:['lock','smart','keyless','security'], industries:['property_management','str','commercial'] },

    // ═══ STR-SPECIFIC ═══
    { name:'Wyze Cam v3 Security Camera', category:'safety', retailer:'Home Depot', price:35.98, url:'https://www.homedepot.com/s/wyze%20cam%20v3', img:'📷', tags:['camera','security','wyze','smart'], industries:['str','property_management'] },
    { name:'Schlage Encode Plus Smart Deadbolt', category:'safety', retailer:'Home Depot', price:299.99, url:'https://www.homedepot.com/s/schlage%20encode%20smart%20lock', img:'🔒', tags:['lock','smart','deadbolt','keyless'], industries:['str','property_management'] },
    { name:'Ring Video Doorbell 4', category:'safety', retailer:'Home Depot', price:199.99, url:'https://www.homedepot.com/s/ring%20doorbell%204', img:'🔔', tags:['doorbell','ring','video','smart'], industries:['str','property_management'] }
  ];

  // ── Category labels ──
  var CATEGORY_LABELS = {
    plumbing:'Plumbing', electrical:'Electrical', hvac:'HVAC', painting:'Painting',
    flooring:'Flooring', roofing:'Roofing', cleaning:'Cleaning & Turnover',
    appliances:'Appliances', safety:'Safety & Security', office:'Office & Admin',
    landscaping:'Landscaping'
  };

  // ── Industry → default categories ──
  var INDUSTRY_CATS = {
    construction: ['plumbing','electrical','hvac','painting','flooring','roofing','safety'],
    property_management: ['plumbing','electrical','appliances','cleaning','safety','landscaping','painting'],
    commercial: ['office','safety','cleaning','appliances'],
    str: ['cleaning','safety','appliances','plumbing','painting'],
    accounting: ['office'],
    attorney: ['office'],
    insurance: ['office'],
    lending: ['office'],
    general: ['office','cleaning','safety']
  };

  // ── Context keyword → category mapping ──
  var KEYWORD_MAP = {
    plumb:'plumbing', pipe:'plumbing', faucet:'plumbing', toilet:'plumbing', drain:'plumbing', water:'plumbing', leak:'plumbing', sewer:'plumbing',
    electric:'electrical', outlet:'electrical', wire:'electrical', breaker:'electrical', switch:'electrical', light:'electrical', circuit:'electrical',
    hvac:'hvac', furnace:'hvac', thermostat:'hvac', 'air condition':'hvac', heating:'hvac', cooling:'hvac', filter:'hvac', duct:'hvac',
    paint:'painting', wall:'painting', primer:'painting', roller:'painting', brush:'painting',
    floor:'flooring', tile:'flooring', vinyl:'flooring', carpet:'flooring', laminate:'flooring', hardwood:'flooring',
    roof:'roofing', shingle:'roofing', gutter:'roofing', leak:'plumbing',
    clean:'cleaning', mop:'cleaning', vacuum:'cleaning', pressure:'cleaning', turnover:'cleaning',
    appliance:'appliances', fridge:'appliances', washer:'appliances', dryer:'appliances', dishwasher:'appliances', stove:'appliances',
    smoke:'safety', lock:'safety', camera:'safety', security:'safety', detector:'safety', fire:'safety',
    mow:'landscaping', lawn:'landscaping', tree:'landscaping', landscape:'landscaping',
    print:'office', paper:'office', folder:'office', desk:'office'
  };

  // ── Detect category from context string ──
  function detectCategory(context) {
    if (!context) return null;
    var lower = context.toLowerCase();
    for (var kw in KEYWORD_MAP) {
      if (lower.indexOf(kw) > -1) return KEYWORD_MAP[kw];
    }
    return null;
  }

  // ── Get config from script tag ──
  var scriptTag = document.currentScript || document.querySelector('script[src*="recommended-supplies"]');
  var config = {
    industry: (scriptTag && scriptTag.getAttribute('data-industry')) || null,
    category: (scriptTag && scriptTag.getAttribute('data-category')) || null,
    context: (scriptTag && scriptTag.getAttribute('data-context')) || null,
    max: parseInt((scriptTag && scriptTag.getAttribute('data-max')) || '6'),
    container: (scriptTag && scriptTag.getAttribute('data-container')) || 'rv-supplies-widget'
  };

  // ── Auto-detect industry from page ──
  function detectIndustry() {
    if (config.industry) return config.industry;
    var path = window.location.pathname;
    if (path.indexOf('jobs') > -1 || path.indexOf('vendor') > -1 || path.indexOf('materials') > -1) return 'construction';
    if (path.indexOf('commercial') > -1) return 'commercial';
    if (path.indexOf('str-manager') > -1) return 'str';
    if (path.indexOf('accounting') > -1) return 'accounting';
    if (path.indexOf('matters') > -1) return 'attorney';
    if (path.indexOf('insurance') > -1) return 'insurance';
    if (path.indexOf('loan') > -1 || path.indexOf('funding') > -1) return 'lending';
    if (path.indexOf('landlord') > -1 || path.indexOf('maintenance') > -1) return 'property_management';
    return 'general';
  }

  // ── Get recommended products ──
  function getRecommendations(category, industry, context, max) {
    var ind = industry || detectIndustry();
    var cat = category || detectCategory(context) || null;
    var results;

    if (cat) {
      // Show products matching the specific category + industry
      results = PRODUCTS.filter(function(p) {
        return p.category === cat && p.industries.indexOf(ind) > -1;
      });
      // If not enough, add from same category any industry
      if (results.length < max) {
        var more = PRODUCTS.filter(function(p) { return p.category === cat && results.indexOf(p) === -1; });
        results = results.concat(more);
      }
    } else {
      // Show a mix from all relevant categories for this industry
      var cats = INDUSTRY_CATS[ind] || INDUSTRY_CATS.general;
      results = PRODUCTS.filter(function(p) {
        return p.industries.indexOf(ind) > -1 && cats.indexOf(p.category) > -1;
      });
      // Shuffle for variety
      results.sort(function() { return 0.5 - Math.random(); });
    }

    return results.slice(0, max);
  }

  // ── Build affiliate URL ──
  function affiliateUrl(product) {
    var tag = product.retailer === 'Home Depot' ? AFFILIATE.homedepot : AFFILIATE.northerntool;
    var sep = product.url.indexOf('?') > -1 ? '&' : '?';
    return product.url + sep + 'aff=' + tag;
  }

  // ── Log click ──
  function logClick(product, sourcePage) {
    var click = {
      product_name: product.name,
      product_url: product.url,
      retailer: product.retailer,
      category: product.category,
      industry: detectIndustry(),
      source_page: sourcePage || window.location.pathname,
      source_context: config.context || '',
      event_type: 'click'
    };

    // Log to data layer if available
    if (typeof RVData !== 'undefined' && RVData.logAffiliateClick) {
      RVData.logAffiliateClick(click);
    } else {
      // Fallback direct localStorage
      var clicks = JSON.parse(localStorage.getItem('rv_affiliate_clicks') || '[]');
      click.id = 'aff_' + Date.now();
      click.created_at = new Date().toISOString();
      clicks.push(click);
      localStorage.setItem('rv_affiliate_clicks', JSON.stringify(clicks));
    }
  }

  // ── Render Widget ──
  function render(products, targetId) {
    var container = document.getElementById(targetId || config.container);
    if (!container) return;

    var ind = detectIndustry();
    var cat = config.category || detectCategory(config.context);
    var title = cat ? ('Recommended ' + (CATEGORY_LABELS[cat] || cat) + ' Supplies') : 'Recommended Supplies & Deals';

    var html = '<div style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;margin:1.5rem 0;">';

    // Header
    html += '<div style="background:linear-gradient(135deg,#ea580c 0%,#c2410c 100%);padding:1rem 1.25rem;display:flex;align-items:center;justify-content:space-between;">';
    html += '<div style="display:flex;align-items:center;gap:.5rem;"><span style="font-size:1.2rem;">🛒</span><span style="color:#fff;font-weight:700;font-size:.95rem;">' + title + '</span></div>';
    html += '<span style="font-size:.7rem;color:rgba(255,255,255,.7);font-weight:600;">Home Depot · Northern Tool</span>';
    html += '</div>';

    // Category filter pills (if no specific category set)
    if (!cat) {
      var cats = INDUSTRY_CATS[ind] || INDUSTRY_CATS.general;
      html += '<div style="padding:.75rem 1.25rem .25rem;display:flex;gap:.35rem;flex-wrap:wrap;border-bottom:1px solid #f1f5f9;">';
      html += '<button onclick="RVSupplies.show(null)" style="padding:.25rem .65rem;border-radius:99px;border:1px solid #e5e7eb;background:#f8fafc;color:#374151;font-size:.72rem;font-weight:600;cursor:pointer;">All</button>';
      cats.forEach(function(c) {
        html += '<button onclick="RVSupplies.show(\'' + c + '\')" style="padding:.25rem .65rem;border-radius:99px;border:1px solid #e5e7eb;background:#fff;color:#64748b;font-size:.72rem;font-weight:600;cursor:pointer;">' + (CATEGORY_LABELS[c] || c) + '</button>';
      });
      html += '</div>';
    }

    // Product cards
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:.75rem;padding:1rem 1.25rem;">';

    products.forEach(function(p, i) {
      var url = affiliateUrl(p);
      var retailerColor = p.retailer === 'Home Depot' ? '#f97316' : '#1d4ed8';
      html += '<a href="' + url + '" target="_blank" rel="noopener" onclick="RVSupplies.logClick(RVSupplies._products[' + i + '])" ' +
        'style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:1rem;text-decoration:none;color:#1e293b;transition:all .15s;display:block;"' +
        'onmouseover="this.style.borderColor=\'#3b82f6\';this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 4px 12px rgba(0,0,0,.08)\'"' +
        'onmouseout="this.style.borderColor=\'#e2e8f0\';this.style.transform=\'none\';this.style.boxShadow=\'none\'">';
      html += '<div style="font-size:2rem;margin-bottom:.5rem;">' + p.img + '</div>';
      html += '<div style="font-size:.82rem;font-weight:700;line-height:1.3;margin-bottom:.35rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">' + p.name + '</div>';
      html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:.35rem;">';
      html += '<span style="font-weight:800;color:#059669;font-size:.95rem;">$' + p.price.toFixed(2) + '</span>';
      html += '<span style="font-size:.65rem;font-weight:700;color:' + retailerColor + ';background:' + (p.retailer === 'Home Depot' ? '#fff7ed' : '#eff6ff') + ';padding:2px 6px;border-radius:4px;">' + p.retailer + '</span>';
      html += '</div>';
      html += '<div style="font-size:.68rem;color:#94a3b8;margin-top:.35rem;text-transform:uppercase;letter-spacing:.03em;">' + (CATEGORY_LABELS[p.category] || p.category) + '</div>';
      html += '</a>';
    });

    html += '</div>';

    // Footer
    html += '<div style="padding:.6rem 1.25rem;background:#f8fafc;border-top:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;">';
    html += '<span style="font-size:.7rem;color:#94a3b8;">Affiliate prices · may vary · updated Q1 2026</span>';
    html += '<a href="doc-generator.html?template=con-invoice" style="font-size:.72rem;color:#1a56db;font-weight:700;text-decoration:none;">Generate Invoice →</a>';
    html += '</div>';

    html += '</div>';

    container.innerHTML = html;
  }

  // ── Public API ──
  window.RVSupplies = {
    _products: [],

    show: function(category, context) {
      config.category = category || null;
      if (context) config.context = context;
      this._products = getRecommendations(config.category, detectIndustry(), config.context, config.max);
      render(this._products);
    },

    refresh: function() {
      this._products = getRecommendations(config.category, detectIndustry(), config.context, config.max);
      render(this._products);
    },

    logClick: logClick,

    updateConfig: function(opts) {
      for (var k in opts) config[k] = opts[k];
      this.refresh();
    },

    // Called by work order forms to show relevant supplies
    matchWorkOrder: function(description) {
      config.context = description;
      var cat = detectCategory(description);
      if (cat) config.category = cat;
      this.refresh();
    }
  };

  // ── Auto-init when DOM ready ──
  function init() {
    // Create container if not exists
    if (!document.getElementById(config.container)) {
      // Find a good insertion point — look for common dashboard patterns
      var targets = ['.portal-main', '.main', '.dash-content', '.dg-main', '#dashboard-screen'];
      var inserted = false;
      for (var i = 0; i < targets.length; i++) {
        var el = document.querySelector(targets[i]);
        if (el) {
          var div = document.createElement('div');
          div.id = config.container;
          el.appendChild(div);
          inserted = true;
          break;
        }
      }
      if (!inserted) {
        // Append to body as fallback
        var div = document.createElement('div');
        div.id = config.container;
        document.body.appendChild(div);
      }
    }

    RVSupplies._products = getRecommendations(config.category, detectIndustry(), config.context, config.max);
    render(RVSupplies._products);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
