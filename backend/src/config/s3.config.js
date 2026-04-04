// S3 / Cloudflare R2 configuration
import { S3Client } from '@aws-sdk/client-s3';
import { config } from './env.config.js';

let s3Client;

export function getS3Client() {
  if (!s3Client) {
    s3Client = new S3Client({
      region: 'auto',
      endpoint: config.S3_ENDPOINT,
      credentials: {
        accessKeyId: config.S3_ACCESS_KEY,
        secretAccessKey: config.S3_SECRET_KEY,
      },
    });
  }
  return s3Client;
}

export const s3Config = {
  bucket: config.S3_BUCKET,
  endpoint: config.S3_ENDPOINT,
  publicUrl: config.S3_PUBLIC_URL,
  maxFileSize: 50 * 1024 * 1024, // 50 MB
};

export function isS3Configured() {
  return !!(
    config.S3_ENDPOINT &&
    config.S3_ACCESS_KEY &&
    config.S3_SECRET_KEY &&
    config.S3_BUCKET
  );
}
