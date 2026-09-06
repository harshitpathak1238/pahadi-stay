# Media Library Request Contract

## Finding

The browser sends rename requests as `PATCH` with `FormData`, but PHP populates `$_POST` and `$_FILES` reliably for `POST` requests using the documented multipart upload format. The previous Vercel proxy forwarded a server-side multipart request, and the Hostinger endpoint received no `id`, producing `Choose an image or video file.`

Delete had the same proxy boundary risk because the browser used `DELETE` while the PHP handler was built around POST form parsing.

## Fix

- Rename without replacement file: Vercel sends a normal `POST` form body.
- Rename with replacement file: Vercel sends `POST multipart/form-data`.
- Delete: Vercel sends `POST` with `action=delete` and JSON-encoded IDs.
- Hostinger handles the delete action and removes the media file plus its metadata sidecar.

## Deployment checklist

1. Deploy the Next.js changes to Vercel.
2. Upload the updated `hostinger-media-api/media-api.php` to the Hostinger API location.
3. Confirm the Hostinger `media-config.php` values and shared secret.
4. Open Media Library, rename one unused file, verify the new filename, then delete that same file.

## References

- MDN `Request.formData()`: https://developer.mozilla.org/en-US/docs/Web/API/Request/formData
- PHP POST uploads: https://www.php.net/manual/en/features.file-upload.post-method.php