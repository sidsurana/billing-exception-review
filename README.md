# Billing Exception Review

Review synthetic billing discrepancies and owner-specific investigation steps.

**[Open the hosted demo](https://sid-cos-rentana-cash-20261021.vercel.app)** · [MIT license](LICENSE)

Independent demonstration by Siddarth Surana, with visual/workflow references to Rentana. Not affiliated with, endorsed by or official software from Rentana. The hosted demo may use private infrastructure that is deliberately absent from this repository.

## What this demo does

- **Input:** Synthetic usage/billing discrepancies, cutoff context and responsibility notes.
- **Output:** Exception diagnosis, owner-specific investigation steps and customer-outcome explanation.
- **Implementation and limits:** The current `feature.js` flow validates and exports the reviewed investigation draft. `engine.mjs` retains deterministic reconciliation helpers. No QuickBooks connection, invoice delivery, financial-record update or savings claim is implemented.

Included business records, people, transactions and evaluation examples are synthetic fixtures. Public website material retrieved at runtime is external source material, not a claim of customer access or affiliation.

## Run locally

Python 3 for a static preview and Node.js 22 or later for tests.

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

Open http://127.0.0.1:8080. Static serving does not execute `api/` server routes. 

Run the included checks:

```sh
npm test
```

Tests use fixtures and mocks; passing them does not mean live AI is configured. A static frontend can be inspected independently, but an AI-dependent primary action will fail without the backend described below. Node serverless API wrappers require a compatible hosting/runtime adapter, rather than a plain static HTTP server.

## Included AI components and private backend separation

**Included:** Frontend UI, synthetic examples, deterministic domain checks, readable-export helpers where used, consumer client/session/transport modules and consumer API wrappers. These consumer pieces do not constitute an operational model backend.

**Excluded:** the shared gateway server, provider API keys, gateway/session signing values, central task registrations and provider prompt executor, budget ledger/database, live session access, Vercel project IDs and deployment credentials. `.env.example` contains placeholders only. `.vercel/` and real environment files are ignored. The public hosted-demo URL above is safe to share; it is distinct from private deployment metadata.

The original hosted demo uses a separately operated authenticated AI gateway. That gateway, provider credentials, visitor signing secrets, task registrations, budget ledger and deployment links are excluded. The consumer transport in this copy points to `https://gateway.example.invalid`, a reserved nonworking address. It cannot access the author's shared model budget. AI actions fail closed without a compatible backend; do not treat prewritten examples or deterministic checks as live inference.

To self-host live AI, operate your own compatible authenticated backend, implement the fixed task contract and server-side input/output checks, apply your own usage limits, and replace the example gateway address in the consumer and mocked tests. Keep all credentials server-side. No public gateway access is supplied. A bring-your-own-key adapter is a possible later improvement and is not implemented here. `AI_GATEWAY_SECRET` is a backend protocol signing secret, not a provider API key.


For this demo, implement the input/output and validation behavior described above; keep its fixed task identity consistent between the consumer wrappers and your backend. In a self-hosted deployment, generate your own signing secrets and configure your own provider transport and accounting. Do not reuse the author's hosted-demo sessions or credentials. The frontend makes same-origin API requests; it contains no direct provider access key. Do not expose signing values in browser bundles. Deployment of this repository does not provision or enable AI.

## Data, review and limitations

Use synthetic, non-sensitive inputs. Local browser persistence is not a shared production database. Drafts require human review, and exact quotations prove a text match rather than factual truth or semantic entailment. No real customer integration or external business action is implied. Current hosted-service availability, quotas and model choice are controlled separately and are not guaranteed by this source release.

## License and third-party material

User-owned code is under [MIT](LICENSE), copyright 2026 Siddarth Surana. Bundled third-party copyright/license notices are preserved under `vendor/` where present and in embedded library headers; package dependencies retain their upstream licenses. MIT does not grant rights to company names, trademarks, website content or other third-party material. Company-inspired styling is an independent work sample, not an endorsement.
