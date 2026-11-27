import 'server-only';

export interface AppVersionInfo {
  latestVersion: string;
  minVersion: string;
  downloadUrl: string;
  releasePageUrl: string;
  releaseNotes: string;
  publishedAt: string | null;
}

const GITHUB_LATEST_RELEASE_API =
  'https://api.github.com/repos/stutosed/stutosed/releases/latest';
const DEFAULT_RELEASES_URL = 'https://github.com/stutosed/stutosed/releases';

let cachedRelease: { data: AppVersionInfo; expiresAt: number } | null = null;
const CACHE_TTL_MS = 3 * 60 * 1000;

function normalizeVersion(raw: string): string {
  return (raw || '').trim().replace(/^v/i, '');
}

export async function getLatestMobileAppVersion(): Promise<AppVersionInfo> {
  // Optional manual env overrides (lets admin push custom popup message or force update immediately)
  const envLatest = normalizeVersion(process.env.MOBILE_LATEST_VERSION || '');
  const envMin = normalizeVersion(process.env.MOBILE_MIN_VERSION || '');
  const envApkUrl = (process.env.MOBILE_APK_URL || '').trim();
  const envNotes = (process.env.MOBILE_RELEASE_NOTES || '').trim();

  if (cachedRelease && cachedRelease.expiresAt > Date.now() && !envLatest) {
    return cachedRelease.data;
  }

  let latestVersion = envLatest || '1.0.1';
  let downloadUrl = envApkUrl || DEFAULT_RELEASES_URL;
  let releasePageUrl = DEFAULT_RELEASES_URL;
  let releaseNotes =
    envNotes || 'New features, performance improvements, and bug fixes are ready to install.';
  let publishedAt: string | null = null;

  try {
    const res = await fetch(GITHUB_LATEST_RELEASE_API, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'stutosed-backend',
      },
    });
    if (res.ok) {
      const gh = (await res.json()) as {
        tag_name?: string;
        html_url?: string;
        body?: string;
        published_at?: string;
        assets?: Array<{ name?: string; browser_download_url?: string }>;
      };

      const ghVersion = normalizeVersion(gh.tag_name || '');
      if (ghVersion && !envLatest) {
        latestVersion = ghVersion;
      }
      if (gh.html_url) {
        releasePageUrl = gh.html_url;
      }
      const apkAsset = (gh.assets || []).find((a) =>
        (a.name || '').toLowerCase().endsWith('.apk')
      );
      if (apkAsset?.browser_download_url && !envApkUrl) {
        downloadUrl = apkAsset.browser_download_url;
      } else if (!envApkUrl && gh.html_url) {
        downloadUrl = gh.html_url;
      }
      if (gh.body && gh.body.trim() && !envNotes) {
        releaseNotes = gh.body.trim().slice(0, 600);
      }
      if (gh.published_at) {
        publishedAt = gh.published_at;
      }
    }
  } catch {
    // Keep safe defaults / env overrides if GitHub API is momentarily unreachable
  }

  const info: AppVersionInfo = {
    latestVersion,
    minVersion: envMin || '1.0.0',
    downloadUrl,
    releasePageUrl,
    releaseNotes,
    publishedAt,
  };

  if (!envLatest) {
    cachedRelease = { data: info, expiresAt: Date.now() + CACHE_TTL_MS };
  }

  return info;
}
