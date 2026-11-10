import 'server-only';
import { createClient } from '@libsql/client';

const url =
  process.env.TURSO_DATABASE_URL ||
  'libsql://stutosed-7atva.aws-ap-south-1.turso.io';

const authToken =
  process.env.TURSO_AUTH_TOKEN ||
  'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTQzMjEzODIsImlkIjoiMDFhMWM1YjItNTIwMS03YWFhLTljMWUtMjdkM2JkZDlhMmQ0Iiwia2lkIjoidFFaOUFwbVE3bW9XZFdHLV9rVkNnRmlIMGFwcXRiNjl2Sk52QjZ2WHJUTSIsInJpZCI6Ijg1MWIxNGJkLWNjZGEtNDI0Zi1hMWExLTZmZTBkYWM3MmMxNSJ9.uYJDAQyC-cMoQG7LU7xd8opGzYBEkF6H_FftdgZSmHaww_l9pmdvyhGS2NsGlS7RJYfbQ87RHIDF8av1l9dkCA';

export const turso = createClient({
  url,
  authToken,
});
