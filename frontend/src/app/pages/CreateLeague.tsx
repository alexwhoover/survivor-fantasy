import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Loader2, Plus, Trash2, Users } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { useAuth } from "../context/AuthContext";
import { createLeague, type TribeSetupItem, type ContestantSetupItem } from "../../api";

const STEP_LABELS = ["League & Season", "Tribe Setup", "Contestant Setup"];
const TRIBE_COLOURS = ["#3B82F6", "#EF4444", "#EAB308", "#22C55E", "#8B5CF6", "#F97316", "#EC4899", "#06B6D4"];

interface WizardTribe {
  key: string;
  name: string;
  colour: string;
}

interface WizardContestant {
  key: string;
  firstName: string;
  lastName: string;
}

interface ContestantForm {
  firstName: string;
  lastName: string;
}

const emptyContestantForm: ContestantForm = { firstName: "", lastName: "" };

let keyCounter = 0;
function nextKey(): string {
  keyCounter += 1;
  return `k${keyCounter}`;
}

export function CreateLeague() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Step 1 — League & Season
  const [leagueName, setLeagueName] = useState("");
  const [seasonName, setSeasonName] = useState("");

  // Step 2 — Tribes
  const [tribes, setTribes] = useState<WizardTribe[]>([]);
  const [newTribeName, setNewTribeName] = useState("");

  // Step 3 — Contestants
  const [contestantsByTribe, setContestantsByTribe] = useState<Record<string, WizardContestant[]>>({});
  const [addForms, setAddForms] = useState<Record<string, ContestantForm>>({});
  const [contestantsPerTribe, setContestantsPerTribe] = useState("2");

  if (!user) {
    return <div className="p-8 text-muted-foreground">Loading...</div>;
  }

  const step1Valid = leagueName.trim() !== "" && seasonName.trim() !== "";
  const step2Valid = tribes.length > 0 && tribes.every((t) => t.name.trim() !== "");

  const perTribe = Number(contestantsPerTribe) || 0;
  const totalContestants = Object.values(contestantsByTribe).reduce((sum, list) => sum + list.length, 0);
  const shortTribes = tribes.filter((t) => (contestantsByTribe[t.key]?.length ?? 0) < perTribe);
  const step3Valid = totalContestants > 0 && perTribe >= 1 && perTribe <= 10 && shortTribes.length === 0;

  const addTribe = () => {
    setError("");
    const name = newTribeName.trim();
    if (!name) { setError("Tribe name is required"); return; }
    if (tribes.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
      setError("Tribe names must be unique");
      return;
    }
    const key = nextKey();
    setTribes((prev) => [...prev, { key, name, colour: TRIBE_COLOURS[prev.length % TRIBE_COLOURS.length] }]);
    setContestantsByTribe((prev) => ({ ...prev, [key]: [] }));
    setAddForms((prev) => ({ ...prev, [key]: { ...emptyContestantForm } }));
    setNewTribeName("");
  };

  const updateTribe = (key: string, patch: Partial<Pick<WizardTribe, "name" | "colour">>) => {
    setTribes((prev) => prev.map((t) => (t.key === key ? { ...t, ...patch } : t)));
  };

  const removeTribe = (key: string) => {
    setTribes((prev) => prev.filter((t) => t.key !== key));
    setContestantsByTribe((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setAddForms((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const addContestant = (tribeKey: string) => {
    const form = addForms[tribeKey] ?? emptyContestantForm;
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("First and last name are required");
      return;
    }
    setError("");
    const contestant: WizardContestant = {
      key: nextKey(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
    };
    setContestantsByTribe((prev) => ({ ...prev, [tribeKey]: [...(prev[tribeKey] ?? []), contestant] }));
    setAddForms((prev) => ({ ...prev, [tribeKey]: { ...emptyContestantForm } }));
  };

  const removeContestant = (tribeKey: string, contestantKey: string) => {
    setContestantsByTribe((prev) => ({
      ...prev,
      [tribeKey]: (prev[tribeKey] ?? []).filter((c) => c.key !== contestantKey),
    }));
  };

  const goNext = () => {
    setError("");
    if (step === 1 && !step1Valid) { setError("Enter a league name and a season name"); return; }
    if (step === 2 && !step2Valid) { setError("Add at least one tribe with a name"); return; }
    setStep((s) => Math.min(3, s + 1));
  };

  const goBack = () => {
    setError("");
    setStep((s) => Math.max(1, s - 1));
  };

  const handleFinish = async () => {
    if (!step3Valid) {
      if (shortTribes.length > 0) {
        setError(`Each tribe needs at least ${perTribe} contestant(s) — "${shortTribes[0].name}" doesn't have enough yet`);
      } else {
        setError("Add at least one contestant");
      }
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const tribePayload: TribeSetupItem[] = tribes.map((t) => ({ name: t.name.trim(), colour: t.colour }));
      const contestantPayload: ContestantSetupItem[] = tribes.flatMap((t, index) =>
        (contestantsByTribe[t.key] ?? []).map((c) => ({
          firstName: c.firstName,
          lastName: c.lastName,
          imageUrl: null,
          tribeIndex: index,
        }))
      );
      const league = await createLeague(
        leagueName.trim(),
        seasonName.trim(),
        user.id,
        perTribe,
        tribePayload,
        contestantPayload
      );
      navigate(`/league/${league.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create league");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="mb-2">Create a League</h1>
        <p className="text-muted-foreground">
          Set up your league and its entire season in three steps — there's nothing left to configure afterward.
        </p>
      </div>

      {/* Stepper */}
      <div className="mb-8 flex items-center">
        {STEP_LABELS.map((label, i) => {
          const num = i + 1;
          const isActive = step === num;
          const isDone = step > num;
          return (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    isDone
                      ? "bg-primary text-primary-foreground"
                      : isActive
                      ? "border-2 border-primary text-primary"
                      : "border border-border text-muted-foreground"
                  }`}
                >
                  {isDone ? <Check className="h-4 w-4" /> : num}
                </div>
                <span className={`text-sm whitespace-nowrap ${isActive ? "font-semibold" : "text-muted-foreground"}`}>
                  {label}
                </span>
              </div>
              {num < STEP_LABELS.length && <div className="mx-4 h-px flex-1 bg-border" />}
            </div>
          );
        })}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>League & Season Information</CardTitle>
            <CardDescription>Name your league and the season it's playing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="league-name">League Name</Label>
              <Input
                id="league-name"
                placeholder="e.g., Office Survivor League"
                value={leagueName}
                onChange={(e) => setLeagueName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="season-name">Season Name</Label>
              <Input
                id="season-name"
                placeholder="e.g., Survivor 51"
                value={seasonName}
                onChange={(e) => setSeasonName(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Tribe Setup</CardTitle>
            <CardDescription>Define the starting tribes for this season.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {tribes.length === 0 && (
              <p className="text-sm text-muted-foreground">No tribes yet. Add at least one below.</p>
            )}
            {tribes.map((tribe) => (
              <div key={tribe.key} className="flex items-center gap-3">
                <input
                  type="color"
                  aria-label={`${tribe.name || "Tribe"} colour`}
                  className="h-9 w-12 rounded border border-input bg-background cursor-pointer"
                  value={tribe.colour}
                  onChange={(e) => updateTribe(tribe.key, { colour: e.target.value })}
                />
                <Input
                  className="max-w-xs"
                  value={tribe.name}
                  onChange={(e) => updateTribe(tribe.key, { name: e.target.value })}
                />
                <Badge variant="outline" className="gap-1 shrink-0">
                  <Users className="h-3 w-3" />
                  {contestantsByTribe[tribe.key]?.length ?? 0}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => removeTribe(tribe.key)}
                  aria-label={`Remove ${tribe.name || "tribe"}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <div className="flex items-center gap-3 pt-2 border-t">
              <Input
                className="max-w-xs"
                placeholder="New tribe name"
                value={newTribeName}
                onChange={(e) => setNewTribeName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); addTribe(); }
                }}
              />
              <Button size="sm" onClick={addTribe} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Add Tribe
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contestant Setup</CardTitle>
              <CardDescription>Add this season's cast and assign each contestant to a tribe.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <Label htmlFor="per-tribe" className="shrink-0">Contestants Per Tribe</Label>
                <Input
                  id="per-tribe"
                  type="number"
                  min={1}
                  max={10}
                  className="w-24"
                  value={contestantsPerTribe}
                  onChange={(e) => setContestantsPerTribe(e.target.value)}
                />
                <span className="text-sm text-muted-foreground">
                  How many contestants each member drafts from every tribe.
                </span>
              </div>
              {perTribe > 0 && shortTribes.length > 0 && (
                <p className="text-sm text-destructive">
                  Needs at least {perTribe} contestant{perTribe > 1 ? "s" : ""} per tribe — short:{" "}
                  {shortTribes.map((t) => t.name || "Unnamed").join(", ")}
                </p>
              )}
            </CardContent>
          </Card>

          {tribes.map((tribe) => {
            const list = contestantsByTribe[tribe.key] ?? [];
            const form = addForms[tribe.key] ?? emptyContestantForm;
            const setForm = (patch: Partial<ContestantForm>) =>
              setAddForms((prev) => ({ ...prev, [tribe.key]: { ...form, ...patch } }));

            return (
              <Card key={tribe.key}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: tribe.colour }} />
                    <CardTitle className="text-base">{tribe.name} Tribe</CardTitle>
                    <Badge variant="outline" className="text-xs">{list.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {list.length > 0 && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {list.map((c) => (
                        <div key={c.key} className="flex items-center justify-between px-3 py-2 rounded-lg border bg-card">
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{c.firstName} {c.lastName}</div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive shrink-0"
                            onClick={() => removeContestant(tribe.key, c.key)}
                            aria-label="Remove contestant"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 items-end">
                    <div className="space-y-1.5">
                      <Label>First Name</Label>
                      <Input value={form.firstName} onChange={(e) => setForm({ firstName: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Last Name</Label>
                      <Input value={form.lastName} onChange={(e) => setForm({ lastName: e.target.value })} />
                    </div>
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={() => addContestant(tribe.key)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); addContestant(tribe.key); }
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <div className="mt-6 flex items-center justify-between">
        {step > 1 ? (
          <Button variant="outline" onClick={goBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        ) : (
          <Link to="/leagues">
            <Button variant="outline">Cancel</Button>
          </Link>
        )}

        {step < 3 ? (
          <Button onClick={goNext} className="gap-2">
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleFinish} disabled={submitting} className="gap-2">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {submitting ? "Creating..." : "Finish & Create League"}
          </Button>
        )}
      </div>
    </div>
  );
}
