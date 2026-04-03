import fs from "node:fs";
import path from "node:path";
import toml from "toml";
import { randomUUID } from "node:crypto";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData, useRevalidator } from "@remix-run/react";
import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  Checkbox,
  EmptyState,
  FormLayout,
  InlineStack,
  Layout,
  Link,
  List,
  Modal,
  Page,
  Select,
  Text,
  TextField,
} from "@shopify/polaris";
import {
  assertLocalDatabaseState,
  resolvePublicAppUrl,
  redactDatabaseUrl,
  getResolvedDatabaseLocation,
} from "../config.server";
import { loadCatalog } from "../catalog.server";
import db from "../db.server";
import { getPostPurchaseDiagnostics } from "../post-purchase-debug.server";
import { authenticate } from "../shopify.server";

function readConfigFiles() {
  const root = process.cwd();
  const configFiles = fs
    .readdirSync(root)
    .filter((file) => /^shopify\.app.*\.toml$/.test(file))
    .sort();

  return configFiles.map((file) => {
    const contents = fs.readFileSync(path.join(root, file), "utf8");
    const parsed = toml.parse(contents);

    return {
      file,
      applicationUrl: parsed.application_url || null,
      devStoreUrl: parsed.build?.dev_store_url || null,
      webhookApiVersion: parsed.webhooks?.api_version || null,
    };
  });
}

function offerToJson(offer) {
  return {
    ...offer,
    createdAt: offer.createdAt.toISOString(),
    updatedAt: offer.updatedAt.toISOString(),
  };
}

function normalizeOptionalString(value) {
  const normalized = String(value || "").trim();
  return normalized ? normalized : null;
}

function parseInteger(value, fallback) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseFloatValue(value) {
  if (value == null || value === "") return null;
  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function validateOfferInput(formData, catalog) {
  const triggerType = formData.get("triggerType") || "product";
  const triggerTargetId = String(formData.get("triggerTargetId") || "");
  const offerVariantId = String(formData.get("offerVariantId") || "");
  const discountType = String(formData.get("discountType") || "none");

  const errors = {};
  const productMap = catalog.productMap;
  const variantMap = catalog.variantMap;

  const name = String(formData.get("name") || "").trim();
  const headline = String(formData.get("headline") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const acceptLabel = String(formData.get("acceptLabel") || "").trim();
  const declineLabel = normalizeOptionalString(formData.get("declineLabel"));
  const priority = parseInteger(formData.get("priority"), 100);
  const isActive = String(formData.get("isActive") || "false") === "true";
  const discountValue = parseFloatValue(formData.get("discountValue"));

  if (!name)
    errors.name =
      "Enter an internal name to help merchants identify this offer.";
  if (!headline)
    errors.headline = "Add the upsell headline shown after checkout.";
  if (!description)
    errors.description = "Add concise supporting copy for the offer.";
  if (!acceptLabel) errors.acceptLabel = "Add the primary CTA label.";

  let triggerProductId = null;
  let triggerVariantId = null;
  let triggerLabel = null;

  if (triggerType === "variant") {
    const triggerVariant = variantMap.get(triggerTargetId);
    if (!triggerVariant) {
      errors.triggerTargetId =
        "Choose which purchased variant should trigger this offer.";
    } else {
      triggerVariantId = triggerVariant.value;
      triggerProductId = triggerVariant.productId;
      triggerLabel = triggerVariant.label;
    }
  } else {
    const triggerProduct = productMap.get(triggerTargetId);
    if (!triggerProduct) {
      errors.triggerTargetId =
        "Choose which purchased product should trigger this offer.";
    } else {
      triggerProductId = triggerProduct.id;
      triggerLabel = triggerProduct.title;
    }
  }

  const offerVariant = variantMap.get(offerVariantId);
  if (!offerVariant) {
    errors.offerVariantId =
      "Choose which product variant to offer post-purchase.";
  }

  if (discountType !== "none") {
    if (discountValue == null || discountValue <= 0) {
      errors.discountValue = "Enter a discount value greater than zero.";
    }
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return {
    values: {
      id: normalizeOptionalString(formData.get("id")) || randomUUID(),
      name,
      isActive,
      triggerProductId,
      triggerVariantId,
      triggerLabel,
      offerProductId: offerVariant.productId,
      offerVariantId: offerVariant.value,
      offerLabel: offerVariant.label,
      headline,
      description,
      acceptLabel,
      declineLabel,
      priority,
      discountType: discountType === "none" ? null : discountType,
      discountValue: discountType === "none" ? null : discountValue,
    },
  };
}

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const publicAppUrl = resolvePublicAppUrl();

  const database = getResolvedDatabaseLocation();
  const bootstrap = assertLocalDatabaseState();
  const [catalog, offers, sessions] = await Promise.all([
    loadCatalog(admin),
    db.offer.findMany({
      where: { shop: session.shop },
      orderBy: [{ priority: "asc" }, { updatedAt: "desc" }],
    }),
    db.session.findMany({
      select: { shop: true },
      orderBy: { shop: "asc" },
    }),
  ]);

  let sessionStorageReady = false;
  let sessionStorageError = null;

  try {
    await db.session.count();
    sessionStorageReady = true;
  } catch (error) {
    sessionStorageError =
      error instanceof Error ? error.message : "Unknown Prisma error";
  }

  const { APP_URL: extensionAppUrl } = await import(
    "../../extensions/my-post-purchase-ui-extension/src/app-url.js"
  );
  const diagnostics = await getPostPurchaseDiagnostics({ admin });

  return json({
    shop: session.shop,
    offers: offers.map(offerToJson),
    productOptions: catalog.productOptions,
    variantOptions: catalog.variantOptions,
    activeAppUrl: publicAppUrl.url || "",
    publicAppUrlSource: publicAppUrl.source || "",
    hostValue: process.env.HOST || "",
    publicAppUrlEnv: process.env.PUBLIC_APP_URL || "",
    shopifyAppUrlEnv: process.env.SHOPIFY_APP_URL || "",
    extensionAppUrl,
    databaseMode: database.mode,
    databaseUrl: redactDatabaseUrl(database.url),
    resolvedDatabasePath: database.resolvedPath || "",
    usingDatabaseFallback: database.usingFallback,
    databaseReason: database.reason,
    sessionTableExists: Boolean(bootstrap.bootstrapState?.sessionTableExists),
    offerTableExists: Boolean(bootstrap.bootstrapState?.offerTableExists),
    bootstrapDatabasePath: bootstrap.bootstrapState?.resolvedPath || "",
    sessionStorageReady,
    sessionStorageError,
    configFiles: readConfigFiles(),
    shops: sessions.map((current) => current.shop),
    diagnostics,
  });
};

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") || "");

  if (!intent) {
    return json(
      { ok: false, message: "Missing action intent." },
      { status: 400 }
    );
  }

  if (intent === "delete") {
    const id = String(formData.get("id") || "");
    if (!id) {
      return json({ ok: false, message: "Missing offer id." }, { status: 400 });
    }

    await db.offer.deleteMany({
      where: { id, shop: session.shop },
    });

    return json({ ok: true, message: "Offer deleted." });
  }

  if (intent === "toggle") {
    const id = String(formData.get("id") || "");
    const isActive = String(formData.get("isActive") || "false") === "true";

    await db.offer.updateMany({
      where: { id, shop: session.shop },
      data: { isActive },
    });

    return json({
      ok: true,
      message: isActive ? "Offer enabled." : "Offer disabled.",
    });
  }

  if (intent !== "save") {
    return json({ ok: false, message: "Unsupported action." }, { status: 400 });
  }

  const catalog = await loadCatalog(admin);
  const result = validateOfferInput(formData, catalog);

  if (result.errors) {
    return json(
      {
        ok: false,
        message: "Please fix the highlighted fields.",
        errors: result.errors,
      },
      { status: 400 }
    );
  }

  const values = result.values;

  await db.offer.upsert({
    where: { id: values.id },
    update: {
      ...values,
      shop: session.shop,
    },
    create: {
      ...values,
      shop: session.shop,
    },
  });

  return json({ ok: true, message: "Offer saved." });
};

const DEFAULT_FORM_STATE = {
  id: "",
  name: "",
  isActive: true,
  triggerType: "product",
  triggerTargetId: "",
  offerVariantId: "",
  headline: "",
  description: "",
  acceptLabel: "Add to order",
  declineLabel: "No thanks",
  priority: "100",
  discountType: "none",
  discountValue: "",
};

function createFormState(offer) {
  if (!offer) return DEFAULT_FORM_STATE;

  return {
    id: offer.id,
    name: offer.name,
    isActive: offer.isActive,
    triggerType: offer.triggerVariantId ? "variant" : "product",
    triggerTargetId: offer.triggerVariantId || offer.triggerProductId || "",
    offerVariantId: offer.offerVariantId,
    headline: offer.headline,
    description: offer.description,
    acceptLabel: offer.acceptLabel,
    declineLabel: offer.declineLabel || "No thanks",
    priority: String(offer.priority),
    discountType: offer.discountType || "none",
    discountValue:
      offer.discountValue == null ? "" : String(Number(offer.discountValue)),
  };
}

function statusTone(isActive) {
  return isActive ? "success" : "attention";
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString));
}

function OfferEditorModal({
  active,
  offer,
  onClose,
  saveFetcher,
  productOptions,
  variantOptions,
}) {
  const [formState, setFormState] = useState(DEFAULT_FORM_STATE);

  useEffect(() => {
    if (active) {
      setFormState(createFormState(offer));
    }
  }, [active, offer]);

  const errors = saveFetcher.data?.errors || {};
  const isSaving = saveFetcher.state !== "idle";

  const triggerOptions =
    formState.triggerType === "variant" ? variantOptions : productOptions;

  const updateField = (field) => (value) => {
    setFormState((current) => ({ ...current, [field]: value }));
  };

  const submit = () => {
    saveFetcher.submit(
      {
        intent: "save",
        ...formState,
        isActive: String(formState.isActive),
      },
      { method: "post" }
    );
  };

  return (
    <Modal
      open={active}
      onClose={onClose}
      title={offer ? "Edit upsell offer" : "Create upsell offer"}
      primaryAction={{
        content: offer ? "Save changes" : "Create offer",
        onAction: submit,
        loading: isSaving,
      }}
      secondaryActions={[{ content: "Cancel", onAction: onClose }]}
    >
      <Modal.Section>
        <BlockStack gap="400">
          {saveFetcher.data?.message && !saveFetcher.data?.ok ? (
            <Banner tone="critical">{saveFetcher.data.message}</Banner>
          ) : null}
          <FormLayout>
            <TextField
              label="Internal name"
              value={formState.name}
              onChange={updateField("name")}
              autoComplete="off"
              error={errors.name}
              helpText="Only visible inside your app."
            />
            <Checkbox
              label="Offer is active"
              checked={formState.isActive}
              onChange={(value) => updateField("isActive")(value)}
            />
            <Select
              label="Trigger when buyer purchased"
              options={[
                { label: "A product", value: "product" },
                { label: "A specific variant", value: "variant" },
              ]}
              value={formState.triggerType}
              onChange={(value) =>
                setFormState((current) => ({
                  ...current,
                  triggerType: value,
                  triggerTargetId: "",
                }))
              }
            />
            <Select
              label={
                formState.triggerType === "variant"
                  ? "Trigger variant"
                  : "Trigger product"
              }
              options={[
                {
                  label:
                    triggerOptions.length > 0
                      ? "Select an item"
                      : "No products available",
                  value: "",
                },
                ...triggerOptions,
              ]}
              value={formState.triggerTargetId}
              onChange={updateField("triggerTargetId")}
              error={errors.triggerTargetId}
              disabled={triggerOptions.length === 0}
            />
            <Select
              label="Offer this variant post-purchase"
              options={[
                {
                  label:
                    variantOptions.length > 0
                      ? "Select an offer variant"
                      : "No variants available",
                  value: "",
                },
                ...variantOptions,
              ]}
              value={formState.offerVariantId}
              onChange={updateField("offerVariantId")}
              error={errors.offerVariantId}
              disabled={variantOptions.length === 0}
            />
            <TextField
              label="Upsell headline"
              value={formState.headline}
              onChange={updateField("headline")}
              autoComplete="off"
              error={errors.headline}
            />
            <TextField
              label="Offer description"
              value={formState.description}
              onChange={updateField("description")}
              multiline={4}
              autoComplete="off"
              error={errors.description}
              helpText="Supports multiple lines. Each line becomes a bullet-style text block in the extension."
            />
            <InlineStack gap="400" align="start">
              <Box minWidth="240px">
                <TextField
                  label="Accept button text"
                  value={formState.acceptLabel}
                  onChange={updateField("acceptLabel")}
                  autoComplete="off"
                  error={errors.acceptLabel}
                />
              </Box>
              <Box minWidth="240px">
                <TextField
                  label="Decline text"
                  value={formState.declineLabel}
                  onChange={updateField("declineLabel")}
                  autoComplete="off"
                />
              </Box>
            </InlineStack>
            <InlineStack gap="400" align="start">
              <Box minWidth="200px">
                <TextField
                  label="Priority"
                  type="number"
                  value={formState.priority}
                  onChange={updateField("priority")}
                  autoComplete="off"
                  helpText="Lower numbers are shown first."
                />
              </Box>
              <Box minWidth="240px">
                <Select
                  label="Discount"
                  options={[
                    { label: "No discount", value: "none" },
                    { label: "Percentage off", value: "percentage" },
                    { label: "Fixed amount off", value: "fixed_amount" },
                  ]}
                  value={formState.discountType}
                  onChange={updateField("discountType")}
                />
              </Box>
              {formState.discountType !== "none" ? (
                <Box minWidth="160px">
                  <TextField
                    label="Discount value"
                    type="number"
                    value={formState.discountValue}
                    onChange={updateField("discountValue")}
                    autoComplete="off"
                    error={errors.discountValue}
                  />
                </Box>
              ) : null}
            </InlineStack>
          </FormLayout>
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}

export default function Index() {
  const {
    shop,
    offers,
    productOptions,
    variantOptions,
    activeAppUrl,
    publicAppUrlSource,
    hostValue,
    publicAppUrlEnv,
    shopifyAppUrlEnv,
    extensionAppUrl,
    databaseMode,
    databaseUrl,
    resolvedDatabasePath,
    usingDatabaseFallback,
    databaseReason,
    sessionTableExists,
    offerTableExists,
    bootstrapDatabasePath,
    sessionStorageReady,
    sessionStorageError,
    configFiles,
    shops,
    diagnostics,
  } = useLoaderData();

  const saveFetcher = useFetcher();
  const actionFetcher = useFetcher();
  const diagnosticsFetcher = useFetcher();
  const revalidator = useRevalidator();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState(null);
  const [flashMessage, setFlashMessage] = useState(null);

  const editingOffer = useMemo(
    () => offers.find((offer) => offer.id === editingOfferId) || null,
    [editingOfferId, offers]
  );

  const urlsMatch =
    Boolean(activeAppUrl) &&
    Boolean(extensionAppUrl) &&
    activeAppUrl === extensionAppUrl;
  const activeDiagnostics = diagnosticsFetcher.data || diagnostics;

  useEffect(() => {
    if (saveFetcher.state === "idle" && saveFetcher.data?.ok) {
      setFlashMessage(saveFetcher.data.message);
      setEditorOpen(false);
      setEditingOfferId(null);
      revalidator.revalidate();
    }
  }, [revalidator, saveFetcher.data, saveFetcher.state]);

  useEffect(() => {
    if (actionFetcher.state === "idle" && actionFetcher.data?.ok) {
      setFlashMessage(actionFetcher.data.message);
      revalidator.revalidate();
    }
  }, [actionFetcher.data, actionFetcher.state, revalidator]);

  const openCreate = () => {
    setEditingOfferId(null);
    setEditorOpen(true);
  };

  const openEdit = (id) => {
    setEditingOfferId(id);
    setEditorOpen(true);
  };

  const toggleOffer = (offer) => {
    actionFetcher.submit(
      {
        intent: "toggle",
        id: offer.id,
        isActive: String(!offer.isActive),
      },
      { method: "post" }
    );
  };

  const deleteOffer = (offer) => {
    actionFetcher.submit(
      { intent: "delete", id: offer.id },
      { method: "post" }
    );
  };

  return (
    <Page
      title="Manage post-purchase upsell offers"
      subtitle="Create, prioritize, and publish the offers your buyers see immediately after checkout."
      primaryAction={{
        content: "Create offer",
        onAction: openCreate,
        disabled: variantOptions.length === 0,
      }}
    >
      <ui-title-bar title="Post-purchase upsells" />
      <BlockStack gap="500">
        {flashMessage ? (
          <Banner tone="success" onDismiss={() => setFlashMessage(null)}>
            {flashMessage}
          </Banner>
        ) : null}

        {variantOptions.length === 0 ? (
          <Banner tone="warning">
            No products or variants are available yet for{" "}
            <strong>{shop}</strong>. Add products in Shopify first, then come
            back here to configure offers.
          </Banner>
        ) : null}

        <Layout>
          <Layout.Section>
            {offers.length === 0 ? (
              <Card>
                <EmptyState
                  heading="Create your first post-purchase offer"
                  action={{
                    content: "Create offer",
                    onAction: openCreate,
                    disabled: variantOptions.length === 0,
                  }}
                  image="https://cdn.shopify.com/shopifycloud/web/assets/v1/6e34d29fbf2d1470.svg"
                >
                  <p>
                    Choose which purchased products should trigger an upsell,
                    pick the offer variant, and customize the buyer-facing copy
                    without editing metafields manually.
                  </p>
                </EmptyState>
              </Card>
            ) : (
              <BlockStack gap="400">
                {offers.map((offer) => (
                  <Card key={offer.id}>
                    <BlockStack gap="300">
                      <InlineStack align="space-between" blockAlign="start">
                        <BlockStack gap="100">
                          <InlineStack gap="200">
                            <Text as="h2" variant="headingMd">
                              {offer.name}
                            </Text>
                            <Badge tone={statusTone(offer.isActive)}>
                              {offer.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </InlineStack>
                          <Text as="p" variant="bodyMd" tone="subdued">
                            Trigger: {offer.triggerLabel || "Not set"} | Offer:{" "}
                            {offer.offerLabel}
                          </Text>
                        </BlockStack>
                        <InlineStack gap="200">
                          <Button onClick={() => toggleOffer(offer)}>
                            {offer.isActive ? "Disable" : "Enable"}
                          </Button>
                          <Button onClick={() => openEdit(offer.id)}>
                            Edit
                          </Button>
                          <Button
                            destructive
                            onClick={() => deleteOffer(offer)}
                          >
                            Delete
                          </Button>
                        </InlineStack>
                      </InlineStack>

                      <Text as="p" variant="bodyMd">
                        {offer.headline}
                      </Text>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        {offer.description}
                      </Text>

                      <InlineStack gap="400" wrap>
                        <Badge>Priority {offer.priority}</Badge>
                        <Badge tone="info">
                          Accept CTA: {offer.acceptLabel}
                        </Badge>
                        <Badge tone="info">
                          Decline: {offer.declineLabel || "Default"}
                        </Badge>
                        <Badge tone="attention">
                          Discount:{" "}
                          {offer.discountType
                            ? `${offer.discountValue} ${
                                offer.discountType === "fixed_amount"
                                  ? "fixed amount"
                                  : "%"
                              }`
                            : "None"}
                        </Badge>
                        <Text as="span" variant="bodySm" tone="subdued">
                          Updated {formatDate(offer.updatedAt)}
                        </Text>
                      </InlineStack>
                    </BlockStack>
                  </Card>
                ))}
              </BlockStack>
            )}
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <BlockStack gap="400">
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    System status
                  </Text>
                  <List>
                    <List.Item>
                      Public URL sync: {urlsMatch ? "Healthy" : "Mismatch"}
                    </List.Item>
                    <List.Item>
                      Session storage:{" "}
                      {sessionStorageReady ? "Ready" : sessionStorageError}
                    </List.Item>
                    <List.Item>Database mode: {databaseMode}</List.Item>
                    <List.Item>
                      Offer table: {offerTableExists ? "Ready" : "Missing"}
                    </List.Item>
                    <List.Item>
                      Session table: {sessionTableExists ? "Ready" : "Missing"}
                    </List.Item>
                  </List>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Advanced diagnostics
                  </Text>
                  <List>
                    <List.Item>
                      Active public app URL: {activeAppUrl || "Not set"}
                    </List.Item>
                    <List.Item>
                      Resolved URL source: {publicAppUrlSource || "Not set"}
                    </List.Item>
                    <List.Item>
                      `PUBLIC_APP_URL`: {publicAppUrlEnv || "Not set"}
                    </List.Item>
                    <List.Item>
                      `SHOPIFY_APP_URL`: {shopifyAppUrlEnv || "Not set"}
                    </List.Item>
                    <List.Item>`HOST`: {hostValue || "Not set"}</List.Item>
                    <List.Item>
                      Synced extension APP_URL: {extensionAppUrl}
                    </List.Item>
                    <List.Item>
                      App/extension URL match: {urlsMatch ? "Yes" : "No"}
                    </List.Item>
                    <List.Item>Effective DB URL: {databaseUrl}</List.Item>
                    <List.Item>
                      Runtime DB path: {resolvedDatabasePath || "n/a"}
                    </List.Item>
                    <List.Item>
                      Bootstrap DB path: {bootstrapDatabasePath || "n/a"}
                    </List.Item>
                    <List.Item>
                      DB fallback: {usingDatabaseFallback ? "Yes" : "No"} (
                      {databaseReason})
                    </List.Item>
                  </List>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="200">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="h2" variant="headingMd">
                      Post-purchase runtime diagnostics
                    </Text>
                    <Button
                      onClick={() =>
                        diagnosticsFetcher.load("/api/post-purchase-debug")
                      }
                      loading={diagnosticsFetcher.state !== "idle"}
                    >
                      Refresh
                    </Button>
                  </InlineStack>
                  <List>
                    <List.Item>
                      Resolved public app URL:{" "}
                      {activeDiagnostics.publicUrl?.resolvedAppUrl || "Not set"}
                    </List.Item>
                    <List.Item>
                      URL source:{" "}
                      {activeDiagnostics.publicUrl?.source || "Unknown"}
                    </List.Item>
                    <List.Item>
                      Resolved extension APP_URL:{" "}
                      {activeDiagnostics.publicUrl?.extensionAppUrl ||
                        "Missing"}
                    </List.Item>
                    <List.Item>
                      App/extension URL match:{" "}
                      {activeDiagnostics.publicUrl?.extensionMatchesAppUrl
                        ? "Yes"
                        : "No"}
                    </List.Item>
                    <List.Item>
                      Last synced URL timestamp:{" "}
                      {activeDiagnostics.publicUrl?.lastSyncedAt || "Unknown"}
                    </List.Item>
                    <List.Item>
                      Last sync source:{" "}
                      {activeDiagnostics.publicUrl?.syncSource || "Unknown"}
                    </List.Item>
                    <List.Item>
                      Placeholder URL detected in active paths:{" "}
                      {activeDiagnostics.publicUrl?.placeholderScan
                        ?.hasForbiddenTokens
                        ? "Yes"
                        : "No"}
                    </List.Item>
                    <List.Item>
                      Extension module in dev preview:{" "}
                      {activeDiagnostics.extension?.modulePresent
                        ? "Yes"
                        : "No"}
                    </List.Item>
                    <List.Item>
                      Extension handle:{" "}
                      {activeDiagnostics.extension?.module?.handle || "Missing"}
                    </List.Item>
                    <List.Item>
                      Extension type:{" "}
                      {activeDiagnostics.extension?.module?.type || "Missing"}
                    </List.Item>
                    <List.Item>
                      Extension target:{" "}
                      {activeDiagnostics.extension?.module?.target || "(empty)"}
                    </List.Item>
                    <List.Item>
                      App selected for post-purchase:{" "}
                      {activeDiagnostics.selection?.isPostPurchaseAppInUse ==
                      null
                        ? "Unknown"
                        : activeDiagnostics.selection.isPostPurchaseAppInUse
                        ? "Yes"
                        : "No"}
                    </List.Item>
                    <List.Item>
                      Build contains current public URL:{" "}
                      {activeDiagnostics.build?.bundleContainsExpectedUrl
                        ? "Yes"
                        : "No"}
                    </List.Item>
                    <List.Item>
                      Build contains `ShouldRender` log:{" "}
                      {activeDiagnostics.build?.bundleContainsShouldRenderLog
                        ? "Yes"
                        : "No"}
                    </List.Item>
                    <List.Item>
                      Build contains `Render` log:{" "}
                      {activeDiagnostics.build?.bundleContainsRenderLog
                        ? "Yes"
                        : "No"}
                    </List.Item>
                    <List.Item>
                      Recent `/api/offer` hit:{" "}
                      {activeDiagnostics.recentRequests?.apiOffer?.seenAt ||
                        "Not seen"}
                    </List.Item>
                    <List.Item>
                      Recent `/api/sign-changeset` hit:{" "}
                      {activeDiagnostics.recentRequests?.apiSignChangeset
                        ?.seenAt || "Not seen"}
                    </List.Item>
                  </List>
                  {activeDiagnostics.publicUrl?.candidates?.length ? (
                    <Banner tone="info">
                      {activeDiagnostics.publicUrl.candidates
                        .map((candidate) => {
                          const status = candidate.normalized
                            ? `${candidate.key} -> ${candidate.normalized}`
                            : `${candidate.key} rejected (${
                                candidate.reason || "invalid"
                              })`;

                          return status;
                        })
                        .join(" | ")}
                    </Banner>
                  ) : null}
                  {activeDiagnostics.publicUrl?.placeholderScan
                    ?.hasForbiddenTokens ? (
                    <Banner tone="critical">
                      Forbidden placeholder URL tokens were found in:{" "}
                      {activeDiagnostics.publicUrl.placeholderScan.matches
                        .map(
                          (match) =>
                            `${match.file} (${match.tokens.join(", ")})`
                        )
                        .join(" | ")}
                    </Banner>
                  ) : null}
                  {activeDiagnostics.selection?.errors ? (
                    <Banner tone="warning">
                      Could not confirm post-purchase selection state:{" "}
                      {activeDiagnostics.selection.errors.join(", ")}
                    </Banner>
                  ) : null}
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Installed shops
                  </Text>
                  <List>
                    {shops.map((currentShop) => (
                      <List.Item key={currentShop}>{currentShop}</List.Item>
                    ))}
                  </List>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Post-purchase test checklist
                  </Text>
                  <Banner tone={urlsMatch ? "info" : "warning"}>
                    Local post-purchase tests must use the checkout link from
                    Shopify CLI Dev Console or an active checkout browser
                    preview, and the app plus extension must agree on one real
                    public URL. Orders also need to come from Online Store
                    checkout with a shipping address and a supported card
                    payment.
                  </Banner>
                  <List>
                    <List.Item>
                      Run `shopify app dev` and use the post-purchase checkout
                      link from the Dev Console.
                    </List.Item>
                    <List.Item>
                      Confirm “App selected for post-purchase” is `Yes` in the
                      diagnostics panel above.
                    </List.Item>
                    <List.Item>
                      Leave `PUBLIC_APP_URL` unset for normal Shopify CLI tunnel
                      dev. Set it only when you intentionally want a permanent
                      hostname.
                    </List.Item>
                    <List.Item>
                      If you use a permanent hostname, set
                      `PUBLIC_APP_URL=https://offers.mydomain.com`, run `npm run
                      sync:app-url`, then restart `shopify app dev`.
                    </List.Item>
                    <List.Item>
                      Refresh the diagnostics panel and confirm the resolved app
                      URL, extension APP_URL, and last synced URL timestamp all
                      match.
                    </List.Item>
                    <List.Item>
                      Use Online Store checkout with a shipping address and a
                      supported card payment method.
                    </List.Item>
                    <List.Item>
                      The payment must still be eligible for post-purchase.
                      Shopify requires a vaulted credit card and skips the
                      extension for wallets, gift-card payments, and other
                      unsupported methods.
                    </List.Item>
                    <List.Item>
                      Complete the order, refresh diagnostics, and confirm this
                      server saw `/api/offer`.
                    </List.Item>
                    <List.Item>
                      If `/api/offer` is still “Not seen”, Shopify skipped the
                      extension before our app was invoked.
                    </List.Item>
                    <List.Item>
                      `npm run dev:clean` clears the current dev preview.
                    </List.Item>
                    <List.Item>
                      `npm run dev:reset` reselects the app and store.
                    </List.Item>
                    <List.Item>
                      Config files:{" "}
                      {configFiles.map((config) => config.file).join(", ")}
                    </List.Item>
                  </List>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>

      <OfferEditorModal
        active={editorOpen}
        offer={editingOffer}
        onClose={() => {
          setEditorOpen(false);
          setEditingOfferId(null);
        }}
        saveFetcher={saveFetcher}
        productOptions={productOptions}
        variantOptions={variantOptions}
      />
    </Page>
  );
}
