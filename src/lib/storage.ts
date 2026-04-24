export async function uploadPublicObject(
  _key: string,
  _buffer: Buffer,
  _mimeType: string,
): Promise<string> {
  throw new Error('Stockage S3 non configuré');
}
