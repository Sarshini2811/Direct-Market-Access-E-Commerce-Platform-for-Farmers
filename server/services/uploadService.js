// Abstraction so controllers don't care whether images end up on local disk
// (default, zero-config demo mode) or Cloudinary (when keys are configured).

function fileToUrl(req, file) {
  const driver = process.env.UPLOAD_DRIVER || 'local';

  if (driver === 'cloudinary') {
    // If UPLOAD_DRIVER=cloudinary, wire in the cloudinary SDK here using
    // CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET
    // and upload the buffer/path, returning the secure_url. Left as a clear
    // integration boundary since it requires real credentials.
    throw new Error(
      'UPLOAD_DRIVER=cloudinary is set but the Cloudinary integration has not been ' +
      'configured with real credentials. Set UPLOAD_DRIVER=local for the demo, or ' +
      'implement the cloudinary.uploader.upload call here with your keys.'
    );
  }

  // local mode: files already saved by multer to /server/uploads, serve via static route
  return `/uploads/${file.filename}`;
}

function filesToUrls(req, files = []) {
  return files.map((file) => fileToUrl(req, file));
}

module.exports = { fileToUrl, filesToUrls };
