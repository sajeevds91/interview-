# Divide Careers

Candidates apply online, get an automatic score against what Divide needs, and the people you select book their own online interview.

## How it works

**For candidates** (`/apply/accountant`), the form has five short steps:
1. **About you**: name, email, phone, where they're based, plus optional LinkedIn and CV link.
2. **Qualifications & experience**: short multiple-choice questions.
3. **How you like to work**: role preference, languages, outlet visits, nice-to-haves, and one short question on reconciling a balance sheet account.
4. **The work at Divide**: every daily, weekly, monthly and technical task, each marked *Done it*, *Can do* or *Can't*.
5. **Availability & salary**: notice period (or immediate start) and expected monthly salary.

**For you** (`/admin`):
- Every candidate is scored out of 100 and sorted by fit: **Strong** (75+), **Possible** (60–74) or **Weak**.
- The screen lists red flags and strengths, plus a line-by-line breakdown of the score.
- You can add your own 1–5 rating, notes and a status.
- **Select & invite to interview** emails the candidate a booking link. They choose from your open times. Both of you then get a confirmation with a calendar invite (.ics) and a video-call link. Free Jitsi rooms are created automatically, or you can set your own Google Meet or Zoom link.
- **Optional auto-invite**: new applicants who score above a threshold you set and have no red flags get the booking link straight away.
- You can send rejection emails and cancel or rebook interviews.

### Scoring (accountant role)
| Area | Points |
|---|---|
| Divide task checklist (core tasks weighted ×3, *Can do* = half credit) | 30 |
| Hands-on experience (3–5 yrs best) | 13 |
| Qualification (part-qualified CA/CIMA best; AAT finalist boosted with experience) | 12 |
| Multi-company month-end close incl. inter-company | 10 |
| Industry (F&B best, then retail / multi-outlet / SME firm / franchise) | 10 |
| Close-date discipline | 5 |
| Systems: cloud package, chart of accounts set-up, Excel | 5 |
| Sinhala, written English, outlet visits | 5 |
| Availability | 5 |
| Salary vs budget (set in Settings) | 5 |
| Nice-to-haves | bonus up to +5 |

Red flags come from the role brief: fully qualified, under 3 years' experience, vague or late close dates, mostly data entry, desktop-only software, wants to supervise, leads with tax planning, several moves under a year, no outlet visits, salary well above budget, and can't do 3 or more core tasks.

To change tasks, questions or weights, edit `lib/roles/accountant.ts`. To add another role, copy that file and register it in `lib/roles/index.ts`. It then gets its own form at `/apply/<slug>`.

## Run locally
```bash
npm install
```
```bash
cp .env.example .env.local
```
Set `ADMIN_PASSWORD` and `SESSION_SECRET` in `.env.local`, then:
```bash
npm run dev
```
Open http://localhost:3000/apply/accountant to apply, and http://localhost:3000/admin to review.

Without a database URL, data is saved to `data/db.json`.

## Email
Fill in the `SMTP_*` and `MAIL_FROM` variables. For Gmail or Google Workspace, use `smtp.gmail.com`, port `465` and an [App Password](https://myaccount.google.com/apppasswords). Until SMTP is set up, emails are **logged on each candidate's page instead of sent**, so you can test the whole flow safely.

## Deploy (e.g. Vercel)
1. Import the repo.
2. Add a Postgres database (e.g. Neon) and set `DATABASE_URL`. The table is created automatically.
3. Set `ADMIN_PASSWORD`, `SESSION_SECRET`, `BASE_URL` (your public URL), the SMTP variables and `ADMIN_NOTIFY_EMAIL`.

## Checks
```bash
npm test
```
```bash
npm run typecheck
```
```bash
npm run build
```
