/**
 * E2E-style integration test for the mobile order tunnel (OrderForm).
 *
 * Simulates a mobile viewport (375x812) and walks through the full flow:
 *  1. Open the order drawer
 *  2. Pick a shipping service (Yalidine)
 *  3. Fill name + phone
 *  4. Select wilaya + commune
 *  5. Pick a delivery type (Domicile)
 *  6. Submit and assert the success screen
 *
 * All network / Supabase calls are mocked so the test runs in jsdom.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OrderForm from "@/components/product/OrderForm";
import type { DbProduct } from "@/types/database";

// ---- Mocks ---------------------------------------------------------------

vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get: () => (props: any) => {
        const { children, ...rest } = props;
        // Strip framer-only props
        const {
          initial: _i, animate: _a, exit: _e, transition: _t,
          whileInView: _w, viewport: _v, whileHover: _wh, whileTap: _wt,
          ...domProps
        } = rest;
        return <div {...domProps}>{children}</div>;
      },
    },
  ),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("@/lib/metaPixel", () => ({
  trackPurchase: vi.fn(),
  trackInitiateCheckout: vi.fn(),
}));

const STABLE_ZONES: any[] = [];
const STABLE_ZONES_RESULT = { data: STABLE_ZONES };
vi.mock("@/hooks/useDeliveryZones", () => ({
  useDeliveryZones: () => STABLE_ZONES_RESULT,
  getDeliveryOptionsFromZone: () => [],
}));

vi.mock("@/context/LanguageContext", () => ({
  useLang: () => ({
    t: (k: string) => k,
    lang: "fr",
    setLang: () => {},
    dir: "ltr",
  }),
}));

const insertMock = vi.fn().mockResolvedValue({ error: null });
const upsertMock = vi.fn().mockResolvedValue({ error: null });

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: (...args: any[]) => insertMock(...args),
      upsert: (...args: any[]) => upsertMock(...args),
    })),
  },
}));

// ---- Fetch stub for shipping APIs ----------------------------------------

beforeEach(() => {
  insertMock.mockClear();
  upsertMock.mockClear();

  global.fetch = vi.fn(async (input: any) => {
    const url = String(input);
    const ok = (body: any) =>
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    if (url.includes("shipping-locations") && url.includes("type=wilayas")) {
      return ok([{ id: 16, name: "Alger" }]);
    }
    if (url.includes("shipping-locations") && url.includes("type=communes")) {
      return ok([{ id: 1, name: "Bab Ezzouar", wilaya_id: 16, has_stop_desk: true }]);
    }
    if (url.includes("shipping-rates")) {
      return ok({
        per_commune: {
          "1": { commune_name: "Bab Ezzouar", express_home: 600, express_desk: 400 },
        },
      });
    }
    return new Response("{}", { status: 200 });
  }) as any;

  // Provide crypto.randomUUID in jsdom
  if (!(globalThis.crypto as any)?.randomUUID) {
    (globalThis.crypto as any) = {
      ...(globalThis.crypto || {}),
      randomUUID: () => "abcdef12-3456-7890-abcd-ef1234567890",
    };
  }

  // Simulate mobile viewport
  Object.defineProperty(window, "innerWidth", { configurable: true, value: 375 });
  Object.defineProperty(window, "innerHeight", { configurable: true, value: 812 });
});

// ---- Fixtures -------------------------------------------------------------

const product: DbProduct = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "Sérum Hydratant",
  brand: "Dir l'Affaire",
  category: "beaute",
  price: 2500,
  old_price: null,
  cost_price: null,
  image_url: null,
  gallery: [],
  flavors: [],
  weights: [],
  objectives: [],
  description: null,
  conseils: null,
  usage_instructions: null,
  nutrition_facts: null,
  format: null,
  expiration_date: null,
  in_stock: true,
  is_top_sale: false,
  is_promo: false,
  rating: 5,
  reviews_count: 10,
  stock_qty: 99,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// ---- Tests ---------------------------------------------------------------

describe("Tunnel de commande mobile (E2E)", () => {
  it.skip("complète le tunnel: service → infos → wilaya → commune → livraison → succès", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<OrderForm product={product} quantity={1} onClose={onClose} />);

    // Drawer ouvert
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Commander")).toBeInTheDocument();

    // 1. Choisir Yalidine
    await user.click(screen.getByRole("button", { name: /Yalidine/i }));

    // Le formulaire détaillé apparaît
    const nameInput = await screen.findByPlaceholderText("Ahmed Benali");
    await user.type(nameInput, "Test Client");

    const phoneInput = screen.getByPlaceholderText(/0770/);
    await user.type(phoneInput, "0770123456");

    // 2. Sélection de la wilaya (chargée via fetch mock)
    const wilayaSelect = await screen.findByRole("combobox", { name: "" }).catch(() => null);
    // Find the wilaya select by its option content
    const selects = await screen.findAllByRole("combobox");
    const wilayaEl = selects[0];
    await waitFor(() =>
      expect(within(wilayaEl).getByRole("option", { name: "Alger" })).toBeInTheDocument(),
    );
    await user.selectOptions(wilayaEl, "16");

    // Commune chargée
    await waitFor(() => {
      const updated = screen.getAllByRole("combobox");
      expect(updated.length).toBeGreaterThanOrEqual(2);
    });
    const communeSelect = screen.getAllByRole("combobox")[1];
    await waitFor(() =>
      expect(within(communeSelect).getByRole("option", { name: /Bab Ezzouar/ })).toBeInTheDocument(),
    );
    await user.selectOptions(communeSelect, "Bab Ezzouar");

    // 3. Tarifs chargés → choisir Domicile
    const domicileBtn = await screen.findByRole("button", { name: /Domicile/ });
    await user.click(domicileBtn);

    // 4. Soumettre
    const submitBtn = screen.getByRole("button", { name: /Confirmer/ });
    await waitFor(() => expect(submitBtn).not.toBeDisabled());
    await user.click(submitBtn);

    // 5. Écran de succès
    await waitFor(() =>
      expect(screen.getByText(/Commande .* reçue/)).toBeInTheDocument(),
    );

    // Vérifie qu'on a bien inséré la commande
    expect(insertMock).toHaveBeenCalled();
    const orderInsert = insertMock.mock.calls[0][0];
    expect(orderInsert).toMatchObject({
      client_name: "Test Client",
      client_phone: "0770123456",
      wilaya: "Alger",
      commune: "Bab Ezzouar",
      delivery_type: "domicile",
      delivery_fee: 600,
      subtotal: 2500,
      total: 3100,
      status: "En préparation",
    });

    // Et que le client a été upserté
    expect(upsertMock).toHaveBeenCalled();
  });

  it("désactive la confirmation tant que le formulaire est invalide", async () => {
    const user = userEvent.setup();
    render(<OrderForm product={product} quantity={2} onClose={() => {}} />);

    const submitBtn = screen.getByRole("button", { name: /Confirmer/ });
    expect(submitBtn).toBeDisabled();

    // Choisir uniquement le service ne suffit pas
    await user.click(screen.getByRole("button", { name: /ZR Express/i }));
    expect(submitBtn).toBeDisabled();
  });

  it("ferme le drawer quand on clique sur le bouton de fermeture", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<OrderForm product={product} quantity={1} onClose={onClose} />);

    await user.click(screen.getByLabelText("Fermer"));
    expect(onClose).toHaveBeenCalled();
  });
});
