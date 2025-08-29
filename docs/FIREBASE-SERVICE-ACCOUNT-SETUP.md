# Firebase Service Account Setup Guide

This guide explains how to configure Firebase service account credentials for the Crime Map application using environment variables, which is more secure and flexible than storing JSON files.

## 🔐 Security Benefits

Using Base64 encoded environment variables provides several security advantages:

- **No sensitive files committed to version control**
- **Easy rotation of credentials**
- **Platform-independent configuration**
- **Supports secret management systems**
- **Backward compatibility maintained**

## 📋 Quick Setup

### Step 1: Get Your Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** → **Service Accounts** tab
4. Click **Generate new private key**
5. Download the JSON file

### Step 2: Convert to Base64

Use the included conversion script:

```bash
# From project root
node scripts/convert-service-account-to-base64.js
```

This will output something like:
```
FIREBASE_SERVICE_ACCOUNT_BASE64=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...
```

### Step 3: Configure Environment Variables

Add to your environment configuration:

```env
# .env.local (development)
FIREBASE_SERVICE_ACCOUNT_BASE64=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...
FIREBASE_PROJECT_ID=your-project-id

# Production environments (Vercel, Docker, etc.)
FIREBASE_SERVICE_ACCOUNT_BASE64=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...
FIREBASE_PROJECT_ID=your-project-id
```

## 🛠 Platform-Specific Setup

### Vercel

1. Go to your project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add:
   - `FIREBASE_SERVICE_ACCOUNT_BASE64`
   - `FIREBASE_PROJECT_ID`

### Docker

```dockerfile
# Dockerfile
ENV FIREBASE_SERVICE_ACCOUNT_BASE64=your_base64_string
ENV FIREBASE_PROJECT_ID=your-project-id
```

Or use docker-compose:

```yaml
# docker-compose.yml
environment:
  - FIREBASE_SERVICE_ACCOUNT_BASE64=your_base64_string
  - FIREBASE_PROJECT_ID=your-project-id
```

### Local Development

```bash
# .env.local
FIREBASE_SERVICE_ACCOUNT_BASE64=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...
FIREBASE_PROJECT_ID=your-project-id
```

## 🔄 Migration from File-Based Setup

If you're currently using `service-account-key.json`:

1. **Keep your existing file** (for backward compatibility)
2. **Add the Base64 environment variable** as shown above
3. **The system will automatically prefer the environment variable**
4. **Remove the JSON file** when ready (optional)

## 📜 Technical Details

### How It Works

The application uses a utility function that:

1. **Checks for `FIREBASE_SERVICE_ACCOUNT_BASE64`** environment variable
2. **Decodes the Base64 string** to JSON
3. **Validates required fields** (project_id, private_key, client_email)
4. **Falls back to file-based approach** if environment variable not found
5. **Initializes Firebase Admin SDK** with the credentials

### File Structure

```
src/lib/config/
├── firebase-service-account.ts    # TypeScript utility (main app)
└── db/
    └── firebase.ts               # Main Firebase configuration

scripts/
├── firebase-service-account.js   # JavaScript utility (scripts)
├── convert-service-account-to-base64.js  # Conversion helper
└── update-firebase-scripts.js    # Migration helper
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | Base64 encoded service account JSON | No* |
| `FIREBASE_PROJECT_ID` | Firebase project ID | No* |

*Required if not using Application Default Credentials or file-based approach

## 🧪 Testing

### Test the Configuration

```bash
# Test Firebase connection
node scripts/test-firestore.js
```

### Verify Environment Variable

```bash
# Check if environment variable is set
echo $FIREBASE_SERVICE_ACCOUNT_BASE64

# Or in Node.js
node -e "console.log(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 ? '✅ Set' : '❌ Not set')"
```

## 🚨 Troubleshooting

### "Invalid service account JSON" Error

**Cause**: The Base64 string is malformed or corrupted
**Solution**:
1. Re-download your service account key from Firebase Console
2. Re-run the conversion script
3. Ensure no line breaks or special characters in the Base64 string

### "Application Default Credentials" Error

**Cause**: No credentials found in any method
**Solution**:
1. Set `FIREBASE_SERVICE_ACCOUNT_BASE64` environment variable
2. Or place `service-account-key.json` in project root
3. Or use Firebase CLI login for development

### "Permission denied" Error

**Cause**: Service account lacks required permissions
**Solution**:
1. Check that your service account has Firestore access
2. Verify the project ID matches your Firebase project
3. Ensure the service account key hasn't expired

## 🔒 Security Best Practices

1. **Never commit service account files** to version control
2. **Use environment variables** for production deployments
3. **Rotate keys regularly** (Firebase Console → Service Accounts)
4. **Limit service account permissions** to only what's needed
5. **Use different keys** for development and production
6. **Monitor service account usage** in Firebase Console

## 📚 Additional Resources

- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Service Account Keys](https://cloud.google.com/iam/docs/service-account-keys)
- [Environment Variables in Next.js](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

## 🎯 Migration Checklist

- [ ] Download service account key from Firebase Console
- [ ] Convert JSON to Base64 using provided script
- [ ] Add `FIREBASE_SERVICE_ACCOUNT_BASE64` to environment variables
- [ ] Add `FIREBASE_PROJECT_ID` to environment variables
- [ ] Test configuration with `test-firestore.js`
- [ ] Deploy to staging/production
- [ ] Remove `service-account-key.json` file (optional)
- [ ] Update team documentation

## 💡 Pro Tips

1. **Use a script** to automate credential rotation
2. **Test locally** before deploying to production
3. **Use different projects** for staging and production
4. **Document your setup** for team members
5. **Set up monitoring** for authentication failures

---

*This setup provides maximum security while maintaining backward compatibility with existing deployments.*
