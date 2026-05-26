import { archiveRawToGDrive } from "./lib/gdrive.js";

const result = await archiveRawToGDrive({
  check: "hwk-google-drive-archive",
  generated_at: new Date().toISOString(),
  note: "Small upload test for HWK raw data archive."
}, { namePrefix: "hwk-gdrive-check" });

console.log(JSON.stringify(result, null, 2));

if (!["uploaded", "disabled"].includes(result.status)) {
  process.exitCode = 1;
}
