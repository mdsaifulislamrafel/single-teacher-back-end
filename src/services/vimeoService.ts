import { Vimeo } from "vimeo";
import fs from "fs";

const client = new Vimeo(
  process.env.VIMEO_CLIENT_ID as string || 'a3169822ff3e9562d6619ce23781c0a9c6c51d8d',
  process.env.VIMEO_CLIENT_SECRET as string || '1LfaCHzyQXw1GtMppZG3KP3HTIAHSyX0JXCal8PvSC3fLJfR8CsYc3jjlaMzOLydgfKdJdikEDYWO5jEH01YvVIV2j7rjPs75M8PD5fuXKkH3QdceWSsQzmt8zEh/bWX',
  process.env.VIMEO_ACCESS_TOKEN || 'd04de225245cbc3c52133c461206efb7'
);

interface VimeoUploadResult {
  vimeoUrl: string;
  vimeoId: string;
  duration: number;
}

export const uploadToVimeo = async (
  filePath: string,
  title: string,
  description: string = ""
): Promise<VimeoUploadResult> => {
  return new Promise((resolve, reject) => {
    // ✅ ফাইল চেক
    if (!fs.existsSync(filePath)) {
      return reject(new Error(`File not found at path: ${filePath}`));
    }

    // ✅ ক্লায়েন্ট অথেনটিকেশন চেক
    client.request(
      {
        method: "GET",
        path: "/me",
      },
      (error) => {
        if (error) {
          console.error("Vimeo auth error:", error);
          return reject(new Error("Vimeo authentication failed"));
        }

        // ✅ ভিডিও আপলোড শুরু
        client.upload(
          filePath,
          {
            name: title,
            description: description,
            privacy: { view: "disable" },
          },
          (uri: string) => {
            const videoId = uri.split("/").pop();

            if (!videoId) {
              return reject(new Error("Invalid Vimeo URI response"));
            }

            // ✅ ভিডিও মেটাডাটা পাওয়া
            client.request(uri, (error, body) => {
              if (error) {
                console.error("Error getting video metadata:", error);
                return reject(new Error("Failed to get video metadata"));
              }

              resolve({
                vimeoUrl: `https://vimeo.com/${videoId}`,
                vimeoId: videoId,
                duration: body?.duration || 0,
              });
            });
          },
          (bytesUploaded: number, bytesTotal: number) => {
            const percent = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
            console.log(`Upload progress: ${percent}%`);
          },
          (error: unknown) => {
            console.error("Vimeo upload error:", error);
            reject(new Error((error as Error)?.message || "Vimeo upload failed"));
          }
        );
      }
    );
  });
};

export const deleteFromVimeo = async (videoId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    client.request(
      {
        method: "DELETE",
        path: `/videos/${videoId}`,
      },
      (error) => {
        if (error) {
          console.error("Error deleting from Vimeo:", error);
          return reject(new Error((error as Error)?.message || "Failed to delete video"));
        } else {
          resolve();
        }
      }
    );
  });
};
