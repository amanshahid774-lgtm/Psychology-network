# The Psychology Network: static website

A design preview of "Where Psychology Connects". Plain HTML, CSS and JavaScript. No build step, no backend, no paid services.

## What works
- Opportunity search, filters (type, field, location, pay), clear filters
- Save opportunities. Saves stay in this browser only (localStorage)
- Details windows for listings, projects and events
- Community category filter, mobile menu, light and dark mode
- All content is **demonstration data** and is labelled "Demo" on the page

## What does not exist (on purpose)
No registration, login, submissions, applications or messaging. The Join section says registration is not open.

## Files
- `index.html`: the page
- `css/styles.css`: styles
- `js/data.js`: sample listings (edit or replace)
- `js/config.js`: optional contact email
- `js/app.js`: search, filters, saving, dialogs
- `assets/`: logo, favicon, network diagram, self-hosted Inter font (SIL OFL licence included)

## Test locally
Open `index.html` in a browser. Or run `python3 -m http.server` in this folder and visit http://localhost:8000

## Deploy free
**Netlify:** log in, go to Add new site, Deploy manually, and drag this folder (or the ZIP) in.
**Cloudflare Pages:** Create project, Direct Upload, upload this folder.
**GitHub Pages:** push these files to a repository, then Settings, Pages, deploy from the main branch root.
`index.html` must stay at the top level of the upload.

## Before sharing publicly
1. Keep the "Demo" labels until you replace the sample data with real, checked listings.
2. Optional: put an email in `js/config.js` to show an "Email us" button in the Join section.
3. If you collect any visitor data in future, write a privacy policy first and get legal advice.
