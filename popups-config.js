/* ════════════════════════════════════════════════════════════════════
   ESSENTRA POPUPS — the ONLY file you need to edit.
   • Change text / image / code / delay right here.
   • To add a new offer: copy a whole { ... } block, give it a new id.
   • To switch one off: set  enabled:false  (or delete the block).
   • Popups show one at a time, top to bottom.
   • Title / subtitle accept HTML  e.g.  Get <em>10% OFF</em>
   ════════════════════════════════════════════════════════════════════ */
window.ESSENTRA_POPUPS = [

  /* ── 1. WELCOME OFFER (first-time buyers) ───────────────────────── */
  {
    id: 'welcome10',              // unique name (never reuse an id for a different offer)
    enabled: true,                // true = on, false = off

    title: 'Get 10% OFF',         // big headline
    subtitle: 'Your first order',  // line under the image
    image: 'images/img1.jpg',     // any image path or URL (square or landscape works best)
    code: 'WELCOME10',            // coupon code shown with Copy button ('' = hide code box)
    codeLabel: 'Use code at checkout',
    footnote: 'New customers only · Limited time',  // small text at bottom ('' = hide)

    buttonText: 'Shop Now',
    buttonAction: 'collection',   // 'collection' = open Collection page | 'link' = go to buttonLink | 'close' = just close
    buttonLink: '',               // used when buttonAction is 'link'  e.g. 'https://wa.me/8801XXXXXXXXX'

    audience: 'new',              // 'all' = everyone | 'new' = hide for customers who already ordered
    delaySeconds: 2,              // wait this long after the site loads
    frequency: 3,                 // 'once' = only first visit | 'session' = once per visit
                                  // 'always' = every page load | number = repeat after that many days
    startDate: '',                // optional  'YYYY-MM-DD'  (empty = start now)
    endDate: ''                   // optional  'YYYY-MM-DD'  (empty = never ends)
  },

  /* ── 2. EXAMPLE: BUNDLE OFFER (currently OFF — set enabled:true to use) ── */
  {
    id: 'bundle-offer',
    enabled: false,

    title: 'Buy 6 Get 10% OFF',
    subtitle: 'Buy 4 Get 5% OFF',
    image: 'images/img2.jpg',
    code: '',
    codeLabel: '',
    footnote: 'Limited time only',

    buttonText: 'Order Now',
    buttonAction: 'collection',
    buttonLink: '',

    audience: 'all',
    delaySeconds: 4,
    frequency: 'session',
    startDate: '',
    endDate: ''
  }

];
