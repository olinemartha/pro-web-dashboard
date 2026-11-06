import { describe, expect, it } from "vitest";
import { canApply, confirmOffer, profileCompletion, type Application } from "./rules";
import { demoProfile } from "./mock-data";

const apps: Application[] = [
  { id: "a1", offerId: "o1", date: "2026-10-01", status: "acceptee" },
  { id: "a2", offerId: "o2", date: "2026-10-02", status: "acceptee" },
  { id: "a3", offerId: "o3", date: "2026-10-03", status: "examen" },
];

describe("règles étudiant", () => {
  it("un étudiant ne peut confirmer qu'une seule entreprise", () => {
    const r = confirmOffer(apps, "a1");
    expect(r.filter((a) => a.status === "confirmee").map((a) => a.id)).toEqual(["a1"]);
    expect(r.find((a) => a.id === "a2")?.status).toBe("declinee");
    expect(r.find((a) => a.id === "a3")?.status).toBe("examen");
    expect(confirmOffer(r, "a2")).toBe(r);
  });

  it("refuse une candidature si le CV manque", () => {
    expect(canApply({ ...demoProfile, cv: null }, [], "o9").ok).toBe(false);
    expect(canApply(demoProfile, [], "o9").ok).toBe(true);
  });

  it("refuse une deuxième candidature à la même offre", () => {
    expect(canApply(demoProfile, apps, "o1").ok).toBe(false);
  });

  it("calcule la complétion sur les champs renseignés", () => {
    expect(profileCompletion({ ...demoProfile, photo: "x", projets: "" })).toBe(100);
    expect(profileCompletion({ ...demoProfile, photo: null })).toBe(93);
  });
});
