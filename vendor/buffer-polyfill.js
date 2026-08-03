/* Minimal global Buffer polyfill — isomorphic-git's browser build
   expects a global Buffer (Uint8Array-based). Load before
   vendor/isomorphic-git.min.js. */
(function () {
  'use strict';
  if (typeof globalThis.Buffer !== 'undefined') return;

  class Buf extends Uint8Array {
    static from(a, off, len) {
      if (typeof a === 'string') {
        if (off === 'hex') {
          const s = a.replace(/\s+/g, '');
          const out = new Buf(s.length / 2);
          for (let i = 0; i < out.length; i++) out[i] = parseInt(s.substr(i * 2, 2), 16);
          return out;
        }
        if (off === 'base64') {
          const bin = atob(a);
          const out = new Buf(bin.length);
          for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
          return out;
        }
        const bytes = new TextEncoder().encode(a);
        return new Buf(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      }
      if (a instanceof ArrayBuffer && typeof off === 'number') return new Buf(a, off, len);
      if (a instanceof ArrayBuffer) return new Buf(a);
      if (ArrayBuffer.isView(a)) {
        if (typeof off === 'number' && typeof len === 'number') return new Buf(a.buffer, a.byteOffset + off, len);
        return new Buf(a.buffer, a.byteOffset, a.byteLength);
      }
      if (Array.isArray(a)) return new Buf(a);
      if (a && a.type === 'Buffer' && Array.isArray(a.data)) return new Buf(a.data);
      throw new Error('unsupported Buffer.from input');
    }
    static alloc(size, fill) { const b = new Buf(size); if (fill !== undefined) b.fill(fill); return b; }
    static allocUnsafe(size) { return new Buf(size); }
    static byteLength(s) { return new TextEncoder().encode(s).length; }
    static isBuffer(x) { return x instanceof Buf; }
    static isEncoding() { return true; }
    static concat(list, totalLength) {
      const len = totalLength === undefined ? list.reduce((n, b) => n + (b ? b.length : 0), 0) : totalLength;
      const out = new Buf(len);
      let off = 0;
      for (const b of list) { if (!b) continue; out.set(b, off); off += b.length; }
      return out;
    }
    static compare(a, b) {
      const n = Math.min(a.length, b.length);
      for (let i = 0; i < n; i++) { if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1; }
      return a.length === b.length ? 0 : a.length < b.length ? -1 : 1;
    }
    equals(other) { return Buf.compare(this, other) === 0; }
    compare(other) { return Buf.compare(this, other); }
    copy(target, tStart, sStart, sEnd) {
      tStart = tStart || 0; sStart = sStart || 0; sEnd = sEnd === undefined ? this.length : sEnd;
      target.set(this.subarray(sStart, sEnd), tStart);
      return sEnd - sStart;
    }
    slice(begin, end) { return this.subarray(begin, end); }
    toString(enc, start, end) {
      const s = start || 0, e = end === undefined ? this.length : end;
      if (enc === 'hex') {
        let out = '';
        for (let i = s; i < e; i++) { const h = this[i].toString(16); out += h.length === 1 ? '0' + h : h; }
        return out;
      }
      if (enc === 'base64') {
        let bin = '';
        for (let i = s; i < e; i += 0x8000) bin += String.fromCharCode.apply(null, this.subarray(i, Math.min(i + 0x8000, e)));
        return btoa(bin);
      }
      return new TextDecoder('utf-8').decode(this.subarray(s, e));
    }
    // indexOf/includes intentionally NOT overridden: the native
    // Uint8Array versions handle both numeric and byte-array needles
    // (isomorphic-git relies on Buffer#indexOf(32) style calls).
    write(str, offset, length, encoding) {
      offset = offset || 0;
      const bytes = encoding === 'hex' ? Buf.from(str, 'hex') : new TextEncoder().encode(String(str));
      const max = this.length - offset;
      const n = (length === undefined || length === null) ? Math.min(bytes.length, max) : Math.min(length, max);
      for (let i = 0; i < n; i++) this[offset + i] = bytes[i];
      return n;
    }
    readUInt8(o) { return this[o]; }
    readUInt16BE(o) { return (this[o] << 8) | this[o + 1]; }
    readUInt16LE(o) { return this[o] | (this[o + 1] << 8); }
    readUInt32BE(o) { return (this[o] * 0x1000000) + ((this[o + 1] << 16) | (this[o + 2] << 8) | this[o + 3]); }
    readUInt32LE(o) { return ((this[o + 3] * 0x1000000) + ((this[o + 2] << 16) | (this[o + 1] << 8) | this[o])); }
    readInt32BE(o) { return (this[o] << 24) | (this[o + 1] << 16) | (this[o + 2] << 8) | this[o + 3]; }
    writeUInt8(v, o) { this[o] = v & 0xff; }
    writeUInt16BE(v, o) { this[o] = (v >>> 8) & 0xff; this[o + 1] = v & 0xff; }
    writeUInt16LE(v, o) { this[o] = v & 0xff; this[o + 1] = (v >>> 8) & 0xff; }
    writeUInt32BE(v, o) { this[o] = (v >>> 24) & 0xff; this[o + 1] = (v >>> 16) & 0xff; this[o + 2] = (v >>> 8) & 0xff; this[o + 3] = v & 0xff; }
    writeUInt32LE(v, o) { this[o] = v & 0xff; this[o + 1] = (v >>> 8) & 0xff; this[o + 2] = (v >>> 16) & 0xff; this[o + 3] = (v >>> 24) & 0xff; }
  }
  Buf.prototype._isPocketBuf = true;
  Object.defineProperty(globalThis, 'Buffer', { value: Buf, writable: true, configurable: true });
})();
