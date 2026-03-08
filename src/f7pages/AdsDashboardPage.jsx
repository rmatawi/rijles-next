import { useEffect, useMemo, useState } from "react";
import {
  Page,
  Navbar,
  NavLeft,
  NavTitle,
  Block,
  Button,
  Card,
  CardHeader,
  CardContent,
  List,
  ListInput,
  Toggle,
  f7,
  useStore,
} from "framework7-react";
import NavHomeButton from "../components/NavHomeButton";
import { isSuperAdmin } from "../js/utils";
import { adsService } from "../services/adsService";
import { uploadAdImage } from "../utils/imageUpload";

const DEFAULT_FORM = {
  id: null,
  slot: "general",
  title: "",
  body: "",
  cta_label: "Bekijk aanbod",
  target_url: "",
  image_url: "",
  image_file_id: "",
  sponsor_name: "",
  is_active: true,
  priority: 0,
  starts_at: "",
  ends_at: "",
};

const SLOT_OPTIONS = [
  "general",
  "home",
  "qa",
  "verkeersborden",
  "videos",
  "maquette",
];

const toDatetimeLocalValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mi = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
};

const toIsoOrNull = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const AdsDashboardPage = () => {
  const authUser = useStore("authUser");
  const canManageAds = isSuperAdmin(authUser?.email);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [ads, setAds] = useState([]);
  const [eventCounts, setEventCounts] = useState({});
  const [form, setForm] = useState(DEFAULT_FORM);

  const IMAGEKIT_PUBLICKEY = process.env.VITE_REACT_APP_IMAGEKIT_PUBLICKEY;

  const submitLabel = useMemo(
    () => (form.id ? "Advertentie bijwerken" : "Advertentie opslaan"),
    [form.id],
  );

  const loadAds = async () => {
    if (!canManageAds) return;
    setLoading(true);
    const { data, error } = await adsService.getAllAds();
    setLoading(false);
    if (error) {
      f7.toast.show({ text: `Fout bij laden ads: ${error.message}` });
      return;
    }
    const list = data || [];
    setAds(list);

    const adIds = list.map((item) => item.id).filter(Boolean);
    const { data: counts, error: countsError } = await adsService.getAdEventCounts(adIds);
    if (countsError) {
      f7.toast.show({ text: `Fout bij laden statistieken: ${countsError.message}` });
      setEventCounts({});
      return;
    }
    setEventCounts(counts || {});
  };

  useEffect(() => {
    loadAds();
  }, [canManageAds]);

  const resetForm = () => {
    setForm(DEFAULT_FORM);
  };

  const onSelectAd = (ad) => {
    setForm({
      id: ad.id,
      slot: ad.slot || "general",
      title: ad.title || "",
      body: ad.body || "",
      cta_label: ad.cta_label || "Bekijk aanbod",
      target_url: ad.target_url || "",
      image_url: ad.image_url || "",
      image_file_id: ad.image_file_id || "",
      sponsor_name: ad.sponsor_name || "",
      is_active: !!ad.is_active,
      priority: Number.isFinite(ad.priority) ? ad.priority : 0,
      starts_at: toDatetimeLocalValue(ad.starts_at),
      ends_at: toDatetimeLocalValue(ad.ends_at),
    });
  };

  const onUploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!IMAGEKIT_PUBLICKEY) {
      f7.toast.show({ text: "VITE_REACT_APP_IMAGEKIT_PUBLICKEY ontbreekt." });
      return;
    }

    setUploading(true);
    try {
      const result = await uploadAdImage(file, IMAGEKIT_PUBLICKEY);
      if (result?.error?.message) {
        throw new Error(result.error.message);
      }
      if (!result?.url) {
        throw new Error("Geen URL ontvangen van ImageKit.");
      }
      setForm((prev) => ({
        ...prev,
        image_url: result.url,
        image_file_id: result.fileId || "",
      }));
      f7.toast.show({ text: "Afbeelding geupload." });
    } catch (error) {
      f7.toast.show({ text: `Upload mislukt: ${error.message}` });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async () => {
    if (!canManageAds) return;
    if (!form.title.trim()) {
      f7.toast.show({ text: "Titel is verplicht." });
      return;
    }

    const payload = {
      slot: form.slot || "general",
      title: form.title.trim(),
      body: form.body.trim() || null,
      cta_label: form.cta_label.trim() || "Bekijk aanbod",
      target_url: form.target_url.trim() || null,
      image_url: form.image_url.trim() || null,
      image_file_id: form.image_file_id.trim() || null,
      sponsor_name: form.sponsor_name.trim() || null,
      is_active: !!form.is_active,
      priority: Number(form.priority) || 0,
      starts_at: toIsoOrNull(form.starts_at),
      ends_at: toIsoOrNull(form.ends_at),
      created_by_email: authUser?.email || null,
    };

    setSaving(true);
    const result = form.id
      ? await adsService.updateAd(form.id, payload)
      : await adsService.createAd(payload);
    setSaving(false);

    if (result.error) {
      f7.toast.show({ text: `Opslaan mislukt: ${result.error.message}` });
      return;
    }

    f7.toast.show({ text: form.id ? "Advertentie bijgewerkt." : "Advertentie opgeslagen." });
    resetForm();
    await loadAds();
  };

  const onDelete = async (adId) => {
    if (!canManageAds || !adId) return;

    f7.dialog.confirm(
      "Weet je zeker dat je deze advertentie wilt verwijderen?",
      "Advertentie verwijderen",
      async () => {
        const { error } = await adsService.deleteAd(adId);
        if (error) {
          f7.toast.show({ text: `Verwijderen mislukt: ${error.message}` });
          return;
        }
        if (form.id === adId) {
          resetForm();
        }
        f7.toast.show({ text: "Advertentie verwijderd." });
        await loadAds();
      },
    );
  };

  if (!canManageAds) {
    return (
      <Page name="ads-dashboard" className="page-neu">
        <Navbar className="neu-navbar">
          <NavLeft>
            <NavHomeButton />
          </NavLeft>
          <NavTitle className="neu-text-primary">Advertentie Dashboard</NavTitle>
        </Navbar>
        <Block style={{ paddingTop: "24px" }}>
          Alleen toegankelijk voor `VITE_REACT_APP_OWNER`.
        </Block>
      </Page>
    );
  }

  return (
    <Page name="ads-dashboard" className="page-neu">
      <Navbar className="neu-navbar">
        <NavLeft>
          <NavHomeButton />
        </NavLeft>
        <NavTitle className="neu-text-primary">Advertentie Dashboard</NavTitle>
      </Navbar>

      <Block style={{ paddingBottom: "16px" }}>
        <Card className="neu-card" style={{ marginBottom: "12px" }}>
          <CardHeader>{form.id ? "Advertentie bewerken" : "Nieuwe advertentie"}</CardHeader>
          <CardContent>
            <List noHairlinesMd>
              <ListInput
                label="Sponsor naam"
                type="text"
                placeholder="Bijv. ABC Auto's"
                value={form.sponsor_name}
                onInput={(e) =>
                  setForm((prev) => ({ ...prev, sponsor_name: e.target.value }))
                }
              />
              <ListInput
                label="Titel"
                type="text"
                placeholder="Sterke headline"
                value={form.title}
                onInput={(e) =>
                  setForm((prev) => ({ ...prev, title: e.target.value }))
                }
              />
              <ListInput
                label="Beschrijving"
                type="textarea"
                placeholder="Korte advertentietekst"
                value={form.body}
                onInput={(e) =>
                  setForm((prev) => ({ ...prev, body: e.target.value }))
                }
              />
              <ListInput
                label="Slot"
                type="select"
                value={form.slot}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, slot: e.target.value }))
                }
              >
                {SLOT_OPTIONS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </ListInput>
              <ListInput
                label="CTA label"
                type="text"
                placeholder="Bijv. Bekijk aanbod"
                value={form.cta_label}
                onInput={(e) =>
                  setForm((prev) => ({ ...prev, cta_label: e.target.value }))
                }
              />
              <ListInput
                label="Doel URL"
                type="url"
                placeholder="https://..."
                value={form.target_url}
                onInput={(e) =>
                  setForm((prev) => ({ ...prev, target_url: e.target.value }))
                }
              />
              <ListInput
                label="Image URL"
                type="url"
                placeholder="Wordt automatisch gevuld na upload"
                value={form.image_url}
                onInput={(e) =>
                  setForm((prev) => ({ ...prev, image_url: e.target.value }))
                }
              />
              <ListInput
                label="Prioriteit"
                type="number"
                value={form.priority}
                onInput={(e) =>
                  setForm((prev) => ({ ...prev, priority: e.target.value }))
                }
              />
              <ListInput
                label="Starttijd"
                type="datetime-local"
                value={form.starts_at}
                onInput={(e) =>
                  setForm((prev) => ({ ...prev, starts_at: e.target.value }))
                }
              />
              <ListInput
                label="Eindtijd"
                type="datetime-local"
                value={form.ends_at}
                onInput={(e) =>
                  setForm((prev) => ({ ...prev, ends_at: e.target.value }))
                }
              />
            </List>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "12px",
              }}
            >
              <span>Actief</span>
              <Toggle
                checked={form.is_active}
                onToggleChange={(e) =>
                  setForm((prev) => ({ ...prev, is_active: e.target.checked }))
                }
              />
            </div>

            <div style={{ marginBottom: "14px" }}>
              <input type="file" accept="image/*" onChange={onUploadImage} />
              <div style={{ fontSize: "12px", opacity: 0.75, marginTop: "6px" }}>
                {uploading ? "Uploaden..." : "Upload naar ImageKit (map: /ads)."}
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <Button fill color="green" onClick={onSubmit} preloader loading={saving}>
                {submitLabel}
              </Button>
              <Button outline color="gray" onClick={resetForm}>
                Form resetten
              </Button>
              <Button outline onClick={loadAds} preloader loading={loading}>
                Verversen
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="neu-card">
          <CardHeader>Bestaande advertenties ({ads.length})</CardHeader>
          <CardContent>
            {ads.length === 0 ? (
              <div style={{ opacity: 0.8 }}>Nog geen advertenties gevonden.</div>
            ) : (
              ads.map((ad) => (
                <div
                  key={ad.id}
                  style={{
                    border: "1px solid rgba(0,0,0,0.08)",
                    borderRadius: "10px",
                    padding: "10px",
                    marginBottom: "8px",
                  }}
                >
                  {(() => {
                    const metrics = eventCounts[ad.id] || { impressions: 0, clicks: 0 };
                    const impressions = metrics.impressions || 0;
                    const clicks = metrics.clicks || 0;
                    const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : "0.00";
                    return (
                      <div style={{ fontSize: "12px", marginBottom: "6px", opacity: 0.85 }}>
                        impressies: {impressions} | klikken: {clicks} | CTR: {ctr}%
                      </div>
                    );
                  })()}
                  <div style={{ fontWeight: 700, marginBottom: "4px" }}>
                    {ad.title}
                  </div>
                  <div style={{ fontSize: "13px", marginBottom: "6px", opacity: 0.8 }}>
                    slot: {ad.slot || "general"} | actief: {ad.is_active ? "ja" : "nee"} |
                    prioriteit: {ad.priority || 0}
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <Button small outline onClick={() => onSelectAd(ad)}>
                      Bewerken
                    </Button>
                    <Button small color="red" outline onClick={() => onDelete(ad.id)}>
                      Verwijderen
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </Block>
    </Page>
  );
};

export default AdsDashboardPage;
