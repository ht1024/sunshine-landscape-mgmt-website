# Contact form API (Resend + DynamoDB)

Receives `POST /contact` JSON, saves a row to DynamoDB `contact_submissions`, and emails **slandscapemgmt@gmail.com** via Resend from **noreply@sunshine-landscape.com**.

## Prerequisites

- AWS CLI + [SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- Resend API key (Sending access)
- Verified domain `sunshine-landscape.com` (already done)

## Deploy

```bash
cd infra/contact-api
npm install
sam build
sam deploy --guided \
  --parameter-overrides \
    ResendApiKey=re_xxxxxxxxx \
    ContactToEmail=slandscapemgmt@gmail.com \
    'ContactFromEmail=Sunshine Landscape <noreply@sunshine-landscape.com>'
```

Copy the stack output **ContactApiUrl**.

## Point the website at the API

Edit [`assets/js/contact-config.js`](../../assets/js/contact-config.js):

```js
window.CONTACT_API_URL = "https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/contact";
```

Commit, push to `main`, then invalidate CloudFront `/*`.

## View submissions

AWS Console → DynamoDB → table **contact_submissions** → Explore table items.

## Test

```bash
curl -X POST "$CONTACT_API_URL" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"you@example.com","phone":"2105550100","message":"Hello"}'
```

You should get `{ "ok": true, ... }`, a DynamoDB row, and an email in Gmail.
