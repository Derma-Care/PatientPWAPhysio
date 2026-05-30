// S3UploadService.js
// One service handles all file uploads across all features

import { BASE_URL, IMAGE_BASE_URL } from "./api";






// ─────────────────────────────────────────────
// STEP 1: Get presigned upload URL from server
// ─────────────────────────────────────────────
async function getUploadUrl(fieldName, extension, fileSize) {
    const url = `${BASE_URL}/api/customer/s3/upload-url`
        + `?fieldName=${fieldName}`
        + `&extension=${extension}`
        + `&fileSize=${fileSize}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Failed to get upload URL");
    }

    return data; // { uploadUrl, fileKey, contentType }
}

// ─────────────────────────────────────────────
// STEP 2: Upload file directly to S3
// ─────────────────────────────────────────────
async function uploadToS3(uploadUrl, file, contentType) {
    const response = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
            "Content-Type": contentType  // must use exact contentType from Step 1
        },
        body: file  // raw file — no base64
    });

    if (!response.ok) {
        throw new Error("Failed to upload file to S3");
    }
}

// ─────────────────────────────────────────────
// STEP 3: Validate upload after S3 upload
// ─────────────────────────────────────────────
async function validateUpload(fileKey, fieldName) {
    const url = `${BASE_URL}/api/customer/s3/validate-upload`
        + `?fileKey=${fileKey}`
        + `&fieldName=${fieldName}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "File validation failed");
    }

    return data; // { valid, uploadedType, uploadedMime, uploadedSize }
}

// ─────────────────────────────────────────────
// MAIN FUNCTION: Call this from any component
// ─────────────────────────────────────────────
export async function uploadFile(fieldName, file) {

    // Get extension from file name
    const extension = file.name.split(".").pop().toLowerCase();

    console.log(`Uploading ${fieldName}: ${file.name} (${extension})`);

    // Step 1 — Get presigned URL
    const { uploadUrl, fileKey, contentType } =
        await getUploadUrl(fieldName, extension, file.size);

    console.log("Got uploadUrl:", uploadUrl);
    console.log("fileKey:", fileKey);
    console.log("contentType:", contentType);

    // Step 2 — Upload directly to S3
    await uploadToS3(uploadUrl, file, contentType);
    console.log("Uploaded to S3 successfully");

    // Step 3 — Validate upload
    const validation = await validateUpload(fileKey, fieldName);
    console.log("Validation:", validation);

    // Return fileKey to use in your API call
    return fileKey;
}