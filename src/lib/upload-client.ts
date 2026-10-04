"use client";

import { createClient } from "@/lib/supabase/client";
import { supabaseEnv } from "@/lib/env";

export async function uploadDocumentFile(options: {
  path: string;
  file: File;
  contentType: string;
  upsert: boolean;
  onProgress: (percent: number) => void;
}): Promise<void> {
  const env = supabaseEnv();
  if (!env) throw new Error("Supabase is not configured.");

  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Your session expired. Sign in again.");

  const objectPath = options.path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  const url = `${env.url}/storage/v1/object/documents/${objectPath}`;

  const body = new Blob([options.file], { type: options.contentType });

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", env.anonKey);
    xhr.setRequestHeader("Content-Type", options.contentType);
    xhr.setRequestHeader("x-upsert", String(options.upsert));
    xhr.setRequestHeader("cache-control", "max-age=3600");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        options.onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        options.onProgress(100);
        resolve();
        return;
      }
      reject(new Error(storageErrorMessage(xhr.status, xhr.responseText)));
    };
    xhr.onerror = () => {
      reject(new Error("Upload failed. Check your connection and try again."));
    };
    xhr.send(body);
  });
}

function storageErrorMessage(status: number, body: string): string {
  if (status === 401 || status === 403) {
    return "Your session expired. Sign in again.";
  }
  if (status === 413 || /too large|exceeded the maximum/i.test(body)) {
    return "This file is larger than 20 MB.";
  }
  if (status === 409 || /already exists|duplicate/i.test(body)) {
    return "This file was already uploaded. Try saving again.";
  }
  if (/mime|invalid/i.test(body)) {
    return "This file type is not supported.";
  }
  return "Upload failed. Please try again.";
}
