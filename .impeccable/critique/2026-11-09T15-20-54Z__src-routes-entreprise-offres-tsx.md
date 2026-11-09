---
target: modale Publier une offre
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:C:\\Users\\Martha\\Documents\\Stage Manager app web\\src\\routes\\entreprise.offres.tsx"
target_fingerprint: "sha256:07a66999e1450955d543f985154ead6a72df389259b39b13ed70434917925b5f"
target_path: "C:\\Users\\Martha\\Documents\\Stage Manager app web\\src\\routes\\entreprise.offres.tsx"
timestamp: 2026-11-09T15-20-54Z
slug: src-routes-entreprise-offres-tsx
---
Method: dual-agent (A: design review · B: detector + browser)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | Publish/draft decision buried in last section, below the fold |
| 2 | Match System / Real World | 3 | State labels ("Publiée") used where an action is meant; Durée free text |
| 3 | User Control and Freedom | 1 | Esc/backdrop/Annuler discard everything, no confirmation |
| 4 | Consistency and Standards | 2 | Title says "Publier" but CTA defaults to "Enregistrer le brouillon"; Lieu prefilled vs placeholders elsewhere; chip styles differ |
| 5 | Error Prevention | 1 | Past deadlines accepted; free-text service; prefilled "Kinshasa, Gombe" can ship unnoticed |
| 6 | Recognition Rather Than Recall | 3 | Comma / newline syntax to remember |
| 7 | Flexibility and Efficiency | 2 | No <form>, Enter does not submit |
| 8 | Aesthetic and Minimalist Design | 3 | Calm, but 170px rail squeezes fields to 223px |
| 9 | Error Recovery | 2 | Fields stay grey on error, no aria-invalid, no focus to first error |
| 10 | Help and Documentation | 2 | Expert-system hint lacks how-to |
| **Total** | | **21/40** | Acceptable |

## Design Specificity Verdict
Half-authored: shell and section copy are on-system; the field layer is a stock CRUD form although it feeds the expert system.
Deterministic scan: CLI 0 findings on entreprise.offres.tsx + ui.tsx. Browser overlay: 0 in modal at 1280; 2 low stragglers at 375 (FormSection descriptions, lines 475 and 523).

## Priority Issues
- [P1] Publish decision buried and title contradicts CTA -> footer with "Enregistrer en brouillon" + "Publier l'offre", remove create-mode status radio. /impeccable layout
- [P1] Error and focus states weak/inaccessible (no red border, no aria-invalid/describedby, no focus to first error, no initial focus, no focus trap, no <form>). /impeccable harden
- [P1] Prefilled defaults (Lieu, Durée, Type, Niveau) -> placeholders, Lieu required. /impeccable clarify
- [P2] Unstructured inputs (service free text, comma skills) undermine the expert system -> service select, skill token input. /impeccable layout
- [P2] No data-loss protection, no preview. /impeccable harden

## Persona Red Flags
HR officer (first offer): CTA confusion, unnoticed prefilled Lieu, "Crédit" vs "Direction Crédit" breaks matching, backdrop misclick loses work.
Power user: no Enter-submit, lifecycle mixed with content in edit mode.
Mobile: 1432px of content in 517px, comma skills awkward, drag handle does nothing.

## Minor Observations
?nouveau=1 deep link does not open modal (validateSearch rejects number 1). Date accepts past dates. Red asterisks use error color. Header subtitle is boilerplate. Description textarea 90px too short. Focus ring drift (2px/20% vs 3px/15%). Native select chevrons off-style. Duplicate skill keys.

## Questions to Consider
Why is the form feeding the expert system the least structured screen? Should publishing be a two-step moment with a student preview? Does an 11-decision offer belong in a modal?
