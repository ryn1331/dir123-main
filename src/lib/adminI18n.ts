// FR → AR dictionary for the admin panel. Used by a MutationObserver
// to translate text nodes / placeholders / titles / aria-labels in-place
// without having to refactor every admin file.

export const adminDict: Record<string, string> = {
  // Layout / nav
  "Dashboard": "لوحة التحكم",
  "Commandes": "الطلبات",
  "Produits": "المنتجات",
  "Packs": "الباقات",
  "Paramètres": "الإعدادات",
  "Déconnexion": "تسجيل الخروج",
  "Notifications": "الإشعارات",
  "Aucune nouvelle commande": "لا توجد طلبات جديدة",
  "Nouvelle commande": "طلب جديد",
  "Tout effacer": "مسح الكل",
  "Admin": "الإدارة",

  // Dashboard
  "Bienvenue 👋": "مرحباً 👋",
  "Résumé de votre activité · CA = hors frais de livraison": "ملخص نشاطك · رقم الأعمال = بدون رسوم التوصيل",
  "Chiffre d'affaires (7j)": "رقم الأعمال (7 أيام)",
  "CA": "المداخيل",
  "Total produits": "إجمالي المنتجات",
  "Commandes récentes": "الطلبات الأخيرة",
  "Top Produits": "أفضل المنتجات",
  "Statut Commandes": "حالة الطلبات",
  "Stock Faible": "مخزون منخفض",
  "Stock faible": "مخزون منخفض",
  "Expiration prochaine (≤ 60j)": "انتهاء قريب (≤ 60 يوم)",
  "✅ Aucun produit ne périme bientôt": "✅ لا منتج ينتهي قريباً",
  "✅ Tous les stocks sont OK": "✅ كل المخزون جيد",
  "Aucune vente encore": "لا توجد مبيعات بعد",
  "Aucune commande": "لا توجد طلبات",
  "Aucune donnée": "لا توجد بيانات",
  "Voir tout": "عرض الكل",
  "Réapprovisionner": "إعادة التزويد",

  // Common
  "Rechercher...": "بحث...",
  "Rechercher": "بحث",
  "Toutes wilayas": "كل الولايات",
  "Tous services": "كل الخدمات",
  "Retour": "رجوع",
  "Annuler": "إلغاء",
  "Copier": "نسخ",
  "Copié": "تم النسخ",
  "Erreur": "خطأ",
  "Envoi...": "جاري الإرسال...",
  "Connexion...": "جاري الاتصال...",
  "Mise à jour...": "جاري التحديث...",
  "Chargement...": "جاري التحميل...",
  "Vue grille": "عرض شبكي",
  "Vue tableau": "عرض جدولي",
  "Facultatif": "اختياري",
  "Actions": "إجراءات",

  // Orders
  "Rechercher nom, N°, tél...": "ابحث بالاسم أو الرقم أو الهاتف...",
  "N°": "الرقم",
  "Client": "العميل",
  "Client:": "العميل:",
  "Téléphone": "الهاتف",
  "Téléphone:": "الهاتف:",
  "Wilaya": "الولاية",
  "Wilaya:": "الولاية:",
  "Commune:": "البلدية:",
  "Adresse": "العنوان",
  "Adresse:": "العنوان:",
  "Date": "التاريخ",
  "Statut": "الحالة",
  "Total": "المجموع",
  "Sous-total": "المجموع الفرعي",
  "Livraison": "التوصيل",
  "Frais livraison:": "رسوم التوصيل:",
  "Service": "الخدمة",
  "Service:": "الخدمة:",
  "Produit": "المنتج",
  "Notes:": "ملاحظات:",
  "Tracking:": "رقم التتبع:",
  "Expédition": "الشحن",
  "Changer le statut": "تغيير الحالة",
  "Gestion stock auto:": "إدارة المخزون تلقائياً:",
  "Copier infos colis": "نسخ معلومات الطرد",
  "Copier lien ads": "نسخ رابط الإعلان",
  "Infos colis copiées !": "تم نسخ معلومات الطرد!",
  "Vente présentiel": "بيع مباشر",
  "📄 Télécharger l'étiquette": "📄 تحميل البطاقة",

  // Status badges
  "En préparation": "قيد التحضير",
  "Confirmée": "مؤكدة",
  "Expédiée": "تم الشحن",
  "Livrée": "تم التسليم",
  // "Retour" (status) — same word as the back action, mapping above is reused
  "Annulée": "ملغاة",

  // Products
  "Aucun produit trouvé": "لم يتم العثور على منتجات",
  "+ Ajouter": "+ إضافة",
  "− Retirer": "− إزالة",
  "En stock": "متوفر",
  "Rupture": "نفذ المخزون",
  "Stock": "المخزون",
  "Quantité en stock": "الكمية في المخزون",
  "Prix": "السعر",
  "Prix *": "السعر *",
  "Prix de vente *": "سعر البيع *",
  "Ancien prix": "السعر القديم",
  "Marque": "العلامة",
  "Marque *": "العلامة *",
  "Nom *": "الاسم *",
  "Catégorie *": "الفئة *",
  "Univers *": "الكون *",
  "Cat.": "الفئة",
  "Description": "الوصف",
  "Décrivez le produit, ses bienfaits...": "صف المنتج وفوائده...",
  "Format / Conditionnement": "الشكل / التعبئة",
  "ex: 60 gélules · 30 portions · 500 g · 1 mois de cure": "مثال: 60 كبسولة · 30 حصة · 500 غ · شهر علاج",
  "Goûts (virgule)": "النكهات (بفاصلة)",
  "Poids (virgule)": "الأوزان (بفاصلة)",
  "Objectifs (virgule)": "الأهداف (بفاصلة)",
  "Chocolat, Vanille": "شوكولاتة، فانيليا",
  "1kg, 2.5kg": "1كغ، 2.5كغ",
  "Immunité, Énergie": "مناعة، طاقة",
  "Gold Standard Whey, Creatine Monohydrate": "Gold Standard Whey، Creatine Monohydrate",
  "📅 Date d'expiration": "📅 تاريخ الانتهاء",
  "📋 Comment utiliser": "📋 طريقة الاستعمال",
  "💡 Conseils": "💡 نصائح",
  "💰 Tarification": "💰 التسعير",
  "Ex: Prendre 1 capsule par jour avec un repas...": "مثال: تناول كبسولة واحدة يومياً مع وجبة...",
  "Ex: À prendre le matin pour un effet optimal...": "مثال: تُؤخذ صباحاً للحصول على أفضل تأثير...",
  "🌸 Beauté & Cosmétiques": "🌸 الجمال ومستحضرات التجميل",
  "💊 Santé & Compléments": "💊 الصحة والمكملات",
  "⭐ Top vente": "⭐ الأكثر مبيعاً",
  "🔥 Promo": "🔥 عرض",
  "PROMO": "عرض",
  "TOP": "الأفضل",
  "Actif (visible côté client)": "نشط (مرئي للعميل)",
  "Ajoutez des photos (dos, ingrédients, etc.)": "أضف صوراً (الخلف، المكونات، إلخ.)",
  "Auto-converti en WebP < 300 Ko": "تحويل تلقائي إلى WebP < 300 كب",
  "Produit ajouté !": "تمت إضافة المنتج!",
  "Produit modifié !": "تم تعديل المنتج!",
  "Produit supprimé": "تم حذف المنتج",
  "🔗 Lien pour publicité Facebook/Instagram": "🔗 رابط لإعلان Facebook/Instagram",
  "🔗 Lien produit copié !": "🔗 تم نسخ رابط المنتج!",
  "Utilisez ce lien dans vos carousel ads Facebook/Instagram": "استخدم هذا الرابط في إعلانات Facebook/Instagram",

  // Packs
  "Aucun pack": "لا توجد باقات",
  "Gérez les packs visibles côté client": "إدارة الباقات المرئية للعميل",
  "Durée du pack": "مدة الباقة",
  "1 mois, 3 mois": "شهر، 3 أشهر",
  "Image du pack": "صورة الباقة",
  "Produits du pack (séparés par virgule)": "منتجات الباقة (مفصولة بفاصلة)",
  "Pack créé !": "تم إنشاء الباقة!",
  "Pack modifié !": "تم تعديل الباقة!",
  "Pack supprimé": "تم حذف الباقة",
  "Remplissez les champs requis": "املأ الحقول المطلوبة",
  "Remplissez tous les champs": "املأ كل الحقول",

  // Clients
  "Aucun client": "لا يوجد عملاء",
  "Rechercher un client...": "ابحث عن عميل...",

  // Delivery
  "Zones de livraison": "مناطق التوصيل",
  "Rechercher une wilaya...": "ابحث عن ولاية...",
  "Frais livraison domicile (DA)": "رسوم التوصيل للمنزل (دج)",
  "Frais point relais (DA)": "رسوم نقطة الاستلام (دج)",
  "Frais livraison": "رسوم التوصيل",
  "Zone éloignée": "منطقة بعيدة",
  "Yalidine": "ياليدين",
  "ZR Express": "ZR Express",
  "Y. Domicile": "ياليدين منزل",
  "Y. Bureau": "ياليدين مكتب",
  "ZR Domicile": "ZR منزل",
  "ZR Bureau": "ZR مكتب",
  "${toSave.length} zone(s) sauvegardée(s)": "${toSave.length} منطقة محفوظة",

  // Settings
  "Informations boutique": "معلومات المتجر",
  "Nom de la boutique": "اسم المتجر",
  "Email de contact": "البريد الإلكتروني للاتصال",
  "Réseaux sociaux": "الشبكات الاجتماعية",
  "Facebook": "فيسبوك",
  "Instagram": "إنستغرام",
  "Messenger": "ماسنجر",
  "Changer l'email admin": "تغيير بريد المسؤول",
  "Changer le mot de passe": "تغيير كلمة المرور",
  "Nouvel email": "البريد الإلكتروني الجديد",
  "Mot de passe actuel": "كلمة المرور الحالية",
  "Nouveau mot de passe": "كلمة المرور الجديدة",
  "Confirmer le mot de passe": "تأكيد كلمة المرور",
  "Mot de passe actuel requis": "كلمة المرور الحالية مطلوبة",
  "Mot de passe incorrect": "كلمة المرور غير صحيحة",
  "Mot de passe mis à jour !": "تم تحديث كلمة المرور!",
  "Mot de passe modifié avec succès": "تم تغيير كلمة المرور بنجاح",
  "Le mot de passe doit contenir au moins 6 caractères": "كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل",
  "Les mots de passe ne correspondent pas": "كلمتا المرور غير متطابقتين",
  "Paramètres sauvegardés !": "تم حفظ الإعدادات!",
  "Erreur lors de la sauvegarde": "خطأ أثناء الحفظ",
  "Confirmez avec votre mot de passe actuel. Un email de confirmation sera envoyé à la nouvelle adresse.": "أكد بكلمة المرور الحالية. سيُرسل بريد تأكيد إلى العنوان الجديد.",
  "Un email de confirmation a été envoyé à la nouvelle adresse": "تم إرسال بريد تأكيد إلى العنوان الجديد",
  "Email de réinitialisation envoyé !": "تم إرسال بريد إعادة التعيين!",
  "Email requis": "البريد الإلكتروني مطلوب",
  "Entrez votre email": "أدخل بريدك الإلكتروني",
  "admin@dirlaffaire.com": "admin@dirlaffaire.com",
  "Session invalide": "جلسة غير صالحة",
  "Erreur upload": "خطأ في الرفع",
  "Catalogue": "الكتالوج",
  "Commande": "الطلب",
};

// Suffix → translated suffix (handles dynamic strings like "Commande {n} reçue !")
export const adminSuffix: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
  [/^Statut → (.+)$/, (m) => `الحالة → ${adminDict[m[1]] ?? m[1]}`],
  [/^📦 Expédition créée: (.+)$/, (m) => `📦 تم إنشاء الشحن: ${m[1]}`],
  [/^📦 Envoi auto vers (.+)\.\.\.$/, (m) => `📦 إرسال تلقائي إلى ${m[1]}...`],
  [/^📦 Stock mis à jour: -(\d+) unité\(s\)$/, (m) => `📦 تم تحديث المخزون: -${m[1]} وحدة`],
  [/^📦 Stock restauré: \+(\d+) unité\(s\)$/, (m) => `📦 تم استعادة المخزون: +${m[1]} وحدة`],
  [/^Échec expédition: (.+)$/, (m) => `فشل الشحن: ${m[1]}`],
  [/^Image compressée \((\d+) Ko\) et uploadée !$/, (m) => `تم ضغط (${m[1]} كب) ورفع الصورة!`],
  [/^Image principale compressée \((\d+) Ko\) !$/, (m) => `تم ضغط الصورة الرئيسية (${m[1]} كب)!`],
  [/^(\d+) photo\(s\) ajoutée\(s\) à la galerie !$/, (m) => `تمت إضافة ${m[1]} صورة للمعرض!`],
  [/^(\d+) zone\(s\) sauvegardée\(s\)$/, (m) => `تم حفظ ${m[1]} منطقة`],
];

export function translateString(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (adminDict[trimmed]) {
    // preserve surrounding whitespace
    return input.replace(trimmed, adminDict[trimmed]);
  }
  for (const [re, fn] of adminSuffix) {
    const m = trimmed.match(re);
    if (m) return input.replace(trimmed, fn(m));
  }
  return null;
}

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT", "CODE", "PRE"]);
const TRANSLATED_NODES: Set<Node> = new Set();
const TRANSLATED_ATTRS: Array<{ el: HTMLElement; attr: string; original: string }> = [];

// Track originals so we don't re-translate already-Arabic nodes that came from us
const ORIGINALS = new WeakMap<Node, string>();

function walkAndTranslate(root: Node) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => {
      const parent = n.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
      if (parent.closest("[data-no-i18n]")) return NodeFilter.FILTER_REJECT;
      if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const original = ORIGINALS.get(node) ?? node.nodeValue!;
    const translated = translateString(original);
    if (translated && translated !== node.nodeValue) {
      ORIGINALS.set(node, original);
      node.nodeValue = translated;
      TRANSLATED_NODES.add(node);
    }
  }
  // Attributes
  if (root instanceof Element || root instanceof Document) {
    const scope: ParentNode = root instanceof Document ? root : root;
    scope.querySelectorAll<HTMLElement>("[placeholder], [title], [aria-label]").forEach((el) => {
      (["placeholder", "title", "aria-label"] as const).forEach((attr) => {
        const v = el.getAttribute(attr);
        if (!v) return;
        const t = translateString(v);
        if (t && t !== v) {
          TRANSLATED_ATTRS.push({ el, attr, original: v });
          el.setAttribute(attr, t);
        }
      });
    });
  }
}

export function restoreAdminTranslation() {
  TRANSLATED_NODES.forEach((n) => {
    const orig = ORIGINALS.get(n);
    if (orig !== undefined) n.nodeValue = orig;
  });
  TRANSLATED_NODES.clear();
  TRANSLATED_ATTRS.forEach(({ el, attr, original }) => {
    el.setAttribute(attr, original);
  });
  TRANSLATED_ATTRS.length = 0;
}

let observer: MutationObserver | null = null;
let currentRoot: HTMLElement | null = null;

export function startAdminTranslation(root: HTMLElement) {
  stopAdminTranslation();
  currentRoot = root;
  walkAndTranslate(root);
  observer = new MutationObserver((mutations) => {
    if (!observer) return;
    observer.disconnect();
    for (const m of mutations) {
      m.addedNodes.forEach((n) => {
        if (n.nodeType === Node.ELEMENT_NODE || n.nodeType === Node.TEXT_NODE) {
          walkAndTranslate(n);
        }
      });
      if (m.type === "characterData" && m.target.nodeType === Node.TEXT_NODE) {
        walkAndTranslate(m.target);
      }
      if (m.type === "attributes" && m.target instanceof HTMLElement) {
        walkAndTranslate(m.target);
      }
    }
    observer.observe(currentRoot!, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["placeholder", "title", "aria-label"],
    });
  });
  observer.observe(root, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["placeholder", "title", "aria-label"],
  });
}

export function stopAdminTranslation() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  currentRoot = null;
}
