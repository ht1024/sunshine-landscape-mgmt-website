# Deploy the contact API (beginner steps)

You do **not** need to install SAM on your Mac. Use GitHub Actions (same way the site deploys to S3).

## Step 1 — Add your Resend key as a GitHub secret

1. Open the repo on GitHub:  
   https://github.com/ht1024/sunshine-landscape-mgmt-website
2. **Settings** → **Secrets and variables** → **Actions**
3. **New repository secret**
   - Name: `RESEND_API_KEY`
   - Value: paste your Resend API key (`re_...`)
4. Save

## Step 2 — Run the deploy workflow

1. **Actions** tab
2. Left sidebar: **Deploy Contact API**
3. **Run workflow** → **Run workflow** (branch `main`)
4. Wait until it turns green
5. Open the finished run → expand **Print API URL**
6. Copy the URL (looks like `https://xxxx.execute-api.us-east-1.amazonaws.com/contact`)

## Step 3 — Point the website at that URL

Tell Cursor the URL, or edit `assets/js/contact-config.js`:

```js
window.CONTACT_API_URL = "PASTE_URL_HERE";
```

Commit/push, then invalidate CloudFront `/*`.

## If the workflow fails with AccessDenied

The GitHub AWS role (`AWS_ROLE_ARN`) currently may only allow S3. It also needs permission to create:

- CloudFormation / SAM stacks
- Lambda
- API Gateway HTTP APIs
- DynamoDB
- IAM roles for Lambda (attach role policies)

In AWS IAM, open that role and add those permissions (or temporarily use a broader deploy policy), then re-run the workflow.

## After it’s live

- Form: `/contact-us` on your CloudFront site  
- Leads table: AWS Console → **DynamoDB** → `contact_submissions`  
- Email: `slandscapemgmt@gmail.com` via Resend  
