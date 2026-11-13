# Soma 3D Education — Project and Chatbot Guide

## What this project is

Soma 3D Education is a browser-based learning website. Its central experience is a set of subject pages organized into expandable learning modules. Modules can include written study notes and embedded interactive 3D models. The site also has account registration and sign-in, profile settings, and a homepage that links to the subjects.

The project is primarily plain HTML, CSS, and JavaScript. It does not use a front-end framework or a build step. Bootstrap provides the main UI components, and Sketchfab embeds provide many of the 3D models.

## Fast answers for a website chatbot

- **What is Soma?** An educational website for exploring school subjects through organized lessons, study notes, and interactive 3D learning content.
- **Which subjects are available?** Biology, Chemistry, Computer Studies, Culture, Geography, and Physics.
- **Where do I start?** Open `index.html`, select a subject, then open a module on that subject's page.
- **How do I find a topic on a subject page?** Use the page's topic-finder search and move through highlighted matches.
- **Can I create an account?** The sign-in/sign-up page is `signinup.html`. The site includes registration, sign-in, account settings, and account deactivation flows.
- **Where are the actual lesson topics listed?** In the matching `3d*.html` page; the topic list below summarizes them.
- **Are all advertised items complete?** Do not assume that placeholder links or marketing copy represent a working feature. For example, several navigation/footer links use `#` rather than a destination.
- **Is this document a substitute for a lesson?** No. It is a map of the website and its code, not a complete subject textbook.

## Pages and learning content

| Page | Purpose | Learning modules |
|---|---|---|
| `index.html` | Homepage, subject navigation, site benefits, and premium-access entry point. | Links to all six subject pages. |
| `3dbio.html` | Biology learning modules. | Cell Biology; Genetics; Human Anatomy & Physiology; Ecology; Evolution; Cell Division: Mitosis; Microbiology; Plant Biology; Biochemistry; Developmental Biology; Biotechnology. |
| `3dchem.html` | Chemistry learning modules. | Introduction to Chemistry; Atomic Structure; Periodic Table; Chemical Bonding; Chemical Reactions; Stoichiometry; States of Matter; Solutions and Colloids; Acids, Bases, and Salts; Thermochemistry; Electrochemistry; Organic Chemistry; Biochemistry; Nuclear Chemistry; Analytical Chemistry; Environmental Chemistry; Industrial Chemistry. |
| `3dcomp.html` | Computer Studies learning modules. | Introduction to Computers; Computer Hardware; Computer Software; Operating Systems; Computer Memory; Computer Networks; Internet Basics; Computer Security; Computer Peripherals; Future Technologies. |
| `3dculture.html` | World cultures, traditions, and heritage modules. | Introduction to World Cultures; African Cultures & Traditions; Asian Traditions & Customs; European Heritage & Arts; North American Indigenous Cultures; South American Indigenous & Folk Cultures; Food Culture & Culinary Traditions; Traditional Clothing & Textiles; Ceremonial Artifacts & Ritual Objects; Folklore, Myths & Oral Traditions. |
| `3dgeo.html` | Geography learning modules. | Earth's Natural Systems; People and Their Environments; Human-Environment Interaction; Geographic Techniques; World Regions and Characteristics; Climate Systems. |
| `3dphysics.html` | Physics learning modules. | Classical Mechanics; Thermodynamics; Electromagnetism; Optics and Light; Modern Physics; Waves and Acoustics; Nuclear Physics; Fluid Mechanics; Solid State Physics; Astrophysics and Cosmology. |
| `signinup.html` | Registration and sign-in forms, plus premium-access information. | Account entry point, not a subject lesson. |

Subject pages use expandable accordion modules. Depending on the module, content may include explanatory text, a study-notes card, or an embedded model. A model's availability depends on the page's configured source; an empty placeholder is not itself a working model.

## Where to find each part of the project

### Pages and presentation

- `index.html` — homepage and primary navigation.
- `3dbio.html`, `3dchem.html`, `3dcomp.html`, `3dculture.html`, `3dgeo.html`, `3dphysics.html` — subject pages and their accordion markup.
- `signinup.html` — account forms and premium-access page.
- `assets/css/soma-modern.css` and `assets/css/soma-saas.css` — shared modern styling, responsive layouts, and account/site presentation. Some pages also contain page-specific inline CSS.
- `assets/images/` — logo, subject illustrations, favicon, and loading graphic.
- `assets/ads/` — image and video ad assets.
- `assets/3dmodels/Heart.glb` — a local 3D model asset.
- `assets/js/model-viewer.min.js` and `assets/js/draco/` — model-viewer and Draco decoder support files.

### Browser behavior

- `assets/js/soma-search.js` — finds text in the current page's learning content, highlights matches, opens containing accordion panels, and lets the visitor navigate results.
- `assets/js/soma-topic-notes.js` — adds topic-specific study notes and suggested model spaces to subject modules.
- `assets/js/soma-model-organizer.js` — formats model embeds, handles model placeholders, and adjusts nested accordion/model layouts.
- `assets/js/soma-auth-client.js` — connects the browser UI to account API routes, keeps the client session/settings state, and updates sign-in/profile controls.
- `assets/js/soma-account-settings.js` — builds the account settings interface and applies display-name, theme-color, and avatar settings.
- `assets/js/soma-ads.js` — controls the configured rotating image/video ad overlay. The script is included on the Biology page.

### Accounts, data, and deployment

There are **two backend implementations** in this repository. They share some API paths but are not interchangeable in every detail:

1. **Local Express server:** `server.js` serves the website and implements account APIs using MongoDB. Configure `MONGODB_URI` and `JWT_SECRET` in the local environment before starting it with `npm start`. The default port is 3000. If a page is opened directly as a `file:` URL, the browser account client points to `http://localhost:3000`.
2. **Cloudflare Pages Functions:** `functions/api/[[path]].js` implements the hosted API using Cloudflare D1 and optional R2 avatar storage. `wrangler.toml` configures the Pages output, D1 binding (`DB`), R2 binding (`AVATARS`), and the avatar asset base URL. `schema.sql` defines the D1 `users` table.

The account-related API paths include `/api/health`, `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`, `/api/account/settings`, and `/api/account/deactivate`. The Cloudflare function also handles `/api/account/avatar`. The exact storage fields and session handling differ between the MongoDB and D1 implementations.

`.github/workflows/static.yml` deploys the repository to **GitHub Pages** on pushes to `main`. Separately, `wrangler.toml` describes a **Cloudflare Pages** setup for the API and storage. Treat these as separate deployment configurations; the presence of both does not mean one workflow deploys both systems.

The `.env` file is local configuration and must not be copied into chatbot training data or shared. Use environment-variable names in documentation, never secret values.

## Running and maintaining the site

- Install the project dependencies with `npm install` when setting up a fresh local checkout.
- Run `npm start` to start the Express server. A working MongoDB connection and a non-placeholder JWT secret are required for its account APIs.
- Run `npm run check` to perform the repository's configured JavaScript syntax checks.
- Add or edit a lesson in the corresponding subject HTML file. Follow its existing accordion structure and keep accordion IDs unique.
- Add or change the note data in `assets/js/soma-topic-notes.js`. Each entry is keyed by a subject-page collapse-panel ID.
- Add a Sketchfab model with a `.model-container` element and `data-model-title` / `data-model-src` attributes. `MODEL_ORGANIZATION.md` contains example markup and the full model-authoring conventions.
- Keep account/database changes consistent with the backend being deployed. The local MongoDB server and Cloudflare D1 function have separate implementations and configuration.

## Chatbot guidance and known boundaries

- Answer navigation questions from the page map above and point users to the matching HTML page.
- Describe the site as an educational learning experience; do not promise certification, grading, live tutoring, collaborative tools, or complete coverage unless those features are independently verified.
- Treat module titles as the confirmed scope. Do not invent lesson details or claim every module contains a 3D model.
- The homepage advertises benefits and premium access, but this guide does not establish exact subscription prices, payment processing, or what premium access unlocks. Direct users to the live site for current account/premium details.
- A `#` link is a placeholder or in-page anchor, not evidence of a separate working page. The homepage/footer contain several such links.
- This guide describes the checked-in project structure. It cannot confirm that a production deployment, database, external embed, or account service is currently available.
- Do not ingest `.env`, secrets, credentials, database records, or user profile data into a training corpus.
