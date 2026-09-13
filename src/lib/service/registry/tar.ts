// Dependency-free ustar + gzip builder for skill packages. Browser File
// objects from a directory picker become a .tar.gz Blob matching what
// fuss/package/skillx accepts server-side.

export interface TarballResult {
  blob: Blob;
  fileCount: number;
  skipped: string[];
}

const BLOCK = 512;
const MAX_FILES = 1000;
const MAX_BYTES = 100 * 1024 * 1024;

const encoder = new TextEncoder();

interface Entry {
  path: string; // tar-root-relative, forward slashes
  file: File;
}

// Junk the backend also ignores: macOS metadata and VCS internals.
function isSkippable(path: string): boolean {
  const segments = path.split("/");
  const base = segments[segments.length - 1];
  return (
    base === ".DS_Store" || base.startsWith("._") || segments.includes(".git")
  );
}

function validatePath(path: string, seen: Set<string>) {
  if (!path) throw new Error("archive entry has an empty path");
  if (path.startsWith("/")) throw new Error(`absolute path "${path}"`);
  if (path.includes("\\")) throw new Error(`backslash in path "${path}"`);
  if (path.split("/").includes(".."))
    throw new Error(`parent reference in path "${path}"`);
  if (seen.has(path)) throw new Error(`duplicate path "${path}"`);
  seen.add(path);
}

function writeString(
  view: Uint8Array,
  offset: number,
  length: number,
  value: string,
) {
  const bytes = encoder.encode(value);
  if (bytes.length > length) throw new Error(`tar field overflow: "${value}"`);
  view.set(bytes, offset);
}

// Octal ASCII, leading zeros, NUL-terminated (length includes the NUL).
function writeOctal(
  view: Uint8Array,
  offset: number,
  length: number,
  value: number,
) {
  const digits = value.toString(8).padStart(length - 1, "0");
  if (digits.length > length - 1)
    throw new Error(`tar numeric field overflow: ${value}`);
  writeString(view, offset, length - 1, digits);
}

// Long names split into prefix[155] + name[100] at a slash (ustar).
function splitName(path: string): { name: string; prefix: string } {
  if (encoder.encode(path).length <= 100) return { name: path, prefix: "" };
  for (let i = path.length - 1; i >= 0; i--) {
    if (path[i] !== "/") continue;
    const prefix = path.slice(0, i);
    const name = path.slice(i + 1);
    if (
      encoder.encode(prefix).length <= 155 &&
      encoder.encode(name).length <= 100
    )
      return { name, prefix };
  }
  throw new Error(`path too long for ustar: "${path}"`);
}

function header(
  path: string,
  mode: number,
  size: number,
  mtime: number,
  typeflag: number,
): Uint8Array {
  const block = new Uint8Array(BLOCK);
  const { name, prefix } = splitName(path);
  writeString(block, 0, 100, name);
  writeOctal(block, 100, 8, mode);
  writeOctal(block, 108, 8, 0); // uid
  writeOctal(block, 116, 8, 0); // gid
  writeOctal(block, 124, 12, size);
  writeOctal(block, 136, 12, mtime);
  block[156] = typeflag;
  writeString(block, 257, 6, "ustar\0");
  writeString(block, 263, 2, "00");
  // uname/gname (265/297) and devmajor/devminor (329/337) stay zeroed.
  writeString(block, 345, 155, prefix);
  block.fill(0x20, 148, 156); // chksum field counts as spaces
  let sum = 0;
  for (const byte of block) sum += byte;
  writeOctal(block, 148, 7, sum); // 6 digits + NUL
  block[155] = 0x20; // + trailing space
  return block;
}

export async function createSkillTarball(
  files: File[],
): Promise<TarballResult> {
  const skipped: string[] = [];
  const entries: Entry[] = [];
  const seen = new Set<string>();

  for (const file of files) {
    // webkitRelativePath is "<picked folder>/<...>" — drop the folder itself.
    const relative = file.webkitRelativePath || file.name;
    const path = relative.split("/").slice(1).join("/");
    if (isSkippable(path)) {
      skipped.push(path);
      continue;
    }
    validatePath(path, seen);
    entries.push({ path, file });
  }

  if (entries.length > MAX_FILES)
    throw new Error(`too many files: ${entries.length} (max ${MAX_FILES})`);
  const totalBytes = entries.reduce((sum, entry) => sum + entry.file.size, 0);
  if (totalBytes > MAX_BYTES)
    throw new Error(
      `folder too large: ${(totalBytes / 1024 / 1024).toFixed(1)} MB (max 100 MB)`,
    );
  if (!entries.some((entry) => entry.path === "SKILL.md"))
    throw new Error("folder has no root SKILL.md");

  entries.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));

  const chunks: Uint8Array[] = [];
  const dirs = new Set<string>();
  const emitDir = (path: string, mtime: number) => {
    if (dirs.has(path)) return;
    dirs.add(path);
    chunks.push(header(`${path}/`, 0o755, 0, mtime, 53)); // '5'
  };

  for (const { path, file } of entries) {
    const mtime = Math.max(0, Math.floor(file.lastModified / 1000));
    const segments = path.split("/");
    for (let i = 1; i < segments.length; i++)
      emitDir(segments.slice(0, i).join("/"), mtime);
    const mode = path.endsWith(".sh") ? 0o755 : 0o644;
    chunks.push(header(path, mode, file.size, mtime, 48)); // '0'
    const content = new Uint8Array(await file.arrayBuffer());
    chunks.push(content);
    const remainder = content.length % BLOCK;
    if (remainder) chunks.push(new Uint8Array(BLOCK - remainder));
  }
  chunks.push(new Uint8Array(BLOCK * 2)); // end-of-archive marker

  const stream = new Blob(chunks as BlobPart[])
    .stream()
    .pipeThrough(new CompressionStream("gzip"));
  const gzipped = await new Response(stream).blob();
  return {
    blob: gzipped.slice(0, gzipped.size, "application/gzip"),
    fileCount: entries.length,
    skipped,
  };
}

// Minimal frontmatter parse: opening --- fence, `name:` on its own line.
export async function readSkillFrontmatterName(
  blob: Blob,
): Promise<string | null> {
  const text = await blob.slice(0, 8192).text();
  const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatter) return null;
  const name = frontmatter[1].match(
    /^name:[ \t]*["']?([^"'\n]+?)["']?[ \t]*$/m,
  );
  return name?.[1] ?? null;
}

export interface TarFile {
  path: string; // tar-root-relative, forward slashes
  size: number;
  data: Uint8Array;
}

const decoder = new TextDecoder();
const MAX_ENTRY_BYTES = 256 * 1024;

function readField(view: Uint8Array): string {
  const nul = view.indexOf(0);
  return decoder.decode(nul === -1 ? view : view.subarray(0, nul));
}

function readOctal(view: Uint8Array): number {
  const raw = readField(view).trim();
  return raw ? Number.parseInt(raw, 8) : 0;
}

// pax extended header records: "<len> <key>=<value>\n" — we only need `path`.
function readPaxPath(view: Uint8Array): string | null {
  let i = 0;
  while (i < view.length) {
    const space = view.indexOf(32, i);
    if (space === -1) break;
    const length = Number.parseInt(decoder.decode(view.subarray(i, space)), 10);
    if (!Number.isFinite(length) || length <= 0) break;
    const record = decoder.decode(view.subarray(space + 1, i + length - 1));
    if (record.startsWith("path=")) return record.slice(5);
    i += length;
  }
  return null;
}

// Inverse of createSkillTarball: .tar.gz Blob → regular-file entries. Also
// understands pax 'x' and GNU 'L' long-name headers (Go archive/tar emits
// those for >100-char paths), so CLI-published packages read back correctly.
export async function extractSkillTarball(blob: Blob): Promise<TarFile[]> {
  const stream = blob.stream().pipeThrough(new DecompressionStream("gzip"));
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  const files: TarFile[] = [];
  let offset = 0;
  let pendingPath: string | null = null;

  while (offset + BLOCK <= bytes.length) {
    const block = bytes.subarray(offset, offset + BLOCK);
    if (block.every((byte) => byte === 0)) break; // end-of-archive marker
    const name = readField(block.subarray(0, 100));
    const prefix = readField(block.subarray(345, 500));
    const size = readOctal(block.subarray(124, 136));
    const typeflag = block[156];
    offset += BLOCK;
    const data = bytes.subarray(offset, offset + size);
    if (typeflag === 120) {
      // 'x' — pax extended header for the next entry
      pendingPath = readPaxPath(data);
    } else if (typeflag === 76) {
      // 'L' — GNU long name for the next entry
      pendingPath = readField(data);
    } else {
      if (typeflag === 48 || typeflag === 0) {
        // '0' or legacy NUL — regular file
        const path = pendingPath ?? (prefix ? `${prefix}/${name}` : name);
        if (!isSkippable(path)) {
          files.push({ path, size, data: bytes.slice(offset, offset + size) });
        }
      }
      pendingPath = null;
    }
    offset += Math.ceil(size / BLOCK) * BLOCK;
  }
  return files;
}

// Decode an entry for display (capped at 256 KB); null when it isn't UTF-8
// text — a NUL byte is the cheap binary tell.
export function readEntryText(file: TarFile): {
  text: string;
  truncated: boolean;
} | null {
  const slice = file.data.subarray(0, MAX_ENTRY_BYTES);
  if (slice.includes(0)) return null;
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(slice);
    return { text, truncated: file.data.length > MAX_ENTRY_BYTES };
  } catch {
    return null;
  }
}
