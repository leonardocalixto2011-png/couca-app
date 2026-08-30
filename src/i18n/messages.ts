/**
 * Bilingual copy for Couca & Co. Beauty.
 * Ported from the marketing site (index.html). FR is the default locale.
 * Keys are flat dotted strings — look up with the `t()` helper.
 */

export type Locale = "fr" | "en";
export const LOCALES: Locale[] = ["fr", "en"];
export const DEFAULT_LOCALE: Locale = "fr";
export const LOCALE_COOKIE = "couca-locale";

type Dict = Record<string, string>;

const fr: Dict = {
  "meta.title": "Couca & Co. Beauty | Nail Studio Montréal & L'Assomption",
  "meta.desc":
    "Couca & Co. Beauty — nail studio boutique à Montréal et L'Assomption. Pose gel, French finish, nail art 3D. Réservation en ligne.",

  "nav.home": "Accueil",
  "nav.services": "Services",
  "nav.prices": "Prix",
  "nav.book": "Réserver",
  "nav.bookRdv": "Réserver mon RDV",
  "nav.inspo": "Inspo",
  "nav.club": "Couca Club",
  "nav.boutique": "Boutique",
  "nav.contact": "Contact",
  "nav.account": "Mon compte",
  "nav.menuOpen": "Ouvrir le menu",
  "nav.menuClose": "Fermer le menu",
  "lang.switch": "Passer à l'anglais",

  "hero.eyebrow": "Couca & Co. Beauty • Nail Studio",
  "hero.h1a": "Des ongles qui font",
  "hero.h1script": "toute",
  "hero.h1b": "la différence.",
  "hero.lead":
    "Ongles soignés et durables • petits détails qui changent tout • confort et écoute.",
  "hero.cta1": "Réserver en ligne",
  "hero.cta2": "Voir les prix",
  "hero.note": "Réservation en ligne — confirmation immédiate.",
  "hero.imgAlt":
    "Pose en gel brun cat-eye avec fleurs 3D, chrome doré et perles, réalisée chez Couca & Co. Beauty",

  "services.h2": "Un menu court, pensé pour durer",
  "services.p":
    "Chaque service est net et compréhensible en quelques secondes. On élève la base, on ajoute des détails seulement s'ils servent le look.",
  "svc.courte.t": "Pose Gel — Courte",
  "svc.courte.d":
    "La base soignée : préparation, pose gel et finition brillante pour un port confortable au quotidien.",
  "svc.moyenne.t": "Pose Gel — Moyenne",
  "svc.moyenne.d":
    "Un peu plus de longueur pour une allure allongée, tout en gardant un geste naturel.",
  "svc.longue.t": "Pose Gel — Longue",
  "svc.longue.d":
    "L'effet éditorial : longueur affirmée, forme travaillée, fini impeccable.",
  "svc.french.t": "French Finish",
  "svc.french.d":
    "La French revisitée : ligne fine et propre, sur mesure selon la couleur choisie.",
  "svc.simple.t": "Nail Art Simple",
  "svc.simple.d":
    "Quelques touches graphiques : lignes, points dorés, accent minimal sur un ou deux ongles.",
  "svc.art3d.t": "Nail Art 3D / Charms",
  "svc.art3d.d":
    "Reliefs, perles, cœurs et charms posés à la main. Le prix suit la complexité du design.",

  "promo.badge": "Prix de lancement",
  "promo.h2": "Modèles recherchés",
  "promo.p":
    "Le studio ouvre ses portes : pour une période limitée, un tarif modèle est offert sur les poses de lancement.",
  "promo.cta": "Je veux mon prix de lancement",

  "prix.eyebrow": "Prix de lancement",
  "prix.h2": "Composez votre look, voyez le prix",
  "prix.p":
    "Les tarifs ci-dessous sont clairs et sans surprise. Le calculateur assemble votre estimation en direct — le montant final est confirmé en studio selon vos ongles.",
  "prix.listTitle": "Grille de tarifs",
  "prix.art3dName": "Nail Art Complexe / 3D",
  "prix.art3dSub": "selon la complexité du design",
  "prix.note":
    "Offre à durée limitée. Aucune date de fin fixée pour le moment.",

  "calc.title": "Calculateur de look",
  "calc.sub":
    "Estimation indicative — pas un paiement. Le total se met à jour instantanément.",
  "calc.legendBase": "Base — Pose Gel",
  "calc.legendFin": "Finitions & nail art",
  "calc.len.courte": "Courte",
  "calc.len.moyenne": "Moyenne",
  "calc.len.longue": "Longue",
  "calc.addon.french": "French Finish",
  "calc.addon.simple": "Nail Art Simple",
  "calc.addon.art3d": "Nail Art Complexe / 3D",
  "calc.addon.art3dSub": "reliefs, perles, charms",
  "calc.segHelp": "Choisissez le niveau de détail :",
  "calc.summaryTitle": "Votre look",
  "calc.totalLabel": "Total estimé",
  "calc.poseGel": "Pose Gel — ",
  "calc.book": "Réserver ce look",
  "calc.reset": "Réinitialiser le look",

  "policy.depositTitle": "Dépôt",
  "policy.deposit":
    "Un dépôt de 20 $ est demandé à la réservation. Il n'est pas remboursable et est appliqué au montant final en studio.",
  "policy.cancelTitle": "Annulation",
  "policy.cancel":
    "Report ou annulation sans frais jusqu'à 48 h avant le rendez-vous : le dépôt est conservé pour une prochaine visite. À moins de 48 h ou en cas d'absence, le dépôt est perdu.",

  "book.step.service": "Service",
  "book.step.date": "Date",
  "book.step.time": "Heure",
  "book.step.details": "Vos coordonnées",
  "book.step.review": "Confirmation",
  "book.pickDate": "Choisissez une date",
  "book.pickTime": "Choisissez une heure",
  "book.noSlots": "Aucune plage disponible ce jour-là. Essayez une autre date.",
  "book.closed": "Fermé",
  "book.name": "Nom complet",
  "book.email": "Courriel",
  "book.phone": "Téléphone",
  "book.notes": "Note (optionnel)",
  "book.back": "Retour",
  "book.next": "Continuer",
  "book.confirm": "Confirmer la réservation",
  "book.duration": "Durée",
  "book.estTotal": "Total estimé en studio",
  "book.depositDue": "Dépôt à la réservation",
  "book.confirmedTitle": "Réservation confirmée",
  "book.confirmedLead":
    "On a bien reçu votre demande. Un courriel de confirmation suit avec tous les détails.",
  "book.reference": "Référence",
  "book.addToLook": "add-ons",

  "club.eyebrow": "Fidélité",
  "club.p":
    "Une carte de fidélité pensée comme un petit rituel VIP. Chaque visite vous rapproche d'une attention offerte — touchez une visite pour voir votre progression.",
  "club.r3.t": "Nail Art Simple offert",
  "club.r3.d": "Un upgrade « Simple » ajouté à votre pose.",
  "club.r5.t": "15 % de rabais",
  "club.r5.d": "Sur votre prochain full set.",
  "club.r10.t": "Deluxe Care Set offert + 25 % de rabais",
  "club.r10.d": "Le palier signature du Couca Club.",
  "club.r3.short": "Nail Art Simple offert",
  "club.r5.short": "15 % de rabais sur le prochain full set",
  "club.r10.short": "Deluxe Care Set offert + 25 % de rabais",
  "club.cardSub": "Carte membre",
  "club.countSuffix": " / 10 visites",
  "club.stepsAria": "Choisir un nombre de visites",
  "club.statusPrefix": "Visite {v} sur 10 — ",
  "club.statusUnlocked": "récompense débloquée : {label}.",
  "club.statusNext": " Prochaine à la {n}e visite.",
  "club.statusNone1": "encore {k} visite avant la première attention offerte.",
  "club.statusNoneN": "encore {k} visites avant la première attention offerte.",

  "inspo.eyebrow": "Inspiration",
  "inspo.h2": "Le vestiaire d'ongles",
  "inspo.p":
    "Des directions de style pour nourrir votre prochain rendez-vous. Filtrez par ambiance.",
  "inspo.tab.all": "Tout",
  "inspo.tab.3d": "3D & Charms",
  "inspo.tab.french": "French élégant",
  "inspo.tab.deep": "Tons profonds",
  "inspo.tab.custom": "Sur mesure",
  "inspo.cta": "Voir le look",
  "inspo.note":
    "Réalisations récentes du studio Couca & Co. Beauty. Encore plus de looks sur Instagram.",
  "inspo.t.saugefleurs": "Fleurs & perles sauge",
  "inspo.t.saugeor": "Sauge, or & perles",
  "inspo.t.frenchpois": "French & pois",
  "inspo.t.bordeauxcoeurs": "French bordeaux & cœurs",
  "inspo.t.cateye": "Cat-eye chocolat & or",
  "inspo.t.rosepois": "Rose poudré à pois",

  "voices.eyebrow": "Bientôt",
  "voices.h2": "Vos mots, ici",
  "voices.p":
    "Le studio vient d'ouvrir : les premiers avis vérifiés apparaîtront à cet endroit. Aucun témoignage n'est inventé.",

  "ig.h2": "Encore plus d'inspo sur Instagram",
  "ig.p":
    "Écrivez-nous votre look, vos questions — on répond en personne. La réservation, elle, se fait en ligne.",
  "ig.dm": "Envoyer un DM",
  "ig.follow": "S'abonner sur Instagram",

  "footer.tag":
    "Vos ongles, mais élevés. Un studio feutré à Montréal et L'Assomption, pour des poses soignées qui tiennent.",
  "footer.navTitle": "Naviguer",
  "footer.joinTitle": "Rejoindre",
  "footer.statement": "Les petits détails font toute la différence.",

  "common.currencySuffix": " $",
};

const en: Dict = {
  "meta.title": "Couca & Co. Beauty | Nail Studio Montréal & L'Assomption",
  "meta.desc":
    "Couca & Co. Beauty — boutique nail studio in Montréal and L'Assomption. Gel sets, French finish, 3D nail art. Book online.",

  "nav.home": "Home",
  "nav.services": "Services",
  "nav.prices": "Pricing",
  "nav.book": "Book",
  "nav.bookRdv": "Book my appointment",
  "nav.inspo": "Inspo",
  "nav.club": "Couca Club",
  "nav.boutique": "Boutique",
  "nav.contact": "Contact",
  "nav.account": "My account",
  "nav.menuOpen": "Open menu",
  "nav.menuClose": "Close menu",
  "lang.switch": "Switch to French",

  "hero.eyebrow": "Couca & Co. Beauty • Nail Studio",
  "hero.h1a": "Nails that make",
  "hero.h1script": "all",
  "hero.h1b": "the difference.",
  "hero.lead":
    "Clean, long-lasting nails • small details that change everything • comfort and a listening ear.",
  "hero.cta1": "Book online",
  "hero.cta2": "See pricing",
  "hero.note": "Book online — instant confirmation.",
  "hero.imgAlt":
    "Brown cat-eye gel set with 3D flowers, gold chrome and pearls, done at Couca & Co. Beauty",

  "services.h2": "A short menu, built to last",
  "services.p":
    "Every service is clear and easy to grasp in seconds. We elevate the base and add details only when they serve the look.",
  "svc.courte.t": "Gel Set — Short",
  "svc.courte.d":
    "The polished base: prep, gel application and a glossy finish for comfortable everyday wear.",
  "svc.moyenne.t": "Gel Set — Medium",
  "svc.moyenne.d":
    "A little more length for an elongated look, while keeping a natural feel.",
  "svc.longue.t": "Gel Set — Long",
  "svc.longue.d":
    "The editorial effect: bold length, worked shape, flawless finish.",
  "svc.french.t": "French Finish",
  "svc.french.d":
    "The French, reimagined: a fine, clean line, tailored to your chosen colour.",
  "svc.simple.t": "Simple Nail Art",
  "svc.simple.d":
    "A few graphic touches: lines, gold dots, a minimal accent on one or two nails.",
  "svc.art3d.t": "3D Nail Art / Charms",
  "svc.art3d.d":
    "Reliefs, pearls, hearts and charms placed by hand. Price follows the design's complexity.",

  "promo.badge": "Launch pricing",
  "promo.h2": "Models wanted",
  "promo.p":
    "The studio is opening its doors: for a limited time, model pricing is available on launch sets.",
  "promo.cta": "I want my launch price",

  "prix.eyebrow": "Launch pricing",
  "prix.h2": "Build your look, see the price",
  "prix.p":
    "The prices below are clear and honest. The calculator builds your estimate live — the final amount is confirmed in-studio based on your nails.",
  "prix.listTitle": "Price list",
  "prix.art3dName": "Complex / 3D Nail Art",
  "prix.art3dSub": "based on the design's complexity",
  "prix.note": "Limited-time offer. No end date set for now.",

  "calc.title": "Look calculator",
  "calc.sub": "Indicative estimate — not a payment. The total updates instantly.",
  "calc.legendBase": "Base — Gel Set",
  "calc.legendFin": "Finishes & nail art",
  "calc.len.courte": "Short",
  "calc.len.moyenne": "Medium",
  "calc.len.longue": "Long",
  "calc.addon.french": "French Finish",
  "calc.addon.simple": "Simple Nail Art",
  "calc.addon.art3d": "Complex / 3D Nail Art",
  "calc.addon.art3dSub": "reliefs, pearls, charms",
  "calc.segHelp": "Choose the level of detail:",
  "calc.summaryTitle": "Your look",
  "calc.totalLabel": "Estimated total",
  "calc.poseGel": "Gel Set — ",
  "calc.book": "Book this look",
  "calc.reset": "Reset the look",

  "policy.depositTitle": "Deposit",
  "policy.deposit":
    "A $20 deposit is taken at booking. It is non-refundable and is applied to your final in-studio total.",
  "policy.cancelTitle": "Cancellation",
  "policy.cancel":
    "Free reschedule or cancellation up to 48h before the appointment: the deposit is kept toward a future visit. Inside 48h, or a no-show, forfeits the deposit.",

  "book.step.service": "Service",
  "book.step.date": "Date",
  "book.step.time": "Time",
  "book.step.details": "Your details",
  "book.step.review": "Review",
  "book.pickDate": "Pick a date",
  "book.pickTime": "Pick a time",
  "book.noSlots": "No openings that day. Try another date.",
  "book.closed": "Closed",
  "book.name": "Full name",
  "book.email": "Email",
  "book.phone": "Phone",
  "book.notes": "Note (optional)",
  "book.back": "Back",
  "book.next": "Continue",
  "book.confirm": "Confirm booking",
  "book.duration": "Duration",
  "book.estTotal": "Estimated in-studio total",
  "book.depositDue": "Deposit at booking",
  "book.confirmedTitle": "Booking confirmed",
  "book.confirmedLead":
    "We've got your request. A confirmation email with all the details is on its way.",
  "book.reference": "Reference",
  "book.addToLook": "add-ons",

  "club.eyebrow": "Loyalty",
  "club.p":
    "A loyalty card designed like a little VIP ritual. Every visit brings you closer to a reward — tap a visit to see your progress.",
  "club.r3.t": "Free Simple Nail Art",
  "club.r3.d": "A “Simple” upgrade added to your set.",
  "club.r5.t": "15% off",
  "club.r5.d": "On your next full set.",
  "club.r10.t": "Free Deluxe Care Set + 25% off",
  "club.r10.d": "The Couca Club signature tier.",
  "club.r3.short": "free Simple Nail Art",
  "club.r5.short": "15% off your next full set",
  "club.r10.short": "free Deluxe Care Set + 25% off",
  "club.cardSub": "Member card",
  "club.countSuffix": " / 10 visits",
  "club.stepsAria": "Choose a number of visits",
  "club.statusPrefix": "Visit {v} of 10 — ",
  "club.statusUnlocked": "reward unlocked: {label}.",
  "club.statusNext": " Next one at visit {n}.",
  "club.statusNone1": "{k} more visit before your first reward.",
  "club.statusNoneN": "{k} more visits before your first reward.",

  "inspo.eyebrow": "Inspiration",
  "inspo.h2": "The nail wardrobe",
  "inspo.p":
    "Style directions to feed your next appointment. Filter by mood.",
  "inspo.tab.all": "All",
  "inspo.tab.3d": "3D & Charms",
  "inspo.tab.french": "Elegant French",
  "inspo.tab.deep": "Bold & deep tones",
  "inspo.tab.custom": "Custom",
  "inspo.cta": "See the look",
  "inspo.note":
    "Recent work from the Couca & Co. Beauty studio. More looks on Instagram.",
  "inspo.t.saugefleurs": "Sage flowers & pearls",
  "inspo.t.saugeor": "Sage, gold & pearls",
  "inspo.t.frenchpois": "French & dots",
  "inspo.t.bordeauxcoeurs": "Bordeaux French & hearts",
  "inspo.t.cateye": "Chocolate cat-eye & gold",
  "inspo.t.rosepois": "Powder-pink dots",

  "voices.eyebrow": "Coming soon",
  "voices.h2": "Your words, here",
  "voices.p":
    "The studio has just opened: the first verified reviews will appear here. No testimonial is made up.",

  "ig.h2": "More inspo on Instagram",
  "ig.p":
    "Send us your look, your questions — we reply in person. Booking itself is done online.",
  "ig.dm": "Send a DM",
  "ig.follow": "Follow on Instagram",

  "footer.tag":
    "Your nails, but elevated. A cosy studio in Montréal and L'Assomption, for careful sets that hold.",
  "footer.navTitle": "Navigate",
  "footer.joinTitle": "Connect",
  "footer.statement": "The small details make all the difference.",

  "common.currencySuffix": " $",
};

export const MESSAGES: Record<Locale, Dict> = { fr, en };

/** Translate a key, with optional {placeholder} interpolation. */
export function translate(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const dict = MESSAGES[locale] ?? MESSAGES[DEFAULT_LOCALE];
  let value = dict[key] ?? MESSAGES[DEFAULT_LOCALE][key] ?? key;
  if (vars) {
    value = value.replace(/\{(\w+)\}/g, (_, name) =>
      vars[name] != null ? String(vars[name]) : `{${name}}`,
    );
  }
  return value;
}

export function normalizeLocale(value: string | undefined | null): Locale {
  return value === "en" || value === "fr" ? value : DEFAULT_LOCALE;
}
