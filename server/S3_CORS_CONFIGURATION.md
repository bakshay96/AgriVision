# AWS S3 Bucket CORS Configuration

## Required CORS Settings for AgriVision Pro

To allow the frontend to display crop scan images from S3, you must configure CORS on your S3 bucket.

### Steps to Configure:

1. Go to AWS S3 Console
2. Select your bucket: `agrivision-uploads-042122908061-ap-south-1-an`
3. Click on the **Permissions** tab
4. Scroll to **Cross-origin resource sharing (CORS)**
5. Click **Edit** and paste the following configuration:

```json
[
  {
    "AllowedHeaders": [
      "*"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://your-production-domain.com"
    ],
    "ExposeHeaders": [
      "ETag",
      "x-amz-request-id"
    ],
    "MaxAgeSeconds": 3000
  }
]
```

### Important Notes:

- Replace `https://your-production-domain.com` with your actual production domain when deploying
- The `AllowedOrigins` should include all domains where your app runs
- This configuration allows the browser to load images from S3 without CORS errors
- The backend already generates presigned URLs for private buckets, but CORS is still needed for browser access

### Verification:

After configuring CORS, test by:
1. Uploading a crop scan image
2. Checking browser console for any CORS errors
3. Verifying the image displays in the UI

### Current Setup:

✅ Backend generates presigned URLs (1 hour expiry)
✅ Next.js configured to allow `*.amazonaws.com` images
✅ Helmet CSP headers allow S3 image sources
⚠️ S3 bucket CORS must be configured manually in AWS Console
