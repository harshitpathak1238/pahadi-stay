<?php

declare(strict_types=1);

const MAX_IMAGE_BYTES = 10485760;
const MAX_VIDEO_BYTES = 104857600;
const ALLOWED = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp',
    'video/mp4' => 'mp4',
    'video/quicktime' => 'mov',
];

$config = [];
foreach ([dirname(__DIR__) . '/media-config.php', __DIR__ . '/media-config.php'] as $configPath) {
    if (is_file($configPath)) {
        $loadedConfig = require $configPath;
        if (is_array($loadedConfig)) $config = $loadedConfig;
        break;
    }
}
$directory = rtrim((string) ($config['directory'] ?? getenv('HOSTINGER_IMAGE_UPLOAD_DIR')), '/');
$publicUrl = rtrim((string) ($config['publicUrl'] ?? getenv('HOSTINGER_IMAGE_UPLOAD_URL')), '/');
$secret = (string) ($config['secret'] ?? getenv('HOSTINGER_MEDIA_API_SECRET'));
header('Content-Type: application/json; charset=utf-8');

function respond(array $body, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_SLASHES);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') respond(['ok' => true]);
if ($directory === '' || $publicUrl === '' || $secret === '') respond(['error' => 'Media storage is not configured.'], 500);
$publicFile = (string) ($_GET['file'] ?? '');
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $publicFile !== '') {
    if (!preg_match('/^[a-f0-9-]+\.(jpg|png|webp|mp4|mov)$/', $publicFile)) respond(['error' => 'Invalid media file.'], 400);
    $filePath = $directory . '/' . $publicFile;
    if (!is_file($filePath)) respond(['error' => 'Media file not found.'], 404);
    header_remove('Content-Type');
    header('Content-Type: ' . (mime_content_type($filePath) ?: 'application/octet-stream'));
    header('Content-Length: ' . (string) filesize($filePath));
    header('Cache-Control: public, max-age=31536000, immutable');
    readfile($filePath);
    exit;
}
$providedSecret = (string) ($_SERVER['HTTP_X_MEDIA_SECRET'] ?? '');
if ($providedSecret === '' || !hash_equals($secret, $providedSecret)) respond(['error' => 'Unauthorized media request.'], 401);
if (!is_dir($directory) && !mkdir($directory, 0750, true)) respond(['error' => 'Media directory is not writable.'], 500);
if (!is_writable($directory)) respond(['error' => 'Media directory is not writable.'], 500);

function metadataPath(string $directory, string $filename): string { return $directory . '/.' . $filename . '.json'; }
function fileUrl(string $publicUrl, string $filename): string { return $publicUrl . '/media-api.php?file=' . rawurlencode($filename); }
function safeFilenameFromUrl(string $url, string $publicUrl): ?string {
    if (str_starts_with($url, $publicUrl . '/media-api.php?file=')) {
        $query = parse_url($url, PHP_URL_QUERY);
        parse_str(is_string($query) ? $query : '', $params);
        $url = $publicUrl . '/' . (string) ($params['file'] ?? '');
    }
    if (!str_starts_with($url, $publicUrl . '/')) return null;
    $filename = basename(parse_url($url, PHP_URL_PATH) ?: '');
    return preg_match('/^[a-f0-9-]+\.(jpg|png|webp|mp4|mov)$/', $filename) ? $filename : null;
}
function readMeta(string $directory, string $filename): array {
    $path = metadataPath($directory, $filename);
    if (!is_file($path)) return ['filename' => $filename, 'altText' => null];
    $data = json_decode((string) file_get_contents($path), true);
    return is_array($data) ? ['filename' => (string) ($data['filename'] ?? $filename), 'altText' => isset($data['altText']) ? (string) $data['altText'] : null] : ['filename' => $filename, 'altText' => null];
}
function writeMeta(string $directory, string $filename, string $displayName, ?string $altText): void {
    file_put_contents(metadataPath($directory, $filename), json_encode(['filename' => $displayName ?: $filename, 'altText' => $altText], JSON_UNESCAPED_SLASHES), LOCK_EX);
}
function asset(string $directory, string $publicUrl, string $filename): ?array {
    $path = $directory . '/' . $filename;
    if (!is_file($path)) return null;
    $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    $mime = array_search($extension, ALLOWED, true);
    if (!is_string($mime)) return null;
    $meta = readMeta($directory, $filename);
    $url = fileUrl($publicUrl, $filename);
    return ['id' => $url, 'filename' => $meta['filename'], 'url' => $url, 'mimeType' => $mime, 'size' => filesize($path), 'width' => null, 'height' => null, 'altText' => $meta['altText'], 'thumbnailUrl' => str_starts_with($mime, 'image/') ? $url : null, 'createdAt' => date(DATE_ATOM, filemtime($path)), 'usage' => []];
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $assets = [];
    foreach (scandir($directory) ?: [] as $filename) {
        if ($filename[0] === '.') continue;
        $item = asset($directory, $publicUrl, $filename);
        if ($item) $assets[] = $item;
    }
    $search = strtolower(trim((string) ($_GET['search'] ?? '')));
    $type = (string) ($_GET['type'] ?? 'all');
    $sort = (string) ($_GET['sort'] ?? 'newest');
    $assets = array_values(array_filter($assets, static function (array $item) use ($search, $type): bool {
        $matchesType = $type === 'all' || ($type === 'images' && str_starts_with($item['mimeType'], 'image/')) || ($type === 'videos' && str_starts_with($item['mimeType'], 'video/'));
        return $matchesType && ($search === '' || str_contains(strtolower($item['filename']), $search) || str_contains(strtolower($item['url']), $search));
    }));
    usort($assets, static function (array $a, array $b) use ($sort): int {
        return match ($sort) {
            'oldest' => strcmp($a['createdAt'], $b['createdAt']),
            'name' => strcasecmp($a['filename'], $b['filename']),
            'size' => $b['size'] <=> $a['size'],
            default => strcmp($b['createdAt'], $a['createdAt']),
        };
    });
    $page = max(1, (int) ($_GET['page'] ?? 1));
    $pageSize = 40;
    respond(['assets' => array_map(static fn (array $item): array => $item + ['kind' => str_starts_with($item['mimeType'], 'video/') ? 'VIDEO' : 'IMAGE'], array_slice($assets, ($page - 1) * $pageSize, $pageSize)), 'total' => count($assets), 'page' => $page, 'pageSize' => $pageSize, 'pages' => (int) ceil(count($assets) / $pageSize)]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $file = $_FILES['file'] ?? null;
    if (!is_array($file) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) respond(['error' => 'Choose an image or video file.'], 400);
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file((string) $file['tmp_name']);
    $extension = ALLOWED[$mime] ?? null;
    $limit = str_starts_with((string) $mime, 'video/') ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if ($extension === null) respond(['error' => 'Supported files: JPG, PNG, WebP, MP4, and MOV.'], 400);
    if ((int) $file['size'] > $limit) respond(['error' => 'The selected file is too large.'], 413);
    $filename = bin2hex(random_bytes(16)) . '.' . $extension;
    if (!move_uploaded_file((string) $file['tmp_name'], $directory . '/' . $filename)) respond(['error' => 'Could not save the uploaded file.'], 500);
    writeMeta($directory, $filename, basename((string) $file['name']), null);
    respond(['asset' => asset($directory, $publicUrl, $filename)], 201);
}

if ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
    $id = (string) ($_POST['id'] ?? '');
    $filename = safeFilenameFromUrl($id, $publicUrl);
    if ($filename === null) respond(['error' => 'Invalid media identifier.'], 400);
    $current = asset($directory, $publicUrl, $filename);
    if ($current === null) respond(['error' => 'Media file not found.'], 404);
    $replacement = $_FILES['file'] ?? null;
    if (is_array($replacement) && ($replacement['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_OK) {
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file((string) $replacement['tmp_name']);
        $extension = ALLOWED[$mime] ?? null;
        if ($extension === null || $extension !== pathinfo($filename, PATHINFO_EXTENSION)) respond(['error' => 'Replacement file type is invalid.'], 400);
        $limit = str_starts_with((string) $mime, 'video/') ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
        if ((int) $replacement['size'] > $limit || !move_uploaded_file((string) $replacement['tmp_name'], $directory . '/' . $filename)) respond(['error' => 'Could not replace the media file.'], 400);
    }
    writeMeta($directory, $filename, trim((string) ($_POST['filename'] ?? $current['filename'])), trim((string) ($_POST['altText'] ?? '')) ?: null);
    respond(['asset' => asset($directory, $publicUrl, $filename)]);
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $body = json_decode((string) file_get_contents('php://input'), true);
    $ids = is_array($body['ids'] ?? null) ? $body['ids'] : [];
    $deleted = [];
    foreach ($ids as $id) {
        $filename = is_string($id) ? safeFilenameFromUrl($id, $publicUrl) : null;
        if ($filename === null) continue;
        @unlink($directory . '/' . $filename);
        @unlink(metadataPath($directory, $filename));
        $deleted[] = $id;
    }
    respond(['deleted' => $deleted]);
}

respond(['error' => 'Method not allowed.'], 405);
