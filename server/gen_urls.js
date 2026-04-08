const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
require('dotenv').config();

const kId = process.env.AWS_ACCESS_KEY_ID;
const sKey = process.env.AWS_SECRET_ACCESS_KEY;
const bucket = process.env.AWS_S3_BUCKET_NAME;

if (!kId || !sKey || !bucket) {
  console.error('Missing AWS credentials');
  process.exit(1);
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: kId,
    secretAccessKey: sKey,
  },
});

const keys = [
  'uploads/1775635503813-9d1e5c9e.png',
  'uploads/1775636274395-0a030672.png',
  'uploads/1775635766072-571354c8.png',
  'uploads/1775635753039-0331a88f.png',
  'uploads/1775635784988-4074172b.png',
  'uploads/1775637340582-662ec3bb.png',
  'uploads/1775635923744-6d220842.png',
  'uploads/1775635942492-85738315.png',
  'uploads/1775635957547-4705448b.png'
];

async function generate() {
  try {
    for (const key of keys) {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });
      const url = await getSignedUrl(s3Client, command, { expiresIn: 604800 });
      console.log(`URL_START|${key}|${url}|URL_END`);
    }
  } catch (err) {
    console.error('Error in generate:', err);
    process.exit(1);
  }
}

generate();
